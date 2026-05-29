namespace AllianceSupplier.Api.DTOs.Tickets;

public record ExtendDeadlineRequestDto(DateTime NewDeadline, string Reason);
