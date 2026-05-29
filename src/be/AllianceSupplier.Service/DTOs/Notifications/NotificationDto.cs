namespace AllianceSupplier.Service.DTOs.Notifications;

public record NotificationDto(
    Guid Id,
    string Type,
    bool IsRead,
    DateTime CreatedAt,
    object Payload
);
