using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Clausio.Legal.Core.Dtos;
using Clausio.Legal.Core.Entities;
using Clausio.Legal.Core.Settings;
using Clausio.Legal.Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Clausio.Legal.Service;

public interface IAuthService
{
    Task<object> RegisterAsync(RegisterDto dto, string? userAgent = null, string? ipAddress = null, CancellationToken cancellationToken = default);
    Task<AuthResponseDto> LoginAsync(LoginDto dto, string? userAgent = null, string? ipAddress = null, CancellationToken cancellationToken = default);
    Task<AuthResponseDto> RefreshTokenAsync(string refreshToken, string? userAgent = null, string? ipAddress = null, CancellationToken cancellationToken = default);
    Task<bool> VerifyEmailOtpAsync(VerifyOtpDto dto, CancellationToken cancellationToken = default);
    Task<object> VerifyEmailAsync(string email, string otp, string userAgent, string ipAddress, CancellationToken ct = default);
    Task ResendOtpAsync(string email, CancellationToken ct = default);
    Task<User?> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto, CancellationToken cancellationToken = default);
    string GenerateToken(User user, string? userAgent = null, string? ipAddress = null);
}

public class AuthService(ClausioDbContext db, IOptions<JwtSettings> jwtOptions, IEmailService emailService) : IAuthService
{
    private readonly PasswordHasher<User> _passwordHasher = new();
    private readonly JwtSettings _jwt = jwtOptions.Value;

