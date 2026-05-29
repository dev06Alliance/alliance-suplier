import { http, passthrough } from 'msw'
import { BASE, ok, err, requireAuth } from '../helpers'
import { db } from '../db'

export const notificationHandlers = [
  http.get(`${BASE}/notifications/stream`, () => passthrough()),

  http.get(`${BASE}/notifications`, ({ request }) => {
    const { user, response } = requireAuth(request)
    if (response) return response

    const unreadOnly = new URL(request.url).searchParams.get('unread') === 'true'
    const u = user as Record<string, unknown>

    let list = (db.notifications as Record<string, unknown>[])
      .filter((n) => n.userId === u.id)
      .sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime())

    if (unreadOnly) list = list.filter((n) => !n.isRead)

    return ok(list)
  }),

  http.patch(`${BASE}/notifications/:id/read`, ({ request, params }) => {
    const { user, response } = requireAuth(request)
    if (response) return response

    const notif = (db.notifications as Record<string, unknown>[]).find(
      (n) => n.id === params.id && n.userId === (user as Record<string, unknown>).id
    )
    if (!notif) return err('NOT_FOUND', 'Notification not found.', 404)

    notif.isRead = true
    return ok(notif)
  }),

  http.patch(`${BASE}/notifications/read-all`, ({ request }) => {
    const { user, response } = requireAuth(request)
    if (response) return response

    const userId = (user as Record<string, unknown>).id
    ;(db.notifications as Record<string, unknown>[])
      .filter((n) => n.userId === userId)
      .forEach((n) => { n.isRead = true })

    return ok(null)
  }),
]
