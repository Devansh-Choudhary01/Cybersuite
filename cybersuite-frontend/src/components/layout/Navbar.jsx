import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiShield, FiSearch, FiAlertTriangle, FiZap,
  FiGlobe, FiClock, FiMessageSquare, FiFileText,
  FiChevronDown, FiMenu, FiX, FiLogOut,
  FiRadio, FiDatabase, FiLock, FiActivity,
  FiUser, FiCpu, FiGrid, FiMail, FiHelpCircle
} from 'react-icons/fi'
import { useAuthStore } from '../../store/authStore'

/* ─── Navigation structure ─── */
const NAV = [
  {
    group: 'Overview',
    items: [
      { label: 'Dashboard', path: '/', icon: FiGrid },
    ],
  },
  {
    group: 'Reconnaissance',
    items: [
      { label: 'Port Scanner',     path: '/recon/port-scanner', icon: FiSearch },
      { label: 'Subdomain Finder', path: '/recon/subdomain',    icon: FiGlobe },
      { label: 'WHOIS Lookup',     path: '/recon/whois',        icon: FiDatabase },
      { label: 'DNS Lookup',       path: '/recon/dns',          icon: FiRadio },
      { label: 'Network Scanner',  path: '/recon/network',      icon: FiActivity },
      { label: 'SSL Checker',      path: '/recon/ssl-checker',  icon: FiLock },
    ],
  },
  {
    group: 'Vulnerability',
    items: [
      { label: 'Password Checker', path: '/vulnscan/password',  icon: FiLock },
      { label: 'Website Scanner',  path: '/vulnscan/website',   icon: FiShield },
      { label: 'WordPress Scan',   path: '/vulnscan/wordpress', icon: FiFileText },
    ],
  },
  {
    group: 'Exploits',
    items: [
      { label: 'SQL Injection',    path: '/exploits/sqli',      icon: FiDatabase },
      { label: 'XSS Tester',      path: '/exploits/xss',       icon: FiZap },
    ],
  },
  {
    group: 'Intelligence',
    items: [
      { label: 'Attack Map',   path: '/attack-map',         icon: FiGlobe },
      { label: 'Scan History', path: '/history',            icon: FiClock },
      { label: 'AI Assistant', path: '/ai',                 icon: FiCpu },
      { label: 'Reports',      path: '/reports',            icon: FiFileText },
      { label: 'Email Headers',path: '/intelligence/email', icon: FiMail },
    ],
  },
]

/* Flatten for mobile search */
const ALL_ITEMS = NAV.flatMap(g => g.items)

