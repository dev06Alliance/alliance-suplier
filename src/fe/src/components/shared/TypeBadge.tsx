import { cn } from '@/lib/utils'
import type { TicketType } from '@/types/ticket'

const variants: Record<TicketType, string> = {
  Broken: 'bg-error-soft text-error',
  Empty:  'bg-canvas-soft-2 text-body',
}

const labels: Record<TicketType, string> = {
  Broken: 'Hỏng',
  Empty:  'Hết',
}

export function TypeBadge({ type }: { type: TicketType }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', variants[type])}>
      {labels[type]}
    </span>
  )
}
