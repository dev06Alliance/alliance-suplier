---
phase: "06"
title: "Polish & Integration"
status: completed
effort: 3h
depends_on: phase-05-admin-features.md
---

# Phase 06 — Polish & Integration

**Parent:** [plan.md](./plan.md) | **Prev:** [Phase 05](./phase-05-admin-features.md)
**Tech docs:** `d:\projects\alliance-suplier\Tech-docs.md`

## Overview

Tie together items that span phases: EF migration, ExceptionMiddleware + BaseController, JSON serialization config, FE foundation (packages + folder structure + env), validation error display, global error handling, route completeness, and manual smoke test.

> **Note:** Several of these items (ExceptionMiddleware, BaseController, JSON options, FE setup) are prerequisites for earlier phases to work end-to-end. They are tracked here but should be implemented as blockers are hit during Phases 02-05.

## Requirements

**BE (cross-cutting, should exist from Phase 02 onward):**
- `ExceptionMiddleware` — global catch, maps exception types to HTTP status + error envelope
- Custom exception types: `NotFoundException` (404), `ForbiddenException` (403), `UnauthorizedException` (401), `ValidationException` (422)
- `BaseController` — `Ok<T>(data)` helper returning `{ success: true, data }`, `GetCurrentUserId()` from JWT claims
- `ApiResponse<T>` + `ApiError` records — canonical response shape
- JSON options: camelCase + `JsonStringEnumConverter` registered on `AddControllers`
- EF migration `Init` generated and applied

**FE (foundation, should exist from Phase 02 onward):**
- 7 packages installed: `axios @tanstack/react-query zustand react-router-dom react-hook-form zod date-fns`
- Full folder structure: `lib/ store/ hooks/ pages/ components/ types/ router/`
- Env files: `.env.development`, `.env.production`
- `lib/axios.ts` — 1 instance, request interceptor (attach Bearer), 401 response interceptor (dedup refresh)
- `lib/queryClient.ts` — staleTime 30s, retry 1, refetchOnWindowFocus false
- `store/authStore.ts` — user, isAuthenticated, accessToken, setAuth, clearAuth
- `store/notifStore.ts` — badgeCount, increment, reset, isModalOpen, openModal, closeModal
- `hooks/query-keys.ts` — all query key constants
- `types/index.ts` — all TypeScript interfaces matching API response shapes
- `main.tsx` — wrapped with QueryClientProvider + BrowserRouter
- `ProtectedRoute` component
- `router/index.tsx` — all 7 routes wired with role guards

## Architecture

### BE Files to Create

`AllianceSupplier.Api/`
- `Exceptions/NotFoundException.cs`
- `Exceptions/ForbiddenException.cs`
- `Exceptions/UnauthorizedException.cs`
- `Middleware/ExceptionMiddleware.cs` — catch all, switch on exception type → status + `{ success: false, error: { code, message } }`
- `Controllers/BaseController.cs` — protected helpers: `Ok<T>`, `Created<T>`, `GetCurrentUserId()`
- `DTOs/ApiResponse.cs` — `record ApiResponse<T>(bool Success, T? Data, ApiError? Error)`
- `DTOs/ApiError.cs` — `record ApiError(string Code, string Message)`

**Program.cs additions:**
- `app.UseMiddleware<ExceptionMiddleware>()` — before `UseAuthentication`
- `.AddJsonOptions(o => { o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase; o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()); })`

**EF Migration:**
```
dotnet ef migrations add Init --project AllianceSupplier.Infrastructure --startup-project AllianceSupplier.Api
dotnet ef database update --project AllianceSupplier.Infrastructure --startup-project AllianceSupplier.Api
```

### FE Files to Create

`src/fe/`
- `.env.development` — `VITE_API_URL=http://localhost:5000`
- `.env.production` — `VITE_API_URL=` (blank, fill on deploy)

`src/fe/src/`
- `lib/axios.ts` — module-level `let accessToken = ''`; `export setAccessToken(t)`; instance with `baseURL: import.meta.env.VITE_API_URL`, `withCredentials: true`; request interceptor adds `Authorization: Bearer ${accessToken}`; response interceptor: on 401 call POST /auth/refresh (dedup with a `refreshing` promise), set new token, retry original request
- `lib/queryClient.ts` — `new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } })`
- `store/authStore.ts` — Zustand: `{ user: UserRef | null, isAuthenticated: bool, setAuth(user, token), clearAuth() }`; `setAuth` calls `setAccessToken` from axios.ts
- `store/notifStore.ts` — Zustand: `{ badgeCount: number, increment(), reset(), isModalOpen: bool, openModal(), closeModal() }`
- `hooks/query-keys.ts` — export `QUERY_KEYS` const with tickets, ticket(id), notifications, categories, products(categoryId?), reports(from?, to?)
- `types/index.ts` — interfaces: UserRef, User, TicketStatus (string enum), TicketType (string enum), NotifType (string enum), Role (string enum), TicketListItem, TicketDetail, DeadlineHistoryEntry, Category, Product, Notification, ApiResponse\<T\>, ApiError, ReportData
- `components/ProtectedRoute.tsx` — reads `isAuthenticated + user.role` from authStore; redirects to /login if unauth; redirects to /tickets if wrong role; renders `<Outlet />`
- `router/index.tsx` — full route table (see Requirements)
- `main.tsx` — update: `<QueryClientProvider client={queryClient}><BrowserRouter><App /></BrowserRouter></QueryClientProvider>`

