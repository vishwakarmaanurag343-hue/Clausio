using Clausio.Legal.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Clausio.Legal.Service;

/// <summary>One scored judgment record with its metadata kept intact.</summary>
public record JudgmentMatch(string CaseName, int? Year, string? CaseType, string ChunkText, int Score);

public class JudgmentSearchService(
    ClausioDbContext db,
    ILogger<JudgmentSearchService> logger)
{
    /// <summary>
    /// Searches our own Judgments table (falling back to JudgmentChunks if Judgments has no matches)
    /// to return structured cards with CaseName / Year / CaseType / Score.
    /// </summary>
    public async Task<List<JudgmentMatch>> SearchStructuredAsync(
        string query,
        int topK = 5,
        string? caseCategory = null,
        CancellationToken ct = default)
    {
        try
        {
            var keywords = ExtractKeywords(query);
            logger.LogInformation("JudgmentSearch(structured) keywords: {Keywords}, category: {Cat}",
                string.Join(" | ", keywords), caseCategory ?? "(none)");

            var results = new List<JudgmentMatch>();

            // 1. Search in our own Judgments table
            foreach (var keyword in keywords.Take(6))
            {
                var judgments = await db.Judgments
                    .AsNoTracking()
                    .Where(j => EF.Functions.ILike(j.FullText ?? "", $"%{keyword}%")
                             || EF.Functions.ILike(j.RatioDecidendi ?? "", $"%{keyword}%")
                             || EF.Functions.ILike(j.Citation, $"%{keyword}%")
                             || EF.Functions.ILike(j.ShortName ?? "", $"%{keyword}%"))
                    .Take(25)
                    .Select(j => new {
                        CaseName = j.ShortName ?? j.Citation,
                        j.Year,
                        j.CaseType,
                        Text = !string.IsNullOrWhiteSpace(j.RatioDecidendi) ? j.RatioDecidendi : (j.FullText ?? "")
                    })
                    .ToListAsync(ct);

                foreach (var j in judgments)
                {
                    var text = j.Text ?? "";
                    var score = keywords.Count(k => text.Contains(k, StringComparison.OrdinalIgnoreCase));
                    results.Add(new JudgmentMatch(j.CaseName, j.Year, j.CaseType, text, score));
                }
            }

            // Also check JudgmentChunks for existing seeded corpus
            foreach (var keyword in keywords.Take(6))
            {
                var chunks = await db.JudgmentChunks
                    .AsNoTracking()
                    .Where(j => EF.Functions.ILike(j.ChunkText, $"%{keyword}%"))
                    .Take(25)
                    .Select(j => new { j.ChunkText, j.CaseName, j.Year, j.CaseType })
                    .ToListAsync(ct);

                foreach (var chunk in chunks)
                {
                    var score = keywords.Count(k =>
                        chunk.ChunkText.Contains(k, StringComparison.OrdinalIgnoreCase));
                    results.Add(new JudgmentMatch(
                        chunk.CaseName ?? "Unknown Case", chunk.Year, chunk.CaseType, chunk.ChunkText, score));
                }
            }

            var ranked = results
                .OrderByDescending(r => r.Score)
                .ThenByDescending(r => r.ChunkText.Length)
                .DistinctBy(r => r.CaseName)
                .Take(topK)
                .ToList();

            // Category fallback from Judgments table and JudgmentChunks
            if (ranked.Count < topK && !string.IsNullOrEmpty(caseCategory))
            {
                var have = ranked.Select(r => r.CaseName).ToHashSet();

                var dbJudgments = await db.Judgments
                    .AsNoTracking()
                    .Where(j => j.CaseType == caseCategory)
                    .OrderBy(j => j.Id)
                    .Take(100)
                    .Select(j => new {
                        CaseName = j.ShortName ?? j.Citation,
                        j.Year,
                        j.CaseType,
                        Text = !string.IsNullOrWhiteSpace(j.RatioDecidendi) ? j.RatioDecidendi : (j.FullText ?? "")
                    })
                    .ToListAsync(ct);

                foreach (var j in dbJudgments.DistinctBy(p => p.CaseName))
                {
                    if (ranked.Count >= topK) break;
                    if (have.Contains(j.CaseName)) continue;
                    ranked.Add(new JudgmentMatch(j.CaseName, j.Year, j.CaseType, j.Text, 0));
                    have.Add(j.CaseName);
                }

                if (ranked.Count < topK)
                {
                    var pool = await db.JudgmentChunks
                        .AsNoTracking()
                        .Where(j => j.CaseType == caseCategory)
                        .OrderBy(j => j.Id)
                        .Take(400)
                        .Select(j => new { j.ChunkText, j.CaseName, j.Year, j.CaseType })
                        .ToListAsync(ct);

                    foreach (var chunk in pool.DistinctBy(p => p.CaseName))
                    {
                        if (ranked.Count >= topK) break;
                        if (have.Contains(chunk.CaseName ?? "Unknown Case")) continue;
                        ranked.Add(new JudgmentMatch(
                            chunk.CaseName ?? "Unknown Case", chunk.Year, chunk.CaseType, chunk.ChunkText, 0));
                    }
                }
            }

            return ranked;
        }
        catch (Exception ex)
        {
            logger.LogWarning("JudgmentSearch(structured) failed: {Error}", ex.Message);
            return new List<JudgmentMatch>();
        }
    }

    // Search Judgments table & JudgmentChunks by keyword similarity
    // Returns top most relevant texts
    public async Task<List<string>> SearchAsync(
        string query,
        int topK = 3,
        string? caseCategory = null,
        CancellationToken ct = default)
    {
        try
        {
            var keywords = ExtractKeywords(query);
            logger.LogInformation("JudgmentSearch keywords: {Keywords}", string.Join(" | ", keywords));
            if (!keywords.Any() && string.IsNullOrEmpty(caseCategory)) return [];

            var results = new List<(string text, int score, string caseName)>();

            // Query Judgments table
            foreach (var keyword in keywords.Take(5))
            {
                var jList = await db.Judgments
                    .AsNoTracking()
                    .Where(j => EF.Functions.ILike(j.FullText ?? "", $"%{keyword}%")
                             || EF.Functions.ILike(j.RatioDecidendi ?? "", $"%{keyword}%")
                             || EF.Functions.ILike(j.Citation, $"%{keyword}%")
                             || EF.Functions.ILike(j.ShortName ?? "", $"%{keyword}%"))
                    .Take(20)
                    .Select(j => new {
                        CaseName = j.ShortName ?? j.Citation,
                        j.Citation,
                        j.Year,
                        Text = !string.IsNullOrWhiteSpace(j.RatioDecidendi) ? j.RatioDecidendi : (j.FullText ?? "")
                    })
                    .ToListAsync(ct);

                foreach (var j in jList)
                {
                    var score = keywords.Count(k => j.Text.Contains(k, StringComparison.OrdinalIgnoreCase));
                    var label = !string.IsNullOrEmpty(j.Citation) ? j.Citation : $"{j.CaseName} ({j.Year})";
                    results.Add(($"[{label}] {j.Text}", score, j.CaseName));
                }
            }

            // Also query JudgmentChunks
            if (!string.IsNullOrEmpty(caseCategory))
            {
                var category = caseCategory;
                var pool = await db.JudgmentChunks
                    .AsNoTracking()
                    .Where(j => j.CaseType == category)
                    .OrderBy(j => j.Id)
                    .Take(800)
                    .Select(j => new { j.ChunkText, j.CaseName, j.Year })
                    .ToListAsync(ct);

                foreach (var chunk in pool)
                {
                    var score = keywords.Count(k =>
                        chunk.ChunkText.Contains(k, StringComparison.OrdinalIgnoreCase));
                    results.Add(($"[{chunk.CaseName} ({chunk.Year})] {chunk.ChunkText}", score, chunk.CaseName ?? ""));
                }
            }
            else
            {
                foreach (var keyword in keywords.Take(5))
                {
                    var chunks = await db.JudgmentChunks
                        .AsNoTracking()
                        .Where(j => EF.Functions.ILike(j.ChunkText, $"%{keyword}%"))
                        .Take(20)
                        .Select(j => new {
                            j.ChunkText,
                            j.CaseName,
                            j.Year,
                            j.CaseType
                        })
                        .ToListAsync(ct);

                    foreach (var chunk in chunks)
                    {
                        var text = chunk.ChunkText;
                        var score = keywords.Count(k =>
                            text.Contains(k, StringComparison.OrdinalIgnoreCase));

                        var formatted = $"[{chunk.CaseName} ({chunk.Year})] {chunk.ChunkText}";
                        results.Add((formatted, score, chunk.CaseName ?? ""));
                    }
                }
            }

            return results
                .OrderByDescending(r => r.score)
                .ThenByDescending(r => r.text.Length)
                .DistinctBy(r => r.caseName)
                .Take(topK)
                .Select(r => r.text)
                .ToList();
        }
        catch (Exception ex)
        {
            logger.LogWarning("JudgmentSearch failed: {Error}", ex.Message);
            return [];
        }
    }

    private static List<string> ExtractKeywords(string query)
    {
        var legalTerms = new[]
        {
            "maintenance", "section 125", "crpc", "divorce", "custody",
            "alimony", "hma", "cheque bounce", "section 138", "bail",
            "section 437", "consumer", "negligence", "contract", "property",
            "rent", "eviction", "labour", "retrenchment", "income tax",
            "gst", "writ", "fundamental rights", "article 226", "article 32",
            "damages", "injunction", "contempt", "appeal", "revision",
            "cruelty", "498a", "dowry", "domestic violence"
        };

        var found = new List<string>();
        var lower = query.ToLower();

        foreach (var term in legalTerms)
        {
            if (lower.Contains(term))
                found.Add(term);
        }

        var stopWords = new HashSet<string> {
            "what", "when", "where", "which", "who", "whom", "whose",
            "how", "why", "the", "and", "for", "with", "from", "this",
            "that", "have", "has", "been", "will", "should", "would",
            "could", "case", "court", "judge", "legal", "law", "file"
        };

        var words = query.Split(new[] { ' ', '\n', '\r', '\t' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(w => w.Trim('.', ',', '?', '!', ':', ';', '<', '>', '"', '\'', '(', ')', '[', ']'))
            .Where(w => w.Length >= 4 && !w.Contains('_') && !stopWords.Contains(w.ToLower()))
            .Take(5);

        found.AddRange(words);

        return found.Distinct().ToList();
    }

    public async Task<bool> HasRelevantJudgmentsAsync(
        string query,
        CancellationToken ct = default)
    {
        var keywords = ExtractKeywords(query);
        if (!keywords.Any()) return false;

        var keyword = keywords.First();
        var inJudgments = await db.Judgments
            .AnyAsync(j => EF.Functions.ILike(j.FullText ?? "", $"%{keyword}%")
                        || EF.Functions.ILike(j.RatioDecidendi ?? "", $"%{keyword}%")
                        || EF.Functions.ILike(j.Citation, $"%{keyword}%"), ct);
        if (inJudgments) return true;

        return await db.JudgmentChunks
            .AnyAsync(j => EF.Functions.ILike(j.ChunkText, $"%{keyword}%"), ct);
    }
}
