using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Clausio.Legal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserNotificationSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    EmailNotif = table.Column<bool>(type: "boolean", nullable: false),
                    DesktopNotif = table.Column<bool>(type: "boolean", nullable: false),
                    WhatsappNotif = table.Column<bool>(type: "boolean", nullable: false),
                    SmsNotif = table.Column<bool>(type: "boolean", nullable: false),
                    UpcomingHearings = table.Column<bool>(type: "boolean", nullable: false),
                    DeadlineReminders = table.Column<bool>(type: "boolean", nullable: false),
                    NewCaseAssignment = table.Column<bool>(type: "boolean", nullable: false),
                    DocumentUpload = table.Column<bool>(type: "boolean", nullable: false),
                    DraftCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    StrategyGenerated = table.Column<bool>(type: "boolean", nullable: false),
                    FinancialAnalysis = table.Column<bool>(type: "boolean", nullable: false),
                    ReadinessReport = table.Column<bool>(type: "boolean", nullable: false),
                    ClientMessage = table.Column<bool>(type: "boolean", nullable: false),
                    WhatsappDelivery = table.Column<bool>(type: "boolean", nullable: false),
                    ClientPortal = table.Column<bool>(type: "boolean", nullable: false),
                    InvoiceGenerated = table.Column<bool>(type: "boolean", nullable: false),
                    PaymentReceived = table.Column<bool>(type: "boolean", nullable: false),
                    SubscriptionRenew = table.Column<bool>(type: "boolean", nullable: false),
                    DigestFrequency = table.Column<string>(type: "text", nullable: false),
                    ReminderTime = table.Column<string>(type: "text", nullable: false),
                    HearingReminderHours = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserNotificationSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserNotificationSettings_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserNotificationSettings_UserId",
                table: "UserNotificationSettings",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserNotificationSettings");
        }
    }
}
