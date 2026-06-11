import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import GlassCard from '../components/ui/GlassCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { FiSend, FiMessageSquare, FiCpu, FiUser, FiMessageCircle } from 'react-icons/fi'

const WELCOME = {
  role: 'assistant',
  content: "Welcome to **CyberSuite AI**!\n\nI'm your cybersecurity assistant. Ask me about:\n- SQL Injection, XSS, CSRF vulnerabilities\n- Port scanning and network recon\n- Password security and SSL/TLS\n- How to interpret scan results\n\n**Try:** *\"What is SQL injection?\"*",
}

const SUGGESTIONS = [
  'What is SQL Injection?',
  'How does XSS work?',
  'Explain port scanning',
  'How to fix missing security headers?',
  'What is subdomain takeover?',
  'How do I secure passwords?',
]

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
        isUser ? 'bg-cyber-blue/30 text-cyber-cyan' : 'bg-cyber-purple/20 text-cyber-purple'
      }`}>
        {isUser ? <FiUser size={14} /> : <FiCpu size={14} />}
      </div>
      <div className={`w-full px-4 py-3 rounded-xl text-sm leading-relaxed ${
        isUser
          ? 'bg-cyber-blue/20 border border-cyber-blue/30 text-cyber-text'
          : 'glass border border-cyber-border text-cyber-text'
      }`}>
        <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{
          __html: msg.content
            .replace(/```([\s\S]*?)```/g, '<div class="font-mono text-cyber-green bg-[#050810]/50 p-3 rounded-lg my-2 text-xs border border-cyber-border/30 overflow-x-auto">$1</div>')
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-cyber-cyan">$1</strong>')
            .replace(/`(.*?)`/g, '<code class="font-mono text-cyber-green bg-black/30 px-1 rounded">$1</code>')
            .replace(/\*(.*?)\*/g, '<em class="text-cyber-muted">$1</em>')
        }} />
        {msg.topic && (
          <p className="mt-2 text-[10px] text-cyber-muted font-mono border-t border-cyber-border pt-1.5">
            Topic: {msg.topic}
            {msg.suggested_tools?.length > 0 && ` · Try: ${msg.suggested_tools.join(', ')}`}
          </p>
        )}
      </div>
    </motion.div>
  )
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [model, setModel]       = useState('llama-3.3-70b-versatile')
  
  // Token counter states
  const [promptTokens, setPromptTokens] = useState(0)
  const [responseTokens, setResponseTokens] = useState(0)
  const [sessionTokens, setSessionTokens] = useState(0)
  const [allTimeTokens, setAllTimeTokens] = useState(() => {
    return parseInt(localStorage.getItem('all_time_tokens') || '0', 10)
  })

  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    
    // Build user message
    const userMsg = { role: 'user', content: msg }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      // Map all previous user/assistant messages to correct API format
      const history = updatedMessages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }))

      const res = await api.post('/api/ai/chat', {
        messages: history,
        model: model,
      })

      // Add assistant response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.message,
      }])

      // Update tokens
      const tokens = res.data.tokens
      if (tokens) {
        setPromptTokens(tokens.prompt_tokens)
        setResponseTokens(tokens.completion_tokens)
        setSessionTokens(prev => prev + tokens.total_tokens)
        setAllTimeTokens(prev => {
          const updated = prev + tokens.total_tokens
          localStorage.setItem('all_time_tokens', updated.toString())
          return updated
        })
      }
    } catch (err) {
      toast.error('AI assistant unavailable')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Unable to reach the AI backend. Make sure the Groq API key is set and the FastAPI server is running.',
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">AI <span className="gradient-text">Assistant</span></h1>
        <p className="text-xs text-cyber-muted mt-1 font-mono">Cybersecurity knowledge engine — powered by Groq</p>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 lg:h-[calc(100vh-220px)] lg:min-h-[500px]">
        {/* Suggestions Sidebar — row on mobile, col on lg+ */}
        <GlassCard title="Quick Questions" className="lg:col-span-1 overflow-y-auto max-h-[180px] sm:max-h-[200px] lg:max-h-none" delay={0.05}>
          <div className="flex flex-row flex-wrap gap-2 lg:flex-col lg:space-y-2">
            {SUGGESTIONS.map(s => (
                <button
                key={s}
                onClick={() => send(s)}
                className="text-left text-xs px-3 py-2 sm:py-2.5 rounded-lg text-cyber-muted hover:text-cyber-cyan hover:bg-cyan-500/5 border border-transparent hover:border-cyan-500/20 transition-all leading-snug w-full"
              >
                <FiMessageCircle className="inline mr-1" /> {s}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Chat Window */}
        <div className="lg:col-span-3 glass flex flex-col overflow-hidden min-h-[420px] sm:min-h-[480px] lg:h-full">
          <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-cyber-border/50 flex-shrink-0 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <FiMessageSquare size={14} className="text-cyber-purple" />
              <span className="text-xs font-bold uppercase tracking-widest text-cyber-muted font-mono">CyberSuite AI</span>
            </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Model selector — scrollable row on xs/sm */}
                <div className="flex gap-1.5 flex-wrap">
                  <button onClick={() => setModel('llama-3.3-70b-versatile')} className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-mono border transition-all ${model === 'llama-3.3-70b-versatile' ? 'bg-cyber-purple/10 border-cyber-purple/30 text-cyber-purple' : 'bg-white/[0.04] border-white/[0.08] text-white/50'}`}>
                    <span className="hidden sm:inline">llama-3.3-70b</span>
                    <span className="sm:hidden">70b</span>
                  </button>
                  <button onClick={() => setModel('llama-3.1-8b-instant')} className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-mono border transition-all ${model === 'llama-3.1-8b-instant' ? 'bg-cyber-purple/10 border-cyber-purple/30 text-cyber-purple' : 'bg-white/[0.04] border-white/[0.08] text-white/50'}`}>
                    <span className="hidden sm:inline">llama-3.1-8b</span>
                    <span className="sm:hidden">8b</span>
                  </button>
                  <button onClick={() => setModel('mixtral-8x7b-32768')} className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-mono border transition-all ${model === 'mixtral-8x7b-32768' ? 'bg-cyber-purple/10 border-cyber-purple/30 text-cyber-purple' : 'bg-white/[0.04] border-white/[0.08] text-white/50'}`}>
                    <span className="hidden sm:inline">mixtral-8x7b</span>
                    <span className="sm:hidden">mx</span>
                  </button>
                </div>
                <span className="status-dot dot-online animate-pulse-slow" />
              </div>
          </div>

          {/* Token Counter Bar */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-black/40 border-b border-cyber-border/30 text-[10px] font-mono text-cyber-muted gap-2">
            <div className="flex gap-3 overflow-x-auto no-scrollbar" style={{ maxWidth: '60%' }}>
              <div><span>Prompt: </span><span className="text-cyber-cyan font-bold">{promptTokens}</span></div>
              <div><span>Response: </span><span className="text-cyber-purple font-bold">{responseTokens}</span></div>
              <div><span>Session Total: </span><span className="text-cyber-green font-bold">{sessionTokens}</span></div>
              <div><span>All-Time: </span><span className="text-amber-400 font-bold">{allTimeTokens}</span></div>
            </div>
            <div className="ml-auto text-xs text-cyber-muted hidden md:block">Tokens · scroll on small screens</div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((m, i) => <Message key={i} msg={m} />)}
            
            {/* Suggested Prompts when empty (only welcome message) */}
            {messages.length <= 1 && (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                <p className="text-[10px] text-cyber-muted font-mono uppercase tracking-widest">Suggested Prompts</p>
                <div className="flex flex-col sm:flex-row gap-2 max-w-lg w-full px-4 justify-center">
                  {[
                    "Explain SQL Injection",
                    "How to fix open port 22?",
                    "What is a DMARC record?"
                  ].map(promptText => (
                    <button
                      key={promptText}
                      onClick={() => send(promptText)}
                      className="px-4 py-2.5 rounded-lg text-xs font-mono text-cyber-muted hover:text-cyber-cyan bg-white/[0.02] border border-cyber-border/40 hover:border-cyber-cyan/30 hover:bg-cyan-500/5 transition-all text-center leading-snug"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-cyber-purple/20 flex items-center justify-center text-cyber-purple">
                  <FiCpu size={14} />
                </div>
                <div className="glass border border-cyber-border px-4 py-3 rounded-xl flex items-center gap-2">
                  <LoadingSpinner size={12} label={null} />
                  <span className="text-xs font-mono text-cyber-muted animate-pulse">⚡ Thinking...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 pb-4 pt-3 border-t border-cyber-border/50 flex gap-2 flex-shrink-0 mobile-sticky-input">
            <input
              className="cyber-input flex-1"
              placeholder="Ask about vulnerabilities, tools, techniques..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              id="ai-chat-input"
              disabled={loading}
              style={{ minHeight: 44 }}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()} className="btn-cyber px-4 flex-shrink-0 w-20" id="ai-send-btn"
              style={{ borderColor:'rgba(139,92,246,0.4)', color:'#8B5CF6' }}>
              <FiSend size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
