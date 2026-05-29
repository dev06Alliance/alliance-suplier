using AllianceSupplier.Domain.Entities;
using AllianceSupplier.Domain.Interfaces.Repositories;
using AllianceSupplier.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AllianceSupplier.Infrastructure.Repositories;

public class NotificationRepository(AppDbContext db) : INotificationRepository
{
    public async Task<IEnumerable<Notification>> GetByUserIdAsync(Guid userId) =>
        await db
            .Notifications.Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

    public async Task AddAsync(Notification notification)
    {
        notification.Id = Guid.NewGuid();
        await db.Notifications.AddAsync(notification);
        await db.SaveChangesAsync();
    }

    public async Task MarkReadAsync(Guid id)
    {
        await db
            .Notifications.Where(n => n.Id == id)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
    }

    public async Task MarkAllReadAsync(Guid userId)
    {
        await db
            .Notifications.Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
    }

    public Task<int> GetUnreadCountAsync(Guid userId) =>
        db.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);
}
