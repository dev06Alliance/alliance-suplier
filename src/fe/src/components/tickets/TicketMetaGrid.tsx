import { format } from 'date-fns'
import type { TicketDetail } from '@/types/ticket'

interface MetaEntry {
  label: string
  value: string
  mono?: boolean
}

export function TicketMetaGrid({ ticket }: { ticket: TicketDetail }) {
  const entries: MetaEntry[] = [
    { label: 'Sản phẩm',      value: ticket.product?.name ?? ticket.freeTextDesc ?? '—' },
    { label: 'Danh mục',      value: ticket.product?.categoryName ?? '—' },
    { label: 'Người yêu cầu', value: ticket.requester?.name ?? '—' },
    { label: 'Ngày tạo',      value: format(new Date(ticket.createdAt), 'dd/MM/yyyy HH:mm'), mono: true },
    { label: 'Xác nhận bởi',  value: ticket.confirmedBy?.name ?? '—' },
  ]

  return (
    <div className="bg-canvas rounded-md shadow-level-1 p-5">
      <dl className="grid grid-cols-2 gap-x-8 gap-y-5">
        {entries.map(({ label, value, mono }) => (
          <div key={label}>
            <dt className="text-[11px] font-mono text-mute uppercase tracking-wider mb-1">{label}</dt>
            <dd className={`text-sm text-ink font-medium ${mono ? 'font-mono' : ''}`}>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
