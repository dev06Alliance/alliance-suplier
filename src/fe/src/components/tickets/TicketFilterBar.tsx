import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useTicketFilters } from '@/hooks/useTicketFilters'

export function TicketFilterBar() {
  const { filters, setFilter } = useTicketFilters()

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Select value={filters.status} onValueChange={(v) => setFilter('status', v)}>
        <SelectTrigger className="w-36 h-8 text-sm">
          <SelectValue placeholder="Trạng thái" />
        </SelectTrigger>
        <SelectContent>
          {[
            { value: 'ALL',       label: 'Tất cả' },
            { value: 'Pending',   label: 'Chờ xử lý' },
            { value: 'Confirmed', label: 'Đã xác nhận' },
            { value: 'Done',      label: 'Hoàn thành' },
          ].map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.type} onValueChange={(v) => setFilter('type', v)}>
        <SelectTrigger className="w-32 h-8 text-sm">
          <SelectValue placeholder="Loại" />
        </SelectTrigger>
        <SelectContent>
          {[
            { value: 'ALL',    label: 'Tất cả' },
            { value: 'Broken', label: 'Hỏng' },
            { value: 'Empty',  label: 'Hết' },
          ].map((t) => (
            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <label className="flex items-center gap-2 text-sm text-body cursor-pointer">
        <Switch
          checked={filters.overdue}
          onCheckedChange={(v) => setFilter('overdue', v)}
        />
        Chỉ quá hạn
      </label>
    </div>
  )
}
