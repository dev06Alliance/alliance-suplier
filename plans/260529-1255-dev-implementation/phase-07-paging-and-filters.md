---
phase: "07"
title: "Paging & Advanced Ticket Filters"
status: pending
priority: P2
effort: 3h
depends_on: phase-03-ticket-core.md
---

# Phase 07 — Paging & Advanced Ticket Filters

**Parent:** [plan.md](./plan.md) | **Depends on:** [Phase 03](./phase-03-ticket-core.md)
**Tech docs:** `d:\projects\alliance-suplier\Tech-docs.md`

## Overview

Nâng cấp `GET /api/v1/tickets` với offset-based pagination và thêm filter params. Tất cả params đều optional — backward compatible với Phase 03.

## Key Insights

- Tất cả filter params mới đều optional — không breaking change
- `requesterId` / `confirmedById` filter: chỉ Manager/Admin được dùng; User luôn bị force filter theo userId của mình
- `search` thực hiện ILIKE trên `freeTextDesc` và `products.name` (JOIN Product)
- EF Core: dùng `.Skip((page-1) * pageSize).Take(pageSize)` + riêng một query `.CountAsync()` cho total
- `pageSize` default 10, max 50 — validate ở validator/controller, không để EF tự xử lý

## Requirements

### BE

**Query params mới (tất cả optional):**
```
GET /api/v1/tickets
  ?status=Pending|Confirmed|Done
  &overdue=true|false          (đã có)
  &type=Broken|Empty           (mới)
  &requesterId={guid}          (mới, Manager/Admin only)
  &confirmedById={guid}        (mới, Manager/Admin only)
  &deadlineFrom={date}         (mới, ISO 8601)
  &deadlineTo={date}           (mới, ISO 8601)
  &search={string}             (mới, ILIKE on freeTextDesc + product name)
  &page=1                      (mới, default 1)
  &pageSize=10                 (mới, default 10, max 50)
```

**Response shape (thay thế array trước đây):**
```json
{
  "success": true,
  "data": {
    "items": [ ...TicketListItem ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 47,
      "totalPages": 5
    }
  }
}
```

### FE

- `useTickets` hook: nhận `filters` object + `page` state, query key bao gồm tất cả filter params
- `MyTickets`: pagination controls (prev/next + "Trang X / Y")
- `AllTickets`: pagination controls + filter UI (type dropdown, search input, deadline date range, requesterId)
- TanStack Query invalidation khi create/confirm/done vẫn giữ nguyên

## Architecture

### BE Files to Modify / Create

**`AllianceSupplier.Domain/Interfaces/Repositories/ITicketRepository.cs`**
- Thay `GetAllAsync(Guid? userId, bool isManager, string? status, bool? overdue)` bằng:
  `GetAllAsync(TicketFilterParams filter)` trả về `Task<(IEnumerable<Ticket> items, int total)>`

**`AllianceSupplier.Service/DTOs/Tickets/TicketFilterParams.cs`** ← **file mới**
```csharp
record TicketFilterParams(
    Guid? UserId,          // set khi role == User (force filter)
    bool IsManager,        // true = Manager/Admin
    string? Status,
    bool? Overdue,
    string? Type,
    Guid? RequesterId,     // chỉ áp dụng nếu IsManager == true
    Guid? ConfirmedById,   // chỉ áp dụng nếu IsManager == true
    DateTime? DeadlineFrom,
    DateTime? DeadlineTo,
    string? Search,
    int Page,              // default 1
    int PageSize           // default 10
);
```

**`AllianceSupplier.Service/DTOs/Common/PagedResult.cs`** ← **file mới**
```csharp
record PagedResult<T>(
    IEnumerable<T> Items,
    int Page,
    int PageSize,
    int Total,
    int TotalPages
);
```

**`AllianceSupplier.Infrastructure/Repositories/TicketRepository.cs`**
- Implement `GetAllAsync(TicketFilterParams filter)`:
  - Build `IQueryable<Ticket>` với chaining `.Where()` theo từng param
  - `search`: `.Where(t => EF.Functions.ILike(t.FreeTextDesc, $"%{search}%") || EF.Functions.ILike(t.Product.Name, $"%{search}%"))`
  - Count trước khi phân trang: `var total = await query.CountAsync()`
  - Sau đó: `.Skip((page-1) * pageSize).Take(pageSize)`
  - Trả `(items, total)`

