namespace Clausio.Legal.Core.Dtos;

public class CreateMeetingDto
{
    public string Title { get; set; } = string.Empty;
    public DateTime ScheduledAt { get; set; }
    public string? WithPerson { get; set; }
    public string? Location { get; set; }
    public string? Notes { get; set; }
}

public class CalendarStatusDto
{
    public bool Connected { get; set; }
    public DateTime? LastSyncedAt { get; set; }
    public string? LastSyncError { get; set; }
}

public class PushResultDto
{
    public bool Pushed { get; set; }
    public string? GoogleEventId { get; set; }
    public string? EventUrl { get; set; }
    public string? Error { get; set; }
}

// ── In-app Calendar tab (proxy over the lawyer's real Google Calendar) ──

public class CreateUserEventDto
{
    public string Title { get; set; } = string.Empty;
    public DateTimeOffset Start { get; set; }
    public DateTimeOffset? End { get; set; }
    public string? Location { get; set; }
    public string? Notes { get; set; }
    /// <summary>Optional case to link — adds the case name + deep link into the description.</summary>
    public Guid? CaseId { get; set; }
}

public class UpdateUserEventDto
{
    public string Title { get; set; } = string.Empty;
    public DateTimeOffset Start { get; set; }
    public DateTimeOffset? End { get; set; }
    public string? Location { get; set; }
    public string? Notes { get; set; }
}

/// <summary>Flat, frontend-friendly view of a Google event.</summary>
public class UserCalendarEventDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = "(untitled)";
    public DateTimeOffset Start { get; set; }
    public DateTimeOffset? End { get; set; }
    public bool AllDay { get; set; }
    public string? Location { get; set; }
    public string? Notes { get; set; }
    /// <summary>hearing | deadline | meeting | null (personal).</summary>
    public string? ClausioType { get; set; }
    public Guid? CaseId { get; set; }
    public string? EventUrl { get; set; }
}
