import { useNavigate, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotifBell } from './NotifBell'
import { useAuthStore } from '@/stores/authStore'
import { removeToken } from '@/lib/auth'

const PAGE_TITLES: Record<string, string> = {
  '/tickets':     'Tickets',
  '/tickets/new': 'Tạo yêu cầu mới',
  '/reports':     'Báo cáo',
  '/categories':  'Quản lý danh mục',
}

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.startsWith('/tickets/')) return 'Chi tiết yêu cầu'
  return 'Alliance Supplier'
}

export function TopNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, role, clearAuth } = useAuthStore()

  const handleLogout = () => {
    removeToken()
    clearAuth()
    void navigate('/login')
  }

  const title = getPageTitle(location.pathname)

  return (
    <nav className="h-16 bg-canvas border-b border-hairline shadow-level-1 flex items-center justify-between px-6 shrink-0 z-10">
      {/* Page title */}
      <h2 className="text-sm font-medium text-ink">{title}</h2>

      {/* Right cluster */}
      <div className="flex items-center gap-3">
        <NotifBell />

        <div className="h-5 w-px bg-hairline" />

        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs font-medium text-ink leading-none">{user?.name ?? '—'}</p>
            <p className="text-[11px] text-mute font-mono mt-0.5">{role}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Đăng xuất"
            className="h-8 w-8"
          >
            <LogOut className="h-3.5 w-3.5 text-body" />
          </Button>
        </div>
      </div>
    </nav>
  )
}