    public static string ComputeDeviceFingerprint(string? userAgent, string? ipAddress)
    {
        using var sha256 = SHA256.Create();
        var uaClean = string.IsNullOrWhiteSpace(userAgent) ? "unknown-agent" : userAgent.Trim();
        var ipClean = string.IsNullOrWhiteSpace(ipAddress) || ipAddress == "::1" || ipAddress == "127.0.0.1" ? "localhost" : ipAddress.Trim();
        var raw = $"{uaClean}|{ipClean}";
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(raw));
        return Convert.ToBase64String(bytes);
    }

    public async Task<object> RegisterAsync(RegisterDto dto, string? userAgent = null, string? ipAddress = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Email))
            throw new InvalidOperationException("Email is required.");

        // 🔒 Password Complexity Enforcement
        ValidatePasswordComplexity(dto.Password);

        if (await db.Users.AnyAsync(u => u.Email == dto.Email, cancellationToken))
            throw new InvalidOperationException("A user with this email already exists.");

        // Generate a 6-digit email verification OTP (valid 5 minutes).
        var otp = new Random().Next(100000, 999999).ToString();

        var user = new User
        {
            FirstName = dto.FirstName ?? string.Empty,
            LastName  = dto.LastName  ?? string.Empty,
            Email     = dto.Email.Trim().ToLowerInvariant(),
            Role      = dto.Role ?? "Lawyer",
            Phone     = dto.Phone,
            IsEmailVerified = false,
            EmailOtp = otp,
            EmailOtpExpiry = DateTime.UtcNow.AddMinutes(5),
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password!);

        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);

        // CREDITS GIVEN AFTER EMAIL VERIFICATION — NOT on registration.
        // var wallet = new Clausio.Legal.Core.Entities.Wallet { UserId = user.Id, Balance = WalletService.FREE_CREDITS };
        // db.Wallets.Add(wallet);
        // db.CreditTransactions.Add(new Clausio.Legal.Core.Entities.CreditTransaction { WalletId = wallet.Id, Amount = WalletService.FREE_CREDITS, Type = "plan_signup", Description = "Welcome to Clausio! 50 free AI credits." });
        // await db.SaveChangesAsync(cancellationToken);

        // Email the OTP.
        await emailService.SendEmailAsync(
            user.Email,
            $"{user.FirstName} {user.LastName}".Trim(),
            "Your Clausio verification code",
            BuildOtpEmailHtml(otp),
            cancellationToken);

        // Signal the frontend to show the OTP screen — no JWT until verified.
        return new
        {
            requiresVerification = true,
            email = user.Email,
            message = "OTP sent to your email."
        };
    }

    public async Task<object> VerifyEmailAsync(string email, string otp, string userAgent, string ipAddress, CancellationToken ct = default)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email.Trim().ToLowerInvariant(), ct)
            ?? throw new InvalidOperationException("User not found.");

        if (user.IsEmailVerified)
            throw new InvalidOperationException("Email already verified.");

        if (string.IsNullOrEmpty(user.EmailOtp) || user.EmailOtp != otp.Trim())
            throw new InvalidOperationException("Invalid OTP. Please try again.");

        if (user.EmailOtpExpiry == null || user.EmailOtpExpiry < DateTime.UtcNow)
            throw new InvalidOperationException("OTP has expired. Please request a new one.");

        // Mark verified
        user.IsEmailVerified = true;
        user.EmailOtp = null;
        user.EmailOtpExpiry = null;

        // Grant the 50 free credits now — but only once (guard against a second wallet).
        var existingWallet = await db.Wallets.FirstOrDefaultAsync(w => w.UserId == user.Id, ct);
        if (existingWallet == null)
        {
            var wallet = new Wallet
            {
                UserId = user.Id,
                Balance = WalletService.FREE_CREDITS
            };
            db.Wallets.Add(wallet);

            db.CreditTransactions.Add(
                new CreditTransaction
                {
                    WalletId = wallet.Id,
                    Amount = WalletService.FREE_CREDITS,
                    Type = "plan_signup",
                    Description = "Welcome to Clausio! 50 free AI credits.",
                });
        }

        await db.SaveChangesAsync(ct);

        // Issue the JWT now.
        return await BuildAuthResponseAsync(user, userAgent, ipAddress, ct);
    }

    public async Task ResendOtpAsync(string email, CancellationToken ct = default)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email.Trim().ToLowerInvariant(), ct)
            ?? throw new InvalidOperationException("User not found.");

        if (user.IsEmailVerified)
            throw new InvalidOperationException("Email already verified.");

        var otp = new Random().Next(100000, 999999).ToString();

        user.EmailOtp = otp;
        user.EmailOtpExpiry = DateTime.UtcNow.AddMinutes(5);
        await db.SaveChangesAsync(ct);

        await emailService.SendEmailAsync(
            user.Email,
            $"{user.FirstName} {user.LastName}".Trim(),
            "Your new Clausio verification code",
            BuildOtpEmailHtml(otp, isResend: true),
            ct);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto, string? userAgent = null, string? ipAddress = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            throw new InvalidOperationException("Email and password are required.");

        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken)
            ?? throw new InvalidOperationException("Invalid email or password.");

        if (!user.IsActive)
            throw new InvalidOperationException("This account has been deactivated. Contact your administrator.");

        // ⏱️ Account Lockout Check (15 min lockout after 5 failed attempts)
        if (user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTime.UtcNow)
        {
            var remaining = Math.Ceiling((user.LockoutEnd.Value - DateTime.UtcNow).TotalMinutes);
            throw new InvalidOperationException($"Account is temporarily locked due to repeated failed login attempts. Please try again in {remaining} minute(s).");
        }

        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash ?? string.Empty, dto.Password);
        if (result == PasswordVerificationResult.Failed)
        {
            // Track failed attempts
            user.FailedLoginAttempts++;
            if (user.FailedLoginAttempts >= 5)
            {
                user.LockoutEnd = DateTime.UtcNow.AddMinutes(15);
                user.FailedLoginAttempts = 0; // Reset counter for next cycle
            }
            await db.SaveChangesAsync(cancellationToken);

            throw new InvalidOperationException("Invalid email or password.");
        }

        // Reset failed login attempts on successful login
        if (user.FailedLoginAttempts > 0 || user.LockoutEnd.HasValue)
        {
            user.FailedLoginAttempts = 0;
            user.LockoutEnd = null;
            await db.SaveChangesAsync(cancellationToken);
        }

        // 📧 Block login until the email is verified. Auto-send a fresh OTP and
        // signal the frontend with a machine-readable prefix.
        if (!user.IsEmailVerified)
        {
            var otp = new Random().Next(100000, 999999).ToString();
            user.EmailOtp = otp;
            user.EmailOtpExpiry = DateTime.UtcNow.AddMinutes(5);
            await db.SaveChangesAsync(cancellationToken);

            await emailService.SendEmailAsync(
                user.Email,
                user.FirstName ?? "",
                "Your Clausio verification code",
                BuildOtpEmailHtml(otp),
                cancellationToken);

            throw new InvalidOperationException("EMAIL_NOT_VERIFIED:" + user.Email);
        }

        return await BuildAuthResponseAsync(user, userAgent, ipAddress, cancellationToken);
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken, string? userAgent = null, string? ipAddress = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
            throw new InvalidOperationException("Refresh token is required.");

        var tokenEntity = await db.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == refreshToken, cancellationToken);

        if (tokenEntity == null || !tokenEntity.IsActive || tokenEntity.User == null)
            throw new InvalidOperationException("Invalid or expired refresh token.");

        // Revoke the current refresh token and issue a new one (Token Rotation)
        tokenEntity.IsRevoked = true;
        tokenEntity.RevokedAt = DateTime.UtcNow;

        var newRefreshToken = GenerateSecureRefreshToken();
        tokenEntity.ReplacedByToken = newRefreshToken;

        var newEntity = new RefreshToken
        {
            UserId = tokenEntity.UserId,
            Token = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedByIp = ipAddress,
        };
        db.RefreshTokens.Add(newEntity);
        await db.SaveChangesAsync(cancellationToken);

        var newJwt = GenerateToken(tokenEntity.User, userAgent, ipAddress);

        return new AuthResponseDto
        {
            Token = newJwt,
            RefreshToken = newRefreshToken,
            UserId = tokenEntity.User.Id,
            FirstName = tokenEntity.User.FirstName,
            LastName = tokenEntity.User.LastName,
            Email = tokenEntity.User.Email,
            Role = tokenEntity.User.Role,
        };
    }

    public async Task<bool> VerifyEmailOtpAsync(VerifyOtpDto dto, CancellationToken cancellationToken = default)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email.Trim().ToLowerInvariant(), cancellationToken);
        if (user == null) return false;

        if (user.EmailOtp == dto.Otp && user.EmailOtpExpiry > DateTime.UtcNow)
        {
            user.IsEmailVerified = true;
            user.EmailOtp = null;
            user.EmailOtpExpiry = null;
            await db.SaveChangesAsync(cancellationToken);
            return true;
        }

        return false;
    }

    public Task<User?> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default) =>
        db.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto, CancellationToken cancellationToken = default)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new InvalidOperationException("User not found.");

        ValidatePasswordComplexity(dto.NewPassword);

        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.CurrentPassword ?? string.Empty);
        if (result == PasswordVerificationResult.Failed)
            throw new InvalidOperationException("Current password is incorrect.");

        user.PasswordHash = _passwordHasher.HashPassword(user, dto.NewPassword);
        await db.SaveChangesAsync(cancellationToken);
    }

    public string GenerateToken(User user, string? userAgent = null, string? ipAddress = null)
    {
        var secret = _jwt.Secret;
        if (string.IsNullOrWhiteSpace(secret) || secret.Length < 32)
            throw new InvalidOperationException("JWT Secret must be at least 32 characters for HMAC security.");

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var deviceFp = ComputeDeviceFingerprint(userAgent, ipAddress);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub,   user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.NameIdentifier,     user.Id.ToString()),
            new("device_fp",                   deviceFp),
            new("session_id",                  Guid.NewGuid().ToString()),
        };
        if (!string.IsNullOrWhiteSpace(user.Role))
            claims.Add(new Claim(ClaimTypes.Role, user.Role));

        var expiry = _jwt.ExpiryMinutes > 0 ? _jwt.ExpiryMinutes : 120;

        var token = new JwtSecurityToken(
            issuer:            _jwt.Issuer,
            audience:          _jwt.Audience,
            claims:            claims,
            expires:           DateTime.UtcNow.AddMinutes(expiry),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<AuthResponseDto> BuildAuthResponseAsync(User user, string? userAgent, string? ipAddress, CancellationToken ct)
    {
        var tokenString = GenerateToken(user, userAgent, ipAddress);
        var refreshTokenString = GenerateSecureRefreshToken();

        // Save refresh token to database
        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = refreshTokenString,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedByIp = ipAddress,
        };
        db.RefreshTokens.Add(refreshToken);
        await db.SaveChangesAsync(ct);

        return new AuthResponseDto
        {
            Token        = tokenString,
            RefreshToken = refreshTokenString,
            UserId       = user.Id,
            FirstName    = user.FirstName,
            LastName     = user.LastName,
            Email        = user.Email,
            Role         = user.Role,
        };
    }

    private static string BuildOtpEmailHtml(string otp, bool isResend = false)
    {
        var intro = isResend ? "Your new verification code is:" : "Your verification code is:";
        return $"""
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;color:#0f172a;max-width:500px;margin:0 auto;padding:20px;">
  <div style="background:#2563eb;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
    <h2 style="color:#fff;margin:0;">⚖️ Clausio</h2>
  </div>
  <div style="background:#f8fafc;padding:32px;border:1px solid #e2e8f0;border-radius:0 0 8px 8px;text-align:center;">
    <p style="font-size:15px;color:#374151;margin-bottom:8px;">{intro}</p>
    <div style="font-size:48px;font-weight:900;letter-spacing:12px;color:#2563eb;margin:16px 0;font-family:monospace;">{otp}</div>
    <p style="font-size:13px;color:#64748b;">This code expires in <strong>5 minutes</strong>.</p>
    <p style="font-size:13px;color:#64748b;margin-top:16px;">If you did not create a Clausio account, please ignore this email.</p>
  </div>
</body>
</html>
""";
    }

    private static string GenerateSecureRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    private static void ValidatePasswordComplexity(string? password)
    {
        if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
            throw new InvalidOperationException("Password must be at least 8 characters long.");

        if (!Regex.IsMatch(password, @"[A-Z]"))
            throw new InvalidOperationException("Password must contain at least one uppercase letter (A-Z).");

        if (!Regex.IsMatch(password, @"[a-z]"))
            throw new InvalidOperationException("Password must contain at least one lowercase letter (a-z).");

        if (!Regex.IsMatch(password, @"[0-9]"))
            throw new InvalidOperationException("Password must contain at least one numeric digit (0-9).");
    }
}

