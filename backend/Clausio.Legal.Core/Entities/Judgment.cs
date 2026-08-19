namespace Clausio.Legal.Core.Entities;

public class Judgment
{
    public Guid     Id             { get; set; } = Guid.NewGuid();
    public string   Citation       { get; set; } = string.Empty;
    public string?  ShortName      { get; set; }
    public string?  Court          { get; set; }
    public int?     Year           { get; set; }
    public string?  CaseType       { get; set; }
    public string?  RatioDecidendi { get; set; }
    public string?  FullText       { get; set; }
    public string?  SourceUrl      { get; set; }
    public bool     IsVerified     { get; set; } = true;
    public DateTime CreatedAt      { get; set; } = DateTime.UtcNow;
}
