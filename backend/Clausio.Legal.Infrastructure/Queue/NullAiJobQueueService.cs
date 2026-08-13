using Microsoft.Extensions.Logging;

namespace Clausio.Legal.Infrastructure.Queue;

public class NullAiJobQueueService(ILogger<NullAiJobQueueService> logger) : IAiJobQueueService
{
    public Task<string> EnqueueJobAsync(string jobType, object payload, CancellationToken ct = default)
    {
        logger.LogInformation("[Local No-Op Queue] Enqueued {JobType} job locally.", jobType);
        return Task.FromResult(Guid.NewGuid().ToString());
    }
}
