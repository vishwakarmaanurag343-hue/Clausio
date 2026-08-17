using Amazon.S3;
using Amazon.SQS;
using Clausio.Legal.Infrastructure.Queue;
using Clausio.Legal.API.Middleware;
using Clausio.Legal.Cache;
using Clausio.Legal.Core.Settings;
using Clausio.Legal.Infrastructure;
using Clausio.Legal.Infrastructure.Ai.Providers;
using Clausio.Legal.Infrastructure.Ai.Router;
using Clausio.Legal.Core.Interfaces.AI;
using Clausio.Legal.Infrastructure.Extraction;
using Clausio.Legal.Infrastructure.Storage;
using Clausio.Legal.Service;
using Clausio.Legal.Service.AI;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using Clausio.MCP.Configuration;

var builder = WebApplication.CreateBuilder(args);

// Controllers with JSON fix
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition =
            System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// JWT Settings
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));

// Database with vector support and connection pooling
builder.Services.AddDbContext<ClausioDbContext>(options =>
{
    var connString = builder.Configuration.GetConnectionString("Default");
    // Ensure connection pool limits
    if (!string.IsNullOrEmpty(connString) && !connString.Contains("Maximum Pool Size", StringComparison.OrdinalIgnoreCase))
    {
        connString += ";Maximum Pool Size=30;Minimum Pool Size=2;";
    }
    options.UseNpgsql(connString, o => o.UseVector());
});

// Second Sensitive Database (PII Token Vault)
builder.Services.AddDbContext<Clausio.Legal.Infrastructure.Security.SensitiveDbContext>(options =>
{
    var sensConnString = builder.Configuration.GetConnectionString("SensitiveDb")
                         ?? builder.Configuration.GetConnectionString("Default");
    if (!string.IsNullOrEmpty(sensConnString) && !sensConnString.Contains("Maximum Pool Size", StringComparison.OrdinalIgnoreCase))
    {
        sensConnString += ";Maximum Pool Size=20;Minimum Pool Size=2;";
    }
    options.UseNpgsql(sensConnString);
});

// Security & PII Token Services
builder.Services.AddSingleton<Clausio.Legal.Service.Security.IEncryptionService, Clausio.Legal.Service.Security.AesEncryptionService>();
builder.Services.AddScoped<Clausio.Legal.Service.Security.IPiiTokenService, Clausio.Legal.Service.Security.PiiTokenService>();

// Health Checks
builder.Services.AddHealthChecks();

// Cache
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<ICacheService, MemoryCacheService>();

// Storage & AWS Queue setup
var useS3 = !string.IsNullOrEmpty(builder.Configuration["AWS:S3BucketName"]) 
            && !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("AWS_ACCESS_KEY_ID"));

if (useS3)
{
    builder.Services.AddDefaultAWSOptions(builder.Configuration.GetAWSOptions());
    builder.Services.AddAWSService<IAmazonS3>();
    builder.Services.AddSingleton<IDocumentStorage>(sp =>
    {
        var s3 = sp.GetRequiredService<IAmazonS3>();
        var bucketName = builder.Configuration["AWS:S3BucketName"]!;
        return new S3DocumentStorage(s3, bucketName);
    });

    builder.Services.AddAWSService<IAmazonSQS>();
    builder.Services.AddSingleton<IAiJobQueueService, SqsAiJobQueueService>();
    builder.Services.AddHostedService<OcrJobWorker>();
}
else
{
    var uploadPath = Path.Combine(builder.Environment.ContentRootPath, "uploads");
    Directory.CreateDirectory(uploadPath);
    builder.Services.AddSingleton<IDocumentStorage>(new LocalDiskDocumentStorage(uploadPath));
    builder.Services.AddSingleton<IAiJobQueueService, NullAiJobQueueService>();
}

builder.Services.AddHttpClient("VoiceService", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["VoiceService:BaseUrl"] ?? "http://voice-backend:8000");
});

