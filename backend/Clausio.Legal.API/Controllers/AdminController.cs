using Clausio.Legal.API.Extensions;
using Clausio.Legal.Core.Dtos;
using Clausio.Legal.Core.Entities;
using Clausio.Legal.Core.Entities.AI;
using Clausio.Legal.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
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
                u.IsActive,
                u.CreatedAt))
            .ToListAsync(ct);

        return Ok(new { data = users, total, page, pageSize });
    }

    // ── GET /api/admin/users/{id} ────────────────────────────────
    [HttpGet("users/{id:guid}")]
    public async Task<IActionResult> GetUser(Guid id, CancellationToken ct)
    {
        var u = await db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (u is null) return NotFound(new { message = "User not found." });
        return Ok(new AdminUserDto(u.Id, u.FirstName, u.LastName, u.Email, u.Role, u.Phone, u.IsActive, u.CreatedAt));
    }

    private static readonly string[] ValidRoles =
        { "SuperAdmin", "SeniorAdvocate", "JuniorAdvocate", "Clerk", "Intern" };

    // ── POST /api/admin/users ───────────────────────────────────
    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.TempPassword))
            return BadRequest(new { message = "Email and a temporary password are required." });

        var email = dto.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email, ct))
            return BadRequest(new { message = "A user with this email already exists." });

        var role = string.IsNullOrWhiteSpace(dto.Role) ? "JuniorAdvocate" : dto.Role;
        if (!ValidRoles.Contains(role))
            return BadRequest(new { message = $"Invalid role. Allowed: {string.Join(", ", ValidRoles)}." });

        var user = new User
        {
            FirstName = dto.FirstName?.Trim() ?? "",
            LastName = dto.LastName?.Trim() ?? "",
            Email = email,
            Phone = dto.Phone?.Trim(),
            Role = role,
            IsActive = true,
        };
        user.PasswordHash = new PasswordHasher<User>().HashPassword(user, dto.TempPassword);

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);
        return Ok(new AdminUserDto(user.Id, user.FirstName, user.LastName, user.Email, user.Role, user.Phone, user.IsActive, user.CreatedAt));
    }

    // ── PUT /api/admin/users/{id} ───────────────────────────────
    [HttpPut("users/{id:guid}")]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserDto dto, CancellationToken ct)
    {
        var user = await db.Users.FindAsync(new object[] { id }, ct);
        if (user is null) return NotFound(new { message = "User not found." });

        if (dto.FirstName is not null) user.FirstName = dto.FirstName.Trim();
        if (dto.LastName is not null) user.LastName = dto.LastName.Trim();
        if (dto.Phone is not null) user.Phone = dto.Phone.Trim();
        if (dto.IsActive is not null) user.IsActive = dto.IsActive.Value;

        if (dto.Email is not null)
        {
            var email = dto.Email.Trim().ToLowerInvariant();
            if (email != user.Email && await db.Users.AnyAsync(u => u.Email == email && u.Id != id, ct))
                return BadRequest(new { message = "Another user already uses this email." });
            user.Email = email;
        }

        if (dto.Role is not null)
        {
            if (!ValidRoles.Contains(dto.Role))
                return BadRequest(new { message = $"Invalid role. Allowed: {string.Join(", ", ValidRoles)}." });
            user.Role = dto.Role;
        }

        await db.SaveChangesAsync(ct);
        return Ok(new AdminUserDto(user.Id, user.FirstName, user.LastName, user.Email, user.Role, user.Phone, user.IsActive, user.CreatedAt));
    }

    // ── PUT /api/admin/users/{id}/role ───────────────────────────
    [HttpPut("users/{id:guid}/role")]
    public async Task<IActionResult> UpdateUserRole(
        Guid id,
        [FromBody] UpdateUserRoleDto dto,
        CancellationToken ct)
    {
        if (!ValidRoles.Contains(dto.Role))
            return BadRequest(new { message = $"Invalid role. Allowed: {string.Join(", ", ValidRoles)}." });

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

    // ── GET /api/admin/permissions/{userId} → the page keys this user may open ──
    [HttpGet("permissions/{userId:guid}")]
    public async Task<IActionResult> GetPermissions(Guid userId, CancellationToken ct)
    {
        var keys = await db.UserPagePermissions.AsNoTracking()
            .Where(p => p.UserId == userId && p.HasAccess)
            .Select(p => p.PageKey)
            .ToListAsync(ct);
        return Ok(new { userId, pageKeys = keys });
    }

    // ── PUT /api/admin/permissions/{userId} → replace all of this user's page grants ──
    [HttpPut("permissions/{userId:guid}")]
    public async Task<IActionResult> SetPermissions(Guid userId, [FromBody] UpdatePermissionsDto dto, CancellationToken ct)
    {
        if (!await db.Users.AnyAsync(u => u.Id == userId, ct))
            return NotFound(new { message = "User not found." });

        var existing = await db.UserPagePermissions.Where(p => p.UserId == userId).ToListAsync(ct);
        db.UserPagePermissions.RemoveRange(existing);

        var keys = (dto.PageKeys ?? new List<string>())
            .Where(k => !string.IsNullOrWhiteSpace(k))
            .Select(k => k.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        foreach (var key in keys)
            db.UserPagePermissions.Add(new UserPagePermission { UserId = userId, PageKey = key, HasAccess = true });

        await db.SaveChangesAsync(ct);
        return Ok(new { userId, pageKeys = keys });
    }

    // ── GET /api/admin/credit-stats → per-user AI credit balances + usage ──
    [HttpGet("credit-stats")]
    public async Task<IActionResult> GetCreditStats(CancellationToken ct)
    {
        try
        {
            // Fetch all active users (excluding SuperAdmins) with their wallet data
            // SuperAdmins have unlimited access and are not subject to credit limits
            var users = await db.Users
                .Where(u => u.IsActive && u.Role != "SuperAdmin")
                .Select(u => new
                {
                    u.Id,
                    u.Email,
                    Name = u.FirstName + " " + u.LastName,
                    u.CreatedAt,
                    Wallet = db.Wallets
                        .Where(w => w.UserId == u.Id)
                        .Select(w => new
                        {
                            w.Balance,
                            TotalUsed = db.CreditTransactions
                                .Where(t => t.WalletId == w.Id && t.Amount < 0)
                                .Sum(t => (int?)t.Amount) ?? 0,
                            LastUsed = db.CreditTransactions
                                .Where(t => t.WalletId == w.Id && t.Amount < 0)
                                .OrderByDescending(t => t.CreatedAt)
                                .Select(t => (DateTime?)t.CreatedAt)
                                .FirstOrDefault()
                        })
                        .FirstOrDefault()
                })
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync(ct);

            // Ensure all users have a wallet (create if missing)
            var usersWithoutWallet = users.Where(u => u.Wallet == null).ToList();
            if (usersWithoutWallet.Count > 0)
            {
                foreach (var user in usersWithoutWallet)
                {
                    // Check if wallet exists in DB but wasn't loaded (shouldn't happen, but be safe)
                    var existingWallet = await db.Wallets
                        .FirstOrDefaultAsync(w => w.UserId == user.Id, ct);

                    if (existingWallet == null)
                    {
                        // Create new wallet for user
                        var newWallet = new Clausio.Legal.Core.Entities.Wallet
                        {
                            UserId = user.Id,
                            Balance = 0
                        };
                        db.Wallets.Add(newWallet);
                    }
                }
                await db.SaveChangesAsync(ct);

                // Reload users with updated wallet data
                users = await db.Users
                    .Where(u => u.IsActive)
                    .Select(u => new
                    {
                        u.Id,
                        u.Email,
                        Name = u.FirstName + " " + u.LastName,
                        u.CreatedAt,
                        Wallet = db.Wallets
                            .Where(w => w.UserId == u.Id)
                            .Select(w => new
                            {
                                w.Balance,
                                TotalUsed = db.CreditTransactions
                                    .Where(t => t.WalletId == w.Id && t.Amount < 0)
                                    .Sum(t => (int?)t.Amount) ?? 0,
                                LastUsed = db.CreditTransactions
                                    .Where(t => t.WalletId == w.Id && t.Amount < 0)
                                    .OrderByDescending(t => t.CreatedAt)
                                    .Select(t => (DateTime?)t.CreatedAt)
                                    .FirstOrDefault()
                            })
                            .FirstOrDefault()
                    })
                    .OrderByDescending(u => u.CreatedAt)
                    .ToListAsync(ct);
            }

            // Calculate summary statistics
            var totalUsersCount = users.Count;
            var totalCreditsGranted = users.Sum(u =>
                (u.Wallet?.Balance ?? 0) + Math.Abs(u.Wallet?.TotalUsed ?? 0));
            var totalCreditsUsed = Math.Abs(users.Sum(u => u.Wallet?.TotalUsed ?? 0));
            var usersOutOfCreditsCount = users.Count(u => (u.Wallet?.Balance ?? 0) == 0);
            var usersLowCreditsCount = users.Count(u =>
                (u.Wallet?.Balance ?? 0) > 0 && (u.Wallet?.Balance ?? 0) < 10);

            return Ok(new
            {
                TotalUsers = totalUsersCount,
                TotalCreditsGranted = totalCreditsGranted,
                TotalCreditsUsed = totalCreditsUsed,
                UsersOutOfCredits = usersOutOfCreditsCount,
                UsersLowCredits = usersLowCreditsCount,
                Users = users
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Failed to load credit statistics", message = ex.Message });
        }
    }
}
