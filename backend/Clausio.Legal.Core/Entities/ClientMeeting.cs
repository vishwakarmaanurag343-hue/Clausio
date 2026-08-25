namespace Clausio.Legal.Core.Entities;

public class ClientMeeting : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public DateTime ScheduledAt { get; set; }
    public string? WithPerson { get; set; }      // e.g. client, opposing counsel
    public string? Location { get; set; }
    public string? Notes { get; set; }

    public Guid CaseId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public Case? Case { get; set; }
}
