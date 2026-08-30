namespace Clausio.Legal.Core.Entities;

/// <summary>
/// One row per (user, page) the user is allowed to open. Absence of ANY rows for a
/// user means "no restriction — allow every page" (matches the frontend default).
/// Managed from Masters → Roles Master.
/// </summary>
public class UserPagePermission
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }

    /// <summary>
    /// Matches the sidebar page keys: "dashboard", "cases", "hearings", "documents",
    /// "drafting", "analysis", "financial", "readiness", "calendar", "billing",
    /// "clients", "evidence-graph", "settings", "masters/users", "masters/roles".
    /// </summary>
    public string PageKey { get; set; } = "";

    public bool HasAccess { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
