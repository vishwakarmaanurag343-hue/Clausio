namespace Clausio.Legal.Core.Entities;

/// <summary>
/// Free-form notepad entry for the Floating Notes panel. One row per
/// (user, case, category); CaseId null == the user's general notes.
/// Deliberately not a BaseEntity — the panel owns its own id/timestamps.
/// </summary>
public class CaseNote
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? CaseId { get; set; }
    public Guid UserId { get; set; }
    public string Category { get; set; } = "General";
    public string Content { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
