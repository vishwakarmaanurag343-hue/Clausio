using Clausio.Legal.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Clausio.Legal.API.Controllers;

[Authorize]
[ApiController]
[Route("api/settings/billing")]
public class SettingsBillingController(
    ClausioDbContext db) : ControllerBase
{
    private Guid UserId => Guid.TryParse(
        User?.FindFirstValue(ClaimTypes.NameIdentifier),
        out var id) ? id : Guid.Empty;

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(
        CancellationToken ct)
    {
        var me = UserId;
        var sub = await db.UserSubscriptions
            .AsNoTracking()
            .FirstOrDefaultAsync(
                s => s.UserId == me, ct);

        if (sub == null)
        {
            return Ok(new
            {
                PlanName = "Free Trial",
                Status = "Trial",
                DaysRemaining = 14,
                EndDate = DateTime.UtcNow.AddDays(14),
                TotalAmount = 0m,
                IsAnnual = false,
                MaxCases = 5,
                MaxDraftsPerMonth = 10,
                MaxTeamMembers = 1
            });
        }

        var daysRemaining = Math.Max(0,
            (int)(sub.EndDate - DateTime.UtcNow)
            .TotalDays);

        return Ok(new
        {
            sub.PlanName,
            sub.Status,
            DaysRemaining = daysRemaining,
            sub.EndDate,
            sub.TotalAmount,
            sub.IsAnnual,
            sub.MaxCases,
            sub.MaxDraftsPerMonth,
            sub.MaxTeamMembers
        });
    }
}
