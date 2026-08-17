using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Clausio.Legal.Core.Entities;
using Clausio.Legal.Core.Entities.Security;
using Clausio.Legal.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;

namespace Clausio.Legal.Service.Security;

public interface IPiiTokenService
{
    // Convert real text to tokens before sending to LLM
    Task<string> TokenizeAsync(string text, Guid caseId, CancellationToken ct = default);

    // Restore tokens back to real names in AI response
    Task<string> DetokenizeAsync(string text, Guid caseId, CancellationToken ct = default);

    // Register tokens when a case/client is created or updated
    Task RegisterCaseTokensAsync(Guid caseId, Client client, CancellationToken ct = default);
}

public class PiiTokenService(
    SensitiveDbContext sensitiveDb,
    IEncryptionService encryption) : IPiiTokenService
{
    public async Task<string> TokenizeAsync(
        string text, Guid caseId, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(text)) return text;

        if (caseId != Guid.Empty)
        {
            // Load existing tokens for this case
            var vault = await sensitiveDb.TokenVault
                .Where(t => t.CaseId == caseId)
                .ToListAsync(ct);

            foreach (var entry in vault)
            {
                var realValue = encryption.Decrypt(entry.RealValue);
                if (!string.IsNullOrWhiteSpace(realValue) && text.Contains(realValue, StringComparison.OrdinalIgnoreCase))
                {
                    text = Regex.Replace(text, Regex.Escape(realValue), entry.Token, RegexOptions.IgnoreCase);
                }
            }
        }

        // Apply regex safety net for unmatched PII
        return ApplyRegexMasking(text);
    }

    public async Task<string> DetokenizeAsync(
        string text, Guid caseId, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(text) || caseId == Guid.Empty) return text;

        var vault = await sensitiveDb.TokenVault
            .Where(t => t.CaseId == caseId)
            .ToListAsync(ct);

        foreach (var entry in vault)
        {
            var realValue = encryption.Decrypt(entry.RealValue);
            if (!string.IsNullOrWhiteSpace(realValue))
            {
                text = text.Replace(entry.Token, realValue);
            }
        }

        return text;
    }

    public async Task RegisterCaseTokensAsync(
        Guid caseId, Client client, CancellationToken ct = default)
    {
        if (caseId == Guid.Empty || client == null) return;

        var existing = await sensitiveDb.TokenVault
            .Where(t => t.CaseId == caseId)
            .ToListAsync(ct);

        if (existing.Count > 0)
        {
            sensitiveDb.TokenVault.RemoveRange(existing);
        }

        var tokens = new List<TokenVaultEntry>();
        int partyCounter = 1;

        // Person name
        var fullName = $"{client.FirstName} {client.LastName}".Trim();
        if (!string.IsNullOrWhiteSpace(fullName))
        {
            tokens.Add(new TokenVaultEntry
            {
                CaseId    = caseId,
                Token     = $"PARTY_{partyCounter++}",
                TokenType = "PERSON",
                RealValue = encryption.Encrypt(fullName)
            });
        }

        // Phone
        if (!string.IsNullOrEmpty(client.Phone))
        {
            tokens.Add(new TokenVaultEntry
            {
                CaseId    = caseId,
                Token     = "PHONE_1",
                TokenType = "PHONE",
                RealValue = encryption.Encrypt(client.Phone)
            });
        }

        // Aadhaar
        if (!string.IsNullOrEmpty(client.Aadhar))
        {
            tokens.Add(new TokenVaultEntry
            {
                CaseId    = caseId,
                Token     = "AADHAAR_MASKED",
                TokenType = "AADHAAR",
                RealValue = encryption.Encrypt(client.Aadhar)
            });
        }

        // PAN
        if (!string.IsNullOrEmpty(client.Pan))
        {
            tokens.Add(new TokenVaultEntry
            {
                CaseId    = caseId,
                Token     = "PAN_MASKED",
                TokenType = "PAN",
                RealValue = encryption.Encrypt(client.Pan)
            });
        }

        // Email
        if (!string.IsNullOrEmpty(client.Email))
        {
            tokens.Add(new TokenVaultEntry
            {
                CaseId    = caseId,
                Token     = "EMAIL_1",
                TokenType = "EMAIL",
                RealValue = encryption.Encrypt(client.Email)
            });
        }

        // Address
        if (!string.IsNullOrEmpty(client.Address))
        {
            tokens.Add(new TokenVaultEntry
            {
                CaseId    = caseId,
                Token     = "ADDRESS_1",
                TokenType = "ADDRESS",
                RealValue = encryption.Encrypt(client.Address)
            });
        }

        if (tokens.Count > 0)
        {
            sensitiveDb.TokenVault.AddRange(tokens);
            await sensitiveDb.SaveChangesAsync(ct);
        }
    }

    private static string ApplyRegexMasking(string text)
    {
        // Aadhaar pattern: 1234-5678-9012 or 1234 5678 9012 or 123456789012
        text = Regex.Replace(text, @"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b", "[AADHAAR_MASKED]");

        // PAN: ABCDE1234F
        text = Regex.Replace(text, @"\b[A-Z]{5}\d{4}[A-Z]\b", "[PAN_MASKED]");

        // Phone: 10-digit Indian (+91 optional)
        text = Regex.Replace(text, @"\b(?:\+91[\s-]?)?[6-9]\d{9}\b", "[PHONE_MASKED]");

        // Email
        text = Regex.Replace(text, @"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", "[EMAIL_MASKED]");

        return text;
    }
}
