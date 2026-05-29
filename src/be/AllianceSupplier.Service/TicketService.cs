using AllianceSupplier.Domain.Entities;
using AllianceSupplier.Domain.Enums;
using AllianceSupplier.Domain.Interfaces.Repositories;
using AllianceSupplier.Domain.Interfaces.Services;
using AllianceSupplier.Domain.Models;
using AllianceSupplier.Service.DTOs.Shared;
using AllianceSupplier.Service.DTOs.Tickets;
using AllianceSupplier.Service.Interfaces;

namespace AllianceSupplier.Service;

public class TicketService(
    ITicketRepository tickets,
    IDeadlineHistoryRepository deadlineHistories,
    IStorageService storage,
    INotificationService notifications
) : ITicketService
{
    public async Task<PagedResult<TicketListItem>> GetAllAsync(TicketFilterParams filter)
    {
        var (items, total) = await tickets.GetAllAsync(filter);
        var totalPages = total == 0 ? 0 : (int)Math.Ceiling(total / (double)filter.PageSize);
        return new PagedResult<TicketListItem>(items.Select(MapToListItem), total, filter.Page, filter.PageSize, totalPages);
    }

    public async Task<TicketDetail> GetByIdAsync(Guid id, Guid userId, Role role)
    {
        var ticket = await tickets.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Ticket {id} not found");

        if (role == Role.User && ticket.RequesterId != userId)
            throw new UnauthorizedAccessException("Forbidden");

        var includeHistory = role != Role.User;
        return MapToDetail(ticket, includeHistory);
    }

    public async Task<TicketDetail> CreateAsync(CreateTicketRequest req, Guid requesterId)
    {
        string? imageUrl = null;
        if (req.Image != null)
            imageUrl = await storage.UploadAsync(req.Image);

        var ticket = new Ticket
        {
            Type = req.Type,
            Status = TicketStatus.Pending,
            ProductId = req.ProductId,
            FreeTextDesc = req.FreeTextDesc,
            ImageUrl = imageUrl,
            Deadline = req.Deadline,
            RequesterId = requesterId,
        };

        await tickets.AddAsync(ticket);

        // Re-fetch with navigation properties
        var created = await tickets.GetByIdAsync(ticket.Id)
            ?? throw new InvalidOperationException("Failed to retrieve created ticket");

        await notifications.NotifyTicketCreatedAsync(created);

        return MapToDetail(created, false);
    }

    public async Task<TicketDetail> ConfirmAsync(Guid id, Guid managerId)
    {
        var ticket = await tickets.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Ticket {id} not found");

        if (ticket.Status != TicketStatus.Pending)
            throw new ArgumentException($"Ticket must be Pending to confirm (current: {ticket.Status})");

        ticket.Status = TicketStatus.Confirmed;
        ticket.ConfirmedById = managerId;
        await tickets.UpdateAsync(ticket);

        var updated = await tickets.GetByIdAsync(ticket.Id)!
            ?? throw new InvalidOperationException("Failed to retrieve updated ticket");

        await notifications.NotifyTicketConfirmedAsync(updated);

        return MapToDetail(updated, true);
    }

    public async Task<TicketDetail> DoneAsync(Guid id, Guid managerId)
    {
        var ticket = await tickets.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Ticket {id} not found");

        if (ticket.Status != TicketStatus.Confirmed)
            throw new ArgumentException($"Ticket must be Confirmed to mark done (current: {ticket.Status})");

        // BR-05: only the manager who confirmed can mark done
        if (ticket.ConfirmedById != managerId)
            throw new UnauthorizedAccessException("Only the confirming manager can mark this ticket as done");

        ticket.Status = TicketStatus.Done;
        await tickets.UpdateAsync(ticket);

        var updated = await tickets.GetByIdAsync(ticket.Id)!
            ?? throw new InvalidOperationException("Failed to retrieve updated ticket");

        await notifications.NotifyTicketDoneAsync(updated);

        return MapToDetail(updated, true);
    }

    public async Task<TicketDetail> ExtendDeadlineAsync(Guid id, ExtendDeadlineRequest req, Guid managerId)
    {
        var ticket = await tickets.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Ticket {id} not found");

        if (ticket.Status != TicketStatus.Confirmed)
            throw new ArgumentException($"Deadline can only be extended on Confirmed tickets (current: {ticket.Status})");

        var history = new DeadlineHistory
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            OldDeadline = ticket.Deadline,
            NewDeadline = req.NewDeadline,
            Reason = req.Reason,
            ChangedById = managerId,
        };
        await deadlineHistories.AddAsync(history);

        ticket.Deadline = req.NewDeadline;
        await tickets.UpdateAsync(ticket);

        var updated = await tickets.GetByIdAsync(ticket.Id)!
            ?? throw new InvalidOperationException("Failed to retrieve updated ticket");

        return MapToDetail(updated, true);
    }

    private static bool ComputeIsOverdue(Ticket t) =>
        t.Deadline < DateTime.UtcNow && t.Status != TicketStatus.Done;

    private static TicketListItem MapToListItem(Ticket t) =>
        new(
            t.Id,
            t.Type.ToString(),
            t.Status.ToString(),
            t.Deadline,
            ComputeIsOverdue(t),
            t.Product != null ? new ProductRef(t.Product.Id, t.Product.Name) : null,
            t.FreeTextDesc,
            t.ImageUrl,
            new UserRef(t.Requester.Id, t.Requester.Name),
            t.CreatedAt
        );

    private static TicketDetail MapToDetail(Ticket t, bool includeHistory) =>
        new(
            t.Id,
            t.Type.ToString(),
            t.Status.ToString(),
            t.Deadline,
            ComputeIsOverdue(t),
            t.Product != null ? new ProductRef(t.Product.Id, t.Product.Name) : null,
            t.FreeTextDesc,
            t.ImageUrl,
            new UserRef(t.Requester.Id, t.Requester.Name),
            t.ConfirmedBy != null ? new UserRef(t.ConfirmedBy.Id, t.ConfirmedBy.Name) : null,
            t.CreatedAt,
            t.UpdatedAt,
            includeHistory
                ? t.DeadlineHistories.OrderBy(h => h.ChangedAt).Select(h => new DeadlineHistoryItem(
                    h.Id,
                    h.OldDeadline,
                    h.NewDeadline,
                    h.Reason,
                    new UserRef(h.ChangedBy.Id, h.ChangedBy.Name),
                    h.ChangedAt))
                : null
        );
}
