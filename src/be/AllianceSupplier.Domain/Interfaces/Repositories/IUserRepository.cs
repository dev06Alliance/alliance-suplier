using AllianceSupplier.Domain.Entities;

namespace AllianceSupplier.Domain.Interfaces.Repositories;

public interface IUserRepository
{
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByIdAsync(Guid id);
    Task<IEnumerable<User>> GetAllManagersAsync();
}
