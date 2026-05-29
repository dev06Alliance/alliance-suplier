---
title: Phase 02 - Authentication
status: pending
priority: P1
effort: 5h
created: 2026-05-29
---

# Phase 02 — Authentication

## Context
- Parent: [plan.md](./plan.md)
- Depends on: [Phase 01 — Solution Foundation](./phase-01-solution-foundation.md)
- Tech docs: `D:\projects\alliance-suplier\Tech-docs.md`
- Next: [Phase 03 — Ticket Core](./phase-03-ticket-core.md)

## Overview

| Field | Value |
|---|---|
| Date | 2026-05-29 |
| Description | BE: JWT auth endpoints (login/refresh/logout/me). FE: Axios interceptors, authStore, ProtectedRoute, Router setup |
| Priority | P1 |
| Status | pending |
| Effort | 5h |

## Key Insights
- Refresh token: NOT stored in DB, NOT rotated — fixed 7d HttpOnly cookie value (simple strategy for <50 users)
- Access token: NOT stored in DB or localStorage — lives in Zustand store (memory only), sent as Bearer header
- SSE auth uses ?token= query param (EventSource cannot set headers) — handled in Phase 04
- On app reload: access token lost from memory -> call GET /api/v1/auth/me with HttpOnly cookie -> restore user state
- [Authorize(Roles="Manager")] attribute on controller actions — BR-05 (done only by confirmedBy) checked in Service layer only
- JWT payload: `{ sub: userId, role, iat, exp }` — ClaimTypes.NameIdentifier + ClaimTypes.Role

## Requirements
### BE
- `POST /api/v1/auth/login` — BCrypt verify -> JWT access (15m) + set refresh_token HttpOnly cookie (7d); response: `{ accessToken, user: {id,name,email,role} }`
- `POST /api/v1/auth/refresh` — read refresh_token cookie -> validate -> issue new access token (do NOT rotate cookie)
- `POST /api/v1/auth/logout` — delete refresh_token cookie; return 200
- `GET /api/v1/auth/me` — [Authorize] -> return current user info from JWT claims
- `[Authorize(Roles = "...")]` on controller actions per authorization matrix

### FE
- Axios instance with request interceptor (attach access token) + response interceptor (auto-refresh on 401, deduplicate concurrent 401s)
- Zustand authStore: user, isAuthenticated, accessToken stored in memory
- On app init: call GET /me to restore session; if 401, stay unauthenticated
- ProtectedRoute component: check isAuthenticated + role, redirect accordingly
- Login page: RHF + Zod form, submit to /auth/login, store accessToken in Zustand
- React Router v6 full setup with role-based routes

## Architecture

### BE Files to Create

**`src/be/AllianceSupplier.Service/`**
- `Interfaces/IAuthService.cs` — `Task<LoginResult> LoginAsync(LoginRequest)`, `Task<string> RefreshAsync(string refreshToken)`, `Task<UserDto> GetMeAsync(Guid userId)`
- `AuthService.cs` — impl IAuthService; inject IUserRepository + IConfiguration (for Jwt:Key etc.)
- `DTOs/LoginRequest.cs` — Email, Password
- `DTOs/LoginResult.cs` — AccessToken(string), User(UserDto)
- `DTOs/UserDto.cs` — Id, Name, Email, Role(string)

**`src/be/AllianceSupplier.Api/`**
- `Controllers/AuthController.cs` — POST login, POST refresh, POST logout, GET me; inherits BaseController
- `Controllers/BaseController.cs` — `protected IActionResult Ok<T>(T data)` returning `ApiResponse<T>(true, data, null)`; helper `GetCurrentUserId()` from ClaimTypes.NameIdentifier
- `DTOs/Auth/LoginRequestDto.cs` — Email, Password
- `DTOs/Auth/LoginResponseDto.cs` — AccessToken, User(UserDto)
- `Validators/LoginRequestValidator.cs` — NotEmpty + EmailAddress on Email; NotEmpty on Password
- `Middleware/ExceptionMiddleware.cs` — catch NotFoundException(404), ForbiddenException(403), UnauthorizedException(401), ValidationException(422), fallback 500
- `Exceptions/NotFoundException.cs`, `ForbiddenException.cs`, `UnauthorizedException.cs`

