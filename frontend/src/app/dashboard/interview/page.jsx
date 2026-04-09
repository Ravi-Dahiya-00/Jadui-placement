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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Mic className="w-6 h-6 text-accent" />
          Live Mock Interview
        </h1>
        <p className="text-muted text-sm mt-1">
          Practice role-specific interviews with free browser speech recognition.
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
        <div className="space-y-4 animate-slide-up">
          {questions.length > 0 && (
            <div className="bg-surface/60 border border-accent/25 rounded-2xl p-5 shadow-glow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent mb-1">
                    Current question ({currentQuestionIndex + 1} / {questions.length})
                  </p>
                  <p className="text-white text-base leading-relaxed">
                    {questions[currentQuestionIndex]}
                  </p>
                  <p className="text-muted text-xs mt-2">
                    Answer out loud; your speech is captured in the transcript. Advance when you are ready for the next prompt.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={speechEnabled}
                      onChange={(e) => setSpeechEnabled(e.target.checked)}
                      className="rounded border-border"
                    />
                    Read aloud
                  </label>
                  <button
                    type="button"
                    onClick={replayQuestion}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card border border-border text-xs text-white hover:bg-primary/10"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Replay
                  </button>
                  <button
                    type="button"
                    onClick={goNextQuestion}
                    disabled={currentQuestionIndex >= questions.length - 1}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/20 border border-primary/40 text-xs font-medium text-white hover:bg-primary/30 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Next question
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Active Call UI */}
          <div className="bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-glow-sm">
            <div className="p-8 flex flex-col items-center justify-center flex-1 space-y-8 bg-surface/30">
              {/* Agent Bubble */}
              <div className="relative">
                <div className={cn(
                  "w-32 h-32 rounded-full flex items-center justify-center bg-gradient-to-tr from-accent/20 to-primary/20 border-2 transition-all duration-300",
                  isSpeaking ? "border-accent shadow-[0_0_40px_rgba(6,182,212,0.4)] scale-105" : "border-border/50"
                )}>
                  <Bot className="w-12 h-12 text-white/90" />
                </div>
                {callStatus === 'CONNECTING' && (
                  <span className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center bg-card rounded-full shadow-lg">
                    <Loader2 className="w-4 h-4 text-accent animate-spin" />
                  </span>
                )}
                {callStatus === 'ACTIVE' && isSpeaking && (
                   <span className="absolute -inset-4 rounded-full border border-accent/30 animate-ping" />
                )}
              </div>
              
              <div className="text-center space-y-1">
                <h3 className="text-xl font-bold text-white">Agentic Coach</h3>
                <p className={cn("text-sm font-medium", callStatus === 'ACTIVE' ? "text-success" : "text-warning animate-pulse")}>
                  {callStatus === 'CONNECTING' ? 'Connecting to Microphone...' : 'Live Interview Active'}
                </p>
              </div>
            </div>

            {/* Call Controls */}
            <div className="p-4 bg-background border-t border-border flex justify-center gap-4">
               {callStatus === 'ACTIVE' && (
                 <button onClick={handleDisconnect} className="bg-error/20 hover:bg-error/30 border border-error/50 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all group">
                   <PhoneOff className="w-5 h-5 group-hover:-rotate-12 transition-transform" /> Set Feedback & Finish
                 </button>
               )}
            </div>
          </div>

          {/* Transcript Pipeline */}
          <div className="bg-card border border-border rounded-2xl flex flex-col overflow-hidden h-[500px]">
             <div className="px-5 py-4 border-b border-border bg-surface/40 flex items-center gap-2">
               <Sparkles className="w-4 h-4 text-primary" />
               <h3 className="font-semibold text-white">Live Transcript</h3>
             </div>
             
             <div ref={transcriptRef} className="flex-1 overflow-y-auto p-5 py-6 space-y-5">
                {messages.length === 0 ? (
                  <div className="text-center text-muted text-sm mt-20 opacity-60">
                     <Mic className="w-8 h-8 mx-auto mb-3" />
                     Your spoken answers will appear here. Respond to the current question above.
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                      <div className={cn(
                        "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center",
                        msg.role === 'user' ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"
                      )}>
                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={cn(
                        "rounded-2xl px-4 py-3 max-w-[85%] text-sm leading-relaxed",
                        msg.role === 'user' ? "bg-primary/10 text-white border border-primary/20" : "bg-surface border border-border text-muted"
                      )}>
                        {msg.content}
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
