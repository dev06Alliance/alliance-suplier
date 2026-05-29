using AllianceSupplier.Service.DTOs.Categories;

namespace AllianceSupplier.Service.Interfaces;

public interface ICategoryService
{
    Task<IEnumerable<CategoryDto>> GetAllAsync();
    Task<CategoryDto> CreateAsync(CreateCategoryRequest request);
    Task<CategoryDto> UpdateAsync(Guid id, UpdateCategoryRequest request);
    Task DeleteAsync(Guid id);
}
