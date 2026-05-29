import { format } from 'date-fns'
import type { TicketDetail } from '@/types/ticket'

export function DeadlineHistory({ ticket }: { ticket: TicketDetail }) {
  if (ticket.deadlineHistory.length === 0) return null

  return (
    <div className="bg-canvas rounded-md shadow-level-1 p-5">
      <h3 className="display-sm text-ink mb-4">Lịch sử gia hạn</h3>
      <ul className="space-y-3">
        {[...ticket.deadlineHistory].reverse().map((h) => (
          <li key={h.id} className="flex gap-3 items-start">
            <time className="text-xs text-mute w-28 shrink-0 pt-0.5">
              {format(new Date(h.changedAt), 'dd/MM/yy HH:mm')}
            </time>
            <div>
              <p className="text-sm">
                <span className="line-through text-mute">
                  {format(new Date(h.oldDeadline), 'dd/MM/yyyy')}
                </span>
                <span className="mx-2 text-mute">→</span>
                <span className="font-medium text-ink">
                  {format(new Date(h.newDeadline), 'dd/MM/yyyy')}
                </span>
              </p>
              <p className="text-xs text-body mt-0.5">
                {h.reason} — <span className="text-mute">{h.changedBy?.name ?? '—'}</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
