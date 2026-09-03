using System.Text.Json;
using Clausio.Legal.API.Filters;
using Clausio.Legal.Core.Dtos;
using Clausio.Legal.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Clausio.Legal.API.Controllers;

[Authorize]
[ApiController]
[Route("api/cases/{caseId:guid}/readiness")]
public class ReadinessController(IReadinessService readinessService, IAiService aiService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(Guid caseId, CancellationToken cancellationToken) =>
        Ok(await readinessService.GetReportAsync(caseId, cancellationToken));

    /// <summary>
    /// Generates a case-type-tailored assessment via the ReadinessAssessment template.
    /// Optional body carries the Generate modal's focus inputs (hearing type, objective…).
    /// An unreadable AI response surfaces as a retryable error — junk is never persisted.
    /// </summary>
    [HttpPost("generate")]
    [RequireActiveSubscription]
    public async Task<IActionResult> Generate(Guid caseId, [FromBody] GenerateReadinessOptionsDto? options = null, CancellationToken cancellationToken = default)
    {
        var raw = await aiService.AssessReadinessAsync(caseId, options, cancellationToken);
        var parsed = ParseAssessment(raw);
        if (parsed is null)
            return BadRequest(new { error = "The AI returned an unreadable readiness assessment. Please try again." });

        var (score, summary, checklist, strengths, gaps) = parsed.Value;
        var result = await readinessService.SetGeneratedAsync(caseId, score, summary, checklist, strengths, gaps, cancellationToken);
        return Ok(result);
    }

    [HttpPut("score")]
    public async Task<IActionResult> UpdateScore(Guid caseId, UpdateScoreDto dto, CancellationToken cancellationToken)
    {
        var readiness = await readinessService.UpdateScoreAsync(caseId, dto.Score, cancellationToken);
        return Ok(ReadinessService.MapReport(readiness));
    }

    [HttpGet("checklist")]
    public async Task<IActionResult> GetChecklist(Guid caseId, CancellationToken cancellationToken) =>
        Ok(await readinessService.GetChecklistAsync(caseId, cancellationToken));

    /// <summary>
    /// Parses the strict ReadinessAssessment contract:
    /// {overallScore, scoreSummary, checklist[{item, caseTypeRelevance, status, controllable, actionNeeded}], strengths[], gaps[]}.
    /// Returns null on ANY structural failure so the caller can reject the response.
    /// </summary>
    private static (int Score, string Summary, List<ReadinessChecklistItemDto> Checklist, List<string> Strengths, List<string> Gaps)? ParseAssessment(string raw)
    {
        try
        {
            var cleaned = raw.Trim();
            if (cleaned.StartsWith("```")) cleaned = cleaned.Substring(cleaned.IndexOf('\n') + 1);
            if (cleaned.EndsWith("```"))   cleaned = cleaned.Substring(0, cleaned.LastIndexOf("```"));
            cleaned = cleaned.Trim();

            using var doc  = JsonDocument.Parse(cleaned);
            var root = doc.RootElement;
            if (root.ValueKind != JsonValueKind.Object) return null;

            var score   = root.TryGetProperty("overallScore", out var sp) && sp.TryGetInt32(out var s)
                ? Math.Clamp(s, 0, 100)
                : 50;
            var summary = root.TryGetProperty("scoreSummary", out var sum) ? sum.GetString() ?? "" : "";

            var checklist = new List<ReadinessChecklistItemDto>();
            if (root.TryGetProperty("checklist", out var cl) && cl.ValueKind == JsonValueKind.Array)
                foreach (var el in cl.EnumerateArray())
                {
                    var item = el.TryGetProperty("item", out var it) ? it.GetString() : null;
                    if (string.IsNullOrWhiteSpace(item)) continue;
                    var status = el.TryGetProperty("status", out var st) ? st.GetString() : null;
                    checklist.Add(new ReadinessChecklistItemDto
                    {
                        Item              = item.Trim(),
                        CaseTypeRelevance = el.TryGetProperty("caseTypeRelevance", out var rel) ? rel.GetString() ?? "" : "",
                        Status            = status is "Done" or "Pending" or "At Risk" ? status : "Pending",
                        // Absent field defaults to controllable — the safer assumption for an advocate's own list.
                        Controllable      = !el.TryGetProperty("controllable", out var c) || c.ValueKind != JsonValueKind.True && c.ValueKind != JsonValueKind.False || c.GetBoolean(),
                        ActionNeeded      = el.TryGetProperty("actionNeeded", out var an) && an.ValueKind == JsonValueKind.String ? an.GetString() : null,
                    });
                }

            return (score, summary, checklist, ReadStringArray(root, "strengths"), ReadStringArray(root, "gaps"));
        }
        catch
        {
            return null;
        }
    }

    /// <summary>Reads a JSON array of strings; tolerates legacy object elements by lifting their title/item.</summary>
    private static List<string> ReadStringArray(JsonElement root, string property)
    {
        var list = new List<string>();
        if (root.TryGetProperty(property, out var arr) && arr.ValueKind == JsonValueKind.Array)
            foreach (var el in arr.EnumerateArray())
            {
                if (el.ValueKind == JsonValueKind.String)
                {
                    var s = el.GetString();
                    if (!string.IsNullOrWhiteSpace(s)) list.Add(s.Trim());
                }
                else if (el.ValueKind == JsonValueKind.Object)
                {
                    var title = el.TryGetProperty("title", out var t) ? t.GetString()
                              : el.TryGetProperty("item", out var i2) ? i2.GetString()
                              : null;
                    if (!string.IsNullOrWhiteSpace(title)) list.Add(title.Trim());
                }
            }
        return list;
    }
}