// OCR & Document text extraction
builder.Services.AddScoped<Clausio.Legal.Core.Interfaces.OCR.IOCRProvider, Clausio.Legal.Infrastructure.OCR.PaddleOCRProvider>();
builder.Services.AddScoped<IDocumentTextExtractionStrategy, TxtExtractionStrategy>();
builder.Services.AddScoped<IDocumentTextExtractionStrategy, OcrExtractionStrategy>();
builder.Services.AddScoped<IDocumentTextExtractor, DocumentTextExtractor>();

// MCP Server Integration
builder.Services.AddClausioMcp();

// AI
builder.Services.AddHttpClient<Clausio.Legal.Infrastructure.Ai.Providers.TokenRouterProvider>();
builder.Services.AddHttpClient<Clausio.Legal.Infrastructure.Ai.Providers.OpenRouterProvider>();
builder.Services.AddHttpClient<Clausio.Legal.Infrastructure.Ai.Providers.OpenAIEmbeddingProvider>();

builder.Services.AddScoped<Clausio.Legal.Infrastructure.Ai.Providers.TokenRouterProvider>();
builder.Services.AddScoped<Clausio.Legal.Infrastructure.Ai.Providers.OpenRouterProvider>();
builder.Services.AddScoped<Clausio.Legal.Core.Interfaces.Embedding.IEmbeddingProvider, Clausio.Legal.Infrastructure.Ai.Providers.OpenAIEmbeddingProvider>();
builder.Services.AddScoped<ILLMProvider>(sp => sp.GetRequiredService<Clausio.Legal.Infrastructure.Ai.Providers.TokenRouterProvider>());
builder.Services.AddScoped<IAIRouter, AIRouter>();
builder.Services.AddSingleton<AiResponseParser>();

builder.Services.AddScoped<Clausio.Legal.Core.Interfaces.Retrieval.IChunkProcessor, Clausio.Legal.Service.Retrieval.Chunking.ChunkProcessor>();
builder.Services.AddScoped<Clausio.Legal.Core.Interfaces.Retrieval.IRetriever, Clausio.Legal.Infrastructure.Vector.PgVectorRetriever>();
builder.Services.AddScoped<Clausio.Legal.Core.Interfaces.Retrieval.IChunkRanker, Clausio.Legal.Service.Retrieval.Ranking.ChunkRanker>();
builder.Services.AddScoped<Clausio.Legal.Core.Interfaces.Retrieval.IBM25Retriever, Clausio.Legal.Service.Retrieval.Hybrid.BM25Retriever>();
builder.Services.AddScoped<Clausio.Legal.Core.Interfaces.Retrieval.IHybridRetriever, Clausio.Legal.Service.Retrieval.Hybrid.HybridRetriever>();
builder.Services.AddScoped<Clausio.Legal.Core.Interfaces.Retrieval.ICitationExtractor, Clausio.Legal.Service.Retrieval.Citation.CitationExtractor>();
// builder.Services.AddScoped<Clausio.Legal.Core.Interfaces.Retrieval.ICitationVerifier, Clausio.Legal.Service.Retrieval.Citation.CitationVerifier>(); // Replaced
builder.Services.AddScoped<Clausio.Legal.Core.Interfaces.Retrieval.IRetrievalEngine, Clausio.Legal.Service.Retrieval.RetrievalEngine>();

builder.Services.AddScoped<Clausio.Legal.Core.Interfaces.Memory.IMemoryStore, Clausio.Legal.Service.Memory.MemoryStore>();
builder.Services.AddScoped<Clausio.Legal.Core.Interfaces.Memory.IContextEngine, Clausio.Legal.Service.Memory.ContextEngine>();
builder.Services.AddScoped<Clausio.Legal.Core.Interfaces.Retrieval.IContextRanker, Clausio.Legal.Service.Retrieval.ContextRanking.ContextRanker>();

builder.Services.AddScoped<Clausio.Legal.Core.Interfaces.OCR.IOCRProvider, Clausio.Legal.Infrastructure.OCR.PaddleOCRProvider>();
builder.Services.AddScoped<Clausio.Legal.Service.DocumentIntelligence.LayoutAnalyzer>();
builder.Services.AddScoped<Clausio.Legal.Service.DocumentIntelligence.ClauseDetector>();
builder.Services.AddScoped<Clausio.Legal.Service.DocumentIntelligence.TableExtractor>();
builder.Services.AddScoped<Clausio.Legal.Service.DocumentIntelligence.IDocumentProcessor, Clausio.Legal.Service.DocumentIntelligence.DocumentProcessor>();

