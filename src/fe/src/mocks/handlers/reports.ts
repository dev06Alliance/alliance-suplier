import { http } from 'msw'
import { BASE, ok, err, requireAuth } from '../helpers'
import { db } from '../db'

export const reportHandlers = [
  http.get(`${BASE}/reports`, ({ request }) => {
    const { user, response } = requireAuth(request)
    if (response) return response

    if ((user as Record<string, unknown>).role !== 'Admin') return err('FORBIDDEN', 'Admin only.', 403)

    const url = new URL(request.url)
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')

    let tickets = db.tickets as Record<string, unknown>[]

    if (from) {
      const fromDate = new Date(from)
      tickets = tickets.filter((t) => new Date(t.createdAt as string) >= fromDate)
    }
    if (to) {
      const toDate = new Date(to)
      toDate.setHours(23, 59, 59, 999)
      tickets = tickets.filter((t) => new Date(t.createdAt as string) <= toDate)
    }

    return ok({
      total:     tickets.length,
      confirmed: tickets.filter((t) => t.status === 'Confirmed' || t.status === 'Done').length,
      done:      tickets.filter((t) => t.status === 'Done').length,
    })
  }),
]
