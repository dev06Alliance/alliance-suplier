import { useCallback } from 'react'
import { api } from '@/services/api'
import { useNotifStore } from '@/stores/notifStore'

export function useNotifications() {
  const { markRead: storeMarkRead, markAllRead: storeMarkAllRead } = useNotifStore()

  const markRead = useCallback(async (id: string) => {
    storeMarkRead(id)
    try {
      await api.patch(`/notifications/${id}/read`)
    } catch {
      // optimistic update already applied; silent fail acceptable
    }
  }, [storeMarkRead])

  const markAllRead = useCallback(async () => {
    storeMarkAllRead()
    try {
      await api.patch('/notifications/read-all')
    } catch {
      // optimistic update already applied; silent fail acceptable
    }
  }, [storeMarkAllRead])

  return { markRead, markAllRead }
}
