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
public class DocumentsController(IDocumentService documentService, ClausioDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(Guid caseId, CancellationToken cancellationToken) =>
        Ok(await documentService.ListAsync(caseId, cancellationToken));

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
