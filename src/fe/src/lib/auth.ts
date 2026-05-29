const TOKEN_KEY = 'alliance_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function decodeToken(token: string): { userId: string; role: string; exp: number } | null {
  try {
    return JSON.parse(atob(token)) as { userId: string; role: string; exp: number }
  } catch {
    return null
  }
}

export function isTokenValid(token: string | null): boolean {
  if (!token) return false
  const decoded = decodeToken(token)
  if (!decoded) return false
  return decoded.exp > Date.now()
}
