using Clausio.Legal.Infrastructure;
using Clausio.Legal.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Clausio.Legal.API.Controllers;

// Manual "send hearing reminder now" — sits at /api/hearings/{id}/send-reminder so it is not nested
// under a caseId route (the automated worker is HearingReminderService).
[Authorize]
[ApiController]
[Route("api/hearings")]
public class HearingRemindersController(ClausioDbContext db, IEmailService emailService) : ControllerBase
{
    [HttpPost("{hearingId:guid}/send-reminder")]
    public async Task<IActionResult> SendReminder(Guid hearingId, CancellationToken ct)
    {
        var hearing = await db.Hearings
            .Include(h => h.Case)
            .FirstOrDefaultAsync(h => h.Id == hearingId, ct);

        if (hearing is null)
            return NotFound();

        // Recipient: per-hearing ClientReminderEmail wins, else the case client's email.
        string? email = hearing.ClientReminderEmail;
        string name = "Client";

        if (string.IsNullOrWhiteSpace(email))
        {
            var client = hearing.Case is null
                ? null
                : await db.Clients.FirstOrDefaultAsync(c => c.Id == hearing.Case.ClientId, ct);
            email = client?.Email;
            name = string.IsNullOrWhiteSpace(client?.FirstName) ? "Client" : client!.FirstName!;
        }

        if (string.IsNullOrWhiteSpace(email))
            return BadRequest(new { error = "No email address found. Add client email to this hearing." });

        var caseName = hearing.Case?.Name
            ?? hearing.Case?.CaseNumber
            ?? "Your Case";

        var daysAway = (int)(hearing.HearingDate.Date - DateTime.UtcNow.Date).TotalDays;

        var subject = daysAway <= 1
            ? "⚖️ Court Hearing Tomorrow — Please Be Ready"
            : daysAway <= 3
                ? $"⚖️ Court Hearing in {daysAway} Days — Reminder"
                : "⚖️ Upcoming Court Hearing — Reminder";

        var html = HearingReminderService.BuildReminderHtml(
            name,
            caseName,
            hearing.Case?.CaseNumber ?? "",
            hearing.HearingDate,
            daysAway);

        var success = await emailService.SendEmailAsync(email.Trim(), name, subject, html, ct);

        return success
            ? Ok(new { success = true, sentTo = email.Trim(), message = $"Reminder sent to {email.Trim()}" })
            : StatusCode(500, new { error = "Failed to send reminder." });
    }
}
