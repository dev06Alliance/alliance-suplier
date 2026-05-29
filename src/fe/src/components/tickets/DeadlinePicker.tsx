import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { TicketCreateValues } from '@/schemas/ticketCreate'

export function DeadlinePicker() {
  const { setValue, watch, formState: { errors } } = useFormContext<TicketCreateValues>()
  const deadline = watch('deadline')
  const [open, setOpen] = useState(false)

  return (
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
            {deadline ? format(deadline, 'dd/MM/yyyy') : 'Chọn ngày hạn'}
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
            disabled={(d) => d <= new Date()}
          />
        </PopoverContent>
      </Popover>
      {errors.deadline && (
        <p className="text-xs text-error">{errors.deadline.message}</p>
      )}
    </div>
  )
}
