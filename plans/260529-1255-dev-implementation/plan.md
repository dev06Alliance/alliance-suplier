---
title: "Báo Hết/Hỏng Đồ Công Ty — Full Implementation"
description: "Restructure BE into 4 Clean Architecture projects + implement auth, tickets, SSE notifications, admin features."
status: pending
priority: P1
effort: 31h
branch: main
tags: [dotnet, react, postgresql, clean-architecture, jwt, sse]
created: 2026-05-29
---

# Báo Hết/Hỏng Đồ Công Ty — Implementation Plan

**Tech docs:** `D:\projects\alliance-suplier\Tech-docs.md`
**Stack:** .NET 10 + EF Core 10 + PostgreSQL + React 19 + TypeScript + Vite

## Phases

| # | Phase | Effort | Status |
|---|---|---|---|
| 01 | [Solution Foundation](./phase-01-solution-foundation.md) | 6h | ✅ completed (đã có sẵn) |
| 02 | [Authentication](./phase-02-authentication.md) | 5h | pending |
| 03 | [Ticket Core](./phase-03-ticket-core.md) | 8h | pending |
| 04 | [Notifications + SSE](./phase-04-notifications-sse.md) | 5h | pending |
| 05 | [Admin Features](./phase-05-admin-features.md) | 4h | pending |
| 06 | [Polish](./phase-06-polish.md) | 3h | pending |
| 07 | [Paging & Advanced Filters](./phase-07-paging-and-filters.md) | 3h | pending |

**Total:** 34h

## Dependency Order
01 → 02 → 03 → 04 → 05 → 06 (sequential) | 07 depends on 03 (có thể implement song song sau Phase 03)

## Validation Summary

**Validated:** 2026-05-29
**Questions asked:** 4

### Confirmed Decisions
- **Phase 01 scope:** Codebase đã có 95% Phase 01. Bỏ qua, bắt đầu từ Phase 02. Chỉ cần: chạy EF migration + cài FE packages
- **Refresh token:** Parse cookie value làm JWT (7d expiry), validate signature + expiry bằng JwtSecurityTokenHandler — stateless hoàn toàn
- **INotificationService stub:** Register `NullNotificationService` (no-op) cho Phase 03, swap `NotificationService` thật ở Phase 04
- **Session restore:** Gọi GET /me trong `App.tsx` khi mount (useQuery với enabled: true)

### Action Items
- [ ] Cập nhật phase-01 status → `completed` (foundation đã có sẵn)
- [ ] Thêm `NullNotificationService` vào danh sách files Phase 03
- [ ] Ghi rõ trong phase-02: refresh token là JWT (không phải opaque string)

---

## Key Constraints
- BE: no generic repo, no UoW wrapper, no refresh token in DB
- FE: access token in memory only (Zustand), never localStorage
- SSE: auth via ?token= query param, SseManager keyed by userId (Guid)
- Enums → string in DB; Notification.Payload → jsonb
- CORS: localhost:5173 dev only
