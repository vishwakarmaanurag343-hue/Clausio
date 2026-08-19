using System.Net.Http.Headers;
using System.Text.Json;
using Clausio.Legal.Core.Entities;
using Clausio.Legal.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Clausio.Legal.Service.Seeding;

public class JudgmentSeeder(ClausioDbContext db, ILogger<JudgmentSeeder> logger)
{
    private const string IndiaKanoonToken = "4952cc435c2408b7dc639a9c0b5a45fbe45586a8";
    private const string BaseUrl          = "https://api.indiankanoon.org";

    private static readonly string[] SearchQueries =
    [
        "maintenance Section 125 CrPC",
        "divorce cruelty Section 13 HMA",
        "interim maintenance Section 24 HMA",
        "bail Section 437 CrPC",
        "cheque bounce Section 138 NI Act",
        "domestic violence Section 498A",
        "consumer complaint NCDRC",
        "GST appeal tribunal",
        "custody child Section 26 HMA",
        "alimony permanent Section 25 HMA",
    ];

    public async Task SeedAsync(CancellationToken ct = default)
    {
        var existing = await db.Judgments.CountAsync(ct);
        if (existing > 0)
        {
            logger.LogInformation("Judgments database already seeded and ready in memory ({Count} precedents). Skipping external fetch.", existing);
            return;
        }

        logger.LogInformation("Starting initial judgment seeding for empty database...");

        using var http = new HttpClient();
        http.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Token", IndiaKanoonToken);
        http.Timeout = TimeSpan.FromSeconds(30);

        var saved = 0;

        foreach (var query in SearchQueries)
        {
            try
            {
                logger.LogInformation("Searching: {Query}", query);

                
                var searchContent = new FormUrlEncodedContent(new[] { new KeyValuePair<string, string>("formInput", query), new KeyValuePair<string, string>("pagenum", "0") });
                var response = await http.PostAsync($"{BaseUrl}/search/", searchContent, ct);

                if (!response.IsSuccessStatusCode)
                {
                    logger.LogWarning("Search failed for '{Query}': {Status}", query, response.StatusCode);
                    continue;
                }

                var json     = await response.Content.ReadAsStringAsync(ct);
                var document = JsonDocument.Parse(json);

                if (!document.RootElement.TryGetProperty("docs", out var docs))
                    continue;

                foreach (var doc in docs.EnumerateArray().Take(10))
                {
                    try
                    {
                        var tid      = doc.TryGetProperty("tid",      out var t) ? t.GetInt64() : 0;
                        var title    = doc.TryGetProperty("title",    out var tl) ? tl.GetString() : "";
                        var headline = doc.TryGetProperty("headline", out var h) ? h.GetString() : "";
                        var court    = doc.TryGetProperty("docsource", out var ds) ? ds.GetString() : "";
                        var date     = doc.TryGetProperty("publishdate", out var pd) ? pd.GetString() : "";

                        if (tid == 0 || string.IsNullOrEmpty(title)) continue;

                        // Check if already exists
                        var citation = $"{title} [{tid}]";
                        var exists   = await db.Judgments.AnyAsync(j => j.Citation == citation, ct);
                        if (exists) continue;

                        // Get full document
                        var docUrl      = $"{BaseUrl}/doc/{tid}/";
                        var docResponse = await http.GetAsync(docUrl, ct);
                        var fullText    = "";

                        if (docResponse.IsSuccessStatusCode)
                        {
                            var docJson = await docResponse.Content.ReadAsStringAsync(ct);
                            var docDoc  = JsonDocument.Parse(docJson);
                            fullText    = docDoc.RootElement.TryGetProperty("doc", out var d)
                                ? d.GetString() ?? "" : "";
                        }

                        var year = 0;
                        if (!string.IsNullOrEmpty(date) && date.Length >= 4)
                            int.TryParse(date[..4], out year);

                        var judgment = new Judgment
                        {
                            Citation       = citation,
                            ShortName      = title,
                            Court          = court ?? "Supreme Court of India",
                            Year           = year > 0 ? year : null,
                            CaseType       = DetectCaseType(query),
                            RatioDecidendi = headline ?? "",
                            FullText       = fullText.Length > 5000
                                ? fullText[..5000] : fullText,
                            SourceUrl  = $"https://indiankanoon.org/doc/{tid}/",
                            IsVerified = true,
                            CreatedAt  = DateTime.UtcNow
                        };

                        db.Judgments.Add(judgment);
                        saved++;

                        logger.LogInformation("Added: {Title}", title);

                        // Rate limit — 1 request per second
                        await Task.Delay(1000, ct);
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning("Failed to process doc: {Error}", ex.Message);
                    }
                }

                await db.SaveChangesAsync(ct);

                // Wait between searches
                await Task.Delay(2000, ct);
            }
            catch (Exception ex)
            {
                logger.LogWarning("Search query '{Query}' failed: {Error}", query, ex.Message);
            }
        }

        logger.LogInformation("Seeding complete. {Count} judgments saved.", saved);
    }

    private static string DetectCaseType(string query) => query.ToLower() switch
    {
        var q when q.Contains("maintenance") || q.Contains("divorce") ||
                   q.Contains("custody")     || q.Contains("alimony")  => "Family",
        var q when q.Contains("bail")        || q.Contains("498a")      => "Criminal",
        var q when q.Contains("cheque")      || q.Contains("138")       => "NI Act",
        var q when q.Contains("consumer")                               => "Consumer",
        var q when q.Contains("gst")         || q.Contains("tax")       => "Tax",
        _                                                                => "General"
    };
}
