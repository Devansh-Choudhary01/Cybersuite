import { Link } from 'react-router-dom'
import {
  FiShield, FiSearch, FiAlertTriangle, FiZap, FiActivity,
  FiClock, FiGlobe, FiDatabase, FiCpu, FiLock, FiRadio,
  FiArrowUpRight, FiFileText
} from 'react-icons/fi'
import { motion } from 'framer-motion'
import StatCard from '../components/ui/StatCard'
import GlassCard from '../components/ui/GlassCard'
import ActivityLog from '../components/ActivityLog'
import { ThreatLineChart, VulnDonutChart, ActivityBarChart } from '../components/charts/Charts'
import { useAuthStore } from '../store/authStore'

const STATS = [
  { label: 'Total Scans',    value: 1247, icon: FiActivity,      color: 'cyan',   trend: 12,  delay: 0    },
  { label: 'Threats Found',  value: 84,   icon: FiAlertTriangle, color: 'red',    trend: -5,  delay: 0.05 },
  { label: 'Open Ports',     value: 312,  icon: FiSearch,        color: 'purple', trend: 3,   delay: 0.1  },
  { label: 'Vulns Detected', value: 56,   icon: FiShield,        color: 'orange', trend: 8,   delay: 0.15 },
  { label: 'Exploits Run',   value: 23,   icon: FiZap,           color: 'amber',  trend: 0,   delay: 0.2  },
  { label: 'Uptime',         value: '99.9',icon: FiClock,        color: 'green',  suffix: '%', delay: 0.25 },
]

const QUICK_TOOLS = [
  {
    label: 'Port Scanner',
    path: '/recon/port-scanner',
    icon: FiSearch,
    desc: 'TCP/UDP port discovery',
    color: '#00C2FF',
    gradient: 'from-cyan-500/10 to-blue-500/10',
    border: 'border-cyan-500/20',
  },
  {
    label: 'Website Scanner',
    path: '/vulnscan/website',
    icon: FiGlobe,
    desc: 'Headers, SSL & tech stack',
    color: '#A855F7',
    gradient: 'from-purple-500/10 to-pink-500/10',
    border: 'border-purple-500/20',
  },
  {
    label: 'SQL Injection',
    path: '/exploits/sqli',
    icon: FiDatabase,
    desc: 'Database injection testing',
    color: '#EF4444',
    gradient: 'from-red-500/10 to-orange-500/10',
    border: 'border-red-500/20',
  },
  {
    label: 'AI Assistant',
    path: '/ai',
    icon: FiCpu,
    desc: 'Intelligent threat analysis',
    color: '#10B981',
    gradient: 'from-emerald-500/10 to-cyan-500/10',
    border: 'border-emerald-500/20',
  },
  {
    label: 'DNS Lookup',
    path: '/recon/dns',
    icon: FiRadio,
    desc: 'All DNS record types',
    color: '#F59E0B',
    gradient: 'from-amber-500/10 to-orange-500/10',
    border: 'border-amber-500/20',
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: FiFileText,
    desc: 'Generate security reports',
    color: '#6366F1',
    gradient: 'from-indigo-500/10 to-purple-500/10',
    border: 'border-indigo-500/20',
  },
]

function QuickToolCard({ tool, index }) {
  const Icon = tool.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.3 + index * 0.05 }}
    >
      <Link
        to={tool.path}
        className={`group flex items-start gap-3 p-4 rounded-xl border ${tool.border} bg-gradient-to-br ${tool.gradient} hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200 block`}
        style={{
          background: undefined,
          boxShadow: 'none',
        }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${tool.color}18`, border: `1px solid ${tool.color}30` }}
        >
          <Icon size={16} style={{ color: tool.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-cyber-text group-hover:text-white transition-colors">
              {tool.label}
            </p>
            <FiArrowUpRight
              size={13}
              className="text-cyber-muted group-hover:text-white opacity-0 group-hover:opacity-100 transition-all -translate-y-0.5 translate-x-0.5 group-hover:translate-x-0 group-hover:translate-y-0"
            />
          </div>
          <p className="text-[11px] text-cyber-muted mt-0.5">{tool.desc}</p>
        </div>
      </Link>
    </motion.div>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.email?.split('@')[0] || 'Operator'

  return (
    <div className="page-container space-y-6">

      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <p className="text-xs font-semibold text-cyber-muted mb-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>
            {greeting}, <span
              style={{
                background: 'linear-gradient(135deg, #00C2FF, #3B82F6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >{firstName}</span>
          </h1>
          <p className="text-xs text-cyber-muted mt-1 font-mono">
            Threat Intelligence Dashboard · Updated {new Date().toLocaleTimeString()}
          </p>
        </div>

        {/* Live badge */}
        <div className="flex items-center gap-4 flex-wrap">
          <div
            className="flex items-center gap-2.5 px-4 py-2 rounded-xl"
            style={{
              background: 'rgba(16,185,129,0.07)',
              border: '1px solid rgba(16,185,129,0.18)',
            }}
          >
            <span className="status-dot dot-online animate-pulse-slow" />
            <span className="text-xs font-bold text-cyber-green">All Systems Live</span>
          </div>
          <Link
            to="/reports"
            className="btn-cyber text-xs"
          >
            <FiFileText size={13} />
            Generate Report
          </Link>
        </div>
      </motion.div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {STATS.map(s => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <GlassCard
          title="Threat Activity — 24h"
          accent="cyan"
          className="xl:col-span-2"
          delay={0.1}
        >
          <div style={{ height: 220 }}>
            <ThreatLineChart />
          </div>
        </GlassCard>

        <GlassCard
          title="Vulnerability Breakdown"
          accent="purple"
          delay={0.15}
        >
          <div style={{ height: 220 }}>
            <VulnDonutChart />
          </div>
        </GlassCard>
      </div>

      {/* ── Bottom Row — Activity charts + log ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GlassCard title="Weekly Activity" accent="green" delay={0.2}>
          <div style={{ height: 200 }}>
            <ActivityBarChart />
          </div>
        </GlassCard>

        <div style={{ minHeight: 280 }}>
          <ActivityLog />
        </div>
      </div>

      {/* ── Quick Launch ── */}
      <GlassCard title="Quick Launch" accent="blue" delay={0.25}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_TOOLS.map((tool, i) => (
            <QuickToolCard key={tool.path} tool={tool} index={i} />
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
