import { useFormContext } from 'react-hook-form'
import { AlertTriangle, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TicketCreateValues } from '@/schemas/ticketCreate'

const ticketTypes = [
  { value: 'Broken', label: 'Hỏng', description: 'Thiết bị / đồ dùng bị hỏng', icon: AlertTriangle, color: 'text-error' },
  { value: 'Empty',  label: 'Hết',  description: 'Vật phẩm / đồ dùng đã hết',  icon: Package,       color: 'text-body' },
] as const

export function TicketTypeSection() {
  const { watch, setValue, formState: { errors } } = useFormContext<TicketCreateValues>()
  const currentType = watch('type')

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {ticketTypes.map(({ value, label, description, icon: Icon, color }) => (
          <label
            key={value}
            className={cn(
              'flex flex-col items-center gap-2 border rounded-md p-4 cursor-pointer transition-colors',
              currentType === value
                ? 'border-ink bg-canvas-soft shadow-level-2'
                : 'border-hairline bg-canvas hover:border-hairline-strong hover:bg-canvas-soft'
            )}
          >
            <input
              type="radio"
              className="sr-only"
              value={value}
              checked={currentType === value}
              onChange={() => setValue('type', value)}
            />
            <Icon className={cn('h-6 w-6', color)} />
            <span className={cn('font-medium text-sm', currentType === value ? 'text-ink' : 'text-body')}>
              {label}
            </span>
            <span className="text-xs text-mute text-center">{description}</span>
          </label>
        ))}
      </div>
      {errors.type && (
        <p className="text-xs text-error mt-1">{errors.type.message}</p>
      )}
    </div>
  )
}
