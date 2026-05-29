import { http } from 'msw'
import { BASE, ok, err, makeToken } from '../helpers'
import { db } from '../db'

export const authHandlers = [
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const { username, password } = await request.json() as { username: string; password: string }
    const user = db.users.find((u) => u.email === username && u.password === password)
    if (!user) return err('INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng.', 401)
    const accessToken = makeToken(user.id as string, user.role as string)
    return ok({ accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  }),

  http.post(`${BASE}/auth/refresh`, () => {
    return ok({ accessToken: makeToken('a0000000-0000-0000-0000-000000000004', 'User') })
  }),

  http.post(`${BASE}/auth/logout`, () => ok(null)),

  http.get(`${BASE}/auth/me`, ({ request }) => {
    const auth = request.headers.get('Authorization') ?? ''
    const token = auth.replace('Bearer ', '')
    if (!token) return err('UNAUTHORIZED', 'Unauthorized.', 401)
    try {
      const { userId } = JSON.parse(atob(token)) as { userId: string }
      const user = db.users.find((u) => u.id === userId)
      if (!user) return err('UNAUTHORIZED', 'Unauthorized.', 401)
      return ok({ id: user.id, name: user.name, email: user.email, role: user.role })
    } catch {
      return err('UNAUTHORIZED', 'Unauthorized.', 401)
    }
  }),
]
