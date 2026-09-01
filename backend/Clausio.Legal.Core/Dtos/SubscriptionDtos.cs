namespace Clausio.Legal.Core.Dtos;

// Current subscription status returned to frontend
public class SubscriptionStatusDto
{
    public string PlanName { get; set; } = "Free Trial";
    public string Status { get; set; } = "Trial";
    public bool IsAnnual { get; set; } = false;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int DaysRemaining { get; set; }
    public decimal Amount { get; set; }
    public decimal GSTAmount { get; set; }
    public decimal TotalAmount { get; set; }

    // Usage (calculated from actual DB data)
    public int ActiveCasesCount { get; set; }
    public int MaxCases { get; set; }
    public int DraftsThisMonth { get; set; }
    public int MaxDraftsPerMonth { get; set; }
    public int TeamMembersCount { get; set; }
    public int MaxTeamMembers { get; set; }
    public long StorageUsedBytes { get; set; }
    public long MaxStorageBytes { get; set; }
}

// One plan option shown in pricing section
public class SubscriptionPlanDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal MonthlyPrice { get; set; }
    public decimal AnnualPrice { get; set; }
    public bool IsRecommended { get; set; }
    public List<PlanFeatureDto> Features { get; set; } = new();
    public int MaxCases { get; set; }
    public int MaxDraftsPerMonth { get; set; }
    public int MaxTeamMembers { get; set; }
    public long MaxStorageBytes { get; set; }
}

public class PlanFeatureDto
{
    public string Text { get; set; } = string.Empty;
    public bool Included { get; set; }
}

// One row in billing history
public class SubscriptionBillingHistoryDto
{
    public Guid Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
    public string PlanName { get; set; } = string.Empty;
    public bool IsAnnual { get; set; }
    public decimal Amount { get; set; }
    public decimal GSTAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? RazorpayPaymentId { get; set; }
}

// Request to create Razorpay order
public class CreateSubscriptionOrderDto
{
    public string PlanName { get; set; } = string.Empty;
    public bool IsAnnual { get; set; } = false;
}

// Razorpay order response to frontend
public class SubscriptionOrderResponseDto
{
    public string OrderId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public string RazorpayKeyId { get; set; } = string.Empty;
    public string PlanName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
}

// Payment verification from frontend after Razorpay success
public class VerifySubscriptionPaymentDto
{
    public string RazorpayOrderId { get; set; } = string.Empty;
    public string RazorpayPaymentId { get; set; } = string.Empty;
    public string RazorpaySignature { get; set; } = string.Empty;
    public string PlanName { get; set; } = string.Empty;
    public bool IsAnnual { get; set; } = false;
}

// Cancel request
public class CancelSubscriptionDto
{
    public string Reason { get; set; } = string.Empty;
}
