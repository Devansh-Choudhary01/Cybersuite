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
import {
  FiSearch, FiGlobe, FiClipboard, FiLink, FiRadio,
  FiPlay, FiRefreshCw
} from 'react-icons/fi'

const TOOLS = [
  {
    id: 'port',      label: 'Port Scanner',    desc: 'Scan TCP/UDP ports',         icon: FiSearch,    color: '#00C2FF',
    gradient: 'from-cyan-500/10 to-blue-500/10',   border: 'border-cyan-500/25',
  },
  {
    id: 'subdomain', label: 'Subdomain Finder', desc: 'Enumerate via DNS',          icon: FiGlobe,     color: '#A855F7',
    gradient: 'from-purple-500/10 to-pink-500/10', border: 'border-purple-500/25',
  },
  {
    id: 'whois',     label: 'WHOIS Lookup',     desc: 'Registration data',          icon: FiClipboard, color: '#F59E0B',
    gradient: 'from-amber-500/10 to-orange-500/10',border: 'border-amber-500/25',
  },
  {
    id: 'dns',       label: 'DNS Lookup',       desc: 'Query all record types',     icon: FiLink,      color: '#10B981',
    gradient: 'from-emerald-500/10 to-cyan-500/10',border: 'border-emerald-500/25',
  },
  {
    id: 'network',   label: 'Network Scanner',  desc: 'Host + OS fingerprinting',   icon: FiRadio,     color: '#6366F1',
    gradient: 'from-indigo-500/10 to-purple-500/10',border: 'border-indigo-500/25',
  },
]

function ToolCard({ tool, selected, onClick }) {
  const Icon = tool.icon
  return (
    <motion.button
      onClick={() => onClick(tool.id)}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.18 }}
      className={`tool-card ${selected ? 'selected' : ''}`}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{
          background: selected ? `${tool.color}18` : 'rgba(255,255,255,0.04)',
          border: `1px solid ${selected ? tool.color + '35' : 'rgba(255,255,255,0.06)'}`,
          transition: 'all 0.2s',
        }}
      >
        <Icon size={16} style={{ color: selected ? tool.color : '#4A5E80' }} />
      </div>

      <div>
        <p className="text-sm font-semibold text-cyber-text">{tool.label}</p>
        <p className="text-[11px] text-cyber-muted mt-0.5">{tool.desc}</p>
      </div>

      {/* Active indicator dot */}
      {selected && (
        <div
          className="absolute top-3 right-3 w-2 h-2 rounded-full"
          style={{ background: tool.color, boxShadow: `0 0 6px ${tool.color}` }}
        />
      )}
    </motion.button>
  )
}

const PRESETS = [
  { label: 'Basic',   ports: [21, 22, 23, 25, 53, 80, 443, 8080] },
  { label: 'Common',  ports: [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 5900, 6379, 8080] },
  { label: 'Web',     ports: [80, 443, 8000, 8080, 8081, 8443, 9000] },
  { label: 'Games',   ports: [25565, 27015, 3074, 3478, 1119, 28015] },
  { label: 'Threats', ports: [135, 137, 138, 139, 445, 1433, 2323, 5060, 11211, 32764] },
]

