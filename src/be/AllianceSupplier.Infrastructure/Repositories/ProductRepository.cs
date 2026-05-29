using AllianceSupplier.Domain.Entities;
using AllianceSupplier.Domain.Interfaces.Repositories;
using AllianceSupplier.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AllianceSupplier.Infrastructure.Repositories;

public class ProductRepository(AppDbContext db) : IProductRepository
{
    public async Task<IEnumerable<Product>> GetAllAsync() =>
        await db.Products.Include(p => p.Category).ToListAsync();

    public async Task<IEnumerable<Product>> GetByCategoryIdAsync(Guid categoryId) =>
        await db.Products.Where(p => p.CategoryId == categoryId).ToListAsync();

    public Task<Product?> GetByIdAsync(Guid id) =>
        db.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id);

    public async Task AddAsync(Product product)
    {
        product.Id = Guid.NewGuid();
        await db.Products.AddAsync(product);
        await db.SaveChangesAsync();
    }

    public async Task UpdateAsync(Product product)
    {
        db.Products.Update(product);
        await db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var p = await db.Products.FindAsync(id);
        if (p is not null)
        {
            db.Products.Remove(p);
            await db.SaveChangesAsync();
        }
    }
}
