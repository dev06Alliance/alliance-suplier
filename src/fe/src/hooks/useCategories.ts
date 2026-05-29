import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import type { Category } from '@/types/category'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories') as unknown as { success: boolean; data: Category[] }
      return res.data
    },
    staleTime: 10 * 60 * 1000,
  })
}
