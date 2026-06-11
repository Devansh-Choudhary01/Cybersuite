import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LINES = [
  { delay: 0,    text: '> Initializing CyberSuite scanner engine...' },
  { delay: 400,  text: '> Loading exploit signatures database...' },
  { delay: 800,  text: '> Establishing secure connection...' },
  { delay: 1200, text: '> Target resolved. Launching scan modules...' },
]

export default function ScanTerminal({ isScanning, target, scanLines = [] }) {
  const [visibleLines, setVisibleLines] = useState([])
  const [cursor, setCursor] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    const iv = setInterval(() => setCursor(c => !c), 500)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    if (!isScanning) {
      setVisibleLines([])
      return
    }
    setVisibleLines([])
    LINES.forEach(({ delay, text }) => {
      setTimeout(() => setVisibleLines(prev => [...prev, { id: `init-${delay}`, text, type: 'prompt' }]), delay)
    })
    if (target) {
      setTimeout(() => {
        setVisibleLines(prev => [...prev, { id: 'target', text: `> Target: ${target}`, type: 'info' }])
      }, 1600)
    }
  }, [isScanning, target])

  useEffect(() => {
    if (scanLines.length === 0) return
    scanLines.forEach((line, i) => {
      setTimeout(() => {
        setVisibleLines(prev => [...prev, { id: `scan-${i}-${Date.now()}`, ...line }])
      }, i * 80)
    })
  }, [scanLines])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [visibleLines])

  const typeClass = {
    prompt:  'prompt',
    success: 'success',
    error:   'error',
    warning: 'warning',
    info:    'info',
  }

  return (
    <div className="terminal" style={{ maxHeight: 300 }}>
      {!isScanning && visibleLines.length === 0 && (
        <p className="info">{'> Awaiting target input...'}</p>
      )}
      <AnimatePresence initial={false}>
        {visibleLines.map((line) => (
          <motion.p
            key={line.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className={typeClass[line.type] || 'info'}
          >
            {line.text}
          </motion.p>
        ))}
      </AnimatePresence>
      {isScanning && (
        <span className="prompt">
          {'> '}<span style={{ borderRight: cursor ? '2px solid #00D4FF' : '2px solid transparent' }}>&nbsp;</span>
        </span>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
