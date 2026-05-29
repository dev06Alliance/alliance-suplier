using AllianceSupplier.Service.DTOs.Shared;

namespace AllianceSupplier.Service.DTOs.Tickets;

public record TicketDetail(
    Guid Id,
    string Type,
    string Status,
    DateTime Deadline,
    bool IsOverdue,
    ProductRef? Product,
    string? FreeTextDesc,
    string? ImageUrl,
    UserRef Requester,
    UserRef? ConfirmedBy,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IEnumerable<DeadlineHistoryItem>? DeadlineHistory
);
