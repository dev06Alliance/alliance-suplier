namespace AllianceSupplier.Service.DTOs.Tickets;

public record ExtendDeadlineRequest(DateTime NewDeadline, string Reason);
