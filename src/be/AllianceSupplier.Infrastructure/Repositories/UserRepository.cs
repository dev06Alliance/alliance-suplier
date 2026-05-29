using AllianceSupplier.Domain.Entities;
using AllianceSupplier.Domain.Enums;
using AllianceSupplier.Domain.Interfaces.Repositories;
using AllianceSupplier.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AllianceSupplier.Infrastructure.Repositories;

public class UserRepository(AppDbContext db) : IUserRepository
{
    public Task<User?> GetByUsernameAsync(string username) =>
        db.Users.FirstOrDefaultAsync(u => u.Username == username);

    public Task<User?> GetByIdAsync(Guid id) => db.Users.FindAsync(id).AsTask();

    public async Task<IEnumerable<User>> GetAllManagersAsync() =>
        await db.Users.Where(u => u.Role == Role.Manager).ToListAsync();
}
