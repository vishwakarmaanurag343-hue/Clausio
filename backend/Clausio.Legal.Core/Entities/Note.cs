namespace Clausio.Legal.Core.Entities;

public class Note : BaseEntity
{
    public string Tag { get; set; } = string.Empty;   // short label e.g. "Hearing", "Client call"
    public string Body { get; set; } = string.Empty;
    public bool Pinned { get; set; }

    public Guid CaseId { get; set; }
    public Case? Case { get; set; }
}
