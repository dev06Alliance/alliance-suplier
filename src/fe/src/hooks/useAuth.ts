import { useAuthStore } from '@/stores/authStore'

export function useAuth() {
  const { user, role } = useAuthStore()
  return {
    user,
    role,
    isManager: role === 'Manager',
    isAdmin: role === 'Admin',
  }
}
