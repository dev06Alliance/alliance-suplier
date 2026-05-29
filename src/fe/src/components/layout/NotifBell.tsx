import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useNotifStore } from '@/stores/notifStore'
import { cn } from '@/lib/utils'

export function NotifBell() {
  const navigate = useNavigate()
  const { unreadCount, notifications, markAllRead, markRead } = useNotifStore()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-body" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-error text-on-primary text-[10px] font-medium">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-level-5" align="end">
        <header className="flex items-center justify-between p-4 border-b border-hairline">
          <span className="font-medium text-sm text-ink">Thông báo</span>
          <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-mute hover:text-ink">
            Đánh dấu tất cả đã đọc
          </Button>
        </header>
        <ul className="max-h-80 overflow-y-auto divide-y divide-hairline">
          {notifications.length === 0 ? (
            <li className="p-4 text-sm text-mute text-center">Không có thông báo</li>
          ) : (
            notifications.map((n) => (
              <li
                key={n.id}
                onClick={() => {
                  markRead(n.id)
                  if (n.ticketId) void navigate('/tickets/' + n.ticketId)
                }}
                className={cn(
                  'p-4 cursor-pointer hover:bg-canvas-soft-2 flex gap-3',
                  !n.read && 'bg-link-bg-soft'
                )}
              >
                <p className="text-sm text-ink flex-1">{n.message ?? `Ticket #${n.ticketId?.slice(0, 8)}`}</p>
                <time className="text-xs text-mute shrink-0">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </time>
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
