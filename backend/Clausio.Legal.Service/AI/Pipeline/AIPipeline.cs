using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using Clausio.Legal.Core.Interfaces.AI;
using Clausio.Legal.Core.Interfaces.AI.Drafting;
using Clausio.Legal.Core.Interfaces.AI.Evaluation;
using Clausio.Legal.Core.Interfaces.AI.Pipeline;
using Clausio.Legal.Core.Interfaces.AI.Validation;
using Clausio.Legal.Core.Interfaces.AI.Security;
using Clausio.Legal.Core.Interfaces.Memory;
using Clausio.Legal.Service.Security;
using Microsoft.Extensions.Logging;
using Clausio.Legal.Service;

namespace Clausio.Legal.Service.AI.Pipeline;

public class AIPipeline : IAIPipeline
{
    private readonly IContextEngine _contextEngine;
    private readonly IPromptBuilder _promptBuilder;
    private readonly IAIRouter _router;
    private readonly IDraftEngine _draftEngine;
    private readonly ICitationVerifier _citationVerifier;
    private readonly IAIEvaluator _evaluator;
    private readonly IAISecurityLayer _securityLayer;
    private readonly ITelemetryService _telemetryService;
    private readonly Clausio.MCP.Planners.WorkflowPlanner _workflowPlanner;
    private readonly Clausio.MCP.Planners.CapabilityPlanner _capabilityPlanner;
    private readonly Clausio.MCP.Registry.AiCapabilityRegistry _capabilityRegistry;
    private readonly IPiiTokenService _piiTokenService;
    private readonly ILogger<AIPipeline> _logger;
    private readonly JudgmentSearchService _judgmentSearch;
    private readonly IPromptReferenceContext _promptReference;

    public AIPipeline(
        IContextEngine contextEngine,
        IPromptBuilder promptBuilder,
        IAIRouter router,
        IDraftEngine draftEngine,
        ICitationVerifier citationVerifier,
        IAIEvaluator evaluator,
        IAISecurityLayer securityLayer,
        ITelemetryService telemetryService,
        Clausio.MCP.Planners.WorkflowPlanner workflowPlanner,
        Clausio.MCP.Planners.CapabilityPlanner capabilityPlanner,
        Clausio.MCP.Registry.AiCapabilityRegistry capabilityRegistry,
        IPiiTokenService piiTokenService,
        ILogger<AIPipeline> logger,
        JudgmentSearchService judgmentSearch,
        IPromptReferenceContext promptReference)
    {
        _contextEngine = contextEngine;
        _promptBuilder = promptBuilder;
        _router = router;
        _draftEngine = draftEngine;
        _citationVerifier = citationVerifier;
        _evaluator = evaluator;
        _securityLayer = securityLayer;
        _telemetryService = telemetryService;
        _workflowPlanner = workflowPlanner;
        _capabilityPlanner = capabilityPlanner;
        _capabilityRegistry = capabilityRegistry;
        _piiTokenService = piiTokenService;
        _logger = logger;
        _judgmentSearch = judgmentSearch;
        _promptReference = promptReference;
    }

    public async Task<string> ExecuteAsync(Guid caseId, string userInput, string taskType, Dictionary<string, object>? parameters = null, CancellationToken cancellationToken = default)
    {
        var sw = Stopwatch.StartNew();
        var context = new AIPipelineContext();

        // === STEP 1: Intent Classification ===
        context.Intent = taskType;
        context.Complexity = ClassifyComplexity(taskType, userInput);
        _logger.LogInformation("[Pipeline] Starting. Intent={Intent}, Complexity={Complexity}, CaseId={CaseId}", context.Intent, context.Complexity, caseId);

        // === STEP 1.5: Security Layer ===
        var securityResult = await _securityLayer.AssessAndSanitizeAsync(userInput, cancellationToken);
        if (securityResult.IsBlocked)
        {
            _logger.LogWarning("[Pipeline] Security Blocked. CaseId={CaseId}, Reason={Reason}", caseId, securityResult.FlagReason);
            return $"[SECURITY ALERT] Request was blocked by the AI Security Layer. Reason: {securityResult.FlagReason}";
        }
        userInput = securityResult.SanitizedInput;

        // === STEP 1.8: Workflow & Capability Planning (MCP) ===
        var workflow = _workflowPlanner.PlanWorkflow(userInput);
        var modelCap = _capabilityRegistry.GetCapability("nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free");
        var availableSkills = _capabilityPlanner.SelectSkillsForWorkflow(workflow, modelCap);
        _logger.LogInformation("[Pipeline] Workflow={Workflow}, ModelToolCalling={ToolCalling}, SelectedSkills={Skills}", workflow, modelCap.ToolCalling, string.Join(", ", availableSkills.Select(s => s.Name)));

        // === STEP 2: Context Engine (Memory + Retrieval) ===
        var contextXml = await BuildContextAsync(caseId, taskType, userInput, parameters, cancellationToken);

        // === STEP 2.5: PII Tokenization (DPDP / Zero-PII to LLM) ===
        var tokenizedContextXml = await _piiTokenService.TokenizeAsync(contextXml, caseId, cancellationToken);
        var tokenizedUserInput = await _piiTokenService.TokenizeAsync(userInput, caseId, cancellationToken);

        // === STEP 2.8: RAG — Search 136K SC Judgments ===
        // These tasks must be grounded ONLY in the uploaded case record — injecting
        // outside SC judgments makes the model fold precedent facts (dates, parties,
        // holdings) into a case timeline / brief / evidence review. No precedent RAG.
        var ragDisabledTasks = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Chronology", "Timeline", "Summarization", "Evidence", "FinancialProfile", "Readiness"
        };
        var ragEnabled = !ragDisabledTasks.Contains(taskType);

