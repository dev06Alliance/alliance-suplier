using System.Text.Json;
using AllianceSupplier.Api.Exceptions;

namespace AllianceSupplier.Api.Middleware;

public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        try
        {
            await next(ctx);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");
            await WriteError(ctx, ex);
        }
    }

    private static Task WriteError(HttpContext ctx, Exception ex)
    {
        var (status, code) = ex switch
        {
            UnauthorizedException        => (401, "UNAUTHORIZED"),
            UnauthorizedAccessException  => (403, "FORBIDDEN"),
            ForbiddenException           => (403, "FORBIDDEN"),
            NotFoundException            => (404, "NOT_FOUND"),
            KeyNotFoundException         => (404, "NOT_FOUND"),
            ArgumentException            => (422, "VALIDATION_ERROR"),
            _                            => (500, "INTERNAL_ERROR")
        };

        ctx.Response.StatusCode = status;
        ctx.Response.ContentType = "application/json";

        var body = JsonSerializer.Serialize(new
        {
            success = false,
            error = new { code, message = ex.Message }
        });

        return ctx.Response.WriteAsync(body);
    }
}
