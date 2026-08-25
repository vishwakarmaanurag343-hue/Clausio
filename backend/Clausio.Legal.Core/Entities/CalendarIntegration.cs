namespace Clausio.Legal.Core.Entities;

public class CalendarIntegration : BaseEntity
{
    public Guid UserId { get; set; }
    public string EncryptedRefreshToken { get; set; } = string.Empty;   // AES-encrypted at rest
    public string CalendarId { get; set; } = "primary";
    public DateTime? LastSyncedAt { get; set; }
    public string? LastSyncError { get; set; }

    public User? User { get; set; }
}
