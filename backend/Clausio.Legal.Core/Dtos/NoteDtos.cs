namespace Clausio.Legal.Core.Dtos;

public class CreateNoteDto
{
    public string? Tag { get; set; }
    public string Body { get; set; } = string.Empty;
}

public class UpdateNoteDto
{
    public string? Tag { get; set; }
    public string? Body { get; set; }
    public bool? Pinned { get; set; }
}
