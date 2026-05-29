import { useParams } from 'react-router-dom'
import { EmptyState } from '@/components/shared/EmptyState'
import { TicketDetailHeader } from '@/components/tickets/TicketDetailHeader'
import { TicketMetaGrid } from '@/components/tickets/TicketMetaGrid'
import { TicketImagePreview } from '@/components/tickets/TicketImagePreview'
import { TicketDeadlineSection } from '@/components/tickets/TicketDeadlineSection'
import { DeadlineHistory } from '@/components/tickets/DeadlineHistory'
import { TicketActions } from '@/components/tickets/TicketActions'
import { useTicket } from '@/hooks/useTicket'
import { useAuth } from '@/hooks/useAuth'

function TicketDetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 bg-canvas-soft-2 rounded-sm w-24" />
      <div className="h-6 bg-canvas-soft-2 rounded-sm w-1/2" />
      <div className="bg-canvas rounded-md shadow-level-1 p-5 h-32" />
      <div className="bg-canvas rounded-md shadow-level-1 p-5 h-20" />
    </div>
  )
}

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { isManager } = useAuth()
  const { data: ticket, isLoading } = useTicket(id!)

  if (isLoading) return <TicketDetailSkeleton />
  if (!ticket) return (
    <EmptyState
      title="Không tìm thấy yêu cầu"
      description="Yêu cầu này có thể đã bị xóa hoặc bạn không có quyền truy cập."
    />
  )

  const hasActions = isManager && (ticket.status === 'Pending' || ticket.status === 'Confirmed')

  return (
    <div className="space-y-4 pb-24">
      <TicketDetailHeader ticket={ticket} />
      <TicketMetaGrid ticket={ticket} />
      {ticket.imageUrl && <TicketImagePreview imageUrl={ticket.imageUrl} />}
      <TicketDeadlineSection ticket={ticket} />
      {isManager && ticket.deadlineHistory.length > 0 && (
        <DeadlineHistory ticket={ticket} />
      )}

      {/* Sticky action bar — only renders when manager has actions */}
      {hasActions && (
        <div className="fixed bottom-0 left-60 right-0 bg-canvas border-t border-hairline px-6 py-4 shadow-level-1">
          <TicketActions ticket={ticket} />
        </div>
      )}
    </div>
  )
}
