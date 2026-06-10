import { motion } from 'framer-motion'

/**
 * GlassCard — premium glass surface with optional accent bar, header icon, and action slot.
 * Props:
 *   title   — card title (shown uppercase in header)
 *   subtitle — small subtitle text below title
 *   icon    — Feather icon component for header
 *   action  — JSX rendered at the right of the header
 *   accent  — 'cyan' | 'purple' | 'green' | 'red' | 'amber' | 'blue'
 *   delay   — framer-motion entrance delay
 *   noPad   — skip default content padding (for charts etc that manage their own spacing)
 */
export default function GlassCard({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className = '',
  delay = 0,
  id,
  accent,
  noPad = false,
}) {
  const accentMap = {
    cyan:   'from-[#00C2FF] to-[#3B82F6]',
    blue:   'from-[#3B82F6] to-[#6366F1]',
    purple: 'from-[#A855F7] to-[#EC4899]',
    green:  'from-[#10B981] to-[#34D399]',
    red:    'from-[#EF4444] to-[#F97316]',
    amber:  'from-[#F59E0B] to-[#F97316]',
  }
  const accentGrad = accent ? (accentMap[accent] || accentMap.cyan) : null
  const hasHeader = !!(title || action)

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay, ease: [0.4, 0, 0.2, 1] }}
      className={`glass relative overflow-hidden ${className}`}
    >
      {/* Accent top bar */}
      {accentGrad && (
        <div
          className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${accentGrad} pointer-events-none`}
        />
      )}

      {/* Header */}
      {hasHeader && (
        <div className="flex items-center justify-between px-5 pt-5 pb-0 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <Icon size={13} style={{ color: '#94A3B8' }} />
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3
                  className="truncate"
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.09em',
                    textTransform: 'uppercase',
                    color: '#4A5E80',
                  }}
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p style={{ fontSize: '10px', color: 'rgba(74,94,128,0.65)', marginTop: 2 }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className="flex-shrink-0 ml-3">{action}</div>}
        </div>
      )}

      {/* Content */}
      <div className={`flex-1 flex flex-col min-h-0 ${noPad ? '' : `px-5 pb-5 ${!hasHeader ? 'pt-5' : ''}`}`}>
        {children}
      </div>
    </motion.div>
  )
}
