namespace Clausio.Legal.Core.Entities;

/// <summary>A persisted legal draft with a full, immutable version history.</summary>
public class Draft : BaseEntity
{
    public Guid CaseId { get; set; }
    public string DraftType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public Guid CreatedByUserId { get; set; }

    public ICollection<DraftVersion> Versions { get; set; } = new List<DraftVersion>();
}

/// <summary>
/// One immutable revision of a draft. Rows are never mutated after creation —
/// edits append a new version; finalisation flips Status on the latest one only.
/// </summary>
public class DraftVersion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DraftId { get; set; }
    public Draft? Draft { get; set; }

    public int VersionNumber { get; set; }
    public string Content { get; set; } = string.Empty;
    public Guid EditedByUserId { get; set; }
    public DateTime EditedAt { get; set; } = DateTime.UtcNow;

    /// <summary>"Draft" while editable, "Final" once locked for filing.</summary>
    public string Status { get; set; } = "Draft";
}
