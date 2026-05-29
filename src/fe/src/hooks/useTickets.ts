import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import type { Ticket } from '@/types/ticket'
import type { TicketFilters } from './useTicketFilters'

export function useTickets(filters: TicketFilters) {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.status !== 'ALL') params.set('status', filters.status)
      if (filters.type   !== 'ALL') params.set('type', filters.type)
      if (filters.overdue)          params.set('overdue', 'true')
      const res = await api.get('/tickets?' + params.toString()) as unknown as { success: boolean; data: Ticket[] }
      return res.data ?? []
    },
  })
}
