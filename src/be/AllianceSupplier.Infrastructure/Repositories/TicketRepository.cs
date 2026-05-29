using AllianceSupplier.Domain.Entities;
using AllianceSupplier.Domain.Enums;
using AllianceSupplier.Domain.Interfaces.Repositories;
using AllianceSupplier.Domain.Models;
using AllianceSupplier.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AllianceSupplier.Infrastructure.Repositories;

public class TicketRepository(AppDbContext db) : ITicketRepository
{
    public async Task<(IEnumerable<Ticket> items, int total)> GetAllAsync(TicketFilterParams filter)
    {
        var q = db.Tickets.AsQueryable();

        // Role-based filter: Users only see their own tickets
        if (!filter.IsManager && filter.UserId.HasValue)
            q = q.Where(t => t.RequesterId == filter.UserId.Value);

        // Manager-only filters
        if (filter.IsManager && filter.RequesterId.HasValue)
            q = q.Where(t => t.RequesterId == filter.RequesterId.Value);
        if (filter.IsManager && filter.ConfirmedById.HasValue)
            q = q.Where(t => t.ConfirmedById == filter.ConfirmedById.Value);

        // Status filter
        if (!string.IsNullOrWhiteSpace(filter.Status) && Enum.TryParse<TicketStatus>(filter.Status, true, out var status))
            q = q.Where(t => t.Status == status);

        // Type filter
        if (!string.IsNullOrWhiteSpace(filter.Type) && Enum.TryParse<TicketType>(filter.Type, true, out var type))
            q = q.Where(t => t.Type == type);

        // Overdue filter
        if (filter.Overdue == true)
            q = q.Where(t => t.Deadline < DateTime.UtcNow && t.Status != TicketStatus.Done);

        // Deadline range filters
        if (filter.DeadlineFrom.HasValue)
            q = q.Where(t => t.Deadline >= filter.DeadlineFrom.Value);
        if (filter.DeadlineTo.HasValue)
            q = q.Where(t => t.Deadline <= filter.DeadlineTo.Value);

        // Search: ILIKE on freeTextDesc or product name
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim();
            q = q.Where(t =>
                (t.FreeTextDesc != null && EF.Functions.ILike(t.FreeTextDesc, $"%{search}%")) ||
                (t.Product != null && EF.Functions.ILike(t.Product.Name, $"%{search}%")));
        }

        var total = await q.CountAsync();

        var skip = (filter.Page - 1) * filter.PageSize;
        var items = await q
            .Include(t => t.Requester)
            .Include(t => t.Product)
                .ThenInclude(p => p!.Category)
            .OrderByDescending(t => t.CreatedAt)
            .Skip(skip)
            .Take(filter.PageSize)
            .ToListAsync();

        return (items, total);
    }

    public Task<Ticket?> GetByIdAsync(Guid id) =>
        db.Tickets
            .Include(t => t.Requester)
            .Include(t => t.Product)
                .ThenInclude(p => p!.Category)
            .Include(t => t.ConfirmedBy)
            .Include(t => t.DeadlineHistories)
                .ThenInclude(dh => dh.ChangedBy)
            .FirstOrDefaultAsync(t => t.Id == id);

    public async Task AddAsync(Ticket ticket)
    {
        ticket.Id = Guid.NewGuid();
        await db.Tickets.AddAsync(ticket);
        await db.SaveChangesAsync();
    }

    public async Task UpdateAsync(Ticket ticket)
    {
        ticket.UpdatedAt = DateTime.UtcNow;
        db.Tickets.Update(ticket);
        await db.SaveChangesAsync();
    }

    public async Task<(int total, int confirmed, int done)> GetCountsByStatusAsync(DateTime? from, DateTime? to)
    {
        var q = db.Tickets.AsQueryable();
        if (from.HasValue)
            q = q.Where(t => t.CreatedAt >= from.Value);
        if (to.HasValue)
            q = q.Where(t => t.CreatedAt <= to.Value);

        var total = await q.CountAsync();
        var confirmed = await q.CountAsync(t => t.Status == TicketStatus.Confirmed);
        var done = await q.CountAsync(t => t.Status == TicketStatus.Done);
        return (total, confirmed, done);
    }
}
