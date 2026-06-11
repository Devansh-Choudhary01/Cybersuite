import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FiShield, FiAlertTriangle, FiCheckCircle, FiXCircle,
  FiLock, FiCalendar, FiServer, FiGlobe
} from 'react-icons/fi'
import { api } from '../services/api'
import { toast } from 'react-hot-toast'

const WEAK_TLS = ['TLSv1', 'TLSv1.0', 'TLSv1.1', 'TLS 1.0', 'TLS 1.1']

function StatusBadge({ status }) {
  let colorClass = 'badge-none'
  let Icon = FiAlertTriangle
  let text = status?.toUpperCase() || 'UNKNOWN'

  if (status === 'valid') {
    colorClass = 'badge-low'
    Icon = FiCheckCircle
  } else if (status === 'expiring') {
    colorClass = 'badge-medium'
    Icon = FiAlertTriangle
  } else if (status === 'self_signed') {
    colorClass = 'badge-high'
    Icon = FiAlertTriangle
    text = 'SELF-SIGNED'
  } else if (status === 'expired' || status === 'error' || status === 'invalid') {
    colorClass = 'badge-critical'
    Icon = FiXCircle
  }

  return (
    <div className={`badge ${colorClass} text-xs px-3 py-1.5`}>
      <Icon size={12} />
      {text}
    </div>
  )
}

export default function SSLChecker() {
  const [hostname, setHostname] = useState('')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)

  const handleCheck = async () => {
    if (!hostname.trim()) {
      toast.error('Please enter a domain name')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await api.post('/api/recon/ssl-check', { domain: hostname.trim() })
      setResult(response.data)
      toast.success('SSL verification complete')
    } catch (error) {
      const msg = error.response?.data?.detail || error.message || 'Failed to check SSL'
      toast.error(msg)
      setResult({ status: 'error', error: msg, hostname: hostname.trim() })
    } finally {
      setLoading(false)
    }
  }

  const daysColor = (days) => {
    if (days === undefined || days === null) return 'text-cyber-muted'
    if (days <= 0)  return 'text-red-400'
    if (days <= 30) return 'text-red-400'
    if (days <= 90) return 'text-yellow-400'
    return 'text-green-400'
  }

  const tlsColor = (version) => {
    if (!version) return 'text-cyber-text'
    return WEAK_TLS.includes(version) ? 'text-red-400' : 'text-cyber-text'
  }

  return (
    <div className="page-container animate-fadeIn">
      {/* Header */}
      <div className="mb-5 sm:mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
            <FiLock className="text-cyber-cyan" />
            SSL/TLS{' '}
            <span style={{
              background: 'linear-gradient(135deg, #00C2FF, #3B82F6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Certificate Analyzer</span>
          </h1>
          <p className="text-cyber-muted mt-1 text-xs font-mono">
            Verify SSL certificate validity, issuer, expiry, and TLS version
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Input Panel */}
        <div className="lg:col-span-1">
          <div className="glass p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <FiGlobe className="text-cyber-cyan" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Target Domain</h2>
            </div>

            <input
              type="text"
              className="cyber-input w-full"
              placeholder="e.g. google.com"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              id="ssl-hostname-input"
            />

            <button
              className="btn-cyber w-full py-2.5 font-semibold flex items-center justify-center gap-2"
              onClick={handleCheck}
              disabled={loading || !hostname.trim()}
              id="ssl-check-btn"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <FiShield size={14} /> Check Certificate
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {result ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="glass p-5">

                {/* Result header */}
                <div className="flex items-center justify-between mb-5 border-b border-cyber-border/50 pb-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FiServer className="text-cyber-cyan" />
                    {result.hostname}
                  </h3>
                  <StatusBadge status={result.status} />
                </div>

                {/* Error state */}
                {result.status === 'error' && !result.valid ? (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                    <FiXCircle className="text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-red-400">Connection Failed</p>
                      <p className="text-xs text-red-300/80 mt-1">
                        {result.error || 'Unable to establish a secure connection or parse certificate.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Issuer / Subject */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="p-4 rounded-lg bg-black/20 border border-cyber-border/40">
                        <p className="text-[10px] text-cyber-muted uppercase font-bold mb-1">Issuer / Authority</p>
                        <p className="text-sm text-white font-semibold truncate" title={result.issuer}>
                          {result.issuer || '—'}
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-black/20 border border-cyber-border/40">
                        <p className="text-[10px] text-cyber-muted uppercase font-bold mb-1">Subject / Domain</p>
                        <p className="text-sm text-white font-semibold truncate" title={result.subject}>
                          {result.subject || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {/* TLS Version */}
                      <div className="p-3 rounded-lg bg-black/20 border border-cyber-border/40">
                        <p className="text-[10px] text-cyber-muted uppercase font-bold mb-1 flex items-center gap-1">
                          <FiLock size={10} /> TLS Version
                        </p>
                        <p className={`text-xs font-mono font-bold ${tlsColor(result.tls_version)}`}>
                          {result.tls_version || '—'}
                        </p>
                        {WEAK_TLS.includes(result.tls_version) && (
                          <p className="text-[10px] text-red-400 mt-1">Insecure version</p>
                        )}
                      </div>

                      {/* Issued On */}
                      <div className="p-3 rounded-lg bg-black/20 border border-cyber-border/40">
                        <p className="text-[10px] text-cyber-muted uppercase font-bold mb-1 flex items-center gap-1">
                          <FiCalendar size={10} /> Issued On
                        </p>
                        <p className="text-xs font-mono text-cyber-text truncate" title={result.issued_on}>
                          {result.issued_on || '—'}
                        </p>
                      </div>

                      {/* Expires On */}
                      <div className="p-3 rounded-lg bg-black/20 border border-cyber-border/40">
                        <p className="text-[10px] text-cyber-muted uppercase font-bold mb-1 flex items-center gap-1">
                          <FiCalendar size={10} /> Expires On
                        </p>
                        <p className="text-xs font-mono text-cyber-text truncate" title={result.expires_on}>
                          {result.expires_on || '—'}
                        </p>
                      </div>

                      {/* Days Remaining */}
                      <div className="p-3 rounded-lg bg-black/20 border border-cyber-border/40">
                        <p className="text-[10px] text-cyber-muted uppercase font-bold mb-1">Days Remaining</p>
                        <p className={`text-sm font-bold ${daysColor(result.days_remaining)}`}>
                          {result.days_remaining != null ? `${result.days_remaining}d` : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Self-signed warning */}
                    {result.is_self_signed && (
                      <div className="mt-5 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-start gap-3">
                        <FiAlertTriangle className="text-orange-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-orange-400">Self-Signed Certificate</p>
                          <p className="text-xs text-orange-300/80 mt-1">
                            This certificate was not signed by a trusted Certificate Authority (CA).
                            It encrypts traffic but does not verify the server's identity.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Generic cert error */}
                    {!result.valid && !result.is_self_signed && result.error && (
                      <div className="mt-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                        <FiXCircle className="text-red-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-red-400">Certificate Error</p>
                          <p className="text-xs text-red-300/80 mt-1">{result.error}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="glass min-h-[380px] flex flex-col items-center justify-center p-8 text-center opacity-60">
              <div className="w-16 h-16 rounded-full bg-cyber-border/30 flex items-center justify-center mb-4">
                <FiLock className="text-cyber-muted text-2xl" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Awaiting Domain</h3>
              <p className="text-sm text-cyber-muted max-w-sm">
                Enter a domain to verify its SSL/TLS certificate configuration, issuer, and expiration date.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
