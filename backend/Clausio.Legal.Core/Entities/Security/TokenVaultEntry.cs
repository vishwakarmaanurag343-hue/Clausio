using System;

namespace Clausio.Legal.Core.Entities.Security;

public class TokenVaultEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CaseId { get; set; }
    public string Token { get; set; } = string.Empty; // e.g. PARTY_1, PHONE_1, AADHAAR_MASKED
    public string TokenType { get; set; } = string.Empty; // PERSON, PHONE, AADHAAR, PAN, EMAIL, ADDRESS
    public string RealValue { get; set; } = string.Empty; // Encrypted real value
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
