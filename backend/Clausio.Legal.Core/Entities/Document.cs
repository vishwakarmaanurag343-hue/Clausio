namespace Clausio.Legal.Core.Entities;

public class Document : BaseEntity
{
    public string FileName { get; set; } = string.Empty;
    public string? DocumentType { get; set; }
    public string? ExhibitLabel { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public string? ContentType { get; set; }
    public long SizeBytes { get; set; }
    public string? ExtractedText { get; set; }
    public string OcrStatus { get; set; } = "Pending";
    public string? Category            { get; set; }
    public int     CategoryConfidence  { get; set; } = 0;
    public string? CategoryDescription { get; set; }

    // Court-filing lifecycle: "Filed" | "Not Filed" (default for existing + new rows).
    public string FilingStatus { get; set; } = "Not Filed";
    public DateTime? FiledDate { get; set; }
    public Guid? FiledAtHearingId { get; set; }
    public Hearing? FiledAtHearing { get; set; }

    public Guid CaseId { get; set; }
    public Case? Case { get; set; }
}
