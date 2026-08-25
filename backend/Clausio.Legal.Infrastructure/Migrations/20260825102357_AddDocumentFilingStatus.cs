using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Clausio.Legal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentFilingStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "FiledAtHearingId",
                table: "Documents",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FiledDate",
                table: "Documents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FilingStatus",
                table: "Documents",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_FiledAtHearingId",
                table: "Documents",
                column: "FiledAtHearingId");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Hearings_FiledAtHearingId",
                table: "Documents",
                column: "FiledAtHearingId",
                principalTable: "Hearings",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Hearings_FiledAtHearingId",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_Documents_FiledAtHearingId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "FiledAtHearingId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "FiledDate",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "FilingStatus",
                table: "Documents");
        }
    }
}
