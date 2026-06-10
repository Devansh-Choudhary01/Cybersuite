import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const COLORS = {
  cyan:   {
    text:   'text-cyber-cyan',
    bg:     'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    glow:   'rgba(0,194,255,0.22)',
    iconBg: 'bg-cyan-500/10 border-cyan-500/20',
  },
  green:  {
    text:   'text-cyber-green',
    bg:     'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow:   'rgba(16,185,129,0.22)',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  red:    {
    text:   'text-cyber-red',
    bg:     'bg-red-500/10',
    border: 'border-red-500/20',
    glow:   'rgba(239,68,68,0.22)',
    iconBg: 'bg-red-500/10 border-red-500/20',
  },
  purple: {
    text:   'text-cyber-purple',
    bg:     'bg-purple-500/10',
    border: 'border-purple-500/20',
    glow:   'rgba(168,85,247,0.22)',
    iconBg: 'bg-purple-500/10 border-purple-500/20',
  },
  orange: {
    text:   'text-cyber-orange',
    bg:     'bg-orange-500/10',
    border: 'border-orange-500/20',
    glow:   'rgba(249,115,22,0.22)',
    iconBg: 'bg-orange-500/10 border-orange-500/20',
  },
  amber: {
    text:   'text-cyber-amber',
    bg:     'bg-amber-500/10',
    border: 'border-amber-500/20',
    glow:   'rgba(245,158,11,0.22)',
    iconBg: 'bg-amber-500/10 border-amber-500/20',
  },
}

function useCounter(target, duration = 1200) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    const isNum = typeof target === 'number'
    if (!isNum) { ref.current.textContent = target; return }
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start = Math.min(start + step, target)
      if (ref.current) ref.current.textContent = Math.floor(start).toLocaleString()
      if (start >= target) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return ref
}

export default function StatCard({ label, value, icon: Icon, color = 'cyan', trend, suffix = '', delay = 0 }) {
  const c = COLORS[color] || COLORS.cyan
  const counterRef = useCounter(typeof value === 'number' ? value : 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay, ease: [0.4, 0, 0.2, 1] }}
      className={`glass p-5 border ${c.border} relative overflow-hidden group cursor-default`}
      style={{ transition: 'box-shadow 0.25s, border-color 0.25s, transform 0.25s' }}
      whileHover={{
        y: -3,
        boxShadow: `0 12px 36px rgba(0,0,0,0.5), 0 0 0 1px ${c.glow}`,
        transition: { duration: 0.2 },
      }}
    >
      {/* Background ambient glow */}
      <div
        className={`absolute -top-10 -right-10 w-32 h-32 rounded-full ${c.bg} blur-3xl pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500`}
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-cyber-muted">{label}</p>
          <div className={`icon-box border ${c.iconBg}`}>
            <Icon size={15} className={c.text} />
          </div>
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-1 mt-auto">
          <span className={`text-[2rem] font-black leading-none ${c.text}`}>
            {typeof value === 'number'
              ? <span ref={counterRef}>0</span>
              : value}
          </span>
          {suffix && <span className={`text-sm font-bold ${c.text} opacity-70`}>{suffix}</span>}
        </div>

        {/* Trend */}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-2.5 text-[11px] font-semibold ${trend >= 0 ? 'text-cyber-green' : 'text-cyber-red'}`}>
            <span>{trend >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(trend)}%</span>
            <span className="text-cyber-muted font-normal ml-0.5">vs last hour</span>
          </div>
        )}

        {trend === undefined && (
          <p className="text-[10px] text-cyber-muted mt-2">All time</p>
        )}
      </div>
    </motion.div>
  )
}
