using Clausio.Legal.API.Extensions;
using Clausio.Legal.Core.Dtos;
using Clausio.Legal.Core.Entities;
using Clausio.Legal.Infrastructure;
using Clausio.Legal.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Clausio.Legal.API.Controllers;

[Authorize]
[ApiController]
[Route("api/cases/{caseId:guid}/meetings")]
public class MeetingsController(ClausioDbContext db, ICalendarSyncService calendarSync) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(Guid caseId, CancellationToken cancellationToken) =>
        Ok(await db.ClientMeetings.AsNoTracking()
            .Where(m => m.CaseId == caseId)
            .OrderByDescending(m => m.ScheduledAt)
            .ToListAsync(cancellationToken));

    [HttpPost]
    public async Task<IActionResult> Create(Guid caseId, CreateMeetingDto dto, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var owns = await db.Cases.AnyAsync(c => c.Id == caseId && c.CreatedByUserId == userId, cancellationToken);
        if (!owns) return NotFound();

        var meeting = new ClientMeeting
        {
            CaseId = caseId,
            CreatedByUserId = userId,
            Title = dto.Title.Trim(),
            ScheduledAt = dto.ScheduledAt,
            WithPerson = dto.WithPerson?.Trim(),
            Location = dto.Location?.Trim(),
            Notes = dto.Notes?.Trim(),
        };
        db.ClientMeetings.Add(meeting);
        await db.SaveChangesAsync(cancellationToken);

        // Auto-push to the connected Google Calendar (fire-and-forget, never blocks).
        calendarSync.QueueMeetingSync(meeting.Id);
        return Ok(meeting);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid caseId, Guid id, CancellationToken cancellationToken)
    {
        var count = await db.ClientMeetings.Where(m => m.CaseId == caseId && m.Id == id).ExecuteDeleteAsync(cancellationToken);
        if (count > 0) calendarSync.QueueRemoval("meeting", id);
        return count > 0 ? Ok() : NotFound();
    }
}
