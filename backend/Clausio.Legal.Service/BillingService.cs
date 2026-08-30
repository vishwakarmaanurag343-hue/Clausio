using Clausio.Legal.Core.Dtos;
using Clausio.Legal.Core.Entities;
using Clausio.Legal.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Clausio.Legal.Service;

public interface IBillingService
{
    // Invoices
    Task<InvoiceDto>        CreateInvoiceAsync(Guid userId, CreateInvoiceDto dto, CancellationToken ct = default);
    Task<List<InvoiceDto>>  GetInvoicesAsync(Guid userId, CancellationToken ct = default);
    Task<InvoiceDto>        GetInvoiceAsync(Guid userId, Guid id, CancellationToken ct = default);
    Task<InvoiceDto>        UpdateInvoiceStatusAsync(Guid userId, Guid id, string status, CancellationToken ct = default);
    Task                    DeleteInvoiceAsync(Guid userId, Guid id, CancellationToken ct = default);

    // Payments
    Task<PaymentDto>        RecordPaymentAsync(Guid userId, CreatePaymentDto dto, CancellationToken ct = default);
    Task<List<PaymentDto>>  GetPaymentsAsync(Guid userId, Guid? caseId = null, CancellationToken ct = default);
    Task                    DeletePaymentAsync(Guid userId, Guid id, CancellationToken ct = default);

    // Expenses
    Task<ExpenseDto>        CreateExpenseAsync(Guid userId, CreateExpenseDto dto, CancellationToken ct = default);
    Task<List<ExpenseDto>>  GetExpensesAsync(Guid userId, Guid? caseId = null, CancellationToken ct = default);
    Task                    DeleteExpenseAsync(Guid userId, Guid id, CancellationToken ct = default);

    // Stats
    Task<BillingStatsDto>   GetStatsAsync(Guid userId, CancellationToken ct = default);
}

public class BillingService(ClausioDbContext db) : IBillingService
{
    // ── Invoice Number Generator ──────────────────────────────────

    private async Task EnsureBillingSeededAsync(CancellationToken ct)
    {
        if (await db.Invoices.AnyAsync(ct)) return;

        var cases = await db.Cases.Include(c => c.Client).Take(5).ToListAsync(ct);
        if (!cases.Any()) return;

        var seedInvoices = new List<Invoice>();
        int count = 1;
        foreach (var c in cases)
        {
            var baseFee = 25000m * count;
            var tax = baseFee * 0.18m;
            var total = baseFee + tax;
            var paid = count % 2 == 0 ? total : total / 2;

            var clientName = c.Client != null ? $"{c.Client.FirstName} {c.Client.LastName}".Trim() : "Standard Client";

            var inv = new Invoice
            {
                InvoiceNumber = $"INV-{DateTime.UtcNow:yyyy}-{(count):D4}",
                CaseId = c.Id,
                ClientId = c.ClientId,
                CreatedByUserId = c.CreatedByUserId,
                ClientName = clientName,
                CaseName = c.Name ?? "Legal Case",
                Description = $"Legal Professional Services — {c.Name ?? "Case"}",
                FeeAgreed = baseFee,
                AmountDue = baseFee,
                TaxAmount = tax,
                TotalAmount = total,
                Status = count % 2 == 0 ? "Paid" : "Partial",
                IssuedDate = DateTime.UtcNow.AddDays(-10 * count),
                DueDate = DateTime.UtcNow.AddDays(15),
                Notes = "Standard professional fee invoice."
            };

            inv.Payments.Add(new Payment
            {
                CaseId = c.Id,
                CreatedByUserId = c.CreatedByUserId,
                Amount = paid,
                PaidOn = DateTime.UtcNow.AddDays(-5 * count),
                Mode = "UPI",
                Reference = $"UPI-{100000 + count}",
                Notes = "Part payment received."
            });

            seedInvoices.Add(inv);
            count++;
        }

        db.Invoices.AddRange(seedInvoices);

        foreach (var c in cases)
        {
            db.Expenses.Add(new Expense
            {
                CaseId = c.Id,
                CreatedByUserId = c.CreatedByUserId,
                Title = "Court Filing & Process Fee",
                Category = "Filing Fee",
                Amount = 1500m,
                Date = DateTime.UtcNow.AddDays(-7),
                Billable = true,
                Notes = "Official High Court filing stamp fee"
            });
        }

        await db.SaveChangesAsync(ct);
    }

    private async Task<string> NextInvoiceNumberAsync(Guid userId, CancellationToken ct)
    {
        var count = await db.Invoices.CountAsync(i => userId == Guid.Empty || i.CreatedByUserId == userId, ct);
        return $"INV-{DateTime.UtcNow:yyyy}-{(count + 1):D4}";
    }

    // ── Invoices ──────────────────────────────────────────────────

