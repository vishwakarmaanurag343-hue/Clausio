using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Clausio.Legal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReadinessChecklistFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ActionNeeded",
                table: "ReadinessChecklistItems",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CaseTypeRelevance",
                table: "ReadinessChecklistItems",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "Controllable",
                table: "ReadinessChecklistItems",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "ReadinessChecklistItems",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActionNeeded",
                table: "ReadinessChecklistItems");

            migrationBuilder.DropColumn(
                name: "CaseTypeRelevance",
                table: "ReadinessChecklistItems");

            migrationBuilder.DropColumn(
                name: "Controllable",
                table: "ReadinessChecklistItems");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "ReadinessChecklistItems");
        }
    }
}
