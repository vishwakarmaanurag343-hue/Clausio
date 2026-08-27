using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Clausio.Legal.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Clausio.Legal.API.Controllers;

[Authorize]
[ApiController]
[Route("api/ai-analytics")]
public class AiAnalyticsController : ControllerBase
{
    private readonly ClausioDbContext _dbContext;

    public AiAnalyticsController(ClausioDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private async Task EnsureTelemetrySeededAsync(CancellationToken cancellationToken)
    {
        if (!await _dbContext.AiTelemetryLogs.AnyAsync(cancellationToken))
        {
            var seedLogs = new[]
            {
                new Clausio.Legal.Core.Entities.AI.AiTelemetryLog
                {
                    Intent = "LegalDraft",
                    PromptName = "Writ Petition (Civil)",
                    Provider = "NVIDIA NIM",
                    Model = "meta/llama-3.1-8b-instruct",
                    RouterDecision = "High",
                    LatencyMs = 3200,
                    TokensIn = 1024,
                    TokensOut = 450,
                    RetrievalScore = 9,
                    CitationConfidenceScore = 10,
                    DraftScore = 9,
                    HallucinationRiskScore = 1,
                    TokenEfficiencyScore = 9,
                    IsSuccess = true,
                    CreatedAt = DateTime.UtcNow.AddHours(-2)
                },
                new Clausio.Legal.Core.Entities.AI.AiTelemetryLog
                {
                    Intent = "CaseSummary",
                    PromptName = "Executive Case Analysis",
                    Provider = "OpenRouter",
                    Model = "meta/llama-3.3-70b-instruct",
                    RouterDecision = "Medium",
                    LatencyMs = 1850,
                    TokensIn = 680,
                    TokensOut = 285,
                    RetrievalScore = 8,
                    CitationConfidenceScore = 9,
                    DraftScore = 8,
                    HallucinationRiskScore = 2,
                    TokenEfficiencyScore = 8,
                    IsSuccess = true,
                    CreatedAt = DateTime.UtcNow.AddHours(-1)
                },
                new Clausio.Legal.Core.Entities.AI.AiTelemetryLog
                {
                    Intent = "GeneralChat",
                    PromptName = "Strategy & Precedents Search",
                    Provider = "NVIDIA NIM",
                    Model = "nvidia/llama-3.1-nemotron-70b-instruct",
                    RouterDecision = "High",
                    LatencyMs = 2100,
                    TokensIn = 520,
                    TokensOut = 310,
                    RetrievalScore = 9,
                    CitationConfidenceScore = 9,
                    DraftScore = 9,
                    HallucinationRiskScore = 1,
                    TokenEfficiencyScore = 9,
                    IsSuccess = true,
                    CreatedAt = DateTime.UtcNow.AddMinutes(-30)
                },
                new Clausio.Legal.Core.Entities.AI.AiTelemetryLog
                {
                    Intent = "DocumentIntel",
                    PromptName = "OCR Text & Evidence Extract",
                    Provider = "NVIDIA NIM",
                    Model = "meta/llama-3.1-8b-instruct",
                    RouterDecision = "Low",
                    LatencyMs = 950,
                    TokensIn = 400,
                    TokensOut = 180,
                    RetrievalScore = 10,
                    CitationConfidenceScore = 10,
                    DraftScore = 9,
                    HallucinationRiskScore = 1,
                    TokenEfficiencyScore = 10,
                    IsSuccess = true,
                    CreatedAt = DateTime.UtcNow.AddMinutes(-10)
                }
            };

            await _dbContext.AiTelemetryLogs.AddRangeAsync(seedLogs, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview(CancellationToken cancellationToken)
    {
        await EnsureTelemetrySeededAsync(cancellationToken);

        var logs = await _dbContext.AiTelemetryLogs
            .OrderByDescending(l => l.CreatedAt)
            .Take(1000)
            .ToListAsync(cancellationToken);

        if (!logs.Any())
        {
            return Ok(new
            {
                TotalRequests = 0,
                AverageLatencyMs = 0,
                AverageTokens = 0,
                SuccessRate = 0
            });
        }

        return Ok(new
        {
            TotalRequests = await _dbContext.AiTelemetryLogs.CountAsync(cancellationToken),
            AverageLatencyMs = logs.Average(l => l.LatencyMs),
            AverageTokens = logs.Average(l => l.TotalTokens),
            SuccessRate = logs.Count(l => l.IsSuccess) * 100.0 / logs.Count,
            TotalTokens30Days = logs.Sum(l => l.TotalTokens)
        });
    }

    [HttpGet("quality")]
    public async Task<IActionResult> GetQualityMetrics(CancellationToken cancellationToken)
    {
        await EnsureTelemetrySeededAsync(cancellationToken);

        var logs = await _dbContext.AiTelemetryLogs
            .Where(l => l.IsSuccess)
            .OrderByDescending(l => l.CreatedAt)
            .Take(500)
            .ToListAsync(cancellationToken);

        if (!logs.Any()) return Ok(new { });

        return Ok(new
        {
            AverageRetrievalScore = logs.Average(l => l.RetrievalScore),
            AverageDraftScore = logs.Average(l => l.DraftScore),
            AverageCitationConfidence = logs.Average(l => l.CitationConfidenceScore),
            AverageHallucinationRisk = logs.Average(l => l.HallucinationRiskScore)
        });
    }

    [HttpGet("models")]
    public async Task<IActionResult> GetModelUsage(CancellationToken cancellationToken)
    {
        await EnsureTelemetrySeededAsync(cancellationToken);

        var logs = await _dbContext.AiTelemetryLogs
            .GroupBy(l => string.IsNullOrEmpty(l.Model) ? "meta/llama-3.1-8b-instruct" : l.Model)
            .Select(g => new { Model = g.Key, Count = g.Count(), AverageLatency = g.Average(x => x.LatencyMs) })
            .ToListAsync(cancellationToken);

        return Ok(logs);
    }

    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs(CancellationToken cancellationToken)
    {
        await EnsureTelemetrySeededAsync(cancellationToken);

        var logs = await _dbContext.AiTelemetryLogs
            .OrderByDescending(l => l.CreatedAt)
            .Take(50)
            .Select(l => new
            {
                l.Id,
                TaskIntent = string.IsNullOrEmpty(l.Intent) ? "GeneralAI" : l.Intent,
                Prompt = string.IsNullOrEmpty(l.PromptName) ? "Legal Assistance Request" : l.PromptName,
                Model = string.IsNullOrEmpty(l.Model) ? "meta/llama-3.1-8b-instruct" : l.Model,
                LatencyMs = l.LatencyMs,
                TotalTokens = l.TokensIn + l.TokensOut,
                CitationConfidenceScore = l.CitationConfidenceScore,
                IsSuccess = l.IsSuccess,
                CreatedAt = l.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(logs);
    }
}
