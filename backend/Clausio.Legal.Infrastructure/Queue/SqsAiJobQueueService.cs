using Amazon.SQS;
using Amazon.SQS.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace Clausio.Legal.Infrastructure.Queue;

public interface IAiJobQueueService
{
    Task<string> EnqueueJobAsync(string jobType, object payload, CancellationToken ct = default);
}

public class SqsAiJobQueueService : IAiJobQueueService
{
    private readonly IAmazonSQS _sqs;
    private readonly string _queueUrl;
    private readonly ILogger<SqsAiJobQueueService> _logger;

    public SqsAiJobQueueService(IAmazonSQS sqs, IConfiguration config, ILogger<SqsAiJobQueueService> logger)
    {
        _sqs = sqs;
        _queueUrl = config["AWS:SQSQueueUrl"] ?? throw new InvalidOperationException("AWS:SQSQueueUrl not configured");
        _logger = logger;
    }

    public async Task<string> EnqueueJobAsync(string jobType, object payload, CancellationToken ct = default)
    {
        var message = new { JobType = jobType, Payload = payload, EnqueuedAt = DateTime.UtcNow };

        var request = new SendMessageRequest
        {
            QueueUrl = _queueUrl,
            MessageBody = JsonSerializer.Serialize(message),
            MessageAttributes = new Dictionary<string, MessageAttributeValue>
            {
                ["JobType"] = new MessageAttributeValue { DataType = "String", StringValue = jobType }
            }
        };

        var response = await _sqs.SendMessageAsync(request, ct);
        _logger.LogInformation("Enqueued {JobType} job, MessageId: {MessageId}", jobType, response.MessageId);
        return response.MessageId;
    }
}
