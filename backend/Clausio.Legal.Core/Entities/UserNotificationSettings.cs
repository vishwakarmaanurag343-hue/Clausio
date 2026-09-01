namespace Clausio.Legal.Core.Entities;

public class UserNotificationSettings : BaseEntity
{
    public Guid UserId { get; set; }

    // Delivery channels
    public bool EmailNotif { get; set; } = true;
    public bool DesktopNotif { get; set; } = true;
    public bool WhatsappNotif { get; set; } = false;
    public bool SmsNotif { get; set; } = false;

    // Case events
    public bool UpcomingHearings { get; set; } = true;
    public bool DeadlineReminders { get; set; } = true;
    public bool NewCaseAssignment { get; set; } = true;
    public bool DocumentUpload { get; set; } = false;

    // AI notifications
    public bool DraftCompleted { get; set; } = true;
    public bool StrategyGenerated { get; set; } = true;
    public bool FinancialAnalysis { get; set; } = false;
    public bool ReadinessReport { get; set; } = true;

    // Client communication
    public bool ClientMessage { get; set; } = true;
    public bool WhatsappDelivery { get; set; } = false;
    public bool ClientPortal { get; set; } = true;

    // Billing
    public bool InvoiceGenerated { get; set; } = true;
    public bool PaymentReceived { get; set; } = true;
    public bool SubscriptionRenew { get; set; } = true;

    // Schedule
    public string DigestFrequency { get; set; } = "Daily";
    public string ReminderTime { get; set; } = "09:00";
    public int HearingReminderHours { get; set; } = 24;

    public User? User { get; set; }
}
