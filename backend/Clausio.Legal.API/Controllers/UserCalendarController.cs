using System.Text;
using Clausio.Legal.API.Extensions;
using Clausio.Legal.Core.Dtos;
using Clausio.Legal.Core.Entities;
using Clausio.Legal.Infrastructure;
using Clausio.Legal.Infrastructure.Google;
using Clausio.Legal.Service.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Clausio.Legal.API.Controllers;

/// <summary>
/// Proxy over the lawyer's real Google Calendar for the in-app Calendar tab.
/// All calls ride the OAuth token stored when the lawyer connected Google in
/// Settings → Integrations — no redirect, no public calendar needed.
/// </summary>
[Authorize]
[ApiController]
[Route("api/calendar")]
public class UserCalendarController(
    ClausioDbContext db,
    GoogleCalendarClient google,
    IEncryptionService encryption) : ControllerBase
{
    private sealed record Auth(CalendarIntegration Integration, string Token);

    // ─────────────────────────── list ───────────────────────────

    [HttpGet("events")]
    public async Task<IActionResult> Events([FromQuery] string? start, [FromQuery] string? end, CancellationToken cancellationToken)
    {
        var timeMin = ParseDate(start) ?? DateTime.UtcNow.AddDays(-7);
        var timeMax = ParseDate(end) ?? timeMin.AddDays(45);
        if (timeMax <= timeMin) return BadRequest(new { error = "'end' must be after 'start'." });
        if (timeMax - timeMin > TimeSpan.FromDays(400)) return BadRequest(new { error = "Range too large (max 400 days)." });

        var auth = await GetAuthAsync(cancellationToken);
        if (auth.Error is not null) return auth.Error;

        List<GoogleEventListItem> items;
        try
        {
            items = await google.ListEventsAsync(auth.Value!.Token, auth.Value.Integration.CalendarId, timeMin, timeMax, cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            return BadGateway(ex.Message);
        }

        return Ok(items.Select(Map).ToList());
    }

    // ─────────────────────────── create ───────────────────────────

    [HttpPost("events")]
    public async Task<IActionResult> Create(CreateUserEventDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto.Title, dto.Start, dto.End);
        if (validation is not null) return validation;

        string? caseName = null;
        string? caseNumber = null;
        if (dto.CaseId.HasValue)
        {
            var owned = await db.Cases.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == dto.CaseId && c.CreatedByUserId == User.GetUserId(), cancellationToken);
            if (owned is null) return NotFound(new { error = "Case not found." });
            caseName = owned.Name;
            caseNumber = owned.CaseNumber;
        }

        var auth = await GetAuthAsync(cancellationToken);
        if (auth.Error is not null) return auth.Error;

        var evt = new GoogleCalendarEvent
        {
            Summary = dto.Title.Trim(),
            Description = BuildDescription(dto.Notes, caseName, caseNumber, dto.CaseId),
            Location = dto.Location?.Trim(),
            Start = EventTime(dto.Start),
            End = EventTime(dto.End ?? dto.Start.AddHours(1)),
            ExtendedProperties = new GoogleExtendedProperties
            {
                Private = new Dictionary<string, string> { ["clausioType"] = "personal" },
            },
        };

        try
        {
            var created = await google.CreateEventAsync(auth.Value!.Token, auth.Value.Integration.CalendarId, evt, cancellationToken);
            return Ok(Map(created));
        }
        catch (HttpRequestException ex)
        {
            return BadGateway(ex.Message);
        }
    }

    // ─────────────────────────── update ───────────────────────────

    /// <summary>Fetch-then-merge so Clausio tags, reminders and any deep-link line survive.</summary>
    [HttpPut("events/{eventId}")]
    public async Task<IActionResult> Update(string eventId, UpdateUserEventDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto.Title, dto.Start, dto.End);
        if (validation is not null) return validation;

        var auth = await GetAuthAsync(cancellationToken);
        if (auth.Error is not null) return auth.Error;

        GoogleEventListItem? existing;
        try
        {
            existing = await google.GetEventAsync(auth.Value!.Token, auth.Value.Integration.CalendarId, eventId, cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            return BadGateway(ex.Message);
        }
        if (existing is null) return NotFound();

        // Keep any "Open in Clausio:" line written by the sync service.
        var preservedLink = existing.Description?
            .Split('\n')
            .FirstOrDefault(l => l.StartsWith("Open in Clausio:", StringComparison.OrdinalIgnoreCase));

        var patch = new GoogleCalendarEvent
        {
            Summary = dto.Title.Trim(),
            Description = BuildDescription(dto.Notes, null, null, null, preservedLink),
            Location = dto.Location?.Trim(),
            Start = EventTime(dto.Start),
            End = EventTime(dto.End ?? dto.Start.AddHours(1)),
        };

        try
        {
            await google.UpdateEventAsync(auth.Value.Token, auth.Value.Integration.CalendarId, eventId, patch, cancellationToken);
            var merged = await google.GetEventAsync(auth.Value.Token, auth.Value.Integration.CalendarId, eventId, cancellationToken);
            return Ok(Map(merged ?? existing));
        }
        catch (HttpRequestException ex)
        {
            return BadGateway(ex.Message);
        }
    }

    // ─────────────────────────── delete ───────────────────────────

    /// <summary>Only personal events may be deleted from here — Clausio-synced ones are managed
    /// by the hearings/orders/meetings screens so the two stay in agreement.</summary>
    [HttpDelete("events/{eventId}")]
    public async Task<IActionResult> Delete(string eventId, CancellationToken cancellationToken)
    {
        var auth = await GetAuthAsync(cancellationToken);
        if (auth.Error is not null) return auth.Error;

        GoogleEventListItem? existing;
        try
        {
            existing = await google.GetEventAsync(auth.Value!.Token, auth.Value.Integration.CalendarId, eventId, cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            return BadGateway(ex.Message);
        }
        if (existing is null) return NotFound();

        var type = existing.ExtendedProperties?.Private?.GetValueOrDefault("clausioType");
        if (!string.IsNullOrEmpty(type) && type != "personal")
            return BadRequest(new { error = $"This event is synced from Clausio ({type}) — delete it from the case screen instead." });

        try
        {
            await google.DeleteEventAsync(auth.Value.Token, auth.Value.Integration.CalendarId, eventId, cancellationToken);
            return Ok();
        }
        catch (HttpRequestException ex)
        {
            return BadGateway(ex.Message);
        }
    }

    // ─────────────────────────── helpers ───────────────────────────

    private async Task<(Auth? Value, IActionResult? Error)> GetAuthAsync(CancellationToken ct)
    {
        if (!google.IsConfigured)
            return (null, BadRequest(new { error = "Google Calendar integration is not configured on this server." }));

        var integration = await db.CalendarIntegrations.AsNoTracking()
            .FirstOrDefaultAsync(i => i.UserId == User.GetUserId(), ct);
        if (integration is null)
            return (null, BadRequest(new { error = "Connect your Google Calendar first — Settings → Integrations." }));

        try
        {
            var refreshToken = encryption.Decrypt(integration.EncryptedRefreshToken);
            var token = await google.RefreshAccessTokenAsync(refreshToken, ct);
            return (new Auth(integration, token), null);
        }
        catch (Exception ex)
        {
            return (null, StatusCode(StatusCodes.Status502BadGateway,
                new { error = $"Could not reach Google Calendar: {ex.Message}" }));
        }
    }

    private IActionResult? Validate(string title, DateTimeOffset start, DateTimeOffset? end)
    {
        if (string.IsNullOrWhiteSpace(title)) return BadRequest(new { error = "Title is required." });
        if (end.HasValue && end.Value <= start) return BadRequest(new { error = "End must be after start." });
        return null;
    }

    private static UserCalendarEventDto Map(GoogleEventListItem item)
    {
        var allDay = !string.IsNullOrEmpty(item.Start?.Date);
        return new UserCalendarEventDto
        {
            Id = item.Id,
            Title = string.IsNullOrWhiteSpace(item.Summary) ? "(untitled)" : item.Summary!,
            Start = ParseGoogleTime(item.Start) ?? DateTimeOffset.MinValue,
            End = ParseGoogleTime(item.End),
            AllDay = allDay,
            Location = item.Location,
            Notes = item.Description,
            ClausioType = item.ExtendedProperties?.Private?.GetValueOrDefault("clausioType") is { Length: > 0 } t ? t : null,
            CaseId = Guid.TryParse(item.ExtendedProperties?.Private?.GetValueOrDefault("clausioCase"), out var cid) ? cid : null,
            EventUrl = item.Id.Length > 0 ? $"https://calendar.google.com/calendar/render?eventid={item.Id}" : null,
        };
    }

    private static DateTimeOffset? ParseGoogleTime(GoogleEventTime? t)
    {
        if (t is null) return null;
        if (!string.IsNullOrEmpty(t.DateTime) && DateTimeOffset.TryParse(t.DateTime, out var dt)) return dt;
        if (!string.IsNullOrEmpty(t.Date) && DateOnly.TryParse(t.Date, out var d))
            return new DateTimeOffset(d, TimeOnly.MinValue, TimeSpan.Zero);
        return null;
    }

    private static DateTime? ParseDate(string? raw) =>
        DateTimeOffset.TryParse(raw, out var dto) ? dto.UtcDateTime : null;

    private GoogleEventTime EventTime(DateTimeOffset when) => new()
    {
        DateTime = when.ToString("yyyy-MM-dd'T'HH:mm:sszzz"),
        TimeZone = google.Settings.TimeZone,
    };

    private static string BuildDescription(string? notes, string? caseName, string? caseNumber, Guid? caseId, string? preservedLink = null)
    {
        var sb = new StringBuilder();
        if (!string.IsNullOrWhiteSpace(notes)) sb.AppendLine(notes.Trim());
        if (!string.IsNullOrWhiteSpace(caseName))
        {
            sb.AppendLine().AppendLine($"Case: {caseName}");
            if (!string.IsNullOrWhiteSpace(caseNumber)) sb.AppendLine($"Case No.: {caseNumber}");
        }
        if (!string.IsNullOrWhiteSpace(preservedLink))
            sb.AppendLine(preservedLink);
        else if (caseId.HasValue && !string.IsNullOrWhiteSpace(caseName))
            sb.Append($"Open in Clausio: open your dashboard to reach this case ({caseName}).");
        return sb.Length > 0 ? sb.ToString().TrimEnd() : "";
    }

    private IActionResult BadGateway(string message) =>
        StatusCode(StatusCodes.Status502BadGateway, new { error = message });
}