builder.Services.AddScoped<Clausio.Legal.Core.Interfaces.AI.IPromptBuilder, Clausio.Legal.Infrastructure.Ai.Prompts.PromptBuilder>();
builder.Services.AddScoped<Clausio.Legal.Core.Interfaces.AI.Validation.ICitationVerifier, Clausio.Legal.Service.AI.Validation.CitationVerifier>();
builder.Services.AddScoped<Clausio.Legal.Core.Interfaces.AI.Drafting.IDraftValidationPipeline, Clausio.Legal.Service.AI.Drafting.Validation.DraftValidationPipeline>();
builder.Services.AddScoped<Clausio.Legal.Core.Interfaces.AI.Drafting.IDraftEngine, Clausio.Legal.Service.AI.Drafting.DraftEngine>();
builder.Services.AddScoped<Clausio.Legal.Core.Interfaces.AI.Research.IDeepResearchPipeline, Clausio.Legal.Service.AI.Research.DeepResearchPipeline>();
builder.Services.AddScoped<Clausio.Legal.Core.Interfaces.AI.Evaluation.IAIEvaluator, Clausio.Legal.Service.AI.Evaluation.AIEvaluator>();
builder.Services.AddScoped<Clausio.Legal.Core.Interfaces.AI.Evaluation.ITelemetryService, Clausio.Legal.Service.AI.Evaluation.TelemetryService>();
builder.Services.AddScoped<Clausio.Legal.Core.Interfaces.AI.Security.IAISecurityLayer, Clausio.Legal.Service.AI.Security.AISecurityLayer>();
builder.Services.AddScoped<Clausio.Legal.Core.Interfaces.AI.Pipeline.IAIPipeline, Clausio.Legal.Service.AI.Pipeline.AIPipeline>();

// Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IClientService, ClientService>();
builder.Services.AddScoped<ICaseService, CaseService>();
builder.Services.AddScoped<IBillingService, BillingService>();
builder.Services.AddScoped<IActionPlanService, ActionPlanService>();
builder.Services.AddScoped<IContradictionService, ContradictionService>();
builder.Services.AddScoped<IDocumentService, DocumentService>();
builder.Services.AddScoped<IHearingService, HearingService>();
builder.Services.AddScoped<ILegalResearchService, LegalResearchService>();
builder.Services.AddScoped<ITimelineService, TimelineService>();
builder.Services.AddScoped<IReadinessService, ReadinessService>();
builder.Services.AddScoped<IStatsService, StatsService>();
builder.Services.AddScoped<IAiService, AiService>();

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(5),
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    builder.Configuration["Jwt:Secret"] ??
                    throw new InvalidOperationException("Jwt:Secret is not configured")
                )),
            NameClaimType = ClaimTypes.NameIdentifier,
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

var app = builder.Build();

// CORS must be first middleware in pipeline
app.UseCors("AllowFrontend");

// Middleware
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<RequestIdMiddleware>();
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseMiddleware<RateLimitingMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Clausio Legal API v1");
    c.RoutePrefix = "swagger";
});

app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<DeviceBindingMiddleware>();

// Health check endpoint for ALB / Docker
app.MapHealthChecks("/health");
app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.MapControllers();

// Auto database migration on startup (non-blocking log on dev/offline DB)
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ClausioDbContext>();
    await db.Database.MigrateAsync();

    var sensDb = scope.ServiceProvider.GetRequiredService<Clausio.Legal.Infrastructure.Security.SensitiveDbContext>();
    await sensDb.Database.EnsureCreatedAsync();
}
catch (Exception ex)
{
    var logger = app.Services.GetService<ILogger<Program>>();
    logger?.LogWarning(ex, "Database migration on startup skipped or failed: {Message}", ex.Message);
}

app.Run();
