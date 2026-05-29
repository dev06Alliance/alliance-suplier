using AllianceSupplier.Domain.Entities;

namespace AllianceSupplier.Domain.Interfaces.Repositories;

public interface INotificationRepository
{
    Task<IEnumerable<Notification>> GetByUserIdAsync(Guid userId);
    Task AddAsync(Notification notification);
    Task MarkReadAsync(Guid id);
    Task MarkAllReadAsync(Guid userId);
    Task<int> GetUnreadCountAsync(Guid userId);
}
