/**
 * F1 — Login Page
 * Demo credentials: admin@cybersuite.io / demo1234
 */
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiShield, FiLock, FiMail, FiEye, FiEyeOff } from 'react-icons/fi'
import { api } from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore(s => s.login)

  const [email, setEmail] = useState('admin@cybersuite.io')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', { email, password })
      login(data.access_token, email)
      navigate(from, { replace: true })
    } catch (err) {
      if (!err.response || err.response.status === 500) {
        setError('Cannot connect to the backend server. Please make sure the backend API is running on port 8000.')
      } else {
        setError(err.response.data?.detail || 'Login failed. Please check your credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(0,102,255,0.12) 0%, transparent 60%), #0A0E1A',
      }}
    >
      <motion.div
        className="glass w-full max-w-md p-8"
        style={{ border: '1px solid rgba(0,212,255,0.15)' }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="p-4 rounded-2xl mb-4"
            style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}
          >
            <FiShield size={32} style={{ color: '#00D4FF' }} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">CyberSuite</h1>
          <p className="text-xs mt-1" style={{ color: '#64748B' }}>Security Research Platform</p>
        </div>

        {/* Hint */}
        <div
          className="mb-6 p-3 rounded-lg text-center"
          style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)' }}
        >
          <p className="text-xs" style={{ color: '#64748B' }}>
            Demo: <span className="font-mono text-white">admin@cybersuite.io</span> /{' '}
            <span className="font-mono text-white">demo1234</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#94A3B8' }}>Email</label>
            <div className="relative">
              <FiMail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748B' }} />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="cyber-input pl-9"
                placeholder="admin@cybersuite.io"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#94A3B8' }}>Password</label>
            <div className="relative">
              <FiLock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748B' }} />
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="cyber-input pl-9 pr-10"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#64748B' }}
                tabIndex={-1}
              >
                {showPass ? <FiEyeOff size={14} /> : <FiEye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(255,45,85,0.1)', border: '1px solid rgba(255,45,85,0.2)', color: '#FF2D55' }}>
              {error}
            </p>
          )}

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="btn-cyber w-full justify-center py-3 mt-2"
            style={{ borderColor: 'rgba(0,212,255,0.5)', color: '#00D4FF' }}
          >
            {loading ? <span className="animate-spin mr-2"><FiLock size={16} /></span> : <FiLock size={16} className="mr-2" />}
            {loading ? 'Authenticating…' : 'Sign In'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
