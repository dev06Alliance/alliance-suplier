import { NavLink, useLocation } from 'react-router-dom'
import { LayoutList, Plus, Ticket, BarChart2, Package } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type Role = 'User' | 'Manager' | 'Admin'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  roles: Role[]
  exact?: boolean
}

const navConfig: NavItem[] = [
  { label: 'Ticket của tôi',   href: '/tickets',     icon: Ticket,     roles: ['User'],    exact: true },
  { label: 'Tất cả Ticket',    href: '/tickets',     icon: LayoutList, roles: ['Manager'], exact: true },
  { label: 'Tạo yêu cầu',     href: '/tickets/new', icon: Plus,       roles: ['User'] },
  { label: 'Báo cáo',          href: '/reports',     icon: BarChart2,  roles: ['Admin'] },
  { label: 'Quản lý danh mục', href: '/categories',  icon: Package,    roles: ['Admin'] },
]

const ROLE_LABEL: Record<Role, string> = {
  User:    'Nhân viên',
  Manager: 'Quản lý',
  Admin:   'Admin',
}

export function Sidebar() {
  const { role } = useAuth()
  const { user } = useAuthStore()
  const location = useLocation()

  const visible = navConfig.filter((item) =>
    role ? item.roles.includes(role as Role) : false
  )

  return (
    <aside className="w-60 shrink-0 bg-canvas border-r border-hairline flex flex-col h-full">
      {/* Brand */}
      <div className="h-16 flex items-center px-5 border-b border-hairline shrink-0">
        <span className="font-semibold text-ink tracking-tight">Alliance</span>
        <span className="ml-1.5 text-xs font-mono text-mute">Supplier</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visible.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.href
            : location.pathname.startsWith(item.href)

          return (
            <NavLink
              key={item.href + item.label}
              to={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm transition-colors',
                isActive
                  ? 'bg-canvas-soft text-ink font-medium border-l-2 border-ink pl-[10px]'
                  : 'text-body hover:text-ink hover:bg-canvas-soft-2'
              )}
            >
              <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-ink' : 'text-mute')} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* User info footer */}
      <div className="px-4 py-3 border-t border-hairline shrink-0">
        <p className="text-xs font-medium text-ink truncate">{user?.name ?? '—'}</p>
        <p className="text-[11px] font-mono text-mute mt-0.5">
          {role ? ROLE_LABEL[role as Role] : '—'}
        </p>
      </div>
    </aside>
  )
}
