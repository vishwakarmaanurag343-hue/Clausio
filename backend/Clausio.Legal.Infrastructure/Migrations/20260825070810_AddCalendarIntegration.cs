using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Clausio.Legal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCalendarIntegration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CalendarEventLinks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IntegrationId = table.Column<Guid>(type: "uuid", nullable: false),
                    EventType = table.Column<string>(type: "text", nullable: false),
                    SourceId = table.Column<Guid>(type: "uuid", nullable: false),
                    GoogleEventId = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CalendarEventLinks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CalendarIntegrations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    EncryptedRefreshToken = table.Column<string>(type: "text", nullable: false),
                    CalendarId = table.Column<string>(type: "text", nullable: false),
                    LastSyncedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastSyncError = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CalendarIntegrations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CalendarIntegrations_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClientMeetings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    ScheduledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    WithPerson = table.Column<string>(type: "text", nullable: true),
                    Location = table.Column<string>(type: "text", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CaseId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientMeetings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientMeetings_Cases_CaseId",
                        column: x => x.CaseId,
                        principalTable: "Cases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEventLinks_IntegrationId_EventType_SourceId",
                table: "CalendarEventLinks",
                columns: new[] { "IntegrationId", "EventType", "SourceId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CalendarIntegrations_UserId",
                table: "CalendarIntegrations",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClientMeetings_CaseId",
                table: "ClientMeetings",
                column: "CaseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CalendarEventLinks");

            migrationBuilder.DropTable(
                name: "CalendarIntegrations");

            migrationBuilder.DropTable(
                name: "ClientMeetings");
        }
    }
}
