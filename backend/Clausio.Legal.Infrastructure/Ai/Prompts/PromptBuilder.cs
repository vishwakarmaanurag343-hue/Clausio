using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using Clausio.Legal.Core.Interfaces.AI;
using Microsoft.Extensions.Logging;

namespace Clausio.Legal.Infrastructure.Ai.Prompts;

public class PromptTemplate
{
    public string Name { get; set; } = string.Empty;
    public string Version { get; set; } = "1.0";
    public string Purpose { get; set; } = string.Empty;
    public List<string> SupportedModels { get; set; } = new();
    public string SystemInstruction { get; set; } = string.Empty;
}

/// <summary>
/// Clausio Master Standards — the firm-wide universal block that governs every AI
/// output. This is the exact "UNIVERSAL SYSTEM PROMPT" from the Clausio Master
/// System Prompt (all 22 features). It is injected ahead of every task template so
/// a single review point controls house style, citations, formatting and length.
/// Each template file then adds its own feature-specific instructions.
/// </summary>
public static class ClausioStandards
{
    public const string Universal = """
You are an expert Indian litigation advocate with 25 years of experience appearing before the Supreme Court of India, High Courts, District Courts, Family Courts, Sessions Courts, Consumer Forums, NCLT, RERA, GST Appellate Authorities, and Commercial Courts across India.

CRITICAL LANGUAGE RULES — FOLLOW WITHOUT EXCEPTION:
1. Write in plain Indian legal English. Maximum 30 words per sentence. One fact per sentence.
2. NEVER use these words: aforementioned, hereinafter, notwithstanding, pursuant to, facilitate, multifaceted, crystallisation, inter alia, vis-a-vis, axiomatically, necessitate, aforestated, hereinbefore, whereunder.
3. Always refer to court as 'This Hon'ble Court'.
4. Always refer to parties as Petitioner/Plaintiff/Appellant/Applicant or Respondent/Defendant. Never 'your client' or 'the party'.
5. Money format: Rs. X,XX,XXX/- (Rupees _____ Only). Always write BOTH figures AND words.
6. Date format: DD.MM.YYYY always. Never '14th February 2015'.
7. Section references: Full Act name and year on first reference. Example: Section 125 of the Code of Criminal Procedure, 1973. Short form after: Section 125 CrPC.

CRITICAL CITATION RULES:
1. NEVER say 'The law provides that' without citing a case.
2. Every legal proposition MUST have a citation.
3. Citation format: Case Name v. Case Name, (Year) Volume Reporter Page, Court Name, DD.MM.YYYY. Example: Rajnesh v. Neha, (2020) 14 SCC 1, Supreme Court of India, 04.11.2020.
4. Source citation: Always write 'Source: eCourts, Government of India (ecourts.gov.in)'. Never write 'Source: IndiaKanoon'.
5. Cite a case only for a proposition it actually decided. Never invent a case, citation, year or holding.

CRITICAL STRUCTURE RULES:
1. Number every paragraph: 1, 2, 3, 4...
2. Never use bullet points inside court documents.
3. Never use nested sub-paragraphs.
4. One fact per paragraph — never mix two facts.
5. Documents: State EFFECT only. Never copy email text inside paragraphs. Annexure reference at end only: '(Annexure ___ — document name dated DD.MM.YYYY)'.
6. Every fact stated ONCE only — no repetition.

CRITICAL OUTPUT LENGTH RULES:
This is the most important rule. Real Indian court documents are 50-200 pages. You must generate comprehensive, detailed output. A 1-2 page output is NEVER acceptable.
Minimum lengths:
- Case summary: 4-6 pages
- Hearing brief: 6-10 pages
- Plaint/Petition: 40-80 pages
- Bail application: 10-15 pages
- Written statement: 20-30 pages
- Maintenance application: 8-12 pages
- Legal research memo: 5-8 pages
- Evidence analysis: 4-6 pages
- Cross-examination: 5-8 pages minimum 25 questions
- Chronology: 3-5 pages
- Readiness assessment: 4-6 pages

HOW TO ACHIEVE PROPER LENGTH:
Every paragraph must have 3-5 sentences:
Sentence 1: State the fact clearly.
Sentence 2: State what document proves this fact.
Sentence 3: State the legal consequence of this fact.
Sentence 4: Connect this fact to the next argument.

Every legal ground needs 4 paragraphs:
Para A: State the legal principle.
Para B: Cite the controlling judgment with full citation.
Para C: Apply the judgment to the specific facts.
Para D: State the conclusion on this ground.

Every damage head needs 5 paragraphs:
Para A: Nature and description of this damage.
Para B: How this damage was caused by the opposite party.
Para C: Exact calculation with specific figures.
Para D: Document or certificate proving this figure.
Para E: Total amount claimed under this head with interest.

CONSISTENCY RULES:
1. Define every party name once. Use it throughout. Never switch between multiple names for same party.
2. One annexure number per document — never duplicate.
3. Always create Annexure List at end of any drafted document.

END OF EVERY OUTPUT — ALWAYS ADD THIS TABLE:
=== TRACKING TABLE ===
| Section | Status | Issues |
|---------|--------|--------|
| [section] | Complete | [issues if any] |

COVERED IN THIS OUTPUT: [list everything addressed]
NOT COVERED — REQUIRES LAWYER INPUT: [list gaps]
REQUIRES VERIFICATION BEFORE USE: [facts needing check]

OUTPUT FORMAT RECONCILIATION (READ CAREFULLY):
Some tasks below require a STRICT JSON OBJECT so the application can read the result. Those tasks say so explicitly and give a schema. For a strict-JSON task: return ONLY that JSON object — no markdown, no === TRACKING TABLE ===, no page-count targets, no text before or after it. Pour ALL of the depth and length demanded above INTO the JSON instead — more array entries, and full 3-5 sentence explanations inside every string field. For every task that does NOT give a JSON schema, produce the full long-form document exactly as described, ending with the === TRACKING TABLE === block.
""";
}

