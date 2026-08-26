namespace Clausio.Legal.Core.Entities;

public class ReadinessChecklistItem : BaseEntity
{
    public string? Text { get; set; }
    public string? Category { get; set; }
    public bool Done { get; set; }

    // Case-type-tailored assessment fields (AddReadinessChecklistFields migration)
    public string? CaseTypeRelevance { get; set; }
    public string  Status { get; set; } = "Pending";   // "Done" | "Pending" | "At Risk"
    public bool    Controllable { get; set; } = true;   // false = depends on court / opposing party
    public string? ActionNeeded { get; set; }

    public Guid ReadinessId { get; set; }
    public Readiness? Readiness { get; set; }
}
