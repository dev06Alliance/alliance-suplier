import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { TicketCard } from '@/components/tickets/TicketCard'
import { TicketTable } from '@/components/tickets/TicketTable'
import { TicketFilterBar } from '@/components/tickets/TicketFilterBar'
import { useAuth } from '@/hooks/useAuth'
import { useTickets } from '@/hooks/useTickets'
import { useTicketFilters } from '@/hooks/useTicketFilters'

function TicketSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-canvas rounded-md shadow-level-2 p-4 animate-pulse">
          <div className="h-4 bg-canvas-soft-2 rounded mb-3 w-2/3" />
          <div className="h-3 bg-canvas-soft-2 rounded mb-2 w-full" />
          <div className="h-3 bg-canvas-soft-2 rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}

export function TicketListPage() {
  const { isManager } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const { filters } = useTicketFilters()
  const { data, isLoading } = useTickets(filters)

  // Manager default: show PENDING tickets on first load
  useEffect(() => {
    if (isManager && !searchParams.get('status')) {
      setSearchParams((p) => { p.set('status', 'Pending'); return p }, { replace: true })
    }
  }, [isManager, searchParams, setSearchParams])

  const tickets = Array.isArray(data) ? data : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="display-md text-ink">
          {isManager ? 'Tất cả yêu cầu' : 'Yêu cầu của tôi'}
        </h1>
        {!isManager && (
          <Button asChild>
            <Link to="/tickets/new">+ Tạo yêu cầu</Link>
          </Button>
        )}
      </div>

      <TicketFilterBar />

      {isLoading && <TicketSkeleton />}

      {!isLoading && tickets.length === 0 && (
        <EmptyState
          title="Không có yêu cầu nào"
          description="Thử thay đổi bộ lọc."
          action={
            !isManager ? (
              <Button asChild variant="outline">
                <Link to="/tickets/new">Tạo yêu cầu đầu tiên</Link>
              </Button>
            ) : undefined
          }
        />
      )}

      {!isLoading && tickets.length > 0 && (
        isManager
          ? <TicketTable tickets={tickets} />
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tickets.map((t) => <TicketCard key={t.id} ticket={t} />)}
            </div>
          )
      )}
    </div>
  )
}
