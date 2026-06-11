import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiMail, FiShield, FiAlertTriangle, FiCheckCircle, FiXCircle, FiGlobe, FiClock, FiServer, FiArrowRight } from 'react-icons/fi'

// Helper to extract domain from email string
const extractDomain = (emailStr) => {
  if (!emailStr) return null
  const match = emailStr.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
  if (match) return match[1].toLowerCase()
  
  // If no @ is present, check if the string itself might just be a raw domain 
  // (e.g. from header.from=linkedin.com)
  const domainOnlyMatch = emailStr.match(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
  if (domainOnlyMatch) return emailStr.toLowerCase()
  
  return null
}

const extractIP = (str) => {
  if (!str) return null
  const match = str.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/)
  // Simple filter for private IPs
  if (match) {
    const ip = match[0]
    if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) || ip === '127.0.0.1') {
      return null // Ignore private IPs if we want originating public IP
    }
    return ip
  }
  return null
}

export default function EmailAnalyzer() {
  const [headers, setHeaders] = useState('')
  const [results, setResults] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [geoData, setGeoData] = useState(null)

  const parseHeaders = async () => {
    if (!headers.trim()) return

    setAnalyzing(true)
    setResults(null)
    setGeoData(null)

    // Unfold multi-line headers
    const unfolded = headers.replace(/\r?\n[ \t]+/g, ' ')
    const lines = unfolded.split(/\r?\n/)

    const parsed = {
      from: '',
      returnPath: '',
      authResults: '',
      spf: { result: 'Unknown', record: '' },
      dkim: { result: 'Unknown', domain: '' },
      dmarc: { result: 'Unknown' },
      received: [],
      spoofingRisk: false
    }

    // Regex for auth results
    const spfRegex = /spf=(pass|fail|softfail|neutral|none|temperror|permerror)/i
    const dkimRegex = /dkim=(pass|fail|none|neutral|temperror|permerror)/i
    const dmarcRegex = /dmarc=(pass|fail|none|neutral|temperror|permerror)/i
    
    let currentHeader = ''
    lines.forEach(line => {
      const lower = line.toLowerCase()
      // If line doesn't start with a known header and doesn't have a colon, 
      // it might be a broken wrapped line from bad copy-pasting.
      if (!line.includes(':') && currentHeader) {
        if (currentHeader === 'from') parsed.from += ' ' + line.trim()
        if (currentHeader === 'return-path') parsed.returnPath += ' ' + line.trim()
      }

      if (lower.startsWith('from:')) {
        parsed.from = line.substring(5).trim()
        currentHeader = 'from'
      } else if (lower.startsWith('return-path:')) {
        parsed.returnPath = line.substring(12).trim()
        currentHeader = 'return-path'
      } else if (lower.startsWith('authentication-results:')) {
        parsed.authResults += line.substring(23).trim() + ' '
        currentHeader = 'auth'
      } else if (lower.startsWith('received:')) {
        parsed.received.push(line.substring(9).trim())
        currentHeader = 'received'
      } else if (line.includes(':')) {
        currentHeader = '' // Reset if it's another header we don't care about
      }
    })

    // Parse Auth Results
    if (parsed.authResults) {
      const auth = parsed.authResults
      const spfMatch = auth.match(spfRegex)
      if (spfMatch) parsed.spf.result = spfMatch[1].toLowerCase()
      
      const dkimMatch = auth.match(dkimRegex)
      if (dkimMatch) parsed.dkim.result = dkimMatch[1].toLowerCase()
      const dkimDomainMatch = auth.match(/header\.d=([^ \t;]+)/i)
      if (dkimDomainMatch) {
        parsed.dkim.domain = dkimDomainMatch[1]
      } else {
        const dkimIDMatch = auth.match(/header\.i=([^ \t;]+)/i)
        if (dkimIDMatch) parsed.dkim.domain = dkimIDMatch[1].replace('@', '')
      }

      const dmarcMatch = auth.match(dmarcRegex)
      if (dmarcMatch) parsed.dmarc.result = dmarcMatch[1].toLowerCase()
    } else {
      // Fallback: look for Received-SPF
      const spfHeader = lines.find(l => l.toLowerCase().startsWith('received-spf:'))
      if (spfHeader) {
        const match = spfHeader.match(/(pass|fail|softfail|neutral|none|temperror|permerror)/i)
        if (match) parsed.spf.result = match[1].toLowerCase()
      }
    }

    // Fallback for missing From / Return-Path (e.g. if user only pasted auth results)
    if (!extractDomain(parsed.from) && parsed.authResults) {
      const headerFromMatch = parsed.authResults.match(/header\.from=([^ \t;]+)/i)
      if (headerFromMatch) parsed.from = headerFromMatch[1]
    }
    if (!extractDomain(parsed.returnPath) && parsed.authResults) {
      const mailFromMatch = parsed.authResults.match(/smtp\.mailfrom=([^ \t;]+)/i)
      if (mailFromMatch) parsed.returnPath = mailFromMatch[1]
    }

    // Check spoofing
    const fromDomain = extractDomain(parsed.from)
    const returnDomain = extractDomain(parsed.returnPath)
    if (fromDomain && returnDomain && fromDomain !== returnDomain) {
      parsed.spoofingRisk = true
    }

    // Process Received hops (They are typically top-to-bottom = newest-to-oldest)
    const hops = parsed.received.map((rec, index) => {
      // split by ';' for timestamp
      const parts = rec.split(';')
      const timestamp = parts.length > 1 ? parts[parts.length - 1].trim() : 'Unknown Time'
      const details = parts.slice(0, -1).join(';').trim()
      
      // Extract IP
      const ipMatch = details.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/)
      const ip = ipMatch ? ipMatch[0] : null
      
      return { index: parsed.received.length - index, details, timestamp, ip }
    })
    
    parsed.hops = hops

    // Find Originating IP (from the oldest hop that has a public IP)
    let originatingIP = null
    // Reverse array to go from oldest to newest
    const reversedHops = [...hops].reverse()
    for (const hop of reversedHops) {
      const ip = extractIP(hop.details)
      if (ip) {
        originatingIP = ip
        break
      }
    }
    
    parsed.originatingIP = originatingIP

    setResults(parsed)

    // Fetch GeoLocation
    if (originatingIP) {
      try {
        const res = await fetch(`http://ip-api.com/json/${originatingIP}`)
        const data = await res.json()
        if (data.status === 'success') {
          setGeoData(data)
        }
      } catch (err) {
        console.error('Geo IP fetch error', err)
      }
    }

    setAnalyzing(false)
  }

  const ResultBadge = ({ label, result, expected }) => {
    const isPass = result === expected
    const isSoftFail = result === 'softfail'
    const isUnknown = result === 'Unknown' || result === 'none'
    
    let colorClass = 'badge-none'
    if (isPass) colorClass = 'badge-low'
    else if (isSoftFail) colorClass = 'badge-medium'
    else if (!isUnknown) colorClass = 'badge-critical'

    let Icon = FiAlertTriangle
    if (isPass) Icon = FiCheckCircle
    else if (!isUnknown && !isSoftFail) Icon = FiXCircle

    return (
      <div className={`badge ${colorClass} text-xs px-3 py-1.5`}>
        <Icon size={12} />
        {label}: {result.toUpperCase()}
      </div>
    )
  }

  return (
    <div className="page-container animate-fadeIn">
      <div className="mb-5 sm:mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
            <FiMail className="text-cyber-cyan" />
            Email Header Analyzer
          </h1>
          <p className="text-cyber-muted mt-1 text-xs sm:text-sm">
            Paste raw email headers to analyze SPF, DKIM, DMARC, spoofing risks, and routing hops.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="glass p-5 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3">
              <FiServer className="text-cyber-cyan" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Raw Headers</h2>
            </div>
            <textarea
              className="cyber-input flex-1 min-h-[300px] resize-y text-xs"
              placeholder="Paste raw email headers here (Received, Authentication-Results, From, Return-Path...)"
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            />
            <button
              className="btn-primary w-full mt-4 py-3 rounded-lg flex items-center justify-center gap-2"
              onClick={parseHeaders}
              disabled={analyzing || !headers.trim()}
            >
              {analyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FiShield /> Analyze Headers
                </>
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {results ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              
              {/* Security Results */}
              <div className="glass p-5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-cyber-border/50 pb-2">
                  Authentication Checks
                </h3>
                
                <div className="flex flex-wrap gap-3 mb-5">
                  <ResultBadge label="SPF" result={results.spf.result} expected="pass" />
                  <ResultBadge label="DKIM" result={results.dkim.result} expected="pass" />
                  <ResultBadge label="DMARC" result={results.dmarc.result} expected="pass" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-black/20 border border-cyber-border/40">
                    <p className="text-[10px] text-cyber-muted uppercase font-bold mb-1">From Domain</p>
                    <p className="text-sm font-mono text-white truncate" title={results.from}>
                      {extractDomain(results.from) || 'Unknown'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-black/20 border border-cyber-border/40">
                    <p className="text-[10px] text-cyber-muted uppercase font-bold mb-1">Return-Path Domain</p>
                    <p className="text-sm font-mono text-white truncate" title={results.returnPath}>
                      {extractDomain(results.returnPath) || 'Unknown'}
                    </p>
                  </div>
                </div>

                {results.spoofingRisk && (
                  <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                    <FiAlertTriangle className="text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-red-400">High Spoofing Risk Detected</p>
                      <p className="text-xs text-red-300/80 mt-1">
                        The domain in the "From" address does not match the "Return-Path" domain. This is a common indicator of email spoofing.
                      </p>
                    </div>
                  </div>
                )}
                {results.dkim.domain && (
                  <p className="text-xs text-cyber-muted mt-4">
                    <span className="font-semibold text-cyber-text">DKIM Signed By:</span> {results.dkim.domain}
                  </p>
                )}
              </div>

              {/* Originating IP */}
              <div className="glass p-5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-cyber-border/50 pb-2">
                  Originating Sender
                </h3>
                {results.originatingIP ? (
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center flex-shrink-0">
                        <FiGlobe className="text-cyber-cyan text-xl" />
                      </div>
                      <div>
                        <p className="text-xs text-cyber-muted font-bold uppercase mb-0.5">Originating IP</p>
                        <p className="text-base sm:text-lg font-mono text-white">{results.originatingIP}</p>
                      </div>
                    </div>

                    {geoData && (
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-cyber-muted font-bold uppercase mb-0.5">Location</p>
                          <p className="text-sm text-cyber-text">{geoData.city}, {geoData.country}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-cyber-muted font-bold uppercase mb-0.5">ISP / Org</p>
                          <p className="text-sm text-cyber-text truncate" title={geoData.isp}>{geoData.isp}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-cyber-muted">No public originating IP found in headers.</p>
                )}
              </div>

              {/* Hops Timeline */}
              <div className="glass p-5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-cyber-border/50 pb-2">
                  Hop-by-Hop Trace
                </h3>
                <div className="space-y-4">
                  {results.hops.length > 0 ? (
                    results.hops.map((hop, i) => (
                      <div key={i} className="relative pl-6 pb-2 border-l border-cyber-border/60 last:border-0 last:pb-0">
                        <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-cyber-cyan border-2 border-[#070B14]" />
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                          <span className="text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                            Hop {hop.index}
                          </span>
                          <span className="text-xs text-cyber-muted flex items-center gap-1">
                            <FiClock size={10} /> {hop.timestamp}
                          </span>
                        </div>
                        
                        <div className="text-xs text-cyber-text-dim break-all bg-black/20 p-2.5 rounded border border-cyber-border/30 mt-2 font-mono">
                          {hop.details}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-cyber-muted">No Received headers found.</p>
                  )}
                </div>
              </div>

            </motion.div>
          ) : (
            <div className="glass h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center opacity-60">
              <div className="w-16 h-16 rounded-full bg-cyber-border/30 flex items-center justify-center mb-4">
                <FiServer className="text-cyber-muted text-2xl" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Awaiting Headers</h3>
              <p className="text-sm text-cyber-muted max-w-sm">
                Paste the raw email headers into the input area and click Analyze to view authentication checks and routing hops.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
