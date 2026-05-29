using AllianceSupplier.Domain.Enums;

namespace AllianceSupplier.Domain.Entities;

public class Ticket
{
    public Guid Id { get; set; }
    public TicketType Type { get; set; }
    public TicketStatus Status { get; set; } = TicketStatus.Pending;
    public Guid? ProductId { get; set; }
    public string? FreeTextDesc { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime Deadline { get; set; }
    public Guid RequesterId { get; set; }
    public Guid? ConfirmedById { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Product? Product { get; set; }
    public User Requester { get; set; } = null!;
    public User? ConfirmedBy { get; set; }
    public ICollection<DeadlineHistory> DeadlineHistories { get; set; } = [];
}
