using AllianceSupplier.Domain.Models;
using AllianceSupplier.Service.DTOs.Shared;
using AllianceSupplier.Service.DTOs.Tickets;

namespace AllianceSupplier.Service.Interfaces;

public interface ITicketService
{
    Task<PagedResult<TicketListItem>> GetAllAsync(TicketFilterParams filter);
    Task<TicketDetail> GetByIdAsync(Guid id, Guid userId, AllianceSupplier.Domain.Enums.Role role);
    Task<TicketDetail> CreateAsync(CreateTicketRequest req, Guid requesterId);
    Task<TicketDetail> ConfirmAsync(Guid id, Guid managerId);
    Task<TicketDetail> DoneAsync(Guid id, Guid managerId);
    Task<TicketDetail> ExtendDeadlineAsync(Guid id, ExtendDeadlineRequest req, Guid managerId);
}
