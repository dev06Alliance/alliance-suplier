import { cn } from '@/lib/utils'
import type { TicketStatus } from '@/types/ticket'

const variants: Record<TicketStatus, string> = {
  Pending:   'bg-warning-soft text-warning-deep',
  Confirmed: 'bg-link-bg-soft text-link-deep',
  Done:      'bg-green-100 text-green-800',
}

const labels: Record<TicketStatus, string> = {
  Pending:   'Chờ xử lý',
  Confirmed: 'Đã xác nhận',
  Done:      'Hoàn thành',
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', variants[status])}>
      {labels[status]}
    </span>
  )
}
