using AllianceSupplier.Domain.Entities;
using AllianceSupplier.Domain.Interfaces.Repositories;
using AllianceSupplier.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AllianceSupplier.Infrastructure.Repositories;

public class CategoryRepository(AppDbContext db) : ICategoryRepository
{
    public async Task<IEnumerable<Category>> GetAllAsync() => await db.Categories.ToListAsync();

    public Task<Category?> GetByIdAsync(Guid id) => db.Categories.FindAsync(id).AsTask();

    public async Task AddAsync(Category category)
    {
        category.Id = Guid.NewGuid();
        await db.Categories.AddAsync(category);
        await db.SaveChangesAsync();
    }

    public async Task UpdateAsync(Category category)
    {
        db.Categories.Update(category);
        await db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var cat = await db.Categories.FindAsync(id);
        if (cat is not null)
        {
            db.Categories.Remove(cat);
            await db.SaveChangesAsync();
        }
    }
}
