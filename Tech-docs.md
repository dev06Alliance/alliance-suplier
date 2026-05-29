# Technical Architecture Report — Hệ Thống Báo Hết/Hỏng Đồ Công Ty

**Date:** 2026-05-29 | **Status:** Agreed | **Scope:** Single-tenant, <50 users

---

## 1. Problem Statement

Internal web app để nhân viên báo đồ dùng văn phòng hỏng/hết. Ba actor (User, Manager, Admin) với permission matrix rõ ràng. Không có public registration; tài khoản seed sẵn.

**Constraints chính:**
- <50 users → không cần horizontal scaling
- Localhost trước, cloud sau
- KISS / YAGNI / DRY

---

## 2. Confirmed Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React + TypeScript (Vite) | Đã có scaffolding |
| UI Library | TBD (shadcn/ui recommended) | Headless, type-safe, accessible |
| Server State | **TanStack Query (React Query)** | Cache + invalidation, không cần Redux |
| Client State | **Zustand** (nhỏ) | Chỉ cho: notif badge count, modal open state |
| Backend | Node.js + Express + TypeScript | Đã có scaffolding |
| ORM | Prisma | Type-safe, migration versioning |
| Database | PostgreSQL 14+ | ACID, relational, phù hợp state machine |
| Auth | **JWT stateless** (HttpOnly cookie) | Đơn giản, không cần Redis, phù hợp <50 users |
| Real-time Notif | **SSE (Server-Sent Events)** | Server push 1 chiều, đủ cho notification, reconnect tự động |
| File Storage | **Local disk + IStorageService interface** | Local impl trước, swap cloud sau không cần sửa business logic |

---

## 3. Data Model (Prisma Schema)

### 3.1 Entity Relationship

```
User (1) ──── (N) Ticket [as requester]
User (1) ──── (N) Ticket [as confirmedBy]
User (1) ──── (N) DeadlineHistory [as changedBy]
User (1) ──── (N) Notification

Category (1) ──── (N) Product
Product (1) ──── (N) Ticket [nullable — free-text case]

Ticket (1) ──── (N) DeadlineHistory
Ticket (1) ──── (N) Notification
```

### 3.2 Schema Definition

```prisma
enum Role {
  USER
  MANAGER
  ADMIN
}

enum TicketType {
  BROKEN   // Hỏng
  EMPTY    // Hết
}

enum TicketStatus {
  PENDING
  CONFIRMED
  DONE
}

enum NotificationType {
  TICKET_CREATED
  TICKET_CONFIRMED
  TICKET_DONE
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  role         Role
  createdAt    DateTime @default(now())

  ticketsCreated   Ticket[]          @relation("requester")
  ticketsConfirmed Ticket[]          @relation("confirmedBy")
  deadlineChanges  DeadlineHistory[]
  notifications    Notification[]
}

model Category {
  id       String    @id @default(cuid())
  name     String    @unique
  products Product[]
}

model Product {
  id         String   @id @default(cuid())
  name       String
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id])
  tickets    Ticket[]
}

model Ticket {
  id            String       @id @default(cuid())
  type          TicketType
  status        TicketStatus @default(PENDING)

  // Product flow: productId set, freeTextDesc/imageUrl null
  // Free-text flow: productId null, freeTextDesc set
  productId     String?
  product       Product?     @relation(fields: [productId], references: [id])
  freeTextDesc  String?
  imageUrl      String?      // relative path: /uploads/{filename}

  deadline      DateTime
  requesterId   String
  requester     User         @relation("requester", fields: [requesterId], references: [id])

  confirmedById String?      // set when CONFIRMED
  confirmedBy   User?        @relation("confirmedBy", fields: [confirmedById], references: [id])

  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  deadlineHistory DeadlineHistory[]
  notifications   Notification[]

  // Business Rule validation hint:
  // BR-05: DONE action chỉ cho phép nếu req.user.id === confirmedById
  // Enforced ở application layer, không phải DB layer
}

model DeadlineHistory {
  id          String   @id @default(cuid())
  ticketId    String
  ticket      Ticket   @relation(fields: [ticketId], references: [id])
  oldDeadline DateTime
  newDeadline DateTime
  reason      String   // bắt buộc (BR-03)
  changedById String
  changedBy   User     @relation(fields: [changedById], references: [id])
  changedAt   DateTime @default(now())
}

model Notification {
  id        String           @id @default(cuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id])
  ticketId  String
  ticket    Ticket           @relation(fields: [ticketId], references: [id])
  type      NotificationType
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())
}
```

