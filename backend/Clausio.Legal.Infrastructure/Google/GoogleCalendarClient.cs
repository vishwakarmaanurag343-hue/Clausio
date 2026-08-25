using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Clausio.Legal.Infrastructure.Google;

// ── Settings bound from "GoogleCalendar" config section ──
public class GoogleCalendarSettings
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string RedirectUri { get; set; } = "http://localhost:5123/api/integrations/google/callback";
    public string FrontendUrl { get; set; } = "http://localhost:3001";
    public string TimeZone { get; set; } = "Asia/Kolkata";

    public bool IsConfigured => !string.IsNullOrWhiteSpace(ClientId) && !string.IsNullOrWhiteSpace(ClientSecret);
}

public record GoogleTokenResponse(
    [property: JsonPropertyName("access_token")] string AccessToken,
    [property: JsonPropertyName("refresh_token")] string? RefreshToken,
    [property: JsonPropertyName("expires_in")] int ExpiresIn);

public class GoogleCalendarEvent
{
    [JsonPropertyName("summary")] public string? Summary { get; set; }
    [JsonPropertyName("description")] public string? Description { get; set; }
    [JsonPropertyName("location")] public string? Location { get; set; }
    [JsonPropertyName("start")] public GoogleEventTime? Start { get; set; }
    [JsonPropertyName("end")] public GoogleEventTime? End { get; set; }
    [JsonPropertyName("reminders")] public GoogleEventReminders? Reminders { get; set; }
    [JsonPropertyName("extendedProperties")] public GoogleExtendedProperties? ExtendedProperties { get; set; }
}

public class GoogleEventTime
{
    [JsonPropertyName("dateTime")] public string? DateTime { get; set; }
    [JsonPropertyName("date")] public string? Date { get; set; }          // all-day events
    [JsonPropertyName("timeZone")] public string? TimeZone { get; set; }
}

public class GoogleEventListResponse
{
    [JsonPropertyName("items")] public List<GoogleEventListItem>? Items { get; set; }
    [JsonPropertyName("nextPageToken")] public string? NextPageToken { get; set; }
}

public class GoogleEventListItem
{
    [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
    [JsonPropertyName("summary")] public string? Summary { get; set; }
    [JsonPropertyName("description")] public string? Description { get; set; }
    [JsonPropertyName("location")] public string? Location { get; set; }
    [JsonPropertyName("start")] public GoogleEventTime? Start { get; set; }
    [JsonPropertyName("end")] public GoogleEventTime? End { get; set; }
    [JsonPropertyName("reminders")] public GoogleEventReminders? Reminders { get; set; }
    [JsonPropertyName("extendedProperties")] public GoogleExtendedProperties? ExtendedProperties { get; set; }
}

public class GoogleEventReminders
{
    [JsonPropertyName("useDefault")] public bool UseDefault { get; set; }
    [JsonPropertyName("overrides")] public List<GoogleReminderOverride>? Overrides { get; set; }
}

public class GoogleReminderOverride
{
    [JsonPropertyName("method")] public string Method { get; set; } = "popup";
    [JsonPropertyName("minutes")] public int Minutes { get; set; }
}

public class GoogleExtendedProperties
{
    [JsonPropertyName("private")] public Dictionary<string, string>? Private { get; set; }
}

/// <summary>
/// Thin REST client for the Google Calendar API — no SDK dependency.
/// Handles OAuth token exchange/refresh and event upsert/delete.
/// </summary>
public class GoogleCalendarClient
{
    private const string TokenEndpoint = "https://oauth2.googleapis.com/token";
    private const string EventsEndpoint = "https://www.googleapis.com/calendar/v3/calendars/{0}/events";
    private const string AuthEndpoint =
        "https://accounts.google.com/o/oauth2/v2/auth" +
        "?client_id={0}&redirect_uri={1}&response_type=code&scope={2}" +
        "&access_type=offline&prompt=consent&include_granted_scopes=true&state={3}";

    public const string Scope = "https://www.googleapis.com/auth/calendar.events";

    private readonly HttpClient _http;
    private readonly GoogleCalendarSettings _settings;
    private readonly ILogger<GoogleCalendarClient> _logger;

