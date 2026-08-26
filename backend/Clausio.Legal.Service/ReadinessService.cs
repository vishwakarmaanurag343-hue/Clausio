using Clausio.Legal.Core.Dtos;
using Clausio.Legal.Core.Entities;
using Clausio.Legal.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Clausio.Legal.Service;

public interface IReadinessService
{
    Task<Readiness> GetOrCreateAsync(Guid caseId, CancellationToken cancellationToken = default);
    Task<Readiness> UpdateScoreAsync(Guid caseId, int score, CancellationToken cancellationToken = default);
    Task<List<ReadinessChecklistItem>> GetChecklistAsync(Guid caseId, CancellationToken cancellationToken = default);

    /// <summary>Maps the stored assessment onto the strict report contract the frontend renders.</summary>
    Task<ReadinessReportDto> GetReportAsync(Guid caseId, CancellationToken cancellationToken = default);

    Task<ReadinessReportDto> SetGeneratedAsync(
        Guid caseId,
        int score,
        string summary,
        List<ReadinessChecklistItemDto> checklist,
        List<string> strengths,
        List<string> gaps,
        CancellationToken cancellationToken = default);
}

/// <summary>Legacy gap shape persisted before the case-type-tailored contract; kept so old GapsJson stays readable.</summary>
public record GapItem(string Title, string Description, string Severity, bool Resolved);

public class ReadinessService(ClausioDbContext db) : IReadinessService
{
    public async Task<Readiness> GetOrCreateAsync(Guid caseId, CancellationToken cancellationToken = default)
    {
        var readiness = await db.Readinesses
            .Include(r => r.ChecklistItems)
            .FirstOrDefaultAsync(r => r.CaseId == caseId, cancellationToken);

        if (readiness is not null) return readiness;

        readiness = new Readiness { CaseId = caseId, Score = 0 };
        db.Readinesses.Add(readiness);
        await db.SaveChangesAsync(cancellationToken);
        return readiness;
    }

    public async Task<Readiness> UpdateScoreAsync(Guid caseId, int score, CancellationToken cancellationToken = default)
    {
        var readiness = await GetOrCreateAsync(caseId, cancellationToken);
        readiness.Score = score;
        await db.SaveChangesAsync(cancellationToken);
        return readiness;
    }

    public async Task<List<ReadinessChecklistItem>> GetChecklistAsync(Guid caseId, CancellationToken cancellationToken = default)
    {
        var readiness = await GetOrCreateAsync(caseId, cancellationToken);
        return readiness.ChecklistItems.ToList();
    }

    public async Task<ReadinessReportDto> GetReportAsync(Guid caseId, CancellationToken cancellationToken = default)
    {
        var readiness = await GetOrCreateAsync(caseId, cancellationToken);
        return MapReport(readiness);
    }

    public async Task<ReadinessReportDto> SetGeneratedAsync(
        Guid caseId,
        int score,
        string summary,
        List<ReadinessChecklistItemDto> checklist,
        List<string> strengths,
        List<string> gaps,
        CancellationToken cancellationToken = default)
    {
        // Fresh load with tracking to avoid concurrency errors
        var readiness = await db.Readinesses
            .Include(r => r.ChecklistItems)
            .FirstOrDefaultAsync(r => r.CaseId == caseId, cancellationToken);

        if (readiness is null)
        {
            readiness = new Readiness { CaseId = caseId };
            db.Readinesses.Add(readiness);
            await db.SaveChangesAsync(cancellationToken);
        }

        readiness.Score         = score;
        readiness.Summary       = summary;
        readiness.StrengthsJson = System.Text.Json.JsonSerializer.Serialize(strengths ?? new List<string>());
        readiness.GapsJson      = System.Text.Json.JsonSerializer.Serialize(gaps ?? new List<string>());

        // Replace the previous generation's checklist wholesale
        if (readiness.ChecklistItems.Any())
        {
            db.ReadinessChecklistItems.RemoveRange(readiness.ChecklistItems);
            await db.SaveChangesAsync(cancellationToken);
        }

        // Explicit DbSet.AddRange — pre-initialised Guid keys would otherwise make EF
        // attach navigation-discovered children as existing rows (UPDATE → concurrency error).
        var newItems = checklist.Select(item => new ReadinessChecklistItem
        {
            ReadinessId       = readiness.Id,
            Text              = item.Item,
            Category          = item.Controllable ? "Controllable" : "External",
            Status            = item.Status,
            Controllable      = item.Controllable,
            CaseTypeRelevance = item.CaseTypeRelevance,
            ActionNeeded      = item.ActionNeeded,
        }).ToList();
        db.ReadinessChecklistItems.AddRange(newItems);
        await db.SaveChangesAsync(cancellationToken);

        return await GetReportAsync(caseId, cancellationToken);
    }

    /// <summary>
    /// Maps the stored entity onto the strict report contract. Tolerates legacy rows:
    /// gaps/strengths may have been serialised as GapItem objects, and old items carry
    /// only the boolean Done instead of Status.
    /// </summary>
    public static ReadinessReportDto MapReport(Readiness r)
    {
        var report = new ReadinessReportDto
        {
            OverallScore = r.Score,
            ScoreSummary = r.Summary ?? "",
        };
        try { report.Strengths = ParseStringList(r.StrengthsJson); } catch { /* legacy junk — leave empty */ }
        try { report.Gaps      = ParseStringList(r.GapsJson); }      catch { /* legacy junk — leave empty */ }
        foreach (var i in r.ChecklistItems)
            report.Checklist.Add(new ReadinessChecklistItemDto
            {
                Item              = i.Text ?? "",
                CaseTypeRelevance = i.CaseTypeRelevance ?? "",
                Status            = i.Status is "Done" or "Pending" or "At Risk"
                                        ? i.Status
                                        : (i.Done ? "Done" : "Pending"),
                Controllable      = i.Controllable,
                ActionNeeded      = i.ActionNeeded,
            });
        return report;
    }

    private static List<string> ParseStringList(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new List<string>();
        using var doc = System.Text.Json.JsonDocument.Parse(json);
        var list = new List<string>();
        if (doc.RootElement.ValueKind != System.Text.Json.JsonValueKind.Array) return list;
        foreach (var el in doc.RootElement.EnumerateArray())
        {
            if (el.ValueKind == System.Text.Json.JsonValueKind.String)
            {
                var s = el.GetString();
                if (!string.IsNullOrWhiteSpace(s)) list.Add(s);
            }
            else if (el.ValueKind == System.Text.Json.JsonValueKind.Object)
            {
                // Legacy GapItem {title, description, ...}
                var title    = el.TryGetProperty("title", out var t) ? t.GetString() : null;
                var desc     = el.TryGetProperty("description", out var d) ? d.GetString() : null;
                var combined = string.Join(" — ", new[] { title, desc }.Where(s => !string.IsNullOrWhiteSpace(s)));
                if (!string.IsNullOrWhiteSpace(combined)) list.Add(combined);
            }
        }
        return list;
    }
}
