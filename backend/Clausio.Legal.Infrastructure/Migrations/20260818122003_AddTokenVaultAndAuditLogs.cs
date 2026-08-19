using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Clausio.Legal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTokenVaultAndAuditLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Documents' AND column_name='Category') THEN
                        ALTER TABLE ""Documents"" ADD ""Category"" text;
                    END IF;

                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Documents' AND column_name='CategoryConfidence') THEN
                        ALTER TABLE ""Documents"" ADD ""CategoryConfidence"" integer NOT NULL DEFAULT 0;
                    END IF;

                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Documents' AND column_name='CategoryDescription') THEN
                        ALTER TABLE ""Documents"" ADD ""CategoryDescription"" text;
                    END IF;
                END $$;

                CREATE TABLE IF NOT EXISTS ""AuditLogs"" (
                    ""Id"" uuid NOT NULL,
                    ""UserId"" uuid NULL,
                    ""UserEmail"" text NULL,
                    ""UserRole"" text NULL,
                    ""Action"" text NOT NULL,
                    ""EntityType"" text NULL,
                    ""EntityId"" text NULL,
                    ""Method"" text NULL,
                    ""Path"" text NULL,
                    ""StatusCode"" integer NULL,
                    ""IpAddress"" text NULL,
                    ""UserAgent"" text NULL,
                    ""ErrorMessage"" text NULL,
                    ""Duration"" bigint NULL,
                    ""CreatedAt"" timestamp with time zone NOT NULL,
                    CONSTRAINT ""PK_AuditLogs"" PRIMARY KEY (""Id"")
                );

                CREATE TABLE IF NOT EXISTS ""TokenVault"" (
                    ""Id"" uuid NOT NULL,
                    ""CaseId"" uuid NOT NULL,
                    ""Token"" text NOT NULL,
                    ""TokenType"" text NOT NULL,
                    ""RealValue"" text NOT NULL,
                    ""CreatedAt"" timestamp with time zone NOT NULL,
                    CONSTRAINT ""PK_TokenVault"" PRIMARY KEY (""Id"")
                );

                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_TokenVault_CaseId_Token"" ON ""TokenVault"" (""CaseId"", ""Token"");
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "Judgments");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "CategoryConfidence",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "CategoryDescription",
                table: "Documents");
        }
    }
}