        var ragTopK = taskType == "LegalResearch" ? 4 : 2; // Precedent work needs more corpus than chat/analysis
        string ragQuery;
        string? caseCategory = null;
        if (taskType == "LegalResearch")
        {
            // Keyword retrieval must run on the case's own substance — every non-tag
            // line of the built context. The memory summary alone is often too thin
            // (sometimes just the title echoed back) to extract legal terms from.
            var substance = string.Join("\n", contextXml.Split('\n')
                .Where(line => !line.TrimStart().StartsWith("<"))
                .Select(line => line.Trim()));
            ragQuery = substance.Length > 4000 ? substance[..4000] : substance;

            // Map the case type onto the judgment corpus's own category labels so the
            // topical backfill can rescue thin keyword sets with relevant material
            var typeLine = contextXml.Split('\n')
                .FirstOrDefault(l => l.TrimStart().StartsWith("Type:"))?.Trim() ?? "";
            caseCategory = MapToCorpusCategory(typeLine);
        }
        else
        {
            ragQuery = userInput;
            if (taskType == "LegalDraft") ragTopK = 5;
            if (taskType == "LegalDraft")
            {
                var draftDocType = parameters != null && parameters.ContainsKey("DocumentType")
                    ? parameters["DocumentType"]?.ToString() ?? ""
                    : "";

                ragQuery = draftDocType switch
                {
                    "Bail Application (Sessions Court)"
                        => "bail sessions court triple test flight risk tampering personal liberty Article 21",
                    "Bail Application (High Court)"
                        => "bail high court section 439 personal liberty prolonged custody Article 21",
                    "Anticipatory Bail"
                        => "anticipatory bail section 438 apprehension arrest Gurbaksh Singh Sibbia",
                    "Bail (NDPS Act)"
                        => "bail NDPS section 37 twin conditions commercial quantity narcotic drugs",
                    "Criminal Appeal"
                        => "criminal appeal conviction acquittal reappreciation evidence reasonable doubt",
                    "Quashing Petition"
                        => "quashing FIR article 226 section 482 abuse process Bhajan Lal categories",
                    "Discharge Application"
                        => "discharge framing charges prima facie case L Muniswamy sessions court",
                    "Criminal Revision"
                        => "criminal revision jurisdictional error interlocutory order section 397 401",
                    "Divorce Petition (Section 13 HMA)"
                        => "divorce cruelty section 13 HMA irretrievable breakdown mental cruelty Samar Ghosh",
                    "Mutual Consent Divorce (Section 13B)"
                        => "mutual consent divorce section 13B cooling period settlement terms",
                    "Maintenance (Section 24 HMA)"
                        => "maintenance section 24 HMA Rajnesh Neha interim maintenance pendente lite husband income",
                    "Child Custody Application"
                        => "child custody welfare paramount Nil Ratan Kundu minor guardianship",
                    "Domestic Violence Application (PWDVA)"
                        => "domestic violence PWDVA protection order residence order monetary relief section 18 19 20",
                    "Restitution of Conjugal Rights"
                        => "restitution conjugal rights section 9 HMA reasonable excuse withdrawal society",
                    "Permanent Alimony (Section 25 HMA)"
                        => "permanent alimony section 25 HMA gross sum monthly payment income assets",
                    "Civil Plaint / Suit"
                        => "civil suit plaint cause of action limitation jurisdiction CPC Order 7",
                    "Written Statement"
                        => "written statement preliminary objections denial Order VIII CPC para-wise reply",
                    "Interim Injunction Application"
                        => "injunction prima facie balance of convenience irreparable injury Dalpat Kumar",
                    "Stay Application"
                        => "stay decree Order 41 Rule 5 balance of convenience appeal pending",
                    "Civil Appeal"
                        => "civil appeal reappreciation evidence first appellate court decree Section 96 CPC",
                    "Execution Petition"
                        => "execution decree Order 21 CPC attachment judgment debtor property",
                    "Contempt Petition"
                        => "contempt court wilful disobedience order Punj Lloyd civil contempt",
                    "Specific Performance Suit"
                        => "specific performance agreement to sell readiness willingness 2018 amendment right",
                    "Declaratory Suit"
                        => "declaratory suit section 34 Specific Relief Act legal character title",
                    "Partition Suit"
                        => "partition suit Hindu Undivided Family coparcenary share property division",
                    "Cheque Bounce Complaint (Section 138)"
                        => "cheque bounce section 138 NI Act dishonour demand notice limitation 30 days",
                    "NI Act Legal Notice (15-day)"
                        => "cheque bounce notice 15 days section 138 proviso demand payment RPAD",
                    "Consumer Complaint"
                        => "consumer complaint deficiency service unfair trade practice compensation forum",
                    "Consumer Complaint Reply"
                        => "consumer complaint reply opposite party maintainability jurisdiction limitation",
                    "GST Appeal"
                        => "GST appeal appellate authority section 107 CGST pre-deposit demand order",
                    "GST Show Cause Notice Reply"
                        => "GST show cause notice section 73 74 CGST natural justice reply fraud suppression",
                    "GST Writ Petition (Article 226)"
                        => "GST writ petition Article 226 jurisdiction natural justice unreasonable demand",
                    "Income Tax Appeal (CIT(A) / ITAT)"
                        => "income tax appeal CIT ITAT section 246A 253 assessment addition penalty",
                    "RERA Complaint"
                        => "RERA complaint builder delay possession section 18 interest compensation defect",
                    "Eviction Suit"
                        => "eviction suit tenancy rent arrears Transfer of Property Act landlord tenant",
                    "Arbitration Section 9 (Interim Relief)"
                        => "arbitration section 9 interim relief injunction before award Arcel India",
                    "Arbitration Section 34 (Set Aside Award)"
                        => "arbitration section 34 set aside award patent illegality public policy Associated Builders",
                    "NCLT Petition (IBC Section 9)"
                        => "NCLT insolvency section 9 IBC operational creditor demand notice default CIRP",
                    "Succession Certificate"
                        => "succession certificate Indian Succession Act debts securities movable",
                    "Writ Petition (Article 226)"
                        => "writ petition Article 226 fundamental rights mandamus certiorari prohibition",
                    "Legal Notice"
                        => "legal notice demand payment breach contract pre-litigation",
                    "Affidavit"
                        => "affidavit sworn statement deponent verification court",
                    "Agreement / Contract"
                        => "agreement contract breach damages specific performance terms",
                    "Legal Opinion"
                        => "legal opinion advice statutory interpretation legal position",
                    "Notice / Show Cause Notice"
                        => "show cause notice natural justice opportunity heard reply",
                    _ => string.IsNullOrEmpty(draftDocType)
                        ? userInput
                        : $"{draftDocType} judgment precedent Indian court"
                };

                caseCategory = draftDocType switch
                {
                    var d when d.Contains("Bail") || d.Contains("Criminal") ||
                               d.Contains("Quashing") || d.Contains("Discharge") ||
                               d.Contains("Anticipatory") || d.Contains("NDPS")
                        => "Criminal",
                    var d when d.Contains("Divorce") || d.Contains("Maintenance") ||
                               d.Contains("Custody") || d.Contains("Domestic Violence") ||
                               d.Contains("Conjugal") || d.Contains("Alimony") ||
                               d.Contains("HMA") || d.Contains("PWDVA")
                        => "Family",
                    var d when d.Contains("GST") || d.Contains("Income Tax")
                        => "Tax",
                    var d when d.Contains("Consumer")
                        => "Consumer",
                    var d when d.Contains("NI Act") || d.Contains("Cheque")
                        => "NI Act",
                    var d when d.Contains("Writ") || d.Contains("Article 226") ||
                               d.Contains("Constitutional")
                        => "Constitutional",
                    var d when d.Contains("RERA") || d.Contains("Eviction") ||
                               d.Contains("Civil") || d.Contains("Injunction") ||
                               d.Contains("Execution") || d.Contains("Contempt") ||
                               d.Contains("Partition") || d.Contains("Declaratory") ||
                               d.Contains("Specific Performance") || d.Contains("Stay") ||
                               d.Contains("Written Statement")
                        => "Property",
                    _ => (string?)null
                };
            }
        }
        var judgmentChunks = ragEnabled
            ? await _judgmentSearch.SearchAsync(ragQuery, ragTopK, caseCategory, cancellationToken)
            : new List<string>();
        if (!ragEnabled)
            _logger.LogInformation("[Pipeline] RAG skipped for case-record-only task {Task}", taskType);
        var judgmentContext = "";
        if (judgmentChunks.Any())
        {
            // Precedent work needs the body of each judgment (holdings sit past the header
            // boilerplate); sized so system prompt stays under the LLM provider's TPM ceiling
            var chunkWords = taskType == "LegalResearch" ? 250 : 180;
            var judgmentHeader = taskType == "LegalDraft"
                ? $"\n\n=== VERIFIED PRECEDENTS FROM eCOURTS DATABASE ===\nSource: eCourts, Government of India (ecourts.gov.in)\nDocument Type: {(parameters != null && parameters.ContainsKey("DocumentType") ? parameters["DocumentType"]?.ToString() : "Legal Draft")}\nUse ONLY these citations. Never invent any citation.\n"
                : "\n\n=== RELEVANT SUPREME COURT JUDGMENTS (Verified) ===\n";
            judgmentContext = judgmentHeader +
                string.Join("\n---\n", judgmentChunks.Select(c => string.Join(" ", c.Split(" ").Take(chunkWords)))) +
                "\n=== END OF JUDGMENTS ===";
            _logger.LogInformation("[Pipeline] RAG found {Count} judgment chunks", judgmentChunks.Count);
            foreach (var c in judgmentChunks)
                _logger.LogInformation("[Pipeline] RAG chunk: {Head}", c.Length > 160 ? c[..160] : c);
        }
        else
        {
            _logger.LogInformation("[Pipeline] RAG found no judgments — using direct AI");
        }

