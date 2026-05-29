using AllianceSupplier.Service.DTOs.Shared;

namespace AllianceSupplier.Service.DTOs.Tickets;

public record TicketListItem(
    Guid Id,
    string Type,
    string Status,
    DateTime Deadline,
    bool IsOverdue,
    ProductRef? Product,
    string? FreeTextDesc,
    string? ImageUrl,
    UserRef Requester,
    DateTime CreatedAt
);
