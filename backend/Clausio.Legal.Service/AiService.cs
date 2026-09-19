using System;
using System.Collections.Generic;
using System.Linq;
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
    Task<string> AnalyzeCaseEvidenceAsync(Guid caseId, CancellationToken cancellationToken = default);
    Task<string> ResearchAsync(Guid caseId, CancellationToken cancellationToken = default);
    Task<string> GenerateActionPlanAsync(Guid caseId, CancellationToken cancellationToken = default);
    Task<string> TranslateAsync(TranslateRequest request, CancellationToken cancellationToken = default);
    Task<string> ChatAsync(ChatRequestDto request, CancellationToken cancellationToken = default);
    IAsyncEnumerable<string> StreamChatAsync(ChatRequestDto request, CancellationToken cancellationToken = default);
    Task<string> DraftClientUpdateAsync(Guid caseId, ClientUpdateRequestDto request, CancellationToken cancellationToken = default);
    Task<string> AnalyzeFinancialsAsync(Guid caseId, System.Text.Json.JsonElement? options = null, CancellationToken cancellationToken = default);
    Task<string> AssessReadinessAsync(Guid caseId, Clausio.Legal.Core.Dtos.GenerateReadinessOptionsDto? options = null, CancellationToken cancellationToken = default);
    Task<string> AssessCaseRisksAsync(Guid caseId, CancellationToken cancellationToken = default);
    Task<string> GenerateCaseRecommendationsAsync(Guid caseId, CancellationToken cancellationToken = default);
    Task<string> EmergencyTriageAsync(Guid caseId, EmergencyRequestDto request, CancellationToken cancellationToken = default);
    Task<string> PrepHearingAsync(Guid caseId, CancellationToken cancellationToken = default);
    IAsyncEnumerable<string> StreamPrepHearingAsync(Guid caseId, CancellationToken cancellationToken = default);
    Task<string> PrepWitnessAsync(Guid caseId, WitnessPrepRequestDto request, CancellationToken cancellationToken = default);
    Task<string> ClassifyCaseTypeAsync(CaseTypeRequestDto request, CancellationToken cancellationToken = default);
    Task<string> DraftDocumentAsync(Guid caseId, DraftRequestDto request, CancellationToken cancellationToken = default);
    IAsyncEnumerable<string> StreamDraftDocumentAsync(Guid caseId, DraftRequestDto request, CancellationToken cancellationToken = default);
    IAsyncEnumerable<string> StreamSummaryAsync(Guid caseId, CancellationToken cancellationToken = default);
    IAsyncEnumerable<string> StreamChronologyAsync(Guid caseId, CancellationToken cancellationToken = default);
    IAsyncEnumerable<string> StreamContradictionsAsync(Guid caseId, CancellationToken cancellationToken = default);
    IAsyncEnumerable<string> StreamResearchAsync(Guid caseId, CancellationToken cancellationToken = default);
    IAsyncEnumerable<string> StreamActionPlanAsync(Guid caseId, CancellationToken cancellationToken = default);
    IAsyncEnumerable<string> StreamFinancialAsync(Guid caseId, CancellationToken cancellationToken = default);
    IAsyncEnumerable<string> StreamReadinessAsync(Guid caseId, CancellationToken cancellationToken = default);
    Task<string> GetClarifyingQuestionsAsync(Guid caseId, CancellationToken cancellationToken = default);
    IAsyncEnumerable<string> StreamRisksAsync(Guid caseId, CancellationToken cancellationToken = default);
    IAsyncEnumerable<string> StreamRecommendationsAsync(Guid caseId, CancellationToken cancellationToken = default);
    IAsyncEnumerable<string> StreamWitnessAsync(Guid caseId, CancellationToken cancellationToken = default);
}

public class AiService : IAiService
{
    private readonly IAIPipeline _pipeline;

    public AiService(IAIPipeline pipeline)
    {
        _pipeline = pipeline;
    }