        // Research prompts must fit the LLM provider's TPM ceiling: cap the case-file
        // portion so the widened judgment excerpts stay inside the budget
        var caseContext = taskType == "LegalResearch" && tokenizedContextXml.Length > 8000
            ? tokenizedContextXml[..8000]
            : tokenizedContextXml;
        var enrichedContext = caseContext + judgmentContext;

        // === STEP 2.9: Style reference (lawyer's own firm document) ===
        context.ReferenceDocText = GetReferenceDocText(parameters);
        if (!string.IsNullOrWhiteSpace(context.ReferenceDocText))
        {
            enrichedContext += BuildReferenceBlock(context.ReferenceDocText);
            _logger.LogInformation("[Pipeline] Style reference injected ({Chars} chars used)",
                Math.Min(3000, context.ReferenceDocText.Length));
        }

        context.CaseMemoryXml = enrichedContext;
        _logger.LogInformation("[Pipeline] Context assembled and PII tokenized. Size={Chars} chars", context.CaseMemoryXml.Length);

        // === STEP 3: Prompt Builder ===
        var templateName = ResolveTemplate(taskType, parameters);
        var promptVersion = _promptBuilder.GetTemplateVersion(templateName);
        var variables = new Dictionary<string, string> { { "CONTEXT", context.CaseMemoryXml } };
        context.SystemPrompt = _promptBuilder.BuildSystemPrompt(templateName, variables);
        context.FinalUserPrompt = tokenizedUserInput;
        _logger.LogInformation("[Pipeline] Prompt built. Template={Template} v{Version}", templateName, promptVersion);

