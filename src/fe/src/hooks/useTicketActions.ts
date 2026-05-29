import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/services/api'

export function useTicketActions(id: string) {
  const qc = useQueryClient()

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['ticket', id] })
    void qc.invalidateQueries({ queryKey: ['tickets'] })
  }

  const confirm = useMutation({
    mutationFn: () => api.patch('/tickets/' + id + '/confirm'),
    onSuccess: () => { invalidate(); toast.success('Ticket đã được xác nhận') },
    onError:   () => toast.error('Không thể xác nhận ticket'),
  })

  const markDone = useMutation({
    mutationFn: () => api.patch('/tickets/' + id + '/done'),
    onSuccess: () => { invalidate(); toast.success('Ticket đã hoàn thành') },
    onError:   () => toast.error('Không thể đánh dấu hoàn thành'),
  })

  const extendDeadline = useMutation({
    mutationFn: (payload: { newDeadline: string; reason: string }) =>
      api.patch('/tickets/' + id + '/deadline', payload),
    onSuccess: () => { invalidate(); toast.success('Đã gia hạn deadline') },
    onError:   () => toast.error('Không thể gia hạn deadline'),
  })

  return { confirm, markDone, extendDeadline }
}
