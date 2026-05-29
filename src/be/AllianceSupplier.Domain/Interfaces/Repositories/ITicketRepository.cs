using AllianceSupplier.Domain.Entities;
using AllianceSupplier.Domain.Models;

namespace AllianceSupplier.Domain.Interfaces.Repositories;

public interface ITicketRepository
{
    Task<(IEnumerable<Ticket> items, int total)> GetAllAsync(TicketFilterParams filter);
    Task<Ticket?> GetByIdAsync(Guid id);
    Task AddAsync(Ticket ticket);
    Task UpdateAsync(Ticket ticket);
    Task<(int total, int confirmed, int done)> GetCountsByStatusAsync(DateTime? from, DateTime? to);
}
