using Clausio.Legal.Core.Entities;
using Clausio.Legal.Core.Entities.AI;
using Microsoft.EntityFrameworkCore;

namespace Clausio.Legal.Infrastructure;

public class ClausioDbContext(DbContextOptions<ClausioDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Case> Cases => Set<Case>();
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<Judgment> Judgments => Set<Judgment>();
    public DbSet<JudgmentChunk> JudgmentChunks => Set<JudgmentChunk>();

    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<ActionPlan> ActionPlans => Set<ActionPlan>();
    public DbSet<Contradiction> Contradictions => Set<Contradiction>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<Hearing> Hearings => Set<Hearing>();
    public DbSet<HearingOrder> HearingOrders => Set<HearingOrder>();
    public DbSet<Witness> Witnesses => Set<Witness>();
    public DbSet<Note> Notes => Set<Note>();
    public DbSet<CaseNote> CaseNotes => Set<CaseNote>();
    public DbSet<UserPagePermission> UserPagePermissions => Set<UserPagePermission>();
    public DbSet<PromptReferenceDoc> PromptReferenceDocs => Set<PromptReferenceDoc>();
    public DbSet<CalendarIntegration> CalendarIntegrations => Set<CalendarIntegration>();
    public DbSet<CalendarEventLink> CalendarEventLinks => Set<CalendarEventLink>();
    public DbSet<ClientMeeting> ClientMeetings => Set<ClientMeeting>();
    public DbSet<LegalResearch> LegalResearches => Set<LegalResearch>();
    public DbSet<TimelineEvent> TimelineEvents => Set<TimelineEvent>();
    public DbSet<Readiness> Readinesses => Set<Readiness>();
    public DbSet<ReadinessChecklistItem> ReadinessChecklistItems => Set<ReadinessChecklistItem>();

    // Phase 1 Memory & Context Intelligence
    public DbSet<Clausio.Legal.Core.Entities.Memory.CaseMemory> CaseMemories => Set<Clausio.Legal.Core.Entities.Memory.CaseMemory>();
    public DbSet<Clausio.Legal.Core.Entities.Memory.ConversationMemory> ConversationMemories => Set<Clausio.Legal.Core.Entities.Memory.ConversationMemory>();
    public DbSet<Clausio.Legal.Core.Entities.Memory.DraftMemory> DraftMemories => Set<Clausio.Legal.Core.Entities.Memory.DraftMemory>();
    public DbSet<Clausio.Legal.Core.Entities.Memory.UserPreferences> UserPreferences => Set<Clausio.Legal.Core.Entities.Memory.UserPreferences>();
    // Phase 2 RAG Foundation
    public DbSet<DocumentChunk> DocumentChunks => Set<DocumentChunk>();

    // AI Analytics & Telemetry
    public DbSet<AiTelemetryLog> AiTelemetryLogs => Set<AiTelemetryLog>();

    // Draft version control
    public DbSet<Draft> Drafts => Set<Draft>();
    public DbSet<DraftVersion> DraftVersions => Set<DraftVersion>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasPostgresExtension("vector");

        modelBuilder.Entity<Draft>(e =>
        {
            e.HasIndex(x => x.CaseId);
            e.HasOne<Case>().WithMany().HasForeignKey(x => x.CaseId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DraftVersion>(e =>
        {
            e.HasIndex(x => new { x.DraftId, x.VersionNumber }).IsUnique();
            e.HasOne(x => x.Draft).WithMany(d => d.Versions)
                .HasForeignKey(x => x.DraftId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CalendarEventLink>(e =>
            e.HasIndex(x => new { x.IntegrationId, x.EventType, x.SourceId }).IsUnique());

        modelBuilder.Entity<CalendarIntegration>(e =>
            e.HasIndex(x => x.UserId).IsUnique());

        modelBuilder.Entity<CaseNote>(e =>
            e.HasIndex(x => new { x.UserId, x.CaseId, x.Category }).IsUnique());

        modelBuilder.Entity<UserPagePermission>(e =>
            e.HasIndex(x => new { x.UserId, x.PageKey }).IsUnique());

        modelBuilder.Entity<PromptReferenceDoc>(e => e.HasIndex(x => x.UserId));

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ClausioDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }

    public override int SaveChanges()
    {
        TouchTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        TouchTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void TouchTimestamps()
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }
    }
}