/* ─── Sidebar nav item ─── */
function SidebarItem({ item, isActive, onClick }) {
  const { icon: Icon, label, path } = item
  return (
    <Link
      to={path}
      onClick={onClick}
      className={`sidebar-item ${isActive ? 'active' : ''}`}
    >
      <Icon size={18} className="flex-shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  )
}

/* ─── Sidebar (desktop) ─── */
export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [searchQ, setSearchQ] = useState('')

  const handleLogout = () => { logout(); navigate('/login') }
  const isActive = (path) => location.pathname === path

  const filtered = searchQ.trim()
    ? ALL_ITEMS.filter(i => i.label.toLowerCase().includes(searchQ.toLowerCase()))
    : null

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-cyber-border/60">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #00C2FF, #3B82F6)' }}
        >
          <FiShield size={17} className="text-white" />
        </div>
        <div>
          <p className="font-black text-lg leading-none tracking-tight text-white">
            Cyber<span style={{ color: '#00C2FF' }}>Suite</span>
          </p>
          <p className="text-xs font-semibold tracking-widest text-cyber-muted uppercase mt-1">
            Security Platform
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-cyber-border/40">
        <div className="relative">
          <FiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            className="w-full bg-white/[0.04] border border-cyber-border/60 rounded-lg pl-9 pr-3 py-2 text-sm text-cyber-text placeholder-cyber-muted/60 outline-none focus:border-cyber-cyan/40 focus:bg-white/[0.06] transition-all"
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {filtered ? (
          <div className="px-3 py-2">
            {filtered.length > 0 ? filtered.map(item => (
              <SidebarItem key={item.path} item={item} isActive={isActive(item.path)} onClick={() => setSearchQ('')} />
            )) : (
              <p className="text-sm text-cyber-muted px-3 py-4 text-center">No results</p>
            )}
          </div>
        ) : (
          NAV.map(group => (
            <div key={group.group} className="mb-1">
              <p className="section-label">{group.group}</p>
              {group.items.map(item => (
                <SidebarItem key={item.path} item={item} isActive={isActive(item.path)} />
              ))}
            </div>
          ))
        )}
      </nav>

      {/* Footer — user + logout */}
      <div className="border-t border-cyber-border/60 p-4">
        {/* Live status */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15 mb-3">
          <span className="status-dot dot-online animate-pulse-slow" />
          <span className="text-xs font-bold text-cyber-green">All Systems Operational</span>
        </div>

        {/* User row */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyber-cyan to-cyber-blue flex items-center justify-center flex-shrink-0">
            <FiUser size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-cyber-text truncate">
              {user?.email?.split('@')[0] || 'Admin'}
            </p>
            <p className="text-xs text-cyber-muted truncate">{user?.email}</p>
          </div>
          <button
            id="sidebar-logout-btn"
            onClick={handleLogout}
            title="Sign out"
            className="p-2 rounded-lg text-cyber-muted hover:text-cyber-red hover:bg-red-500/10 transition-all flex-shrink-0"
          >
            <FiLogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}

/* ─── Mobile top bar ─── */
export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')

  const handleLogout = () => { logout(); navigate('/login') }

  const currentLabel = ALL_ITEMS.find(i => i.path === location.pathname)?.label || 'CyberSuite'

  return (
    <nav
      className="sticky top-0 z-50 border-b border-cyber-border/50"
      style={{
        background: 'rgba(6, 10, 18, 0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="w-full px-4 h-14 flex items-center gap-3">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00C2FF, #3B82F6)' }}
          >
            <FiShield size={18} className="text-white" />
          </div>
          <span className="font-black text-lg tracking-tight">
            <span style={{ color: '#00C2FF' }}>Cyber</span>
            <span className="text-white">Suite</span>
          </span>
        </Link>

        {/* Current page breadcrumb */}
        <div className="flex-1 flex items-center gap-2 ml-2 min-w-0">
          <span className="text-cyber-border/60">/</span>
          <span className="text-sm font-medium text-cyber-text-dim truncate">{currentLabel}</span>
        </div>

        {/* Desktop nav — search + user (hidden below md) */}
        <div className="hidden md:flex items-center gap-2">
          {/* Quick nav links */}
          {NAV[0].items.map(item => {
            const Icon = item.icon
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'text-cyber-cyan bg-cyan-500/10'
                    : 'text-cyber-muted hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={13} />
                {item.label}
              </Link>
            )
          })}

          {/* Separator */}
          <div className="w-px h-5 bg-cyber-border/60 mx-1" />

          {/* User */}
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyber-cyan to-cyber-blue flex items-center justify-center">
                <FiUser size={11} className="text-white" />
              </div>
              <span className="text-xs font-mono text-cyber-muted hidden xl:block">{user.email}</span>
            </div>
          )}
          <button
            id="navbar-logout-btn"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-cyber-muted hover:text-cyber-red hover:bg-red-500/10 transition-all"
          >
            <FiLogOut size={13} />
            <span className="hidden xl:inline">Sign Out</span>
          </button>
        </div>

        {/* Live indicator — hidden below md */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
          <span className="status-dot dot-online animate-pulse-slow" />
          <span className="text-xs font-bold text-cyber-green">LIVE</span>
        </div>

        {/* Disclaimer button */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-disclaimer'))}
          className="p-2 rounded-lg text-cyber-muted hover:text-white hover:bg-white/5 transition-all flex items-center justify-center"
          title="Disclaimer & Capabilities"
          id="disclaimer-info-btn"
        >
          <FiHelpCircle size={18} />
        </button>

        {/* Mobile toggle — shown below md, hidden md+ */}
        <button
          className="md:hidden p-2 text-cyber-muted hover:text-white transition-colors"
          onClick={() => setMobileOpen(p => !p)}
          id="mobile-menu-toggle"
        >
          {mobileOpen ? <FiX size={19} /> : <FiMenu size={19} />}
        </button>
      </div>

      {/* Mobile overlay sidebar (slide-in from left) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="mobile-sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMobileOpen(false)}
            />

            <motion.aside
              className="mobile-sidebar-panel"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            >
              {/* Logo + close */}
              <div className="flex items-center justify-between px-3 py-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00C2FF, #3B82F6)' }}>
                    <FiShield size={17} className="text-white" />
                  </div>
                  <div>
                    <p className="font-black text-lg leading-none tracking-tight text-white">Cyber<span style={{ color: '#00C2FF' }}>Suite</span></p>
                    <p className="text-xs font-semibold tracking-widest text-cyber-muted uppercase mt-1">Security Platform</p>
                  </div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-2 text-cyber-muted">
                  <FiX size={18} />
                </button>
              </div>

              {/* Search */}
              <div className="px-3 mb-3">
                <div className="relative">
                  <FiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
                  <input
                    type="text"
                    placeholder="Search tools..."
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    className="w-full bg-white/[0.04] border border-cyber-border/60 rounded-lg pl-9 pr-3 py-2 text-sm text-cyber-text placeholder-cyber-muted/60 outline-none focus:border-cyber-cyan/40 transition-all"
                  />
                </div>
              </div>

              <div className="px-2 overflow-y-auto" style={{ maxHeight: '70vh' }}>
                {NAV.map(group => (
                  <div key={group.group} className="mb-3 px-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-cyber-muted px-1 mb-1.5">{group.group}</p>
                    {group.items.map(item => {
                      const Icon = item.icon
                      const active = location.pathname === item.path
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => { setMobileOpen(false); setSearchQ('') }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${
                            active
                              ? 'text-cyber-cyan bg-cyan-500/10 border border-cyber-cyan/20'
                              : 'text-cyber-muted hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Icon size={18} />
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>
                ))}

                <div className="border-t border-cyber-border/40 pt-3 mt-2 px-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-cyber-muted hover:text-cyber-red hover:bg-red-500/10 w-full transition-all"
                  >
                    <FiLogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </nav>
  )
}
