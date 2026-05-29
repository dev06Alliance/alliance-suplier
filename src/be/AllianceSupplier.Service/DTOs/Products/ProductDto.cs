using Microsoft.AspNetCore.Http;

namespace AllianceSupplier.Service.DTOs.Products;

public record ProductDto(Guid Id, string Name, string? ImageUrl, Guid CategoryId, string CategoryName);
public record CreateProductRequest(string Name, Guid CategoryId, IFormFile? Image);
public record UpdateProductRequest(string Name, Guid CategoryId, IFormFile? Image);