**`AllianceSupplier.Service/Interfaces/ITicketService.cs`**
- Thay signature `GetAllAsync` thành: `Task<PagedResult<TicketListItem>> GetAllAsync(TicketFilterParams filter)`

**`AllianceSupplier.Service/TicketService.cs`**
- Cập nhật `GetAllAsync`: nhận `TicketFilterParams`, gọi repo, map items, tính `totalPages = (int)Math.Ceiling((double)total / filter.PageSize)`, trả `PagedResult<TicketListItem>`

**`AllianceSupplier.Api/DTOs/Tickets/TicketQueryParams.cs`** ← **file mới** (Api layer, [FromQuery])
```csharp
record TicketQueryParams(
    string? Status,
    bool? Overdue,
    string? Type,
    Guid? RequesterId,
    Guid? ConfirmedById,
    DateTime? DeadlineFrom,
    DateTime? DeadlineTo,
    string? Search,
    int Page = 1,
    int PageSize = 10
);
```

**`AllianceSupplier.Api/Validators/TicketQueryParamsValidator.cs`** ← **file mới**
- `PageSize` Must be between 1 and 50
- `Page` Must be >= 1
- `Type` if set: must be valid TicketType enum string
- `Status` if set: must be valid TicketStatus enum string

**`AllianceSupplier.Api/Controllers/TicketsController.cs`**
- Update GET action: `([FromQuery] TicketQueryParams query)` → map to `TicketFilterParams` → call service → return `Ok(pagedResult)`
- Map: set `UserId` từ JWT nếu role == User; set `IsManager` từ role claim

### FE Files to Modify

**`src/fe/src/hooks/useTickets.ts`**
- Thêm `filters` param: `{ status?, type?, requesterId?, confirmedById?, deadlineFrom?, deadlineTo?, search? }`
- Thêm `page: number` param (default 1)
- Query key: `[...QUERY_KEYS.tickets, filters, page]`
- Return: `{ items, pagination }` từ response

**`src/fe/src/types/index.ts`**
- Thêm `Pagination` interface: `{ page, pageSize, total, totalPages }`
- Thêm `PagedTickets` interface: `{ items: TicketListItem[], pagination: Pagination }`

**`src/fe/src/pages/MyTickets.tsx`**
- Thêm `page` state (useState(1)), reset về 1 khi filter thay đổi
- Hiển thị pagination controls: "← Prev | Trang {page}/{totalPages} | Next →"
- Disable Prev/Next khi ở trang đầu/cuối

**`src/fe/src/pages/AllTickets.tsx`**
- Thêm filter state: `{ type, requesterId, deadlineFrom, deadlineTo, search }`
- Filter UI:
  - Search input (debounce 300ms)
  - Type dropdown: All / Broken / Empty
  - DeadlineFrom + DeadlineTo date inputs
  - RequesterId: nếu có danh sách users, dropdown; nếu không có, text input (Guid)
- Pagination controls (giống MyTickets)

**`src/fe/src/components/PaginationControls.tsx`** ← **component mới** (dùng chung cho cả 2 pages)
- Props: `{ page, totalPages, onPageChange }`

## Related Code Files

- `src/be/AllianceSupplier.Domain/Interfaces/Repositories/ITicketRepository.cs` — thay signature
- `src/be/AllianceSupplier.Infrastructure/Repositories/TicketRepository.cs` — impl mới
- `src/be/AllianceSupplier.Service/Interfaces/ITicketService.cs` — thay signature
- `src/be/AllianceSupplier.Service/TicketService.cs` — update GetAllAsync
- `src/be/AllianceSupplier.Api/Controllers/TicketsController.cs` — update GET action
- `src/fe/src/hooks/useTickets.ts` — thêm pagination + filter params
- `src/fe/src/pages/MyTickets.tsx` — thêm pagination
- `src/fe/src/pages/AllTickets.tsx` — thêm pagination + filters

## Implementation Steps

