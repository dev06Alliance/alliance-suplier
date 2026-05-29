# FE Architecture Research — React + TypeScript Stack

> Stack: React 19 + TS (Vite), TanStack Query v5, Zustand, Axios, RHF + Zod, React Router v6, SSE, date-fns

---

## 1. Axios Instance + JWT Interceptors

**File:** `src/fe/src/lib/axios.ts`

```ts
import axios from 'axios';

let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => { accessToken = t; };

const api = axios.create({ baseURL: '/api', withCredentials: true }); // withCredentials sends HttpOnly cookie

// Request: attach access token from memory
api.interceptors.request.use(cfg => {
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`;
  return cfg;
});

// Response: auto-refresh on 401
let refreshing: Promise<string> | null = null;
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (!refreshing) {
        refreshing = axios.post('/api/auth/refresh', {}, { withCredentials: true })
          .then(r => { setAccessToken(r.data.accessToken); return r.data.accessToken; })
          .finally(() => { refreshing = null; });
      }
      const token = await refreshing;
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    }
    return Promise.reject(err);
  }
);
export default api;
```

Key points:
- Access token lives in module-level variable (not localStorage) — survives re-renders, cleared on tab close.
- `refreshing` promise deduplicates concurrent 401s (queue pattern).
- `withCredentials: true` on both instance and refresh call so browser sends the HttpOnly refresh cookie.

---

## 2. TanStack Query Setup

**File:** `src/fe/src/lib/queryClient.ts`

```ts
import { QueryClient } from '@tanstack/react-query';
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});
```

**File:** `src/fe/src/main.tsx` — wrap with `<QueryClientProvider client={queryClient}>`.

**Invalidation patterns after mutations:**

```ts
// In useMutation onSuccess — invalidate by key
queryClient.invalidateQueries({ queryKey: ['suppliers'] });

// Optimistic: use setQueryData before mutate, invalidate on settle
queryClient.setQueryData(['supplier', id], updatedData);
```

Convention: query keys as arrays `['resource', filters]`. Define in `src/fe/src/hooks/query-keys.ts`.

---

## 3. Zustand Store — Notification Badge

**File:** `src/fe/src/store/notificationStore.ts`

```ts
import { create } from 'zustand';

interface NotificationState {
  badgeCount: number;
  isModalOpen: boolean;
  increment: () => void;
  reset: () => void;
  openModal: () => void;
  closeModal: () => void;
}

export const useNotificationStore = create<NotificationState>(set => ({
  badgeCount: 0,
  isModalOpen: false,
  increment: () => set(s => ({ badgeCount: s.badgeCount + 1 })),
  reset: () => set({ badgeCount: 0 }),
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
}));
```

Usage: `const { badgeCount, increment } = useNotificationStore()`. No context provider needed.

---

## 4. React Router v6 — Role-Based Protected Routes

**File:** `src/fe/src/components/ProtectedRoute.tsx`

```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface Props { allowedRoles: string[]; }

export function ProtectedRoute({ allowedRoles }: Props) {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user!.role)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}
```

**File:** `src/fe/src/router/index.tsx`

```tsx
<Route element={<ProtectedRoute allowedRoles={['admin']} />}>
  <Route path="/admin" element={<AdminDashboard />} />
</Route>
<Route element={<ProtectedRoute allowedRoles={['supplier', 'admin']} />}>
  <Route path="/orders" element={<Orders />} />
</Route>
```

Auth state (user + isAuthenticated) lives in `src/fe/src/store/authStore.ts` (Zustand). On app load, restore from `/api/auth/me` using TanStack Query, then set store.

---

## 5. SSE Hook — useSSE

**File:** `src/fe/src/hooks/useSSE.ts`

```ts
import { useEffect, useRef } from 'react';

interface Options {
  token: string | null;
  onMessage: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
}

export function useSSE(url: string, { token, onMessage, onError }: Options) {
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!token) return;
    const fullUrl = `${url}?token=${encodeURIComponent(token)}`;
    const connect = () => {
      const es = new EventSource(fullUrl);
      esRef.current = es;
      es.onmessage = onMessage;
      es.onerror = (e) => {
        onError?.(e);
        es.close();
        setTimeout(connect, 3000); // reconnect after 3s
      };
    };
    connect();
    return () => { esRef.current?.close(); };
  }, [url, token]); // reconnect if token changes
}
```

Usage in `NotificationProvider`:
```ts
const { badgeCount, increment } = useNotificationStore();
useSSE('/api/notifications/stream', {
  token: accessToken,
  onMessage: (e) => { const data = JSON.parse(e.data); increment(); },
});
```

Note: token passed via query param because `EventSource` doesn't support custom headers. Backend must validate this token and expire it quickly or use a short-lived SSE-specific token.

---

## date-fns UTC → Local Display

```ts
import { formatDistanceToNow, format } from 'date-fns';
// Backend returns UTC ISO string
const local = format(new Date(utcString), 'dd/MM/yyyy HH:mm'); // auto-converts to browser local
const relative = formatDistanceToNow(new Date(utcString), { addSuffix: true });
```

No config needed — `new Date(isoString)` always parses as UTC and displays in local timezone.

---

## Suggested Folder Structure

```
src/fe/src/
├── lib/          axios.ts, queryClient.ts
├── store/        authStore.ts, notificationStore.ts
├── hooks/        useSSE.ts, query-keys.ts, useAuth.ts
├── router/       index.tsx
├── components/   ProtectedRoute.tsx, NotificationBadge.tsx
├── pages/        Login.tsx, AdminDashboard.tsx, Orders.tsx
└── main.tsx
```

---

## Unresolved Questions
- SSE token strategy: reuse access token (short-lived) or issue dedicated SSE token?
- Should `authStore` persist to `sessionStorage` to survive hard refresh, or always re-fetch from `/api/auth/me`?
- Role list: confirmed roles are `admin`, `supplier` — any others (e.g. `viewer`, `staff`)?
