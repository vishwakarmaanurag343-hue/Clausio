namespace Clausio.Legal.Core.Dtos;

public class CreateDraftDto
{
    public Guid CaseId { get; set; }
    public string DraftType { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string Content { get; set; } = string.Empty;
}

public class AddDraftVersionDto
{
    public string Content { get; set; } = string.Empty;
}

public class DraftVersionDto
{
    public Guid Id { get; set; }
    public int VersionNumber { get; set; }
    public string Content { get; set; } = string.Empty;
    public Guid EditedByUserId { get; set; }
    public string EditedByName { get; set; } = string.Empty;
    public DateTime EditedAt { get; set; }
    public string Status { get; set; } = "Draft";
}

public class DraftDto
{
    public Guid Id { get; set; }
    public Guid CaseId { get; set; }
    public string DraftType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int CurrentVersionNumber { get; set; }
    public bool IsFinal { get; set; }
    public List<DraftVersionDto> Versions { get; set; } = new();
}