    // WhenWritingNull lets PATCH-style partial updates omit unset fields.
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public GoogleCalendarClient(HttpClient http, IConfiguration config, ILogger<GoogleCalendarClient> logger)
    {
        _http = http;
        _settings = new GoogleCalendarSettings
        {
            ClientId     = config["GoogleCalendar:ClientId"] ?? "",
            ClientSecret = config["GoogleCalendar:ClientSecret"] ?? "",
            RedirectUri  = config["GoogleCalendar:RedirectUri"] ?? "http://localhost:5123/api/integrations/google/callback",
            FrontendUrl  = config["GoogleCalendar:FrontendUrl"] ?? "http://localhost:3001",
            TimeZone     = config["GoogleCalendar:TimeZone"] ?? "Asia/Kolkata",
        };
        _logger = logger;
    }

    public GoogleCalendarSettings Settings => _settings;

    public bool IsConfigured => _settings.IsConfigured;

    public string BuildAuthUrl(string state) =>
        string.Format(AuthEndpoint,
            Uri.EscapeDataString(_settings.ClientId),
            Uri.EscapeDataString(_settings.RedirectUri),
            Uri.EscapeDataString(Scope),
            Uri.EscapeDataString(state));

    /// <summary>Exchange authorization code for access + refresh tokens.</summary>
    public async Task<GoogleTokenResponse> ExchangeCodeAsync(string code, CancellationToken ct = default)
    {
        var form = new Dictionary<string, string>
        {
            ["code"] = code,
            ["client_id"] = _settings.ClientId,
            ["client_secret"] = _settings.ClientSecret,
            ["redirect_uri"] = _settings.RedirectUri,
            ["grant_type"] = "authorization_code",
        };
        return await SendTokenRequest(form, ct);
    }

    /// <summary>Mint a fresh access token from a stored refresh token.</summary>
    public async Task<string> RefreshAccessTokenAsync(string refreshToken, CancellationToken ct = default)
    {
        var form = new Dictionary<string, string>
        {
            ["refresh_token"] = refreshToken,
            ["client_id"] = _settings.ClientId,
            ["client_secret"] = _settings.ClientSecret,
            ["grant_type"] = "refresh_token",
        };
        var resp = await SendTokenRequest(form, ct);
        return resp.AccessToken;
    }

    /// <summary>Create or update an event. Returns (googleEventId, htmlLink).</summary>
    public async Task<(string EventId, string EventUrl)> UpsertEventAsync(
        string accessToken, string calendarId, string? existingEventId,
        GoogleCalendarEvent evt, CancellationToken ct = default)
    {
        var request = new HttpRequestMessage();
        if (existingEventId is null)
        {
            request.Method = HttpMethod.Post;
            request.RequestUri = new Uri(string.Format(EventsEndpoint, Uri.EscapeDataString(calendarId)) + "?sendUpdates=none");
        }
        else
        {
            request.Method = HttpMethod.Put;
            request.RequestUri = new Uri(string.Format(EventsEndpoint, Uri.EscapeDataString(calendarId)) + "/" + existingEventId);
        }
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Content = JsonContent.Create(evt, options: JsonOpts);

        using var resp = await _http.SendAsync(request, ct);
        var body = await resp.Content.ReadAsStringAsync(ct);
        if (!resp.IsSuccessStatusCode)
        {
            _logger.LogWarning("Google Calendar upsert failed ({Status}): {Body}", resp.StatusCode, body);
            throw new HttpRequestException($"Google Calendar upsert failed: {(int)resp.StatusCode} {body}");
        }

        using var doc = JsonDocument.Parse(body);
        var id = doc.RootElement.GetProperty("id").GetString()!;
        var link = doc.RootElement.TryGetProperty("htmlLink", out var l) ? l.GetString() : null;
        return (id, link ?? $"https://calendar.google.com/calendar/render?eventid={id}");
    }

    public async Task DeleteEventAsync(string accessToken, string calendarId, string googleEventId, CancellationToken ct = default)
    {
        using var req = new HttpRequestMessage(HttpMethod.Delete,
            string.Format(EventsEndpoint, Uri.EscapeDataString(calendarId)) + "/" + googleEventId);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var resp = await _http.SendAsync(req, ct);
        // 404 / 410 just means it was already gone — fine.
        if (!resp.IsSuccessStatusCode && (int)resp.StatusCode is not (404 or 410))
            throw new HttpRequestException($"Google Calendar delete failed: {(int)resp.StatusCode}");
    }

    // ══════════════════ read/create used by the in-app Calendar tab ══════════════════

