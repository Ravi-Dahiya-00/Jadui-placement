'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, Play, Loader2, PhoneOff, User, Bot, Sparkles, ArrowRight, Volume2 } from 'lucide-react'
import RoleSelector  from '@/features/interview/RoleSelector'
import FeedbackPanel from '@/features/interview/FeedbackPanel'
import InterviewCard from '@/features/interview/InterviewCard'
import { cn } from '@/lib/utils'
import { useApp } from '@/context/AppContext'

const STAGES = { select: 'select', interview: 'interview', feedback: 'feedback' }

/** Default skills + labels so the backend (Gemini) gets enough context for sharp questions */
const ROLE_META = {
  sde:        { label: 'Software / Backend',       techstack: 'APIs, databases, distributed systems, observability' },
  frontend:   { label: 'Frontend / React',         techstack: 'React, TypeScript, performance, accessibility, state' },
  fullstack:  { label: 'Full Stack',               techstack: 'React, Node, APIs, SQL, deployment' },
  data:       { label: 'Data Science / ML',        techstack: 'Python, ML pipelines, experimentation, metrics' },
  networking: { label: 'System Design',          techstack: 'scaling, reliability, networking, distributed systems' },
  pm:         { label: 'Product Manager',        techstack: 'roadmaps, metrics, stakeholder management, discovery' },
}

