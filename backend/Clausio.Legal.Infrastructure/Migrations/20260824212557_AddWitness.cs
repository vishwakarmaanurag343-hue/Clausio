using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Clausio.Legal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWitness : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "JudgmentChunks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    JudgmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    CaseName = table.Column<string>(type: "text", nullable: true),
                    Year = table.Column<int>(type: "integer", nullable: true),
                    CaseType = table.Column<string>(type: "text", nullable: true),
                    ChunkIndex = table.Column<int>(type: "integer", nullable: false),
                    ChunkText = table.Column<string>(type: "text", nullable: false),
                    SourceFile = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JudgmentChunks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Witnesses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Side = table.Column<string>(type: "text", nullable: false),
                    Statement = table.Column<string>(type: "text", nullable: true),
                    CaseId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Witnesses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Witnesses_Cases_CaseId",
                        column: x => x.CaseId,
                        principalTable: "Cases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Witnesses_CaseId",
                table: "Witnesses",
                column: "CaseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JudgmentChunks");

            migrationBuilder.DropTable(
                name: "Witnesses");
        }
    }
}
