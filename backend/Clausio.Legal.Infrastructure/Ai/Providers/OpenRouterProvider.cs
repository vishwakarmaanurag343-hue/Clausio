using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Clausio.Legal.Core.Interfaces.AI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Clausio.Legal.Infrastructure.Ai.Providers;

public class OpenRouterProvider : ILLMProvider
{
    private readonly HttpClient _http;
    private readonly ILogger<OpenRouterProvider> _logger;
    private readonly string _baseUrl;
    private readonly string _apiKey;
    private readonly int _completionMaxTokens;

    public OpenRouterProvider(IConfiguration config, ILogger<OpenRouterProvider> logger, HttpClient httpClient)
    {
        _logger = logger;
        _http = httpClient;
        _apiKey = config["AI:OpenRouter:ApiKey"]
               ?? Environment.GetEnvironmentVariable("OPENROUTER_API_KEY")
               ?? config["AI:FastProvider:ApiKey"]
               ?? config["AI:Groq:ApiKey"]
               ?? throw new InvalidOperationException("AI:OpenRouter:ApiKey or OPENROUTER_API_KEY environment variable is missing");

        _baseUrl = config["AI:OpenRouter:BaseUrl"]
                ?? "https://openrouter.ai/api/v1";

        // Non-streaming completions (analysis briefs, chronology, evidence review) need room for multi-page answers
        _completionMaxTokens = int.TryParse(config["AI:AnalysisMaxTokens"], out var mt) && mt > 0 ? mt : 8192;
        
        _http.DefaultRequestHeaders.Add("User-Agent", "ClausioLegalAI/1.0");
        _http.Timeout = TimeSpan.FromSeconds(180);
    }

    public async Task<string> CompleteAsync(string model, string systemPrompt, string userPrompt, CancellationToken cancellationToken = default)
    {
        return await CompleteAsync(model, systemPrompt, userPrompt, null, cancellationToken);
    }

    public async Task<string> CompleteAsync(string model, string systemPrompt, string userPrompt, string? preferredProvider, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("OpenRouter CompleteAsync called for model {Model}, ProviderPreference: {Provider}", model, preferredProvider ?? "default");
        return await CallApiAsync(model, systemPrompt, userPrompt, false, preferredProvider, cancellationToken);
    }

    public IAsyncEnumerable<string> StreamCompleteAsync(string model, string systemPrompt, string userPrompt, CancellationToken cancellationToken = default)
    {
        return StreamCompleteAsync(model, systemPrompt, userPrompt, null, cancellationToken);
    }

    public async IAsyncEnumerable<string> StreamCompleteAsync(string model, string systemPrompt, string userPrompt, string? preferredProvider, [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("OpenRouter StreamCompleteAsync called for model {Model}, ProviderPreference: {Provider}", model, preferredProvider ?? "default");

        var requestBody = new Dictionary<string, object>
        {
            ["model"] = model,
            ["max_tokens"] = 4096,
            ["temperature"] = 0.1,
            ["stream"] = true,
            ["messages"] = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt }
            }
        };

        if (!string.IsNullOrWhiteSpace(preferredProvider))
        {
            var providers = preferredProvider.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            requestBody["provider"] = new Dictionary<string, object>
            {
                ["order"] = providers,
                ["allow_fallbacks"] = true
            };
        }

        var json = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/chat/completions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        request.Content = content;

