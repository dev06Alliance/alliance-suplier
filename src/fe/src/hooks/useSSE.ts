import { useEffect } from 'react'
import { useNotifStore, type Notification } from '@/stores/notifStore'
import { api } from '@/services/api'

export function useSSE() {
  const addNotification = useNotifStore((s) => s.addNotification)

  useEffect(() => {
    if (import.meta.env.DEV && import.meta.env.VITE_MOCK_SSE_POLLING === 'true') {
      const poll = setInterval(async () => {
        try {
          const data = await api.get('/notifications?unread=true') as unknown as Notification[]
          if (Array.isArray(data)) {
            data.forEach((n: Notification) => addNotification(n))
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
      es = new EventSource('/api/v1/notifications/stream', { withCredentials: true })
      es.onmessage = (e: MessageEvent) => addNotification(JSON.parse(e.data as string) as Notification)
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
  }, [addNotification])
}
