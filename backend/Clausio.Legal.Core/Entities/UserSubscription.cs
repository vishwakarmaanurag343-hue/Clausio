namespace Clausio.Legal.Core.Entities;

public class UserSubscription : BaseEntity
{
    public Guid UserId { get; set; }

    // Plan details
    public string PlanName { get; set; } = "Free Trial";
    // Values: "Free Trial" | "Starter" | "Professional" | "Enterprise"

    public string Status { get; set; } = "Active";
    // Values: "Active" | "Expired" | "Cancelled" | "Trial"

    public bool IsAnnual { get; set; } = false;

    // Dates
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime EndDate { get; set; } = DateTime.UtcNow.AddDays(5);

    // Razorpay
    public string? RazorpaySubscriptionId { get; set; }
    public string? RazorpayCustomerId { get; set; }
    public string? RazorpayPaymentId { get; set; }

    // Pricing
    public decimal Amount { get; set; } = 0;
    public decimal GSTAmount { get; set; } = 0;
    public decimal TotalAmount { get; set; } = 0;

    // Limits for this plan
    public int MaxCases { get; set; } = 999999;
    public int MaxDraftsPerMonth { get; set; } = 999999;
    public int MaxTeamMembers { get; set; } = 1;
    public long MaxStorageBytes { get; set; } = 5368709120; // 5 GB

    public User? User { get; set; }
}
