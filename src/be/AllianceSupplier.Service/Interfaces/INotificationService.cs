using AllianceSupplier.Domain.Entities;
using AllianceSupplier.Service.DTOs.Notifications;

namespace AllianceSupplier.Service.Interfaces;

public interface INotificationService
{
    Task NotifyTicketCreatedAsync(Ticket ticket);
    Task NotifyTicketConfirmedAsync(Ticket ticket);
    Task NotifyTicketDoneAsync(Ticket ticket);
    Task<List<NotificationDto>> GetUserNotificationsAsync(Guid userId, bool? unreadOnly);
    Task MarkReadAsync(Guid notifId, Guid userId);
    Task MarkAllReadAsync(Guid userId);
}