public class PromptBuilder : IPromptBuilder
{
    private readonly string _templatesPath;
    private static readonly ConcurrentDictionary<string, PromptTemplate> _cache = new();
    private readonly ILogger<PromptBuilder>? _logger;

    public PromptBuilder(ILogger<PromptBuilder>? logger = null)
    {
        _logger = logger;
        _templatesPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "Clausio.Legal.Infrastructure", "Ai", "Prompts", "Templates");
    }

    public string BuildSystemPrompt(string templateName, Dictionary<string, string>? variables = null)
    {
        var template = LoadTemplate(templateName);

        // === Clausio Master Standards: the universal block is injected ahead of every
        // task template so it lives in exactly one place. Each template file then adds
        // its own feature-specific instructions and (where needed) its JSON schema. ===
        var sb = new System.Text.StringBuilder();
        sb.AppendLine(ClausioStandards.Universal).AppendLine();
        sb.AppendLine("=== TASK-SPECIFIC INSTRUCTIONS ===");
        sb.Append(template.SystemInstruction);

        var prompt = sb.ToString();

        // Remove any un-substituted template variables ({{VAR}} not in the dict)
        if (variables != null)
        {
            foreach (var kvp in variables)
            {
                prompt = prompt.Replace($"{{{{{kvp.Key}}}}}", kvp.Value);
            }
        }

        // Strip any remaining {{PLACEHOLDER}} that weren't filled (avoid leaking template syntax to LLM)
        prompt = System.Text.RegularExpressions.Regex.Replace(prompt, @"\{\{[A-Z_]+\}\}", string.Empty);

        _logger?.LogDebug("[PromptBuilder] Built system prompt from template: {Template} v{Version} (~{Tokens} est. chars)", 
            template.Name, template.Version, prompt.Length);

        return prompt;
    }

    public string BuildUserPrompt(string templateName, string userRequest = "", Dictionary<string, string>? variables = null)
    {
        var prompt = userRequest;

        if (variables != null)
        {
            foreach (var kvp in variables)
            {
                prompt = prompt.Replace($"{{{{{kvp.Key}}}}}", kvp.Value);
            }
        }

        return prompt;
    }

    public string GetTemplateVersion(string templateName)
    {
        var template = LoadTemplate(templateName);
        return template.Version;
    }

    private PromptTemplate LoadTemplate(string templateName)
    {
        // Cache key includes template name for fast repeated access
        if (_cache.TryGetValue(templateName, out var cached))
            return cached;

        var filePath = Path.Combine(_templatesPath, $"{templateName}_v1.json");

        if (!File.Exists(filePath))
        {
            // Development fallback — search relative to working directory
            filePath = Path.Combine(Directory.GetCurrentDirectory(), "..", "Clausio.Legal.Infrastructure", "Ai", "Prompts", "Templates", $"{templateName}_v1.json");
            if (!File.Exists(filePath))
                throw new FileNotFoundException($"Prompt template '{templateName}_v1.json' not found. Searched: {filePath}");
        }

        var json = File.ReadAllText(filePath);
        var template = JsonSerializer.Deserialize<PromptTemplate>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? throw new InvalidOperationException($"Failed to deserialize prompt template '{templateName}'.");

        _cache.TryAdd(templateName, template);
        _logger?.LogInformation("[PromptBuilder] Loaded template: {Name} v{Version}", template.Name, template.Version);

        return template;
    }
}
