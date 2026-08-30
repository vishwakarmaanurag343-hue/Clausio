namespace Clausio.Legal.Core.Entities;

/// <summary>
/// A lawyer's own firm document uploaded as a STYLE reference. When a prompt or draft
/// is run with one selected, its extracted text is injected into the AI context so the
/// output matches the firm's structure, prayer format and language. Per-user.
/// </summary>
public class PromptReferenceDoc
{
    public Guid   Id            { get; set; } = Guid.NewGuid();
    public Guid   UserId        { get; set; }
    public string Title         { get; set; } = "";   // e.g. "Our Firm's Maintenance Application Format"
    public string DocType       { get; set; } = "";   // e.g. "Maintenance", "Bail", "Plaint", "Written Statement"
    public string ExtractedText { get; set; } = "";   // full text extracted from the uploaded file
    public string FileName      { get; set; } = "";
    public long   FileSizeBytes { get; set; }
    public DateTime CreatedAt   { get; set; } = DateTime.UtcNow;
}
