import { useState, useRef, useEffect } from 'react'
import GlassCard from '../components/ui/GlassCard'
import CyberGlobe from '../components/scan/CyberGlobe'
import { FiGlobe, FiZap, FiLayers } from 'react-icons/fi'

const CITIES = [
  { name:'New York',    lat:40.71, lon:-74.00, country:'US' },  { name:'London',     lat:51.50, lon:-0.12,  country:'GB' },
  { name:'Moscow',      lat:55.75, lon:37.61,  country:'RU' },  { name:'Beijing',    lat:39.90, lon:116.40, country:'CN' },
  { name:'Tokyo',       lat:35.67, lon:139.65, country:'JP' },  { name:'Sydney',     lat:-33.86,lon:151.20, country:'AU' },
  { name:'Dubai',       lat:25.20, lon:55.27,  country:'AE' },  { name:'São Paulo',  lat:-23.55,lon:-46.63, country:'BR' },
  { name:'Mumbai',      lat:19.07, lon:72.87,  country:'IN' },  { name:'Lagos',      lat:6.52,  lon:3.37,   country:'NG' },
  { name:'Chicago',     lat:41.87, lon:-87.62, country:'US' },  { name:'Toronto',    lat:43.65, lon:-79.38, country:'CA' },
  { name:'Paris',       lat:48.85, lon:2.35,   country:'FR' },  { name:'Berlin',     lat:52.52, lon:13.40,  country:'DE' },
  { name:'Singapore',   lat:1.35,  lon:103.81, country:'SG' },
]

const COLORS = { critical:'#FF2D55', high:'#FF6B35', medium:'#FFD600', low:'#00FF88' }
const RISKS   = ['critical','high','medium','low']

function randInt(a,b){ return Math.floor(Math.random()*(b-a))+a }

export default function AttackMap() {
  const [attacks,  setAttacks]  = useState([])
  const [logs,     setLogs]     = useState([])
  const [autoPlay, setAutoPlay] = useState(true)
  const [is3DView, setIs3D]     = useState(true)
  const idRef = useRef(0)

  useEffect(()=>{
    if(!autoPlay) return
    const iv = setInterval(()=>{
      const src  = CITIES[randInt(0,CITIES.length)]
      const dst  = CITIES[randInt(0,CITIES.length)]
      if(src.name === dst.name) return
      const risk = RISKS[randInt(0,RISKS.length)]
      const id   = ++idRef.current
      setAttacks(prev => [...prev.slice(-25), { id, src, dst, risk, created: Date.now() }])
      setLogs(prev => [{
        id, type: risk==='critical'?'error': risk==='high'?'warning':'info',
        msg: `Attack arc: ${src.name} → ${dst.name} [${risk.toUpperCase()}]`,
      }, ...prev.slice(0,49)])
    }, 1500)
    return ()=>clearInterval(iv)
  },[autoPlay])

  const stats = { critical:0, high:0, medium:0, low:0 }
  attacks.forEach(a => stats[a.risk]++)

  return (
    <div className="page-container space-y-5">
      {/* Persistent Neon Banner */}
      <div 
        className="glass border border-cyber-cyan/30 px-4 py-3 rounded-xl flex items-center justify-between shadow-neon-cyan/10"
        style={{ background: 'rgba(0,212,255,0.05)' }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyber-cyan animate-pulse-slow shadow-neon-cyan" />
          <p className="text-xs font-bold text-cyber-cyan tracking-wider uppercase">SIMULATION MODE ACTIVE — GLOBAL THREAT ARC SIMULATOR</p>
        </div>
        <p className="text-[10px] text-cyber-muted font-mono hidden md:block">Deterministic pattern visualization</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-white">Simulated Attack <span className="gradient-text">Map</span></h1>
          <p className="text-xs text-cyber-muted mt-1 font-mono">Simulated global cyber threat visualization</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {Object.entries(stats).map(([r,n])=>(
            <div key={r} className="text-center min-w-[36px]">
              <p className="text-base sm:text-lg font-black" style={{color:COLORS[r]}}>{n}</p>
              <p className="text-[9px] sm:text-[10px] text-cyber-muted uppercase tracking-widest hidden xs:block sm:block">{r}</p>
            </div>
          ))}
          <div className="w-px h-7 bg-cyber-border/50 mx-1 hidden sm:block" />
          <button onClick={()=>setIs3D(!is3DView)} className={`btn-cyber ${is3DView?'btn-success':''}`}>
            {is3DView ? <FiGlobe size={14}/> : <FiLayers size={14}/>} {is3DView ? '3D' : '2D'}
          </button>
          <button onClick={()=>setAutoPlay(p=>!p)} className={`btn-cyber ${autoPlay?'':'btn-danger'}`}>
            <FiZap size={12}/> {autoPlay ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:grid xl:grid-cols-4 gap-4 xl:h-[calc(100vh-120px)] xl:min-h-[600px]">
        {/* Globe Container */}
        <GlassCard noPad={true} className="xl:col-span-3 overflow-hidden relative flex flex-col h-[380px] md:h-[480px] xl:h-full" delay={0.05}>
          <div className="flex-1 relative min-h-0 w-full" style={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
            <CyberGlobe attacks={attacks} is3DView={is3DView} autoRotate={autoPlay} />
            
            {/* Absolute Legend inside Globe View */}
            <div className="absolute top-4 right-4 glass px-4 py-3 rounded-lg border border-cyber-border/50 bg-black/40 backdrop-blur-md">
              <p className="text-[10px] uppercase text-cyber-muted tracking-widest font-bold mb-2">Threat Legend</p>
              <div className="space-y-2">
                {Object.entries(COLORS).map(([r,c])=>(
                  <div key={r} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{background:c, boxShadow:`0 0 8px ${c}`}}/>
                    <span className="text-xs text-cyber-text font-mono uppercase">{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between px-4 py-2 border-t border-cyber-border/50 bg-[#050810]/80">
            <div className="flex items-center gap-4 text-xs text-cyber-muted font-mono">
              <span>Nodes: {CITIES.length}</span>
              <span>Active Arcs: {attacks.length}</span>
              <span className="text-cyber-green font-semibold hidden sm:inline">Globe: Three.js</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-cyber-muted">
              <span className="status-dot dot-online animate-pulse-slow" style={{ backgroundColor: '#00d4ff', boxShadow: '0 0 8px #00d4ff' }}/>
              <span className="font-mono">SIMULATION</span>
            </div>
          </div>
        </GlassCard>

        {/* Attack Log */}
        <GlassCard noPad={true} title="Attack Feed" className="overflow-hidden relative flex flex-col h-[250px] md:h-[300px] xl:h-full" delay={0.1}>
          <div className="flex-1 overflow-y-auto terminal p-3" style={{borderRadius:0}}>
            {logs.map((l)=>(
              <div key={l.id} className="flex gap-2 text-xs leading-relaxed border-b border-cyber-border/20 pb-1 mb-1">
                <span className={l.type==='error'?'error':l.type==='warning'?'warning':'info'}>
                  {l.msg}
                </span>
              </div>
            ))}
            {logs.length===0 && <p className="info">Waiting for attack events...</p>}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