    public async Task<InvoiceDto> CreateInvoiceAsync(Guid userId, CreateInvoiceDto dto, CancellationToken ct = default)
    {
        var invoice = new Invoice
        {
            InvoiceNumber   = await NextInvoiceNumberAsync(userId, ct),
            CaseId          = dto.CaseId,
            ClientId        = dto.ClientId ?? Guid.Empty,
            CreatedByUserId = userId,
            ClientName      = dto.ClientName,
            CaseName        = dto.CaseName,
            Description     = dto.Description,
            FeeAgreed       = dto.FeeAgreed,
            AmountDue       = dto.AmountDue,
            TaxAmount       = dto.TaxAmount,
            TotalAmount     = dto.AmountDue + dto.TaxAmount,
            DueDate         = dto.DueDate,
            Notes           = dto.Notes,
            Status          = "Unpaid",
            IssuedDate      = DateTime.UtcNow,
        };
        db.Invoices.Add(invoice);
        await db.SaveChangesAsync(ct);
        return await GetInvoiceAsync(userId, invoice.Id, ct);
    }

    public async Task<List<InvoiceDto>> GetInvoicesAsync(Guid userId, CancellationToken ct = default)
    {
        await EnsureBillingSeededAsync(ct);

        var invoices = await db.Invoices
            .Where(i => userId == Guid.Empty || i.CreatedByUserId == userId)
            .Include(i => i.Payments)
            .OrderByDescending(i => i.IssuedDate)
            .ToListAsync(ct);

        return invoices.Select(ToDto).ToList();
    }

    public async Task<InvoiceDto> GetInvoiceAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        await EnsureBillingSeededAsync(ct);

