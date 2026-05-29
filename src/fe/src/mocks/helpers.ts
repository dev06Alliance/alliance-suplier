import { HttpResponse } from 'msw'
import { db } from './db'

export const BASE = import.meta.env.VITE_API_BASE ?? '/api/v1'

export function ok<T>(data: T, status = 200) {
  return HttpResponse.json({ success: true, data }, { status })
}

export function err(code: string, message: string, status: number) {
  return HttpResponse.json({ success: false, error: { code, message } }, { status })
}

export function getAuthUser(request: Request) {
  const auth = request.headers.get('Authorization') ?? ''
  const token = auth.replace('Bearer ', '')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token)) as { userId: string; role: string; exp: number }
    if (payload.exp < Date.now()) return null
    return db.users.find((u) => u.id === payload.userId) ?? null
  } catch {
    return null
  }
}

export function requireAuth(request: Request) {
  const user = getAuthUser(request)
  if (!user) return { user: null, response: err('UNAUTHORIZED', 'Unauthorized.', 401) }
  return { user, response: null }
}

export function makeToken(userId: string, role: string) {
  return btoa(JSON.stringify({ userId, role, exp: Date.now() + 15 * 60 * 1000 }))
}

export function isOverdue(ticket: Record<string, unknown>) {
  return new Date(ticket.deadline as string) < new Date() && ticket.status !== 'Done'
}

export function formatTicket(t: Record<string, unknown>) {
  const prod = db.products.find((p) => p.id === t.productId)
  const requester = db.users.find((u) => u.id === t.requesterId)
  const category = prod ? db.categories.find((c) => c.id === prod.categoryId) : null
  return {
    ...t,
    isOverdue: isOverdue(t),
    product: prod
      ? { id: prod.id, name: prod.name, categoryId: prod.categoryId, categoryName: (category as Record<string, unknown> | null)?.name ?? null }
      : null,
    requester: requester ? { id: requester.id, name: requester.name } : null,
  }
}

export function formatTicketDetail(t: Record<string, unknown>) {
  const confirmedBy = t.confirmedById
    ? db.users.find((u) => u.id === t.confirmedById)
    : null
  return {
    ...formatTicket(t),
    confirmedBy: confirmedBy ? { id: confirmedBy.id, name: confirmedBy.name } : null,
    deadlineHistory: (t.deadlineHistory as Record<string, unknown>[]).map((h) => {
      const changer = db.users.find((u) => u.id === h.changedById)
      return { ...h, changedBy: changer ? { id: changer.id, name: changer.name } : null }
    }),
  }
}
