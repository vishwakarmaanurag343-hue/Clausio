using Clausio.Legal.Core.Entities;
using Clausio.Legal.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Clausio.Legal.Service;

public interface IWalletService
{
    Task<Wallet> GetOrCreateAsync(
        Guid userId,
        CancellationToken ct = default);

    Task<bool> HasCreditsAsync(
        Guid userId, int required,
        CancellationToken ct = default);

    Task DeductAsync(
        Guid userId, int amount,
        string type, string description,
        CancellationToken ct = default);

    Task AddAsync(
        Guid userId, int amount,
        string type, string description,
        Guid? referenceId = null,
        CancellationToken ct = default);

    Task<WalletDto> GetSummaryAsync(
        Guid userId,
        CancellationToken ct = default);
}

public record WalletDto(
    int Balance,
    int TotalEarned,
    int TotalSpent,
    List<CreditTxDto> Recent);

public record CreditTxDto(
    int Amount,
    string Type,
    string? Description,
    DateTime CreatedAt);

public class WalletService(
    ClausioDbContext db
) : IWalletService
{
    public const int FREE_CREDITS = 50;

    public static readonly
        Dictionary<string, int> Costs = new()
    {
        ["LegalDraft"]      = 2,
        ["LegalResearch"]   = 1,
        ["Summarization"]   = 3,
        ["Evidence"]        = 3,
        ["Chronology"]      = 2,
        ["HearingPrep"]     = 2,
        ["WitnessPrep"]     = 2,
        ["ClientUpdate"]    = 1,
        ["RiskAssessment"]  = 2,
        ["Contradiction"]   = 2,
        ["Readiness"]       = 2,
        ["FinancialProfile"]= 2,
        ["default"]         = 1,
    };

    public async Task<Wallet> GetOrCreateAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var wallet = await db.Wallets
            .FirstOrDefaultAsync(
                w => w.UserId == userId, ct);

        if (wallet != null) return wallet;

        wallet = new Wallet
        {
            UserId = userId,
            Balance = 0
        };
        db.Wallets.Add(wallet);
        await db.SaveChangesAsync(ct);
        return wallet;
    }

    public async Task<bool> HasCreditsAsync(
        Guid userId, int required,
        CancellationToken ct = default)
    {
        var wallet = await db.Wallets
            .AsNoTracking()
            .FirstOrDefaultAsync(
                w => w.UserId == userId, ct);
        return wallet != null
            && wallet.Balance >= required;
    }

    public async Task DeductAsync(
        Guid userId, int amount,
        string type, string description,
        CancellationToken ct = default)
    {
        var wallet = await GetOrCreateAsync(
            userId, ct);

        if (wallet.Balance < amount)
            throw new InvalidOperationException(
                "INSUFFICIENT_CREDITS: You have used all your free credits. " +
                "Contact support@clausiotech.com to get more.");

        wallet.Balance -= amount;
        db.CreditTransactions.Add(
            new CreditTransaction
            {
                WalletId = wallet.Id,
                Amount = -amount,
                Type = type,
                Description = description,
            });

        await db.SaveChangesAsync(ct);
    }

    public async Task AddAsync(
        Guid userId, int amount,
        string type, string description,
        Guid? referenceId = null,
        CancellationToken ct = default)
    {
        var wallet = await GetOrCreateAsync(
            userId, ct);

        wallet.Balance += amount;
        db.CreditTransactions.Add(
            new CreditTransaction
            {
                WalletId = wallet.Id,
                Amount = amount,
                Type = type,
                Description = description,
                ReferenceId = referenceId,
            });

        await db.SaveChangesAsync(ct);
    }

    public async Task<WalletDto>
        GetSummaryAsync(
            Guid userId,
            CancellationToken ct = default)
    {
        var wallet = await db.Wallets
            .Include(w => w.Transactions)
            .FirstOrDefaultAsync(
                w => w.UserId == userId, ct);

        if (wallet == null)
            return new WalletDto(
                0, 0, 0, new());

        var recent = wallet.Transactions
            .OrderByDescending(t => t.CreatedAt)
            .Take(10)
            .Select(t => new CreditTxDto(
                t.Amount,
                t.Type,
                t.Description,
                t.CreatedAt))
            .ToList();

        return new WalletDto(
            wallet.Balance,
            wallet.Transactions
                .Where(t => t.Amount > 0)
                .Sum(t => t.Amount),
            Math.Abs(wallet.Transactions
                .Where(t => t.Amount < 0)
                .Sum(t => t.Amount)),
            recent);
    }
}
