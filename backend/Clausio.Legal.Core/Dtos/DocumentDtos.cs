namespace Clausio.Legal.Core.Dtos;

public class UpdateDocumentFilingDto
{
    /// <summary>"Filed" | "Not Filed"</summary>
    public string FilingStatus { get; set; } = "Not Filed";
    /// <summary>When filing — defaults to now if omitted. Ignored (cleared) when un-filing.</summary>
    public DateTime? FiledDate { get; set; }
    /// <summary>Optional hearing this document was filed at. Must belong to the same case.</summary>
    public Guid? FiledAtHearingId { get; set; }
}
