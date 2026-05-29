import { format, differenceInDays } from 'date-fns'
import { vi } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { TicketDetail } from '@/types/ticket'

export function TicketDeadlineSection({ ticket }: { ticket: TicketDetail }) {
  const deadline = new Date(ticket.deadline)
  const now = new Date()
  const days = differenceInDays(deadline, now)
  const overdue = deadline < now && ticket.status !== 'Done'
  const done = ticket.status === 'Done'

  return (
    <div className={cn(
      'rounded-md p-5',
      overdue
        ? 'bg-error-soft border border-error/20'
        : 'bg-canvas shadow-level-1'
    )}>
      <p className="text-[11px] font-mono text-mute uppercase tracking-wider mb-2">Hạn xử lý</p>
      <p className={cn('display-sm', overdue ? 'text-error' : 'text-ink')}>
        {format(deadline, 'dd MMMM yyyy HH:mm', { locale: vi })}
      </p>
      <p className={cn('text-sm mt-1', overdue ? 'text-error font-medium' : done ? 'text-mute' : 'text-body')}>
        {done
          ? 'Đã hoàn thành'
          : overdue
          ? `Quá hạn ${Math.abs(days)} ngày`
          : days === 0
          ? 'Hôm nay là hạn chót'
          : `Còn ${days} ngày`}
      </p>
    </div>
  )
}
