using System;
using System.ComponentModel.DataAnnotations;

namespace Clausio.Legal.Core.Dtos;

public class CreateCaseDto
{
    [Required(ErrorMessage = "Case title / name is required.")]
    [StringLength(200, MinimumLength = 3, ErrorMessage = "Case name must be between 3 and 200 characters.")]
    public string? Name { get; set; }

    [StringLength(100, ErrorMessage = "Case number cannot exceed 100 characters.")]
    public string? CaseNumber { get; set; }

    [Required(ErrorMessage = "Case type is required.")]
    [StringLength(100, ErrorMessage = "Case type cannot exceed 100 characters.")]
    public string? CaseType { get; set; }

    public string? SubType { get; set; }

    [Required(ErrorMessage = "Court name is required.")]
    [StringLength(150, ErrorMessage = "Court name cannot exceed 150 characters.")]
    public string? Court { get; set; }

    public string? CourtLocation { get; set; }
    public string? Stage { get; set; }
    public string? Priority { get; set; }
    public string? OpposingAdv { get; set; }
    public DateTime FiledOn { get; set; } = DateTime.UtcNow;
    public DateTime? NextHearing { get; set; }

    [Required(ErrorMessage = "Client selection is required.")]
    public Guid ClientId { get; set; }

    public string? Description { get; set; }
    public string? KeyFacts { get; set; }
    public string? Relief { get; set; }
    public string? Notes { get; set; }
}

public class UpdateCaseDto
{
    [StringLength(200, MinimumLength = 3, ErrorMessage = "Case name must be between 3 and 200 characters.")]
    public string? Name { get; set; }

    public string? Stage { get; set; }
    public string? Status { get; set; }
    public string? Priority { get; set; }
    public string? OpposingAdv { get; set; }
    public DateTime? NextHearing { get; set; }

    [Range(0, 100, ErrorMessage = "Readiness score must be between 0 and 100.")]
    public int? ReadinessScore { get; set; }
}
