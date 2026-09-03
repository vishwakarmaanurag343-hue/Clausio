using Clausio.Legal.API.Extensions;
using Clausio.Legal.Core.Dtos;
using Clausio.Legal.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Clausio.Legal.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var userAgent = Request.Headers.UserAgent.ToString();
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var result = await authService.RegisterAsync(dto, userAgent, ipAddress, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message ?? "An error occurred during registration." });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var userAgent = Request.Headers.UserAgent.ToString();
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var result = await authService.LoginAsync(dto, userAgent, ipAddress, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message ?? "An error occurred during login." });
        }
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var userAgent = Request.Headers.UserAgent.ToString();
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var result = await authService.RefreshTokenAsync(dto.RefreshToken, userAgent, ipAddress, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message ?? "An error occurred while refreshing the token." });
        }
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var success = await authService.VerifyEmailOtpAsync(dto, cancellationToken);
            if (!success)
                return BadRequest(new { message = "Invalid or expired OTP." });

            return Ok(new { message = "Email verified successfully." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message ?? "An error occurred while verifying OTP." });
        }
    }

    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailDto dto, CancellationToken ct)
    {
        try
        {
            var userAgent = Request.Headers.UserAgent.ToString();
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            var result = await authService.VerifyEmailAsync(dto.Email, dto.Otp, userAgent, ip, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message ?? "An error occurred while verifying your email." });
        }
    }

    [HttpPost("resend-otp")]
    public async Task<IActionResult> ResendOtp([FromBody] ResendOtpDto dto, CancellationToken ct)
    {
        try
        {
            await authService.ResendOtpAsync(dto.Email, ct);
            return Ok(new { message = "New OTP sent to your email." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message ?? "An error occurred while resending the OTP." });
        }
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.GetUserId();
            var user = await authService.GetCurrentUserAsync(userId, cancellationToken);
            return user is null ? NotFound(new { message = "User not found." }) : Ok(user);
        }
        catch (Exception ex)
        {
            return Unauthorized(new { message = ex.Message ?? "Unauthorized user token." });
        }
    }

    [Authorize]
    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.GetUserId();
            await authService.ChangePasswordAsync(userId, dto, cancellationToken);
            return Ok(new { message = "Password changed successfully." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message ?? "Failed to change password." });
        }
    }
}
