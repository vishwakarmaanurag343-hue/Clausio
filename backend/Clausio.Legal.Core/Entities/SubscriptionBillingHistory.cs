namespace Clausio.Legal.Core.Entities;

public class SubscriptionBillingHistory : BaseEntity
{
    public Guid UserId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    public string PlanName { get; set; } = string.Empty;
    public bool IsAnnual { get; set; } = false;
    public decimal Amount { get; set; } = 0;
    public decimal GSTAmount { get; set; } = 0;
    public decimal TotalAmount { get; set; } = 0;
    public string Status { get; set; } = "Paid";
    // Values: "Paid" | "Failed" | "Refunded"
    public string? RazorpayPaymentId { get; set; }
    public User? User { get; set; }
}