        // === STEP 4: AI Router / Draft Engine ===
        string response;
        if (taskType == "LegalDraft")
        {
            var docType = parameters != null && parameters.ContainsKey("DocumentType") ? parameters["DocumentType"]?.ToString() ?? "Document" : "Document";
            response = await _draftEngine.DraftDocumentAsync(caseId, docType, context.FinalUserPrompt, context.CaseMemoryXml, cancellationToken);
        }
        else
        {
            context.ModelUsed = context.Complexity == "High" ? "DEEP" : "FAST";
            // Reasoning models (gpt-oss-120b et al.) routinely need 30-60s for a full
            // structured extraction (chronology, summary, evidence). 25s was cutting those
            // off mid-generation and returning an unparseable error string to the UI.
            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutCts.CancelAfter(TimeSpan.FromSeconds(90));
            try {
                response = await _router.CompleteAsync(context.SystemPrompt, context.FinalUserPrompt, taskType, timeoutCts.Token);
            } catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested) {
                response = "The AI took too long to respond. Please try again with a shorter query.";
            }
        }

        // === STEP 4.5: Strip model reasoning blocks (qwen emits <think>…</think>) ===
        response = StripReasoningBlocks(response);

        // === STEP 5: Citation Verification ===
        // Citation verification runs async — does not block the response
        var responseForReturn = response;
        _ = Task.Run(async () => {
            try { 
                await _citationVerifier.VerifyCitationsAsync(responseForReturn, cancellationToken);
            } catch { }
        });

        // === STEP 5.5: PII Detokenization (Restores real names for Lawyer) ===
        response = await _piiTokenService.DetokenizeAsync(response, caseId, cancellationToken);

        sw.Stop();
        var elapsedMs = sw.ElapsedMilliseconds;
        
        // === STEP 6: Telemetry & Evaluation ===
        // Fire and forget evaluation so we don't block the response to the user
        _ = Task.Run(async () =>
        {
            try
            {
                var evalResult = await _evaluator.EvaluateResponseAsync(context.SystemPrompt, context.FinalUserPrompt, response, elapsedMs);
                var log = new Clausio.Legal.Core.Entities.AI.AiTelemetryLog
                {
                    CaseId = caseId,
                    Intent = context.Intent,
                    PromptName = templateName,
                    Provider = "OpenRouter", // Default or fetch from router
                    Model = context.ModelUsed,
                    RouterDecision = context.Complexity,
                    LatencyMs = elapsedMs,
                    TokensIn = context.SystemPrompt.Length / 4 + context.FinalUserPrompt.Length / 4,
                    TokensOut = response.Length / 4,
                    RetrievalScore = evalResult.RetrievalQualityScore,
                    CitationConfidenceScore = evalResult.CitationConfidenceScore,
                    DraftScore = evalResult.DraftQualityScore,
                    HallucinationRiskScore = evalResult.HallucinationRiskScore,
                    TokenEfficiencyScore = evalResult.TokenEfficiencyScore,
                    IsSuccess = true
                };
                await _telemetryService.LogInteractionAsync(log, default);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[AIPipeline] Evaluation failed.");
            }
        });

        _logger.LogInformation("[Pipeline] Completed. TotalMs={Ms}, Intent={Intent}", elapsedMs, context.Intent);

        return response;
    }

    public async IAsyncEnumerable<string> StreamExecuteAsync(Guid caseId, string userInput, string taskType, Dictionary<string, object>? parameters = null, [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var sw = Stopwatch.StartNew();
        _logger.LogInformation("[Pipeline:Stream] Starting. Intent={Intent}, CaseId={CaseId}", taskType, caseId);

        // === Progress: Phase 1 ===
        yield return FormatProgressChunk("Understanding request...");

        // === STEP 1: Intent Classification ===
        var complexity = ClassifyComplexity(taskType, userInput);

        // === STEP 1.5: Security Layer ===
        var securityResult = await _securityLayer.AssessAndSanitizeAsync(userInput, cancellationToken);
        if (securityResult.IsBlocked)
        {
            _logger.LogWarning("[Pipeline:Stream] Security Blocked. CaseId={CaseId}, Reason={Reason}", caseId, securityResult.FlagReason);
            yield return $"[SECURITY ALERT] Request blocked: {securityResult.FlagReason}";
            yield break;
        }
        userInput = securityResult.SanitizedInput;

        // === Progress: Phase 2 ===
        yield return FormatProgressChunk("Loading case memory...");

        // === STEP 2: Context Engine ===
        var contextXml = await BuildContextAsync(caseId, taskType, userInput, parameters, cancellationToken);
        var streamRef = GetReferenceDocText(parameters);
        if (!string.IsNullOrWhiteSpace(streamRef))
            contextXml += BuildReferenceBlock(streamRef);
        _logger.LogInformation("[Pipeline:Stream] Context assembled. Size={Chars} chars", contextXml.Length);

        // === Progress: Phase 3 ===
        yield return FormatProgressChunk("Retrieving legal evidence...");
        await Task.Delay(50, cancellationToken); // Simulate retrieval step display

        // === STEP 3: Prompt Builder ===
        var templateName = ResolveTemplate(taskType, parameters);
        var variables = new Dictionary<string, string> { { "CONTEXT", contextXml } };
        var systemPrompt = _promptBuilder.BuildSystemPrompt(templateName, variables);
        _logger.LogInformation("[Pipeline:Stream] Prompt built. Template={Template}", templateName);

        // === Progress: Phase 4 ===
        if (taskType == "LegalDraft")
            yield return FormatProgressChunk("Drafting document...");
        else
            yield return FormatProgressChunk("Generating response...");

        // === STEP 4: Stream from AI Router ===
        var responseSb = new System.Text.StringBuilder();
        await foreach (var chunk in _router.StreamCompleteAsync(systemPrompt, userInput, taskType, cancellationToken))
        {
            if (!chunk.StartsWith("[sys]"))
            {
                responseSb.Append(chunk);
            }
            yield return chunk;
        }

        sw.Stop();
        var elapsedMs = sw.ElapsedMilliseconds;
        var fullResponse = responseSb.ToString();

        _ = Task.Run(async () =>
        {
            try
            {
                var evalResult = await _evaluator.EvaluateResponseAsync(systemPrompt, userInput, fullResponse, elapsedMs);
                var log = new Clausio.Legal.Core.Entities.AI.AiTelemetryLog
                {
                    CaseId = caseId,
                    Intent = taskType,
                    PromptName = templateName,
                    Provider = "NVIDIA NIM",
                    Model = "meta/llama-3.1-8b-instruct",
                    RouterDecision = complexity,
                    LatencyMs = elapsedMs,
                    TokensIn = systemPrompt.Length / 4 + userInput.Length / 4,
                    TokensOut = Math.Max(1, fullResponse.Length / 4),
                    RetrievalScore = evalResult.RetrievalQualityScore,
                    CitationConfidenceScore = evalResult.CitationConfidenceScore,
                    DraftScore = evalResult.DraftQualityScore,
                    HallucinationRiskScore = evalResult.HallucinationRiskScore,
                    TokenEfficiencyScore = evalResult.TokenEfficiencyScore,
                    IsSuccess = true
                };
                await _telemetryService.LogInteractionAsync(log, default);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[AIPipeline:Stream] Telemetry logging failed.");
            }
        });

        _logger.LogInformation("[Pipeline:Stream] Completed. TotalMs={Ms}", elapsedMs);
    }

    // ===================== Helpers =====================

    /// <summary>
    /// Reasoning models (qwen3.x) prepend a &lt;think&gt;…&lt;/think&gt; deliberation block.
    /// Strip closed blocks; an UNCLOSED block means the model burned its whole completion
    /// budget thinking and produced nothing usable — return empty so callers fail cleanly.
    /// </summary>
    private static string StripReasoningBlocks(string response)
    {
        if (string.IsNullOrWhiteSpace(response)) return response;

        var closeIdx = response.LastIndexOf("</think>", StringComparison.OrdinalIgnoreCase);
        if (closeIdx >= 0)
            return response[(closeIdx + "</think>".Length)..].TrimStart();

        if (response.IndexOf("<think>", StringComparison.OrdinalIgnoreCase) >= 0)
            return string.Empty; // truncated mid-thought — no usable content followed

        return response;
    }

    /// <summary>
    /// Map a free-form case type ("Family Law", "Criminal Appeal — 482 CrPC") onto the
    /// judgment corpus's CaseType labels, so category backfill can find topical chunks.
    /// </summary>
    private static string? MapToCorpusCategory(string typeLine)
    {
        var t = typeLine.ToLowerInvariant();
        if (t.Contains("family") || t.Contains("matrimonial") || t.Contains("divorce") || t.Contains("custody")) return "Family";
        if (t.Contains("criminal")) return "Criminal";
        if (t.Contains("property") || t.Contains("civil")) return "Property";
        if (t.Contains("constitution") || t.Contains("writ")) return "Constitutional";
        if (t.Contains("tax") || t.Contains("gst")) return "Tax";
        if (t.Contains("ni act") || t.Contains("negotiable") || t.Contains("cheque")) return "NI Act";
        if (t.Contains("labour")) return "Labour";
        if (t.Contains("consumer")) return "Consumer";
        return null;
    }

    /// <summary>
    /// The lawyer's style-reference text: explicit parameters["ReferenceDocText"] wins,
    /// otherwise the request-scoped value the API filter resolved from "?referenceDocId=".
    /// </summary>
    private string? GetReferenceDocText(Dictionary<string, object>? parameters)
    {
        if (parameters != null && parameters.TryGetValue("ReferenceDocText", out var v) && v is string s && !string.IsNullOrWhiteSpace(s))
            return s;
        return _promptReference.Text;
    }

    /// <summary>
    /// Instruction + the first 3000 chars of the lawyer's own firm document, appended to
    /// the AI context so generated output copies their structure, prayer format and language.
    /// </summary>
    private static string BuildReferenceBlock(string referenceText)
    {
        var excerpt = referenceText.Length > 3000 ? referenceText[..3000] : referenceText;
        return "\n\n=== STYLE REFERENCE DOCUMENT ===\n" +
               "The lawyer has provided their own firm's document as a style reference. You MUST follow this " +
               "exact style, structure, format, language, paragraph numbering and prayer format when generating output.\n\n" +
               "ANALYSE this reference document carefully:\n" +
               "→ How are paragraphs numbered?\n" +
               "→ What language style is used?\n" +
               "→ How is the prayer section written?\n" +
               "→ What headings and sub-headings are used?\n" +
               "→ What is the tone — formal, simple, detailed?\n\n" +
               "REFERENCE DOCUMENT:\n" + excerpt +
               "\n=== END OF REFERENCE DOCUMENT ===\n\n" +
               "Now generate the output in EXACTLY the same style as the reference document above.";
    }

    private async Task<string> BuildContextAsync(Guid caseId, string taskType, string userInput, Dictionary<string, object>? parameters, CancellationToken cancellationToken)
    {
        if (taskType == "LegalDraft")
        {
            var docType = parameters != null && parameters.ContainsKey("DocumentType") ? parameters["DocumentType"]?.ToString() : "Document";
            return await _contextEngine.BuildDraftingContextAsync(caseId, docType ?? "Document", userInput, cancellationToken);
        }
        else if (taskType == "FinancialProfile")
        {
            return await _contextEngine.BuildFinancialContextAsync(caseId, cancellationToken);
        }
        else if (taskType == "Analysis" || taskType == "Summarization" || taskType == "ActionPlan" || taskType == "RiskAssessment" || taskType == "Recommendation" || taskType == "LegalResearch" || taskType == "Contradiction" || taskType == "Chronology" || taskType == "Timeline" || taskType == "Evidence" || taskType == "Readiness" || taskType == "Emergency" || taskType == "SimilarCaseFinder" || taskType == "JudgmentComparison" || taskType == "JudgmentApplicability")
        {
            return await _contextEngine.BuildAnalysisContextAsync(caseId, taskType, cancellationToken);
        }
        else
        {
            return await _contextEngine.BuildChatContextAsync(caseId, userInput, cancellationToken);
        }
    }

    private static string ClassifyComplexity(string taskType, string userInput)
    {
        int score = 0;
        var lowerTask = taskType.ToLowerInvariant();
        if (lowerTask.Contains("draft") || lowerTask.Contains("research") || lowerTask.Contains("actionplan") || lowerTask.Contains("contradiction")) score += 50;
        else if (lowerTask.Contains("analysis") || lowerTask.Contains("summarization") || lowerTask.Contains("hearingprep") || lowerTask.Contains("witnessprep") || lowerTask.Contains("riskassessment") || lowerTask.Contains("recommendation") || lowerTask.Contains("chronology") || lowerTask.Contains("evidence") || lowerTask.Contains("readiness") || lowerTask.Contains("emergency") || lowerTask.Contains("financialprofile")) score += 30;

        if (userInput.Length > 2500) score += 35;
        else if (userInput.Length > 800) score += 15;

        var keywords = new[] { "supreme court", "high court", "section", "article", "ipc", "crpc", "cpc", "statute", "precedent", "ratio decidendi" };
        var lowerInput = userInput.ToLowerInvariant();
        foreach (var kw in keywords)
        {
            if (lowerInput.Contains(kw)) score += 5;
        }

        if (score >= 60) return "High";
        if (score >= 30) return "Medium";
        return "Low";
    }

    private static string ResolveTemplate(string taskType, Dictionary<string, object>? parameters)
    {
        if (taskType == "LegalDraft")
        {
            var docType = parameters != null && parameters.ContainsKey("DocumentType") ? parameters["DocumentType"]?.ToString() : null;
            return docType switch
            {
                "Bail Application (Sessions Court)"
                    => "Drafts/criminal_bail_sessions",
                "Bail Application (High Court)"
                    => "Drafts/criminal_bail_highcourt",
                "Anticipatory Bail"
                    => "Drafts/anticipatory_bail",
                "Bail (NDPS Act)"
                    => "Drafts/bail_ndps",
                "Criminal Appeal"
                    => "Drafts/criminal_appeal",
                "Quashing Petition"
                    => "Drafts/quashing_petition",
                "Discharge Application"
                    => "Drafts/discharge_application",
                "Criminal Revision"
                    => "Drafts/criminal_revision",
                "Divorce Petition (Section 13 HMA)"
                    => "Drafts/family_divorce_petition",
                "Mutual Consent Divorce (Section 13B)"
                    => "Drafts/mutual_consent_divorce",
                "Maintenance (Section 24 HMA)"
                    => "Drafts/family_maintenance_s24",
                "Child Custody Application"
                    => "Drafts/child_custody",
                "Domestic Violence Application (PWDVA)"
                    => "Drafts/domestic_violence",
                "Restitution of Conjugal Rights"
                    => "Drafts/restitution_conjugal_rights",
                "Permanent Alimony (Section 25 HMA)"
                    => "Drafts/permanent_alimony",
                "Civil Plaint / Suit"
                    => "Drafts/civil_plaint",
                "Written Statement"
                    => "Drafts/written_statement",
                "Interim Injunction Application"
                    => "Drafts/interim_injunction",
                "Stay Application"
                    => "Drafts/stay_application",
                "Civil Appeal"
                    => "Drafts/civil_appeal",
                "Execution Petition"
                    => "Drafts/execution_petition",
                "Contempt Petition"
                    => "Drafts/contempt_petition",
                "Specific Performance Suit"
                    => "Drafts/specific_performance",
                "Declaratory Suit"
                    => "Drafts/declaratory_suit",
                "Partition Suit"
                    => "Drafts/partition_suit",
                "Cheque Bounce Complaint (Section 138)"
                    => "Drafts/ni_act_complaint",
                "NI Act Legal Notice (15-day)"
                    => "Drafts/ni_act_legal_notice",
                "Consumer Complaint"
                    => "Drafts/consumer_complaint",
                "Consumer Complaint Reply"
                    => "Drafts/consumer_reply",
                "GST Appeal"
                    => "Drafts/gst_appeal",
                "GST Show Cause Notice Reply"
                    => "Drafts/gst_scn_reply",
                "GST Writ Petition (Article 226)"
                    => "Drafts/gst_writ",
                "Income Tax Appeal (CIT(A) / ITAT)"
                    => "Drafts/income_tax_appeal",
                "RERA Complaint"
                    => "Drafts/rera_complaint",
                "Eviction Suit"
                    => "Drafts/eviction_suit",
                "Arbitration Section 9 (Interim Relief)"
                    => "Drafts/arbitration_s9",
                "Arbitration Section 34 (Set Aside Award)"
                    => "Drafts/arbitration_s34",
                "NCLT Petition (IBC Section 9)"
                    => "Drafts/nclt_petition_ibc",
                "Succession Certificate"
                    => "Drafts/succession_certificate",
                "Writ Petition (Article 226)"
                    => "Drafts/writ_petition",
                "Legal Notice"
                    => "Drafts/legal_notice",
                "Affidavit"
                    => "Drafts/affidavit",
                "Agreement / Contract"
                    => "Drafts/agreement",
                "Legal Opinion"
                    => "Drafts/legal_opinion",
                "Notice / Show Cause Notice"
                    => "Drafts/notice",
                _ => "LegalDraft"
            };
        }

        if (taskType == "Chronology" || taskType == "Timeline")
        {
            return "Chronology"; // top-level Chronology_v1.json (there is no Analysis/ variant)
        }

        if (taskType == "Analysis")
        {
            return "Analysis/LegalReasoning";
        }

        if (taskType == "RiskAssessment")
        {
            return "RiskAssessment"; // Dedicated Strategy-tab risk template (distinct from Analysis/RiskAssessment, which serves ActionPlan)
        }

        if (taskType == "Recommendation")
        {
            return "Recommendation"; // Dedicated Strategy-tab recommendations template
        }

        if (taskType == "LegalResearch")
        {
            return "LegalResearch"; // Dedicated Strategy-tab precedent-retrieval template
        }

        if (taskType == "Contradiction")
        {
            return "ContradictionAnalysis"; // Dedicated Strategy-tab contradiction template (was Analysis/LegalReasoning)
        }

        if (taskType == "SimilarCaseFinder")
        {
            return "SimilarCaseFinder"; // Judgment Analysis — Similar Case Finder enrichment
        }

        if (taskType == "JudgmentComparison")
        {
            return "JudgmentComparison"; // Judgment Analysis — side-by-side comparison
        }

        if (taskType == "JudgmentApplicability")
        {
            return "JudgmentApplicability"; // Judgment Analysis — applicability / how-to-use report
        }

        if (taskType == "HearingPrep")
        {
            return "HearingPrep";
        }

        if (taskType == "WitnessPrep")
        {
            return "WitnessPrep";
        }

        if (taskType == "ActionPlan")
        {
            return "ActionPlan"; // Dedicated working-plan template (was Analysis/RiskAssessment)
        }

        if (taskType == "Summarization")
        {
            return "Summary"; // Dedicated Analysis-page sectioned-brief template (was generic Analysis prose)
        }

        if (taskType == "Evidence")
        {
            return "EvidenceIntelligence"; // Dedicated Analysis-page evidence-review template (was per-document Analysis/LegalReasoning)
        }

        if (taskType == "Readiness")
        {
            return "ReadinessAssessment"; // Dedicated case-type-tailored readiness template (was Analysis/LegalReasoning generic prose)
        }

        if (taskType == "Emergency")
        {
            return "EmergencyTriage"; // Dedicated emergency-triage template (was generic ActionPlan)
        }

        if (taskType == "FinancialProfile")
        {
            return "FinancialProfile"; // Dedicated document-grounded financial-extraction template (was generic Analysis prose)
        }

        return "GeneralChat";
    }

    /// <summary>
    /// Format a progress chunk so the frontend can distinguish it from LLM content.
    /// Prefix: "[sys]" — frontend should render these as status messages, not as answer text.
    /// </summary>
    private static string FormatProgressChunk(string message)
        => $"[sys]{message}";
}
