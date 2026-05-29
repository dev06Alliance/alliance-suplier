---
title: Phase 04 - Notifications + SSE
status: pending
priority: P1
effort: 5h
created: 2026-05-29
---

# Phase 04 — Notifications + SSE

## Context
- Parent: [plan.md](./plan.md)
- Depends on: [Phase 03 — Ticket Core](./phase-03-ticket-core.md)
- Tech docs: `D:\projects\alliance-suplier\Tech-docs.md`
- Next: [Phase 05 — Admin Features](./phase-05-admin-features.md)

## Overview

| Field | Value |
|---|---|
| Date | 2026-05-29 |
| Description | BE: SseManager + NotificationService + SSE endpoint + notification REST API. FE: useSSE hook + NotifBell + notifStore |
| Priority | P1 |
| Status | pending |
| Effort | 5h |

## Key Insights
- SseManager keyed by `userId (Guid)` not connectionId — one entry per user, last-write-wins if user reconnects
- SSE auth: GET /api/v1/notifications/stream?token={accessToken} — validate JWT from query param (EventSource cannot send headers)
- Push rules: TicketCreated -> ALL managers; TicketConfirmed -> requester; TicketDone -> requester
- Notification.Payload is JsonDocument (jsonb) — flexible per type; include ticketId + productName + categoryName + imageUrl
- SseManager is Singleton; NotificationService is Scoped (injects Singleton SseManager via constructor)
- SSE connection kept open via `await Task.Delay(Timeout.Infinite, ct)` — RequestAborted removes from dictionary
- FE useSSE hook: reconnects after 3s on error; passes token as query param
- NotifBell badge count: increment on SSE event, reset when modal opened + all-read called

## Requirements
### BE
- `SseManager` Singleton — `ConcurrentDictionary<Guid, HttpResponse>`, AddConnection, RemoveConnection, SendToUserAsync(userId, data)
- `NotificationService` — CreateAndPushAsync(userId, type, payload): save Notification to DB + push SSE if user connected
- `GET /api/v1/notifications/stream` — SSE endpoint; auth via ?token= query param; register in SseManager; loop until RequestAborted
- `GET /api/v1/notifications?unread=true` — list user notifications (filtered by IsRead if query param)
- `PATCH /api/v1/notifications/:id/read` — mark single as read
- `PATCH /api/v1/notifications/read-all` — mark all as read for current user
- Wire notification triggers into TicketService (Phase 03 stubs -> real calls)

### FE
- `useSSE` hook — EventSource with ?token=; reconnect on error; dispatch to notifStore
- `useNotifications` hook — TanStack Query for notification list; mutations for read/read-all
- `NotifBell` component — badge count from notifStore; click opens notification panel
- `notifStore` — badgeCount, increment, reset

## Architecture

### BE Files to Create

**`src/be/AllianceSupplier.Service/`**
- `SseManager.cs` — Singleton class (NOT interface — registered directly); `ConcurrentDictionary<Guid, HttpResponse> _connections`; methods: `AddConnection(Guid userId, HttpResponse)`, `RemoveConnection(Guid userId)`, `Task SendToUserAsync(Guid userId, string data)`
- `Interfaces/INotificationService.cs` — `Task NotifyTicketCreatedAsync(Ticket ticket)`, `Task NotifyTicketConfirmedAsync(Ticket ticket)`, `Task NotifyTicketDoneAsync(Ticket ticket)`, `Task<List<NotificationDto>> GetUserNotificationsAsync(Guid userId, bool? unreadOnly)`, `Task MarkReadAsync(Guid notifId, Guid userId)`, `Task MarkAllReadAsync(Guid userId)`
- `NotificationService.cs` — impl INotificationService; inject INotificationRepository, IUserRepository, SseManager; CreateAndPush: save to DB + serialize JSON + call SseManager.SendToUserAsync
- `DTOs/Notifications/NotificationDto.cs` — Id, Type(string), IsRead, CreatedAt, Payload(object)
- `DTOs/Notifications/SseEvent.cs` — Type(string), Payload(object) — for SSE wire format

