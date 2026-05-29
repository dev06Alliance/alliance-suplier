namespace AllianceSupplier.Domain.Entities;

public class Product
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public Guid CategoryId { get; set; }

    public Category Category { get; set; } = null!;
    public ICollection<Ticket> Tickets { get; set; } = [];
}
