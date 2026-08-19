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
        CancellationToken ct = default)
    {
        try
        {
            // Extract key legal terms from query
            var keywords = ExtractKeywords(query);
            if (!keywords.Any()) return [];

            var results = new List<(string text, int score)>();

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
                    results.Add((formatted, score));
                }
            }

            // Return top K unique results by score
            return results
                .OrderByDescending(r => r.score)
                .DistinctBy(r => r.text[..Math.Min(100, r.text.Length)])
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

        var words = query.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(w => w.Length >= 4 && !stopWords.Contains(w.ToLower()))
            .Select(w => w.Trim('.', ',', '?', '!'))
            .Where(w => w.Length >= 4)
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
