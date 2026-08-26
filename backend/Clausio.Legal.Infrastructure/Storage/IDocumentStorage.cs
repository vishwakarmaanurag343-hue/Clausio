namespace Clausio.Legal.Infrastructure.Storage;

public interface IDocumentStorage
{
    Task<string> SaveAsync(Guid caseId, Guid documentId, string fileName, Stream content, CancellationToken cancellationToken = default);
    void Delete(string storagePath);

    /// <summary>Opens a stored file for reading; null when the file is missing.</summary>
    Task<Stream?> OpenAsync(string storagePath, CancellationToken cancellationToken = default);
}
