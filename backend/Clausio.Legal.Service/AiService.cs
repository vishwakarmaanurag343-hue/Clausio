using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Clausio.Legal.Core.Dtos;
using Clausio.Legal.Core.Interfaces.AI.Pipeline;

namespace Clausio.Legal.Service;

public interface IAiService
{
    Task<string> SummarizeCaseAsync(Guid caseId, CancellationToken cancellationToken = default);
    Task<string> GenerateChronologyAsync(Guid caseId, CancellationToken cancellationToken = default);
    Task<string> DetectContradictionsAsync(Guid caseId, CancellationToken cancellationToken = default);
    Task<string> AnalyzeEvidenceAsync(Guid documentId, CancellationToken cancellationToken = default);
    Task<string> ResearchAsync(Guid caseId, CancellationToken cancellationToken = default);
    Task<string> GenerateActionPlanAsync(Guid caseId, CancellationToken cancellationToken = default);
    Task<string> TranslateAsync(TranslateRequest request, CancellationToken cancellationToken = default);
    Task<string> ChatAsync(ChatRequestDto request, CancellationToken cancellationToken = default);
    IAsyncEnumerable<string> StreamChatAsync(ChatRequestDto request, CancellationToken cancellationToken = default);
    Task<string> DraftClientUpdateAsync(Guid caseId, ClientUpdateRequestDto request, CancellationToken cancellationToken = default);
    Task<string> AnalyzeFinancialsAsync(Guid caseId, CancellationToken cancellationToken = default);
    Task<string> AssessReadinessAsync(Guid caseId, CancellationToken cancellationToken = default);
    Task<string> AssessCaseRisksAsync(Guid caseId, CancellationToken cancellationToken = default);
    Task<string> GenerateCaseRecommendationsAsync(Guid caseId, CancellationToken cancellationToken = default);
    Task<string> EmergencyTriageAsync(EmergencyRequestDto request, CancellationToken cancellationToken = default);
    Task<string> PrepHearingAsync(Guid caseId, CancellationToken cancellationToken = default);
    Task<string> PrepWitnessAsync(Guid caseId, WitnessPrepRequestDto request, CancellationToken cancellationToken = default);
    Task<string> ClassifyCaseTypeAsync(CaseTypeRequestDto request, CancellationToken cancellationToken = default);
    Task<string> DraftDocumentAsync(Guid caseId, DraftRequestDto request, CancellationToken cancellationToken = default);
}

public class AiService : IAiService
{
    private readonly IAIPipeline _pipeline;

    public AiService(IAIPipeline pipeline)
    {
        _pipeline = pipeline;
    }

    public Task<string> SummarizeCaseAsync(Guid caseId, CancellationToken cancellationToken = default)
        => _pipeline.ExecuteAsync(caseId, "Prepare a comprehensive case summary brief.", "Summarization", null, cancellationToken);

    public Task<string> GenerateChronologyAsync(Guid caseId, CancellationToken cancellationToken = default)
        => _pipeline.ExecuteAsync(caseId, "Construct a comprehensive chronological timeline.", "Analysis", null, cancellationToken);

    /// <summary>
    /// Courtroom-grade contradiction detection for the Strategy tab. Dedicated
    /// ContradictionAnalysis persona/template returns strict { contradictions:[
    /// {statementA, statementB, natureOfContradiction, suggestedCrossExamQuestion,
    /// severity}] } JSON — only conflicts supported by two citable record sources.
    /// </summary>
    public Task<string> DetectContradictionsAsync(Guid caseId, CancellationToken cancellationToken = default)
        => _pipeline.ExecuteAsync(caseId,
            "Find every contradiction in this case strictly per the system instructions. Compare each statement against every other statement and document in the record — dates, amounts, names, events, filing statuses. Report only conflicts directly supported by two citable sources from the context; never invent one.",
            "Contradiction", null, cancellationToken);

    public Task<string> AnalyzeEvidenceAsync(Guid documentId, CancellationToken cancellationToken = default)
        => _pipeline.ExecuteAsync(documentId, "Analyze the specific evidence contained in this document.", "Analysis", null, cancellationToken);

    public Task<string> ResearchAsync(Guid caseId, CancellationToken cancellationToken = default)
        => _pipeline.ExecuteAsync(caseId,
            "Retrieve precedent for this case strictly per the system instructions — only from the verified judgments supplied in the context, ranked best-match first, never fabricated.",
            "LegalResearch", null, cancellationToken);

    public Task<string> GenerateActionPlanAsync(Guid caseId, CancellationToken cancellationToken = default)
        => _pipeline.ExecuteAsync(caseId,
            "Build the working action plan for this case strictly per the system instructions. Pull the real next hearing date from the case context and express every deadline relative to it. Distribute tasks realistically across Advocate, Client and Clerk, trace each task to something actually pending in the record, and order most urgent first.",
            "ActionPlan", null, cancellationToken);

    public Task<string> TranslateAsync(TranslateRequest request, CancellationToken cancellationToken = default)
    {
        var parameters = new Dictionary<string, object> { { "DocumentType", "Translation" } };
        return _pipeline.ExecuteAsync(Guid.Empty, $"Translate the following text to English: {request.Text}", "LegalDraft", parameters, cancellationToken);
    }

    public Task<string> ChatAsync(ChatRequestDto request, CancellationToken cancellationToken = default)
        => _pipeline.ExecuteAsync(request.CaseId.GetValueOrDefault(), request.Message ?? "", "chat", null, cancellationToken);
        
