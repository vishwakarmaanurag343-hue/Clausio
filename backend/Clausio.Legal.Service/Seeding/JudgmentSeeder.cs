using Clausio.Legal.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Clausio.Legal.Service.Seeding;

public class JudgmentSeeder(ClausioDbContext db, ILogger<JudgmentSeeder> logger)
{
    public async Task SeedAsync(CancellationToken ct = default)
    {
        try
        {
            var existing = await db.Judgments.CountAsync(ct);
            if (existing > 0)
            {
                logger.LogInformation("Judgments table has {Count} records. Skipping seeding.", existing);
                return;
            }

            logger.LogInformation("Judgments table has no records. Seeding skipped — SCC database only.");
        }
        catch (Exception ex)
        {
            logger.LogWarning("Judgment check failed: {Error}", ex.Message);
        }
    }
}
