using AllianceSupplier.Domain.Entities;
using AllianceSupplier.Domain.Interfaces.Repositories;
using AllianceSupplier.Domain.Interfaces.Services;
using AllianceSupplier.Service.DTOs.Products;
using AllianceSupplier.Service.Interfaces;

namespace AllianceSupplier.Service;

public class ProductService(
    IProductRepository repo,
    ICategoryRepository categoryRepo,
    IStorageService storage) : IProductService
{
    public async Task<IEnumerable<ProductDto>> GetAllAsync(Guid? categoryId = null)
    {
        var products = categoryId.HasValue
            ? await repo.GetByCategoryIdAsync(categoryId.Value)
            : await repo.GetAllAsync();

        return products.Select(p => new ProductDto(p.Id, p.Name, p.ImageUrl, p.CategoryId, p.Category?.Name ?? string.Empty));
    }

    public async Task<ProductDto> CreateAsync(CreateProductRequest request)
    {
        _ = await categoryRepo.GetByIdAsync(request.CategoryId)
            ?? throw new KeyNotFoundException($"Category {request.CategoryId} not found");

        string? imageUrl = null;
        if (request.Image is not null)
            imageUrl = await storage.UploadAsync(request.Image);

        var product = new Product
        {
            Name = request.Name,
            CategoryId = request.CategoryId,
            ImageUrl = imageUrl,
        };
        await repo.AddAsync(product);

        var saved = await repo.GetByIdAsync(product.Id)
            ?? throw new InvalidOperationException("Product not found after save");
        return new ProductDto(saved.Id, saved.Name, saved.ImageUrl, saved.CategoryId, saved.Category.Name);
    }

    public async Task<ProductDto> UpdateAsync(Guid id, UpdateProductRequest request)
    {
        var product = await repo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Product {id} not found");

        _ = await categoryRepo.GetByIdAsync(request.CategoryId)
            ?? throw new KeyNotFoundException($"Category {request.CategoryId} not found");

        if (request.Image is not null)
        {
            if (product.ImageUrl is not null)
                await storage.DeleteAsync(product.ImageUrl);
            product.ImageUrl = await storage.UploadAsync(request.Image);
        }

        product.Name = request.Name;
        product.CategoryId = request.CategoryId;
        await repo.UpdateAsync(product);

        var saved = await repo.GetByIdAsync(product.Id)
            ?? throw new InvalidOperationException("Product not found after save");
        return new ProductDto(saved.Id, saved.Name, saved.ImageUrl, saved.CategoryId, saved.Category.Name);
    }

    public async Task DeleteAsync(Guid id)
    {
        var product = await repo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Product {id} not found");

        if (product.ImageUrl is not null)
            await storage.DeleteAsync(product.ImageUrl);

        await repo.DeleteAsync(id);
    }
}
