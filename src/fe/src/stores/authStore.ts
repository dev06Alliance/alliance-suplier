import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useEffect, useState } from 'react'

type Role = 'User' | 'Manager' | 'Admin'

interface User {
  id: string
  name: string
  email: string
}

interface AuthState {
  user: User | null
  role: Role | null
  token: string | null
  setAuth: (user: User, role: Role, token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      token: null,
      setAuth: (user, role, token) => set({ user, role, token }),
      clearAuth: () => set({ user: null, role: null, token: null }),
    }),
    { name: 'alliance_auth' }
  )
)

export function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated())
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true))
  }, [])
  return hydrated
}
