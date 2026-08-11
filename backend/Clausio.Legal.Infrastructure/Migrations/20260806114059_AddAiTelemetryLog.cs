using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Clausio.Legal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAiTelemetryLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AiTelemetryLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CaseId = table.Column<Guid>(type: "uuid", nullable: false),
                    Intent = table.Column<string>(type: "text", nullable: false),
                    PromptName = table.Column<string>(type: "text", nullable: false),
                    Provider = table.Column<string>(type: "text", nullable: false),
                    Model = table.Column<string>(type: "text", nullable: false),
                    RouterDecision = table.Column<string>(type: "text", nullable: false),
                    LatencyMs = table.Column<long>(type: "bigint", nullable: false),
                    TokensIn = table.Column<int>(type: "integer", nullable: false),
                    TokensOut = table.Column<int>(type: "integer", nullable: false),
                    RetrievalScore = table.Column<int>(type: "integer", nullable: false),
                    CitationConfidenceScore = table.Column<int>(type: "integer", nullable: false),
                    DraftScore = table.Column<int>(type: "integer", nullable: false),
                    HallucinationRiskScore = table.Column<int>(type: "integer", nullable: false),
                    TokenEfficiencyScore = table.Column<int>(type: "integer", nullable: false),
                    IsSuccess = table.Column<bool>(type: "boolean", nullable: false),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiTelemetryLogs", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AiTelemetryLogs");
        }
    }
}
