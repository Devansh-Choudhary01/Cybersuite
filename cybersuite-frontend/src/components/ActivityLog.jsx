import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiActivity } from 'react-icons/fi'

const SEED_LOGS = [
  { id: 1, type: 'info',    msg: 'CyberSuite engine initialized',            time: '22:47:01' },
  { id: 2, type: 'success', msg: 'Backend API connection established',        time: '22:47:02' },
  { id: 3, type: 'warning', msg: 'Rate limit: 30 req/min enforced',          time: '22:47:04' },
  { id: 4, type: 'info',    msg: 'Subdomain wordlist loaded (50 entries)',    time: '22:47:06' },
  { id: 5, type: 'success', msg: 'All modules online and ready',             time: '22:47:08' },
]

const SIM_LOGS = [
  { type: 'info',    msg: 'Port probe 443 → open (HTTPS)'         },
  { type: 'warning', msg: 'Missing Content-Security-Policy header' },
  { type: 'error',   msg: 'SSL cert expires in 12 days'           },
  { type: 'success', msg: 'DNS records resolved successfully'      },
  { type: 'info',    msg: 'WHOIS lookup completed'                 },
  { type: 'warning', msg: 'XML-RPC endpoint exposed on target'     },
  { type: 'success', msg: 'Subdomain "api.example.com" found'      },
  { type: 'error',   msg: 'SQL error pattern detected in response' },
  { type: 'info',    msg: 'XSS payload reflected — low risk'       },
  { type: 'success', msg: 'Password strength: Very Strong (96/100)'},
]

const TYPE_STYLE = {
  info:    'text-cyber-muted',
  success: 'text-cyber-green',
  warning: 'text-cyber-amber',
  error:   'text-cyber-red',
}

const TYPE_PREFIX = {
  info:    '[INFO]   ',
  success: '[OK]     ',
  warning: '[WARN]   ',
  error:   '[ERROR]  ',
}

let logId = 100

export default function ActivityLog({ externalLogs = [] }) {
  const [logs, setLogs] = useState(SEED_LOGS)

  // Simulate live log activity
  useEffect(() => {
    const interval = setInterval(() => {
      const entry = SIM_LOGS[Math.floor(Math.random() * SIM_LOGS.length)]
      const now = new Date()
      const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
      setLogs(prev => [...prev.slice(-80), { id: logId++, ...entry, time }])
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Accept external logs from scan results
  useEffect(() => {
    if (externalLogs.length === 0) return
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
    const newLogs = externalLogs.map(l => ({ id: logId++, time, ...l }))
    setLogs(prev => [...prev.slice(-80), ...newLogs])
  }, [externalLogs])

  return (
    <div className="glass h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-cyber-border/50">
        <FiActivity size={14} className="text-cyber-cyan" />
        <span className="text-xs font-bold uppercase tracking-widest text-cyber-muted">Live Activity Log</span>
        <span className="ml-auto status-dot dot-online animate-pulse-slow" />
      </div>
      <div className="flex-1 overflow-y-auto terminal" style={{ minHeight: 200, maxHeight: 340 }}>
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex gap-2 leading-relaxed"
            >
              <span className="info flex-shrink-0">{log.time}</span>
              <span className={`flex-shrink-0 font-bold ${TYPE_STYLE[log.type]}`}>
                {TYPE_PREFIX[log.type]}
              </span>
              <span className={TYPE_STYLE[log.type]}>{log.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
