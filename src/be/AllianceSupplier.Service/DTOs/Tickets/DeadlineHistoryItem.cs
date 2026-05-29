using AllianceSupplier.Service.DTOs.Shared;

namespace AllianceSupplier.Service.DTOs.Tickets;

public record DeadlineHistoryItem(
    Guid Id,
    DateTime OldDeadline,
    DateTime NewDeadline,
    string Reason,
    UserRef ChangedBy,
    DateTime ChangedAt
);
