namespace AllianceSupplier.Api.DTOs.Products;

public class CreateProductRequestDto
{
    public string Name { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public IFormFile? Image { get; set; }
}
