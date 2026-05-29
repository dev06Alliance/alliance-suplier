import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, startOfDay, endOfDay, subDays } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { api } from '@/services/api'
import { cn } from '@/lib/utils'

interface ReportData {
  total: number
  confirmed: number
  done: number
}

interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

const PRESETS = [
  { label: 'Hôm nay',    range: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { label: '7 ngày qua', range: () => ({ from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) }) },
  { label: '30 ngày qua', range: () => ({ from: startOfDay(subDays(new Date(), 29)), to: endOfDay(new Date()) }) },
  { label: 'Tất cả',     range: () => ({ from: undefined, to: undefined }) },
]

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-canvas rounded-md shadow-level-2 p-6 flex flex-col gap-2">
      <p className="text-xs text-mute uppercase tracking-wide">{label}</p>
      <p className={cn('text-4xl font-semibold', color)}>{value}</p>
    </div>
  )
}

export function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined })
  const [calOpen, setCalOpen] = useState(false)

  const queryParams = new URLSearchParams()
  if (dateRange.from) queryParams.set('from', format(dateRange.from, 'yyyy-MM-dd'))
  if (dateRange.to)   queryParams.set('to',   format(dateRange.to,   'yyyy-MM-dd'))

  const { data, isLoading } = useQuery({
    queryKey: ['reports', dateRange],
    queryFn: async () => {
      const res = await api.get('/reports?' + queryParams.toString()) as unknown as { success: boolean; data: ReportData }
      return res.data
    },
  })

  const rangeLabel = dateRange.from && dateRange.to
    ? `${format(dateRange.from, 'dd/MM/yyyy')} – ${format(dateRange.to, 'dd/MM/yyyy')}`
    : dateRange.from
    ? `Từ ${format(dateRange.from, 'dd/MM/yyyy')}`
    : 'Tất cả thời gian'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-md text-ink">Báo cáo</h1>
        <p className="text-sm text-body mt-1">Thống kê yêu cầu theo thời gian</p>
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-3 flex-wrap">
        {PRESETS.map((p) => (
          <Button
            key={p.label}
            variant="outline"
            size="sm"
            onClick={() => setDateRange(p.range())}
          >
            {p.label}
          </Button>
        ))}
        <Popover open={calOpen} onOpenChange={setCalOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              Tùy chọn
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 shadow-level-5" align="start">
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => {
                setDateRange({ from: range?.from, to: range?.to })
                if (range?.from && range.to) setCalOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
        <span className="text-sm text-mute">{rangeLabel}</span>
      </div>

      {/* Stat cards */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-canvas rounded-md shadow-level-2 p-6 animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Tổng yêu cầu"    value={data?.total     ?? 0} color="text-ink" />
          <StatCard label="Đã xác nhận"     value={data?.confirmed ?? 0} color="text-link" />
          <StatCard label="Đã hoàn thành"   value={data?.done      ?? 0} color="text-green-600" />
        </div>
      )}
    </div>
  )
}
