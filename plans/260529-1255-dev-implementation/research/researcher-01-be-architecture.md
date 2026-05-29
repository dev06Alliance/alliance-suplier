# BE Architecture Research — Clean Architecture .NET 10 Web API

**Date**: 2026-05-29
**Project**: Alliance Supplier (`src/be` — single .csproj, net10.0, Npgsql EF Core 10, PostgreSQL)

---

## 1. Project Structure — 4-Layer Clean Architecture

Single-project layout (no multi-project solution needed for this scale):

```
src/be/
├── Domain/
│   ├── Entities/          # POCOs — no EF/infra dependencies
│   │   └── Supplier.cs
│   ├── Enums/
│   └── Interfaces/        # ISupplierRepository, IUnitOfWork
│
├── Infrastructure/
│   ├── Data/
│   │   ├── AppDbContext.cs
│   │   └── Configurations/  # IEntityTypeConfiguration<T> per entity
│   │       └── SupplierConfiguration.cs
│   ├── Repositories/      # SupplierRepository : ISupplierRepository
│   └── UnitOfWork.cs
│
├── Services/              # (Application/Service layer)
│   ├── Interfaces/        # ISupplierService
│   ├── Implementations/   # SupplierService
│   ├── DTOs/              # SupplierDto, CreateSupplierRequest
│   └── Validators/        # CreateSupplierRequestValidator (FluentValidation)
│
├── Api/
│   ├── Controllers/       # SuppliersController
│   ├── Middleware/        # ExceptionMiddleware, SseConnectionManager
│   └── Extensions/        # ServiceCollectionExtensions, AppExtensions
│
├── Program.cs
└── appsettings.json
```

**DI registration**: each layer exposes `AddDomainServices`, `AddInfrastructure`, `AddApplicationServices` extension methods called from `Program.cs`.

---

## 2. EF Core 10 + PostgreSQL — Fluent API Patterns

**NuGet** (already in .csproj):
- `Npgsql.EntityFrameworkCore.PostgreSQL` v10.0.2
- `Microsoft.EntityFrameworkCore.Design` v10.0.8

### AppDbContext

```csharp
// Infrastructure/Data/AppDbContext.cs
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Supplier> Suppliers => Set<Supplier>();

    protected override void OnModelCreating(ModelBuilder mb)
        => mb.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
}
```

### Entity Configuration (Fluent API)

```csharp
// Infrastructure/Data/Configurations/SupplierConfiguration.cs
public class SupplierConfiguration : IEntityTypeConfiguration<Supplier>
{
    public void Configure(EntityTypeBuilder<Supplier> b)
    {
        b.ToTable("suppliers");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
        b.Property(x => x.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
        b.Property(x => x.Email).HasColumnName("email").HasMaxLength(255).IsRequired();
        b.Property(x => x.CreatedAt).HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");
        b.HasIndex(x => x.Email).IsUnique();
    }
}
```

### Registration in Program.cs

```csharp
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
```

---

## 3. JWT Bearer Authentication + HttpOnly Cookie Refresh Token

**NuGet to add**:
- `Microsoft.AspNetCore.Authentication.JwtBearer` v10.x

### appsettings.json addition

```json
"Jwt": {
  "Key": "your-256-bit-secret-key-here-32chars",
  "Issuer": "AllianceSupplier",
  "Audience": "AllianceSupplierClient",
  "AccessTokenExpiryMinutes": 15,
  "RefreshTokenExpiryDays": 7
}
```

### Service registration

```csharp
// Api/Extensions/AuthExtensions.cs
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        var jwt = builder.Configuration.GetSection("Jwt");
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwt["Key"]!)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();
```

### Refresh token via HttpOnly cookie

```csharp
// In AuthController.Login / AuthController.Refresh
Response.Cookies.Append("refresh_token", refreshTokenValue, new CookieOptions
{
    HttpOnly = true,
    Secure = true,         // HTTPS only in prod
    SameSite = SameSiteMode.Strict,
    Expires = DateTimeOffset.UtcNow.AddDays(7)
});
```

```csharp
// Reading refresh token
var refreshToken = Request.Cookies["refresh_token"];
```

### Key interfaces/classes
- `ITokenService` → `TokenService` (generates/validates JWT + refresh tokens)
- `IRefreshTokenRepository` → stores hashed refresh tokens in DB
- `[Authorize]` attribute on controllers / minimal API groups

---

## 4. SSE — ConcurrentDictionary Connection Manager

**No NuGet needed** — built into ASP.NET Core.

### SseConnectionManager

```csharp
// Api/Middleware/SseConnectionManager.cs
public class SseConnectionManager
{
    private readonly ConcurrentDictionary<string, HttpResponse> _connections = new();

    public void AddConnection(string connectionId, HttpResponse response)
        => _connections[connectionId] = response;

    public void RemoveConnection(string connectionId)
        => _connections.TryRemove(connectionId, out _);

    public async Task BroadcastAsync(string eventName, string data, CancellationToken ct = default)
    {
        foreach (var (id, response) in _connections)
        {
            try
            {
                await response.WriteAsync($"event: {eventName}\ndata: {data}\n\n", ct);
                await response.Body.FlushAsync(ct);
            }
            catch
            {
                RemoveConnection(id);
            }
        }
    }

    public async Task SendToClientAsync(string connectionId, string eventName, string data,
        CancellationToken ct = default)
    {
        if (_connections.TryGetValue(connectionId, out var response))
        {
            await response.WriteAsync($"event: {eventName}\ndata: {data}\n\n", ct);
            await response.Body.FlushAsync(ct);
        }
    }
}
```

