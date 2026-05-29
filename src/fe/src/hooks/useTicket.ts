import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import type { TicketDetail } from '@/types/ticket'

export function useTicket(id: string) {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      const res = await api.get('/tickets/' + id) as unknown as { success: boolean; data: TicketDetail }
      return res.data
    },
    enabled: !!id,
  })
}
