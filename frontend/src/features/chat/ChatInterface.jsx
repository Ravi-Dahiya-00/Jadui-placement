'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User, Trash2, Sparkles, History, Plus } from 'lucide-react'
import { mentorAPI } from '@/services/api'
import { useApp, ACTIONS } from '@/context/AppContext'
import { cn } from '@/lib/utils'

export default function ChatInterface() {
  const { state, dispatch } = useApp()
  const topGaps = state.skillGaps || []
  const chatContext = state.chatContext || {}
  const quickPrompts = [
    'What should I focus on this week?',
    `How do I improve ${topGaps[0] || 'my top skill gap'}?`,
    'Give me a 7-day roadmap from my current profile',
    'How should I raise my interview score quickly?',
  ]
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const messagesEndRef = useRef(null)

  const messages = state.chatHistory
  const archivedCount = state.chatSessions?.length || 0
  const sessionLabel = state.activeChatSessionId
    ? `Session ${String(state.activeChatSessionId).split('-').pop()}`
    : 'Session'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const userMsg = { role: 'user', content: text, timestamp: new Date() }
    dispatch({ type: ACTIONS.ADD_MESSAGE, payload: userMsg })
    setInput('')
    setLoading(true)

    try {
      let reply
      try {
        const res = await mentorAPI.chat(text, messages)
        reply = res.message || res.response || res
      } catch {
        await new Promise((r) => setTimeout(r, 1200))
        const gapsText = topGaps.length ? topGaps.slice(0, 3).join(', ') : 'System Design, DSA, Communication'
        reply = `Based on your current data, your focus should be **${gapsText}**. Current baseline: resume ${chatContext.avgResumeScore || 0}% and interview ${chatContext.avgInterviewScore || 0}%. For this week: 1) daily focused practice on top gap, 2) one mock interview every 2 days, 3) update one project bullet with measurable impact.`
      }
      dispatch({
        type: ACTIONS.ADD_MESSAGE,
        payload: { role: 'assistant', content: reply, timestamp: new Date() },
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    sendMessage(input.trim())
  }

  const clearChat = () => dispatch({ type: ACTIONS.CLEAR_CHAT })
  const openSession = (sessionId) => dispatch({ type: ACTIONS.OPEN_CHAT_SESSION, payload: sessionId })
  const startNewSession = () => dispatch({ type: ACTIONS.START_NEW_CHAT_SESSION })

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  // Simple markdown → JSX: bold **text**
  const renderContent = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) =>
      part.startsWith('**') ? (
        <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{part}</span>
      )
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] max-w-3xl mx-auto">
      {/* Chat header */}
      <div className="bg-card border border-border rounded-t-2xl px-5 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center">
            <Bot className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">AI Career Mentor</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <p className="text-xs text-muted">Online · Context-aware</p>
            </div>
            <p className="text-[11px] text-muted/70 mt-0.5">{sessionLabel} · {archivedCount} archived</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="text-muted hover:text-error transition-colors p-2 rounded-lg hover:bg-red-500/10"
            title="Clear chat">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-card/50 border-x border-border px-4 py-6 space-y-4">
        {state.chatSessions?.length > 0 && (
          <div className="rounded-xl border border-border bg-surface/40 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted flex items-center gap-1"><History className="w-3.5 h-3.5" /> Previous sessions</p>
              <button onClick={startNewSession} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> New
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {state.chatSessions.slice(0, 6).map((s) => (
                <button
                  key={s.id}
                  onClick={() => openSession(s.id)}
                  className="text-xs rounded-full border border-border px-3 py-1 text-muted hover:text-white hover:border-primary/40"
                >
                  {String(s.id).slice(-6)}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
            <div className="w-16 h-16 rounded-2xl bg-secondary/15 border border-secondary/25 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-secondary" />
            </div>
            <div>
              <p className="text-white font-semibold mb-1">Your AI Career Mentor</p>
              <p className="text-muted text-sm max-w-xs">
                I know your resume, skill gaps, and progress. Ask me anything about your placement journey.
              </p>
            </div>
            {/* Quick prompts */}
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {quickPrompts.map((q) => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="text-xs bg-surface border border-border text-muted hover:text-white hover:border-primary/40 px-3 py-2 rounded-lg transition-all duration-200">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
            {/* Avatar */}
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
              msg.role === 'user' ? 'bg-primary/20 border border-primary/30' : 'bg-secondary/20 border border-secondary/30'
            )}>
              {msg.role === 'user'
                ? <User className="w-4 h-4 text-primary" />
                : <Bot className="w-4 h-4 text-secondary" />}
            </div>

            {/* Bubble */}
            <div className={cn('max-w-[75%] space-y-1', msg.role === 'user' ? 'items-end' : 'items-start')}>
              <div className={cn(
                'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-tr-sm'
                  : 'bg-card border border-border text-muted rounded-tl-sm'
              )}>
                {renderContent(msg.content)}
              </div>
              <p className="text-xs text-muted/50 px-1">{formatTime(msg.timestamp)}</p>
            </div>
          </div>
        ))}

        {/* Loading bubble */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-secondary" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="bg-card border border-border border-t-0 rounded-b-2xl p-4 flex-shrink-0">
        <div className="flex items-end gap-3">
          <textarea
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e) } }}
            placeholder="Ask your AI mentor anything... (Shift+Enter for new line)"
            rows={1}
            className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted/50
                       focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none
                       transition-all duration-200 max-h-32"
            style={{ minHeight: '48px' }}
          />
          <button id="chat-send-btn" type="submit" disabled={!input.trim() || loading}
            className="btn-primary p-3 rounded-xl flex-shrink-0 disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        {messages.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {quickPrompts.slice(0, 2).map((q) => (
              <button key={q} type="button" onClick={() => sendMessage(q)}
                className="text-xs text-muted hover:text-primary transition-colors truncate max-w-[200px]">
                ↑ {q}
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  )
}
