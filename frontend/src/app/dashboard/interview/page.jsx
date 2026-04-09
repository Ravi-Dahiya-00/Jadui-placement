'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, Play, Loader2, PhoneOff, User, Bot, Sparkles } from 'lucide-react'
import RoleSelector  from '@/features/interview/RoleSelector'
import FeedbackPanel from '@/features/interview/FeedbackPanel'
import InterviewCard from '@/features/interview/InterviewCard'
import { interviewAPI } from '@/services/api'
import { getVapi } from '@/lib/vapi'
import { cn } from '@/lib/utils'
import { useApp } from '@/context/AppContext'

const STAGES = { select: 'select', interview: 'interview', feedback: 'feedback' }

export default function InterviewPage() {
  const { state } = useApp()
  const [stage,       setStage]     = useState(STAGES.select)
  const [role,        setRole]      = useState('')
  const [questions,   setQuestions] = useState([])
  const [interviewId, setInterviewId] = useState(null)
  const [feedback,    setFeedback]  = useState(null)
  const [loading,     setLoading]   = useState(false)
  const [startError,  setStartError] = useState('')

  // Vapi Voice Call State
  const [callStatus, setCallStatus] = useState('INACTIVE') // INACTIVE, CONNECTING, ACTIVE, FINISHED
  const [messages, setMessages] = useState([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const transcriptRef = useRef(null)

  useEffect(() => {
    // Only bind listeners when we enter the interview stage
    if (stage !== STAGES.interview) return

    const vapi = getVapi()
    if (!vapi) return

    const handleCallStart = () => { setCallStatus('ACTIVE'); setLoading(false) }
    const handleCallEnd = () => setTimeout(() => setCallStatus('FINISHED'), 500)
    const handleMessage = (msg) => {
      if (msg.type === 'transcript' && msg.transcriptType === 'final') {
        setMessages((prev) => [...prev, { role: msg.role, content: msg.transcript }])
      }
    }
    const handleSpeechStart = () => setIsSpeaking(true)
    const handleSpeechEnd = () => setIsSpeaking(false)
    const handleError = (err) => { console.error('Vapi error:', err); setLoading(false) }

    vapi.on('call-start', handleCallStart)
    vapi.on('call-end', handleCallEnd)
    vapi.on('message', handleMessage)
    vapi.on('speech-start', handleSpeechStart)
    vapi.on('speech-end', handleSpeechEnd)
    vapi.on('error', handleError)

    return () => {
      vapi.off('call-start', handleCallStart)
      vapi.off('call-end', handleCallEnd)
      vapi.off('message', handleMessage)
      vapi.off('speech-start', handleSpeechStart)
      vapi.off('speech-end', handleSpeechEnd)
      vapi.off('error', handleError)
    }
  }, [stage])

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
      // Create questions via our new local backend Generator
      let generatedQuestions = []
      try {
        const response = await fetch('/api/interview/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: role,
            amount: 3,
            userid: state.user?.id || 'demo-user'
          })
        })
        const data = await response.json()
        generatedQuestions = data.questions || []
        if (data.interviewId) setInterviewId(data.interviewId)
      } catch (err) {
        console.warn('Backend generation failed, using fallback questions', err)
        generatedQuestions = ['Tell me about your background.', 'How do you handle conflict?']
      }

      setQuestions(generatedQuestions)

      // Start VAPI voice session
      const vapi = getVapi()
      const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID
      if (!assistantId) {
        throw new Error('Voice interview is not configured. Missing NEXT_PUBLIC_VAPI_ASSISTANT_ID.')
      }
      await vapi.start(assistantId, {
        variableValues: {
          username: state.user?.user_metadata?.full_name || 'Candidate',
          userid: state.user?.id || 'demo-user',
          questions: JSON.stringify(generatedQuestions)
        }
      })
    } catch (err) {
      console.error('Failed to start interview:', err)
      setStartError(err?.message || 'Failed to start voice interview. Please try again.')
      setLoading(false)
      setStage(STAGES.select)
    }
  }

  const handleDisconnect = async () => {
    const vapi = getVapi()
    vapi.stop()
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
    setStage(STAGES.select)
    setRole('')
    setQuestions([])
    setInterviewId(null)
    setMessages([])
    setFeedback(null)
    setCallStatus('INACTIVE')
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
          Practice role-specific interviews with a real-time Voice AI agent.
        </p>
        {startError ? (
          <p className="text-error text-sm mt-2">{startError}</p>
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
            {loading ? 'Initializing Agent Ecosystem...' : 'Start Voice Interview'}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
          
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
                  {callStatus === 'CONNECTING' ? 'Connecting to Voice Server...' : 'Live Interview Active'}
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
                     Say &quot;Hello&quot; when you enter the room...
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
      )}

      {/* Stage: Feedback */}
      {stage === STAGES.feedback && (
        <FeedbackPanel feedback={feedback} onRestart={handleRestart} />
      )}
    </div>
  )
}
