using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Clausio.Legal.Core.Interfaces.AI;
using Clausio.Legal.Core.Interfaces.AI.Drafting;
using Microsoft.Extensions.Logging;

namespace Clausio.Legal.Service.AI.Drafting;

public class DraftReviewResult
{
    public bool QualityPassed { get; set; }
    public int OverallScore { get; set; }
    public string Recommendation { get; set; } = "Accept";
}

public class DraftEngine : IDraftEngine
{
    private readonly IPromptBuilder _promptBuilder;
    private readonly IAIRouter _aiRouter;
    private readonly IDraftValidationPipeline _validationPipeline;
    private readonly ILogger<DraftEngine> _logger;

    public DraftEngine(
        IPromptBuilder promptBuilder, 
        IAIRouter aiRouter, 
        IDraftValidationPipeline validationPipeline,
        ILogger<DraftEngine> logger)
    {
        _promptBuilder = promptBuilder;
        _aiRouter = aiRouter;
        _validationPipeline = validationPipeline;
        _logger = logger;
    }

    public async Task<string> DraftDocumentAsync(Guid caseId, string documentType, string instructions, string contextXml, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("[DraftEngine] Starting draft. Type: {DocumentType}, Case: {CaseId}", documentType, caseId);

        // Step 1: Select specialized template
        var templateName = GetTemplateForDocumentType(documentType);
        _logger.LogInformation("[DraftEngine] Selected template: {Template}", templateName);

        var variables = new Dictionary<string, string>
        {
            { "CONTEXT", contextXml },
            { "INSTRUCTIONS", instructions }
        };
        var systemPrompt = _promptBuilder.BuildSystemPrompt(templateName, variables);

        // Step 2: Generate initial draft
        _logger.LogInformation("[DraftEngine] Generating initial draft...");
        var initialDraft = await _aiRouter.CompleteAsync(systemPrompt, instructions, "LegalDraft", cancellationToken);

        // Client updates are short plain-language messages, not legal documents.
        // The DraftSelfReview validator judges them as "incomplete / missing sections"
        // and the refinement pass then pads them with hearing recaps and content the
        // advocate did not tick. Skip the whole validation loop for this template.
        if (templateName == "ClientUpdate")
        {
            _logger.LogInformation("[DraftEngine] ClientUpdate — skipping legal-draft validation pipeline.");
            return initialDraft;
        }

        // Step 3: Execute Draft Validation Pipeline
        _logger.LogInformation("[DraftEngine] Executing Draft Validation Pipeline...");
        var (passed, score, recommendation, feedback) = await _validationPipeline.ValidateDraftAsync(initialDraft, documentType, cancellationToken);
        
        _logger.LogInformation("[DraftEngine] Draft Validation Completed. Passed={Passed}, Score={Score}, Recommendation={Rec}", passed, score, recommendation);

        if (!passed)
        {
            _logger.LogWarning("[DraftEngine] Draft validation flagged issues: {Feedback}. Applying auto-refinement...", feedback);
            var refinementPrompt = $"Original Draft:\n{initialDraft}\n\nValidation Feedback:\n{feedback}\n\nPlease revise and correct the legal draft accordingly.";
            initialDraft = await _aiRouter.CompleteAsync(systemPrompt, refinementPrompt, "LegalDraft", cancellationToken);
        }

        return initialDraft;
    }



    private string GetTemplateForDocumentType(string documentType)
    {
        return documentType switch
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
            "Reply to Legal Notice"
                => "Drafts/legal_notice_reply",
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
            "NCLT Petition Section 241/242"
                => "Drafts/nclt_petition_241_242",
            "NCLT Petition (Section 241/242 — Oppression)"
                => "Drafts/nclt_petition_oppression",
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
            var t when t.Contains("risk", StringComparison.OrdinalIgnoreCase)
                => "Analysis/RiskAssessment",
            var t when t.Contains("clause", StringComparison.OrdinalIgnoreCase)
                => "Analysis/ClauseAnalysis",
            var t when t.Contains("client update", StringComparison.OrdinalIgnoreCase)
                => "ClientUpdate",
            _ => "LegalDraft"
        };
    }
}
