using System.Text.Json.Serialization;
using Clausio.Legal.Core.Dtos;
using Clausio.Legal.Core.Entities;
using Clausio.Legal.Infrastructure;
using Clausio.Legal.Infrastructure.Google;
using Clausio.Legal.Service.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Clausio.Legal.Service;

public interface ICalendarSyncService
{
    // ── Fire-and-forget (safe to call from any request path; never throws) ──
    void QueueHearingSync(Guid caseId, Guid hearingId);
    void QueueOrderSync(Guid orderId);
    void QueueMeetingSync(Guid meetingId);
    void QueueRemoval(string eventType, Guid sourceId);

    // ── Awaited variants (manual buttons / full resync) ──
    Task<PushResultDto> PushHearingAsync(Guid caseId, Guid hearingId, bool enforceThirtyDayWindow = false, CancellationToken cancellationToken = default);
    Task<PushResultDto> PushOrderAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task<PushResultDto> PushMeetingAsync(Guid meetingId, CancellationToken cancellationToken = default);
    Task<int> FullResyncAsync(Guid userId, CancellationToken cancellationToken = default);
    Task RemoveInternalAsync(string eventType, Guid sourceId, CancellationToken cancellationToken = default);
    Task<CalendarStatusDto> GetStatusAsync(Guid userId, CancellationToken cancellationToken = default);
    Task DisconnectAsync(Guid userId, CancellationToken cancellationToken = default);
}

public class CalendarSyncService : ICalendarSyncService
{
    public const int WindowDays = 30;

    private readonly ClausioDbContext _db;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly GoogleCalendarClient _google;
    private readonly IEncryptionService _encryption;
    private readonly ILogger<CalendarSyncService> _logger;

    public CalendarSyncService(ClausioDbContext db, IServiceScopeFactory scopeFactory,
        GoogleCalendarClient google, IEncryptionService encryption, ILogger<CalendarSyncService> logger)
    {
        _db = db; _scopeFactory = scopeFactory; _google = google;
        _encryption = encryption; _logger = logger;
    }

    // ════════════════════════ queueing (background-safe) ════════════════════════