### 3.3 Business Rule Enforcement Layer

| Rule | Enforcement |
|---|---|
| BR-04: Any Manager confirm | Middleware check `role === MANAGER` |
| BR-05: Only confirming Manager can Done | `ticket.confirmedById === req.user.id` trong service layer |
| BR-03: Reason bắt buộc khi extend deadline | Validation trong request schema (Zod) |
| Overdue highlight | Computed: `ticket.deadline < now() && status !== DONE` |

---

## 4. API Design

**Base URL:** `/api/v1/`

### Auth
```
POST /api/v1/auth/login        → { accessToken } + Set-Cookie: refreshToken
POST /api/v1/auth/refresh       → { accessToken }
POST /api/v1/auth/logout        → clear cookie
GET  /api/v1/auth/me            → current user
```

### Tickets
```
GET    /api/v1/tickets              → list (User: own; Manager/Admin: all) + ?status=&overdue=
POST   /api/v1/tickets              → create ticket (multipart/form-data for image)
GET    /api/v1/tickets/:id          → detail (deadline history visible for Manager/Admin only)
PATCH  /api/v1/tickets/:id/confirm  → Manager: PENDING → CONFIRMED
PATCH  /api/v1/tickets/:id/done     → Manager (confirmed): CONFIRMED → DONE
PATCH  /api/v1/tickets/:id/deadline → Manager: extend deadline { newDeadline, reason }
```

### Products & Categories (Admin only)
```
GET    /api/v1/categories
POST   /api/v1/categories
PUT    /api/v1/categories/:id
DELETE /api/v1/categories/:id

GET    /api/v1/products             → ?categoryId=
POST   /api/v1/products
PUT    /api/v1/products/:id
DELETE /api/v1/products/:id
```

### Notifications
```
GET  /api/v1/notifications          → list (current user, ?unread=true)
PATCH /api/v1/notifications/:id/read
PATCH /api/v1/notifications/read-all
```

### SSE (Notifications)
```
GET  /api/v1/notifications/stream  → SSE endpoint, auth via ?token= query param
                                     (HttpOnly cookie không được gửi kèm EventSource)
```

### Reports (Admin only)
```
GET /api/v1/reports?date=2026-05-29
GET /api/v1/reports?from=2026-05-01&to=2026-05-31
→ { total, confirmed, done }
```

### File Upload
```
POST /api/v1/uploads               → multipart, returns { url }
Serve static: GET /uploads/:filename
```

---

## 5. Authentication Flow

```
Login → bcrypt verify → sign accessToken (15m) + refreshToken (7d, HttpOnly cookie)
Request → Bearer accessToken in Authorization header
Token expired → POST /auth/refresh → new accessToken
Logout → clear cookie, (optional: blacklist refresh token in DB)
```

**JWT Payload:**
```json
{ "sub": "userId", "role": "MANAGER", "iat": ..., "exp": ... }
```

---

## 6. SSE Notification Architecture

```
Client                          Server (Express)
  │                                │
  ├─ GET /notifications/stream ───►│ res.setHeader('Content-Type', 'text/event-stream')
  │  ?token=<accessToken>          │ keep connection alive
  │                                │ store: Map<userId, res>
  │                                │
  │  [Ticket created]              │
  │◄─ data: { type, ticketId } ────┤ loop: notify all Manager SSE connections
  │                                │
  │  [Ticket confirmed]            │
  │◄─ data: { type, ticketId } ────┤ notify requester SSE connection
  │                                │
  │  [connection lost]             │ remove from Map
  │  [auto-reconnect by browser] ──►│ EventSource reconnects automatically
```

**In-memory connection store** (Map): đủ cho <50 users, không cần Redis pub/sub.

---

## 7. File Storage Abstraction

