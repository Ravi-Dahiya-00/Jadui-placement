'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Upload, Sparkles, CheckCircle2 } from 'lucide-react'

const TYPED_WORDS = ['Students', 'Freshers', 'Engineers', 'Developers', 'Analysts']

const STATS = [
  { value: '12K+', label: 'Students Coached' },
  { value: '94%',  label: 'Placement Rate'   },
  { value: '500+', label: 'Companies'         },
  { value: '4.9★', label: 'User Rating'       },
]

const PILLS = [
  'Resume Analysis',
  'AI Mock Interviews',
  'Skill Gap Detection',
  'Personalized Roadmap',
]

export default function HeroSection() {
  const [currentWord, setCurrentWord] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [isDeleting,  setIsDeleting]  = useState(false)

  useEffect(() => {
    const word = TYPED_WORDS[currentWord]
    let timeout
    if (!isDeleting && displayText === word) {
      timeout = setTimeout(() => setIsDeleting(true), 1800)
    } else if (isDeleting && displayText === '') {
      setIsDeleting(false)
      setCurrentWord((c) => (c + 1) % TYPED_WORDS.length)
    } else {
      timeout = setTimeout(() => {
        setDisplayText(
          isDeleting
            ? word.slice(0, displayText.length - 1)
            : word.slice(0, displayText.length + 1)
        )
      }, isDeleting ? 60 : 90)
    }
    return () => clearTimeout(timeout)
  }, [displayText, isDeleting, currentWord])

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
      {/* Animated background orbs */}
      <div className="orb w-[600px] h-[600px] bg-primary/12 top-[-150px] left-[-100px] animate-orb-move" />
      <div className="orb w-[500px] h-[500px] bg-secondary/10 bottom-[-100px] right-[-80px]"
           style={{ animation: 'orb-move 15s ease-in-out infinite alternate-reverse' }} />
      <div className="orb w-[300px] h-[300px] bg-accent/8 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Announcement badge */}
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-4 py-2 rounded-full mb-8 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by LangGraph Agentic AI
          <ArrowRight className="w-3 h-3" />
        </div>

        {/* Main headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6 animate-slide-up">
          <span className="gradient-text">Your AI Career</span>
          <br />
          <span className="text-white">Mentor for </span>
          <span className="gradient-text-primary inline-block min-w-[200px] sm:min-w-[280px] text-left">
            {displayText}
            <span className="typing-cursor" />
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-muted text-lg sm:text-xl max-w-2xl mx-auto mb-4 leading-relaxed"
           style={{ animation: 'slide-up 0.5s ease-out 0.1s both' }}>
          Personalized placement guidance that analyzes your resume, closes skill gaps,
          conducts AI mock interviews, and adapts your roadmap in real time.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10"
             style={{ animation: 'slide-up 0.5s ease-out 0.2s both' }}>
          {PILLS.map((pill) => (
            <span key={pill} className="flex items-center gap-1.5 text-xs text-muted bg-surface border border-border px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-3 h-3 text-success" />
              {pill}
            </span>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
             style={{ animation: 'slide-up 0.5s ease-out 0.3s both' }}>
          <Link href="/auth/signup" id="hero-get-started-btn" className="btn-primary text-base px-8 py-4 rounded-xl group">
            Get Started Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/dashboard/resume" id="hero-upload-resume-btn" className="btn-outline text-base px-8 py-4 rounded-xl">
            <Upload className="w-4 h-4" />
            Upload Resume
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden border border-border"
             style={{ animation: 'slide-up 0.5s ease-out 0.4s both' }}>
          {STATS.map((s) => (
            <div key={s.label} className="bg-surface/60 backdrop-blur px-6 py-5 text-center">
              <div className="text-2xl font-bold gradient-text-primary mb-1">{s.value}</div>
              <div className="text-xs text-muted">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Premium Demo Video from Legacy App (HireLens) */}
        <div className="mt-24 relative max-w-5xl mx-auto" style={{ animation: 'slide-up 0.8s ease-out 0.5s both' }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-accent blur-[120px] opacity-10 -z-10" />
            
            <div className="bg-[#0a0a0b] border border-white/10 rounded-3xl p-3 shadow-[0_40px_80px_rgba(0,0,0,0.4)] relative overflow-hidden">
                <div className="relative w-full aspect-video bg-black rounded-[22px] overflow-hidden">
                    <video
                        src="https://res.cloudinary.com/dkdhdiqy0/video/upload/v1774028074/demo_p7uk9j.mp4"
                        poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='900'%3E%3Crect width='1600' height='900' fill='%23000'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='32' font-weight='600' fill='%23333' text-anchor='middle' dy='.3em'%3E[ Demo Video ]%3C/text%3E%3C/svg%3E"
                        autoPlay muted loop playsInline
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted/40 animate-float">
        <div className="w-5 h-8 border border-current rounded-full flex items-start justify-center pt-1.5">
          <div className="w-0.5 h-2 bg-current rounded-full animate-bounce" />
        </div>
        <span className="text-xs">Scroll</span>
      </div>
    </section>
  )
}
