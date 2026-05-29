import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow, format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TypeBadge } from '@/components/shared/TypeBadge'
import { OverdueBadge } from '@/components/shared/OverdueBadge'
import type { Ticket } from '@/types/ticket'

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const navigate = useNavigate()
  const overdue = ticket.isOverdue

  const productName = ticket.product?.name ?? ticket.freeTextDesc ?? '—'
  const categoryName = ticket.product?.category?.name

  return (
    <div
      onClick={() => void navigate('/tickets/' + ticket.id)}
      className={cn(
        'bg-canvas rounded-md p-5 cursor-pointer transition-shadow hover:shadow-level-4',
        overdue
          ? 'border-2 border-error shadow-level-2'
          : 'shadow-level-3'
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <code className="font-mono text-[11px] text-mute leading-none pt-0.5">
          #{ticket.id.slice(0, 8)}
        </code>
        <div className="flex gap-1 flex-wrap justify-end">
          <TypeBadge type={ticket.type} />
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      {/* Product name */}
      <p className="font-medium text-ink text-sm mb-0.5 line-clamp-2 leading-snug">
        {productName}
      </p>

      {/* Category */}
      {categoryName && (
        <p className="text-xs text-mute mb-3">{categoryName}</p>
      )}

      {/* Requester */}
      <p className="text-xs text-body mb-4">{ticket.requester?.name ?? '—'}</p>

      {/* Deadline footer */}
      <div className={cn(
        'flex items-center justify-between pt-3 border-t',
        overdue ? 'border-error/20' : 'border-hairline'
      )}>
        {overdue && <OverdueBadge />}
        <p className={cn('text-xs ml-auto', overdue ? 'text-error font-medium' : 'text-mute')}>
          {format(new Date(ticket.deadline), 'dd/MM/yyyy')}
          <span className="ml-1 text-[11px]">
            ({formatDistanceToNow(new Date(ticket.deadline), { addSuffix: true, locale: vi })})
          </span>
        </p>
      </div>
    </div>
  )
}