export default function InterviewPage() {
  const { state } = useApp()
  const [stage,       setStage]     = useState(STAGES.select)
  const [role,        setRole]      = useState('')
  const [questions,   setQuestions] = useState([])
  const [interviewId, setInterviewId] = useState(null)
  const [feedback,    setFeedback]  = useState(null)
  const [loading,     setLoading]   = useState(false)
  const [startError,  setStartError] = useState('')
  const [browserSpeechSupported, setBrowserSpeechSupported] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  // Browser speech recognition state (free alternative to Vapi)
  const [callStatus, setCallStatus] = useState('INACTIVE') // INACTIVE, CONNECTING, ACTIVE, FINISHED
  const [messages, setMessages] = useState([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [speechEnabled, setSpeechEnabled] = useState(true)
  const transcriptRef = useRef(null)
  const recognitionRef = useRef(null)
  const shouldKeepListeningRef = useRef(false)

  const speakQuestion = useCallback((text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text?.trim()) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    u.rate = 0.92
    window.speechSynthesis.speak(u)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setBrowserSpeechSupported(Boolean(SpeechRecognition))
    setIsMounted(true)
    return () => {
      shouldKeepListeningRef.current = false
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  useEffect(() => {
    if (stage !== STAGES.interview || !questions.length || !speechEnabled) return
    if (currentQuestionIndex < 0 || currentQuestionIndex >= questions.length) return
    speakQuestion(questions[currentQuestionIndex])
  }, [stage, questions, currentQuestionIndex, speechEnabled, speakQuestion])

  // Scroll to bottom of transcript automatically
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [messages])

  const handleStart = async () => {
    if (!role) return
    setStartError('')
    setStage(STAGES.interview)
    setLoading(true)
    setCallStatus('CONNECTING')

    try {
      const meta = ROLE_META[role] || { label: role, techstack: '' }
      let generatedQuestions = []
      try {
        const response = await fetch('/api/interview/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role,
            type: 'mixed',
            level: 'mid-level',
            techstack: meta.techstack,
            amount: 5,
            userid: state.user?.id || 'demo-user'
          })
        })
        const data = await response.json()
        generatedQuestions = data.questions || []
        if (data.interviewId) setInterviewId(data.interviewId)
      } catch (err) {
        console.warn('Backend generation failed, using fallback questions', err)
        generatedQuestions = [
          `For a ${meta.label} role: describe a production issue you owned end-to-end — detection, mitigation, and what you changed to prevent recurrence.`,
          `How do you balance delivery speed with quality for ${meta.techstack || 'your stack'}? Give a concrete example with trade-offs.`,
        ]
      }

      if (!generatedQuestions.length) {
        generatedQuestions = [
          `Walk through a challenging project relevant to ${meta.label}. Focus on constraints, decisions, and measurable outcomes.`,
        ]
      }

      setQuestions(generatedQuestions)
      setCurrentQuestionIndex(0)
      const total = generatedQuestions.length
      const first = generatedQuestions[0]
      setMessages([
        {
          role: 'bot',
          content: `Question 1 of ${total}: ${first}`,
        },
      ])

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        throw new Error('Browser Speech Recognition is not supported in this browser. Use latest Chrome or Edge.')
      }

      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = false
      recognition.lang = 'en-US'
      shouldKeepListeningRef.current = true

      recognition.onstart = () => {
        setCallStatus('ACTIVE')
        setLoading(false)
      }
      recognition.onresult = (event) => {
        const text = event.results[event.resultIndex]?.[0]?.transcript?.trim()
        if (text) {
          setMessages((prev) => [...prev, { role: 'user', content: text }])
        }
      }
      recognition.onspeechstart = () => setIsSpeaking(true)
      recognition.onspeechend = () => setIsSpeaking(false)
      recognition.onerror = (event) => {
        if (event?.error === 'no-speech') return
        console.error('Speech recognition error:', event)
        setStartError('Microphone error while listening. Please check mic permission and try again.')
      }
      recognition.onend = () => {
        if (shouldKeepListeningRef.current) {
          try {
            recognition.start()
          } catch {
            // Ignore duplicate start races.
          }
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.error('Failed to start interview:', err)
      setStartError(err?.message || 'Failed to start voice interview. Please try again.')
      setLoading(false)
      setStage(STAGES.select)
    }
  }

  const goNextQuestion = () => {
    if (currentQuestionIndex >= questions.length - 1) return
    const next = currentQuestionIndex + 1
    setCurrentQuestionIndex(next)
    setMessages((prev) => [
      ...prev,
      {
        role: 'bot',
        content: `Question ${next + 1} of ${questions.length}: ${questions[next]}`,
      },
    ])
  }

  const replayQuestion = () => {
    if (!questions.length || currentQuestionIndex >= questions.length) return
    speakQuestion(questions[currentQuestionIndex])
  }

  const handleDisconnect = async () => {
    shouldKeepListeningRef.current = false
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setCallStatus('FINISHED')
    setLoading(true)

    if (!interviewId) {
      setFeedback({
        score: 0,
        summary: 'Interview session ID missing. Please restart interview and try again.',
        strengths: [],
        improvements: ['Start a fresh session to enable database-backed feedback.'],
        answers: []
      });
      setStage(STAGES.feedback);
      setLoading(false);
      return;
    }

    // Send messages to backend to generate actual AI feedback scorecard
    try {
      const response = await fetch('/api/interview/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: interviewId,
          userId: state.user?.id || 'demo-user',
          transcript: messages
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate grading.');
      }

      setFeedback(data.feedback);
      setStage(STAGES.feedback);
    } catch (err) {
      console.error('Feedback retrieval error:', err);
      // Fallback if there was a server parsing error
      setFeedback({
         score: 40,
         summary: 'The session failed to grade correctly due to an internal server error or lack of transcript data.',
         strengths: ['Attempted to connect'],
         improvements: ['Speak clearer and try again'],
         answers: []
      });
      setStage(STAGES.feedback);
    } finally {
      setLoading(false)
    }
  }

  const handleRestart = () => {
    shouldKeepListeningRef.current = false
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setStage(STAGES.select)
    setRole('')
    setQuestions([])
    setInterviewId(null)
    setMessages([])
    setCurrentQuestionIndex(0)
    setFeedback(null)
    setCallStatus('INACTIVE')
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }

  return (
    <div className={`max-w-4xl mx-auto space-y-8 transition-opacity duration-700 ${isMounted ? 'opacity-100' : 'opacity-0'} relative`}>
      {/* Background Orbs */}
      <div className="absolute top-[-100px] left-[-100px] w-80 h-80 bg-accent/10 blur-[100px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-[100px] right-[-100px] w-64 h-64 bg-primary/10 blur-[80px] rounded-full -z-10" />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/30">
            <Mic className="w-6 h-6 text-accent" />
          </div>
          Live Mock Interview
        </h1>
        <p className="text-muted text-sm mt-3 font-medium opacity-80 italic">
          High-fidelity browser speech recognition powered by Jadui Agentic Intelligence.
        </p>
        {startError ? (
          <p className="text-error text-sm mt-2">{startError}</p>
        ) : null}
        {!browserSpeechSupported ? (
          <p className="text-warning text-xs mt-1">
            Voice capture needs Web Speech API support (recommended: latest Chrome/Edge).
          </p>
        ) : null}
      </div>

      {/* Stage: Role selection */}
      {stage === STAGES.select && (
        <div className="space-y-6">
          <RoleSelector selected={role} onSelect={setRole} />
          <button
            id="start-interview-btn"
            onClick={handleStart}
            disabled={!role || loading}
            className="btn-primary w-full py-4 justify-center text-base disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            {loading ? 'Initializing Browser Speech...' : 'Start Voice Interview'}
          </button>

          {/* Past Interviews History Ported from PulseAI */}
          <div className="pt-10">
            <h2 className="text-xl font-bold text-white mb-6">Recent Sessions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InterviewCard 
                id="iv-1" 
                role="Frontend Developer" 
                type="Technical" 
                score={85} 
                date={new Date('2026-04-05').getTime()} 
                summary="Excellent understanding of React lifecycle and hooks, but struggled slightly when profiling paint performance." 
              />
              <InterviewCard 
                id="iv-2" 
                role="Full Stack Engineer" 
                type="Behavioral" 
                score={92} 
                date={new Date('2026-04-01').getTime()} 
                summary="Very strong communication. Outstanding implementation of the STAR method across all behavioral prompts." 
              />
            </div>
          </div>
        </div>
      )}

      {/* Stage: Interview Active */}
      {stage === STAGES.interview && (
        <div className="space-y-6 animate-slide-up">
          {questions.length > 0 && (
            <div className="glass border border-accent/30 rounded-2xl p-6 shadow-glow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-[300px]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-2">
                    In Progress: Question {currentQuestionIndex + 1} of {questions.length}
                  </p>
                  <p className="text-white text-lg font-bold leading-tight tracking-tight">
                    {questions[currentQuestionIndex]}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted cursor-pointer hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={speechEnabled}
                      onChange={(e) => setSpeechEnabled(e.target.checked)}
                      className="rounded border-border bg-transparent text-primary"
                    />
                    TTS Audio
                  </label>
                  <button
                    type="button"
                    onClick={replayQuestion}
                    className="btn-outline px-3 py-1.5 text-[10px]"
                  >
                    <Volume2 className="w-3 h-3" />
                    Replay
                  </button>
                  <button
                    type="button"
                    onClick={goNextQuestion}
                    disabled={currentQuestionIndex >= questions.length - 1}
                    className="btn-primary px-3 py-1.5 text-[10px] disabled:opacity-40"
                  >
                    Next Prompt
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Call UI */}
            <div className="glass border border-border rounded-2xl flex flex-col overflow-hidden shadow-glow-sm relative">
              <div className="p-10 flex flex-col items-center justify-center flex-1 space-y-8 bg-surface/30">
                {/* Agent Bubble */}
                <div className="relative">
                  <div className={cn(
                    "w-36 h-36 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-accent/20 to-primary/20 border-2 transition-all duration-500",
                    isSpeaking ? "border-accent shadow-[0_0_60px_rgba(6,182,212,0.5)] scale-105" : "border-white/10"
                  )}>
                    <Bot className="w-16 h-16 text-white" />
                  </div>
                  {callStatus === 'CONNECTING' && (
                    <span className="absolute top-0 right-0 w-10 h-10 flex items-center justify-center bg-surface border border-border rounded-xl shadow-2xl">
                      <Loader2 className="w-5 h-5 text-accent animate-spin" />
                    </span>
                  )}
                  {callStatus === 'ACTIVE' && isSpeaking && (
                     <span className="absolute -inset-6 rounded-3xl border border-accent/20 animate-ping" />
                  )}
                </div>
                
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-white tracking-tight">Jadui AI Coach</h3>
                  <p className={cn("text-xs font-bold uppercase tracking-widest", callStatus === 'ACTIVE' ? "text-success" : "text-warning animate-pulse")}>
                    {callStatus === 'CONNECTING' ? 'Initializing Stream...' : 'Live Monitoring Active'}
                  </p>
                </div>
              </div>

              {/* Call Controls */}
              <div className="p-6 bg-surface/60 border-t border-border flex justify-center">
                 {callStatus === 'ACTIVE' && (
                   <button onClick={handleDisconnect} className="bg-error/10 hover:bg-error text-error hover:text-white border border-error/30 px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all group flex items-center gap-3">
                     <PhoneOff className="w-5 h-5 group-hover:-rotate-12 transition-transform" /> Finish & Analyze
                   </button>
                 )}
              </div>
            </div>

            {/* Transcript Pipeline */}
            <div className="glass border border-border rounded-2xl flex flex-col overflow-hidden h-[540px]">
               <div className="px-6 py-5 border-b border-border bg-surface/40 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <Sparkles className="w-4 h-4 text-primary" />
                   <h3 className="text-xs font-black uppercase tracking-widest text-white">Session Transcript</h3>
                 </div>
                 <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
               </div>
               
               <div ref={transcriptRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                  {messages.length === 0 ? (
                    <div className="text-center py-20 opacity-40">
                       <Mic className="w-12 h-12 mx-auto mb-4 text-muted" />
                       <p className="text-xs font-bold uppercase tracking-widest text-muted">Awaiting your response...</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div key={idx} className={cn("flex gap-4 animate-slide-up", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center border",
                          msg.role === 'user' ? "glass-light border-primary/20 text-primary" : "bg-card border-border text-accent"
                        )}>
                          {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                        </div>
                        <div className={cn(
                          "relative rounded-2xl px-5 py-4 max-w-[85%] text-sm font-medium leading-relaxed shadow-sm",
                          msg.role === 'user' ? "bg-primary/10 text-white border border-primary/20" : "glass border border-border text-muted"
                        )}>
                          {msg.content}
                          <div className={cn(
                            "absolute top-4 w-2 h-2 rotate-45 border-t border-l",
                            msg.role === 'user' ? "-right-1 bg-primary/10 border-primary/20" : "-left-1 bg-surface border-border"
                          )} />
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage: Feedback */}
      {stage === STAGES.feedback && (
        <FeedbackPanel feedback={feedback} onRestart={handleRestart} />
      )}
    </div>
  )
}