1. Tạo `TicketFilterParams` record trong `AllianceSupplier.Service/DTOs/Tickets/`
2. Tạo `PagedResult<T>` record trong `AllianceSupplier.Service/DTOs/Common/`
3. Cập nhật `ITicketRepository.GetAllAsync` signature → nhận `TicketFilterParams`, trả `Task<(IEnumerable<Ticket>, int)>`
4. Implement `TicketRepository.GetAllAsync` mới: chain `.Where()` theo filter, count, skip/take
5. Cập nhật `ITicketService.GetAllAsync` signature → trả `Task<PagedResult<TicketListItem>>`
6. Cập nhật `TicketService.GetAllAsync`: gọi repo, map, tính totalPages, wrap vào `PagedResult`
7. Tạo `TicketQueryParams` record trong `AllianceSupplier.Api/DTOs/Tickets/`
8. Tạo `TicketQueryParamsValidator` trong `AllianceSupplier.Api/Validators/`
9. Cập nhật `TicketsController` GET action: bind `[FromQuery] TicketQueryParams`, map sang `TicketFilterParams`, trả Ok
10. `dotnet build` — 0 errors
11. Test via Swagger: GET /tickets?page=1&pageSize=5 → đúng response shape
12. Test: GET /tickets?search=máy in → lọc đúng
13. Test: GET /tickets?pageSize=51 → 422
14. FE: cập nhật `types/index.ts` thêm Pagination + PagedTickets interfaces
15. FE: cập nhật `useTickets` hook với pagination + filter params
16. FE: tạo `PaginationControls` component
17. FE: cập nhật `MyTickets.tsx` với pagination
18. FE: cập nhật `AllTickets.tsx` với filters + pagination
19. `npm run dev` — 0 TS errors

## Todo

- [ ] Service/DTOs: TicketFilterParams record
- [ ] Service/DTOs: PagedResult\<T\> record
- [ ] Domain: ITicketRepository — cập nhật GetAllAsync signature
- [ ] Infrastructure: TicketRepository — implement GetAllAsync với full filter + skip/take + count
- [ ] Service: ITicketService — cập nhật GetAllAsync signature
- [ ] Service: TicketService — update GetAllAsync, wrap PagedResult
- [ ] Api/DTOs: TicketQueryParams record [FromQuery]
- [ ] Api/Validators: TicketQueryParamsValidator (page >= 1, pageSize 1-50, enum strings)
- [ ] Api: TicketsController — update GET action
- [ ] `dotnet build` — 0 errors
- [ ] FE: types/index.ts — Pagination, PagedTickets
- [ ] FE: useTickets — pagination + filter params + query key update
- [ ] FE: PaginationControls component
- [ ] FE: MyTickets — pagination controls
- [ ] FE: AllTickets — filter UI + pagination controls
- [ ] `npm run dev` — 0 TS errors

## Success Criteria

- `GET /api/v1/tickets` (no params) → `{ items: [...], pagination: { page:1, pageSize:10, total:N, totalPages:M } }`
- `GET /api/v1/tickets?page=2&pageSize=5` → đúng offset (items 6-10)
- `GET /api/v1/tickets?pageSize=51` → 422
- `GET /api/v1/tickets?type=Broken` → chỉ trả Broken tickets
- `GET /api/v1/tickets?search=máy` → trả tickets có freeTextDesc hoặc product name chứa "máy"
- `GET /api/v1/tickets?deadlineFrom=2026-06-01&deadlineTo=2026-06-30` → đúng date range
- `GET /api/v1/tickets?requesterId={guid}` as User → filter bị ignore (User chỉ thấy ticket của mình)
- `GET /api/v1/tickets?requesterId={guid}` as Manager → filter áp dụng đúng
- FE: MyTickets hiển thị pagination controls, click Next chuyển trang
- FE: AllTickets có search input, type dropdown, date range inputs hoạt động

## Risk Assessment

- `search` với ILIKE + JOIN Product có thể slow nếu dataset lớn — acceptable cho <50 users
- Thay signature `GetAllAsync` ảnh hưởng Phase 03 implementation — dev Phase 07 phải merge sau Phase 03 xong
- `totalPages` phải handle edge case `total == 0` → `totalPages = 0` (không phải NaN)

## Security Considerations

- `requesterId` / `confirmedById` filter: validate trong Service — nếu role == User, ignore param, force UserId của mình
- `search` input: dùng parameterized query qua EF (không concatenate string raw) — an toàn khỏi SQL injection
- `pageSize` max 50 enforced ở validator — tránh DoS qua oversized response
