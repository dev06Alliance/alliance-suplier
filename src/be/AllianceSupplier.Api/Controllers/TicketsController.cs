using AllianceSupplier.Api.DTOs.Tickets;
using AllianceSupplier.Domain.Enums;
using AllianceSupplier.Domain.Models;
using AllianceSupplier.Service.DTOs.Tickets;
using AllianceSupplier.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AllianceSupplier.Api.Controllers;

[Authorize]
public class TicketsController(ITicketService ticketService) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] TicketQueryParams query)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();
        var isManager = role is Role.Manager or Role.Admin;

        var filter = new TicketFilterParams(
            UserId: isManager ? null : userId,
            IsManager: isManager,
            Status: query.Status,
            Overdue: query.Overdue,
            Type: query.Type,
            RequesterId: query.RequesterId,
            ConfirmedById: query.ConfirmedById,
            DeadlineFrom: query.DeadlineFrom,
            DeadlineTo: query.DeadlineTo,
            Search: query.Search,
            Page: query.Page,
            PageSize: query.PageSize
        );

        var result = await ticketService.GetAllAsync(filter);
        return ApiOk(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();
        var result = await ticketService.GetByIdAsync(id, userId, role);
        return ApiOk(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreateTicketRequestDto dto)
    {
        var req = new CreateTicketRequest(
            dto.ParsedType,
            DateTime.SpecifyKind(dto.Deadline, DateTimeKind.Utc),
            dto.ProductId,
            dto.FreeTextDesc,
            dto.Image
        );
        var result = await ticketService.CreateAsync(req, GetCurrentUserId());
        return StatusCode(201, new { success = true, data = result });
    }

    [Authorize(Roles = "Manager,Admin")]
    [HttpPatch("{id:guid}/confirm")]
    public async Task<IActionResult> Confirm(Guid id)
    {
        var result = await ticketService.ConfirmAsync(id, GetCurrentUserId());
        return ApiOk(result);
    }

    [Authorize(Roles = "Manager,Admin")]
    [HttpPatch("{id:guid}/done")]
    public async Task<IActionResult> Done(Guid id)
    {
        var result = await ticketService.DoneAsync(id, GetCurrentUserId());
        return ApiOk(result);
    }

    [Authorize(Roles = "Manager,Admin")]
    [HttpPatch("{id:guid}/deadline")]
    public async Task<IActionResult> ExtendDeadline(
        Guid id,
        [FromBody] ExtendDeadlineRequestDto dto
    )
    {
        var req = new ExtendDeadlineRequest(DateTime.SpecifyKind(dto.NewDeadline, DateTimeKind.Utc), dto.Reason);
        var result = await ticketService.ExtendDeadlineAsync(id, req, GetCurrentUserId());
        return ApiOk(result);
    }
}
