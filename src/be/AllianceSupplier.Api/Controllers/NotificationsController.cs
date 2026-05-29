using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using AllianceSupplier.Service;
using AllianceSupplier.Service.DTOs.Notifications;
using AllianceSupplier.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace AllianceSupplier.Api.Controllers;

[Authorize]
public class NotificationsController(
    INotificationService notificationService,
    SseManager sseManager,
    IConfiguration configuration
) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool? unread)
    {
        var userId = GetCurrentUserId();
        var notifications = await notificationService.GetUserNotificationsAsync(userId, unread);
        return ApiOk(notifications);
    }

    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id)
    {
        var userId = GetCurrentUserId();
        await notificationService.MarkReadAsync(id, userId);
        return ApiOk(new { });
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        var userId = GetCurrentUserId();
        await notificationService.MarkAllReadAsync(userId);
        return ApiOk(new { });
    }

    [AllowAnonymous]
    [HttpGet("stream")]
    public async Task Stream([FromQuery] string token, CancellationToken ct)
    {
        var userId = ValidateToken(token);
        if (userId == Guid.Empty)
        {
            Response.StatusCode = 401;
            await Response.WriteAsync("Unauthorized");
            return;
        }

        Response.Headers["Content-Type"] = "text/event-stream";
        Response.Headers["Cache-Control"] = "no-cache";
        Response.Headers["Connection"] = "keep-alive";
        Response.Headers["X-Accel-Buffering"] = "no";

        sseManager.AddConnection(userId, Response);

        try
        {
            var heartbeat = JsonSerializer.Serialize(new SseEvent("connected", new { }));
            var bytes = Encoding.UTF8.GetBytes($"data: {heartbeat}\n\n");
            await Response.Body.WriteAsync(bytes, ct);
            await Response.Body.FlushAsync(ct);

            await Task.Delay(Timeout.Infinite, ct);
        }
        catch (OperationCanceledException)
        {
            // Client disconnected — normal exit
        }
        finally
        {
            sseManager.RemoveConnection(userId);
        }
    }

    private Guid ValidateToken(string token)
    {
        try
        {
            var key = configuration["Jwt:Key"]!;
            var handler = new JwtSecurityTokenHandler();
            var validationParams = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = configuration["Jwt:Issuer"],
                ValidAudience = configuration["Jwt:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                ClockSkew = TimeSpan.Zero,
            };

            var principal = handler.ValidateToken(token, validationParams, out _);
            var idClaim = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            return idClaim != null ? Guid.Parse(idClaim) : Guid.Empty;
        }
        catch
        {
            return Guid.Empty;
        }
    }
}
