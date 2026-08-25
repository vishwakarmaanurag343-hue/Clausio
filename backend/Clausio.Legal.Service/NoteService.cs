using Clausio.Legal.Core.Dtos;
using Clausio.Legal.Core.Entities;
using Clausio.Legal.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Clausio.Legal.Service;

public interface INoteService
{
    Task<List<Note>> ListAsync(Guid caseId, CancellationToken cancellationToken = default);
    Task<Note> CreateAsync(Guid caseId, CreateNoteDto dto, CancellationToken cancellationToken = default);
    Task<Note?> UpdateAsync(Guid caseId, Guid id, UpdateNoteDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid caseId, Guid id, CancellationToken cancellationToken = default);
}

public class NoteService(ClausioDbContext db) : INoteService
{
    // Pinned first, then most recently edited
    public Task<List<Note>> ListAsync(Guid caseId, CancellationToken cancellationToken = default)
        => db.Notes.AsNoTracking()
            .Where(n => n.CaseId == caseId)
            .OrderByDescending(n => n.Pinned)
            .ThenByDescending(n => n.UpdatedAt)
            .ToListAsync(cancellationToken);

    public async Task<Note> CreateAsync(Guid caseId, CreateNoteDto dto, CancellationToken cancellationToken = default)
    {
        var note = new Note { CaseId = caseId, Tag = dto.Tag?.Trim() ?? "", Body = dto.Body.Trim() };
        db.Notes.Add(note);
        await db.SaveChangesAsync(cancellationToken);
        return note;
    }

    public async Task<Note?> UpdateAsync(Guid caseId, Guid id, UpdateNoteDto dto, CancellationToken cancellationToken = default)
    {
        var note = await db.Notes.FirstOrDefaultAsync(n => n.CaseId == caseId && n.Id == id, cancellationToken);
        if (note is null) return null;

        if (dto.Tag is not null) note.Tag = dto.Tag.Trim();
        if (dto.Body is not null) note.Body = dto.Body.Trim();
        if (dto.Pinned is not null) note.Pinned = dto.Pinned.Value;
        await db.SaveChangesAsync(cancellationToken);   // UpdatedAt auto-touched
        return note;
    }

    public async Task<bool> DeleteAsync(Guid caseId, Guid id, CancellationToken cancellationToken = default)
    {
        var count = await db.Notes.Where(n => n.CaseId == caseId && n.Id == id).ExecuteDeleteAsync(cancellationToken);
        return count > 0;
    }
}
