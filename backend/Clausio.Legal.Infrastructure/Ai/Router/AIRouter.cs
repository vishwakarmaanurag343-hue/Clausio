using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using Clausio.Legal.Core.Interfaces.AI;
using Clausio.Legal.Infrastructure.Ai.Providers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Polly;
using Polly.Retry;

namespace Clausio.Legal.Infrastructure.Ai.Router;

public class AIRouter : IAIRouter
{
    private readonly TokenRouterProvider _tokenRouterProvider;
    private readonly OpenRouterProvider _openRouterProvider;
    private readonly ILogger<AIRouter> _logger;
    
    // DRAFTING: DeepSeek V4 Flash 0731 via OpenInference on OpenRouter
    private readonly string _draftingModel;
    private readonly string _draftingProvider;

    // DEEP RESEARCH: GLM 5.3 Flash via DeepInfra on OpenRouter
    private readonly string _researchModel;
    private readonly string _researchProvider;

    public AIRouter(
        TokenRouterProvider tokenRouterProvider, 
        OpenRouterProvider openRouterProvider, 
        IConfiguration config, 
        ILogger<AIRouter> logger)
    {
        _tokenRouterProvider = tokenRouterProvider;
        _openRouterProvider = openRouterProvider;
        _logger = logger;

        _draftingModel = config["AI:Drafting:ModelId"] 
                      ?? "z-ai/glm-5.3-flash";
        _draftingProvider = config["AI:Drafting:Provider"] 
                         ?? "deepinfra";

        _researchModel = config["AI:Research:ModelId"] 
                      ?? "z-ai/glm-5.3-flash";
        _researchProvider = config["AI:Research:Provider"] 
                         ?? "deepinfra";
    }

    public async Task<string> CompleteAsync(string systemPrompt, string userPrompt, string promptType = "chat", CancellationToken cancellationToken = default)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var estimatedPromptTokens = (systemPrompt.Length + userPrompt.Length) / 4;
        
        bool isDrafting = IsDraftingTask(promptType);
        string model = isDrafting ? _draftingModel : _researchModel;
        string provider = isDrafting ? _draftingProvider : _researchProvider;
        string taskCategory = isDrafting ? "DRAFTING" : "RESEARCH_ANALYSIS";

        _logger.LogInformation("[Router:Complete] Category={Category}, PromptType={PromptType}, Model={Model}, ProviderPref={Provider}, EstPromptTokens~{Tokens}", 
            taskCategory, promptType, model, provider, estimatedPromptTokens);

        int? customMaxTokens = isDrafting ? 16384 : null;

        try
        {
            var result = await _openRouterProvider.CompleteAsync(model, systemPrompt, userPrompt, provider, customMaxTokens, cancellationToken);
            
            if (string.IsNullOrWhiteSpace(result))
            {
                _logger.LogError("[Router:Complete] Model {Model} returned empty response for {Category}.", model, taskCategory);
                throw new InvalidOperationException($"Model {model} returned an empty response.");
            }

            sw.Stop();
            var estimatedCompletionTokens = result.Length / 4;
            _logger.LogInformation("[Router:Complete] Finished. Model={Model}, Provider={Provider}, LatencyMs={Ms}, EstCompletionTokens~{Tokens}",
                model, provider, sw.ElapsedMilliseconds, estimatedCompletionTokens);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Router:Complete] {Category} call to OpenRouter with Model {Model} (Provider: {Provider}) failed: {Error}", 
                taskCategory, model, provider, ex.Message);
            throw;
        }
    }

    public async IAsyncEnumerable<string> StreamCompleteAsync(string systemPrompt, string userPrompt, string promptType = "chat", [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        bool isDrafting = IsDraftingTask(promptType);
        string model = isDrafting ? _draftingModel : _researchModel;
        string provider = isDrafting ? _draftingProvider : _researchProvider;
        string taskCategory = isDrafting ? "DRAFTING" : "RESEARCH_ANALYSIS";

        _logger.LogInformation("[Router:Stream] Category={Category}, PromptType={PromptType}, Model={Model}, ProviderPref={Provider}", 
            taskCategory, promptType, model, provider);

        var stream = _openRouterProvider.StreamCompleteAsync(model, systemPrompt, userPrompt, provider, cancellationToken);
        var enumerator = stream.GetAsyncEnumerator(cancellationToken);

        try
        {
            while (true)
            {
                bool moveNext;
                try
                {
                    moveNext = await enumerator.MoveNextAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[Router:Stream] Streaming {Category} with model {Model} (Provider: {Provider}) failed mid-stream: {Error}", 
                        taskCategory, model, provider, ex.Message);
                    throw;
                }

                if (!moveNext) break;

                yield return enumerator.Current;
            }
        }
        finally
        {
            await enumerator.DisposeAsync();
        }
    }

    private static bool IsDraftingTask(string promptType)
    {
        return promptType.Equals("LegalDraft", StringComparison.OrdinalIgnoreCase)
            || promptType.Equals("Draft", StringComparison.OrdinalIgnoreCase)
            || promptType.Equals("Drafting", StringComparison.OrdinalIgnoreCase);
    }
}
