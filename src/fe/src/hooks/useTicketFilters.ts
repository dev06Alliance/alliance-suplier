import { useSearchParams } from 'react-router-dom'

export interface TicketFilters {
  status: string
  type: string
  overdue: boolean
}

export function useTicketFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters: TicketFilters = {
    status:  searchParams.get('status')  ?? 'ALL',
    type:    searchParams.get('type')    ?? 'ALL',
    overdue: searchParams.get('overdue') === 'true',
  }

  const setFilter = (key: string, val: string | boolean) =>
    setSearchParams((p) => { p.set(key, String(val)); return p }, { replace: true })

  return { filters, setFilter }
}
