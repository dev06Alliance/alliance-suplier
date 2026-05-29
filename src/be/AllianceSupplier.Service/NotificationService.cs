using System.Text.Json;
using AllianceSupplier.Domain.Entities;
using AllianceSupplier.Domain.Enums;
using AllianceSupplier.Domain.Interfaces.Repositories;
using AllianceSupplier.Service.DTOs.Notifications;
using AllianceSupplier.Service.Interfaces;

namespace AllianceSupplier.Service;

public class NotificationService(
    INotificationRepository notificationRepo,
    IUserRepository userRepo,
    SseManager sseManager
) : INotificationService
{
    public async Task NotifyTicketCreatedAsync(Ticket ticket)
    {
        var managers = await userRepo.GetAllManagersAsync();
        var payload = new
        {
            ticketId = ticket.Id,
            ticketType = ticket.Type.ToString(),
            requesterName = ticket.Requester.Name,
        };
        foreach (var manager in managers)
            await CreateAndPushAsync(manager.Id, NotifType.TicketCreated, payload);
    }

    public async Task NotifyTicketConfirmedAsync(Ticket ticket)
    {
        var payload = BuildTicketPayload(ticket);
        await CreateAndPushAsync(ticket.RequesterId, NotifType.TicketConfirmed, payload);
    }

    public async Task NotifyTicketDoneAsync(Ticket ticket)
    {
        var payload = BuildTicketPayload(ticket);
        await CreateAndPushAsync(ticket.RequesterId, NotifType.TicketDone, payload);
    }

    public async Task<List<NotificationDto>> GetUserNotificationsAsync(Guid userId, bool? unreadOnly)
    {
        var notifications = await notificationRepo.GetByUserIdAsync(userId);
        if (unreadOnly == true)
            notifications = notifications.Where(n => !n.IsRead);

        return notifications
            .Select(n => new NotificationDto(
                n.Id,
                n.Type.ToString(),
                n.IsRead,
                n.CreatedAt,
                n.Payload.Deserialize<object>()!
            ))
            .ToList();
    }

    public async Task MarkReadAsync(Guid notifId, Guid userId)
    {
        var notifications = await notificationRepo.GetByUserIdAsync(userId);
        var notif = notifications.FirstOrDefault(n => n.Id == notifId)
            ?? throw new KeyNotFoundException($"Notification {notifId} not found");

        if (notif.UserId != userId)
            throw new UnauthorizedAccessException("Notification does not belong to current user");

        await notificationRepo.MarkReadAsync(notifId);
    }

    public Task MarkAllReadAsync(Guid userId) =>
        notificationRepo.MarkAllReadAsync(userId);

    private async Task CreateAndPushAsync(Guid userId, NotifType type, object payload)
    {
        var json = JsonSerializer.SerializeToDocument(payload);
        var notification = new Notification
        {
            UserId = userId,
            Type = type,
            Payload = json,
        };
        await notificationRepo.AddAsync(notification);

        var ssePayload = JsonSerializer.Serialize(new SseEvent(type.ToString(), payload));
        await sseManager.SendToUserAsync(userId, ssePayload);
    }

    private static object BuildTicketPayload(Ticket ticket)
    {
        if (ticket.Product != null)
            return new
            {
                ticketId = ticket.Id,
                ticketType = ticket.Type.ToString(),
                productName = ticket.Product.Name,
                productImageUrl = ticket.Product.ImageUrl,
                categoryName = ticket.Product.Category?.Name,
            };

        return new
        {
            ticketId = ticket.Id,
            ticketType = ticket.Type.ToString(),
            freeTextDesc = ticket.FreeTextDesc,
        };
    }
}