        using var response = await _http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("[OpenRouterProvider] Stream model {Model} failed: {Status} - {Error}", model, response.StatusCode, err);
            throw new HttpRequestException($"Model {model} returned {response.StatusCode}: {err}");
        }

        using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var reader = new StreamReader(stream);

        while (!reader.EndOfStream && !cancellationToken.IsCancellationRequested)
        {
            var line = await reader.ReadLineAsync();
            if (string.IsNullOrWhiteSpace(line)) continue;
            
            if (line.StartsWith("data: "))
            {
                var data = line.Substring(6);
                if (data == "[DONE]") break;

                string chunk = "";
                try 
                {
                    var parsed = JsonDocument.Parse(data);
                    var delta = parsed.RootElement.GetProperty("choices")[0].GetProperty("delta");
                    if (delta.TryGetProperty("content", out var contentProp))
                    {
                        chunk = contentProp.GetString() ?? "";
                    }
                }
                catch { /* Ignore parse errors */ }

                if (!string.IsNullOrEmpty(chunk))
                {
                    yield return chunk;
                }
            }
        }
    }

    private async Task<string> CallApiAsync(string model, string systemPrompt, string userPrompt, bool stream, string? preferredProvider, CancellationToken cancellationToken)
    {
        bool isClientUpdate = systemPrompt.Contains("CLIENT-UPDATE TASK", StringComparison.OrdinalIgnoreCase);
        int maxTokens = isClientUpdate ? 2048 : _completionMaxTokens;

        var requestBody = new Dictionary<string, object>
        {
            ["model"] = model,
            ["max_tokens"] = maxTokens,
            ["temperature"] = 0.1,
            ["stream"] = stream,
            ["messages"] = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt }
            }
        };

        if (isClientUpdate)
        {
            requestBody["reasoning"] = new Dictionary<string, object> { ["effort"] = "none" };
        }

        if (!string.IsNullOrWhiteSpace(preferredProvider))
        {
            var providers = preferredProvider.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            requestBody["provider"] = new Dictionary<string, object>
            {
                ["order"] = providers,
                ["allow_fallbacks"] = true
            };
        }

        var json = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/chat/completions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        request.Content = content;

        var response = await _http.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var errBody = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("[OpenRouterProvider] Model {Model} returned {Status}: {Error}", model, response.StatusCode, errBody);
            throw new HttpRequestException($"Model {model} returned {response.StatusCode}: {errBody}");
        }

        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
        var parsed = JsonDocument.Parse(responseJson);

        var message = parsed.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message");

        var responseText = message.TryGetProperty("content", out var contentProp) && contentProp.ValueKind == JsonValueKind.String
            ? contentProp.GetString()
            : null;

        if (string.IsNullOrWhiteSpace(responseText))
        {
            _logger.LogWarning("[OpenRouterProvider] Empty content received from model {Model}. Raw response: {Raw}", model, responseJson);
        }

        // If content contains reasoning, prefer the last well-formed JSON block or content itself
        return ExtractJson(responseText ?? string.Empty);
    }

    private string ExtractJson(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return text;

        // 1. Check for markdown json code blocks (try all matches and pick the valid/longest one)
        var matches = System.Text.RegularExpressions.Regex.Matches(text, @"```(?:json)?\s*(\{[\s\S]*?\})\s*```");
        for (int i = matches.Count - 1; i >= 0; i--)
        {
            var candidate = matches[i].Groups[1].Value.Trim();
            try
            {
                using var doc = JsonDocument.Parse(candidate);
                return candidate;
            }
            catch { }
        }

        // 2. Try parsing from the last complete JSON object backwards
        int start = text.IndexOf('{');
        int end = text.LastIndexOf('}');
        if (start >= 0 && end > start)
        {
            var candidate = text.Substring(start, end - start + 1);
            try
            {
                using var doc = JsonDocument.Parse(candidate);
                return candidate;
            }
            catch { }

            // If combined string failed, search for innermost or largest balanced JSON object
            for (int s = start; s < end; s = text.IndexOf('{', s + 1))
            {
                if (s < 0) break;
                for (int e = end; e > s; e = text.LastIndexOf('}', e - 1))
                {
                    if (e < 0) break;
                    var sub = text.Substring(s, e - s + 1);
                    try
                    {
                        using var doc = JsonDocument.Parse(sub);
                        return sub;
                    }
                    catch { }
                }
            }
        }

        return text;
    }
}
