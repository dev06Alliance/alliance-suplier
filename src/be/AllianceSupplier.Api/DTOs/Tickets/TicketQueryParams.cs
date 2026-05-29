namespace AllianceSupplier.Api.DTOs.Tickets;

public record TicketQueryParams(
    string? Status = null,
    bool? Overdue = null,
    string? Type = null,
    Guid? RequesterId = null,
    Guid? ConfirmedById = null,
    DateTime? DeadlineFrom = null,
    DateTime? DeadlineTo = null,
    string? Search = null,
    int Page = 1,
    int PageSize = 10
);
