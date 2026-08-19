namespace Clausio.Legal.Core.Entities;

public class AuditLog
{
    public Guid    Id           { get; set; } = Guid.NewGuid();
    public Guid?   UserId       { get; set; }
    public string? UserEmail    { get; set; }
    public string? UserRole     { get; set; }
    public string  Action       { get; set; } = string.Empty;
    public string? EntityType   { get; set; }
    public string? EntityId     { get; set; }
    public string? Method       { get; set; }
    public string? Path         { get; set; }
    public int?    StatusCode   { get; set; }
    public string? IpAddress    { get; set; }
    public string? UserAgent    { get; set; }
    public string? ErrorMessage { get; set; }
    public long?   Duration     { get; set; }
    public DateTime CreatedAt   { get; set; } = DateTime.UtcNow;
}