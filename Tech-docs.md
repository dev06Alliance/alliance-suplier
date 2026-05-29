# Technical Architecture — Báo Hết/Hỏng Đồ Công Ty

**Date:** 2026-05-29 | **Scope:** Single-tenant, <50 users, localhost

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript (Vite) |
| Server state | TanStack Query (React Query) |
| Client state | Zustand (notification badge count, modal state) |
| Backend | .NET 10 Web API (C#) |
| ORM | Entity Framework Core 10 |
| Database | PostgreSQL 14+ |
| Auth | JWT — access token (15m) + refresh token (7d, HttpOnly cookie) |
| Real-time notification | SSE (Server-Sent Events) |
| File storage | Local disk + `IStorageService` interface |

---

## Data Model

```csharp
// Enums
enum Role        { User, Manager, Admin }
enum TicketType  { Broken, Empty }
enum TicketStatus { Pending, Confirmed, Done }
enum NotifType   { TicketCreated, TicketConfirmed, TicketDone }

class User {
  Guid Id; string Email; string PasswordHash;
  string Name; Role Role; DateTime CreatedAt;
}

class Category {
  Guid Id; string Name;
  ICollection<Product> Products;
}

class Product {
  Guid Id; string Name;
  string? ImageUrl;  // /uploads/{filename}
  Guid CategoryId; Category Category;
}

class Ticket {
  Guid Id; TicketType Type; TicketStatus Status;

  // product flow: ProductId set
  // free-text flow: ProductId null, FreeTextDesc + ImageUrl set
  Guid? ProductId; string? FreeTextDesc; string? ImageUrl; // /uploads/{filename}

  DateTime Deadline;
  Guid RequesterId;
  Guid? ConfirmedById; // set on Confirmed

  DateTime CreatedAt; DateTime UpdatedAt;
}

class DeadlineHistory {
  Guid Id; Guid TicketId;
  DateTime OldDeadline; DateTime NewDeadline;
  string Reason; Guid ChangedById; DateTime ChangedAt;
}

class Notification {
  Guid Id; Guid UserId;
  NotifType Type; bool IsRead; DateTime CreatedAt;
  JsonDocument Payload;  // { ticketId, ... } — flexible per NotifType
}
```

---

## API Endpoints

### Auth
```
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

### Tickets
```
GET    /api/v1/tickets                      ?status= &overdue=
POST   /api/v1/tickets                      multipart/form-data
GET    /api/v1/tickets/:id
PATCH  /api/v1/tickets/:id/confirm
PATCH  /api/v1/tickets/:id/done
PATCH  /api/v1/tickets/:id/deadline         { newDeadline, reason }
```

### Categories & Products (Admin)
```
GET/POST         /api/v1/categories
PUT/DELETE       /api/v1/categories/:id
GET/POST         /api/v1/products            ?categoryId=
PUT/DELETE       /api/v1/products/:id
```

### Notifications
```
GET   /api/v1/notifications                 ?unread=true
GET   /api/v1/notifications/stream          SSE — auth via ?token=
PATCH /api/v1/notifications/:id/read
PATCH /api/v1/notifications/read-all
```

### Reports (Admin)
```
GET /api/v1/reports    ?date= | ?from=&to=
→ { total, confirmed, done }
```

### Uploads
```
POST /api/v1/uploads          5MB max, JPEG/PNG/WEBP
GET  /uploads/:filename       static serve
```

---

## Request / Response Contract

### Envelope

**Success**
```json
{
  "success": true,
  "data": { ... }
}
```

**List**
```json
{
  "success": true,
  "data": [ ... ]
}
```

**Error**
```json
{
  "success": false,
  "error": {
    "code": "TICKET_NOT_FOUND",
    "message": "Ticket không tồn tại."
  }
}
```

HTTP status codes: `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable Entity`.

---

### Key Payloads

**POST /auth/login — request**
```json
{ "email": "user@company.com", "password": "..." }
```
**response**
```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "user": { "id": "...", "name": "...", "email": "...", "role": "Manager" }
  }
}
```

---

**POST /tickets — request** `multipart/form-data`
```
type         = "Broken" | "Empty"
deadline     = "2026-06-15"
productId    = "guid"           (chọn từ danh mục)
freeTextDesc = "Máy in tầng 3"  (nếu ko có productId)
image        = <file>           (nếu ko có productId)
```
**response `201`**
```json
{
  "success": true,
  "data": { "id": "...", "status": "Pending", "deadline": "2026-06-15" }
}
```

---

**GET /tickets — response**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "type": "Broken",
      "status": "Pending",
      "deadline": "2026-06-15",
      "isOverdue": true,
      "product": { "id": "...", "name": "Máy in Canon" },
      "freeTextDesc": null,
      "imageUrl": null,
      "requester": { "id": "...", "name": "Nguyễn A" },
      "createdAt": "2026-05-29T10:00:00Z"
    }
  ]
}
```

---

