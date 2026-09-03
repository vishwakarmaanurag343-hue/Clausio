using Clausio.Legal.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Clausio.Legal.API.Filters;

/// <summary>
/// Blocks AI-generation endpoints for authenticated users whose trial / subscription
/// has lapsed. The Service layer (AIPipeline) has no access to the current user or
/// HttpContext, so enforcement lives here at the controller boundary — the same layer
/// where every other auth decision in this codebase is made.
///
/// Anonymous requests and requests without a resolvable user id pass through untouched.
/// A blocked request short-circuits with HTTP 400 and a "SUBSCRIPTION_EXPIRED:" message
/// so the frontend can redirect the advocate to /billing.
/// </summary>
public sealed class RequireActiveSubscriptionAttribute : Attribute, IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(
        ActionExecutingContext context, ActionExecutionDelegate next)
    {
        // ═══════════════════════════════════════════════════════════════════
        // SUBSCRIPTION ENFORCEMENT — TEMPORARILY DISABLED FOR LAUNCH (26 Sep 2026)
        // Nothing is deleted. The credit / wallet system in AIPipeline stays
        // fully active — only this trial/subscription gate is off.
        //
        // ENABLE AFTER PAID PLANS GO LIVE:
        //   1. delete the two lines below ("await next(); return;")
        //   2. delete the "/*" and "*/" that wrap the original body
        // ═══════════════════════════════════════════════════════════════════
        await next();
        return;

        /*  ── ENABLE AFTER PAID PLANS GO LIVE ──
        var user = context.HttpContext.User;
        if (user?.Identity?.IsAuthenticated != true)
        {
            await next();
            return;
        }

        var idValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(idValue, out var userId) || userId == Guid.Empty)
        {
            await next();
            return;
        }

        var db = context.HttpContext.RequestServices
            .GetRequiredService<ClausioDbContext>();
        var ct = context.HttpContext.RequestAborted;

        var sub = await db.UserSubscriptions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId, ct);

        var blocked = sub == null
            || sub.EndDate < DateTime.UtcNow
            || (sub.Status != "Active" && sub.Status != "Trial");

        if (blocked)
        {
            context.Result = new ObjectResult(new
            {
                message = "SUBSCRIPTION_EXPIRED: Your trial has expired. "
                    + "Please upgrade to continue using Clausio.",
                status = 400,
                timestamp = DateTime.UtcNow
            })
            {
                StatusCode = 400
            };
            return;
        }

        await next();
        */
    }
}
