import { db } from './db'

type NotifType = 'TicketCreated' | 'TicketConfirmed' | 'TicketDone'

export function pushNotif(userId: string, type: NotifType, payload: Record<string, unknown>) {
  db.notifications.push({
    id: crypto.randomUUID(),
    userId,
    type,
    isRead: false,
    createdAt: new Date().toISOString(),
    payload,
  })
}
