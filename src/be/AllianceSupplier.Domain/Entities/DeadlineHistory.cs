namespace AllianceSupplier.Domain.Entities;

public class DeadlineHistory
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public DateTime OldDeadline { get; set; }
    public DateTime NewDeadline { get; set; }
    public string Reason { get; set; } = string.Empty;
    public Guid ChangedById { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

    public Ticket Ticket { get; set; } = null!;
    public User ChangedBy { get; set; } = null!;
}
