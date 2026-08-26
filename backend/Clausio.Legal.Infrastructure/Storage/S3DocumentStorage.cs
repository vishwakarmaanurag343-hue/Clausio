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
    if (string.IsNullOrWhiteSpace(storagePath))
        return; // nothing to delete, avoid crashing on bad/legacy data

    s3.DeleteObjectAsync(bucketName, storagePath).GetAwaiter().GetResult();
   }

    public async Task<Stream?> OpenAsync(string storagePath, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(storagePath))
            return null;

        try
        {
            var response = await s3.GetObjectAsync(bucketName, storagePath, cancellationToken);
            return response.ResponseStream;
        }
        catch (AmazonS3Exception ex) when (ex.ErrorCode == "NoSuchKey" || ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }
}
