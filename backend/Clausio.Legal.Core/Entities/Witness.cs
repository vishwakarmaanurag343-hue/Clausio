namespace Clausio.Legal.Core.Entities;

public class Witness : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Independent";   // Petitioner | Respondent | Independent | Expert
    public string Side { get; set; } = "Ours";          // Ours | Opposing
    public string? Statement { get; set; }

    public Guid CaseId { get; set; }
    public Case? Case { get; set; }
}
