using AllianceSupplier.Domain.Entities;

namespace AllianceSupplier.Domain.Interfaces.Repositories;

public interface IDeadlineHistoryRepository
{
    Task<IEnumerable<DeadlineHistory>> GetByTicketIdAsync(Guid ticketId);
    Task AddAsync(DeadlineHistory entry);
}
