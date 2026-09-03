namespace Clausio.Legal.Core.Entities;

public class Wallet : BaseEntity
{
    public Guid UserId { get; set; }
    public int Balance { get; set; } = 0;
    public User? User { get; set; }
    public ICollection<CreditTransaction> Transactions { get; set; } =
        new List<CreditTransaction>();
}
