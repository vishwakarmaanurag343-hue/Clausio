using Clausio.Legal.API.Extensions;
using Clausio.Legal.Core.Dtos;
using Clausio.Legal.Core.Entities;
using Clausio.Legal.Core.Entities.AI;
using Clausio.Legal.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Clausio.Legal.API.Controllers;

[Authorize(Roles = "SuperAdmin")]
[ApiController]
[Route("api/admin")]
public class AdminController(ClausioDbContext db) : ControllerBase
{
    // ── GET /api/admin/stats ─────────────────────────────────────
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(CancellationToken ct)
    {
        var today = DateTime.UtcNow.Date.ToUniversalTime();
        var monthStart = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var totalUsers     = await db.Users.CountAsync(ct);
        var totalCases     = await db.Cases.CountAsync(ct);
        var totalDocuments = await db.Documents.CountAsync(ct);
        var totalHearings  = await db.Hearings.CountAsync(ct);

        var aiLogsToday = await db.AiTelemetryLogs
            .Where(l => l.CreatedAt >= today)
            .ToListAsync(ct);

        var aiLogsMonth = await db.AiTelemetryLogs
            .Where(l => l.CreatedAt >= monthStart)
            .CountAsync(ct);

        var successRate = aiLogsToday.Count == 0 ? 100.0 :
            (double)aiLogsToday.Count(l => l.IsSuccess) / aiLogsToday.Count * 100;

        var avgLatency = aiLogsToday.Count == 0 ? 0.0 :
            aiLogsToday.Average(l => l.LatencyMs);

        var activeToday = await db.AuditLogs
            .Where(a => a.CreatedAt >= today && a.UserId != null)
            .Select(a => a.UserId)
            .Distinct()
            .CountAsync(ct);

        return Ok(new AdminStatsDto(
            totalUsers,
            totalCases,
            totalDocuments,
            totalHearings,
            aiLogsToday.Count,
            aiLogsMonth,
            Math.Round(successRate, 1),
            Math.Round(avgLatency, 0),
            activeToday
        ));
    }

    // ── GET /api/admin/users ─────────────────────────────────────
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] string? role,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var query = db.Users.AsNoTracking().AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(u =>
                u.Email.Contains(search) ||
                u.FirstName.Contains(search) ||
                u.LastName.Contains(search));

        if (!string.IsNullOrEmpty(role))
            query = query.Where(u => u.Role == role);

        var total = await query.CountAsync(ct);

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserDto(
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email,
                u.Role,
                u.Phone,
                u.CreatedAt))
            .ToListAsync(ct);

        return Ok(new { data = users, total, page, pageSize });
    }

    // ── PUT /api/admin/users/{id}/role ───────────────────────────
    [HttpPut("users/{id:guid}/role")]
    public async Task<IActionResult> UpdateUserRole(
        Guid id,
        [FromBody] UpdateUserRoleDto dto,
        CancellationToken ct)
    {
        var validRoles = new[] { "SuperAdmin", "SeniorAdvocate", "JuniorAdvocate" };
        if (!validRoles.Contains(dto.Role))
            return BadRequest(new { message = "Invalid role. Must be SuperAdmin, SeniorAdvocate or JuniorAdvocate." });

        var user = await db.Users.FindAsync(new object[] { id }, ct);
        if (user is null) return NotFound(new { message = "User not found." });

        user.Role = dto.Role;
        await db.SaveChangesAsync(ct);

        return Ok(new { message = $"Role updated to {dto.Role}.", userId = id });
    }

    // ── DELETE /api/admin/users/{id} ─────────────────────────────
    [HttpDelete("users/{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id, CancellationToken ct)
    {
        var user = await db.Users.FindAsync(new object[] { id }, ct);
        if (user is null) return NotFound(new { message = "User not found." });

        // Prevent deleting yourself
        if (user.Id == User.GetUserId())
            return BadRequest(new { message = "You cannot delete your own account." });

        db.Users.Remove(user);
        await db.SaveChangesAsync(ct);

        return Ok(new { message = "User deleted successfully." });
    }

    // ── GET /api/admin/audit-logs ────────────────────────────────
    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] string? userEmail,
        [FromQuery] string? action,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var query = db.AuditLogs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrEmpty(userEmail))
            query = query.Where(a => a.UserEmail != null && a.UserEmail.Contains(userEmail));

        if (!string.IsNullOrEmpty(action))
            query = query.Where(a => a.Action.Contains(action));

        if (from.HasValue)
            query = query.Where(a => a.CreatedAt >= from.Value);

        if (to.HasValue)
            query = query.Where(a => a.CreatedAt <= to.Value);

        var total = await query.CountAsync(ct);

        var logs = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AdminAuditLogDto(
                a.Id,
                a.UserEmail,
                a.UserRole,
                a.Action,
                a.Method,
                a.Path,
                a.StatusCode,
                a.IpAddress,
                a.Duration,
                a.CreatedAt))
            .ToListAsync(ct);

        return Ok(new { data = logs, total, page, pageSize });
    }

    // ── GET /api/admin/ai-logs ───────────────────────────────────
    [HttpGet("ai-logs")]
    public async Task<IActionResult> GetAiLogs(
        [FromQuery] bool? successOnly,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var query = db.AiTelemetryLogs.AsNoTracking().AsQueryable();

        if (successOnly.HasValue)
            query = query.Where(l => l.IsSuccess == successOnly.Value);

        if (from.HasValue)
            query = query.Where(l => l.CreatedAt >= from.Value);

        if (to.HasValue)
            query = query.Where(l => l.CreatedAt <= to.Value);

        var total = await query.CountAsync(ct);

        var logs = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new AdminAiLogDto(
                l.Id,
                l.CaseId,
                l.Intent,
                l.Provider,
                l.Model,
                l.LatencyMs,
                l.TokensIn,
                l.TokensOut,
                l.CitationConfidenceScore,
                l.HallucinationRiskScore,
                l.IsSuccess,
                l.ErrorMessage,
                l.CreatedAt))
            .ToListAsync(ct);

        return Ok(new { data = logs, total, page, pageSize });
    }
}
