import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import GlassCard from '../components/ui/GlassCard'
import ScanTerminal from '../components/scan/ScanTerminal'
import ScanProgressBar from '../components/scan/ScanProgressBar'
import ScanResults from '../components/scan/ScanResults'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ConsentCheckbox from '../components/ui/ConsentCheckbox'
import ConfirmScanDialog from '../components/ui/ConfirmScanDialog'
import RateLimitBadge from '../components/ui/RateLimitBadge'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { FiLock, FiGlobe, FiFileText, FiPlay } from 'react-icons/fi'

const TOOLS = [
  {
    id: 'password',  label: 'Password Checker',  icon: FiLock,     desc: 'Strength, entropy & crack time',
    color: '#10B981', border: 'border-emerald-500/25',
  },
  {
    id: 'website',   label: 'Website Scanner',   icon: FiGlobe,    desc: 'Headers, SSL & tech detection',
    color: '#A855F7', border: 'border-purple-500/25',
  },
  {
    id: 'wordpress', label: 'WordPress Scanner',  icon: FiFileText, desc: 'WP misconfigurations & paths',
    color: '#3B82F6', border: 'border-blue-500/25',
  },
]

export default function VulnScanners() {
  const [active, setActive]     = useState('password')
  const location = useLocation()

  useEffect(() => {
    // Keep active scanner in sync with route (sidebar navigation)
    const map = {
      '/vulnscan/password': 'password',
      '/vulnscan/website': 'website',
      '/vulnscan/wordpress': 'wordpress',
    }
    const mapped = map[location.pathname]
    if (mapped && mapped !== active) {
      setActive(mapped)
      setResult(null)
    }
  }, [location.pathname])

  const [input, setInput]       = useState('')
  const [isScanning, setScan]   = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult]     = useState(null)
  const [termLines, setTerm]    = useState([])
  const [consent, setConsent]   = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const addLine = (text, type = 'info') => setTerm(p => [...p, { text, type }])
  const tool = TOOLS.find(t => t.id === active)

  const handleRun = () => {
    if (!input.trim()) { toast.error('Target required'); return }
    if (active !== 'password') {
      if (!consent) { toast.error('Please confirm authorization first'); return }
      setShowConfirm(true)
    } else {
      run()
    }
  }

  const run = async () => {
    setShowConfirm(false)
    setScan(true); setResult(null); setTerm([]); setProgress(0)
    const tick = setInterval(() => setProgress(p => Math.min(p + 3, 90)), 100)

    try {
      addLine(`> Running ${tool.label}...`, 'prompt')
      addLine(`> Target: ${input}`, 'info')

      let res, type
      if (active === 'password') {
        res = await api.post('/api/vulnscan/password-check', { password: input })
        type = 'password'
      } else if (active === 'website') {
        res = await api.post('/api/vulnscan/website-scan', { url: input, consent_confirmed: true })
        type = 'website'
      } else {
        res = await api.post('/api/vulnscan/wordpress-scan', { url: input, consent_confirmed: true })
        type = 'generic'
      }
      clearInterval(tick); setProgress(100)
      addLine('> Analysis complete ✓', 'success')
      setResult({ data: res.data, type })
      toast.success('Scan completed')
    } catch (err) {
      clearInterval(tick); setProgress(0)
      const msg = err.response?.data?.detail || 'Scan failed'
      addLine(`> ERROR: ${msg}`, 'error')
      toast.error(msg)
    } finally { setScan(false) }
  }

  return (
    <div className="page-container space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>
            Vulnerability{' '}
            <span style={{
              background: 'linear-gradient(135deg, #A855F7, #EC4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Scanners</span>
          </h1>
          <p className="text-xs text-cyber-muted mt-0.5 font-mono">Security analysis & misconfiguration detection</p>
        </div>
        <RateLimitBadge />
      </div>

      {/* Tool selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TOOLS.map(t => {
          const Icon = t.icon
          const isActive = active === t.id
          return (
            <motion.button
              key={t.id}
              onClick={() => { setActive(t.id); setResult(null); setInput('') }}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.18 }}
              className={`tool-card ${isActive ? 'selected' : ''}`}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: isActive ? `${t.color}18` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isActive ? t.color + '35' : 'rgba(255,255,255,0.06)'}`,
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={16} style={{ color: isActive ? t.color : '#4A5E80' }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-cyber-text">{t.label}</p>
                <p className="text-[11px] text-cyber-muted mt-0.5">{t.desc}</p>
              </div>
              {isActive && (
                <div
                  className="absolute top-3 right-3 w-2 h-2 rounded-full"
                  style={{ background: t.color, boxShadow: `0 0 6px ${t.color}` }}
                />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Config + Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard title={`Configure — ${tool.label}`} icon={tool.icon} accent="purple">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-cyber-muted uppercase tracking-widest mb-2 block">
                {active === 'password' ? 'Password to Analyse' : 'URL / Domain'}
              </label>
              <input
                className="cyber-input"
                type={active === 'password' ? 'text' : 'url'}
                placeholder={active === 'password' ? 'Enter password to analyse...' : 'https://example.com'}
                value={input}
                onChange={e => setInput(e.target.value)}
                id="vulnscan-input"
                onKeyDown={e => e.key === 'Enter' && handleRun()}
              />
            </div>

            {/* Privacy note for password checker */}
            {active === 'password' && (
              <div
                className="flex items-start gap-2.5 p-3 rounded-xl"
                style={{
                  background: 'rgba(16,185,129,0.07)',
                  border: '1px solid rgba(16,185,129,0.18)',
                }}
              >
                <FiLock size={13} className="text-cyber-green mt-0.5 flex-shrink-0" />
                <p className="text-xs text-cyber-muted leading-relaxed">
                  <span className="font-semibold text-white">Privacy Guarantee:</span>{' '}
                  Your password is analysed locally and is never stored or transmitted to any server.
                </p>
              </div>
            )}

            {active !== 'password' && (
              <ConsentCheckbox checked={consent} onChange={setConsent} />
            )}

            <button
              onClick={handleRun}
              disabled={isScanning || (active !== 'password' && !consent)}
              className="btn-cyber w-full justify-center py-2.5 font-semibold"
              id="vulnscan-btn"
              style={{ borderColor: `${tool.color}50`, color: tool.color }}
            >
              {isScanning
                ? <><LoadingSpinner size={15} label={null} /> Analysing...</>
                : <><FiPlay size={14} /> Run Analysis</>
              }
            </button>

            {isScanning && <ScanProgressBar progress={progress} label="Analysis in progress..." />}
          </div>
        </GlassCard>

        <GlassCard title="Output Terminal" accent="green">
          <ScanTerminal isScanning={isScanning} target={input} scanLines={termLines} />
        </GlassCard>
      </div>

      {result && (
        <GlassCard title="Analysis Results" accent="purple">
          <ScanResults data={result.data} type={result.type} />
        </GlassCard>
      )}

      <ConfirmScanDialog
        open={showConfirm}
        onConfirm={run}
        onCancel={() => setShowConfirm(false)}
        toolName={tool.label}
        target={input}
      />
    </div>
  )
}