    /// <summary>List events overlapping [timeMin, timeMax), expanded (recurring → instances).</summary>
    public async Task<List<GoogleEventListItem>> ListEventsAsync(
        string accessToken, string calendarId, DateTime timeMinUtc, DateTime timeMaxUtc, CancellationToken ct = default)
    {
        static string Iso(DateTime utc) =>
            Uri.EscapeDataString(DateTime.SpecifyKind(utc, DateTimeKind.Utc).ToString("yyyy-MM-dd'T'HH:mm:ss'Z'"));

        var url = string.Format(EventsEndpoint, Uri.EscapeDataString(calendarId)) +
                  $"?timeMin={Iso(timeMinUtc)}&timeMax={Iso(timeMaxUtc)}" +
                  "&singleEvents=true&orderBy=startTime&maxResults=250";
        using var req = new HttpRequestMessage(HttpMethod.Get, url);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var resp = await _http.SendAsync(req, ct);
        var body = await resp.Content.ReadAsStringAsync(ct);
        if (!resp.IsSuccessStatusCode)
        {
            _logger.LogWarning("Google Calendar list failed ({Status}): {Body}", resp.StatusCode, body);
            throw new HttpRequestException($"Google Calendar list failed: {(int)resp.StatusCode} {body}");
        }
        return JsonSerializer.Deserialize<GoogleEventListResponse>(body, JsonOpts)?.Items
               ?? new List<GoogleEventListItem>();
    }

    /// <summary>Create an event and return its parsed representation.</summary>
    public async Task<GoogleEventListItem> CreateEventAsync(
        string accessToken, string calendarId, GoogleCalendarEvent evt, CancellationToken ct = default)
    {
        using var req = new HttpRequestMessage(HttpMethod.Post,
            string.Format(EventsEndpoint, Uri.EscapeDataString(calendarId)) + "?sendUpdates=none");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        req.Content = JsonContent.Create(evt, options: JsonOpts);
        using var resp = await _http.SendAsync(req, ct);
        var body = await resp.Content.ReadAsStringAsync(ct);
        if (!resp.IsSuccessStatusCode)
        {
            _logger.LogWarning("Google Calendar create failed ({Status}): {Body}", resp.StatusCode, body);
            throw new HttpRequestException($"Google Calendar create failed: {(int)resp.StatusCode} {body}");
        }
        return JsonSerializer.Deserialize<GoogleEventListItem>(body, JsonOpts)
               ?? throw new InvalidOperationException("Google returned an empty event.");
    }

    /// <summary>Fetch one event — used before updates so tags/reminders survive a merge.</summary>
    public async Task<GoogleEventListItem?> GetEventAsync(
        string accessToken, string calendarId, string googleEventId, CancellationToken ct = default)
    {
        using var req = new HttpRequestMessage(HttpMethod.Get,
            string.Format(EventsEndpoint, Uri.EscapeDataString(calendarId)) + "/" + googleEventId);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var resp = await _http.SendAsync(req, ct);
        if ((int)resp.StatusCode is 404 or 410) return null;
        var body = await resp.Content.ReadAsStringAsync(ct);
        if (!resp.IsSuccessStatusCode)
            throw new HttpRequestException($"Google Calendar get failed: {(int)resp.StatusCode}");
        return JsonSerializer.Deserialize<GoogleEventListItem>(body, JsonOpts);
    }

    /// <summary>PATCH-style update — only the fields set on <paramref name="evt"/> are sent.</summary>
    public async Task UpdateEventAsync(
        string accessToken, string calendarId, string googleEventId, GoogleCalendarEvent evt, CancellationToken ct = default)
    {
        using var req = new HttpRequestMessage(HttpMethod.Patch,
            string.Format(EventsEndpoint, Uri.EscapeDataString(calendarId)) + "/" + googleEventId);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        req.Content = JsonContent.Create(evt, options: JsonOpts);
        using var resp = await _http.SendAsync(req, ct);
        var body = await resp.Content.ReadAsStringAsync(ct);
        if (!resp.IsSuccessStatusCode)
            throw new HttpRequestException($"Google Calendar update failed: {(int)resp.StatusCode} {body}");
    }

    private async Task<GoogleTokenResponse> SendTokenRequest(Dictionary<string, string> form, CancellationToken ct)
    {
        using var resp = await _http.PostAsync(TokenEndpoint, new FormUrlEncodedContent(form), ct);
        var body = await resp.Content.ReadAsStringAsync(ct);
        if (!resp.IsSuccessStatusCode)
        {
            _logger.LogWarning("Google token endpoint failed ({Status}): {Body}", resp.StatusCode, body);
            throw new HttpRequestException($"Google token exchange failed: {(int)resp.StatusCode} {body}");
        }
        return JsonSerializer.Deserialize<GoogleTokenResponse>(body, JsonOpts)
               ?? throw new InvalidOperationException("Google returned an empty token response.");
    }
}
