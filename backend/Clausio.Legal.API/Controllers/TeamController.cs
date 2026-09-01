using Clausio.Legal.Core.Entities;
using Clausio.Legal.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Clausio.Legal.API.Controllers;

[Authorize]
[ApiController]
[Route("api/team")]
public class TeamController(
    ClausioDbContext db) : ControllerBase
{
    private Guid UserId => Guid.TryParse(
        User?.FindFirstValue(ClaimTypes.NameIdentifier),
        out var id) ? id : Guid.Empty;

    private static readonly string[] ValidRoles =
    {
        "SuperAdmin", "SeniorAdvocate",
        "JuniorAdvocate", "Clerk", "Intern"
    };

    // GET /api/team/members
    // Returns all active users as team members
    [HttpGet("members")]
    public async Task<IActionResult> GetMembers(
        CancellationToken ct)
    {
        var me = UserId;

        var members = await db.Users
            .AsNoTracking()
            .Where(u => u.IsActive)
            .OrderBy(u => u.FirstName)
            .Select(u => new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email,
                u.Role,
                u.Phone,
                u.IsActive,
                u.CreatedAt,
                IsCurrentUser = u.Id == me
            })
            .ToListAsync(ct);

        var stats = new
        {
            Total = members.Count,
            Advocates = members.Count(m =>
                m.Role == "SeniorAdvocate" ||
                m.Role == "JuniorAdvocate"),
            Associates = members.Count(m =>
                m.Role == "Clerk"),
            Interns = members.Count(m =>
                m.Role == "Intern"),
        };

        return Ok(new { members, stats });
    }

    // POST /api/team/invite
    // Creates a new user account (invite)
    [HttpPost("invite")]
    public async Task<IActionResult> Invite(
        [FromBody] InviteTeamMemberDto dto,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.Email))
            return BadRequest(
                new { error = "Email is required." });

        var email = dto.Email.Trim().ToLowerInvariant();

        if (await db.Users.AnyAsync(
            u => u.Email == email, ct))
            return BadRequest(new
            {
                error = "A user with this email already exists."
            });

        var role = string.IsNullOrWhiteSpace(dto.Role)
            ? "JuniorAdvocate" : dto.Role;

        if (!ValidRoles.Contains(role))
            return BadRequest(new
            {
                error = $"Invalid role."
            });

        // Generate a temporary password
        var tempPassword =
            $"Clausio@{DateTime.UtcNow:MMddyyyy}!";

        var user = new User
        {
            FirstName = dto.FirstName?.Trim() ?? "",
            LastName = dto.LastName?.Trim() ?? "",
            Email = email,
            Phone = dto.Phone?.Trim(),
            Role = role,
            IsActive = true,
            IsEmailVerified = true,
        };
        user.PasswordHash = new PasswordHasher<User>()
            .HashPassword(user, tempPassword);

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        return Ok(new
        {
            user.Id,
            user.FirstName,
            user.LastName,
            user.Email,
            user.Role,
            TempPassword = tempPassword,
            Message =
                $"Account created. Share these credentials with {email}."
        });
    }

    // PUT /api/team/members/{id}/role
    [HttpPut("members/{id:guid}/role")]
    public async Task<IActionResult> UpdateRole(
        Guid id,
        [FromBody] UpdateTeamRoleDto dto,
        CancellationToken ct)
    {
        if (!ValidRoles.Contains(dto.Role))
            return BadRequest(
                new { error = "Invalid role." });

        var user = await db.Users
            .FindAsync(new object[] { id }, ct);
        if (user == null) return NotFound();

        user.Role = dto.Role;
        await db.SaveChangesAsync(ct);

        return Ok(new
        {
            user.Id,
            user.Email,
            user.Role
        });
    }

    // DELETE /api/team/members/{id}
    // Deactivates user (does not delete data)
    [HttpDelete("members/{id:guid}")]
    public async Task<IActionResult> RemoveMember(
        Guid id, CancellationToken ct)
    {
        if (id == UserId)
            return BadRequest(new
            {
                error = "You cannot remove yourself."
            });

        var user = await db.Users
            .FindAsync(new object[] { id }, ct);
        if (user == null) return NotFound();

        user.IsActive = false;
        await db.SaveChangesAsync(ct);
        return Ok(new { success = true });
    }
}

public record InviteTeamMemberDto(
    string Email,
    string? FirstName,
    string? LastName,
    string? Phone,
    string? Role);

public record UpdateTeamRoleDto(string Role);
