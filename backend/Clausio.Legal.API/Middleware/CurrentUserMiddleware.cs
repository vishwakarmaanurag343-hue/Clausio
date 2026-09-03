using System.Security.Claims;
using Clausio.Legal.Service;

namespace Clausio.Legal.API.Middleware;

/// <summary>
/// Extracts authenticated user's ID, Role, and optional assumed user from JWT claims
/// and headers into the scoped <see cref="CurrentUserContext"/>.
/// 
/// Runs after authentication and populates:
/// - UserId: from ClaimTypes.NameIdentifier
/// - Role: from ClaimTypes.Role (e.g., "SuperAdmin")
/// - OriginalUserId: from X-Assumed-UserId header (when admin assumes another user)
/// 
/// Service-layer components (AIPipeline, wallet deduction) use this to identify
/// the caller and determine credit deduction behavior.
/// </summary>
public class CurrentUserMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, CurrentUserContext currentUser)
    {
        // Extract user ID from JWT claims
        var idValue = context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(idValue, out var id))
        {
            currentUser.UserId = id;
        }

        // Extract role from JWT claims (e.g., "SuperAdmin", "User")
        var role = context.User?.FindFirstValue(ClaimTypes.Role);
        if (!string.IsNullOrWhiteSpace(role))
        {
            currentUser.Role = role;
        }

        // Check for admin assuming another user (via X-Assumed-UserId header)
        // When present, OriginalUserId is the admin, UserId is the user being assumed
        if (context.Request.Headers.TryGetValue("X-Assumed-UserId", out var assumedIdValue)
            && Guid.TryParse(assumedIdValue.ToString(), out var assumedId))
        {
            currentUser.OriginalUserId = assumedId;
        }

        await next(context);
    }
}
