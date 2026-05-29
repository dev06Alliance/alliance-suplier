using AllianceSupplier.Service.DTOs.Products;

namespace AllianceSupplier.Service.Interfaces;

public interface IProductService
{
    Task<IEnumerable<ProductDto>> GetAllAsync(Guid? categoryId = null);
    Task<ProductDto> CreateAsync(CreateProductRequest request);
    Task<ProductDto> UpdateAsync(Guid id, UpdateProductRequest request);
    Task DeleteAsync(Guid id);
}
