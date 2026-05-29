using AllianceSupplier.Domain.Entities;
using AllianceSupplier.Domain.Interfaces.Repositories;
using AllianceSupplier.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AllianceSupplier.Infrastructure.Repositories;

public class DeadlineHistoryRepository(AppDbContext db) : IDeadlineHistoryRepository
{
    public async Task<IEnumerable<DeadlineHistory>> GetByTicketIdAsync(Guid ticketId) =>
        await db
            .DeadlineHistories.Where(d => d.TicketId == ticketId)
            .OrderByDescending(d => d.ChangedAt)
            .ToListAsync();

    public async Task AddAsync(DeadlineHistory entry)
    {
        entry.Id = Guid.NewGuid();
        await db.DeadlineHistories.AddAsync(entry);
        await db.SaveChangesAsync();
    }
}
