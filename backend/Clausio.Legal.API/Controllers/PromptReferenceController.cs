using Clausio.Legal.API.Extensions;
using Clausio.Legal.Core.Entities;
using Clausio.Legal.Infrastructure;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Clausio.Legal.API.Controllers;

/// <summary>
/// A lawyer's own firm documents kept as AI style references. Per-user; nobody sees
/// another lawyer's references. The stored text (first 3000 chars) is injected into
/// the AI context when a prompt or draft is run with one selected.
/// </summary>
[Authorize]
[ApiController]
[Route("api/prompt-references")]
public class PromptReferenceController(ClausioDbContext db, IHttpClientFactory httpClientFactory) : ControllerBase
{
    private static readonly string[] Allowed = { ".pdf", ".docx", ".txt" };
    private const long MaxBytes = 10L * 1024 * 1024;

    private Guid UserId => User.GetUserId();

    // GET /api/prompt-references — list this user's references (with a short preview)
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var docs = await db.PromptReferenceDocs.AsNoTracking()
            .Where(d => d.UserId == UserId)
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new
            {
                d.Id,
                d.Title,
                d.DocType,
                d.FileName,
                d.FileSizeBytes,
                d.CreatedAt,
                preview = d.ExtractedText.Length > 200 ? d.ExtractedText.Substring(0, 200) + "…" : d.ExtractedText,
            })
            .ToListAsync(ct);
        return Ok(docs);
    }

    // GET /api/prompt-references/{id} — full record incl. extractedText
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetOne(Guid id, CancellationToken ct)
    {
        var doc = await db.PromptReferenceDocs.AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id && d.UserId == UserId, ct);
        return doc is null ? NotFound() : Ok(doc);
    }

    // POST /api/prompt-references — upload + extract + store
    [HttpPost]
    [RequestSizeLimit(MaxBytes + 1024)]
    public async Task<IActionResult> Upload(
        [FromForm] IFormFile? file,
        [FromForm] string? title,
        [FromForm] string? docType,
        CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file uploaded" });
        if (file.Length > MaxBytes)
            return BadRequest(new { error = "File too large. Max 10MB." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!Allowed.Contains(ext))
            return BadRequest(new { error = "Only PDF, DOCX, TXT allowed" });

        string text;
        try
        {
            text = ext switch
            {
                ".txt"  => await ReadTxtAsync(file, ct),
                ".docx" => ExtractDocx(file),
                ".pdf"  => await ExtractPdfViaOcrAsync(file, ct),
                _       => "",
            };
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Text extraction failed: " + ex.Message });
        }

        text = (text ?? "").Trim();
        if (text.Length == 0)
            return BadRequest(new { error = "No text could be read from this file." });

        var doc = new PromptReferenceDoc
        {
            UserId        = UserId,
            Title         = (title ?? "").Trim(),
            DocType       = (docType ?? "Other").Trim(),
            ExtractedText = text,
            FileName      = file.FileName,
            FileSizeBytes = file.Length,
        };
        db.PromptReferenceDocs.Add(doc);
        await db.SaveChangesAsync(ct);

        return Ok(new
        {
            doc.Id,
            doc.Title,
            doc.DocType,
            doc.FileName,
            wordCount = text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).Length,
        });
    }

    // DELETE /api/prompt-references/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var doc = await db.PromptReferenceDocs.FirstOrDefaultAsync(d => d.Id == id && d.UserId == UserId, ct);
        if (doc is null) return NotFound();
        db.PromptReferenceDocs.Remove(doc);
        await db.SaveChangesAsync(ct);
        return Ok(new { deleted = id });
    }

    // ── extraction helpers ──────────────────────────────────────
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
        content.Add(new StreamContent(file.OpenReadStream()), "file", file.FileName);

        HttpResponseMessage response;
        try
        {
            response = await client.PostAsync("http://localhost:8000/api/ocr", content, ct);
        }
        catch
        {
            throw new InvalidOperationException("The document service is not running. Try a DOCX or TXT file instead.");
        }

        var raw = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Document service returned {(int)response.StatusCode}.");

        using var json = System.Text.Json.JsonDocument.Parse(raw);
        return json.RootElement.TryGetProperty("text", out var t) ? t.GetString() ?? "" : "";
    }
}
