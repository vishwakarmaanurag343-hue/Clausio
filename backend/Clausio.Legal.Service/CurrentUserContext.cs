namespace Clausio.Legal.Service;

/// <summary>
/// Per-request holder for the authenticated caller's id and role. Populated by
/// <c>CurrentUserMiddleware</c> in the API layer from the JWT claims.
///
/// The Service layer (e.g. AIPipeline) has no reference to ASP.NET / HttpContext,
/// so this scoped POCO is how it identifies the current user. Guid.Empty means
/// "no authenticated user" (anonymous request or internal/system call).
/// 
/// Role: extracted from JWT ClaimTypes.Role. SuperAdmin users bypass credit checks.
/// OriginalUserId: set when admin assumes another user (via X-Assumed-UserId header).
/// </summary>
public sealed class CurrentUserContext
{
    /// <summary>The authenticated user's ID. Guid.Empty for anonymous.</summary>
    public Guid UserId { get; set; }
    
    /// <summary>The user's role from JWT claims (e.g., "SuperAdmin", "User").</summary>
    public string? Role { get; set; }
    
    /// <summary>Original user ID when a SuperAdmin assumes another user (via header).
    /// Non-null indicates admin impersonation — no credits should be deducted.</summary>
    public Guid? OriginalUserId { get; set; }
}
