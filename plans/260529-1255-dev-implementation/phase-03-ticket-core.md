---
title: Phase 03 - Ticket Core
status: in_progress
priority: P1
effort: 8h
created: 2026-05-29
updated: 2026-05-29
---

# Phase 03 — Ticket Core

## Context
- Parent: [plan.md](./plan.md)
- Depends on: [Phase 02 — Authentication](./phase-02-authentication.md)
- Tech docs: `D:\projects\alliance-suplier\Tech-docs.md`
- Next: [Phase 04 — Notifications + SSE](./phase-04-notifications-sse.md)

## Overview

| Field | Value |
|---|---|
| Date | 2026-05-29 |
| Description | CRUD tickets + state machine (confirm/done/extend deadline) + file upload + FE ticket pages |
| Priority | P1 |
| Status | pending |
| Effort | 8h |

## Key Insights
- Two ticket flows: (1) product flow: productId set, (2) free-text flow: productId null + freeTextDesc + imageUrl
- State machine: PENDING -> CONFIRMED -> DONE; no reverse transitions
- BR-05: `done` only if `currentUserId == ticket.ConfirmedById` — checked in Service, not attribute
- `isOverdue` = `deadline < UtcNow && status != Done` — computed field in response DTO, NOT stored in DB
- Deadline extension logs DeadlineHistory row — only Manager can extend, only on CONFIRMED tickets
- Multipart/form-data for POST /tickets — image optional (only when no productId)
- GET /tickets: User sees only own tickets; Manager+Admin see all — filter in repository
- File validation: 5MB max, JPEG/PNG/WEBP — in Validator (not in StorageService)

## Requirements
### BE
- `GET /api/v1/tickets?status=&overdue=&page=&pageSize=` — list (filtered by role); **offset paging**: page (1-based, default 1), pageSize (default 20, max 100); response: `{ items, total, page, pageSize, totalPages }`; includes isOverdue per item
- `POST /api/v1/tickets` — multipart/form-data; create ticket; trigger TicketCreated notification (Phase 04 hook)
- `GET /api/v1/tickets/:id` — detail; Manager/Admin see deadlineHistory
- `PATCH /api/v1/tickets/:id/confirm` — Manager only; PENDING->CONFIRMED; sets ConfirmedById; trigger TicketConfirmed notification
- `PATCH /api/v1/tickets/:id/done` — Manager only (confirmedBy); CONFIRMED->DONE; trigger TicketDone notification
- `PATCH /api/v1/tickets/:id/deadline` — Manager only; only on CONFIRMED; log DeadlineHistory
- `POST /api/v1/uploads` — standalone upload endpoint (returns URL); GET /uploads/:filename via static files
- FluentValidation on all request DTOs
- **Paging DTOs**: `PagedResult<T>` (Items, Total, Page, PageSize, TotalPages) — shared generic in Service/DTOs/Shared/

### FE
- `useTickets` hook — TanStack Query for list + create + status transitions
- `TicketList` page (MyTickets for User, AllTickets for Manager/Admin with filters)
- `TicketDetail` page — status actions, deadline history (Manager/Admin)
- `CreateTicket` form — product selector or free-text flow, RHF + Zod

## Architecture

### BE Files to Create

**`src/be/AllianceSupplier.Service/`**
- `Interfaces/ITicketService.cs` — GetAllAsync(userId, role, filter, page, pageSize), GetByIdAsync(id, userId, role), CreateAsync(req, requesterId), ConfirmAsync(id, managerId), DoneAsync(id, managerId), ExtendDeadlineAsync(id, req, managerId)
- `TicketService.cs` — impl ITicketService; inject ITicketRepository, IUserRepository, IDeadlineHistoryRepository, IStorageService, INotificationService (interface — for Phase 04)
- `DTOs/Tickets/CreateTicketRequest.cs` — Type, Deadline, ProductId?, FreeTextDesc?, Image(IFormFile?)
- `DTOs/Tickets/ExtendDeadlineRequest.cs` — NewDeadline, Reason
- `DTOs/Tickets/TicketListItem.cs` — Id, Type, Status, Deadline, IsOverdue, Product(ProductRef?), FreeTextDesc?, ImageUrl?, Requester(UserRef), CreatedAt
- `DTOs/Tickets/TicketDetail.cs` — all TicketListItem fields + ConfirmedBy(UserRef?), DeadlineHistory(list, nullable for User role)
- `DTOs/Shared/UserRef.cs` — Id, Name
- `DTOs/Shared/ProductRef.cs` — Id, Name
- `DTOs/Shared/PagedResult.cs` — generic `PagedResult<T>(Items, Total, Page, PageSize, TotalPages)`

**`src/be/AllianceSupplier.Api/`**
- `Controllers/TicketsController.cs` — all 6 ticket endpoints + /confirm + /done + /deadline patches
- `Controllers/UploadsController.cs` — POST /api/v1/uploads
- `DTOs/Tickets/CreateTicketRequestDto.cs` — multipart form DTO [FromForm]
- `DTOs/Tickets/ExtendDeadlineRequestDto.cs` — { newDeadline, reason }
- `Validators/CreateTicketRequestValidator.cs` — Type required enum; Deadline required future date; ProductId XOR (FreeTextDesc + optional Image); Image size <= 5MB; Image content-type in [image/jpeg, image/png, image/webp]
- `Validators/ExtendDeadlineRequestValidator.cs` — NewDeadline required future; Reason NotEmpty MaxLength 500

