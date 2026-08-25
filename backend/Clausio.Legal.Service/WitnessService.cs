using Clausio.Legal.Core.Dtos;
using Clausio.Legal.Core.Entities;
using Clausio.Legal.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Clausio.Legal.Service;

public interface IWitnessService
{
    Task<List<Witness>> ListAsync(Guid caseId, CancellationToken cancellationToken = default);
    Task<Witness?> GetAsync(Guid caseId, Guid id, CancellationToken cancellationToken = default);
    Task<Witness> CreateAsync(Guid caseId, CreateWitnessDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid caseId, Guid id, CancellationToken cancellationToken = default);
}

public class WitnessService(ClausioDbContext db) : IWitnessService
{
    public Task<List<Witness>> ListAsync(Guid caseId, CancellationToken cancellationToken = default)
        => db.Witnesses.AsNoTracking()
            .Where(w => w.CaseId == caseId)
            .OrderBy(w => w.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<Witness?> GetAsync(Guid caseId, Guid id, CancellationToken cancellationToken = default)
        => await db.Witnesses.FirstOrDefaultAsync(w => w.CaseId == caseId && w.Id == id, cancellationToken);

    public async Task<Witness> CreateAsync(Guid caseId, CreateWitnessDto dto, CancellationToken cancellationToken = default)
    {
        var witness = new Witness
        {
            CaseId    = caseId,
            Name      = dto.Name.Trim(),
            Type      = dto.Type,
            Side      = dto.Side,
            Statement = dto.Statement,
        };
        db.Witnesses.Add(witness);
        await db.SaveChangesAsync(cancellationToken);
        return witness;
    }

    public async Task<bool> DeleteAsync(Guid caseId, Guid id, CancellationToken cancellationToken = default)
    {
        var count = await db.Witnesses.Where(w => w.CaseId == caseId && w.Id == id).ExecuteDeleteAsync(cancellationToken);
        return count > 0;
    }
}