**GET /tickets/:id — response** (Manager/Admin thấy thêm `deadlineHistory`)
```json
{
  "success": true,
  "data": {
    "id": "...",
    "type": "Broken",
    "status": "Confirmed",
    "deadline": "2026-06-15",
    "isOverdue": false,
    "product": { "id": "...", "name": "Máy in Canon", "imageUrl": "/uploads/xxx.jpg" },
    "freeTextDesc": null,
    "imageUrl": null,
    "requester": { "id": "...", "name": "Nguyễn A" },
    "confirmedBy": { "id": "...", "name": "Trần B" },
    "createdAt": "2026-05-29T10:00:00Z",
    "deadlineHistory": [
      {
        "oldDeadline": "2026-06-10",
        "newDeadline": "2026-06-15",
        "reason": "Chờ linh kiện",
        "changedBy": { "id": "...", "name": "Trần B" },
        "changedAt": "2026-06-09T08:00:00Z"
      }
    ]
  }
}
```

---

**PATCH /tickets/:id/deadline — request**
```json
{ "newDeadline": "2026-06-20", "reason": "Chờ linh kiện" }
```

---

**GET /notifications — response**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "type": "TicketConfirmed",
      "isRead": false,
      "createdAt": "2026-05-29T10:05:00Z",
      "payload": { "ticketId": "...", "ticketType": "Broken", "productName": "Máy in Canon", "productImageUrl": "/uploads/xxx.jpg", "categoryName": "Thiết bị văn phòng" }
    }
  ]
}
```

---

**SSE — event format**
```
data: {"type":"TicketCreated","payload":{"ticketId":"...","requesterName":"Nguyễn A"}}
```

---

**GET /reports — response**
```json
{
  "success": true,
  "data": { "total": 12, "confirmed": 8, "done": 5 }
}
```

---

**POST /uploads — response**
```json
{
  "success": true,
  "data": { "url": "/uploads/abc123.jpg" }
}
```

---

## Authorization Matrix

| Action | USER | MANAGER | ADMIN |
|---|:---:|:---:|:---:|
| Create ticket | ✓ | ✓ | ✓ |
| View own tickets | ✓ | ✓ | ✓ |
| View all tickets | ✗ | ✓ | ✓ |
| Confirm ticket | ✗ | ✓ (any) | ✗ |
| Mark Done | ✗ | ✓ (confirmedBy only) | ✗ |
| Extend deadline | ✗ | ✓ | ✗ |
| Manage catalog | ✗ | ✗ | ✓ |
| View reports | ✗ | ✗ | ✓ |

---

## Ticket State Machine

```
PENDING ──[confirm]──► CONFIRMED ──[done]──► DONE
                           │
                    [extend deadline]
                    (logs DeadlineHistory)
```

- `done` chỉ cho phép nếu `currentUserId == ticket.ConfirmedById`
- Overdue = `deadline < now() && status !== DONE` — computed, không lưu DB

---

## SSE Architecture

```
GET /notifications/stream?token=<accessToken>
→ Response: Content-Type: text/event-stream

Server giữ ConcurrentDictionary<Guid, HttpResponse>
Khi có event → push data: { type, ticketId } tới các userId liên quan
HttpContext.RequestAborted → xóa khỏi dictionary
```

---

## Storage Interface

```csharp
interface IStorageService {
  Task<string> UploadAsync(IFormFile file);  // returns URL
  Task DeleteAsync(string url);
}

class LocalStorageService : IStorageService {
  // lưu vào wwwroot/uploads/, serve qua UseStaticFiles
}
```

---

## Project Structure

```
src/
├── fe/src/
│   ├── pages/          # Login, MyTickets, AllTickets, TicketDetail, Report, Products
│   ├── components/     # TicketCard, NotifBell, StatusBadge, DeadlineHistory
│   ├── hooks/          # useTickets, useNotifications, useSSE
│   ├── stores/         # notifStore.ts (Zustand)
│   └── services/       # api.ts
│
└── be/
    ├── Controllers/    # AuthController, TicketsController, ProductsController,
    │                   # CategoriesController, NotificationsController, ReportsController, UploadsController
    ├── Services/       # ITicketService, TicketService, INotificationService, NotificationService
    ├── Storage/        # IStorageService.cs, LocalStorageService.cs
    ├── Models/         # User, Ticket, Product, Category, DeadlineHistory, Notification (EF entities)
    ├── DTOs/           # request/response records
    ├── Middleware/     # RoleAuthorizationMiddleware
    ├── Infrastructure/ # AppDbContext.cs, SseManager.cs
    ├── Migrations/     # EF Core migrations
    └── Program.cs
```

---

## Seed Data

```csharp
// Infrastructure/DbSeeder.cs
new[] {
  new User { Email = "admin@company.com",    Role = Role.Admin   },
  new User { Email = "manager1@company.com", Role = Role.Manager },
  new User { Email = "manager2@company.com", Role = Role.Manager },
  new User { Email = "user1@company.com",    Role = Role.User    },
  new User { Email = "user2@company.com",    Role = Role.User    },
}
// + sample categories & products
```