```typescript
// Interface — business logic depends on this, not impl
interface IStorageService {
  upload(file: Buffer, filename: string, mimeType: string): Promise<string> // returns URL
  delete(url: string): Promise<void>
}

// Local implementation (Phase 1)
class LocalStorageService implements IStorageService {
  // saves to /uploads/, serves via Express static
}

// Future: swap in without touching business logic
// class CloudinaryStorageService implements IStorageService { ... }
// class S3StorageService implements IStorageService { ... }
```

**Upload constraints:** 5MB max, JPEG/PNG/WEBP only. Validate via multer middleware.

---

## 8. Project Structure

```
src/
├── fe/
│   ├── src/
│   │   ├── pages/            # Login, MyTickets, AllTickets, TicketDetail, Report, Products
│   │   ├── components/       # TicketCard, NotifBell, StatusBadge, DeadlineHistory
│   │   ├── hooks/            # useTickets, useNotifications, useSSE
│   │   ├── stores/           # notifStore.ts (Zustand — badge count only)
│   │   ├── services/         # api.ts (axios/fetch wrapper)
│   │   └── lib/              # queryClient.ts, auth.ts
│   └── vite.config.ts
│
└── be/
    ├── src/
    │   ├── routes/           # auth, tickets, products, categories, notifications, reports, uploads
    │   ├── middlewares/      # auth.middleware.ts, role.middleware.ts
    │   ├── services/         # ticket.service.ts, notification.service.ts, storage.service.ts
    │   ├── storage/          # IStorageService.ts, local-storage.service.ts
    │   ├── validators/       # zod schemas cho request bodies
    │   ├── lib/              # prisma.ts, sse-manager.ts (Map<userId, res>)
    │   ├── app.ts
    │   └── server.ts
    ├── prisma/
    │   ├── schema.prisma
    │   └── seed.ts           # seed Users (3 roles)
    └── uploads/              # local file storage
```

---

## 9. Ticket State Machine

```
PENDING ──[any Manager: confirm]──► CONFIRMED ──[same Manager: done]──► DONE
                                        │
                          [any Manager: extend deadline]
                          (logs DeadlineHistory, stays CONFIRMED)
```

**Overdue:** computed field — `deadline < now() && status !== DONE`. Không cần cron job, không lưu DB.

---

## 10. Seed Data Strategy

```typescript
// prisma/seed.ts
const users = [
  { email: 'admin@company.com', role: 'ADMIN' },
  { email: 'manager1@company.com', role: 'MANAGER' },
  { email: 'manager2@company.com', role: 'MANAGER' },
  { email: 'user1@company.com', role: 'USER' },
  { email: 'user2@company.com', role: 'USER' },
]
// + sample categories & products
```

---

## 11. Key Implementation Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| BR-05 enforcement lỏng (wrong Manager marks Done) | Medium | Unit test service layer: `if (ticket.confirmedById !== userId) throw 403` |
| SSE connection leak (user đóng tab không clean up) | Low | `req.on('close', () => sseManager.remove(userId))` |
| Free-text ticket: thiếu productId validation | Medium | Zod schema: `productId XOR (freeTextDesc required)` |
| Image MIME type spoof (upload .exe rename .jpg) | Medium | Validate via `file-type` library, không chỉ extension |
| JWT refresh token không invalidate sau logout | Low | Lưu refreshToken trong DB `User.refreshToken`, clear on logout |

---

## 12. Decisions Summary

| Decision | Choice | Rejected | Reason |
|---|---|---|---|
| Notification mechanism | SSE | WebSocket | 1-chiều đủ, không cần bi-directional, simpler |
| File storage | Local + IStorageService | Hard-code / S3 now | YAGNI + extensible interface |
| State management | TanStack Query + Zustand | Redux | Ít boilerplate, đúng tool cho server state |
| API style | REST /api/v1/ | GraphQL / tRPC | Simple, familiar, dễ test |
| Auth | JWT stateless | Session DB / Better Auth | No Redis needed, phù hợp scale |
| Deadline history | Bảng riêng | JSON column | Queryable, audit-friendly |
| Ticket schema | 1 bảng, productId nullable | 2 bảng tách | KISS, 1 query |
| Roles | Strict 3 roles | Superuser Admin | Giữ audit trail, theo BA spec |
