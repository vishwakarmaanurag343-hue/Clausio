using Clausio.Legal.Core.Dtos;
using Clausio.Legal.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Clausio.Legal.API.Controllers;

[Authorize]
[ApiController]
[Route("api/subscription")]
public class SubscriptionController(
    ISubscriptionService subscriptionService) : ControllerBase
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
