using Clausio.Legal.Core.Dtos;
using Clausio.Legal.Infrastructure;
using Clausio.Legal.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Clausio.Legal.API.Controllers;

[Authorize]
[ApiController]
[Route("api/subscription")]
public class SubscriptionController(
    ISubscriptionService subscriptionService,
    ClausioDbContext db) : ControllerBase
{
    private Guid UserId
    {
        get
        {
            var val = User?.FindFirstValue(
                ClaimTypes.NameIdentifier);
            return Guid.TryParse(val, out var parsed)
                ? parsed : Guid.Empty;
        }
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus(
        CancellationToken ct)
    {
        var status = await subscriptionService
            .GetStatusAsync(UserId, ct);
        return Ok(status);
    }

    // Lightweight gate check used by the frontend TrialBanner / AI enforcement.
    [HttpGet("check")]
    public async Task<IActionResult> Check(CancellationToken ct)
    {
        var sub = await db.UserSubscriptions
            .FirstOrDefaultAsync(s => s.UserId == UserId, ct);

        if (sub == null)
        {
            // First-time user — provision the free trial (mirrors GetStatusAsync).
            sub = new Core.Entities.UserSubscription
            {
                UserId = UserId,
                PlanName = "Free Trial",
                Status = "Trial",
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(5),
                MaxCases = 3,
                MaxDraftsPerMonth = 5,
                MaxTeamMembers = 1,
                MaxStorageBytes = 1073741824
            };
            db.UserSubscriptions.Add(sub);
            await db.SaveChangesAsync(ct);
        }

        var daysRemaining = Math.Max(0,
            (int)(sub.EndDate - DateTime.UtcNow).TotalDays);

        var isActive =
            sub.Status == "Active" ||
            sub.Status == "Trial";

        var isExpired = sub.EndDate < DateTime.UtcNow;

        if (isExpired && sub.Status != "Cancelled")
        {
            sub.Status = "Expired";
            await db.SaveChangesAsync(ct);
        }

        return Ok(new
        {
            isActive = isActive && !isExpired,
            canUseAI = isActive && !isExpired,
            planName = sub.PlanName,
            status = isExpired ? "Expired" : sub.Status,
            daysRemaining,
            endDate = sub.EndDate,
            isTrial = sub.PlanName == "Free Trial",
            showWarning = daysRemaining <= 3 && daysRemaining > 0,
            message = isExpired
                ? "Your trial has expired. Please upgrade to continue."
                : daysRemaining <= 3
                ? $"Your trial expires in {daysRemaining} day{(daysRemaining == 1 ? "" : "s")}. Upgrade now."
                : null
        });
    }

    [HttpGet("plans")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPlans(
        CancellationToken ct)
    {
        var plans = await subscriptionService
            .GetPlansAsync(ct);
        return Ok(plans);
    }

    [HttpPost("create-order")]
    public async Task<IActionResult> CreateOrder(
        [FromBody] CreateSubscriptionOrderDto dto,
        CancellationToken ct)
    {
        try
        {
            var order = await subscriptionService
                .CreateOrderAsync(UserId, dto, ct);
            return Ok(order);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("verify-payment")]
    public async Task<IActionResult> VerifyPayment(
        [FromBody] VerifySubscriptionPaymentDto dto,
        CancellationToken ct)
    {
        var success = await subscriptionService
            .VerifyAndActivateAsync(UserId, dto, ct);
        return success
            ? Ok(new { success = true })
            : BadRequest(new { error = "Payment verification failed." });
    }

    [HttpGet("billing-history")]
    public async Task<IActionResult> GetBillingHistory(
        CancellationToken ct)
    {
        var history = await subscriptionService
            .GetBillingHistoryAsync(UserId, ct);
        return Ok(history);
    }

    [HttpPost("cancel")]
    public async Task<IActionResult> Cancel(
        [FromBody] CancelSubscriptionDto dto,
        CancellationToken ct)
    {
        var success = await subscriptionService
            .CancelAsync(UserId, dto, ct);
        return success
            ? Ok(new { success = true })
            : NotFound();
    }
}
