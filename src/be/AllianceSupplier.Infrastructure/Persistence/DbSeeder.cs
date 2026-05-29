using AllianceSupplier.Domain.Entities;
using AllianceSupplier.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace AllianceSupplier.Infrastructure.Persistence;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Users.AnyAsync())
            return;

        var hash = BCrypt.Net.BCrypt.HashPassword("Password123!", workFactor: 12);

        var users = new[]
        {
            new User
            {
                Id = Guid.NewGuid(),
                Username = "admin",
                Name = "Admin",
                Role = Role.Admin,
                PasswordHash = hash,
            },
            new User
            {
                Id = Guid.NewGuid(),
                Username = "manager1",
                Name = "Manager 1",
                Role = Role.Manager,
                PasswordHash = hash,
            },
            new User
            {
                Id = Guid.NewGuid(),
                Username = "manager2",
                Name = "Manager 2",
                Role = Role.Manager,
                PasswordHash = hash,
            },
            new User
            {
                Id = Guid.NewGuid(),
                Username = "user1",
                Name = "User 1",
                Role = Role.User,
                PasswordHash = hash,
            },
            new User
            {
                Id = Guid.NewGuid(),
                Username = "user2",
                Name = "User 2",
                Role = Role.User,
                PasswordHash = hash,
            },
        };

        var categories = new[]
        {
            new Category { Id = Guid.NewGuid(), Name = "Văn phòng phẩm" },
            new Category { Id = Guid.NewGuid(), Name = "Thiết bị điện tử" },
        };

        var products = new[]
        {
            new Product
            {
                Id = Guid.NewGuid(),
                Name = "Bút bi",
                CategoryId = categories[0].Id,
            },
            new Product
            {
                Id = Guid.NewGuid(),
                Name = "Máy tính",
                CategoryId = categories[1].Id,
            },
        };

        await db.Users.AddRangeAsync(users);
        await db.Categories.AddRangeAsync(categories);
        await db.Products.AddRangeAsync(products);
        await db.SaveChangesAsync();
    }
}
