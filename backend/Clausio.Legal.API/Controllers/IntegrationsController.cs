using Clausio.Legal.API.Extensions;
using Clausio.Legal.Infrastructure.Google;
using Clausio.Legal.Core.Entities;
using Clausio.Legal.Infrastructure;
using Clausio.Legal.Service;
using Clausio.Legal.Service.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Clausio.Legal.API.Controllers;

[Authorize]
[ApiController]
[Route("api/integrations/google")]
public class IntegrationsController(
    GoogleCalendarClient google,
    ICalendarSyncService calendarSync,
    ClausioDbContext db,
    IEncryptionService encryption) : ControllerBase
{
    /// <summary>Consent URL the frontend opens to start the OAuth flow.</summary>
    [HttpGet("auth-url")]
    public IActionResult AuthUrl()
    {
        if (!google.IsConfigured)
            return BadRequest(new { error = "Google Calendar integration is not configured on this server. Add ClientId/ClientSecret to appsettings." });

        return Ok(new { url = google.BuildAuthUrl(User.GetUserId().ToString()) });
    }

    /// <summary>Google redirects here after consent. Exchanges the code and stores
    /// the refresh token AES-encrypted against the lawyer's account.</summary>
    [AllowAnonymous]
    [HttpGet("callback")]
    public async Task<IActionResult> Callback([FromQuery] string code, [FromQuery] string state, CancellationToken cancellationToken)
    {
        var frontend = google.Settings.FrontendUrl;
        if (!Guid.TryParse(state, out var userId))
            return Redirect($"{frontend}/settings?section=Integrations&error=invalid_state");
        try
        {
            var tokens = await google.ExchangeCodeAsync(code, cancellationToken);
            if (string.IsNullOrWhiteSpace(tokens.RefreshToken))
                return Redirect($"{frontend}/settings?section=Integrations&error=no_refresh_token");

            var existing = await db.CalendarIntegrations.FirstOrDefaultAsync(i => i.UserId == userId, cancellationToken);
            if (existing is null)
            {
                db.CalendarIntegrations.Add(new CalendarIntegration
                {
                    UserId = userId,
                    EncryptedRefreshToken = encryption.Encrypt(tokens.RefreshToken),
                });
            }
            else
            {
                existing.EncryptedRefreshToken = encryption.Encrypt(tokens.RefreshToken);
                existing.LastSyncError = null;
            }
            await db.SaveChangesAsync(cancellationToken);

            // Best-effort initial sync so events appear immediately.
            _ = calendarSync.FullResyncAsync(userId, cancellationToken);
            return Redirect($"{frontend}/settings?section=Integrations&connected=1");
        }
        catch (Exception ex)
        {
            return Redirect($"{frontend}/settings?section=Integrations&error={Uri.EscapeDataString(ex.Message)}");
        }
    }

    [HttpGet("status")]
    public async Task<IActionResult> Status(CancellationToken cancellationToken) =>
        Ok(await calendarSync.GetStatusAsync(User.GetUserId(), cancellationToken));

    /// <summary>Manual full re-sync: 30-day hearings + open deadlines + meetings.</summary>
    [HttpPost("sync")]
    public async Task<IActionResult> Sync(CancellationToken cancellationToken)
    {
        try
        {
            var pushed = await calendarSync.FullResyncAsync(User.GetUserId(), cancellationToken);
            return Ok(new { pushed });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete]
    public async Task<IActionResult> Disconnect(CancellationToken cancellationToken)
    {
        await calendarSync.DisconnectAsync(User.GetUserId(), cancellationToken);
        return Ok();
    }
}
