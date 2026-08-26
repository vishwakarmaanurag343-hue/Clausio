using Clausio.Legal.API.Extensions;
using Clausio.Legal.Core.Dtos;
using Clausio.Legal.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Clausio.Legal.API.Controllers;

[Authorize]
[ApiController]
[Route("api/drafts")]
public class DraftsController(IDraftService draftService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(CreateDraftDto dto, CancellationToken cancellationToken)
    {
        if (dto.CaseId == Guid.Empty) return BadRequest(new { error = "CaseId is required." });
        if (string.IsNullOrWhiteSpace(dto.Content)) return BadRequest(new { error = "Draft content is required." });
        return Ok(await draftService.CreateAsync(dto, User.GetUserId(), cancellationToken));
    }

    [HttpGet("case/{caseId:guid}")]
    public async Task<IActionResult> ListForCase(Guid caseId, CancellationToken cancellationToken) =>
        Ok(await draftService.ListForCaseAsync(caseId, cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var draft = await draftService.GetAsync(id, cancellationToken);
        return draft is null ? NotFound() : Ok(draft);
    }

    /// <summary>
    /// Append a new immutable version (never overwrites). Allowed even on a finalised
    /// draft — that is the explicit "create new version from Final" path; the new
    /// version starts life as "Draft" again.
    /// </summary>
    [HttpPost("{id:guid}/versions")]
    public async Task<IActionResult> AddVersion(Guid id, AddDraftVersionDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Content)) return BadRequest(new { error = "Draft content is required." });
        var draft = await draftService.AddVersionAsync(id, dto, User.GetUserId(), cancellationToken);
        return draft is null ? NotFound() : Ok(draft);
    }

    /// <summary>Marks the latest version "Final". Read-only until someone explicitly creates a new version from it.</summary>
    [HttpPatch("{id:guid}/finalize")]
    public async Task<IActionResult> Finalize(Guid id, CancellationToken cancellationToken)
    {
        var draft = await draftService.FinalizeAsync(id, cancellationToken);
        return draft is null ? NotFound() : Ok(draft);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken) =>
        await draftService.DeleteAsync(id, cancellationToken) ? Ok() : NotFound();

    /// <summary>Delete a single historical version. The last remaining version cannot be deleted.</summary>
    [HttpDelete("{id:guid}/versions/{versionNumber:int}")]
    public async Task<IActionResult> DeleteVersion(Guid id, int versionNumber, CancellationToken cancellationToken)
    {
        var (ok, error, draft) = await draftService.DeleteVersionAsync(id, versionNumber, cancellationToken);
        if (ok) return Ok(draft);
        return error is null ? NotFound() : BadRequest(new { error });
    }
}