    public IAsyncEnumerable<string> StreamChatAsync(ChatRequestDto request, CancellationToken cancellationToken = default)
        => _pipeline.StreamExecuteAsync(request.CaseId.GetValueOrDefault(), request.Message ?? "", "chat", null, cancellationToken);

    /// <summary>
    /// Shared client-update drafter. One persona (ClientUpdate template); the channel
    /// only changes format — WhatsApp is short/casual/emoji-light, Email adds subject
    /// + greeting + formal closing. Model returns { subject, body, actionRequired } JSON.
    /// </summary>
    public Task<string> DraftClientUpdateAsync(Guid caseId, ClientUpdateRequestDto request, CancellationToken cancellationToken = default)
    {
        var isEmail = string.Equals(request.Channel, "email", StringComparison.OrdinalIgnoreCase);
        var channel = isEmail ? "Email" : "WhatsApp";
        var parameters = new Dictionary<string, object> { { "DocumentType", $"Client Update ({channel})" } };

        var instructions = string.Join("\n",
            $"CHANNEL: {channel.ToUpperInvariant()}",
            $"TONE: {(string.IsNullOrWhiteSpace(request.Tone) ? "Reassuring" : request.Tone)}",
            $"LANGUAGE: {(string.IsNullOrWhiteSpace(request.Language) ? "English" : request.Language)}",
            "Draft the update for this case strictly per the channel format and output JSON contract.");

        return _pipeline.ExecuteAsync(caseId, instructions, "LegalDraft", parameters, cancellationToken);
    }

    public Task<string> AnalyzeFinancialsAsync(Guid caseId, CancellationToken cancellationToken = default)
        => _pipeline.ExecuteAsync(caseId, "Analyze the financial implications.", "Analysis", null, cancellationToken);

    public Task<string> AssessReadinessAsync(Guid caseId, CancellationToken cancellationToken = default)
        => _pipeline.ExecuteAsync(caseId, "Assess case readiness for trial.", "Analysis", null, cancellationToken);

    /// <summary>
    /// Courtroom-grade risk assessment for the Strategy tab. Dedicated RiskAssessment
    /// persona/template returns strict { risks:[{risk,category,severity,cause,mitigation}] } JSON.
    /// </summary>
    public Task<string> AssessCaseRisksAsync(Guid caseId, CancellationToken cancellationToken = default)
        => _pipeline.ExecuteAsync(caseId,
            "Identify every real risk in this case strictly per the system instructions. Examine each document's actual contents AND its filing status, the hearing history and every date for defects, mismatches, omissions and pending matters. Each risk must be traced to specific facts, documents or gaps present in the case context, with a detailed cause explaining the mechanism of harm and a concrete mitigation plan.",
            "RiskAssessment", null, cancellationToken);

    /// <summary>
    /// Courtroom-grade strategic recommendations for the Strategy tab. Dedicated
    /// Recommendation persona/template returns strict { recommendations:[{recommendation,
    /// addressesRisk, reasoning}] } JSON, risk-countering moves prioritised first.
    /// </summary>
    public Task<string> GenerateCaseRecommendationsAsync(Guid caseId, CancellationToken cancellationToken = default)
        => _pipeline.ExecuteAsync(caseId,
            "Recommend the concrete strategic moves for this case strictly per the system instructions. Examine each document's contents and filing status, the hearing history and every date. Moves that directly counter a risk visible in the record come first with addressesRisk naming it; standalone moves only when clearly supported by the case context.",
            "Recommendation", null, cancellationToken);

    public Task<string> EmergencyTriageAsync(EmergencyRequestDto request, CancellationToken cancellationToken = default)
        => _pipeline.ExecuteAsync(Guid.Empty, $"Perform an emergency triage for the following critical update: {request.Query}", "ActionPlan", null, cancellationToken);

    public Task<string> PrepHearingAsync(Guid caseId, CancellationToken cancellationToken = default)
        => _pipeline.ExecuteAsync(caseId,
            "Prepare today's hearing strategy brief strictly from the case context.",
            "HearingPrep", null, cancellationToken);

    public Task<string> PrepWitnessAsync(Guid caseId, WitnessPrepRequestDto request, CancellationToken cancellationToken = default)
        => _pipeline.ExecuteAsync(caseId,
            $"Prepare witness intelligence for {(string.IsNullOrWhiteSpace(request.Side) ? "Ours" : request.Side)} witness \"{request.Name}\" ({request.Type}). " +
            $"Their recorded statement: {(string.IsNullOrWhiteSpace(request.Statement) ? "No statement recorded." : request.Statement)}",
            "WitnessPrep", null, cancellationToken);

    public Task<string> ClassifyCaseTypeAsync(CaseTypeRequestDto request, CancellationToken cancellationToken = default)
        => _pipeline.ExecuteAsync(Guid.Empty, $"Classify the legal nature, jurisdiction, and priority of this case based on the following context: {request.Description}", "Analysis", null, cancellationToken);

    public Task<string> DraftDocumentAsync(Guid caseId, DraftRequestDto request, CancellationToken cancellationToken = default)
    {
        var parameters = new Dictionary<string, object> { { "DocumentType", request.DraftType ?? "Document" } };
        return _pipeline.ExecuteAsync(caseId, request.Instructions ?? "Draft the document.", "LegalDraft", parameters, cancellationToken);
    }
}
