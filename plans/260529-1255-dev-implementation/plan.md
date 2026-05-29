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
| 01 | [Solution Foundation](./phase-01-solution-foundation.md) | 6h | pending |
| 02 | [Authentication](./phase-02-authentication.md) | 5h | pending |
| 03 | [Ticket Core](./phase-03-ticket-core.md) | 8h | pending |
| 04 | [Notifications + SSE](./phase-04-notifications-sse.md) | 5h | pending |
| 05 | [Admin Features](./phase-05-admin-features.md) | 4h | pending |
| 06 | [Polish](./phase-06-polish.md) | 3h | pending |

**Total:** 31h

## Dependency Order
01 → 02 → 03 → 04 → 05 → 06 (sequential, each phase builds on prior)

## Key Constraints
- BE: no generic repo, no UoW wrapper, no refresh token in DB
- FE: access token in memory only (Zustand), never localStorage
- SSE: auth via ?token= query param, SseManager keyed by userId (Guid)
- Enums → string in DB; Notification.Payload → jsonb
- CORS: localhost:5173 dev only
