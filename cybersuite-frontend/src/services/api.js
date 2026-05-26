import axios from 'axios'

// Allow overriding API base in production via Vite env var `VITE_API_BASE`.
// When empty, uses relative paths so a same-origin backend (or Vercel serverless
// functions mounted at `/api`) will work out of the box.
const base = import.meta.env.VITE_API_BASE ?? ''

export const api = axios.create({
  baseURL: base,        // default: '' (relative)
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Request logger
api.interceptors.request.use(config => {
  console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`)
  return config
})

// Global error handler
api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.detail || err.message || 'Unknown error'
    console.error(`[API Error]`, msg)
    return Promise.reject(err)
  }
)