**`src/be/AllianceSupplier.Api/`**
- `Controllers/NotificationsController.cs` — GET list, GET /stream (SSE), PATCH /:id/read, PATCH /read-all
- `Program.cs` update — register INotificationService Scoped, SseManager Singleton; configure JWT to also read from query string for SSE endpoint

### SSE Endpoint Detail (inside NotificationsController or mapped in Program.cs)
- Read `?token=` query param
- Validate JWT manually (JwtSecurityTokenHandler.ValidateToken) -> extract userId
- Set Content-Type: text/event-stream, Cache-Control: no-cache, Connection: keep-alive
- DisableResponseBuffering (Response.Body.Flush)
- `sseManager.AddConnection(userId, Response)`
- Send initial heartbeat: `data: {"type":"connected"}\n\n`
- `await Task.Delay(Timeout.Infinite, HttpContext.RequestAborted)` wrapped in try/catch OperationCanceledException
- Finally: `sseManager.RemoveConnection(userId)`

### Notification Push Logic
- TicketCreated: query ALL managers (IUserRepository.GetAllManagersAsync), foreach manager -> INotificationService.NotifyAsync
- TicketConfirmed: notify ticket.RequesterId
- TicketDone: notify ticket.RequesterId
- Payload per type:
  - TicketCreated: `{ ticketId, ticketType, requesterName }`
  - TicketConfirmed/Done: `{ ticketId, ticketType, productName, productImageUrl, categoryName }` (or freeTextDesc if free-text)

### FE Files to Create / Update

- `src/fe/src/hooks/useSSE.ts` — COMPLETE:
  - Options: `{ token: string|null, onMessage, onError? }`
  - Connect with `new EventSource(url + "?token=" + encodeURIComponent(token))`
  - es.onmessage -> onMessage callback
  - es.onerror -> close + setTimeout(connect, 3000)
  - Cleanup: es.close() on unmount or token change
