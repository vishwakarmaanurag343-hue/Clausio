namespace Clausio.Legal.Core.Dtos;

public record AdminUserDto(
    Guid    Id,
    string  FirstName,
    string  LastName,
    string  Email,
    string? Role,
    string? Phone,
    bool    IsActive,
    DateTime CreatedAt
);

public record UpdateUserDto(
    string? FirstName,
    string? LastName,
    string? Email,
    string? Phone,
    string? Role,
    bool?   IsActive
);

public record CreateUserDto(
    string  FirstName,
    string  LastName,
    string  Email,
    string? Phone,
    string? Role,
    string  TempPassword
);

public record UpdatePermissionsDto(List<string> PageKeys);

public record AdminStatsDto(
    int TotalUsers,
    int TotalCases,
    int TotalDocuments,
    int TotalHearings,
    int AiCallsToday,
    int AiCallsThisMonth,
    double AiSuccessRate,
    double AvgAiLatencyMs,
    int ActiveUsersToday
);

public record UpdateUserRoleDto(string Role);

public record AdminAuditLogDto(
    Guid     Id,
    string?  UserEmail,
    string?  UserRole,
    string   Action,
    string?  Method,
    string?  Path,
    int?     StatusCode,
    string?  IpAddress,
    long?    Duration,
    DateTime CreatedAt
);

public record AdminAiLogDto(
    Guid     Id,
    Guid     CaseId,
    string   Intent,
    string   Provider,
    string   Model,
    long     LatencyMs,
    int      TokensIn,
    int      TokensOut,
    int      CitationConfidenceScore,
    int      HallucinationRiskScore,
    bool     IsSuccess,
    string?  ErrorMessage,
    DateTime CreatedAt
);
