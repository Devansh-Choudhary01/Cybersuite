import axios from 'axios'
import { useAuthStore } from '../store/authStore'

// Allow overriding API base in production via Vite env var `VITE_API_URL`.
// Fallback to localhost for development.
const base = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: base,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// F1 — Attach JWT to every request
api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`)
  return config
})

// Global error handler — auto-logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/login')) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    const msg = err.response?.data?.detail || err.message || 'Unknown error'
    console.error(`[API Error]`, msg)
    return Promise.reject(err)
  }
)