        var invoice = await db.Invoices
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == id && (userId == Guid.Empty || i.CreatedByUserId == userId), ct)
            ?? throw new KeyNotFoundException("Invoice not found.");
        return ToDto(invoice);
    }

    public async Task<InvoiceDto> UpdateInvoiceStatusAsync(Guid userId, Guid id, string status, CancellationToken ct = default)
    {
        var invoice = await db.Invoices.FirstOrDefaultAsync(i => i.Id == id && (userId == Guid.Empty || i.CreatedByUserId == userId), ct)
            ?? throw new KeyNotFoundException("Invoice not found.");
        invoice.Status = status;
        await db.SaveChangesAsync(ct);
        return await GetInvoiceAsync(userId, id, ct);
    }

    public async Task DeleteInvoiceAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var invoice = await db.Invoices.FirstOrDefaultAsync(i => i.Id == id && (userId == Guid.Empty || i.CreatedByUserId == userId), ct)
            ?? throw new KeyNotFoundException("Invoice not found.");
        db.Invoices.Remove(invoice);
        await db.SaveChangesAsync(ct);
    }

    // ── Payments ──────────────────────────────────────────────────

    public async Task<PaymentDto> RecordPaymentAsync(Guid userId, CreatePaymentDto dto, CancellationToken ct = default)
    {
        var invoice = await db.Invoices
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == dto.InvoiceId && (userId == Guid.Empty || i.CreatedByUserId == userId), ct)
            ?? throw new KeyNotFoundException("Invoice not found.");

        var payment = new Payment
        {
            InvoiceId       = dto.InvoiceId,
            CaseId          = dto.CaseId,
            CreatedByUserId = userId,
            Amount          = dto.Amount,
            PaidOn          = dto.PaidOn,
            Mode            = dto.Mode,
            Reference       = dto.Reference,
            Notes           = dto.Notes,
        };
        db.Payments.Add(payment);

        var totalPaid = invoice.Payments.Sum(p => p.Amount) + dto.Amount;
        invoice.Status = totalPaid >= invoice.TotalAmount ? "Paid"
                       : totalPaid > 0 ? "Partial"
                       : "Unpaid";
        await db.SaveChangesAsync(ct);

        return new PaymentDto
        {
            Id            = payment.Id,
            InvoiceId     = payment.InvoiceId,
            CaseId        = payment.CaseId,
            Amount        = payment.Amount,
            PaidOn        = payment.PaidOn,
            Mode          = payment.Mode,
            Reference     = payment.Reference,
            Notes         = payment.Notes,
            InvoiceNumber = invoice.InvoiceNumber,
        };
    }

    public async Task<List<PaymentDto>> GetPaymentsAsync(Guid userId, Guid? caseId = null, CancellationToken ct = default)
    {
        await EnsureBillingSeededAsync(ct);

        var query = db.Payments
            .Include(p => p.Invoice)
            .Where(p => userId == Guid.Empty || p.CreatedByUserId == userId);

        if (caseId.HasValue)
            query = query.Where(p => p.CaseId == caseId);

        var payments = await query.OrderByDescending(p => p.PaidOn).ToListAsync(ct);

        return payments.Select(p => new PaymentDto
        {
            Id            = p.Id,
            InvoiceId     = p.InvoiceId,
            CaseId        = p.CaseId,
            Amount        = p.Amount,
            PaidOn        = p.PaidOn,
            Mode          = p.Mode,
            Reference     = p.Reference,
            Notes         = p.Notes,
            InvoiceNumber = p.Invoice?.InvoiceNumber ?? "",
        }).ToList();
    }

    public async Task DeletePaymentAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var payment = await db.Payments.FirstOrDefaultAsync(p => p.Id == id && (userId == Guid.Empty || p.CreatedByUserId == userId), ct)
            ?? throw new KeyNotFoundException("Payment not found.");
        db.Payments.Remove(payment);
        await db.SaveChangesAsync(ct);
    }

    // ── Expenses ──────────────────────────────────────────────────

    public async Task<ExpenseDto> CreateExpenseAsync(Guid userId, CreateExpenseDto dto, CancellationToken ct = default)
    {
        var expense = new Expense
        {
            CaseId          = dto.CaseId,
            CreatedByUserId = userId,
            Title           = dto.Title,
            Category        = dto.Category,
            Amount          = dto.Amount,
            Date            = dto.Date,
            Notes           = dto.Notes,
            Billable        = dto.Billable,
        };
        db.Expenses.Add(expense);
        await db.SaveChangesAsync(ct);
        return ToExpenseDto(expense);
    }

    public async Task<List<ExpenseDto>> GetExpensesAsync(Guid userId, Guid? caseId = null, CancellationToken ct = default)
    {
        await EnsureBillingSeededAsync(ct);

        var query = db.Expenses.Where(e => userId == Guid.Empty || e.CreatedByUserId == userId);
        if (caseId.HasValue) query = query.Where(e => e.CaseId == caseId);
        var list = await query.OrderByDescending(e => e.Date).ToListAsync(ct);
        return list.Select(ToExpenseDto).ToList();
    }

    public async Task DeleteExpenseAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var expense = await db.Expenses.FirstOrDefaultAsync(e => e.Id == id && (userId == Guid.Empty || e.CreatedByUserId == userId), ct)
            ?? throw new KeyNotFoundException("Expense not found.");
        db.Expenses.Remove(expense);
        await db.SaveChangesAsync(ct);
    }

    // ── Stats ─────────────────────────────────────────────────────

    public async Task<BillingStatsDto> GetStatsAsync(Guid userId, CancellationToken ct = default)
    {
        await EnsureBillingSeededAsync(ct);

        var invoices = await db.Invoices
            .Where(i => userId == Guid.Empty || i.CreatedByUserId == userId)
            .Include(i => i.Payments)
            .ToListAsync(ct);

        var expenses = await db.Expenses
            .Where(e => userId == Guid.Empty || e.CreatedByUserId == userId)
            .ToListAsync(ct);

        var totalBilled  = invoices.Sum(i => i.TotalAmount);
        var totalPaid    = invoices.Sum(i => i.Payments.Sum(p => p.Amount));
        var totalExpenses = expenses.Sum(e => e.Amount);

        return new BillingStatsDto
        {
            TotalBilled   = totalBilled,
            TotalPaid     = totalPaid,
            TotalPending  = totalBilled - totalPaid,
            TotalExpenses = totalExpenses,
            InvoiceCount  = invoices.Count,
            PaidCount     = invoices.Count(i => i.Status == "Paid"),
            UnpaidCount   = invoices.Count(i => i.Status == "Unpaid"),
        };
    }

    // ── Helpers ───────────────────────────────────────────────────

    private static InvoiceDto ToDto(Invoice i)
    {
        var paid = i.Payments?.Sum(p => p.Amount) ?? 0;
        return new InvoiceDto
        {
            Id            = i.Id,
            InvoiceNumber = i.InvoiceNumber,
            CaseId        = i.CaseId,
            ClientId      = i.ClientId ?? Guid.Empty,
            ClientName    = i.ClientName,
            CaseName      = i.CaseName,
            Description   = i.Description,
            FeeAgreed     = i.FeeAgreed,
            AmountDue     = i.AmountDue,
            TaxAmount     = i.TaxAmount,
            TotalAmount   = i.TotalAmount,
            AmountPaid    = paid,
            AmountPending = i.TotalAmount - paid,
            Status        = i.Status,
            IssuedDate    = i.IssuedDate,
            DueDate       = i.DueDate,
            Notes         = i.Notes,
        };
    }

    private static ExpenseDto ToExpenseDto(Expense e) => new()
    {
        Id       = e.Id,
        CaseId   = e.CaseId,
        Title    = e.Title,
        Category = e.Category,
        Amount   = e.Amount,
        Date     = e.Date,
        Notes    = e.Notes,
        Billable = e.Billable,
    };
}
