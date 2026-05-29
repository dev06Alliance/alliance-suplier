import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TypeBadge } from '@/components/shared/TypeBadge'
import { OverdueBadge } from '@/components/shared/OverdueBadge'
import type { TicketDetail } from '@/types/ticket'

export function TicketDetailHeader({ ticket }: { ticket: TicketDetail }) {
  const navigate = useNavigate()
  const overdue = ticket.isOverdue

  return (
    <div className="space-y-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="gap-1.5 text-body -ml-2"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Quay lại
      </Button>

      <div className="flex items-center gap-2 flex-wrap">
        <code className="font-mono text-xs text-mute bg-canvas-soft-2 px-2 py-1 rounded-sm">
          #{ticket.id.slice(0, 8)}
        </code>
        <TypeBadge type={ticket.type} />
        <StatusBadge status={ticket.status} />
        {overdue && <OverdueBadge />}
      </div>
    </div>
  )
}
