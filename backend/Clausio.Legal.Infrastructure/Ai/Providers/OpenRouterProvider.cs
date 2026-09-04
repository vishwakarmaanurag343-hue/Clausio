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
        _apiKey = config["AI:Groq:ApiKey"]
               ?? config["AI:OpenRouter:ApiKey"]
               ?? config["AI:FastProvider:ApiKey"]
               ?? throw new InvalidOperationException("AI:Groq:ApiKey or AI:OpenRouter:ApiKey missing");

        _baseUrl = config["AI:OpenRouter:BaseUrl"]
                ?? config["AI:FastProvider:BaseUrl"]
                ?? config["AI:Groq:BaseUrl"]
                ?? "https://openrouter.ai/api/v1";

        // Non-streaming completions (the Analysis-page briefs, chronology, evidence review,
        // non-stream chat) need room for a multi-page structured answer — a 4096 cap was
        // truncating case summaries to a single page.
        _completionMaxTokens = int.TryParse(config["AI:AnalysisMaxTokens"], out var mt) && mt > 0 ? mt : 8192;
        
        _http.DefaultRequestHeaders.Add("User-Agent", "ClausioLegalAI/1.0");
        _http.Timeout = TimeSpan.FromSeconds(180);
    }

    public async Task<string> CompleteAsync(string model, string systemPrompt, string userPrompt, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("OpenRouter CompleteAsync called for model {Model}", model);
        return await CallApiAsync(model, systemPrompt, userPrompt, false, cancellationToken);
    }

    public async IAsyncEnumerable<string> StreamCompleteAsync(string model, string systemPrompt, string userPrompt, [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("OpenRouter StreamCompleteAsync called for model {Model}", model);

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
        if (_baseUrl.Contains("sarvam.ai", StringComparison.OrdinalIgnoreCase))
        {
            requestBody["reasoning_effort"] = "low";
        }
        else
        {
            requestBody["reasoning_effort"] = model.Contains("gpt-oss", StringComparison.OrdinalIgnoreCase) ? "low" : "none";
        }

        var json = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/chat/completions");
        if (_apiKey.StartsWith("sk_", StringComparison.OrdinalIgnoreCase) && _baseUrl.Contains("sarvam.ai", StringComparison.OrdinalIgnoreCase))
        {
            request.Headers.Add("api-subscription-key", _apiKey);
        }
        else
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        }
        request.Content = content;

        using var response = await _http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        response.EnsureSuccessStatusCode();

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
                        chunk = contentProp.GetString();
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

    private async Task<string> CallApiAsync(string model, string systemPrompt, string userPrompt, bool stream, CancellationToken cancellationToken)
    {
        var requestBody = new Dictionary<string, object>
        {
            ["model"] = model,
            ["max_tokens"] = _completionMaxTokens,
            ["temperature"] = 0.1,
            ["stream"] = stream,
            ["messages"] = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt }
            }
        };

        if (_baseUrl.Contains("sarvam.ai", StringComparison.OrdinalIgnoreCase))
        {
            requestBody["reasoning_effort"] = "low";
        }
        else
        {
            requestBody["reasoning_effort"] = model.Contains("gpt-oss", StringComparison.OrdinalIgnoreCase) ? "low" : "none";
        }

        var json = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/chat/completions");
        if (_apiKey.StartsWith("sk_", StringComparison.OrdinalIgnoreCase) && _baseUrl.Contains("sarvam.ai", StringComparison.OrdinalIgnoreCase))
        {
            request.Headers.Add("api-subscription-key", _apiKey);
        }
        else
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        }
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

        if (string.IsNullOrWhiteSpace(responseText) && message.TryGetProperty("reasoning_content", out var reasoningProp) && reasoningProp.ValueKind == JsonValueKind.String)
        {
            responseText = reasoningProp.GetString();
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