    /// <summary>
    /// Courtroom-grade multi-page working brief for the Analysis page. Dedicated Summary
    /// persona/template returns strict { summary:[{ caseTitle, caseType, court, stage,
    /// overview, issuesForDetermination[], parties, reliefSought, clientCase, opposingCase,
    /// keyFacts, proceduralHistory, evidenceOverview, applicableLaw, strengths[],
    /// weaknesses[], currentPosition, nextSteps[], openQuestions[] }] } JSON — every
    /// sentence grounded in the uploaded documents, the whole record fed to the model.
    /// </summary>
    public Task<string> SummarizeCaseAsync(Guid caseId, CancellationToken cancellationToken = default)
        => _pipeline.ExecuteAsync(caseId,
            "Condense this entire case file into the full working brief strictly per the system instructions and its JSON schema. Read every uploaded document. Ground every sentence in the record, write each section as full plain-Indian-English prose an advocate can rely on, be candid about weaknesses, and say plainly where the record is silent. A long file deserves a long brief.",
            "Summarization", null, cancellationToken);

    /// <summary>
    /// Verified document-grounded chronology for the Analysis page. Dedicated
    /// Chronology persona/template returns strict { timeline:[{date, event,
    /// sourceDocument, conflictingDate}] } JSON — only dates actually present
    /// in the record, conflicts flagged rather than silently resolved.
    /// </summary>
    public Task<string> GenerateChronologyAsync(Guid caseId, CancellationToken cancellationToken = default)
        => _pipeline.ExecuteAsync(caseId,
            "Build the verified case chronology strictly per the system instructions. Extract only dates and events actually present in the case documents, quote each date exactly as its document states it, cite the exact source document for every event, flag conflicting dates via conflictingDate instead of picking one, and order earliest first.",
            "Chronology", null, cancellationToken);

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

    /// <summary>
    /// Courtroom-grade evidence review for the Analysis page. Case-level rather than
    /// per-document: ranking impact by the claim each document serves and spotting
    /// missing evidence both require the whole record. Dedicated EvidenceIntelligence
    /// persona/template returns strict { evidence:[{documentName, impact, supports,
    /// summary}], missingEvidence:[…] } JSON.
    /// </summary>
    public Task<string> AnalyzeCaseEvidenceAsync(Guid caseId, CancellationToken cancellationToken = default)
        => _pipeline.ExecuteAsync(caseId,
            "Review every uploaded document strictly per the system instructions and its JSON schema. Give one entry per document with its type, date, admissibility and mode of proof, what it shows and does not prove, any contradiction with another document, and the exact words to use in court. Add the overall evidence picture and flag only specific evidence the record shows was needed but never uploaded.",
            "Evidence", null, cancellationToken);

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

        var mustContain = new List<string>();
        var mustAbsent = new List<string>();

        if (request.IncludeHearing)
            mustContain.Add("- Latest hearing summary and status update from case context");
        else
            mustAbsent.Add("- Latest hearing details or hearing recap");

        if (request.IncludeNextDate)
            mustContain.Add("- Next scheduled hearing date or timeline if available");
        else
            mustAbsent.Add("- Specific next hearing date");

        if (request.IncludeActionItem)
            mustContain.Add("- Action required by the client");
        else
            mustAbsent.Add("- Action items or tasks for client");

        if (request.IncludeFeeReminder)
            mustContain.Add("- Reminder regarding pending fees or payment");
        else
            mustAbsent.Add("- Fees, invoices or financial payment requests");

        if (!string.IsNullOrWhiteSpace(request.AdditionalInstructions))
            mustContain.Add($"- Note: {request.AdditionalInstructions.Trim()}");

        var targetLang = string.IsNullOrWhiteSpace(request.Language) ? "English" : request.Language.Trim();
        var langDirective = targetLang.StartsWith("English", StringComparison.OrdinalIgnoreCase)
            ? "LANGUAGE: English (Write 100% in English only. Do NOT use Hindi or Hinglish words)."
            : targetLang.StartsWith("Hinglish", StringComparison.OrdinalIgnoreCase)
            ? "LANGUAGE: Hinglish (Hindi written in Roman script mixed naturally with English words)."
            : targetLang.StartsWith("Hindi", StringComparison.OrdinalIgnoreCase)
            ? "LANGUAGE: Hindi (Write in Devanagari script)."
            : $"LANGUAGE: {targetLang}";

