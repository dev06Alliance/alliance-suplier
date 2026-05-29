import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/authStore'
import { setToken } from '@/lib/auth'
import { api } from '@/services/api'

interface LoginResponse {
  success: boolean
  data: {
    accessToken: string
    user: { id: string; name: string; email: string; role: 'User' | 'Manager' | 'Admin' }
  }
}

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { username, password }) as unknown as LoginResponse
      setToken(res.data.accessToken)
      setAuth(res.data.user, res.data.user.role, res.data.accessToken)
      void navigate('/tickets')
    } catch {
      toast.error('Tên đăng nhập hoặc mật khẩu không đúng.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas-soft flex flex-col items-center justify-center p-4">
      {/* Brand mark */}
      <div className="mb-8 text-center">
        <span className="font-semibold text-ink tracking-tight text-xl">Alliance Supplier</span>
      </div>

      {/* Auth card — ex-auth-form-card spec: canvas bg, rounded-md, shadow-level-3, p-8 */}
      <div className="w-full max-w-[400px] bg-canvas rounded-md shadow-level-3 p-8">
        <div className="mb-6">
          <h1 className="display-sm text-ink">Đăng nhập</h1>
          <p className="text-sm text-body mt-1">Hệ thống báo hỏng / hết đồ dùng</p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">Tên đăng nhập</Label>
            <Input
              id="username"
              type="text"
              placeholder="Nhập tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-hairline">
          <p className="text-xs text-mute font-mono">Demo accounts (password: password123)</p>
          <div className="mt-2 space-y-1">
            {[
              { email: 'user1@company.com',    role: 'User' },
              { email: 'manager1@company.com', role: 'Manager' },
              { email: 'admin@company.com',    role: 'Admin' },
            ].map(({ email: e, role }) => (
              <button
                key={e}
                type="button"
                onClick={() => setUsername(e)}
                className="w-full text-left px-3 py-2 rounded-sm hover:bg-canvas-soft-2 transition-colors flex items-center justify-between group"
              >
                <span className="text-xs font-mono text-body group-hover:text-ink">{e}</span>
                <span className="text-xs text-mute bg-canvas-soft-2 px-1.5 py-0.5 rounded-sm">{role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
