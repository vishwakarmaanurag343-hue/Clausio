using Clausio.Legal.Core.Dtos;
using Clausio.Legal.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Clausio.Legal.API.Controllers;

[Authorize]
[ApiController]
[Route("api/cases/{caseId:guid}/notes")]
public class NotesController(INoteService noteService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(Guid caseId, CancellationToken cancellationToken) =>
        Ok(await noteService.ListAsync(caseId, cancellationToken));

    [HttpPost]
    public async Task<IActionResult> Create(Guid caseId, CreateNoteDto dto, CancellationToken cancellationToken) =>
        Ok(await noteService.CreateAsync(caseId, dto, cancellationToken));

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid caseId, Guid id, UpdateNoteDto dto, CancellationToken cancellationToken) =>
        await noteService.UpdateAsync(caseId, id, dto, cancellationToken) is { } note ? Ok(note) : NotFound();

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid caseId, Guid id, CancellationToken cancellationToken) =>
        await noteService.DeleteAsync(caseId, id, cancellationToken) ? Ok() : NotFound();
}
