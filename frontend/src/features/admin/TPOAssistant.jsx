'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, X, Bot, Sparkles, BrainCircuit, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function TPOAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Good day, Sir. I am your Placement Readiness Bot. Use me to query batch health, find top talent, or identify skill gaps. How can I assist you today?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/api/admin/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg, history: messages.slice(-5) })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', text: data.response }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Apologies, Sir. The data link is unstable. Please try again." }])
    } finally {
      setLoading(false)
    }
  }

  const formatMessageText = (text) => {
    return text.split('\n').map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={idx}>
          {parts.map((p, pIdx) => {
            if (p.startsWith('**') && p.endsWith('**')) {
              return <strong key={pIdx} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{p.slice(2, -2)}</strong>;
            }
            return p;
          })}
          <br />
        </span>
      )
    });
  }

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-[100] transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]",
      isOpen 
        ? (isExpanded ? "w-[600px] h-[700px]" : "w-96 h-[500px]") 
        : "w-14 h-14"
    )}>
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-neutral-950 shadow-2xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <BrainCircuit className="w-6 h-6" />
        </button>
      ) : (
        <div className="flex flex-col h-full bg-neutral-900/90 backdrop-blur-2xl border border-neutral-800 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                   <Bot className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                   <h4 className="text-xs font-black uppercase text-white tracking-widest leading-none">TPO Assistant</h4>
                   <p className="text-[10px] text-emerald-500 font-bold mt-1 animate-pulse">Batch Analyzer Online</p>
                </div>
             </div>
             <div className="flex items-center gap-2">
                <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-neutral-500 hover:text-white">
                   {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-neutral-500 hover:text-white">
                   <X className="w-4 h-4" />
                </button>
             </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
             {messages.map((m, i) => (
               <div key={i} className={cn("flex flex-col", m.role === 'user' ? "items-end" : "items-start")}>
                  <div className={cn(
                    "max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed",
                    m.role === 'user' 
                      ? "bg-amber-500 text-neutral-950 rounded-tr-none shadow-lg shadow-amber-500/10" 
                      : "bg-neutral-800 text-neutral-200 rounded-tl-none border border-white/5"
                  )}>
                    <div className="space-y-1">{formatMessageText(m.text)}</div>
                  </div>
               </div>
             ))}
             {loading && (
               <div className="flex items-start gap-2">
                  <div className="bg-neutral-800 border border-white/5 p-4 rounded-2xl rounded-tl-none">
                     <div className="flex gap-1.5">
                        <div className="w-1 h-1 bg-amber-500 rounded-full animate-bounce" />
                        <div className="w-1 h-1 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1 h-1 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                     </div>
                  </div>
               </div>
             )}
          </div>

          {/* Quick Actions */}
          {!loading && messages.length < 5 && (
            <div className="px-6 py-2 flex flex-wrap gap-2">
               <button onClick={() => setInput('Find top performers')} className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-white/5 rounded-lg text-[10px] font-bold text-neutral-400 uppercase tracking-widest transition-colors mb-2">Find Top Talent</button>
               <button onClick={() => setInput('Summarize skill gaps')} className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-white/5 rounded-lg text-[10px] font-bold text-neutral-400 uppercase tracking-widest transition-colors mb-2">Analyze Gaps</button>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSend} className="p-5 border-t border-neutral-800 bg-neutral-950/50">
             <div className="relative flex items-center">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your students..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-5 pr-12 py-3.5 text-sm outline-none focus:border-amber-500/50 transition-all font-medium"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="absolute right-2 p-2 bg-amber-500 rounded-xl text-neutral-950 disabled:opacity-50 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20"
                >
                   <Send className="w-4 h-4" />
                </button>
             </div>
          </form>
        </div>
      )}
    </div>
  )
}
