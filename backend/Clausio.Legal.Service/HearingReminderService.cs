using Clausio.Legal.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Clausio.Legal.Service;

/// <summary>
/// Background worker that emails the client 3, 2 and 1 day(s) before each hearing.
/// Runs every 12 hours. A per-process guard prevents the same (hearing, day-offset)
/// reminder from being sent twice within a single run cycle window.
/// </summary>
public class HearingReminderService(
    IServiceScopeFactory scopeFactory,
    ILogger<HearingReminderService> logger
) : BackgroundService
{
    private static readonly int[] ReminderDays = { 3, 2, 1 };

    // Guards against duplicate sends across the 12h loop: key = "{hearingId}:{days}:{hearingDate:yyyyMMdd}"
    private readonly HashSet<string> _sent = new();

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("[HearingReminder] Service started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SendRemindersAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError("[HearingReminder] Error: {Error}", ex.Message);
            }

            // Run once every 12 hours
            await Task.Delay(TimeSpan.FromHours(12), stoppingToken);
        }
    }

    private async Task SendRemindersAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ClausioDbContext>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var today = DateTime.UtcNow.Date;

        foreach (var days in ReminderDays)
        {
            var targetDate = today.AddDays(days);
            var nextDate = targetDate.AddDays(1);

            var hearings = await db.Hearings
                .Include(h => h.Case)
                .Where(h => h.HearingDate >= targetDate
                            && h.HearingDate < nextDate
                            && h.Case != null)
                .ToListAsync(ct);

            foreach (var hearing in hearings)
            {
                var caseName = hearing.Case?.Name
                    ?? hearing.Case?.CaseNumber
                    ?? "Your Case";
                var caseNumber = hearing.Case?.CaseNumber ?? "";

                // Resolve the recipient: per-hearing ClientReminderEmail wins, else the case client's email.
                string? email;
                string name;
                if (!string.IsNullOrWhiteSpace(hearing.ClientReminderEmail))
                {
                    email = hearing.ClientReminderEmail.Trim();
                    name = "Client";
                }
                else
                {
                    var client = hearing.Case is null
                        ? null
                        : await db.Clients.FirstOrDefaultAsync(
                            c => c.Id == hearing.Case.ClientId && c.Email != null && c.Email != "", ct);
                    email = client?.Email;
                    name = string.IsNullOrWhiteSpace(client?.FirstName) ? "Client" : client!.FirstName!;
                }

                if (string.IsNullOrWhiteSpace(email))
                    continue;

                var key = $"{hearing.Id}:{days}:{email}";
                if (!_sent.Add(key))
                    continue;

                var subject = days == 1
                    ? "⚖️ Court Hearing Tomorrow — Please Be Ready"
                    : $"⚖️ Court Hearing in {days} Days — Reminder";

                var html = BuildReminderHtml(name, caseName, caseNumber, hearing.HearingDate, days);

                var ok = await emailService.SendEmailAsync(email, name, subject, html, ct);

                if (!ok)
                    _sent.Remove(key); // allow a retry on the next cycle
            }
        }
    }

    public static string BuildReminderHtml(
        string clientName,
        string caseName,
        string caseNumber,
        DateTime hearingDate,
        int daysAway)
    {
        var dateStr = hearingDate.ToString("dd MMMM yyyy");
        var dayWord = daysAway <= 0
            ? "today"
            : daysAway == 1 ? "tomorrow" : $"in {daysAway} days";

        var caseNumberRow = string.IsNullOrEmpty(caseNumber)
            ? ""
            : $"""
                <tr>
                  <td style="color: #64748b; padding: 6px 0;">Case Number:</td>
                  <td style="font-weight: 600;">{caseNumber}</td>
                </tr>
                """;

        return $"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto; padding: 20px;">

          <div style="background: #2563eb; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: #fff; margin: 0; font-size: 20px;">⚖️ Court Hearing Reminder</h2>
          </div>

          <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">

            <p style="font-size: 15px;">Dear {clientName},</p>

            <p style="font-size: 15px; line-height: 1.6;">
              This is a gentle reminder that your court hearing is scheduled
              <strong>{dayWord}</strong>.
            </p>

            <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="color: #64748b; padding: 6px 0; width: 140px;">Case:</td>
                  <td style="font-weight: 600; color: #0f172a;">{caseName}</td>
                </tr>
                {caseNumberRow}
                <tr>
                  <td style="color: #64748b; padding: 6px 0;">Hearing Date:</td>
                  <td style="font-weight: 600; color: #2563eb;">{dateStr}</td>
                </tr>
              </table>
            </div>

            <p style="font-size: 14px; color: #64748b; line-height: 1.6;">
              Please ensure you are available on the hearing date. If you have any
              questions, please contact your advocate.
            </p>

            <p style="font-size: 15px; margin-top: 24px;">
              Warm regards,<br/>
              <strong>Clausio Legal Platform</strong>
            </p>

          </div>

          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 16px;">
            This is an automated reminder sent via Clausio Legal Platform.
          </p>

        </body>
        </html>
        """;
    }
}
