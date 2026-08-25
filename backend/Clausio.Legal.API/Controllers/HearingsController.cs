using Clausio.Legal.Core.Dtos;
using Clausio.Legal.Core.Entities;
using Clausio.Legal.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Clausio.Legal.API.Controllers;

[Authorize]
[ApiController]
[Route("api/cases/{caseId:guid}/hearings")]
public class HearingsController(IHearingService hearingService, ICalendarSyncService calendarSync) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(Guid caseId, CancellationToken cancellationToken) =>
        Ok(await hearingService.ListAsync(caseId, cancellationToken));

    [HttpPost]
    public async Task<IActionResult> Create(Guid caseId, CreateHearingDto dto, CancellationToken cancellationToken)
    {
        var hearing = await hearingService.CreateAsync(caseId, dto, cancellationToken);
        calendarSync.QueueHearingSync(caseId, hearing.Id);   // auto-push (30-day window)
        return Ok(hearing);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid caseId, Guid id, UpdateHearingDto dto, CancellationToken cancellationToken)
    {
        var hearing = await hearingService.UpdateAsync(caseId, id, dto, cancellationToken);
        if (hearing is null) return NotFound();
        // Reschedule / adjournment both land here — re-syncs the Google event in place.
        calendarSync.QueueHearingSync(caseId, hearing.Id);
        foreach (var order in hearing.Orders ?? new List<HearingOrder>())
            if (!order.Done && order.Deadline != default) calendarSync.QueueOrderSync(order.Id);
        return Ok(hearing);
    }

    [HttpPut("{id:guid}/orders/{orderId:guid}/done")]
    public async Task<IActionResult> MarkOrderDone(Guid caseId, Guid id, Guid orderId, CancellationToken cancellationToken)
    {
        var order = await hearingService.SetOrderDoneAsync(caseId, id, orderId, cancellationToken);
        if (order is null) return NotFound();
        calendarSync.QueueOrderSync(orderId);   // updates event to "[COMPLETED]", drops reminders
        return Ok(order);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid caseId, Guid id, CancellationToken cancellationToken)
    {
        var deleted = await hearingService.DeleteAsync(caseId, id, cancellationToken);
        if (deleted) calendarSync.QueueRemoval("hearing", id);
        return deleted ? Ok() : NotFound();
    }
}