        var instructionsList = new List<string>
        {
            $"CHANNEL: {channel.ToUpperInvariant()}",
            $"TONE: {(string.IsNullOrWhiteSpace(request.Tone) ? "Reassuring" : request.Tone)}",
            langDirective
        };

        if (mustContain.Any())
        {
            instructionsList.Add("CONTENT THE MESSAGE MUST CONTAIN:");
            instructionsList.AddRange(mustContain);
        }

        if (mustAbsent.Any())
        {
            instructionsList.Add("CONTENT THAT MUST BE ABSENT:");
            instructionsList.AddRange(mustAbsent);
        }

        instructionsList.Add("Draft the update for this case strictly per the channel format and output JSON contract.");

        var instructions = string.Join("\n", instructionsList);
        return _pipeline.ExecuteAsync(caseId, instructions, "LegalDraft", parameters, cancellationToken);
    }

    /// <summary>
    /// Document-grounded financial-profile extraction for the Financial page. Dedicated
    /// FinancialProfile template returns strict {financialProfile, flaggedDiscrepancies[],
    /// summary} JSON built ONLY from the uploaded financial documents. Optional modal
    /// options (occupation, income source, focus notes…) steer the extraction focus.
    /// </summary>
    public Task<string> AnalyzeFinancialsAsync(Guid caseId, System.Text.Json.JsonElement? options = null, CancellationToken cancellationToken = default)
    {
        var focus = FinancialFocus(options);
        return _pipeline.ExecuteAsync(caseId,
            "Extract the structured financial profile strictly per the system instructions, using only the uploaded financial documents in the context — never invent a figure. Return only the contracted JSON." + focus,
            "FinancialProfile", null, cancellationToken);
    }

    private static string FinancialFocus(System.Text.Json.JsonElement? o)
    {
        if (o is not { ValueKind: System.Text.Json.JsonValueKind.Object } obj) return "";
        var parts = new List<string>();
        if (obj.TryGetProperty("occupation", out var oc) && oc.ValueKind == System.Text.Json.JsonValueKind.String)   parts.Add($"Respondent's occupation: {oc.GetString()}");
        if (obj.TryGetProperty("incomeSource", out var inc) && inc.ValueKind == System.Text.Json.JsonValueKind.String) parts.Add($"Primary income source: {inc.GetString()}");
        if (obj.TryGetProperty("caseFocus", out var cf) && cf.ValueKind == System.Text.Json.JsonValueKind.String)     parts.Add($"Case focus: {cf.GetString()}");
        if (obj.TryGetProperty("documents", out var dt) && dt.ValueKind == System.Text.Json.JsonValueKind.Array)
            parts.Add("Documents the advocate says exist: " + string.Join(", ", dt.EnumerateArray().Select(x => x.GetString())));
        if (obj.TryGetProperty("notes", out var fn) && fn.ValueKind == System.Text.Json.JsonValueKind.String && !string.IsNullOrWhiteSpace(fn.GetString()))
            parts.Add($"Advocate's additional instructions: {fn.GetString()}");
        return parts.Count == 0 ? "" : "\n\nADVOCATE'S FOCUS FOR THIS ANALYSIS:\n- " + string.Join("\n- ", parts);
    }

    /// <summary>
    /// Case-type-tailored readiness assessment. Dedicated ReadinessAssessment template
    /// returns strict {overallScore, scoreSummary, checklist[], strengths[], gaps[]} JSON.
    /// Optional modal options (hearing type, objective, urgency…) steer the focus.
    /// </summary>
    public Task<string> AssessReadinessAsync(Guid caseId, Clausio.Legal.Core.Dtos.GenerateReadinessOptionsDto? options = null, CancellationToken cancellationToken = default)
    {
        var focus = ReadinessFocus(options);
        return _pipeline.ExecuteAsync(caseId,
            "Assess this case's hearing readiness strictly per the system instructions. " +
            "Build the checklist around this case's specific type and current stage, judge every item from the actual record, " +
            "and return only the contracted JSON." + focus,
            "Readiness", null, cancellationToken);
    }

    private static string ReadinessFocus(Clausio.Legal.Core.Dtos.GenerateReadinessOptionsDto? o)
    {
        if (o is null) return "";
        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(o.HearingType)) parts.Add($"Hearing type: {o.HearingType}");
        if (!string.IsNullOrWhiteSpace(o.Court))       parts.Add($"Court / forum: {o.Court}");
        if (!string.IsNullOrWhiteSpace(o.Objective))   parts.Add($"Primary objective: {o.Objective}");
        if (!string.IsNullOrWhiteSpace(o.Urgency))     parts.Add($"Urgency: {o.Urgency}");
        if (o.FocusAreas is { Count: > 0 })            parts.Add($"Areas to emphasise: {string.Join(", ", o.FocusAreas)}");
        if (!string.IsNullOrWhiteSpace(o.Notes))       parts.Add($"Advocate's additional instructions: {o.Notes}");
        return parts.Count == 0 ? "" : "\n\nADVOCATE'S FOCUS FOR THIS ASSESSMENT:\n- " + string.Join("\n- ", parts);
    }

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

    /// <summary>
    /// Urgent-situation triage against the live case record. Dedicated EmergencyTriage
    /// template returns strict {severity, headline, immediateActions[], draftResponse, …} JSON.
    /// Previously ran with Guid.Empty — no case context at all.
    /// </summary>
    public Task<string> EmergencyTriageAsync(Guid caseId, EmergencyRequestDto request, CancellationToken cancellationToken = default)
        => _pipeline.ExecuteAsync(caseId,
            $"EMERGENCY TRIAGE. The advocate reports this urgent situation: {request.Query}. " +
            "Assess it strictly per the system instructions against the case record and return only the contracted JSON.",
            "Emergency", null, cancellationToken);

    public Task<string> PrepHearingAsync(Guid caseId, CancellationToken cancellationToken = default)
        => _pipeline.ExecuteAsync(caseId,
            "Prepare today's hearing strategy brief strictly from the case context.",
            "HearingPrep", null, cancellationToken);

    public IAsyncEnumerable<string> StreamPrepHearingAsync(Guid caseId, CancellationToken cancellationToken = default)
        => _pipeline.StreamExecuteAsync(caseId,
            "Prepare today's complete hearing strategy brief. Use correct party terminology based on case type. You MUST populate ALL these JSON fields: caseSnapshot, currentProceduralStage, previousHearingOutcome, todaysObjective, keyArguments, anticipatedOpposingArguments, documentsToCarry, judgesLikelyQuestions, whatNotToSay, proceduralChecklist, openingStatement, riskFlags, immediateActionItems, nextStepsIfAdjourned, section65BAlert. Judge questions must be case-specific not generic. What Not To Say must name specific things to avoid at THIS hearing. Return strictly valid JSON only.",
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

    public IAsyncEnumerable<string> StreamDraftDocumentAsync(Guid caseId, DraftRequestDto request, CancellationToken cancellationToken = default)
    {
        var parameters = new Dictionary<string, object> { { "DocumentType", request.DraftType ?? "Document" } };
        return _pipeline.StreamExecuteAsync(caseId, request.Instructions ?? "Draft the document.", "LegalDraft", parameters, cancellationToken);
    }
    // ── STREAMING METHODS FOR ALL AI FEATURES ──────────────────
    public IAsyncEnumerable<string> StreamSummaryAsync(Guid caseId, CancellationToken cancellationToken = default)
        => _pipeline.StreamExecuteAsync(caseId, "Summarize this case comprehensively.", "Summarization", null, cancellationToken);

    public IAsyncEnumerable<string> StreamChronologyAsync(Guid caseId, CancellationToken cancellationToken = default)
        => _pipeline.StreamExecuteAsync(caseId, "Build a detailed chronological timeline of events.", "Chronology", null, cancellationToken);

    public IAsyncEnumerable<string> StreamContradictionsAsync(Guid caseId, CancellationToken cancellationToken = default)
        => _pipeline.StreamExecuteAsync(caseId, "Detect and analyze contradictions in evidence and statements.", "Contradiction", null, cancellationToken);

    public IAsyncEnumerable<string> StreamResearchAsync(Guid caseId, CancellationToken cancellationToken = default)
        => _pipeline.StreamExecuteAsync(caseId, "Conduct legal research for this case. Detect the case type and apply domain filter - only include cases from the same legal domain. For each case provide ratioDecidendi, exactProposition, howToUseInArgument, strongestDistinction and verifiedSource fields. Exclude duplicate citations. Return strictly valid JSON only.", "LegalResearch", null, cancellationToken);

    public IAsyncEnumerable<string> StreamActionPlanAsync(Guid caseId, CancellationToken cancellationToken = default)
        => _pipeline.StreamExecuteAsync(caseId, "Build the working action plan for this case. CURRENT YEAR IS 2026. Pull the real next hearing date from context. Detect case type first. For CRIMINAL cases: highest priority tasks are cross examination preparation, filing list of defence witnesses if directed by court, bail compliance, discharge application. NEVER include Written Statement as a task in criminal cases. For CIVIL cases: monitor Written Statement deadline, exhibit filing, affidavit of evidence. Distribute tasks across Advocate, Client and Clerk. Include consequence and dependsOn for every task. Return strictly valid JSON only.", "ActionPlan", null, cancellationToken);

    public IAsyncEnumerable<string> StreamFinancialAsync(Guid caseId, CancellationToken cancellationToken = default)
        => _pipeline.StreamExecuteAsync(caseId, "Analyze financial aspects and implications of this case.", "FinancialProfile", null, cancellationToken);

    public IAsyncEnumerable<string> StreamReadinessAsync(Guid caseId, CancellationToken cancellationToken = default)
        => _pipeline.StreamExecuteAsync(caseId, "Assess trial readiness comprehensively.", "Readiness", null, cancellationToken);

    public Task<string> GetClarifyingQuestionsAsync(Guid caseId, CancellationToken cancellationToken = default)
        => _pipeline.ExecuteAsync(caseId,
            "Analyze the case context and identify any critical gaps that would prevent accurate AI analysis. Detect the case type and ask only case-type specific questions. Return strictly valid JSON only.",
            "ClarifyingQuestions", null, cancellationToken);

    public IAsyncEnumerable<string> StreamRisksAsync(Guid caseId, CancellationToken cancellationToken = default)
        => _pipeline.StreamExecuteAsync(caseId, "Identify and analyze all risks in this case. Current year is 2026. Use correct terminology based on case type: civil suit = Plaintiff and Defendant, criminal = Accused and State/Prosecution, writ = Petitioner and Respondent. NEVER use client or contractor. Assess risks from the instructing advocate's client perspective only. Minimum 5 risks. All deadlines must use year 2026. Each mitigation must be specific with deadlines. Return strictly valid JSON only.", "RiskAssessment", null, cancellationToken);

    public IAsyncEnumerable<string> StreamRecommendationsAsync(Guid caseId, CancellationToken cancellationToken = default)
        => _pipeline.StreamExecuteAsync(caseId, "Generate strategic recommendations for this case. CURRENT YEAR IS 2026. Detect case type first. Civil suit = Plaintiff and Defendant. Criminal case = Accused and State - NEVER recommend filing Written Statement in criminal cases, instead recommend: discharge application, cross examination preparation, defence witness list, bail compliance. Check what court has already directed and prioritise those tasks. Order by urgency. Return strictly valid JSON only.", "Recommendation", null, cancellationToken);

    public IAsyncEnumerable<string> StreamWitnessAsync(Guid caseId, CancellationToken cancellationToken = default)
        => _pipeline.StreamExecuteAsync(caseId, "Prepare witness cross-examination and preparation strategy. Identify likely lies the witness will tell that are contradicted by documents. Generate the single most devastating closing question. Return strictly valid JSON only.", "WitnessPrep", null, cancellationToken);
}
