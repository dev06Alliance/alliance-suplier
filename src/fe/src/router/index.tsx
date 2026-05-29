import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { useAuthStore, useAuthHydrated } from '@/stores/authStore'
import { LoginPage } from '@/pages/LoginPage'
import { TicketListPage } from '@/pages/TicketListPage'
import { TicketDetailPage } from '@/pages/TicketDetailPage'
import { CreateTicketPage } from '@/pages/CreateTicketPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { CategoryManagementPage } from '@/pages/CategoryManagementPage'

function ProtectedRoute() {
  const token = useAuthStore((s) => s.token)
  const hydrated = useAuthHydrated()
  if (!hydrated) return null
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/tickets',     element: <TicketListPage /> },
          { path: '/tickets/new', element: <CreateTicketPage /> },
          { path: '/tickets/:id', element: <TicketDetailPage /> },
          { path: '/reports',     element: <ReportsPage /> },
          { path: '/categories',  element: <CategoryManagementPage /> },
          { index: true,          element: <Navigate to="/tickets" replace /> },
        ],
      },
    ],
  },
])
