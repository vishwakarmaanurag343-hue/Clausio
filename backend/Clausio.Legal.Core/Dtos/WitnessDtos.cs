namespace Clausio.Legal.Core.Dtos;

public class CreateWitnessDto
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Independent";
    public string Side { get; set; } = "Ours";
    public string? Statement { get; set; }
}

public class WitnessPrepRequestDto
{
    public Guid WitnessId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Side { get; set; } = string.Empty;
    public string? Statement { get; set; }
}