**router/index.tsx route table:**
```
/ → redirect to /tickets (if auth) or /login
/login → public → <Login />
/tickets → ProtectedRoute([User, Manager, Admin]) → <MyTickets /> or <AllTickets /> (by role)
/tickets/new → ProtectedRoute([User, Manager, Admin]) → <CreateTicket />
/tickets/:id → ProtectedRoute([User, Manager, Admin]) → <TicketDetail />
/manage/categories → ProtectedRoute([Admin]) → <ManageCategories />
/manage/products → ProtectedRoute([Admin]) → <ManageProducts />
/reports → ProtectedRoute([Admin]) → <Reports />
* → redirect to /tickets
```

**Validation error display:**
- RHF + Zod: `formState.errors.field.message` rendered below each input
- Server 422: Axios interceptor parses `error.response.data.error.message`; display at form level or via simple toast state
- Other server errors (400/403/404/500): displayed via component-level `errorMessage` state at top of form/page

## Implementation Steps

1. Create `Exceptions/` folder with NotFoundException, ForbiddenException, UnauthorizedException
2. Create `DTOs/ApiResponse.cs` + `DTOs/ApiError.cs` records
3. Implement `ExceptionMiddleware` — try/catch all, switch to map types to status codes + error envelope
4. Create `BaseController` with `Ok<T>`, `Created<T>`, `GetCurrentUserId()`
5. Register `UseMiddleware<ExceptionMiddleware>()` as first middleware in Program.cs
6. Add JSON options (camelCase + string enum) to `AddControllers` in Program.cs
7. Run: `dotnet ef migrations add Init --project AllianceSupplier.Infrastructure --startup-project AllianceSupplier.Api`
8. Run: `dotnet ef database update ...`
9. Verify: 6 tables in PostgreSQL, DbSeeder creates seed users on startup
10. `cd src/fe && npm install axios @tanstack/react-query zustand react-router-dom react-hook-form zod date-fns`
11. Create folder structure: lib/ store/ hooks/ types/ components/ pages/ router/
12. Create .env.development + .env.production
13. Implement lib/axios.ts (full interceptor pattern)
14. Implement lib/queryClient.ts
15. Implement store/authStore.ts + notifStore.ts
16. Implement hooks/query-keys.ts + types/index.ts
17. Update main.tsx with providers
18. Implement ProtectedRoute component
19. Implement router/index.tsx
20. `dotnet build` — verify 0 errors
21. `npm run dev` — verify 0 TypeScript errors
22. Manual smoke test: login → create ticket → manager confirm → done → SSE notification arrives → admin view reports

## Todo

- [x] Api/Exceptions: NotFoundException, ForbiddenException, UnauthorizedException
- [x] Api/DTOs: ApiResponse\<T\>, ApiError records
- [x] Api/Middleware: ExceptionMiddleware
- [x] Api/Controllers: BaseController
- [x] Program.cs: UseMiddleware<ExceptionMiddleware> + JSON options
- [x] EF: `dotnet ef migrations add Init ...`
- [x] EF: `dotnet ef database update ...`
- [x] Verify: 6 tables exist, DbSeeder runs
- [ ] FE: npm install 7 packages
- [ ] FE: create folder structure
- [ ] FE: .env.development + .env.production
- [ ] FE: lib/axios.ts
- [ ] FE: lib/queryClient.ts
- [ ] FE: store/authStore.ts + notifStore.ts
- [ ] FE: hooks/query-keys.ts + types/index.ts
- [ ] FE: main.tsx with providers
- [ ] FE: ProtectedRoute component
- [ ] FE: router/index.tsx (all 7 routes)
- [x] `dotnet build` — 0 errors
- [ ] `npm run dev` — 0 TS errors
- [ ] Manual smoke test: full happy path

## Success Criteria

- `dotnet build AllianceSupplier.slnx` exits 0
- 6 tables in PostgreSQL after migration
- DbSeeder creates seed users on first run
- `npm run dev` starts with 0 TypeScript errors
- `GET /swagger` — 200 in Development
- POST /auth/login with seeded credentials → 200 + accessToken
- Reload page → GET /me restores session (access token refreshed via cookie)
- User accessing /manage/products → redirected to /tickets
- Create ticket as User → SSE event received by Manager tab → badge count +1
- All form validation errors display inline
- Server error message displays on failed submit
