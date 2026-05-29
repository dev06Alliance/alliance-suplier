import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmActionModal } from '@/components/modals/ConfirmActionModal'
import { ExtendDeadlineModal } from '@/components/modals/ExtendDeadlineModal'
import { useAuth } from '@/hooks/useAuth'
import { useTicketActions } from '@/hooks/useTicketActions'
import type { TicketDetail } from '@/types/ticket'

interface Props {
  ticket: TicketDetail
}

export function TicketActions({ ticket }: Props) {
  const { isManager, user } = useAuth()
  const [showConfirm, setShowConfirm] = useState<'confirm' | 'done' | null>(null)
  const [showExtend, setShowExtend] = useState(false)
  const { confirm, markDone, extendDeadline } = useTicketActions(ticket.id)

  if (!isManager) return null

  const canMarkDone = ticket.status === 'Confirmed' && ticket.confirmedBy?.id === user?.id

  return (
    <div className="flex gap-2 flex-wrap">
      {ticket.status === 'Pending' && (
        <Button
          className="bg-ink text-on-primary"
          onClick={() => setShowConfirm('confirm')}
        >
          Xác nhận ticket
        </Button>
      )}
      {canMarkDone && (
        <Button variant="outline" onClick={() => setShowConfirm('done')}>
          Đánh dấu hoàn thành
        </Button>
      )}
      {ticket.status === 'Confirmed' && (
        <Button variant="ghost" onClick={() => setShowExtend(true)}>
          Gia hạn deadline
        </Button>
      )}

      <ConfirmActionModal
        open={showConfirm !== null}
        onOpenChange={(o) => !o && setShowConfirm(null)}
        action={showConfirm}
        onConfirm={() => {
          if (showConfirm === 'confirm') confirm.mutate()
          else markDone.mutate()
          setShowConfirm(null)
        }}
        isPending={confirm.isPending || markDone.isPending}
      />

      <ExtendDeadlineModal
        open={showExtend}
        onOpenChange={setShowExtend}
        onSubmit={(payload) => extendDeadline.mutate(payload)}
        isPending={extendDeadline.isPending}
      />
    </div>
  )
}
