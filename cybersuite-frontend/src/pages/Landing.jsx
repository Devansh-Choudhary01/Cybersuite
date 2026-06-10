import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { api } from '../services/api'
import {
  FiShield, FiSearch, FiAlertTriangle, FiZap,
  FiGlobe, FiCpu, FiArrowRight, FiActivity,
  FiLock, FiDatabase, FiRadio
} from 'react-icons/fi'

const FEATURES = [
  { icon: FiSearch,        label: 'Recon Suite',        desc: 'Port scanner, DNS, WHOIS, subdomain & network fingerprinting', color: '#00C2FF' },
  { icon: FiAlertTriangle, label: 'Vuln Scanners',      desc: 'Website headers, SSL, WordPress & password strength analysis', color: '#A855F7' },
  { icon: FiZap,           label: 'Exploit Simulations', desc: 'Safe SQL injection & XSS pattern detection with live terminal', color: '#EF4444' },
  { icon: FiCpu,           label: 'AI Threat Intel',    desc: 'Intelligent analysis, threat scoring & automated reporting',    color: '#10B981' },
  { icon: FiGlobe,         label: 'Live Attack Map',    desc: 'Real-time global threat visualization & activity heatmap',     color: '#F59E0B' },
  { icon: FiActivity,      label: 'Scan History',       desc: 'Full audit trail, exportable reports & timeline analytics',    color: '#6366F1' },
]

const STATS = [
  { value: '15+', label: 'Security Tools' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '1.2k+', label: 'Scans / Day' },
  { value: '0',    label: 'Data Stored' },
]

export default function Landing() {
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)

  const handleLaunch = async () => {
    try {
      const { data } = await api.post('/api/auth/login', {
        email: 'admin@cybersuite.io',
        password: 'demo1234',
      })
      login(data.access_token, 'admin@cybersuite.io')
      navigate('/')
    } catch {
      navigate('/')
    }
  }

  return (
    <div className="landing-root">
      {/* Animated bg blobs */}
      <div className="landing-blob blob-1" />
      <div className="landing-blob blob-2" />
      <div className="landing-blob blob-3" />

      {/* Grid overlay */}
      <div className="landing-grid" />

      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <div className="landing-logo-icon">
              <FiShield size={18} color="#fff" />
            </div>
            <span className="landing-logo-text">
              Cyber<span style={{ color: '#00C2FF' }}>Suite</span>
            </span>
          </div>
          <div className="landing-nav-links">
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#stats"    className="landing-nav-link">About</a>
          </div>
          <button className="btn-cyber landing-nav-btn" onClick={handleLaunch} id="landing-launch-nav">
            Launch Platform <FiArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <motion.div
          className="landing-hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Eyebrow badge */}
          <div className="landing-badge">
            <span className="status-dot dot-online animate-pulse-slow" />
            <span>All Systems Operational · v2.0</span>
          </div>

          <h1 className="landing-headline">
            Professional
            <br />
            <span className="landing-headline-grad">Cyber Security</span>
            <br />
            Research Platform
          </h1>

          <p className="landing-subheadline">
            A unified suite of reconnaissance, vulnerability analysis, and exploit
            simulation tools — built for security researchers and ethical hackers.
          </p>

          {/* CTA buttons */}
          <div className="landing-ctas">
            <motion.button
              className="btn-primary btn-cyber landing-cta-primary"
              onClick={handleLaunch}
              id="landing-launch-hero"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiShield size={17} />
              Launch Platform
              <FiArrowRight size={16} />
            </motion.button>

            <a href="#features" className="landing-cta-ghost">
              Explore Features
            </a>
          </div>

          {/* Disclaimer pill */}
          <p className="landing-disclaimer">
            <FiLock size={11} />
            For authorized security research only · No data stored
          </p>
        </motion.div>

        {/* Hero visual — terminal card */}
        <motion.div
          className="landing-hero-visual"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.75, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="landing-terminal-card">
            <div className="landing-terminal-bar">
              <span className="landing-dot red" />
              <span className="landing-dot yellow" />
              <span className="landing-dot green" />
              <span className="landing-terminal-title">cybersuite — scan</span>
            </div>
            <div className="landing-terminal-body">
              <TermLine color="#00C2FF" text="[INIT]   CyberSuite v2.0 loaded" delay={0.4} />
              <TermLine color="#94A3B8" text="[INFO]   Modules: recon · vuln · exploit · ai" delay={0.7} />
              <TermLine color="#10B981" text="[OK]     Backend API connected" delay={1.0} />
              <TermLine color="#94A3B8" text="[SCAN]   Target: scanme.nmap.org" delay={1.3} />
              <TermLine color="#00C2FF" text="[PORT]   22/tcp  open  ssh" delay={1.6} />
              <TermLine color="#00C2FF" text="[PORT]   80/tcp  open  http" delay={1.9} />
              <TermLine color="#EF4444" text="[VULN]   Missing X-Frame-Options" delay={2.2} />
              <TermLine color="#F59E0B" text="[WARN]   SSL cert expires in 14d" delay={2.5} />
              <TermLine color="#10B981" text="[OK]     Scan complete · 8 findings" delay={2.8} />
              <div className="landing-cursor" style={{ animationDelay: '3s' }}>█</div>
            </div>
          </div>

          {/* Floating stat chips */}
          <motion.div className="landing-float-chip chip-1" animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity }}>
            <FiSearch size={14} color="#00C2FF" />
            <span>Port 443 · Open</span>
          </motion.div>
          <motion.div className="landing-float-chip chip-2" animate={{ y: [0, 8, 0] }} transition={{ duration: 4.5, repeat: Infinity }}>
            <FiAlertTriangle size={14} color="#EF4444" />
            <span>3 Vulnerabilities</span>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats ── */}
      <section className="landing-stats" id="stats">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            className="landing-stat"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <span className="landing-stat-value">{s.value}</span>
            <span className="landing-stat-label">{s.label}</span>
          </motion.div>
        ))}
      </section>

      {/* ── Features ── */}
      <section className="landing-features" id="features">
        <motion.div
          className="landing-section-header"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="landing-section-eyebrow">Full Feature Suite</p>
          <h2 className="landing-section-title">Everything you need for security research</h2>
          <p className="landing-section-sub">
            Professional-grade tools in one unified interface — no setup required.
          </p>
        </motion.div>

        <div className="landing-features-grid">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.label}
                className="landing-feature-card"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -4 }}
              >
                <div className="landing-feature-icon" style={{ background: f.color + '18', border: `1px solid ${f.color}30` }}>
                  <Icon size={20} style={{ color: f.color }} />
                </div>
                <h3 className="landing-feature-title">{f.label}</h3>
                <p className="landing-feature-desc">{f.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="landing-bottom-cta">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="landing-bottom-cta-inner"
        >
          <div className="landing-bottom-icon">
            <FiShield size={28} color="#00C2FF" />
          </div>
          <h2 className="landing-bottom-title">Ready to start?</h2>
          <p className="landing-bottom-sub">
            No sign-up required. Demo access is instant and free.
          </p>
          <motion.button
            className="btn-primary btn-cyber landing-cta-primary"
            onClick={handleLaunch}
            id="landing-launch-bottom"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            <FiShield size={17} />
            Enter CyberSuite
            <FiArrowRight size={16} />
          </motion.button>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <p>© 2025 CyberSuite · For authorized ethical security research only</p>
      </footer>
    </div>
  )
}

function TermLine({ color, text, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      style={{ color, fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(10px, 1.5vw, 12px)', lineHeight: 1.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
    >
      {text}
    </motion.div>
  )
}
