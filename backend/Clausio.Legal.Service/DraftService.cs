using Clausio.Legal.Core.Dtos;
using Clausio.Legal.Core.Entities;
using Clausio.Legal.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Clausio.Legal.Service;

public interface IDraftService
{
    Task<DraftDto> CreateAsync(CreateDraftDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<List<DraftDto>> ListForCaseAsync(Guid caseId, CancellationToken cancellationToken = default);
    Task<DraftDto?> GetAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DraftDto?> AddVersionAsync(Guid id, AddDraftVersionDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<DraftDto?> FinalizeAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>Deletes one version. Refuses to remove the last remaining version.</summary>
    Task<(bool Ok, string? Error, DraftDto? Draft)> DeleteVersionAsync(Guid id, int versionNumber, CancellationToken cancellationToken = default);
}

public class DraftService(ClausioDbContext db) : IDraftService
{
    public async Task<DraftDto> CreateAsync(CreateDraftDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var draftType = string.IsNullOrWhiteSpace(dto.DraftType) ? "Legal Draft" : dto.DraftType!;
        var draft = new Draft
        {
            CaseId = dto.CaseId,
            DraftType = draftType,
            Title = string.IsNullOrWhiteSpace(dto.Title) ? draftType : dto.Title!,
            CreatedByUserId = userId
        };
        draft.Versions.Add(new DraftVersion
        {
            VersionNumber = 1,
            Content = dto.Content,
            EditedByUserId = userId,
            EditedAt = DateTime.UtcNow,
            Status = "Draft"
        });
        db.Drafts.Add(draft);
        await db.SaveChangesAsync(cancellationToken);
        return await MapDetailAsync(draft.Id, cancellationToken);
    }

    public async Task<List<DraftDto>> ListForCaseAsync(Guid caseId, CancellationToken cancellationToken = default)
    {
        var drafts = await db.Drafts.AsNoTracking()
            .Where(d => d.CaseId == caseId)
            .ToListAsync(cancellationToken);
        return await MapListAsync(drafts, includeVersions: false, cancellationToken);
    }

    public async Task<DraftDto?> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        if (!await db.Drafts.AsNoTracking().AnyAsync(d => d.Id == id, cancellationToken)) return null;
        return await MapDetailAsync(id, cancellationToken);
    }

    // Appends an immutable new revision — existing versions are never touched.
    // Explicitly allowed on a finalised draft: that is the sanctioned
    // "create new version from Final" path; the new version starts as "Draft" again.
    public async Task<DraftDto?> AddVersionAsync(Guid id, AddDraftVersionDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var draft = await db.Drafts.Include(d => d.Versions)
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);
        if (draft is null) return null;

        var next = draft.Versions.Count == 0 ? 1 : draft.Versions.Max(v => v.VersionNumber) + 1;
        var version = new DraftVersion
        {
            DraftId = id,
            VersionNumber = next,
            Content = dto.Content,
            EditedByUserId = userId,
            EditedAt = DateTime.UtcNow,
            Status = "Draft"
        };
        // Explicit DbSet.Add — a pre-initialised Guid key would otherwise make EF
        // treat this navigation-discovered child as an existing row and emit UPDATE.
        db.DraftVersions.Add(version);
        draft.Versions.Add(version);
        await db.SaveChangesAsync(cancellationToken);
        return await MapDetailAsync(id, cancellationToken);
    }

