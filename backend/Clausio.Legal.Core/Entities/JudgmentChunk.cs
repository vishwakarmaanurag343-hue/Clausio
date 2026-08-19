namespace Clausio.Legal.Core.Entities;

public class JudgmentChunk
{
    public Guid    Id          { get; set; } = Guid.NewGuid();
    public Guid    JudgmentId  { get; set; }
    public string? CaseName    { get; set; }
    public int?    Year        { get; set; }
    public string? CaseType    { get; set; }
    public int     ChunkIndex  { get; set; }
    public string  ChunkText   { get; set; } = string.Empty;
    public string? SourceFile  { get; set; }
    public DateTime CreatedAt  { get; set; } = DateTime.UtcNow;
}