### SSE Endpoint (minimal API or controller)

```csharp
// In Program.cs or SseController
app.MapGet("/api/events", async (HttpContext ctx, SseConnectionManager mgr,
    CancellationToken ct) =>
{
    ctx.Response.Headers.ContentType = "text/event-stream";
    ctx.Response.Headers.CacheControl = "no-cache";
    ctx.Response.Headers.Connection = "keep-alive";

    var connId = Guid.NewGuid().ToString();
    mgr.AddConnection(connId, ctx.Response);

    await ctx.Response.WriteAsync($"data: connected\n\n", ct);
    await ctx.Response.Body.FlushAsync(ct);

    try { await Task.Delay(Timeout.Infinite, ct); }
    catch (OperationCanceledException) { }
    finally { mgr.RemoveConnection(connId); }
});
```

### DI registration

```csharp
builder.Services.AddSingleton<SseConnectionManager>();
```

---

## 5. FluentValidation Integration

**NuGet to add**:
- `FluentValidation.AspNetCore` v11.x  
  (Note: In .NET 10, use `FluentValidation.DependencyInjectionExtensions` + manual validation pipeline)

### Validator definition

```csharp
// Services/Validators/CreateSupplierRequestValidator.cs
public class CreateSupplierRequestValidator : AbstractValidator<CreateSupplierRequest>
{
    public CreateSupplierRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(255);
        RuleFor(x => x.Phone).Matches(@"^\+?[0-9]{10,15}$").When(x => x.Phone != null);
    }
}
```

### Registration (assembly scan)

```csharp
// In AddApplicationServices extension
services.AddValidatorsFromAssemblyContaining<CreateSupplierRequestValidator>();
```

### Usage in service layer (recommended over filter)

```csharp
public async Task<SupplierDto> CreateAsync(CreateSupplierRequest req)
{
    var result = await _validator.ValidateAsync(req);
    if (!result.IsValid)
        throw new ValidationException(result.Errors);
    // ...
}
```

---

## 6. Global Exception Middleware

Returns uniform `{ success, error: { code, message } }`.

### Response models

```csharp
// Domain or Api layer
public record ApiResponse<T>(bool Success, T? Data, ApiError? Error);
public record ApiError(string Code, string Message);
```

### Middleware

```csharp
// Api/Middleware/ExceptionMiddleware.cs
public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        try { await next(ctx); }
        catch (Exception ex) { await HandleAsync(ctx, ex); }
    }

    private async Task HandleAsync(HttpContext ctx, Exception ex)
    {
        logger.LogError(ex, "Unhandled exception");

        var (status, code, message) = ex switch
        {
            ValidationException ve  => (400, "VALIDATION_ERROR",
                string.Join("; ", ve.Errors.Select(e => e.ErrorMessage))),
            KeyNotFoundException    => (404, "NOT_FOUND", ex.Message),
            UnauthorizedAccessException => (401, "UNAUTHORIZED", "Unauthorized"),
            _                       => (500, "INTERNAL_ERROR", "An unexpected error occurred")
        };

        ctx.Response.StatusCode = status;
        ctx.Response.ContentType = "application/json";

        var body = new ApiResponse<object>(false, null, new ApiError(code, message));
        await ctx.Response.WriteAsJsonAsync(body);
    }
}
```

### Registration in Program.cs

```csharp
app.UseMiddleware<ExceptionMiddleware>(); // before UseAuthentication, UseAuthorization
```

### Success response helper (controller base)

```csharp
public class BaseController : ControllerBase
{
    protected IActionResult Ok<T>(T data) =>
        base.Ok(new ApiResponse<T>(true, data, null));
}
```

---

## NuGet Packages Summary

| Package | Version | Layer |
|---|---|---|
| `Npgsql.EntityFrameworkCore.PostgreSQL` | 10.0.2 | Infrastructure |
| `Microsoft.EntityFrameworkCore.Design` | 10.0.8 | Infrastructure |
| `Microsoft.AspNetCore.Authentication.JwtBearer` | 10.x | Api |
| `FluentValidation.DependencyInjectionExtensions` | 11.x | Services |
| `Microsoft.AspNetCore.OpenApi` | 10.0.8 | Api (existing) |

---

## Unresolved Questions

- Role-based auth scope: simple `[Authorize(Roles = "Admin")]` or policy-based (`IAuthorizationRequirement`)?
- Refresh token storage: in-DB table vs Redis (depends on scale)?
- SSE per-user auth: pass JWT as query param or use cookie for SSE endpoint (browsers can't set headers)?
- Multi-project solution (.sln) vs single-project with folder separation — confirm preference before scaffolding.
