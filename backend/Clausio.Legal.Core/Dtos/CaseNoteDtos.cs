namespace Clausio.Legal.Core.Dtos;

/// <summary>Body for POST /api/notes — upsert one notepad category for a case (or general).</summary>
public record SaveCaseNoteDto(Guid? CaseId, string Category, string Content);
