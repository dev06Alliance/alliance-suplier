import { useEffect } from 'react'
import { useNotifStore, type Notification } from '@/stores/notifStore'
import { api, API_BASE } from '@/services/api'
import { getToken } from '@/lib/auth'

const TYPE_LABELS: Record<string, string> = {
  TicketCreated: 'Ticket mới đã được tạo',
  TicketConfirmed: 'Ticket đã được xác nhận',
  TicketDone: 'Ticket đã hoàn thành',
}

/** Normalize raw backend/SSE notification to the Notification shape the store expects */
function normalize(raw: Record<string, unknown>): Notification {
  const payload = raw.payload as Record<string, unknown> | undefined
  const ticketId = (raw.ticketId ?? payload?.ticketId ?? payload?.id) as string | undefined
  const type = raw.type as string | undefined
  const label = type ? (TYPE_LABELS[type] ?? 'Thông báo mới') : 'Thông báo mới'
  const message = (raw.message as string | undefined) ?? (ticketId ? `${label} #${ticketId.slice(0, 8)}` : label)
  const read = typeof raw.read === 'boolean' ? raw.read : !!(raw.isRead as boolean | undefined)
  return {
    id: raw.id as string,
    message,
    ticketId: ticketId ?? '',
    read,
    createdAt: raw.createdAt as string,
    type,
    payload: payload,
  }
}

export function useSSE() {
  useEffect(() => {
    const { setNotifications, addNotification } = useNotifStore.getState()

    // Load existing notifications on mount
    void api.get('/notifications').then((res) => {
      const data = (res as { data?: unknown }).data ?? res
      if (Array.isArray(data)) {
        setNotifications((data as Record<string, unknown>[]).map(normalize))
      }
    }).catch(() => { /* silent — SSE will still deliver new ones */ })

    if (import.meta.env.DEV && import.meta.env.VITE_MOCK_SSE_POLLING === 'true') {
      // In polling mode the initial load above covers unread; poll only for new ones
      const poll = setInterval(async () => {
        try {
          const res = await api.get('/notifications?unread=true') as unknown as { data?: unknown }
          const data = res.data ?? res
          if (Array.isArray(data)) {
            (data as Record<string, unknown>[]).map(normalize).forEach(addNotification)
          }
        } catch {
          // ignore polling errors
        }
      }, 5000)
      return () => clearInterval(poll)
    }

    let es: EventSource
    let retryTimer: ReturnType<typeof setTimeout>
    const connect = () => {
      const token = getToken()
      if (!token) return
      es = new EventSource(`${API_BASE}/notifications/stream?token=${encodeURIComponent(token)}`)
      es.onmessage = (e: MessageEvent) => {
        const raw = JSON.parse(e.data as string) as Record<string, unknown>
        addNotification(normalize(raw))
      }
      es.onerror = () => {
        es.close()
        retryTimer = setTimeout(connect, 5000)
      }
    }
    connect()
    return () => {
      es?.close()
      clearTimeout(retryTimer)
    }
  }, [])
}