**ITicketRepository updates (src/be/AllianceSupplier.Domain/Interfaces/Repositories/ITicketRepository.cs)**
- `GetAllAsync(Guid? userId, bool isManager, string? status, bool? overdue)` — filter by requester if User role
- `CountAsync(Guid? requesterId, TicketStatus? status, bool? overdue)` — COUNT query for paging total; same filters as GetAllAsync
- `GetPagedAsync(Guid? requesterId, TicketStatus? status, bool? overdue, int skip, int take)` — paginated query with `.Skip(skip).Take(take)`

### FE Files to Create

- `src/fe/src/hooks/useTickets.ts` — useQuery(['tickets', filters]), useMutation for create/confirm/done/deadline; invalidate on success
- `src/fe/src/hooks/useTicket.ts` — useQuery(['ticket', id]) for detail
- `src/fe/src/pages/MyTickets.tsx` — User role: list own tickets, status filter tabs, isOverdue highlight
- `src/fe/src/pages/AllTickets.tsx` — Manager/Admin: all tickets, status + overdue filters
- `src/fe/src/pages/TicketDetail.tsx` — detail view; action buttons by role/status; DeadlineHistory section (Manager/Admin)
- `src/fe/src/pages/CreateTicket.tsx` — two flows: product selector (Phase 05 data) or free-text; RHF + Zod; file upload preview
- `src/fe/src/components/TicketCard.tsx` — summary card with StatusBadge + isOverdue indicator
- `src/fe/src/components/StatusBadge.tsx` — color-coded status chip per DESIGN.md tokens
- `src/fe/src/components/DeadlineHistory.tsx` — timeline list of deadline changes (Manager/Admin only)
- `src/fe/src/types/index.ts` — add/update: Ticket, TicketListItem, TicketDetail, DeadlineHistoryEntry, ProductRef, UserRef

## Related Existing Code
- `src/be/AllianceSupplier.Infrastructure/Repositories/TicketRepository.cs` — add filter logic
- `src/be/AllianceSupplier.Infrastructure/Repositories/DeadlineHistoryRepository.cs` — GetByTicketIdAsync, AddAsync
- `src/be/AllianceSupplier.Infrastructure/Storage/LocalStorageService.cs` — UploadAsync (Phase 01)
- `src/be/AllianceSupplier.Api/Controllers/BaseController.cs` — Ok<T> helper (Phase 02)
- `src/be/AllianceSupplier.Api/Middleware/ExceptionMiddleware.cs` — exception handling (Phase 02)

## Implementation Steps

1. Define ITicketService interface with all 6 methods
2. Tao all Service DTOs: CreateTicketRequest, ExtendDeadlineRequest, TicketListItem, TicketDetail, UserRef, ProductRef
3. Implement TicketService.GetAllAsync (with paging):
   - Validate: page >= 1, pageSize in [1..100], default page=1, pageSize=20
   - If role==User: filter by RequesterId==userId; else return all
   - Apply status filter if provided
   - Apply overdue filter: Deadline < UtcNow && Status != Done
   - Call CountAsync for total; call GetPagedAsync with skip=(page-1)*pageSize, take=pageSize
   - Map items to TicketListItem, compute IsOverdue in mapping
   - Return PagedResult<TicketListItem>(items, total, page, pageSize, totalPages)
4. Implement TicketService.GetByIdAsync:
   - Fetch ticket with includes (Product, Requester, ConfirmedBy)
   - If role==User and RequesterId != userId: throw ForbiddenException
   - Map to TicketDetail; include DeadlineHistory only if role != User
5. Implement TicketService.CreateAsync:
   - Validate: productId XOR (freeTextDesc + image) at service level (validator handles API layer)
   - If image provided: call IStorageService.UploadAsync
   - Save ticket with Status=Pending, RequesterId=requesterId
   - Trigger INotificationService.NotifyTicketCreatedAsync(ticket) — stub call for Phase 04
6. Implement TicketService.ConfirmAsync:
   - Fetch ticket; if Status != Pending: throw appropriate exception
   - Set Status=Confirmed, ConfirmedById=managerId, UpdatedAt=UtcNow
   - SaveChanges; trigger notification stub
7. Implement TicketService.DoneAsync:
   - Fetch ticket; if Status != Confirmed: throw exception
   - If ticket.ConfirmedById != managerId: throw ForbiddenException (BR-05)
   - Set Status=Done, UpdatedAt=UtcNow
   - SaveChanges; trigger notification stub
8. Implement TicketService.ExtendDeadlineAsync:
   - Fetch ticket; if Status != Confirmed: throw exception
   - Create DeadlineHistory record (OldDeadline, NewDeadline, Reason, ChangedById=managerId)
   - Update Ticket.Deadline = newDeadline
   - SaveChanges