    private void Queue(Func<ICalendarSyncService, Task> work) => _ = Task.Run(async () =>
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var svc = scope.ServiceProvider.GetRequiredService<ICalendarSyncService>();
            await work(svc);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Background calendar sync failed: {Message}", ex.Message);
        }
    });

    public void QueueHearingSync(Guid caseId, Guid hearingId) => Queue(s => s.PushHearingAsync(caseId, hearingId, enforceThirtyDayWindow: true));
    public void QueueOrderSync(Guid orderId)                                 => Queue(s => s.PushOrderAsync(orderId));
    public void QueueMeetingSync(Guid meetingId)                             => Queue(s => s.PushMeetingAsync(meetingId));
    public void QueueRemoval(string eventType, Guid sourceId)                => Queue(s => s.RemoveInternalAsync(eventType, sourceId));

    // ════════════════════════ hearings ════════════════════════

    public async Task<PushResultDto> PushHearingAsync(Guid caseId, Guid hearingId, bool enforceThirtyDayWindow = false, CancellationToken cancellationToken = default)
    {
        var hearing = await _db.Hearings.Include(h => h.Case).Include(h => h.Orders)
            .FirstOrDefaultAsync(h => h.CaseId == caseId && h.Id == hearingId, cancellationToken);
        if (hearing is null) return Not("Hearing not found.");

        var integration = await GetIntegrationAsync(hearing.Case.CreatedByUserId, cancellationToken);
        if (integration is null) return Not("Google Calendar not connected.");

        var existingLink = await FindLinkAsync(integration.Id, "hearing", hearing.Id, cancellationToken);

        // Auto-sync keeps a rolling 30-day window; anything moved out gets removed from Google.
        if (enforceThirtyDayWindow && !IsWithinWindow(hearing.HearingDate))
        {
            if (existingLink is not null) await DeleteLinkedEventAsync(integration, existingLink, cancellationToken);
            return Not("Outside the 30-day sync window.");
        }

        var caseName = hearing.Case?.Name ?? "Case";
        var caseNumber = hearing.Case?.CaseNumber ?? "";
        var title = $"[Hearing] {caseName}";
        var desc = string.Join("\n",
            $"Case: {caseName}",
            string.IsNullOrWhiteSpace(caseNumber) ? null : $"Case No.: {caseNumber}",
            string.IsNullOrWhiteSpace(hearing.Stage) ? null : $"Stage: {hearing.Stage}",
            string.IsNullOrWhiteSpace(hearing.Judge) ? null : $"Judge: {hearing.Judge}",
            string.IsNullOrWhiteSpace(hearing.CourtHall) ? null : $"Court Hall: {hearing.CourtHall}",
            "",
            $"Open in Clausio: {_google.Settings.FrontendUrl}/dashboard?case={caseId}");

        var evt = new GoogleCalendarEvent
        {
            Summary = title,
            Description = desc,
            Start = EventTime(hearing.HearingDate),
            End = EventTime(hearing.HearingDate.AddHours(1)),
            Reminders = new GoogleEventReminders
            {
                UseDefault = false,
                Overrides = new List<GoogleReminderOverride>
                {
                    new() { Minutes = 1440 },                       // day before
                    new() { Minutes = MorningOfMinutes(hearing.HearingDate) },   // morning-of
                },
            },
            ExtendedProperties = new GoogleExtendedProperties
            {
                Private = new Dictionary<string, string>
                {
                    ["clausioType"] = "hearing", ["clausioSource"] = hearing.Id.ToString(), ["clausioCase"] = caseId.ToString(),
                },
            },
        };

        try
        {
            var token = await AccessTokenAsync(integration, cancellationToken);
            var (eventId, url) = await _google.UpsertEventAsync(token, integration.CalendarId, existingLink?.GoogleEventId, evt, cancellationToken);
            await SaveLinkAsync(integration, existingLink, "hearing", hearing.Id, eventId, cancellationToken);
            return Ok(eventId, url);
        }
        catch (Exception ex)
        {
            await RecordErrorAsync(integration, ex.Message, cancellationToken);
            throw;
        }
    }

    // ════════════════════════ order deadlines ════════════════════════

    public async Task<PushResultDto> PushOrderAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var order = await _db.Set<HearingOrder>().Include(o => o.Hearing!).ThenInclude(h => h!.Case)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
        if (order?.Hearing is null) return Not("Court order not found.");

        var integration = await GetIntegrationAsync(order.Hearing.Case.CreatedByUserId, cancellationToken);
        if (integration is null) return Not("Google Calendar not connected.");

        var existingLink = await FindLinkAsync(integration.Id, "deadline", order.Id, cancellationToken);

        if (!order.Done && order.Deadline == default)
            return Not("Order has no deadline.");

        var caseEntity = order.Hearing.Case!;
        var donePrefix = order.Done ? "[COMPLETED] " : "";
        var desc = string.Join("\n",
            $"Case: {caseEntity.Name}",
            string.IsNullOrWhiteSpace(caseEntity.CaseNumber) ? null : $"Case No.: {caseEntity.CaseNumber}",
            $"Court order{((order.Deadline != default) ? $" · due {order.Deadline:dd MMM yyyy}" : "")}",
            string.IsNullOrWhiteSpace(order.Responsible) ? null : $"Responsible: {order.Responsible}",
            "",
            $"Open in Clausio: {_google.Settings.FrontendUrl}/dashboard?case={caseEntity.Id}");

        var evt = new GoogleCalendarEvent
        {
            Summary = $"{donePrefix}[Deadline] {Truncate(order.Text, 200)}",
            Description = desc,
            Start = EventTime(order.Deadline == default ? order.Hearing.HearingDate : order.Deadline.Date.AddHours(9)),
            End = EventTime((order.Deadline == default ? order.Hearing.HearingDate : order.Deadline.Date.AddHours(9)).AddMinutes(30)),
            Reminders = order.Done
                ? new GoogleEventReminders { UseDefault = true }     // completed → drop the nagging reminder
                : new GoogleEventReminders
                {
                    UseDefault = false,
                    Overrides = new List<GoogleReminderOverride> { new() { Minutes = 4320 } },   // 3 days before
                },
            ExtendedProperties = new GoogleExtendedProperties
            {
                Private = new Dictionary<string, string>
                {
                    ["clausioType"] = "deadline", ["clausioSource"] = order.Id.ToString(), ["clausioCase"] = caseEntity.Id.ToString(),
                },
            },
        };

        try
        {
            var token = await AccessTokenAsync(integration, cancellationToken);
            var (eventId, url) = await _google.UpsertEventAsync(token, integration.CalendarId, existingLink?.GoogleEventId, evt, cancellationToken);
            await SaveLinkAsync(integration, existingLink, "deadline", order.Id, eventId, cancellationToken);
            return Ok(eventId, url);
        }
        catch (Exception ex)
        {
            await RecordErrorAsync(integration, ex.Message, cancellationToken);
            throw;
        }
    }

    // ════════════════════════ client meetings ════════════════════════

    public async Task<PushResultDto> PushMeetingAsync(Guid meetingId, CancellationToken cancellationToken = default)
    {
        var meeting = await _db.ClientMeetings.Include(m => m.Case)
            .FirstOrDefaultAsync(m => m.Id == meetingId, cancellationToken);
        if (meeting is null) return Not("Meeting not found.");

        var integration = await GetIntegrationAsync(meeting.CreatedByUserId, cancellationToken)
                          ?? await GetIntegrationAsync(meeting.Case.CreatedByUserId, cancellationToken);
        if (integration is null) return Not("Google Calendar not connected.");

        var existingLink = await FindLinkAsync(integration.Id, "meeting", meeting.Id, cancellationToken);

        var desc = string.Join("\n",
            $"Case: {meeting.Case?.Name}",
            string.IsNullOrWhiteSpace(meeting.Case?.CaseNumber) ? null : $"Case No.: {meeting.Case!.CaseNumber}",
            string.IsNullOrWhiteSpace(meeting.WithPerson) ? null : $"With: {meeting.WithPerson}",
            string.IsNullOrWhiteSpace(meeting.Notes) ? null : $"\nNotes: {meeting.Notes}",
            "",
            $"Open in Clausio: {_google.Settings.FrontendUrl}/dashboard?case={meeting.CaseId}");

        var evt = new GoogleCalendarEvent
        {
            Summary = $"[Client Meeting] {meeting.Title}",
            Description = desc,
            Location = meeting.Location,
            Start = EventTime(meeting.ScheduledAt),
            End = EventTime(meeting.ScheduledAt.AddHours(1)),
            ExtendedProperties = new GoogleExtendedProperties
            {
                Private = new Dictionary<string, string>
                {
                    ["clausioType"] = "meeting", ["clausioSource"] = meeting.Id.ToString(), ["clausioCase"] = meeting.CaseId.ToString(),
                },
            },
        };

        try
        {
            var token = await AccessTokenAsync(integration, cancellationToken);
            var (eventId, url) = await _google.UpsertEventAsync(token, integration.CalendarId, existingLink?.GoogleEventId, evt, cancellationToken);
            await SaveLinkAsync(integration, existingLink, "meeting", meeting.Id, eventId, cancellationToken);
            return Ok(eventId, url);
        }
        catch (Exception ex)
        {
            await RecordErrorAsync(integration, ex.Message, cancellationToken);
            throw;
        }
    }

    // ════════════════════════ removal / full resync / status ════════════════════════

    public async Task RemoveInternalAsync(string eventType, Guid sourceId, CancellationToken cancellationToken = default)
    {
        var link = await _db.CalendarEventLinks.FirstOrDefaultAsync(l => l.EventType == eventType && l.SourceId == sourceId, cancellationToken);
        if (link is null) return;
        var integration = await _db.CalendarIntegrations.FirstOrDefaultAsync(i => i.Id == link.IntegrationId, cancellationToken);
        if (integration is null) { _db.CalendarEventLinks.Remove(link); await _db.SaveChangesAsync(cancellationToken); return; }

        try
        {
            var token = await AccessTokenAsync(integration, cancellationToken);
            await _google.DeleteEventAsync(token, integration.CalendarId, link.GoogleEventId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not delete Google event for {Type} {Source}: {Message}", eventType, sourceId, ex.Message);
        }
        finally
        {
            _db.CalendarEventLinks.Remove(link);
            await _db.SaveChangesAsync(cancellationToken);
        }
    }

    /// <summary>Re-push everything relevant for one lawyer: hearings in the 30-day
    /// window, undone court-order deadlines, upcoming client meetings.</summary>
    public async Task<int> FullResyncAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var integration = await GetIntegrationAsync(userId, cancellationToken);
        if (integration is null) throw new InvalidOperationException("Google Calendar not connected.");
        if (!_google.IsConfigured) throw new InvalidOperationException("Google Calendar integration is not configured on this server.");

        var now = DateTime.UtcNow;
        var horizon = now.AddDays(WindowDays);
        var pushed = 0;

        var caseIds = await _db.Cases.Where(c => c.CreatedByUserId == userId).Select(c => c.Id).ToListAsync(cancellationToken);

        foreach (var caseId in caseIds)
        {
            var hearings = await _db.Hearings.Include(h => h.Orders)
                .Where(h => h.CaseId == caseId && h.HearingDate >= now && h.HearingDate <= horizon)
                .ToListAsync(cancellationToken);
            foreach (var h in hearings)
                if ((await PushHearingAsync(h.CaseId, h.Id, cancellationToken: cancellationToken)).Pushed) pushed++;

            var orderIds = hearings.SelectMany(h => h.Orders)
                .Where(o => !o.Done && o.Deadline >= now).Select(o => o.Id).ToList();
            foreach (var oid in orderIds)
                if ((await PushOrderAsync(oid, cancellationToken)).Pushed) pushed++;

            var meetingIds = await _db.ClientMeetings
                .Where(m => m.CaseId == caseId && m.ScheduledAt >= now && m.ScheduledAt <= horizon)
                .Select(m => m.Id).ToListAsync(cancellationToken);
            foreach (var mid in meetingIds)
                if ((await PushMeetingAsync(mid, cancellationToken)).Pushed) pushed++;
        }

        // Prune events that fell out of the window since last sync.
        var staleHearings = await _db.CalendarEventLinks
            .Where(l => l.IntegrationId == integration.Id && l.EventType == "hearing").Select(l => l.SourceId).ToListAsync(cancellationToken);
        foreach (var sid in staleHearings)
        {
            var stillIn = await _db.Hearings.AnyAsync(h => h.Id == sid && h.HearingDate >= now && h.HearingDate <= horizon, cancellationToken);
            if (!stillIn) await RemoveInternalAsync("hearing", sid, cancellationToken);
        }

        integration.LastSyncedAt = DateTime.UtcNow;
        integration.LastSyncError = null;
        await _db.SaveChangesAsync(cancellationToken);
        return pushed;
    }

    public async Task<CalendarStatusDto> GetStatusAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var integration = await _db.CalendarIntegrations.AsNoTracking()
            .FirstOrDefaultAsync(i => i.UserId == userId, cancellationToken);
        return integration is null
            ? new CalendarStatusDto { Connected = false }
            : new CalendarStatusDto { Connected = true, LastSyncedAt = integration.LastSyncedAt, LastSyncError = integration.LastSyncError };
    }

    public async Task DisconnectAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var integration = await _db.CalendarIntegrations.FirstOrDefaultAsync(i => i.UserId == userId, cancellationToken);
        if (integration is null) return;
        var links = await _db.CalendarEventLinks.Where(l => l.IntegrationId == integration.Id).ToListAsync(cancellationToken);
        _db.CalendarEventLinks.RemoveRange(links);
        _db.CalendarIntegrations.Remove(integration);
        await _db.SaveChangesAsync(cancellationToken);
        // Google-side events intentionally left in place — the lawyer keeps their calendar history.
    }

    // ════════════════════════ helpers ════════════════════════

    private Task<CalendarIntegration?> GetIntegrationAsync(Guid userId, CancellationToken ct) =>
        _db.CalendarIntegrations.FirstOrDefaultAsync(i => i.UserId == userId, ct);

    private static bool IsWithinWindow(DateTime when) =>
        when >= DateTime.UtcNow && when <= DateTime.UtcNow.AddDays(WindowDays);

    private async Task<string> AccessTokenAsync(CalendarIntegration integration, CancellationToken ct)
    {
        if (!_google.IsConfigured) throw new InvalidOperationException("Google Calendar integration is not configured on this server.");
        var refreshToken = _encryption.Decrypt(integration.EncryptedRefreshToken);
        return await _google.RefreshAccessTokenAsync(refreshToken, ct);
    }

    private async Task<CalendarEventLink?> FindLinkAsync(Guid integrationId, string type, Guid sourceId, CancellationToken ct) =>
        await _db.CalendarEventLinks.FirstOrDefaultAsync(l => l.IntegrationId == integrationId && l.EventType == type && l.SourceId == sourceId, ct);

    private async Task SaveLinkAsync(CalendarIntegration integration, CalendarEventLink? existing, string type, Guid sourceId, string googleEventId, CancellationToken ct)
    {
        if (existing is null)
            _db.CalendarEventLinks.Add(new CalendarEventLink { IntegrationId = integration.Id, EventType = type, SourceId = sourceId, GoogleEventId = googleEventId });
        else
            existing.GoogleEventId = googleEventId;

        integration.LastSyncedAt = DateTime.UtcNow;
        integration.LastSyncError = null;
        await _db.SaveChangesAsync(ct);
    }

    private async Task RecordErrorAsync(CalendarIntegration integration, string message, CancellationToken ct)
    {
        integration.LastSyncError = message.Length > 500 ? message[..500] : message;
        await _db.SaveChangesAsync(ct);
    }

    private async Task DeleteLinkedEventAsync(CalendarIntegration integration, CalendarEventLink link, CancellationToken ct)
    {
        try
        {
            var token = await AccessTokenAsync(integration, ct);
            await _google.DeleteEventAsync(token, integration.CalendarId, link.GoogleEventId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Prune of Google event failed: {Message}", ex.Message);
        }
        finally
        {
            _db.CalendarEventLinks.Remove(link);
            await _db.SaveChangesAsync(ct);
        }
    }

    private GoogleEventTime EventTime(DateTime utcWhen) => new()
    {
        DateTime = DateTime.SpecifyKind(utcWhen, DateTimeKind.Utc).ToString("yyyy-MM-dd'T'HH:mm:ss'Z'"),
        TimeZone = _google.Settings.TimeZone,
    };

    /// <summary>"Morning-of" reminder: minutes between 09:00 that day (local) and the start,
    /// clamped to Google's allowed override range. Falls back to 60 min for early starts.</summary>
    private int MorningOfMinutes(DateTime startUtc)
    {
        TimeZoneInfo tz;
        try { tz = TimeZoneInfo.FindSystemTimeZoneById(_google.Settings.TimeZone); }
        catch { tz = TimeZoneInfo.Utc; }
        var local = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(startUtc, DateTimeKind.Utc), tz);
        var minutes = (int)(local - local.Date.AddHours(9)).TotalMinutes;
        if (minutes <= 0) return 60;
        return Math.Clamp(minutes, 15, 40320);
    }

    private static string Truncate(string? s, int len) =>
        string.IsNullOrEmpty(s) ? "" : s.Length <= len ? s : s[..len];

    private static PushResultDto Ok(string id, string url) => new() { Pushed = true, GoogleEventId = id, EventUrl = url };
    private static PushResultDto Not(string why) => new() { Pushed = false, Error = why };
}
