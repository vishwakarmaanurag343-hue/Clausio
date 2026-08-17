using System;
using Microsoft.EntityFrameworkCore;
using Clausio.Legal.Core.Entities.Security;

namespace Clausio.Legal.Infrastructure.Security;

public class SensitiveDbContext(DbContextOptions<SensitiveDbContext> options) : DbContext(options)
{
    public DbSet<TokenVaultEntry> TokenVault => Set<TokenVaultEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TokenVaultEntry>(entity =>
        {
            entity.ToTable("TokenVault");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.CaseId, e.Token }).IsUnique();
        });

        base.OnModelCreating(modelBuilder);
    }
}
