using Clausio.Legal.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Clausio.Legal.Service;

public class JudgmentSearchService(
    ClausioDbContext db,
    ILogger<JudgmentSearchService> logger)
{
    // Search JudgmentChunks by keyword similarity (BM25-style)
    // Returns top 3 most relevant chunks
    public async Task<List<string>> SearchAsync(
        string query,
        int topK = 3,
        string? caseCategory = null,
        CancellationToken ct = default)
    {
        try
        {
            // Extract key legal terms from query
            var keywords = ExtractKeywords(query);
            logger.LogInformation("JudgmentSearch keywords: {Keywords}", string.Join(" | ", keywords));
            if (!keywords.Any() && string.IsNullOrEmpty(caseCategory)) return [];

            var results = new List<(string text, int score, string caseName)>();

            if (!string.IsNullOrEmpty(caseCategory))
            {
                // Precedent retrieval runs INSIDE the case's own court category first —
                // a family-law case needs family-law precedents even when its memory is
                // too thin to yield clean keywords. Keyword overlap only ranks within.
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

                // Zero lexical overlap anywhere → deterministic distinct-case spread of
                // the category pool rather than party-name noise from a global search
                if (!results.Any(r => r.score >= 2))
                {
                    return results
                        .GroupBy(r => r.caseName)
                        .Select(g => g.OrderByDescending(r => r.score).First())
                        .Take(topK)
                        .Select(r => r.text)
                        .ToList();
                }
            }
            else
            {
                // Search for each keyword and score results
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
                        // Score by how many keywords appear
                        var text = chunk.ChunkText;
                        var score = keywords.Count(k =>
                            text.Contains(k, StringComparison.OrdinalIgnoreCase));

                        var formatted = $"[{chunk.CaseName} ({chunk.Year})] {chunk.ChunkText}";
                        results.Add((formatted, score, chunk.CaseName ?? ""));
                    }
                }
            }

            // Return top K results — one chunk per case so a single case can't crowd
            // out the rest; prefer the most substantive chunk of each case
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
        // Legal-specific keyword extraction
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

        // Check for known legal terms
        foreach (var term in legalTerms)
        {
            if (lower.Contains(term))
                found.Add(term);
        }

        // Also add significant words from query (4+ chars, not common words)
        var stopWords = new HashSet<string> {
            "what", "when", "where", "which", "who", "whom", "whose",
            "how", "why", "the", "and", "for", "with", "from", "this",
            "that", "have", "has", "been", "will", "should", "would",
            "could", "case", "court", "judge", "legal", "law", "file"
        };

        // Split on all whitespace (newlines inside a token defeat the filters), strip
        // surrounding punctuation including XML tag markers, drop tag-like tokens
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
        return await db.JudgmentChunks
            .AnyAsync(j => EF.Functions.ILike(j.ChunkText, $"%{keyword}%"), ct);
    }
}
