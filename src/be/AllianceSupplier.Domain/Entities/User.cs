using AllianceSupplier.Domain.Enums;

namespace AllianceSupplier.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Role Role { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Ticket> RequestedTickets { get; set; } = [];
    public ICollection<Ticket> ConfirmedTickets { get; set; } = [];
    public ICollection<Notification> Notifications { get; set; } = [];
    public ICollection<DeadlineHistory> DeadlineChanges { get; set; } = [];
}
