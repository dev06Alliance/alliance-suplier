import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { setHours, setMinutes } from 'date-fns'
import { api } from '@/services/api'
import type { TicketCreateValues } from '@/schemas/ticketCreate'

export function useCreateTicket() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (values: TicketCreateValues) => {
      const fd = new FormData()
      fd.append('type', values.type)
      const dt = setMinutes(setHours(values.deadline, values.hour ?? 17), values.minute ?? 0)
      fd.append('deadline', dt.toISOString())
      if (values.productId)    fd.append('productId',    values.productId)
      if (values.freeTextDesc) fd.append('freeTextDesc', values.freeTextDesc)
      if (values.image)        fd.append('image',        values.image)
      return api.post('/tickets', fd)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tickets'] })
      toast.success('Ticket đã được tạo thành công')
      void navigate('/tickets')
    },
    onError: () => toast.error('Không thể tạo ticket. Vui lòng thử lại.'),
  })
}
