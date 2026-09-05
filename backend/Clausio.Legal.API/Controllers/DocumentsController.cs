using Clausio.Legal.Core.Dtos;
using Clausio.Legal.Infrastructure;
using Clausio.Legal.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Clausio.Legal.API.Controllers;

[Authorize]
[ApiController]
[Route("api/cases/{caseId:guid}/documents")]
public class DocumentsController(IDocumentService documentService, ClausioDbContext db, IHttpClientFactory httpClientFactory, IConfiguration configuration) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(Guid caseId, CancellationToken cancellationToken) =>
        Ok(await documentService.ListAsync(caseId, cancellationToken));

    // Streams the stored file itself (used by Analysis-page timeline "open source" jumps).
    // Auth stays on the JSON API — the frontend fetches with the bearer header and opens the blob.
    [HttpGet("{id:guid}/file")]
    public async Task<IActionResult> GetFile(Guid caseId, Guid id, CancellationToken cancellationToken)
    {
        var file = await documentService.OpenAsync(caseId, id, cancellationToken);
        if (file is null) return NotFound();
        return File(file.Value.Stream, file.Value.ContentType, file.Value.FileName);
    }

    [HttpPost]
    [RequestSizeLimit(100_000_000)]
    public async Task<IActionResult> Upload(
        Guid caseId,
        IFormFile file,
        [FromForm] string? documentType,
        [FromForm] string? exhibitLabel,
        CancellationToken cancellationToken)
    {
        if (file.Length == 0)
        {
            return BadRequest("A non-empty file is required.");
        }

        var allowedExtensions = new[] { ".pdf", ".docx", ".doc", ".jpg", ".jpeg", ".png", ".txt", ".tiff", ".csv" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(ext))
        {
            return BadRequest($"File type '{ext}' is not allowed. Allowed types: {string.Join(", ", allowedExtensions)}");
        }

        await using var stream = file.OpenReadStream();
        var document = await documentService.UploadAsync(
            caseId, file.FileName, file.ContentType, documentType, exhibitLabel, stream, file.Length, cancellationToken);
        _ = Task.Run(async () =>
        {
            using var scope = HttpContext.RequestServices.CreateScope();
            var classifier = scope.ServiceProvider.GetRequiredService<Clausio.Legal.Service.DocumentClassifierService>();
            await classifier.ClassifyDocumentAsync(document.Id);
        });
        return Ok(document);
    }

    /// <summary>
    /// Imports a document from a publicly-shared Google Drive URL. Fetches the file
    /// server-side, then hands it to the SAME IDocumentService.UploadAsync call the
    /// regular multipart Upload endpoint above uses, so storage (S3) and the OCR/
    /// classification pipeline behave identically for both upload paths.
    /// </summary>
    [HttpPost("import-url")]
    public async Task<IActionResult> ImportFromUrl(
        Guid caseId,
        [FromBody] ImportUrlDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(dto.Url))
                return BadRequest(new { message = "URL is required." });

            var urlStr = dto.Url.Trim();

            // Folder links go through a separate branch — listing folder contents
            // requires the Drive API (v3), unlike a single file's direct-download URL.
            var isFolder = urlStr.Contains("/drive/folders/") || urlStr.Contains("drive/folders");
            if (isFolder)
                return await ImportFolderAsync(caseId, urlStr, cancellationToken);

            // Extract Google Drive file ID from the sharing URL, then build the
            // direct-download URL — matches formats:
            //   https://drive.google.com/file/d/FILE_ID/view
            //   https://drive.google.com/open?id=FILE_ID
            string? fileId = null;
            var patterns = new[] { @"/d/([a-zA-Z0-9_-]{20,})", @"id=([a-zA-Z0-9_-]{20,})" };
            foreach (var pattern in patterns)
            {
                var match = System.Text.RegularExpressions.Regex.Match(urlStr, pattern);
                if (match.Success)
                {
                    fileId = match.Groups[1].Value;
                    break;
                }
            }

            if (string.IsNullOrEmpty(fileId))
                return BadRequest(new { message = "Invalid Google Drive URL. Please paste a valid Google Drive sharing link." });

            // confirm=t bypasses the "can't scan this file for viruses" interstitial
            // Google Drive shows instead of streaming the bytes for larger files.
            var downloadUrl = $"https://drive.google.com/uc?export=download&confirm=t&id={fileId}";

            var http = httpClientFactory.CreateClient();
            http.Timeout = TimeSpan.FromSeconds(60);
            http.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            http.DefaultRequestHeaders.Add("Accept", "application/pdf,application/octet-stream,application/msword,*/*");

            using var response = await http.GetAsync(downloadUrl, cancellationToken);
            if (!response.IsSuccessStatusCode)
                return BadRequest(new { message = "Could not fetch the file. Make sure the file is set to 'Anyone with the link can view' in Google Drive settings." });

            var bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);

            if (bytes.Length == 0)
                return BadRequest(new { message = "The file appears to be empty." });

            if (bytes.Length > 100_000_000)
                return BadRequest(new { message = "File is too large. Maximum size is 100MB." });

            var contentType = response.Content.Headers.ContentType?.MediaType ?? "application/pdf";

            // Prefer the real filename Google Drive sends back over the source URL.
            string? realFileName = null;

            var contentDisposition = response.Content.Headers.ContentDisposition;
            if (contentDisposition != null)
            {
                realFileName = contentDisposition.FileNameStar ?? contentDisposition.FileName;
                if (!string.IsNullOrEmpty(realFileName))
                    realFileName = realFileName.Trim('"').Trim('\'').Trim();
            }

            // No Content-Disposition — try to pull a filename-looking segment out of
            // the original sharing URL instead.
            if (string.IsNullOrEmpty(realFileName))
            {
                var uri = new Uri(dto.OriginalUrl ?? dto.Url);
                var urlPath = uri.AbsolutePath;
                var lastSegment = urlPath.Split('/').LastOrDefault(s => s.Contains('.') && s.Length > 3);
                if (!string.IsNullOrEmpty(lastSegment))
                    realFileName = Uri.UnescapeDataString(lastSegment);
            }

            // Still nothing — fall back to a generic name with the right extension.
            if (string.IsNullOrEmpty(realFileName))
            {
                var fallbackExt = contentType.Contains("pdf") ? ".pdf"
                    : contentType.Contains("word") || contentType.Contains("document") ? ".docx"
                    : contentType.Contains("sheet") || contentType.Contains("excel") ? ".xlsx"
                    : contentType.Contains("image/jpeg") ? ".jpg"
                    : contentType.Contains("image/png") ? ".png"
                    : ".pdf";
                realFileName = $"GDrive_Document{fallbackExt}";
            }

            // Sanitize — strip characters the filesystem/S3 key won't accept.
            realFileName = string.Join("_", realFileName.Split(Path.GetInvalidFileNameChars())).Trim('_');

            if (!Path.HasExtension(realFileName))
                realFileName += contentType.Contains("pdf") ? ".pdf" : ".pdf";

            var fileName = realFileName;

            using var stream = new MemoryStream(bytes);
            var document = await documentService.UploadAsync(
                caseId, fileName, contentType, "Uploaded Document", null, stream, bytes.Length, cancellationToken);
            _ = Task.Run(async () =>
            {
                using var scope = HttpContext.RequestServices.CreateScope();
                var classifier = scope.ServiceProvider.GetRequiredService<Clausio.Legal.Service.DocumentClassifierService>();
                await classifier.ClassifyDocumentAsync(document.Id);
            });

            return Ok(document);
        }
        catch (TaskCanceledException)
        {
            return BadRequest(new { message = "Request timed out. The file may be too large or Google Drive is slow." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Import failed: " + ex.Message });
        }
    }

    /// <summary>
    /// Lists a public Google Drive folder's contents via the Drive API v3 (API key —
    /// no OAuth needed for anyone-with-the-link folders) and imports every file inside
    /// through the SAME documentService.UploadAsync call the single-file path and the
    /// regular multipart Upload endpoint both use.
    /// </summary>
    private async Task<IActionResult> ImportFolderAsync(Guid caseId, string urlStr, CancellationToken cancellationToken)
    {
        var folderMatch = System.Text.RegularExpressions.Regex.Match(urlStr, @"/folders/([a-zA-Z0-9_-]{20,})");
        if (!folderMatch.Success)
            return BadRequest(new { message = "Invalid Google Drive folder URL. Please paste a valid folder sharing link." });
        var folderId = folderMatch.Groups[1].Value;

        var apiKey = configuration["GoogleDrive:ApiKey"] ?? "";
        if (string.IsNullOrEmpty(apiKey))
            return BadRequest(new { message = "Google Drive folder import requires API configuration. Please import files individually using individual file links." });

        var listUrl = $"https://www.googleapis.com/drive/v3/files" +
            $"?q='{folderId}'+in+parents" +
            $"&key={apiKey}" +
            $"&fields=files(id,name,mimeType)" +
            $"&pageSize=20";

        var listClient = httpClientFactory.CreateClient();
        string listResponse;
        try
        {
            listResponse = await listClient.GetStringAsync(listUrl, cancellationToken);
        }
        catch (HttpRequestException)
        {
            return BadRequest(new { message = "Could not list the folder. Make sure it is shared as 'Anyone with the link can view'." });
        }

        using var listJson = System.Text.Json.JsonDocument.Parse(listResponse);
        var files = listJson.RootElement.GetProperty("files").EnumerateArray().ToList();

        if (!files.Any())
            return BadRequest(new { message = "No files found in this folder. Make sure the folder is shared as 'Anyone with the link can view'." });

        var imported = new List<object>();
        var failed = new List<string>();

        foreach (var file in files)
        {
            var fileNameInFolder = file.GetProperty("name").GetString() ?? "document";
            try
            {
                var fileIdInFolder = file.GetProperty("id").GetString();
                var mimeType = file.GetProperty("mimeType").GetString() ?? "";

                if (mimeType.Contains("folder"))
                    continue;

                var dlUrl = $"https://drive.google.com/uc?export=download&confirm=t&id={fileIdInFolder}";
                var dlClient = httpClientFactory.CreateClient();
                dlClient.Timeout = TimeSpan.FromSeconds(60);
                dlClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");

                using var dlResponse = await dlClient.GetAsync(dlUrl, cancellationToken);
                if (!dlResponse.IsSuccessStatusCode)
                {
                    failed.Add(fileNameInFolder);
                    continue;
                }

                var fileBytes = await dlResponse.Content.ReadAsByteArrayAsync(cancellationToken);
                if (fileBytes.Length == 0)
                {
                    failed.Add(fileNameInFolder);
                    continue;
                }

                var ext = mimeType.Contains("pdf") ? ".pdf"
                    : mimeType.Contains("word") || mimeType.Contains("document") ? ".docx"
                    : mimeType.Contains("sheet") || mimeType.Contains("excel") ? ".xlsx"
                    : mimeType.Contains("image/jpeg") ? ".jpg"
                    : mimeType.Contains("image/png") ? ".png"
                    : mimeType.Contains("text") ? ".txt"
                    : ".pdf";

                var cleanName = fileNameInFolder;
                if (!Path.HasExtension(cleanName))
                    cleanName += ext;
                cleanName = string.Join("_", cleanName.Split(Path.GetInvalidFileNameChars())).Trim('_');

                var dlContentType = dlResponse.Content.Headers.ContentType?.MediaType ?? "application/pdf";

                using var ms = new MemoryStream(fileBytes);
                var document = await documentService.UploadAsync(
                    caseId, cleanName, dlContentType, "Uploaded Document", null, ms, fileBytes.Length, cancellationToken);
                _ = Task.Run(async () =>
                {
                    using var scope = HttpContext.RequestServices.CreateScope();
                    var classifier = scope.ServiceProvider.GetRequiredService<Clausio.Legal.Service.DocumentClassifierService>();
                    await classifier.ClassifyDocumentAsync(document.Id);
                });

                imported.Add(new { fileName = cleanName, success = true });
            }
            catch (Exception)
            {
                failed.Add(fileNameInFolder);
            }
        }

        return Ok(new
        {
            success = true,
            isFolder = true,
            importedCount = imported.Count,
            failedCount = failed.Count,
            imported,
            failed,
            message = $"{imported.Count} file(s) imported" + (failed.Any() ? $", {failed.Count} failed" : "") + " successfully."
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid caseId, Guid id, CancellationToken cancellationToken) =>
        await documentService.DeleteAsync(caseId, id, cancellationToken) ? Ok() : NotFound();

    /// <summary>
    /// Mark a document Filed / Not Filed. Filing records the date (defaults to now)
    /// and optionally the hearing it was filed at; un-filing clears both.
    /// </summary>
    [HttpPut("{id:guid}/filing-status")]
    public async Task<IActionResult> SetFilingStatus(
        Guid caseId, Guid id, UpdateDocumentFilingDto dto, CancellationToken cancellationToken)
    {
        var isFiled = string.Equals(dto.FilingStatus, "Filed", StringComparison.OrdinalIgnoreCase);
        var isNotFiled = string.Equals(dto.FilingStatus, "Not Filed", StringComparison.OrdinalIgnoreCase);
        if (!isFiled && !isNotFiled)
            return BadRequest(new { error = "FilingStatus must be \"Filed\" or \"Not Filed\"." });

        var doc = await db.Documents.FirstOrDefaultAsync(d => d.CaseId == caseId && d.Id == id, cancellationToken);
        if (doc is null) return NotFound();

        if (isFiled)
        {
            if (dto.FiledAtHearingId.HasValue &&
                !await db.Hearings.AnyAsync(h => h.Id == dto.FiledAtHearingId && h.CaseId == caseId, cancellationToken))
                return BadRequest(new { error = "That hearing does not belong to this case." });

            doc.FilingStatus = "Filed";
            doc.FiledDate = dto.FiledDate ?? DateTime.UtcNow;
            doc.FiledAtHearingId = dto.FiledAtHearingId;
        }
        else
        {
            doc.FilingStatus = "Not Filed";
            doc.FiledDate = null;
            doc.FiledAtHearingId = null;
        }

        await db.SaveChangesAsync(cancellationToken);
        return Ok(doc);
    }
}