export default function ReconTools() {
  const [active, setActive]     = useState('port')
  const location = useLocation()

  useEffect(() => {
    // Keep the active tool in sync with the current route (sidebar navigation)
    const map = {
      '/recon/port-scanner': 'port',
      '/recon/subdomain': 'subdomain',
      '/recon/whois': 'whois',
      '/recon/dns': 'dns',
      '/recon/network': 'network',
    }
    const mapped = map[location.pathname]
    if (mapped && mapped !== active) {
      setActive(mapped)
      setResult(null)
    }
  }, [location.pathname])
  const [host, setHost]         = useState('')
  const [startPort, setStart]   = useState(1)
  const [endPort, setEnd]       = useState(1024)
  const [protocol, setProtocol] = useState('TCP')
  const [customPorts, setCustom] = useState('')
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [dnsType, setDnsType]   = useState('ALL')
  const [isScanning, setScan]   = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult]     = useState(null)
  const [termLines, setTerm]    = useState([])
  const [consent, setConsent]   = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const tool = TOOLS.find(t => t.id === active)

  const applyPreset = (preset) => {
    setCustom(preset.ports.join(', '))
    setStart(null)
    setEnd(null)
    setSelectedPreset(preset.label)
  }

  const resetRange = () => {
    setCustom('')
    setStart(1)
    setEnd(1024)
    setSelectedPreset(null)
  }

  const addTermLine = (text, type = 'info') =>
    setTerm(prev => [...prev, { text, type }])

  const handleRun = () => {
    if (!host.trim()) { toast.error('Please enter a target host or domain'); return }
    if (!consent) { toast.error('Please confirm authorization first'); return }
    setShowConfirm(true)
  }

  const runScan = async () => {
    setShowConfirm(false)
    setScan(true); setResult(null); setTerm([]); setProgress(0)

    const progressTick = setInterval(() => setProgress(p => Math.min(p + 2, 92)), 80)

    try {
      addTermLine(`> Starting ${tool.label}...`, 'prompt')
      addTermLine(`> Target: ${host}`, 'info')

      let payload = { consent_confirmed: true }
      let type = 'generic'
      let endpoint = tool.path || `/api/recon/${active}`

      if (active === 'port') {
        const portsArr = customPorts ? customPorts.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p)) : null
        payload = {
          ...payload,
          host,
          protocol,
          ports: portsArr,
          start_port: portsArr ? null : +startPort,
          end_port: portsArr ? null : +endPort
        }
        type = 'port'
        endpoint = '/api/recon/port-scan'
        addTermLine(`> Mode: ${protocol}`, 'info')
        if (portsArr) addTermLine(`> Ports: ${portsArr.length} specific targets`, 'info')
        else addTermLine(`> Range: ${startPort}–${endPort}`, 'info')
      } else if (active === 'subdomain') {
        payload = { ...payload, domain: host }; type = 'subdomain'
        endpoint = '/api/recon/subdomain-finder'
      } else if (active === 'whois') {
        payload = { ...payload, domain: host }
        endpoint = '/api/recon/whois'
      } else if (active === 'dns') {
        payload = { ...payload, domain: host, record_type: dnsType }
        endpoint = '/api/recon/dns'
      } else if (active === 'network') {
        payload = { ...payload, host }
        endpoint = '/api/recon/network-scan'
      }

      const res = await api.post(endpoint, payload)
      clearInterval(progressTick); setProgress(100)
      addTermLine('> Scan complete ✓', 'success')
      setResult({ data: res.data, type })
      toast.success(`${tool.label} completed`)
    } catch (err) {
      clearInterval(progressTick); setProgress(0)
      const msg = err.response?.data?.detail || 'Scan failed'
      addTermLine(`> ERROR: ${msg}`, 'error')
      toast.error(msg)
    } finally {
      setScan(false)
    }
  }

  return (
    <div className="page-container space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>
            Recon{' '}
            <span style={{
              background: 'linear-gradient(135deg, #00C2FF, #3B82F6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Tools</span>
          </h1>
          <p className="text-xs text-cyber-muted mt-0.5 font-mono">Reconnaissance & information gathering modules</p>
        </div>
        <RateLimitBadge />
      </div>

      {/* Tool cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {TOOLS.map(t => (
          <ToolCard key={t.id} tool={t} selected={active === t.id} onClick={(id) => { setActive(id); setResult(null) }} />
        ))}
      </div>

      {/* Config + Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Config Panel */}
        <GlassCard title={`Configure — ${tool.label}`} icon={tool.icon} accent="cyan">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-cyber-muted uppercase tracking-widest mb-2 block">
                {active === 'subdomain' || active === 'whois' || active === 'dns' ? 'Domain' : 'Host / IP Address'}
              </label>
              <input
                className="cyber-input"
                placeholder="e.g. scanme.nmap.org or 192.168.1.1"
                value={host}
                onChange={e => setHost(e.target.value)}
                id="recon-host-input"
                onKeyDown={e => e.key === 'Enter' && handleRun()}
              />
            </div>

            {active === 'port' && (
              <div className="space-y-4">
                {/* Protocol */}
                <div>
                  <label className="text-xs font-semibold text-cyber-muted uppercase tracking-widest mb-2 block">
                    Protocol
                  </label>
                  <div className="flex gap-2">
                    {['TCP', 'UDP'].map(p => (
                      <button
                        key={p}
                        onClick={() => setProtocol(p)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          protocol === p
                            ? 'bg-cyber-cyan/15 border-cyber-cyan/50 text-cyber-cyan'
                            : 'bg-white/4 border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Presets */}
                <div>
                  <label className="text-xs font-semibold text-cyber-muted uppercase tracking-widest mb-2 block">
                    Port Presets
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {PRESETS.map(p => {
                      const isActive = selectedPreset === p.label
                      return (
                        <button
                          key={p.label}
                          onClick={() => applyPreset(p)}
                          aria-pressed={isActive}
                          className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${
                            isActive
                              ? 'bg-cyber-cyan/10 border-cyber-cyan/40 text-cyber-cyan'
                              : 'bg-white/4 border-white/8 text-white/50 hover:text-white/80 hover:border-white/15'
                          }`}
                        >
                          {p.label}
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <button onClick={resetRange} className="text-[11px] text-cyber-muted hover:text-white transition-colors">
                      ↺ Reset range
                    </button>
                    {selectedPreset && (
                      <span className="text-[11px] text-cyber-muted">
                        Preset: <span className="text-cyber-cyan font-bold">{selectedPreset}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-cyber-muted uppercase tracking-widest mb-2 block">Start Port</label>
                    <input
                      className="cyber-input disabled:opacity-50 disabled:cursor-not-allowed"
                      type="number" min={1} max={65535}
                      value={startPort || ''}
                      onChange={e => { setStart(e.target.value); setCustom(''); setSelectedPreset(null) }}
                      placeholder="1"
                      disabled={!!customPorts}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-cyber-muted uppercase tracking-widest mb-2 block">End Port</label>
                    <input
                      className="cyber-input disabled:opacity-50 disabled:cursor-not-allowed"
                      type="number" min={1} max={65535}
                      value={endPort || ''}
                      onChange={e => { setEnd(e.target.value); setCustom(''); setSelectedPreset(null) }}
                      placeholder="1024"
                      disabled={!!customPorts}
                    />
                  </div>
                </div>

                {/* Custom ports */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-cyber-muted uppercase tracking-widest">Custom Ports</label>
                    <button
                      type="button"
                      className="text-[11px] text-cyber-muted hover:text-white transition-colors"
                      onClick={() => { setCustom(''); setStart(1); setEnd(1024); setSelectedPreset(null) }}
                    >
                      Clear
                    </button>
                  </div>
                  <input
                    className="cyber-input"
                    placeholder="80, 443, 8080, ..."
                    value={customPorts}
                    onChange={e => {
                      const v = e.target.value
                      setCustom(v)
                      if (!v.trim()) { setStart(1); setEnd(1024); setSelectedPreset(null) }
                      else { setStart(null); setEnd(null); setSelectedPreset(null) }
                    }}
                  />
                </div>
              </div>
            )}

            {active === 'dns' && (
              <div>
                <label className="text-xs font-semibold text-cyber-muted uppercase tracking-widest mb-2 block">Record Type</label>
                <select className="cyber-input" value={dnsType} onChange={e => setDnsType(e.target.value)}>
                  {['ALL','A','AAAA','MX','NS','TXT','CNAME','SOA'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}

            <ConsentCheckbox checked={consent} onChange={setConsent} />

            <button
              onClick={handleRun}
              disabled={isScanning || !consent}
              className="btn-cyber w-full justify-center py-2.5 font-semibold"
              id="recon-scan-btn"
            >
              {isScanning
                ? <><LoadingSpinner size={15} label={null} /> Scanning...</>
                : <><FiPlay size={14} /> Run {tool.label}</>
              }
            </button>

            {isScanning && <ScanProgressBar progress={progress} label={`${tool.label} in progress...`} />}
          </div>
        </GlassCard>

        {/* Terminal */}
        <GlassCard title="Scan Terminal" accent="green">
          <ScanTerminal isScanning={isScanning} target={host} scanLines={termLines} />
        </GlassCard>
      </div>

      {/* Results */}
      {result && (
        <GlassCard title="Scan Results" accent="cyan">
          <ScanResults data={result.data} type={result.type} />
        </GlassCard>
      )}

      <ConfirmScanDialog
        open={showConfirm}
        onConfirm={runScan}
        onCancel={() => setShowConfirm(false)}
        toolName={tool.label}
        target={host}
      />
    </div>
  )
}