9. Tao CreateTicketRequestValidator + ExtendDeadlineRequestValidator
10. Tao CreateTicketRequestDto [FromForm] in Api/DTOs
11. Implement TicketsController with all endpoints; use [Authorize(Roles)] attributes per matrix
12. Implement UploadsController POST /api/v1/uploads — call IStorageService.UploadAsync, return { url }
13. Register ITicketService Scoped in Program.cs
14. Test all endpoints via Swagger
15. FE: install no new packages (all installed Phase 01)
16. Tao useTickets hook (list query + mutations); tao useTicket hook (detail query)
17. Implement MyTickets.tsx — show own tickets, status filter
18. Implement AllTickets.tsx — show all, status + overdue filter (Manager/Admin)
19. Implement TicketDetail.tsx — role-aware action buttons, DeadlineHistory component
20. Implement CreateTicket.tsx — conditional form fields (productId vs free-text flow)
21. Tao TicketCard, StatusBadge, DeadlineHistory components

## Todo

- [x] Service: ITicketService interface
- [x] Service: DTOs (CreateTicketRequest, ExtendDeadlineRequest, TicketListItem, TicketDetail, UserRef, ProductRef)
- [x] Service: TicketService.GetAllAsync (role filter + status + overdue)
- [x] Service: TicketService.GetByIdAsync (role-aware, deadlineHistory)
- [x] Service: TicketService.CreateAsync (upload + save + notification stub)
- [x] Service: TicketService.ConfirmAsync (state machine)
- [x] Service: TicketService.DoneAsync (BR-05 check + state machine)
- [x] Service: TicketService.ExtendDeadlineAsync (DeadlineHistory log)
- [x] Api/Validators: CreateTicketRequestValidator (productId XOR free-text + file size/type)
- [x] Api/Validators: ExtendDeadlineRequestValidator
- [x] Api/DTOs: CreateTicketRequestDto [FromForm]
- [x] Api/Controllers: TicketsController (6 endpoints + 2 PATCH sub-routes)
- [x] Api/Controllers: UploadsController
- [x] Program.cs: register ITicketService
- [x] **[UPGRADE]** Service: DTOs/Shared/PagedResult.cs — generic PagedResult<T>
- [x] **[UPGRADE]** Domain: ITicketRepository — add CountAsync + GetPagedAsync
- [x] **[UPGRADE]** Infrastructure: TicketRepository — impl CountAsync + GetPagedAsync
- [x] **[UPGRADE]** Service: ITicketService.GetAllAsync signature — add page, pageSize params; return PagedResult<TicketListItem>
- [x] **[UPGRADE]** Service: TicketService.GetAllAsync — paging logic (skip/take, totalPages)
- [x] **[UPGRADE]** Api: TicketsController GET — accept [FromQuery] page, pageSize
- [ ] FE: useTickets + useTicket hooks
- [ ] FE: MyTickets page
- [ ] FE: AllTickets page
- [ ] FE: TicketDetail page
- [ ] FE: CreateTicket form
- [ ] FE: TicketCard, StatusBadge, DeadlineHistory components
- [ ] FE: Update types/index.ts

## Success Criteria
- POST /api/v1/tickets (product flow) -> 201 + { id, status:"Pending", deadline }
- POST /api/v1/tickets (free-text + image) -> 201; image saved to /uploads/; imageUrl in response
- GET /api/v1/tickets as User -> only own tickets; response has `{ items, total, page, pageSize, totalPages }`
- GET /api/v1/tickets as Manager -> all tickets (paged)
- GET /api/v1/tickets?overdue=true -> only tickets where deadline < now && status != Done
- GET /api/v1/tickets?page=2&pageSize=5 -> correct slice; totalPages = ceil(total/5)
- GET /api/v1/tickets?pageSize=200 -> 422 (pageSize max 100)
- PATCH /tickets/:id/confirm as Manager -> status becomes "Confirmed"
- PATCH /tickets/:id/done as Manager (not confirmedBy) -> 403
- PATCH /tickets/:id/done as confirmedBy Manager -> status becomes "Done"
- PATCH /tickets/:id/deadline -> DeadlineHistory row created, ticket.deadline updated
- GET /tickets/:id as User for another user's ticket -> 403
- GET /tickets/:id as Manager -> includes deadlineHistory
- POST /api/v1/uploads (>5MB file) -> 422

## Risk Assessment
- Multipart form binding in .NET 10: ensure [FromForm] DTOs bind correctly with IFormFile
- IsOverdue computed at query time: if large dataset, consider computing in SQL vs application layer
- Notification stub: INotificationService injected but Phase 04 not done yet — use null-safe stub or conditional

## Security Considerations
- [Authorize(Roles="Manager")] on confirm/done/deadline endpoints
- [Authorize(Roles="Admin,Manager")] on GET all tickets
- BR-05 enforced in Service (not just attribute) — defense in depth
- File upload: validate content-type AND check magic bytes if possible (not just extension)
- File size check in validator before calling StorageService
- ImageUrl stored as relative path only (/uploads/...) — no user-supplied path traversal possible
- Ticket.RequesterId set from JWT claims (server-side), not from request body
