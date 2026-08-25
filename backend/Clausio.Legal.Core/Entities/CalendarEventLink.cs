namespace Clausio.Legal.Core.Entities;

public class CalendarEventLink : BaseEntity
{
    public Guid IntegrationId { get; set; }
    public string EventType { get; set; } = string.Empty;   // hearing | deadline | meeting
    public Guid SourceId { get; set; }                      // HearingId / HearingOrderId / MeetingId
    public string GoogleEventId { get; set; } = string.Empty;

    // unique index (IntegrationId, EventType, SourceId) configured in ClausioDbContext
}
