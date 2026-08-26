namespace Clausio.Legal.Core.Dtos;

public class UpdateScoreDto
{
    public int Score { get; set; }
}

// ── Case-type-tailored readiness contract ──

/// <summary>Optional focus inputs from the Generate modal, steering the assessment.</summary>
public class GenerateReadinessOptionsDto
{
    public string? HearingType { get; set; }
    public string? Court       { get; set; }
    public string? Objective   { get; set; }
    public string? Urgency     { get; set; }
    public string? Notes       { get; set; }
    public List<string>? FocusAreas { get; set; }
}

public class ReadinessChecklistItemDto
{
    public string  Item              { get; set; } = "";
    public string  CaseTypeRelevance { get; set; } = "";
    public string  Status            { get; set; } = "Pending";
    public bool    Controllable      { get; set; } = true;
    public string? ActionNeeded      { get; set; }
}

public class ReadinessReportDto
{
    public int OverallScore { get; set; }
    public string ScoreSummary { get; set; } = "";
    public List<ReadinessChecklistItemDto> Checklist { get; set; } = new();
    public List<string> Strengths { get; set; } = new();
    public List<string> Gaps      { get; set; } = new();
}
