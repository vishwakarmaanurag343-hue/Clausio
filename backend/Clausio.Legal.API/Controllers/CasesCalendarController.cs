using Clausio.Legal.API.Extensions;
using Clausio.Legal.Core.Dtos;
using Clausio.Legal.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Clausio.Legal.API.Controllers;

[Authorize]
[ApiController]
[Route("api/cases/{caseId:guid}/calendar")]
public class CasesCalendarController(ICalendarSyncService calendarSync) : ControllerBase
{

    /// <summary>Manual "Add to Calendar" for one hearing (returns the Google event link).</summary>
    [HttpPost("hearings/{hearingId:guid}")]
    public async Task<IActionResult> PushHearing(Guid caseId, Guid hearingId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await calendarSync.PushHearingAsync(caseId, hearingId, enforceThirtyDayWindow: false, cancellationToken);
            return result.Pushed ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new Clausio.Legal.Core.Dtos.PushResultDto { Pushed = false, Error = ex.Message });
        }
    }

    /// <summary>Manual "Add to Calendar" for one court-order deadline.</summary>
    [HttpPost("orders/{orderId:guid}")]
    public async Task<IActionResult> PushOrder(Guid caseId, Guid orderId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await calendarSync.PushOrderAsync(orderId, cancellationToken);
            return result.Pushed ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new Clausio.Legal.Core.Dtos.PushResultDto { Pushed = false, Error = ex.Message });
        }
    }
}
