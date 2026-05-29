import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, setHours, setMinutes, startOfDay } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const schema = z.object({
  deadline: z.date()
    .refine((d) => !!d, 'Vui lòng chọn ngày')
    .refine((d) => d > new Date(), 'Ngày/giờ phải ở tương lai'),
  hour: z.coerce.number().int().min(0).max(23),
  minute: z.coerce.number().int().min(0).max(59),
  reason: z.string().min(10, 'Tối thiểu 10 ký tự'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: { newDeadline: string; reason: string }) => void
  isPending: boolean
}

export function ExtendDeadlineModal({ open, onOpenChange, onSubmit, isPending }: Props) {
  const [calOpen, setCalOpen] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { hour: 17, minute: 0 },
  })

  const deadline = form.watch('deadline')

  const handleSubmit = form.handleSubmit((values) => {
    const dt = setMinutes(setHours(values.deadline, values.hour), values.minute)
    onSubmit({
      newDeadline: dt.toISOString(),
      reason: values.reason,
    })
    onOpenChange(false)
    form.reset({ hour: 17, minute: 0 })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gia hạn deadline</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Ngày mới</Label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn('w-full justify-start text-left', !deadline && 'text-mute')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? format(deadline, 'dd/MM/yyyy') : 'Chọn ngày hạn mới'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 shadow-level-5" align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={(d) => {
                    if (d) {
                      form.setValue('deadline', d)
                      setCalOpen(false)
                    }
                  }}
                  disabled={(d) => d < startOfDay(new Date())}
                />
              </PopoverContent>
            </Popover>
            {form.formState.errors.deadline && (
              <p className="text-xs text-error">{form.formState.errors.deadline.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Giờ</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={23}
                placeholder="HH"
                className="w-20 text-center"
                {...form.register('hour')}
              />
              <span className="text-mute font-semibold">:</span>
              <Input
                type="number"
                min={0}
                max={59}
                placeholder="mm"
                className="w-20 text-center"
                {...form.register('minute')}
              />
              <span className="text-sm text-mute">
                {deadline && `— ${format(setMinutes(setHours(deadline, Number(form.watch('hour') || 0)), Number(form.watch('minute') || 0)), 'dd/MM/yyyy HH:mm')}`}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Lý do gia hạn</Label>
            <Textarea
              placeholder="Nhập lý do gia hạn (tối thiểu 10 ký tự)..."
              rows={3}
              {...form.register('reason')}
            />
            {form.formState.errors.reason && (
              <p className="text-xs text-error">{form.formState.errors.reason.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Đang lưu...' : 'Gia hạn'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
