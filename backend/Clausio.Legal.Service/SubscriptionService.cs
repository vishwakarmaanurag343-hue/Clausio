using Clausio.Legal.Core.Dtos;
using Clausio.Legal.Core.Entities;
using Clausio.Legal.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Security.Cryptography;
using System.Text;

namespace Clausio.Legal.Service;

public interface ISubscriptionService
{
    Task<SubscriptionStatusDto> GetStatusAsync(
        Guid userId, CancellationToken ct = default);

    Task<List<SubscriptionPlanDto>> GetPlansAsync(
        CancellationToken ct = default);

    Task<SubscriptionOrderResponseDto> CreateOrderAsync(
        Guid userId, CreateSubscriptionOrderDto dto,
        CancellationToken ct = default);

    Task<bool> VerifyAndActivateAsync(
        Guid userId, VerifySubscriptionPaymentDto dto,
        CancellationToken ct = default);

    Task<List<SubscriptionBillingHistoryDto>> GetBillingHistoryAsync(
        Guid userId, CancellationToken ct = default);

    Task<bool> CancelAsync(
        Guid userId, CancelSubscriptionDto dto,
        CancellationToken ct = default);
}

public class SubscriptionService(
    ClausioDbContext db,
    IConfiguration config) : ISubscriptionService
{
    // Plan definitions — single source of truth
    // These drive both the plans list AND
    // what gets stored when a plan is activated
    private static readonly List<SubscriptionPlanDto> Plans = new()
    {
        new SubscriptionPlanDto
        {
            Name = "Starter",
            Description = "Perfect for solo advocates",
            MonthlyPrice = 1999,
            AnnualPrice = 19190, // 1999 * 12 * 0.8 = 20% off
            IsRecommended = false,
            MaxCases = 10,
            MaxDraftsPerMonth = 20,
            MaxTeamMembers = 1,
            MaxStorageBytes = 2147483648, // 2 GB
            Features = new List<PlanFeatureDto>
            {
                new() { Text = "Up to 10 active cases", Included = true },
                new() { Text = "20 AI document drafts per month", Included = true },
                new() { Text = "Basic legal research", Included = true },
                new() { Text = "Hearing calendar", Included = true },
                new() { Text = "Client management", Included = true },
                new() { Text = "Invoice generation", Included = true },
                new() { Text = "2 GB document storage", Included = true },
                new() { Text = "RAG judgment search", Included = false },
                new() { Text = "Evidence graph", Included = false },
                new() { Text = "Cross-examination prep", Included = false },
                new() { Text = "Team members", Included = false },
                new() { Text = "Priority support", Included = false },
            }
        },
        new SubscriptionPlanDto
        {
            Name = "Professional",
            Description = "For established advocates and small firms",
            MonthlyPrice = 4999,
            AnnualPrice = 47990, // 4999 * 12 * 0.8 = 20% off
            IsRecommended = true,
            MaxCases = 999999,
            MaxDraftsPerMonth = 999999,
            MaxTeamMembers = 3,
            MaxStorageBytes = 5368709120, // 5 GB
            Features = new List<PlanFeatureDto>
            {
                new() { Text = "Unlimited active cases", Included = true },
                new() { Text = "Unlimited AI document drafts", Included = true },
                new() { Text = "RAG judgment search (eCourts database)", Included = true },
                new() { Text = "Advanced legal research", Included = true },
                new() { Text = "Evidence graph", Included = true },
                new() { Text = "Cross-examination preparation", Included = true },
                new() { Text = "Financial calculators", Included = true },
                new() { Text = "Up to 3 team members", Included = true },
                new() { Text = "5 GB document storage", Included = true },
                new() { Text = "Priority support", Included = true },
                new() { Text = "White label option", Included = false },
                new() { Text = "Custom integrations", Included = false },
            }
        },
        new SubscriptionPlanDto
        {
            Name = "Enterprise",
            Description = "For law firms and corporate legal teams",
            MonthlyPrice = 0, // Custom pricing
            AnnualPrice = 0,
            IsRecommended = false,
            MaxCases = 999999,
            MaxDraftsPerMonth = 999999,
            MaxTeamMembers = 999999,
            MaxStorageBytes = 107374182400, // 100 GB
            Features = new List<PlanFeatureDto>
            {
                new() { Text = "Everything in Professional", Included = true },
                new() { Text = "Unlimited team members", Included = true },
                new() { Text = "100 GB document storage", Included = true },
                new() { Text = "White label option", Included = true },
                new() { Text = "Custom integrations", Included = true },
                new() { Text = "Dedicated account manager", Included = true },
                new() { Text = "Custom training sessions", Included = true },
                new() { Text = "SLA guarantee", Included = true },
                new() { Text = "GSTIN billing compliance", Included = true },
                new() { Text = "Priority 24/7 support", Included = true },
            }
        }
    };

    // The Razorpay gateway is "live" only when a real key is configured.
    // With the placeholder appsettings value we fall back to a test-activation
    // path so plans can still be chosen (data is written to the DB either way).
    private bool GatewayConfigured
    {
        get
        {
            var keyId = config["Razorpay:KeyId"];
            return !string.IsNullOrWhiteSpace(keyId)
                && !keyId.Contains("YOUR_KEY", StringComparison.OrdinalIgnoreCase);
        }
    }

    public async Task<List<SubscriptionPlanDto>> GetPlansAsync(
        CancellationToken ct = default)
    {
        return await Task.FromResult(Plans);
    }

    public async Task<SubscriptionStatusDto> GetStatusAsync(
        Guid userId, CancellationToken ct = default)
    {
        // Get or create subscription record
        var sub = await db.UserSubscriptions
            .FirstOrDefaultAsync(s => s.UserId == userId, ct);

        if (sub == null)
        {
            // Create free trial for new user
            sub = new UserSubscription
            {
                UserId = userId,
                PlanName = "Free Trial",
                Status = "Trial",
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(5),
                MaxCases = 3,
                MaxDraftsPerMonth = 5,
                MaxTeamMembers = 1,
                MaxStorageBytes = 1073741824 // 1 GB
            };
            db.UserSubscriptions.Add(sub);
            await db.SaveChangesAsync(ct);
        }

        // Calculate real usage from DB
        var activeCases = await db.Cases
            .CountAsync(c => c.CreatedByUserId == userId &&
                c.Status != "Closed", ct);

        var draftsThisMonth = await db.Drafts
            .CountAsync(d => d.CreatedByUserId == userId &&
                d.CreatedAt.Month == DateTime.UtcNow.Month &&
                d.CreatedAt.Year == DateTime.UtcNow.Year, ct);

        var teamMembers = await db.Users
            .CountAsync(u => u.IsActive, ct);

        var myCaseIds = db.Cases
            .Where(c => c.CreatedByUserId == userId)
            .Select(c => c.Id);
        var storageBytes = await db.Documents
            .Where(d => myCaseIds.Contains(d.CaseId))
            .SumAsync(d => (long?)d.SizeBytes, ct) ?? 0;

        var daysRemaining = (int)(sub.EndDate - DateTime.UtcNow).TotalDays;
        if (daysRemaining < 0) daysRemaining = 0;

        // Auto-expire if past end date
        if (sub.EndDate < DateTime.UtcNow &&
            sub.Status == "Active")
        {
            sub.Status = "Expired";
            await db.SaveChangesAsync(ct);
        }

        return new SubscriptionStatusDto
        {
            PlanName = sub.PlanName,
            Status = sub.Status,
            IsAnnual = sub.IsAnnual,
            StartDate = sub.StartDate,
            EndDate = sub.EndDate,
            DaysRemaining = daysRemaining,
            Amount = sub.Amount,
            GSTAmount = sub.GSTAmount,
            TotalAmount = sub.TotalAmount,
            ActiveCasesCount = activeCases,
            MaxCases = sub.MaxCases,
            DraftsThisMonth = draftsThisMonth,
            MaxDraftsPerMonth = sub.MaxDraftsPerMonth,
            TeamMembersCount = teamMembers,
            MaxTeamMembers = sub.MaxTeamMembers,
            StorageUsedBytes = storageBytes,
            MaxStorageBytes = sub.MaxStorageBytes
        };
    }

    public async Task<SubscriptionOrderResponseDto> CreateOrderAsync(
        Guid userId, CreateSubscriptionOrderDto dto,
        CancellationToken ct = default)
    {
        var plan = Plans.FirstOrDefault(p => p.Name == dto.PlanName)
            ?? throw new Exception("Invalid plan selected.");

        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new Exception("User not found.");

        var baseAmount = dto.IsAnnual
            ? plan.AnnualPrice
            : plan.MonthlyPrice;

        var gst = Math.Round(baseAmount * 0.18m, 2);
        var total = baseAmount + gst;

        var orderId = "";
        var responseKeyId = "";

        if (GatewayConfigured)
        {
            // Generate Razorpay order via API
            var razorpayKeyId = config["Razorpay:KeyId"]!;
            var razorpaySecret = config["Razorpay:KeySecret"]
                ?? throw new Exception("Razorpay:KeySecret not configured.");

            using var client = new System.Net.Http.HttpClient();
            var credentials = Convert.ToBase64String(
                Encoding.ASCII.GetBytes($"{razorpayKeyId}:{razorpaySecret}"));
            client.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue(
                    "Basic", credentials);

            var orderPayload = new
            {
                amount = (int)(total * 100), // Razorpay uses paise
                currency = "INR",
                receipt = $"sub_{userId}_{DateTime.UtcNow.Ticks}",
                notes = new { plan = dto.PlanName, userId = userId.ToString() }
            };

            var response = await client.PostAsync(
                "https://api.razorpay.com/v1/orders",
                new System.Net.Http.StringContent(
                    System.Text.Json.JsonSerializer.Serialize(orderPayload),
                    Encoding.UTF8, "application/json"));

            var responseBody = await response.Content.ReadAsStringAsync(ct);
            using var razorpayOrder = System.Text.Json.JsonDocument.Parse(responseBody);
            if (!razorpayOrder.RootElement.TryGetProperty("id", out var idEl)
                || string.IsNullOrEmpty(idEl.GetString()))
                throw new Exception($"Razorpay order creation failed: {responseBody}");

            orderId = idEl.GetString()!;
            responseKeyId = razorpayKeyId;
        }
        // else: no live gateway — RazorpayKeyId stays "" so the frontend
        // skips the checkout popup and activates the plan directly (test mode).

        return new SubscriptionOrderResponseDto
        {
            OrderId = orderId,
            Amount = total,
            Currency = "INR",
            RazorpayKeyId = responseKeyId,
            PlanName = dto.PlanName,
            UserEmail = user.Email,
            UserName = $"{user.FirstName} {user.LastName}".Trim()
        };
    }

    public async Task<bool> VerifyAndActivateAsync(
        Guid userId, VerifySubscriptionPaymentDto dto,
        CancellationToken ct = default)
    {
        // Verify Razorpay signature — only when a live gateway is configured.
        // In test mode (placeholder keys) there is no signature to check; the
        // plan is activated directly and still written to the DB.
        if (GatewayConfigured)
        {
            var razorpaySecret = config["Razorpay:KeySecret"]
                ?? throw new Exception("Razorpay:KeySecret not configured.");

            var payload = $"{dto.RazorpayOrderId}|{dto.RazorpayPaymentId}";
            using var hmac = new HMACSHA256(Encoding.ASCII.GetBytes(razorpaySecret));
            var hash = hmac.ComputeHash(Encoding.ASCII.GetBytes(payload));
            var generatedSignature = BitConverter.ToString(hash)
                .Replace("-", "").ToLower();

            if (generatedSignature != dto.RazorpaySignature)
                return false;
        }

        var plan = Plans.FirstOrDefault(p => p.Name == dto.PlanName)
            ?? throw new Exception("Invalid plan.");

        var baseAmount = dto.IsAnnual
            ? plan.AnnualPrice : plan.MonthlyPrice;
        var gst = Math.Round(baseAmount * 0.18m, 2);
        var total = baseAmount + gst;

        // Update or create subscription
        var sub = await db.UserSubscriptions
            .FirstOrDefaultAsync(s => s.UserId == userId, ct);

        var now = DateTime.UtcNow;
        var endDate = dto.IsAnnual
            ? now.AddYears(1) : now.AddMonths(1);

        if (sub == null)
        {
            sub = new UserSubscription { UserId = userId };
            db.UserSubscriptions.Add(sub);
        }

        sub.PlanName = dto.PlanName;
        sub.Status = "Active";
        sub.IsAnnual = dto.IsAnnual;
        sub.StartDate = now;
        sub.EndDate = endDate;
        sub.RazorpayPaymentId = dto.RazorpayPaymentId;
        sub.Amount = baseAmount;
        sub.GSTAmount = gst;
        sub.TotalAmount = total;

        // Set plan limits
        sub.MaxCases = plan.MaxCases;
        sub.MaxDraftsPerMonth = plan.MaxDraftsPerMonth;
        sub.MaxTeamMembers = plan.MaxTeamMembers;
        sub.MaxStorageBytes = plan.MaxStorageBytes;

        // Record billing history
        var invoiceCount = await db.SubscriptionBillingHistories
            .CountAsync(h => h.UserId == userId, ct);
        var invoiceNumber =
            $"CLAUS-{now:yyyy}-{(invoiceCount + 1):D4}";

        db.SubscriptionBillingHistories.Add(
            new SubscriptionBillingHistory
            {
                UserId = userId,
                InvoiceNumber = invoiceNumber,
                PaymentDate = now,
                PlanName = dto.PlanName,
                IsAnnual = dto.IsAnnual,
                Amount = baseAmount,
                GSTAmount = gst,
                TotalAmount = total,
                Status = "Paid",
                RazorpayPaymentId = dto.RazorpayPaymentId
            });

        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<List<SubscriptionBillingHistoryDto>>
        GetBillingHistoryAsync(
            Guid userId, CancellationToken ct = default)
    {
        var history = await db.SubscriptionBillingHistories
            .Where(h => h.UserId == userId)
            .OrderByDescending(h => h.PaymentDate)
            .ToListAsync(ct);

        return history.Select(h => new SubscriptionBillingHistoryDto
        {
            Id = h.Id,
            InvoiceNumber = h.InvoiceNumber,
            PaymentDate = h.PaymentDate,
            PlanName = h.PlanName,
            IsAnnual = h.IsAnnual,
            Amount = h.Amount,
            GSTAmount = h.GSTAmount,
            TotalAmount = h.TotalAmount,
            Status = h.Status,
            RazorpayPaymentId = h.RazorpayPaymentId
        }).ToList();
    }

    public async Task<bool> CancelAsync(
        Guid userId, CancelSubscriptionDto dto,
        CancellationToken ct = default)
    {
        var sub = await db.UserSubscriptions
            .FirstOrDefaultAsync(s => s.UserId == userId, ct);
        if (sub == null) return false;

        sub.Status = "Cancelled";
        await db.SaveChangesAsync(ct);
        return true;
    }
}
