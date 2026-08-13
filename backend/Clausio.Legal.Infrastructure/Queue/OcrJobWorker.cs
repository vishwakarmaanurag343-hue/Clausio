
using System.Net.Http.Json;
using Amazon.S3;
using Amazon.SQS;
using Amazon.SQS.Model;
using Clausio.Legal.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;
using System.Text.Json;

namespace Clausio.Legal.Infrastructure.Queue;

public class OcrJobWorker : BackgroundService
{
    private readonly IAmazonSQS _sqs;
    private readonly IAmazonS3 _s3;
    private readonly string _bucketName;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly string _queueUrl;
    private readonly ILogger<OcrJobWorker> _logger;

    public OcrJobWorker(
        IAmazonSQS sqs,
        IAmazonS3 s3,
        IHttpClientFactory httpClientFactory,
        IServiceScopeFactory scopeFactory,
        IConfiguration config,
        ILogger<OcrJobWorker> logger)
    {
        _sqs = sqs;
        _s3 = s3;
        _bucketName = config["AWS:S3BucketName"] ?? throw new InvalidOperationException("AWS:S3BucketName not configured");
        _httpClientFactory = httpClientFactory;
        _scopeFactory = scopeFactory;
        _queueUrl = config["AWS:SQSQueueUrl"] ?? throw new InvalidOperationException("AWS:SQSQueueUrl not configured");
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("OcrJobWorker started, polling {QueueUrl}", _queueUrl);

        while (!stoppingToken.IsCancellationRequested)
        {
            ReceiveMessageResponse response;
            try
            {
                response = await _sqs.ReceiveMessageAsync(new ReceiveMessageRequest
                {
                    QueueUrl = _queueUrl,
                    MaxNumberOfMessages = 5,
                    WaitTimeSeconds = 20,
                    MessageAttributeNames = new List<string> { "All" }
                }, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to receive messages from SQS, retrying in 10s");
                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
                continue;
            }

            foreach (var message in response.Messages)
            {
                try
                {
                    await ProcessMessageAsync(message, stoppingToken);
                    await _sqs.DeleteMessageAsync(_queueUrl, message.ReceiptHandle, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to process SQS message {MessageId}, leaving for retry/DLQ", message.MessageId);
                    // don't delete — redrive policy sends it to the DLQ after max attempts
                }
            }
        }
    }

    private async Task ProcessMessageAsync(Message message, CancellationToken ct)
    {
        var job = JsonSerializer.Deserialize<JsonElement>(message.Body);
        var jobType = job.GetProperty("JobType").GetString();

        if (jobType != "ocr_extraction")
        {
            _logger.LogInformation("Ignoring unrelated job type {JobType}", jobType);
            return;
        }

        var payload = job.GetProperty("Payload");
        var documentId = payload.GetProperty("DocumentId").GetGuid();
        var storagePath = payload.GetProperty("StoragePath").GetString()!;
        var contentType = payload.TryGetProperty("ContentType", out var ct2) ? ct2.GetString() : "application/octet-stream";

        _logger.LogInformation("Processing OCR job for document {DocumentId}, key {StoragePath}", documentId, storagePath);

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ClausioDbContext>();

        var document = await db.Documents.FirstOrDefaultAsync(d => d.Id == documentId, ct);
        if (document == null)
        {
            _logger.LogWarning("Document {DocumentId} no longer exists, skipping", documentId);
            return;
        }

        try
        {
            using var s3Object = await _s3.GetObjectAsync(_bucketName, storagePath, ct);
            using var memStream = new MemoryStream();
            await s3Object.ResponseStream.CopyToAsync(memStream, ct);
            memStream.Position = 0;

            var voiceClient = _httpClientFactory.CreateClient("VoiceService");
            using var content = new MultipartFormDataContent();
            using var streamContent = new StreamContent(memStream);
            streamContent.Headers.ContentType = new MediaTypeHeaderValue(contentType ?? "application/octet-stream");
            content.Add(streamContent, "file", storagePath.Split('/').Last());

            var ocrResponse = await voiceClient.PostAsync("/api/ocr", content, ct);
            ocrResponse.EnsureSuccessStatusCode();

            var resultJson = await ocrResponse.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
            var extractedText = resultJson.TryGetProperty("text", out var textProp) ? textProp.GetString() : null;

            document.ExtractedText = extractedText ?? string.Empty;
            document.OcrStatus = "Completed";
            document.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);

            _logger.LogInformation("OCR completed for document {DocumentId}", documentId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OCR failed for document {DocumentId}", documentId);
            document.OcrStatus = "Failed";
            document.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            throw; // let the SQS message go back for retry per the queue's redrive policy
        }
    }
}
