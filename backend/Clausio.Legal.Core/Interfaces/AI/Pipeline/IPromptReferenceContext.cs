namespace Clausio.Legal.Core.Interfaces.AI.Pipeline;

/// <summary>
/// Request-scoped carrier for the lawyer's selected style-reference text. An API filter
/// resolves "?referenceDocId=" on /api/ai/* requests and sets <see cref="Text"/>; the
/// AI pipeline reads it and injects it into the model context. Null = no reference.
/// </summary>
public interface IPromptReferenceContext
{
    string? Text { get; set; }
}

public sealed class PromptReferenceContext : IPromptReferenceContext
{
    public string? Text { get; set; }
}
