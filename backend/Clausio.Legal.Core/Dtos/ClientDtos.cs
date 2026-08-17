using System.ComponentModel.DataAnnotations;

namespace Clausio.Legal.Core.Dtos;

public class CreateClientDto
{
    [Required(ErrorMessage = "First name is required.")]
    [StringLength(100, MinimumLength = 1, ErrorMessage = "First name cannot exceed 100 characters.")]
    public string? FirstName { get; set; }

    [StringLength(100, ErrorMessage = "Last name cannot exceed 100 characters.")]
    public string? LastName { get; set; }

    [Required(ErrorMessage = "Phone number is required.")]
    [Phone(ErrorMessage = "Invalid phone number format.")]
    public string? Phone { get; set; }

    [Phone(ErrorMessage = "Invalid alternate phone number format.")]
    public string? AltPhone { get; set; }

    [EmailAddress(ErrorMessage = "Invalid email address format.")]
    public string? Email { get; set; }

    public string? WhatsApp { get; set; }
    public string? Address { get; set; }
    public string? ClientType { get; set; }

    [RegularExpression(@"^(\d{4}[\s-]?\d{4}[\s-]?\d{4}|\d{12})?$", ErrorMessage = "Invalid Aadhaar number format (must be 12 digits).")]
    public string? Aadhar { get; set; }

    [RegularExpression(@"^([A-Z]{5}[0-9]{4}[A-Z]{1})?$", ErrorMessage = "Invalid PAN number format (e.g. ABCDE1234F).")]
    public string? Pan { get; set; }

    public string? Occupation { get; set; }
    public double? MonthlyIncome { get; set; }
    public string? BankName { get; set; }
    public bool IsVip { get; set; }
    public string? Notes { get; set; }
}
