using Clausio.Legal.Core.Entities;
using Clausio.Legal.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Clausio.Legal.API.Controllers;

[Authorize]
[ApiController]
[Route("api/notification-settings")]
public class NotificationSettingsController(
    ClausioDbContext db) : ControllerBase
{
    private Guid UserId => Guid.TryParse(
        User?.FindFirstValue(ClaimTypes.NameIdentifier),
        out var id) ? id : Guid.Empty;

    [HttpGet]
    public async Task<IActionResult> Get(
        CancellationToken ct)
    {
        var me = UserId;
        var settings = await db.UserNotificationSettings
            .FirstOrDefaultAsync(
                s => s.UserId == me, ct);

        if (settings == null)
        {
            settings = new UserNotificationSettings
                { UserId = me };
            db.UserNotificationSettings.Add(settings);
            await db.SaveChangesAsync(ct);
        }

        return Ok(settings);
    }

    [HttpPut]
    public async Task<IActionResult> Update(
        [FromBody] UserNotificationSettings dto,
        CancellationToken ct)
    {
        var me = UserId;
        var settings = await db.UserNotificationSettings
            .FirstOrDefaultAsync(
                s => s.UserId == me, ct);

        if (settings == null)
        {
            settings = new UserNotificationSettings
                { UserId = me };
            db.UserNotificationSettings.Add(settings);
        }

        settings.EmailNotif = dto.EmailNotif;
        settings.DesktopNotif = dto.DesktopNotif;
        settings.WhatsappNotif = dto.WhatsappNotif;
        settings.SmsNotif = dto.SmsNotif;
        settings.UpcomingHearings = dto.UpcomingHearings;
        settings.DeadlineReminders = dto.DeadlineReminders;
        settings.NewCaseAssignment = dto.NewCaseAssignment;
        settings.DocumentUpload = dto.DocumentUpload;
        settings.DraftCompleted = dto.DraftCompleted;
        settings.StrategyGenerated = dto.StrategyGenerated;
        settings.FinancialAnalysis = dto.FinancialAnalysis;
        settings.ReadinessReport = dto.ReadinessReport;
        settings.ClientMessage = dto.ClientMessage;
        settings.WhatsappDelivery = dto.WhatsappDelivery;
        settings.ClientPortal = dto.ClientPortal;
        settings.InvoiceGenerated = dto.InvoiceGenerated;
        settings.PaymentReceived = dto.PaymentReceived;
        settings.SubscriptionRenew = dto.SubscriptionRenew;
        settings.DigestFrequency = dto.DigestFrequency;
        settings.ReminderTime = dto.ReminderTime;
        settings.HearingReminderHours =
            dto.HearingReminderHours;

        await db.SaveChangesAsync(ct);
        return Ok(settings);
    }
}
