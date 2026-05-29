using AllianceSupplier.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace AllianceSupplier.Api.DTOs.Tickets;

public class CreateTicketRequestDto
{
    public string Type { get; set; } = string.Empty;
    public DateTime Deadline { get; set; }
    public Guid? ProductId { get; set; }
    public string? FreeTextDesc { get; set; }
    public IFormFile? Image { get; set; }

    public TicketType ParsedType => Enum.Parse<TicketType>(Type, ignoreCase: true);
}
