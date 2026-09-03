namespace Clausio.Legal.Core.Entities;

public class CreditTransaction : BaseEntity
{
    public Guid WalletId { get; set; }

    // positive = credit added, negative = credit deducted
    public int Amount { get; set; }

    // Types: plan_signup | LegalDraft | LegalResearch | Summarization | Evidence |
    // Chronology | HearingPrep | WitnessPrep | ClientUpdate | default
    public string Type { get; set; } = string.Empty;

    public string? Description { get; set; }
    public Guid? ReferenceId { get; set; }

    public Wallet? Wallet { get; set; }
}
