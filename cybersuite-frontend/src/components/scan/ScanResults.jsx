import { motion } from 'framer-motion'
import NeonBadge from '../ui/NeonBadge'
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi'

const RiskIcon = ({ level }) => {
  const map = {
    critical: <FiXCircle className="text-cyber-red" />,
    high:     <FiAlertTriangle className="text-cyber-orange" />,
    medium:   <FiAlertTriangle className="text-cyber-amber" />,
    low:      <FiInfo className="text-cyber-green" />,
    none:     <FiCheckCircle className="text-cyber-muted" />,
  }
  return map[level] || map.none
}

export default function ScanResults({ data, type }) {
  if (!data) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Port Scan */}
      {type === 'port' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            {[
              { label: 'Host',    val: data.host },
              { label: 'IP',      val: data.ip || 'N/A' },
              { label: 'Scanned', val: `${data.total_scanned} ports` },
              { label: 'Time',    val: `${data.scan_duration_seconds}s` },
            ].map(({ label, val }) => (
              <div key={label} className="glass px-3 py-2 rounded-lg">
                <p className="text-cyber-muted text-[10px] uppercase tracking-widest">{label}</p>
                <p className="text-cyber-cyan font-bold mt-0.5">{val}</p>
              </div>
            ))}
          </div>
          {data.open_ports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="cyber-table">
                <thead><tr><th>Port</th><th className="hidden sm:table-cell">Service</th><th>Status</th></tr></thead>
                <tbody>
                  {data.open_ports.map(p => (
                    <tr key={p.port}>
                      <td className="font-mono text-cyber-cyan">{p.port}</td>
                      <td className="text-cyber-text hidden sm:table-cell">{p.service || '—'}</td>
                      <td><NeonBadge level="open">Open</NeonBadge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-cyber-muted text-sm text-center py-4">No open ports found in range.</p>
          )}
        </>
      )}

      {/* Subdomain scan */}
      {type === 'subdomain' && (
        <>
          <div className="grid grid-cols-4 gap-3 text-xs font-mono">
            {[
              { label: 'Domain',  val: data.domain },
              { label: 'Checked', val: data.total_checked },
              { label: 'Found',   val: data.total_found },
              { label: 'via CT',  val: data.total_from_crt ?? 0 },
            ].map(({ label, val }) => (
              <div key={label} className="glass px-3 py-2 rounded-lg">
                <p className="text-cyber-muted text-[10px] uppercase tracking-widest">{label}</p>
                <p className="text-cyber-cyan font-bold mt-0.5">{val}</p>
              </div>
            ))}
          </div>
          {data.found.length === 0 ? (
            <p className="text-cyber-muted text-sm text-center py-4">No live subdomains found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="cyber-table">
                <thead><tr><th>Subdomain</th><th>IP</th><th>Source</th><th>Status</th></tr></thead>
                <tbody>
                  {data.found.map(s => (
                    <tr key={s.subdomain}>
                      <td className="font-mono text-cyber-cyan">{s.subdomain}</td>
                      <td className="font-mono text-cyber-muted">{s.ip || '—'}</td>
                      <td>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          s.source === 'crt.sh'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-cyan-500/10 text-cyber-cyan'
                        }`}>
                          {s.source || 'wordlist'}
                        </span>
                      </td>
                      <td><NeonBadge level={s.status}>{s.status}</NeonBadge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Generic key-value — with WHOIS mock warning and WP plugins */}
      {type === 'generic' && (
        <div className="space-y-3">
          {/* WHOIS mock data warning */}
          {data.is_mocked && (
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,45,85,0.08)', border: '1px solid rgba(255,45,85,0.3)' }}
            >
              <FiAlertTriangle size={16} style={{ color: '#FF2D55', flexShrink: 0, marginTop: 2 }} />
              <p className="text-xs" style={{ color: '#FF2D55' }}>
                <strong>Simulated Data</strong> — Live WHOIS query failed (WHOIS binary not available on this server).
                The data below is placeholder and does not reflect the real domain registration.
              </p>
            </div>
          )}

          {/* WordPress version banner */}
          {data.wp_version && (
            <div
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
              style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)' }}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8B5CF6' }}>WP Version</span>
              <span className="font-mono text-sm text-white font-bold">{data.wp_version}</span>
            </div>
          )}

          {/* WordPress findings */}
          {data.findings?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-cyber-muted mb-1">Findings</p>
              {data.findings.map((f, i) => (
                <div key={i} className={`flex flex-col md:flex-row items-start gap-3 px-3 py-2 rounded-lg ${
                  f.severity === 'critical' ? 'bg-red-500/8' :
                  f.severity === 'high'     ? 'bg-orange-500/8' :
                  f.severity === 'medium'   ? 'bg-yellow-500/8' : 'bg-green-500/5'
                }`}>
                  <RiskIcon level={f.severity} />
                  <div>
                    <p className="text-xs font-bold text-cyber-text">{f.name}</p>
                    <p className="text-xs text-cyber-muted mt-0.5">{f.detail}</p>
                  </div>
                  <NeonBadge level={f.severity} className="ml-auto flex-shrink-0">{f.severity}</NeonBadge>
                </div>
              ))}
            </div>
          )}

          {/* WordPress plugins table */}
          {data.plugins_found?.some(p => p.readme_accessible) && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-cyber-muted mb-2">Exposed Plugins</p>
              <table className="cyber-table">
                <thead><tr><th>Plugin</th><th>Readme Exposed</th></tr></thead>
                <tbody>
                  {data.plugins_found.filter(p => p.readme_accessible).map(p => (
                    <tr key={p.slug}>
                      <td className="font-mono text-cyber-cyan">{p.slug}</td>
                      <td><NeonBadge level="high">Yes</NeonBadge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Plain key-value fallback for non-WP data */}
          {!data.findings && Object.entries(data).map(([k, v]) => (
            <div key={k} className="flex gap-3 py-1.5 border-b border-cyber-border/30">
              <span className="text-xs text-cyber-muted uppercase tracking-widest w-36 flex-shrink-0 font-mono">{k.replace(/_/g,' ')}</span>
              <span className="text-sm text-cyber-text font-mono break-all">
                {Array.isArray(v) ? v.join(', ') : String(v ?? '—')}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Website scan */}
      {type === 'website' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between glass px-4 py-3 rounded-lg">
            <span className="text-sm text-cyber-muted">Risk Score</span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-cyber-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${data.risk_score}%`,
                    background: data.risk_score > 70 ? '#00FF88' : data.risk_score > 40 ? '#FFD600' : '#FF2D55',
                  }}
                />
              </div>
              <span className="font-mono font-bold text-cyber-cyan">{data.risk_score}/100</span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {data.headers?.map(h => (
              <div key={h.header} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${h.present ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
                {h.present ? <FiCheckCircle className="text-cyber-green flex-shrink-0" size={14} />
                           : <FiXCircle className="text-cyber-red flex-shrink-0" size={14} />}
                <span className="font-mono text-xs text-cyber-text">{h.header}</span>
                {!h.present && <span className="text-xs text-cyber-muted ml-auto">{h.recommendation}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Password check */}
      {type === 'password' && (
        <div className="space-y-3">
          <div className="glass px-4 py-4 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm text-cyber-muted">Strength</p>
              <p className="text-2xl font-black text-cyber-cyan mt-1">{data.strength}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-cyber-muted">Score</p>
              <p className="text-2xl font-black text-cyber-green">{data.score}/100</p>
            </div>
          </div>
          <div className="glass px-4 py-3 rounded-lg text-sm">
            <p className="text-cyber-muted text-xs uppercase tracking-widest mb-1">Estimated Crack Time</p>
            <p className="text-cyber-amber font-bold font-mono">{data.crack_time_estimate}</p>
          </div>
          <div className="space-y-1.5">
            {data.suggestions?.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <FiAlertTriangle className="text-cyber-amber mt-0.5 flex-shrink-0" size={13} />
                <span className="text-cyber-muted">{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exploit results (SQLi / XSS) */}
      {type === 'exploit' && (
        <div className="space-y-3">
          <div className={`glass px-4 py-3 rounded-lg border ${data.vulnerable ? 'border-red-500/30' : 'border-green-500/30'}`}>
            <div className="flex items-center gap-3">
              <RiskIcon level={data.risk_level} />
              <div>
                <p className="text-sm font-bold">{data.vulnerable ? '⚠️ Potential Vulnerability Detected' : '✅ No Patterns Detected'}</p>
                <p className="text-xs text-cyber-muted">{data.recommendation}</p>
              </div>
              <NeonBadge level={data.risk_level} className="ml-auto">{data.risk_level}</NeonBadge>
            </div>
          </div>
          <table className="cyber-table">
            <thead><tr><th>Payload</th><th>Matched</th><th>Risk</th></tr></thead>
            <tbody>
              {data.payloads_tested?.filter(p => p.pattern_matched || p.reflected).map((p, i) => (
                <tr key={i}>
                  <td className="font-mono text-xs text-cyber-amber break-all">{p.payload}</td>
                  <td className="text-cyber-red">✓</td>
                  <td><NeonBadge level={p.risk}>{p.risk}</NeonBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-cyber-muted italic text-center">⚠️ {data.disclaimer}</p>
        </div>
      )}
    </motion.div>
  )
}
