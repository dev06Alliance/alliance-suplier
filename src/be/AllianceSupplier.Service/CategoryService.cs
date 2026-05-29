using AllianceSupplier.Domain.Entities;
using AllianceSupplier.Domain.Interfaces.Repositories;
using AllianceSupplier.Service.DTOs.Categories;
using AllianceSupplier.Service.Interfaces;

namespace AllianceSupplier.Service;

public class CategoryService(ICategoryRepository repo, IProductRepository productRepo) : ICategoryService
{
    public async Task<IEnumerable<CategoryDto>> GetAllAsync()
    {
        var cats = await repo.GetAllAsync();
        return cats.Select(c => new CategoryDto(c.Id, c.Name));
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryRequest request)
    {
        var cat = new Category { Name = request.Name };
        await repo.AddAsync(cat);
        return new CategoryDto(cat.Id, cat.Name);
    }

    public async Task<CategoryDto> UpdateAsync(Guid id, UpdateCategoryRequest request)
    {
        var cat = await repo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Category {id} not found");
        cat.Name = request.Name;
        await repo.UpdateAsync(cat);
        return new CategoryDto(cat.Id, cat.Name);
    }

    public async Task DeleteAsync(Guid id)
    {
        _ = await repo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Category {id} not found");

        var products = await productRepo.GetByCategoryIdAsync(id);
        if (products.Any())
            throw new ArgumentException("Cannot delete category with existing products");

        await repo.DeleteAsync(id);
    }
}
