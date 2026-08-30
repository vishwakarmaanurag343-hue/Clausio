using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Clausio.Legal.API.Controllers;

/// <summary>
/// Extract plain text from an uploaded PDF / DOCX / TXT — used by the "Add New Case"
/// description input (Upload File mode). Does NOT store the file anywhere.
/// </summary>
[Authorize]
[ApiController]
[Route("api/documents")]
public class DocumentTextController(IHttpClientFactory httpClientFactory) : ControllerBase
{
    private static readonly string[] Allowed = { ".pdf", ".docx", ".txt" };
    private const long MaxBytes = 10L * 1024 * 1024;

    [HttpPost("extract-text")]
    [RequestSizeLimit(MaxBytes + 1024)]
    public async Task<IActionResult> ExtractText(IFormFile? file, CancellationToken ct = default)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file uploaded" });

        if (file.Length > MaxBytes)
            return BadRequest(new { error = "File too large. Maximum 10MB." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!Allowed.Contains(ext))
            return BadRequest(new { error = "Only PDF, DOCX and TXT files allowed" });

        try
        {
            var text = ext switch
            {
                ".txt"  => await ReadTxtAsync(file, ct),
                ".docx" => ExtractDocx(file),
                ".pdf"  => await ExtractPdfViaOcrAsync(file, ct),
                _       => "",
            };

            text = (text ?? "").Trim();
            var wordCount = string.IsNullOrWhiteSpace(text)
                ? 0
                : text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).Length;

            return Ok(new { text, fileName = file.FileName, wordCount });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Failed to extract text: " + ex.Message });
        }
    }

    private static async Task<string> ReadTxtAsync(IFormFile file, CancellationToken ct)
    {
        using var reader = new StreamReader(file.OpenReadStream());
        return await reader.ReadToEndAsync(ct);
    }

    private static string ExtractDocx(IFormFile file)
    {
        using var stream = file.OpenReadStream();
        using var doc = WordprocessingDocument.Open(stream, false);
        var body = doc.MainDocumentPart?.Document?.Body;
        if (body is null) return "";

        // Group Text runs by their containing paragraph so lines survive.
        var paragraphs = body.Descendants<Paragraph>()
            .Select(p => string.Concat(p.Descendants<Text>().Select(t => t.Text)))
            .Where(line => !string.IsNullOrWhiteSpace(line));

        return string.Join("\n", paragraphs);
    }

    private async Task<string> ExtractPdfViaOcrAsync(IFormFile file, CancellationToken ct)
    {
        var client = httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromMinutes(2);

        using var content = new MultipartFormDataContent();
        var fileContent = new StreamContent(file.OpenReadStream());
        content.Add(fileContent, "file", file.FileName);

        HttpResponseMessage response;
        try
        {
            response = await client.PostAsync("http://localhost:8000/api/ocr", content, ct);
        }
        catch (Exception)
        {
            throw new InvalidOperationException("The document service is not running. Paste the text manually instead.");
        }

        var raw = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Document service returned {(int)response.StatusCode}.");

        using var json = System.Text.Json.JsonDocument.Parse(raw);
        return json.RootElement.TryGetProperty("text", out var t) ? t.GetString() ?? "" : "";
    }
}
