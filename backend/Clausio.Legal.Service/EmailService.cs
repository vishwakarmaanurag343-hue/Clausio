using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Clausio.Legal.Service;

public interface IEmailService
{
    Task<bool> SendEmailAsync(
        string toEmail,
        string toName,
        string subject,
        string htmlBody,
        CancellationToken ct = default);
}

public class EmailService(
    IConfiguration config,
    IHttpClientFactory httpClientFactory,
    ILogger<EmailService> logger
) : IEmailService
{
    public async Task<bool> SendEmailAsync(
        string toEmail,
        string toName,
        string subject,
        string htmlBody,
        CancellationToken ct = default)
    {
        try
        {
            var apiKey = config["Resend:ApiKey"]
                ?? throw new Exception("Resend:ApiKey not configured.");
            var fromEmail = config["Resend:FromEmail"] ?? "noreply@clausiotech.com";
            var fromName = config["Resend:FromName"] ?? "Clausio Legal";

            var client = httpClientFactory.CreateClient("Resend");
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", apiKey);

            var payload = new
            {
                from = $"{fromName} <{fromEmail}>",
                to = new[] { toEmail },
                subject = subject,
                html = htmlBody
            };

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.PostAsync(
                "https://api.resend.com/emails", content, ct);

            var responseBody = await response.Content.ReadAsStringAsync(ct);

            if (response.IsSuccessStatusCode)
            {
                logger.LogInformation(
                    "[Email] Sent to {Email} — {Subject}", toEmail, subject);
                return true;
            }

            logger.LogWarning(
                "[Email] Failed to send to {Email}: {Body}", toEmail, responseBody);
            return false;
        }
        catch (Exception ex)
        {
            logger.LogError("[Email] Exception: {Error}", ex.Message);
            return false;
        }
    }
}
