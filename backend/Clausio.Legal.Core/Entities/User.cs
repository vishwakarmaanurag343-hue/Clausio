namespace Clausio.Legal.Core.Entities;

public class User : BaseEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? Role { get; set; }
    public string? Phone { get; set; }

    /// <summary>Inactive users are kept for audit but blocked from signing in.</summary>
    public bool IsActive { get; set; } = true;

    // Account Lockout & Brute-force protection
    public int FailedLoginAttempts { get; set; } = 0;
    public DateTime? LockoutEnd { get; set; }

    // Email verification / OTP
    public bool IsEmailVerified { get; set; } = false; // New users must verify email via OTP before accessing the product
    public string? EmailOtp { get; set; }
    public DateTime? EmailOtpExpiry { get; set; }

    // Refresh Tokens
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}

