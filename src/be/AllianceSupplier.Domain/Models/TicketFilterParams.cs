namespace AllianceSupplier.Domain.Models;

public record TicketFilterParams(
    Guid? UserId,
    bool IsManager,
    string? Status,
    bool? Overdue,
    string? Type,
    Guid? RequesterId,
    Guid? ConfirmedById,
    DateTime? DeadlineFrom,
    DateTime? DeadlineTo,
    string? Search,
    int Page,
    int PageSize
);
