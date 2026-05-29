import { create } from 'zustand'

export interface Notification {
  id: string
  message: string
  ticketId: string
  read: boolean
  createdAt: string
  type?: string
  payload?: Record<string, unknown>
}

interface NotifState {
  unreadCount: number
  notifications: Notification[]
  setNotifications: (list: Notification[]) => void
  addNotification: (notif: Notification) => void
  markRead: (id: string) => void
  markAllRead: () => void
}

export const useNotifStore = create<NotifState>((set) => ({
  unreadCount: 0,
  notifications: [],
  setNotifications: (list) =>
    set(() => ({
      notifications: list,
      unreadCount: list.filter((n) => !n.read).length,
    })),
  addNotification: (notif) =>
    set((s) => {
      if (s.notifications.some((n) => n.id === notif.id)) return s
      return {
        notifications: [notif, ...s.notifications],
        unreadCount: s.unreadCount + (notif.read ? 0 : 1),
      }
    }),
  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
}))