**`src/be/AllianceSupplier.Api/Program.cs`** (update from phase 01)
- Register `IAuthService` as Scoped
- Add FluentValidation: `services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>()`
- Wire ExceptionMiddleware: `app.UseMiddleware<ExceptionMiddleware>()` before all others

### FE Files to Create / Update

- `src/fe/src/lib/axios.ts` — COMPLETE implementation (was stub in Phase 01):
  - `let accessToken: string | null` module variable
  - `setAccessToken(t)` export
  - axios.create baseURL=import.meta.env.VITE_API_URL, withCredentials:true
  - Request interceptor: attach `Authorization: Bearer {accessToken}`
  - Response interceptor: on 401, deduplicate refresh via promise variable, retry original request
- `src/fe/src/store/authStore.ts` — COMPLETE:
  - `{ user: User|null, isAuthenticated, accessToken: string|null, setAuth(user,token), clearAuth() }`
  - `setAuth` also calls `setAccessToken` from axios.ts
- `src/fe/src/hooks/useAuth.ts` — TanStack Query hook calling GET /api/v1/auth/me on mount; on success: setAuth; on 401: clearAuth
- `src/fe/src/components/ProtectedRoute.tsx` — Outlet pattern; redirect /login if !isAuthenticated; redirect role-default if wrong role
- `src/fe/src/router/index.tsx` — COMPLETE: BrowserRouter, public /login, protected routes by role per matrix
- `src/fe/src/pages/Login.tsx` — RHF + Zod schema, call POST /auth/login, store token, navigate to /tickets

### Route Map
| Path | Allowed Roles |
|---|---|
| /login | Public |
| /tickets | User, Manager, Admin |
| /tickets/new | User, Manager, Admin |
| /tickets/:id | User(own), Manager, Admin |
| /manage/products | Admin |
| /reports | Admin |

## Related Existing Code
- `src/be/AllianceSupplier.Infrastructure/Repositories/UserRepository.cs` — GetByEmailAsync (Phase 01)
- `src/be/AllianceSupplier.Domain/Entities/User.cs` — PasswordHash field (Phase 01)
- `src/be/AllianceSupplier.Api/Program.cs` — JWT AddAuthentication skeleton (Phase 01)
- `src/be/appsettings.json` — Jwt:Key/Issuer/Audience/AccessTokenExpiryMinutes (Phase 01)
- `src/fe/src/lib/axios.ts` — stub from Phase 01
- `src/fe/src/store/authStore.ts` — stub from Phase 01

## Implementation Steps

1. Tao custom exception classes: NotFoundException, ForbiddenException, UnauthorizedException trong Api/Exceptions/
2. Implement ExceptionMiddleware — map exception types to HTTP status + error envelope
3. Register ExceptionMiddleware as first middleware in Program.cs
4. Tao UserDto + LoginRequest + LoginResult DTOs trong Service/DTOs/
5. Implement IAuthService interface
6. Implement AuthService.LoginAsync:
   - GetByEmailAsync -> if null throw UnauthorizedException("Invalid credentials")
   - BCrypt.Verify(password, hash) -> if false throw UnauthorizedException
   - Generate JWT: JwtSecurityTokenHandler, payload {sub, role, iat, exp=+15m}, sign with HS256
   - Return LoginResult with access token + UserDto
7. Implement AuthService.RefreshAsync:
   - Validate refresh token (check expiry = parse cookie DateTimeOffset, or just re-issue if cookie exists — simple approach)
   - Generate new access token only (no cookie update)
