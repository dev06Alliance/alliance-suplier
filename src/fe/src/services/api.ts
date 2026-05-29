import axios from 'axios'
import { getToken, removeToken } from '@/lib/auth'

export const API_BASE = import.meta.env.VITE_API_BASE ?? '/api/v1'

const api = axios.create({ baseURL: API_BASE })

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      removeToken()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export { api }
