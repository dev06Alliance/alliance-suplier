import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import type { Product } from '@/types/category'

export function useProducts(categoryId: string | undefined) {
  return useQuery({
    queryKey: ['products', categoryId],
    queryFn: async () => {
      const res = await api.get('/products?categoryId=' + categoryId) as unknown as { success: boolean; data: Product[] }
      return res.data
    },
    enabled: !!categoryId,
  })
}
