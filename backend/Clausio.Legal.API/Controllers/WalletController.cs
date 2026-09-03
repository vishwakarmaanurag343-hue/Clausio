using Clausio.Legal.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Clausio.Legal.API.Controllers;

[Authorize]
[ApiController]
[Route("api/wallet")]
public class WalletController(
    IWalletService walletService
) : ControllerBase
{
    private Guid UserId => Guid.TryParse(
        User?.FindFirstValue(ClaimTypes.NameIdentifier),
        out var id) ? id : Guid.Empty;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var summary = await walletService.GetSummaryAsync(UserId, ct);
        return Ok(summary);
    }
}
