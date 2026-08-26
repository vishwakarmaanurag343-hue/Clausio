using Clausio.Legal.Infrastructure.Queue;
using Clausio.Legal.Core.Entities;
using Clausio.Legal.Infrastructure;
using Clausio.Legal.Infrastructure.Extraction;
using Clausio.Legal.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;

namespace Clausio.Legal.Service;

public interface IDocumentService
{
    Task<List<Document>> ListAsync(Guid caseId, CancellationToken cancellationToken = default);
    Task<Document> UploadAsync(Guid caseId, string fileName, string? contentType, string? documentType, string? exhibitLabel, Stream content, long sizeBytes, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid caseId, Guid id, CancellationToken cancellationToken = default);

    /// <summary>Opens a stored case file for streaming to the client; null when the document or its file is missing.</summary>
    Task<(Stream Stream, string ContentType, string FileName)?> OpenAsync(Guid caseId, Guid id, CancellationToken cancellationToken = default);
}

public class DocumentService(ClausioDbContext db, IDocumentStorage storage, IDocumentTextExtractor textExtractor, IAiJobQueueService jobQueue) : IDocumentService
{
    public Task<List<Document>> ListAsync(Guid caseId, CancellationToken cancellationToken = default) =>
        db.Documents.AsNoTracking().Where(d => d.CaseId == caseId).OrderByDescending(d => d.CreatedAt).ToListAsync(cancellationToken);

    public async Task<(Stream Stream, string ContentType, string FileName)?> OpenAsync(Guid caseId, Guid id, CancellationToken cancellationToken = default)
    {
        var doc = await db.Documents.AsNoTracking()
            .FirstOrDefaultAsync(d => d.CaseId == caseId && d.Id == id, cancellationToken);
        if (doc?.StoragePath is null) return null;

        var stream = await storage.OpenAsync(doc.StoragePath, cancellationToken);
        return stream is null ? null : (stream, doc.ContentType ?? "application/octet-stream", doc.FileName);
    }

    public async Task<Document> UploadAsync(Guid caseId, string fileName, string? contentType, string? documentType, string? exhibitLabel, Stream content, long sizeBytes, CancellationToken cancellationToken = default)
    {
        var documentId = Guid.NewGuid();
        var storagePath = await storage.SaveAsync(caseId, documentId, fileName, content, cancellationToken);
        var extractedText = await textExtractor.ExtractTextAsync(storagePath, fileName, cancellationToken);

        var entity = new Document
        {
            Id = documentId,
            CaseId = caseId,
            FileName = Path.GetFileName(fileName),
            DocumentType = documentType,
            ExhibitLabel = exhibitLabel,
            StoragePath = storagePath,
            ContentType = contentType,
            SizeBytes = sizeBytes,
            ExtractedText = extractedText,
            OcrStatus = !string.IsNullOrWhiteSpace(extractedText) ? "Completed" : "Pending"
        };

        db.Documents.Add(entity);
        await db.SaveChangesAsync(cancellationToken);

        await jobQueue.EnqueueJobAsync("ocr_extraction", new
        {
            DocumentId = documentId,
            CaseId = caseId,
            StoragePath = storagePath,
            ContentType = contentType
        }, cancellationToken);

        return entity;
    }

    public async Task<bool> DeleteAsync(Guid caseId, Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await db.Documents.FirstOrDefaultAsync(d => d.CaseId == caseId && d.Id == id, cancellationToken);
        if (entity is null) return false;

        storage.Delete(entity.StoragePath);
        db.Documents.Remove(entity);
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
