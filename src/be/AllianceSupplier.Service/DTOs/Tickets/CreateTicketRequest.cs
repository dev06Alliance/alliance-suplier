using AllianceSupplier.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace AllianceSupplier.Service.DTOs.Tickets;

public record CreateTicketRequest(
    TicketType Type,
    DateTime Deadline,
    Guid? ProductId,
    string? FreeTextDesc,
    IFormFile? Image
);