    // Marks the LATEST version "Final". A Final version is never mutated afterwards —
    // further change goes through AddVersionAsync above.
    public async Task<DraftDto?> FinalizeAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var draft = await db.Drafts.Include(d => d.Versions)
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);
        var latest = draft?.Versions.OrderByDescending(v => v.VersionNumber).FirstOrDefault();
        if (draft is null || latest is null) return null;

        if (!string.Equals(latest.Status, "Final", StringComparison.OrdinalIgnoreCase))
        {
            latest.Status = "Final";
            await db.SaveChangesAsync(cancellationToken);
        }
        return await MapDetailAsync(id, cancellationToken);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var draft = await db.Drafts.FirstOrDefaultAsync(d => d.Id == id, cancellationToken);
        if (draft is null) return false;
        db.Drafts.Remove(draft);   // versions go via the DB cascade
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<(bool Ok, string? Error, DraftDto? Draft)> DeleteVersionAsync(Guid id, int versionNumber, CancellationToken cancellationToken = default)
    {
        var draft = await db.Drafts.Include(d => d.Versions)
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);
        if (draft is null) return (false, null, null);

        var version = draft.Versions.FirstOrDefault(v => v.VersionNumber == versionNumber);
        if (version is null) return (false, $"Version {versionNumber} does not exist.", null);
        if (draft.Versions.Count <= 1)
            return (false, "This is the only remaining version — delete the whole draft instead.", null);

        db.DraftVersions.Remove(version);
        await db.SaveChangesAsync(cancellationToken);

        // IsFinal recomputes from whatever version is newest afterwards: deleting a
        // Final latest unlocks the draft; deleting a newer Draft can resurface an
        // older Final underneath it.
        return (true, null, await MapDetailAsync(id, cancellationToken));
    }

    private async Task<DraftDto> MapDetailAsync(Guid draftId, CancellationToken ct)
    {
        var draft = await db.Drafts.AsNoTracking()
            .Include(d => d.Versions)
            .FirstAsync(d => d.Id == draftId, ct);
        var names = await LoadUserNamesAsync(draft.Versions.Select(v => v.EditedByUserId), ct);
        return MapDraft(draft, names, includeVersions: true);
    }

    private async Task<List<DraftDto>> MapListAsync(List<Draft> drafts, bool includeVersions, CancellationToken ct)
    {
        var ids = drafts.Select(d => d.Id).ToList();
        var allVersions = ids.Count == 0
            ? new List<DraftVersion>()
            : await db.DraftVersions.AsNoTracking()
                .Where(v => ids.Contains(v.DraftId))
                .ToListAsync(ct);
        var names = await LoadUserNamesAsync(allVersions.Select(v => v.EditedByUserId), ct);

        return drafts.Select(d =>
        {
            d.Versions = allVersions.Where(v => v.DraftId == d.Id).ToList();
            return MapDraft(d, names, includeVersions);
        }).OrderByDescending(d => d.UpdatedAt).ToList();
    }

    private async Task<Dictionary<Guid, string>> LoadUserNamesAsync(IEnumerable<Guid> userIds, CancellationToken ct)
    {
        var distinct = userIds.Distinct().ToList();
        var users = distinct.Count == 0
            ? new List<User>()
            : await db.Users.AsNoTracking()
                .Where(u => distinct.Contains(u.Id))
                .Select(u => new User { Id = u.Id, FirstName = u.FirstName, LastName = u.LastName, Email = u.Email })
                .ToListAsync(ct);
        return users.ToDictionary(u => u.Id, u =>
        {
            var full = $"{u.FirstName} {u.LastName}".Trim();
            return full.Length > 0 ? full : u.Email.Split('@')[0];
        });
    }

    private static DraftDto MapDraft(Draft d, IReadOnlyDictionary<Guid, string> names, bool includeVersions)
    {
        var versions = d.Versions.OrderByDescending(v => v.VersionNumber).ToList();
        var latest = versions.FirstOrDefault();
        return new DraftDto
        {
            Id = d.Id,
            CaseId = d.CaseId,
            DraftType = d.DraftType,
            Title = d.Title,
            CreatedAt = d.CreatedAt,
            UpdatedAt = latest?.EditedAt ?? d.CreatedAt,
            CurrentVersionNumber = latest?.VersionNumber ?? 0,
            IsFinal = string.Equals(latest?.Status, "Final", StringComparison.OrdinalIgnoreCase),
            Versions = !includeVersions ? new() : versions.Select(v => new DraftVersionDto
            {
                Id = v.Id,
                VersionNumber = v.VersionNumber,
                Content = v.Content,
                EditedByUserId = v.EditedByUserId,
                EditedByName = names.TryGetValue(v.EditedByUserId, out var n) ? n : "Unknown",
                EditedAt = v.EditedAt,
                Status = v.Status
            }).ToList()
        };
    }
}
