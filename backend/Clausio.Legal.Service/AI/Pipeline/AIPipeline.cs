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
        JudgmentSearchService judgmentSearch)
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
        }
        var judgmentChunks = await _judgmentSearch.SearchAsync(ragQuery, ragTopK, caseCategory, cancellationToken);
        var judgmentContext = "";
        if (judgmentChunks.Any())
        {
            // Precedent work needs the body of each judgment (holdings sit past the header
            // boilerplate); sized so system prompt stays under the LLM provider's TPM ceiling
            var chunkWords = taskType == "LegalResearch" ? 350 : 300;
            judgmentContext = "\n\n=== RELEVANT SUPREME COURT JUDGMENTS (Verified) ===\n" +
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
            response = await _router.CompleteAsync(context.SystemPrompt, context.FinalUserPrompt, taskType, cancellationToken);
        }

        // === STEP 4.5: Strip model reasoning blocks (qwen emits <think>…</think>) ===
        response = StripReasoningBlocks(response);

        // === STEP 5: Citation Verification ===
        response = await _citationVerifier.VerifyCitationsAsync(response, cancellationToken);

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
        await foreach (var chunk in _router.StreamCompleteAsync(systemPrompt, userInput, taskType, cancellationToken))
        {
            yield return chunk;
        }

        sw.Stop();
        _logger.LogInformation("[Pipeline:Stream] Completed. TotalMs={Ms}", sw.ElapsedMilliseconds);
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

    private async Task<string> BuildContextAsync(Guid caseId, string taskType, string userInput, Dictionary<string, object>? parameters, CancellationToken cancellationToken)
    {
        if (taskType == "LegalDraft")
        {
            var docType = parameters != null && parameters.ContainsKey("DocumentType") ? parameters["DocumentType"]?.ToString() : "Document";
            return await _contextEngine.BuildDraftingContextAsync(caseId, docType ?? "Document", userInput, cancellationToken);
        }
        else if (taskType == "Analysis" || taskType == "Summarization" || taskType == "ActionPlan" || taskType == "RiskAssessment" || taskType == "Recommendation" || taskType == "LegalResearch" || taskType == "Contradiction")
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
        else if (lowerTask.Contains("analysis") || lowerTask.Contains("summarization") || lowerTask.Contains("hearingprep") || lowerTask.Contains("witnessprep") || lowerTask.Contains("riskassessment") || lowerTask.Contains("recommendation")) score += 30;

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
                "Legal Notice" => "Drafts/LegalNotice",
                "Consumer Complaint" => "Drafts/ConsumerComplaint",
                "Agreement" => "Drafts/Agreement",
                "Employment Agreement" => "Drafts/EmploymentAgreement",
                "Affidavit" => "Drafts/Affidavit",
                _ => "LegalDraft"
            };
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

        return taskType switch
        {
            "Summarization" => "Analysis",
            _ => "GeneralChat"
        };
    }

    /// <summary>
    /// Format a progress chunk so the frontend can distinguish it from LLM content.
    /// Prefix: "[sys]" — frontend should render these as status messages, not as answer text.
    /// </summary>
    private static string FormatProgressChunk(string message)
        => $"[sys]{message}";
}