8. Implement AuthService.GetMeAsync — GetByIdAsync -> map to UserDto
9. Tao LoginRequestDto + LoginRequestValidator (FluentValidation) trong Api
10. Register AddValidatorsFromAssemblyContaining + AddFluentValidationAutoValidation (or manual invoke in service)
11. Implement AuthController:
    - POST /login: validate DTO -> call service -> set refresh_token cookie (HttpOnly, Secure=false dev, SameSite=Strict, Expires=+7d) -> return Ok(LoginResponseDto)
    - POST /refresh: read Request.Cookies["refresh_token"] -> if null throw UnauthorizedException -> call service -> return { accessToken }
    - POST /logout: Response.Cookies.Delete("refresh_token") -> return Ok
    - GET /me: [Authorize] -> GetCurrentUserId() -> GetMeAsync -> return Ok(UserDto)
12. Implement BaseController with Ok<T> helper + GetCurrentUserId()
13. Complete FE axios.ts interceptors (request: attach token; response: 401 dedup refresh)
14. Complete FE authStore.ts with setAuth/clearAuth
15. Implement useAuth hook — useQuery GET /me, on success setAuth, on error clearAuth
16. Tao ProtectedRoute component
17. Complete router/index.tsx with all routes + ProtectedRoute wrappers
18. Implement Login.tsx — Zod schema (email required + email format, password required), RHF, submit handler, navigate on success
19. Test login flow end-to-end: POST /login -> cookie set -> GET /me -> user returned

## Todo

- [ ] Api/Exceptions: NotFoundException, ForbiddenException, UnauthorizedException
- [ ] Api/Middleware: ExceptionMiddleware (full mapping)
- [ ] Service/DTOs: UserDto, LoginRequest, LoginResult
- [ ] Service: IAuthService interface
- [ ] Service: AuthService — LoginAsync (BCrypt + JWT generate)
- [ ] Service: AuthService — RefreshAsync
- [ ] Service: AuthService — GetMeAsync
- [ ] Api/DTOs: LoginRequestDto, LoginResponseDto
- [ ] Api/Validators: LoginRequestValidator
- [ ] Api: Register FluentValidation in Program.cs
- [ ] Api/Controllers: BaseController with helpers
- [ ] Api/Controllers: AuthController (login, refresh, logout, me)
- [ ] Program.cs: register IAuthService, wire ExceptionMiddleware
- [ ] FE: Complete axios.ts interceptors
- [ ] FE: Complete authStore.ts
- [ ] FE: useAuth hook
- [ ] FE: ProtectedRoute component
- [ ] FE: Complete router/index.tsx
- [ ] FE: Login.tsx page

## Success Criteria
- POST /api/v1/auth/login with valid creds -> 200 + `{ success:true, data: { accessToken, user:{id,name,email,role} } }` + Set-Cookie: refresh_token HttpOnly
- POST /api/v1/auth/login with wrong password -> 401 + `{ success:false, error:{code:"UNAUTHORIZED",...} }`
- GET /api/v1/auth/me without token -> 401
- GET /api/v1/auth/me with valid Bearer token -> 200 + user data
- POST /api/v1/auth/refresh with valid cookie -> 200 + new accessToken
- POST /api/v1/auth/logout -> 200 + cookie deleted
- FE: Login page submits, stores token, redirects to /tickets
- FE: Page reload -> GET /me restores session or redirects to /login
- FE: Accessing /manage/products as User role -> redirect to /tickets

## Risk Assessment
- Refresh token not in DB: if cookie stolen, no revocation mechanism — acceptable for <50 user localhost app
- ClockSkew=TimeSpan.Zero on JWT validation: server time drift could cause premature expiry — monitor in prod
- CORS + credentials: withCredentials must be set on FE axios + BE must allow specific origin (not AllowAnyOrigin) for cookies to work

## Security Considerations
- HttpOnly + SameSite=Strict on refresh_token cookie prevents XSS cookie theft
- Secure=true flag should be enabled in production (HTTPS only)
- BCrypt.Verify is constant-time — no timing attack on login
- Never return PasswordHash in any DTO
- JWT signing key from configuration, not hardcoded
- Generic error message for invalid credentials ("Invalid credentials", not "User not found" vs "Wrong password")
- [Authorize] on GET /me prevents unauthenticated access
- Role in JWT allows stateless authorization without DB lookup per request
