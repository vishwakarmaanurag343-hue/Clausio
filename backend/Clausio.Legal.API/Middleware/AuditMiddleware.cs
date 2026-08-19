using System.Diagnostics;
using System.Security.Claims;
using Clausio.Legal.Core.Entities;
using Clausio.Legal.Infrastructure;

namespace Clausio.Legal.API.Middleware;

public class AuditMiddleware(RequestDelegate next)
{
    private static readonly string[] SkipPaths =
        ["/health", "/swagger", "/_next", "/favicon"];

    public async Task InvokeAsync(HttpContext context, ClausioDbContext db)
    {
        var path = context.Request.Path.Value ?? "";
        if (SkipPaths.Any(p => path.StartsWith(p)))
        {
            await next(context);
            return;
        }

        var stopwatch = Stopwatch.StartNew();
        await next(context);
        stopwatch.Stop();

        var userId    = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userEmail = context.User.FindFirst(ClaimTypes.Email)?.Value;
        var userRole  = context.User.FindFirst(ClaimTypes.Role)?.Value;

        var action = DetermineAction(context.Request.Method, path);

        try
        {
            var log = new AuditLog
            {
                UserId      = userId != null ? Guid.Parse(userId) : null,
                UserEmail   = userEmail,
                UserRole    = userRole,
                Action      = action,
                Method      = context.Request.Method,
                Path        = path,
                StatusCode  = context.Response.StatusCode,
                IpAddress   = context.Connection.RemoteIpAddress?.ToString(),
                UserAgent   = context.Request.Headers.UserAgent.ToString(),
                Duration    = stopwatch.ElapsedMilliseconds,
                CreatedAt   = DateTime.UtcNow
            };

            db.AuditLogs.Add(log);
            await db.SaveChangesAsync();
        }
        catch
        {
            // Never crash the request
        }
    }

    private static string DetermineAction(string method, string path)
    {
        var p = path.ToLower();

        if (p.Contains("auth/login"))    return "USER_LOGIN";
        if (p.Contains("auth/register")) return "USER_REGISTER";
        if (p.Contains("cases"))         return $"CASE_{method}";
        if (p.Contains("clients"))       return $"CLIENT_{method}";
        if (p.Contains("documents"))     return $"DOCUMENT_{method}";
        if (p.Contains("hearings"))      return $"HEARING_{method}";
        if (p.Contains("/ai/"))          return $"AI_{method}";
        if (p.Contains("billing"))       return $"BILLING_{method}";

        return $"{method}_{p.Replace("/", "_").ToUpper()}";
    }
}