- `src/fe/src/hooks/useNotifications.ts` — useQuery(['notifications'], TanStack; useMutation markRead + markAllRead; invalidate on success
- `src/fe/src/components/NotifBell.tsx` — shows badgeCount badge; onClick: openModal + reset badge; renders notification list in dropdown/panel
- `src/fe/src/store/notifStore.ts` — COMPLETE: badgeCount, increment, reset, isModalOpen, openModal, closeModal
- `src/fe/src/App.tsx` or layout component — useSSE wired with accessToken; onMessage: JSON.parse + increment badgeCount

## Related Existing Code
- `src/be/AllianceSupplier.Service/TicketService.cs` — stub notification calls to replace with real INotificationService calls (Phase 03)
- `src/be/AllianceSupplier.Infrastructure/Repositories/NotificationRepository.cs` — AddAsync, GetByUserIdAsync, MarkReadAsync, MarkAllReadAsync (Phase 01)
- `src/be/AllianceSupplier.Domain/Entities/Notification.cs` — Payload: JsonDocument (Phase 01)
- `src/be/AllianceSupplier.Api/Program.cs` — add JWT query string events config + SseManager Singleton registration
- `src/fe/src/store/notifStore.ts` — stub from Phase 01, now complete
- `src/fe/src/store/authStore.ts` — accessToken used by useSSE

## Implementation Steps

1. Implement SseManager.cs in Service layer (not Api) — ConcurrentDictionary<Guid, HttpResponse>, thread-safe add/remove/send
2. Implement NotificationDto + SseEvent DTOs
3. Implement INotificationService interface
4. Implement NotificationService:
   - NotifyTicketCreatedAsync: get all managers -> foreach: create Notification(UserId=mgr.Id, Type=TicketCreated, Payload=JSON) + save + SSE push
   - NotifyTicketConfirmedAsync: create Notification for ticket.RequesterId + save + SSE push
   - NotifyTicketDoneAsync: same for RequesterId
   - GetUserNotificationsAsync: call repo, filter IsRead if param, map to DTO
   - MarkReadAsync: fetch notif, verify UserId==currentUser, set IsRead=true, save
   - MarkAllReadAsync: bulk update in repo
5. Update TicketService stubs -> call real INotificationService methods
6. Configure JWT to accept token from query string in Program.cs (JwtBearerEvents.OnMessageReceived)
7. Implement NotificationsController:
   - GET /stream: read ?token=, manually validate JWT, set SSE headers, add connection, delay, remove on cancel
   - GET /: [Authorize] -> call service.GetUserNotificationsAsync
   - PATCH /:id/read: [Authorize] -> service.MarkReadAsync
   - PATCH /read-all: [Authorize] -> service.MarkAllReadAsync
8. Register INotificationService Scoped + SseManager Singleton in Program.cs
9. FE: Complete notifStore.ts
10. FE: Implement useSSE hook with reconnect logic
11. FE: Implement useNotifications hook
12. FE: Wire useSSE in App.tsx / layout component using accessToken from authStore
13. FE: Implement NotifBell component with badge + panel
14. Test: open two browser tabs, create ticket -> both managers receive SSE event + badge increments

## Todo

- [ ] Service: SseManager (ConcurrentDictionary, AddConnection, RemoveConnection, SendToUserAsync)
- [ ] Service: NotificationDto + SseEvent DTOs
- [ ] Service: INotificationService interface
- [ ] Service: NotificationService (3 notify methods + get/mark methods)
- [ ] Service: Update TicketService stubs -> real NotificationService calls
- [ ] Api: Configure JWT query string token event in Program.cs
- [ ] Api/Controllers: NotificationsController (4 endpoints)
- [ ] Api: SSE endpoint implementation (headers + delay + cleanup)
- [ ] Program.cs: register INotificationService + SseManager
- [ ] FE: Complete notifStore.ts
- [ ] FE: useSSE hook with reconnect
- [ ] FE: useNotifications hook (list + markRead + markAllRead)
- [ ] FE: NotifBell component
- [ ] FE: Wire SSE in App/layout
- [ ] FE: Update types for Notification

## Success Criteria
- GET /api/v1/notifications/stream?token={valid} -> 200 text/event-stream, connection stays open
- GET /api/v1/notifications/stream?token={invalid} -> 401
- Create ticket -> SSE event received by all Manager SSE connections in <1s
- Confirm ticket -> SSE event received by requester's SSE connection
- GET /api/v1/notifications -> list for current user
- PATCH /api/v1/notifications/:id/read -> IsRead=true
- PATCH /api/v1/notifications/read-all -> all user's notifications IsRead=true
- FE: NotifBell badge increments on SSE event
- FE: Badge resets to 0 after opening notification panel + marking all read
- FE: SSE reconnects after simulated disconnect (3s)

## Risk Assessment
- Response buffering: SSE requires `Response.Body.FlushAsync()` after every write — use DisableResponseBuffering or similar
- SseManager holding HttpResponse reference: if response is already completed (client disconnected), send may throw — wrap in try/catch in SendToUserAsync
- JWT query string: only enable for /notifications/stream route (not globally) to avoid token leakage in logs
- Concurrent 401 refresh + SSE token: SSE token is access token (15m expiry) — SSE will disconnect after expiry, client must reconnect with new token

## Security Considerations
- SSE token validation: validate JWT fully (signature + expiry + issuer) even from query param
- Only enable JWT query string reading for the specific SSE path (OnMessageReceived checks context.Request.Path)
- SseManager.SendToUserAsync: verify userId is the authenticated user's id (don't allow cross-user push injection)
- Notification UserId set server-side from JWT claims, not from request body
- MarkReadAsync: verify notification belongs to current user before marking — prevent other users marking foreign notifs
