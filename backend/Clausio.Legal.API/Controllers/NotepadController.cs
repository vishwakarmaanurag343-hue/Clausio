using Clausio.Legal.API.Extensions;
using Clausio.Legal.Core.Dtos;
using Clausio.Legal.Core.Entities;
using Clausio.Legal.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Clausio.Legal.API.Controllers;

/// <summary>
/// Cloud sync for the Floating Notes panel. Route "api/notes" (distinct from the
/// per-case tagged Notes at api/cases/{caseId}/notes). Every row is scoped to the
/// signed-in user; CaseId null == the user's general notes.
/// </summary>
[Authorize]
[ApiController]
[Route("api/notes")]
public class NotepadController(ClausioDbContext db) : ControllerBase
{
    // GET /api/notes            → general notes (CaseId == null)
    // GET /api/notes?caseId=... → notes for that case
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? caseId, CancellationToken ct)
    {
        var userId = User.GetUserId();
        var notes = await db.CaseNotes.AsNoTracking()
            .Where(n => n.UserId == userId && n.CaseId == caseId)
            .OrderBy(n => n.Category)
            .ToListAsync(ct);
        return Ok(notes);
    }

    // GET /api/notes/general → general notes (CaseId == null)
    [HttpGet("general")]
    public async Task<IActionResult> General(CancellationToken ct)
    {
        var userId = User.GetUserId();
        var notes = await db.CaseNotes.AsNoTracking()
            .Where(n => n.UserId == userId && n.CaseId == null)
            .OrderBy(n => n.Category)
            .ToListAsync(ct);
        return Ok(notes);
    }

    // GET /api/notes/all → every note this user has saved (with case name), newest first.
    // Powers the "All Notes" reference view in the Floating Notes panel.
    [HttpGet("all")]
    public async Task<IActionResult> All(CancellationToken ct)
    {
        var userId = User.GetUserId();
        var notes = await db.CaseNotes.AsNoTracking()
            .Where(n => n.UserId == userId && n.Content != "")
            .OrderByDescending(n => n.UpdatedAt)
            .Select(n => new
            {
                n.Id,
                n.CaseId,
                CaseName = n.CaseId == null
                    ? null
                    : db.Cases.Where(c => c.Id == n.CaseId).Select(c => c.Name).FirstOrDefault(),
                n.Category,
                n.Content,
                n.CreatedAt,
                n.UpdatedAt,
            })
            .ToListAsync(ct);
        return Ok(notes);
    }

    // POST /api/notes → upsert one (case, category) note for this user
    [HttpPost]
    public async Task<IActionResult> Save([FromBody] SaveCaseNoteDto dto, CancellationToken ct)
    {
        var userId = User.GetUserId();
        var category = string.IsNullOrWhiteSpace(dto.Category) ? "General" : dto.Category.Trim();
        var content = dto.Content ?? "";

        var note = await db.CaseNotes.FirstOrDefaultAsync(
            n => n.UserId == userId && n.CaseId == dto.CaseId && n.Category == category, ct);

        if (note is null)
        {
            note = new CaseNote
            {
                UserId = userId,
                CaseId = dto.CaseId,
                Category = category,
                Content = content,
            };
            db.CaseNotes.Add(note);
        }
        else
        {
            note.Content = content;
            note.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);
        return Ok(note);
    }

    // DELETE /api/notes/{id} → delete one of this user's notes
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var userId = User.GetUserId();
        var note = await db.CaseNotes.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId, ct);
        if (note is null) return NotFound();

        db.CaseNotes.Remove(note);
        await db.SaveChangesAsync(ct);
        return Ok(new { deleted = id });
    }
}
