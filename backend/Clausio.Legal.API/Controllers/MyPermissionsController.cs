using Clausio.Legal.API.Extensions;
using Clausio.Legal.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Clausio.Legal.API.Controllers;

/// <summary>
/// The signed-in user's own page permissions — used by the sidebar to hide pages
/// the user cannot open. Any authenticated user may call this (unlike the admin
/// permission-management endpoints). SuperAdmins are unrestricted.
/// </summary>
[Authorize]
[ApiController]
[Route("api/admin")]
public class MyPermissionsController(ClausioDbContext db) : ControllerBase
{
    [HttpGet("my-permissions")]
    public async Task<IActionResult> Mine(CancellationToken ct)
    {
        var userId = User.GetUserId();
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct);

        // SuperAdmin: everything. Also signal "unrestricted" so the frontend never filters.
        if (user?.Role == "SuperAdmin")
            return Ok(new { unrestricted = true, pageKeys = Array.Empty<string>() });

        var keys = await db.UserPagePermissions.AsNoTracking()
            .Where(p => p.UserId == userId && p.HasAccess)
            .Select(p => p.PageKey)
            .ToListAsync(ct);

        // No rows → no restriction configured for this user → allow all.
        return Ok(new { unrestricted = keys.Count == 0, pageKeys = keys });
    }
}
