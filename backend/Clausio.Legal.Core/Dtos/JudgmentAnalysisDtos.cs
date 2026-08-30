namespace Clausio.Legal.Core.Dtos;

/// <summary>Body for POST /ai/judgment-compare/{caseId} — the two judgments the advocate picked.</summary>
public record CompareJudgmentsDto(
    string Judgment1Text,
    string Judgment1Name,
    string Judgment2Text,
    string Judgment2Name
);

/// <summary>Body for POST /ai/judgment-applicability/{caseId} — one judgment to work up for court.</summary>
public record ApplicabilityDto(
    string JudgmentText,
    string JudgmentName,
    string CaseName
);

/// <summary>
/// One row of the Similar Case Finder result — the verified corpus metadata for a past
/// SC/HC judgment plus the AIPipeline-generated working notes for the current case.
/// </summary>
public class SimilarJudgmentDto
{
    public string CaseName { get; set; } = string.Empty;
    public string Citation { get; set; } = string.Empty;
    public int? Year { get; set; }
    public string Court { get; set; } = string.Empty;
    public string CaseType { get; set; } = string.Empty;
    public string RatioDecidendi { get; set; } = string.Empty;
    public string HowToUse { get; set; } = string.Empty;
    /// <summary>High | Medium | Low — keyword-overlap relevance against the current case.</summary>
    public string SimilarityLevel { get; set; } = string.Empty;
    public string ChunkText { get; set; } = string.Empty;
    /// <summary>0-1 normalised keyword-overlap score.</summary>
    public double RelevanceScore { get; set; }
}
