using Clausio.Legal.Core.Dtos;
using Clausio.Legal.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Clausio.Legal.API.Controllers;

[Authorize]
[ApiController]
[Route("api/cases/{caseId:guid}/witnesses")]
public class WitnessesController(IWitnessService witnessService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(Guid caseId, CancellationToken cancellationToken) =>
        Ok(await witnessService.ListAsync(caseId, cancellationToken));

    [HttpPost]
    public async Task<IActionResult> Create(Guid caseId, CreateWitnessDto dto, CancellationToken cancellationToken) =>
        Ok(await witnessService.CreateAsync(caseId, dto, cancellationToken));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid caseId, Guid id, CancellationToken cancellationToken) =>
        await witnessService.DeleteAsync(caseId, id, cancellationToken) ? Ok() : NotFound();
}
