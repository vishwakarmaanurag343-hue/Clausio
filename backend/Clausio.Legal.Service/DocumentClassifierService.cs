using Microsoft.Extensions.Configuration;
using Clausio.Legal.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Clausio.Legal.Service;

public class DocumentClassifierService(
    ClausioDbContext db,
    ILogger<DocumentClassifierService> logger,
    IConfiguration config)
{
    private static readonly string[] Categories =
    [
        "Evidence",
        "Proof",
        "Claim",
        "Court Order",
        "Pleading",
        "Financial",
        "Identity",
        "Medical",
        "Other"
    ];

    public async Task ClassifyDocumentAsync(Guid documentId, CancellationToken ct = default)
    {
        var document = await db.Documents.FindAsync(new object[] { documentId }, ct);
        if (document is null) return;

        // Use filename + extracted text to classify
        var content = $"Filename: {document.FileName}\n";
        if (!string.IsNullOrEmpty(document.ExtractedText))
            content += $"Content preview: {document.ExtractedText[..Math.Min(500, document.ExtractedText.Length)]}";

        try
        {
            var category = await ClassifyWithAiAsync(content, document.FileName, ct);
            document.Category            = category.Category;
            document.CategoryConfidence  = category.Confidence;
            document.CategoryDescription = category.Description;
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Document {Id} classified as {Category}", documentId, category.Category);
        }
        catch (Exception ex)
        {
            // Fallback — classify by filename
            document.Category           = ClassifyByFilename(document.FileName);
            document.CategoryConfidence = 60;
            await db.SaveChangesAsync(ct);
            logger.LogWarning("AI classification failed, used filename: {Error}", ex.Message);
        }
    }

    private async Task<(string Category, int Confidence, string Description)>
        ClassifyWithAiAsync(string content, string filename, CancellationToken ct)
    {
        var apiKey  = config["AI:DeepProvider:ApiKey"] ?? config["AI:FastProvider:ApiKey"] ?? "";
        var baseUrl = config["AI:DeepProvider:BaseUrl"] ?? "https://integrate.api.nvidia.com/v1";
        var model   = "meta/llama-3.1-8b-instruct";

        using var http = new HttpClient();
        http.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", apiKey);

        var prompt = $@"Classify this legal document into ONE category.

Document info:
{content}

Categories to choose from:
- Evidence (hospital records, photos, videos, witness statements)
- Proof (certificates, registration docs, receipts)
- Claim (affidavits, petitions, complaints)
- Court Order (judge orders, interim orders, final orders)
- Pleading (written statement, reply, petition)
- Financial (bank statements, ITR, salary slips, invoices)
- Identity (Aadhaar, PAN, passport, marriage certificate)
- Medical (prescriptions, reports, discharge summaries)
- Other (anything else)

Respond ONLY in this JSON format:
{{""category"": ""Evidence"", ""confidence"": 85, ""description"": ""Hospital discharge summary showing injuries""}}";

        var body = new
        {
            model,
            max_tokens = 100,
            temperature = 0.1,
            messages = new[] { new { role = "user", content = prompt } }
        };

        var response = await http.PostAsync(
            $"{baseUrl}/chat/completions",
            new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json"),
            ct);

        response.EnsureSuccessStatusCode();

        var json   = await response.Content.ReadAsStringAsync(ct);
        var parsed = JsonDocument.Parse(json);
        var text   = parsed.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString() ?? "";

        var result = JsonDocument.Parse(text.Trim());
        return (
            result.RootElement.GetProperty("category").GetString() ?? "Other",
            result.RootElement.GetProperty("confidence").GetInt32(),
            result.RootElement.GetProperty("description").GetString() ?? ""
        );
    }

    private static string ClassifyByFilename(string filename)
    {
        var f = filename.ToLower();
        if (f.Contains("order") || f.Contains("judgment"))  return "Court Order";
        if (f.Contains("petition") || f.Contains("plaint")) return "Pleading";
        if (f.Contains("affidavit"))                        return "Claim";
        if (f.Contains("hospital") || f.Contains("medical")
            || f.Contains("prescription"))                  return "Medical";
        if (f.Contains("bank") || f.Contains("itr")
            || f.Contains("salary"))                        return "Financial";
        if (f.Contains("aadhaar") || f.Contains("pan")
            || f.Contains("passport"))                      return "Identity";
        if (f.Contains("certificate") || f.Contains("receipt")) return "Proof";
        return "Other";
    }

    public async Task ClassifyAllUnclassifiedAsync(CancellationToken ct = default)
    {
        var unclassified = await db.Documents
            .Where(d => d.Category == null && d.OcrStatus == "Completed")
            .Take(50)
            .ToListAsync(ct);

        logger.LogInformation("Classifying {Count} unclassified documents...", unclassified.Count);

        foreach (var doc in unclassified)
        {
            await ClassifyDocumentAsync(doc.Id, ct);
            await Task.Delay(500, ct);
        }
    }
}
