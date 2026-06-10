import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiAlertTriangle, FiCheck, FiX, FiShield, FiSliders, FiHelpCircle } from 'react-icons/fi'

export default function DisclaimerModal() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const shown = localStorage.getItem('disclaimer_shown')
    if (!shown) {
      setVisible(true)
    }

    const handleOpen = () => setVisible(true)
    window.addEventListener('open-disclaimer', handleOpen)
    return () => {
      window.removeEventListener('open-disclaimer', handleOpen)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('disclaimer_shown', 'true')
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(16px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="glass w-full max-w-2xl p-6 md:p-8 relative my-8"
            style={{
              border: '1px solid rgba(0, 194, 255, 0.2)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 194, 255, 0.05)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
          >
            {/* Close button (top right) */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 text-cyber-muted hover:text-white rounded-lg hover:bg-white/5 transition-all"
              title="Close"
            >
              <FiX size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/20">
                <FiShield size={24} className="text-cyber-cyan" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
                  Legal Disclaimer & Tool Capabilities
                </h2>
                <p className="text-xs text-cyber-muted mt-0.5 font-mono">
                  CyberSuite Security Platform Policies
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="space-y-6 text-sm text-cyber-text-dim leading-relaxed">
              
              {/* Real World Tools */}
              <div>
                <h3 className="text-xs font-bold text-cyber-cyan uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-pulse" />
                  Real World Tools (work on any public target):
                </h3>
                <ul className="space-y-2 pl-3 font-mono text-xs text-cyber-muted border-l border-cyber-cyan/20">
                  <li>
                    <strong className="text-white">Port Scanner</strong> — scans real open ports on live servers
                  </li>
                  <li>
                    <strong className="text-white">Subdomain Finder</strong> — discovers real subdomains
                  </li>
                  <li>
                    <strong className="text-white">WHOIS Lookup</strong> — fetches real domain registration data
                  </li>
                  <li>
                    <strong className="text-white">DNS Lookup</strong> — queries real DNS records
                  </li>
                  <li>
                    <strong className="text-white">SSL/TLS Checker</strong> — checks real certificates on live HTTPS sites
                  </li>
                  <li>
                    <strong className="text-white">Email Header Analyzer</strong> — analyzes real email routing headers
                  </li>
                  <li>
                    <strong className="text-white">Password Checker</strong> — checks against real breach databases
                  </li>
                </ul>
              </div>

              {/* Simulation Tools */}
              <div>
                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Simulation Tools (safe pattern detection only):
                </h3>
                <ul className="space-y-2 pl-3 font-mono text-xs text-cyber-muted border-l border-purple-400/20">
                  <li>
                    <strong className="text-white">SQL Injection Tester</strong> — pattern-based detection, no real DB attacked
                  </li>
                  <li>
                    <strong className="text-white">XSS Tester</strong> — reflection-based detection, no scripts executed
                  </li>
                </ul>
              </div>

              {/* Legal Warning */}
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/25">
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <FiAlertTriangle className="text-red-400" size={14} />
                  Legal Warning:
                </h3>
                <p className="text-xs text-red-200/80 font-mono leading-relaxed">
                  Only scan systems you own or have explicit written permission to test. Unauthorized scanning may violate the IT Act 2000 (India), CFAA (USA), or equivalent laws in your country. CyberSuite takes no responsibility for misuse.
                </p>
              </div>

            </div>

            {/* Actions */}
            <div className="mt-8 flex justify-end">
              <button
                id="disclaimer-accept-btn"
                onClick={handleDismiss}
                className="btn-cyber w-full justify-center py-3 text-sm font-bold tracking-wide"
                style={{ borderColor: 'rgba(0, 194, 255, 0.4)', color: '#00C2FF' }}
              >
                <FiCheck size={16} />
                I Understand
              </button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
