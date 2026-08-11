using Amazon.S3;
using Amazon.S3.Model;

namespace Clausio.Legal.Infrastructure.Storage;

public class S3DocumentStorage(IAmazonS3 s3, string bucketName) : IDocumentStorage
{
    public async Task<string> SaveAsync(Guid caseId, Guid documentId, string fileName, Stream content, CancellationToken cancellationToken = default)
    {
        var safeFileName = Path.GetFileName(fileName);
        var key = $"cases/{caseId}/documents/{documentId}_{safeFileName}";

        var request = new PutObjectRequest
        {
            BucketName = bucketName,
            Key = key,
            InputStream = content,
            ServerSideEncryptionMethod = ServerSideEncryptionMethod.AES256
        };
        await s3.PutObjectAsync(request, cancellationToken);
        return key;
    }

    public void Delete(string storagePath)
    {
        // Fire-and-forget delete to match the existing sync interface signature
        s3.DeleteObjectAsync(bucketName, storagePath).GetAwaiter().GetResult();
    }
}
