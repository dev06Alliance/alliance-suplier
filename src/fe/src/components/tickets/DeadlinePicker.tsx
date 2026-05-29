import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { format, setHours, setMinutes, startOfDay } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { TicketCreateValues } from '@/schemas/ticketCreate'

export function DeadlinePicker() {
  const { setValue, watch, register, formState: { errors } } = useFormContext<TicketCreateValues>()
  const deadline = watch('deadline')
  const hour = watch('hour')
  const minute = watch('minute')
  const [open, setOpen] = useState(false)

  const preview = deadline
    ? format(setMinutes(setHours(deadline, Number(hour) || 0), Number(minute) || 0), 'dd/MM/yyyy HH:mm')
    : null

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Ngày hạn xử lý</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn('w-full justify-start text-left', !deadline && 'text-mute')}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {preview ?? 'Chọn ngày hạn'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 shadow-level-5" align="start">
            <Calendar
              mode="single"
              selected={deadline}
              onSelect={(d) => {
                if (d) {
                  setValue('deadline', d)
                  setOpen(false)
                }
              }}
              disabled={(d) => d < startOfDay(new Date())}
            />
          </PopoverContent>
        </Popover>
        {errors.deadline && (
          <p className="text-xs text-error">{errors.deadline.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Giờ xử lý</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            max={23}
            placeholder="HH"
            className="w-20 text-center"
            {...register('hour')}
          />
          <span className="text-mute font-semibold">:</span>
          <Input
            type="number"
            min={0}
            max={59}
            placeholder="mm"
            className="w-20 text-center"
            {...register('minute')}
          />
        </div>
      </div>
    </div>
  )
}
