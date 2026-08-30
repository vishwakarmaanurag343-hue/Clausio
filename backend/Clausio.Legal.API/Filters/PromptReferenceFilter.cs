using Clausio.Legal.API.Extensions;
using Clausio.Legal.Core.Interfaces.AI.Pipeline;
using Clausio.Legal.Infrastructure;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;

namespace Clausio.Legal.API.Filters;

/// <summary>
/// Resolves a "?referenceDocId={guid}" query param on any request into the current
/// user's style-reference text and stashes it in the request-scoped
/// <see cref="IPromptReferenceContext"/> so the AI pipeline can pick it up without
/// every AI endpoint needing its own parameter.
/// </summary>
public sealed class PromptReferenceFilter(ClausioDbContext db, IPromptReferenceContext refContext) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var raw = context.HttpContext.Request.Query["referenceDocId"].ToString();
        if (Guid.TryParse(raw, out var id) && context.HttpContext.User.Identity?.IsAuthenticated == true)
        {
            try
            {
                var userId = context.HttpContext.User.GetUserId();
                refContext.Text = await db.PromptReferenceDocs.AsNoTracking()
                    .Where(d => d.Id == id && d.UserId == userId)
                    .Select(d => d.ExtractedText)
                    .FirstOrDefaultAsync(context.HttpContext.RequestAborted);
            }
            catch
            {
                // reference is best-effort — never block the AI call
            }
        }

        await next();
    }
}
