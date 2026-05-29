import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TypeBadge } from '@/components/shared/TypeBadge'
import { OverdueBadge } from '@/components/shared/OverdueBadge'
import { cn } from '@/lib/utils'
import type { Ticket } from '@/types/ticket'

interface Props {
  tickets: Ticket[]
}

export function TicketTable({ tickets }: Props) {
  const navigate = useNavigate()

  const columns: ColumnDef<Ticket>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <code className="font-mono text-xs text-mute">#{row.original.id.slice(0, 8)}</code>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Loại',
      cell: ({ row }) => <TypeBadge type={row.original.type} />,
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'product',
      header: 'Sản phẩm / Mô tả',
      cell: ({ row }) => (
        <span className="text-ink text-sm">
          {row.original.product?.name ?? row.original.freeTextDesc ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'requester',
      header: 'Người yêu cầu',
      cell: ({ row }) => (
        <span className="text-body text-sm">{row.original.requester?.name ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'deadline',
      header: 'Hạn xử lý',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className={cn('text-sm', row.original.isOverdue ? 'text-error font-medium' : 'text-body')}>
            {format(new Date(row.original.deadline), 'dd/MM/yyyy')}
          </span>
          {row.original.isOverdue && <OverdueBadge />}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void navigate('/tickets/' + row.original.id)}
        >
          Xem
        </Button>
      ),
    },
  ]

  const table = useReactTable({
    data: tickets,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="bg-canvas rounded-md shadow-level-2 overflow-hidden">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead key={h.id}>
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className={cn(row.original.isOverdue && 'border-l-2 border-l-error bg-[#f7d4d6]/20')}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {tickets.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-mute py-8">
                Không có ticket nào
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
