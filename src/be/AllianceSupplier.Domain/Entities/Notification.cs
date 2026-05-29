using System.Text.Json;
using AllianceSupplier.Domain.Enums;

namespace AllianceSupplier.Domain.Entities;

public class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public NotifType Type { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Neutral payload — not tied to any specific entity FK
    public JsonDocument Payload { get; set; } = JsonDocument.Parse("{}");

    public User User { get; set; } = null!;
}
