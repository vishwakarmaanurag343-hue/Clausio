using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Clausio.Legal.Core.Dtos;
using Clausio.Legal.Core.Interfaces.AI.Pipeline;
using Clausio.Legal.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Clausio.Legal.Service;

public interface IJudgmentAnalysisService
{
    Task<IReadOnlyList<SimilarJudgmentDto>> FindSimilarJudgmentsAsync(Guid caseId, int topK, CancellationToken ct = default);
    Task<string> CompareJudgmentsAsync(Guid caseId, CompareJudgmentsDto dto, CancellationToken ct = default);
    Task<string> GetApplicabilityReportAsync(Guid caseId, ApplicabilityDto dto, CancellationToken ct = default);
}

/// <summary>
/// Judgment Analysis sub-tab (Analytics page): Similar Case Finder, Judgment Comparison and
/// Judgment Applicability. Precedent metadata comes from the verified JudgmentChunks corpus;
/// every word of analysis is produced through <see cref="IAIPipeline"/> so RAG, PII
/// tokenisation, security and telemetry all stay in the loop.
/// </summary>
public class JudgmentAnalysisService(
    ClausioDbContext db,
    JudgmentSearchService judgmentSearch,
    IAIPipeline pipeline,
    ILogger<JudgmentAnalysisService> logger) : IJudgmentAnalysisService
{
    public async Task<IReadOnlyList<SimilarJudgmentDto>> FindSimilarJudgmentsAsync(
        Guid caseId, int topK, CancellationToken ct = default)
    {
        if (topK <= 0 || topK > 10) topK = 5;

        var kase = await db.Cases.AsNoTracking().FirstOrDefaultAsync(c => c.Id == caseId, ct)
            ?? throw new KeyNotFoundException($"Case {caseId} not found.");

        // Search query = case type/sub-type/name + the heads of the most recent documents.
        var docHeads = await db.Documents.AsNoTracking()
            .Where(d => d.CaseId == caseId
                        && d.ExtractedText != null && d.ExtractedText != ""
                        && !d.ExtractedText.StartsWith("Error")
                        && !d.ExtractedText.StartsWith("--- MOCK"))
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => d.ExtractedText!)
            .Take(4)
            .ToListAsync(ct);

        var queryParts = new[] { kase.CaseType, kase.SubType, kase.Name }
            .Concat(docHeads.Select(t => t.Length > 800 ? t[..800] : t))
            .Where(s => !string.IsNullOrWhiteSpace(s));
        var searchQuery = string.Join(" ", queryParts);

        var category = MapToCorpusCategory($"{kase.CaseType} {kase.SubType}");
        var matches = await judgmentSearch.SearchStructuredAsync(searchQuery, topK, category, ct);
        if (matches.Count == 0) return Array.Empty<SimilarJudgmentDto>();

        var maxScore = Math.Max(1, matches.Max(m => m.Score));
        var caseLabel = $"{kase.Name} — {kase.CaseType}"
                        + (string.IsNullOrWhiteSpace(kase.SubType) ? "" : $" ({kase.SubType})");

        // ONE pipeline pass over all matches: parallel ExecuteAsync calls would race the
        // scoped DbContext, and N sequential 25s calls would blow the request budget.
        var sb = new StringBuilder();
        sb.AppendLine($"CURRENT CASE: {caseLabel}");
        sb.AppendLine();
        sb.AppendLine("PAST JUDGMENTS RETRIEVED FROM THE VERIFIED CORPUS:");
        for (var i = 0; i < matches.Count; i++)
        {
            var body = string.Join(" ", matches[i].ChunkText.Split(' ').Take(320));
            sb.AppendLine($"[{i + 1}] {matches[i].CaseName} ({matches[i].Year}):");
            sb.AppendLine(body);
            sb.AppendLine("---");
        }
        sb.AppendLine();
        sb.AppendLine(
            "For EACH numbered judgment above, return strict JSON only (no prose, no fences):");
        sb.AppendLine(
            "{ \"judgments\": [ { \"index\": <number>, \"ratioDecidendi\": \"<what that court actually decided and the principle it laid down, 2-3 sentences>\", \"howToUse\": \"<how the advocate uses this judgment in oral/written argument for the CURRENT case, 2-3 sentences>\", \"similarityExplanation\": \"<one sentence naming the concrete parallel to the current case>\" } ] }");

        string aiRaw;
        try
        {
            aiRaw = await pipeline.ExecuteAsync(caseId, sb.ToString(), "SimilarCaseFinder", null, ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "[JudgmentAnalysis] Similar-case enrichment failed for case {CaseId}", caseId);
            aiRaw = "";
        }

        var notes = ParseSimilarNotes(aiRaw);

        var output = new List<SimilarJudgmentDto>(matches.Count);
        for (var i = 0; i < matches.Count; i++)
        {
            var m = matches[i];
            notes.TryGetValue(i + 1, out var n);
            var body = string.Join(" ", m.ChunkText.Split(' ').Take(320));
            output.Add(new SimilarJudgmentDto
            {
                CaseName = CleanCaseName(m.CaseName),
                Citation = ExtractCitation(m.ChunkText) ?? $"{CleanCaseName(m.CaseName)}"
                    + (m.Year is > 0 ? $" ({m.Year})" : ""),
                Year = m.Year,
                Court = InferCourt(m.ChunkText),
                CaseType = m.CaseType ?? category ?? "",
                RatioDecidendi = n?.Ratio ?? "",
                HowToUse = n?.HowToUse ?? "",
                SimilarityLevel = m.Score >= maxScore * 0.66 ? "High"
                                : m.Score >= maxScore * 0.33 ? "Medium"
                                : "Low",
                ChunkText = body,
                RelevanceScore = Math.Round((double)m.Score / maxScore, 2),
            });
        }
        return output;
    }

    public async Task<string> CompareJudgmentsAsync(Guid caseId, CompareJudgmentsDto dto, CancellationToken ct = default)
    {
        var userInput = string.Join("\n\n",
            $"JUDGMENT 1 — {dto.Judgment1Name}:\n{Trim(dto.Judgment1Text, 3500)}",
            $"JUDGMENT 2 — {dto.Judgment2Name}:\n{Trim(dto.Judgment2Text, 3500)}",
            "Compare these two judgments for the current case strictly per the system instructions.");

        return await pipeline.ExecuteAsync(caseId, userInput, "JudgmentComparison", null, ct);
    }

    public async Task<string> GetApplicabilityReportAsync(Guid caseId, ApplicabilityDto dto, CancellationToken ct = default)
    {
        var userInput = string.Join("\n\n",
            $"CURRENT CASE: {dto.CaseName}",
            $"JUDGMENT TO ANALYSE — {dto.JudgmentName}:\n{Trim(dto.JudgmentText, 5000)}",
            "Work up this judgment for court use strictly per the system instructions.");

        return await pipeline.ExecuteAsync(caseId, userInput, "JudgmentApplicability", null, ct);
    }

    // ===================== Helpers =====================

    private sealed record SimilarNote(string? Ratio, string? HowToUse, string? Why);

    private Dictionary<int, SimilarNote> ParseSimilarNotes(string raw)
    {
        var result = new Dictionary<int, SimilarNote>();
        if (string.IsNullOrWhiteSpace(raw)) return result;

        var start = raw.IndexOf('{');
        var end = raw.LastIndexOf('}');
        if (start < 0 || end <= start) return result;

        try
        {
            using var doc = JsonDocument.Parse(raw[start..(end + 1)]);
            if (!doc.RootElement.TryGetProperty("judgments", out var arr) || arr.ValueKind != JsonValueKind.Array)
                return result;

            var fallbackIdx = 0;
            foreach (var item in arr.EnumerateArray())
            {
                fallbackIdx++;
                var idx = item.TryGetProperty("index", out var ix) && ix.TryGetInt32(out var parsed)
                    ? parsed : fallbackIdx;
                result[idx] = new SimilarNote(
                    Str(item, "ratioDecidendi"),
                    Str(item, "howToUse"),
                    Str(item, "similarityExplanation"));
            }
        }
        catch (JsonException ex)
        {
            logger.LogWarning("[JudgmentAnalysis] Could not parse similar-case AI JSON: {Err}", ex.Message);
        }
        return result;

        static string? Str(JsonElement el, string prop)
            => el.TryGetProperty(prop, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;
    }

    private static string Trim(string? s, int max)
    {
        s ??= "";
        s = s.Trim();
        return s.Length > max ? s[..max] : s;
    }

    private static string CleanCaseName(string raw)
    {
        var name = raw.Trim().Trim('[', ']');
        // corpus chunks sometimes prefix "[Name (Year)] ..." — keep just the party string
        var m = Regex.Match(name, @"^(.+?)\s*\(\d{4}\)\s*$");
        return m.Success ? m.Groups[1].Value.Trim() : name;
    }

    /// <summary>Pull an Indian law-report citation out of the chunk text if one is present.</summary>
    private static string? ExtractCitation(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;
        var patterns = new[]
        {
            @"\(\d{4}\)\s*\d+\s*SCC\s*\d+",
            @"AIR\s*\d{4}\s*SC\s*\d+",
            @"\d{4}\s*INSC\s*\d+",
            @"\(\d{4}\)\s*\d+\s*SCC\s*\(Cri\)\s*\d+",
            @"\d{4}\s*SCC\s*OnLine\s*\w+\s*\d+",
        };
        foreach (var p in patterns)
        {
            var m = Regex.Match(text, p, RegexOptions.IgnoreCase);
            if (m.Success) return m.Value.Trim();
        }
        return null;
    }

    private static string InferCourt(string text)
    {
        var t = (text ?? "").ToLowerInvariant();
        if (t.Contains("high court")) return "High Court";
        if (t.Contains("supreme court")) return "Supreme Court of India";
        return "Supreme Court of India";
    }

    /// <summary>
    /// Map a free-form case type onto the JudgmentChunks.CaseType labels used by the corpus
    /// (mirrors the mapping inside AIPipeline so category backfill lands on real chunks).
    /// </summary>
    private static string? MapToCorpusCategory(string typeLine)
    {
        var t = (typeLine ?? "").ToLowerInvariant();
        if (t.Contains("family") || t.Contains("matrimonial") || t.Contains("divorce")
            || t.Contains("custody") || t.Contains("maintenance") || t.Contains("alimony")) return "Family";
        if (t.Contains("criminal") || t.Contains("bail") || t.Contains("498a")) return "Criminal";
        if (t.Contains("property") || t.Contains("civil")) return "Property";
        if (t.Contains("constitution") || t.Contains("writ")) return "Constitutional";
        if (t.Contains("tax") || t.Contains("gst")) return "Tax";
        if (t.Contains("ni act") || t.Contains("negotiable") || t.Contains("cheque") || t.Contains("138")) return "NI Act";
        if (t.Contains("labour") || t.Contains("labor")) return "Labour";
        if (t.Contains("consumer")) return "Consumer";
        return null;
    }
}
