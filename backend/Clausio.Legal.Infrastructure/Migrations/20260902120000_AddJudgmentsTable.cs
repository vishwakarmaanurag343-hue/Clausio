using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Clausio.Legal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddJudgmentsTable : Migration
    {
        // The "Judgments" table was lost when 20260818122003_AddTokenVaultAndAuditLogs
        // had its auto-generated Up() replaced with hand-written SQL (only AuditLogs and
        // TokenVault were carried over). The model snapshot has expected the table since
        // 20260824212557_AddWitness, so every query against it fails with
        // 42P01: relation "Judgments" does not exist. This migration recreates it
        // idempotently so it is safe on databases where it somehow already exists.

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS ""Judgments"" (
                    ""Id"" uuid NOT NULL,
                    ""Citation"" text NOT NULL,
                    ""ShortName"" text NULL,
                    ""Court"" text NULL,
                    ""Year"" integer NULL,
                    ""CaseType"" text NULL,
                    ""RatioDecidendi"" text NULL,
                    ""FullText"" text NULL,
                    ""SourceUrl"" text NULL,
                    ""IsVerified"" boolean NOT NULL,
                    ""CreatedAt"" timestamp with time zone NOT NULL,
                    CONSTRAINT ""PK_Judgments"" PRIMARY KEY (""Id"")
                );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Judgments");
        }
    }
}
