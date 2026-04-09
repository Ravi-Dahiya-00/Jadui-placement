'use client'

import { FileText, Map, Mic, TrendingUp, Bell, Brain } from 'lucide-react'

const FEATURES = [
  {
    icon:   FileText,
    title:  'Resume Intelligence',
    description: 'Upload your resume and get a deep AI analysis — extracting skills, spotting weaknesses, and generating targeted improvement recommendations.',
    color:  'text-primary',
    bg:     'bg-primary/10',
    glow:   'hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]',
    border: 'hover:border-primary/30',
  },
  {
    icon:   Map,
    title:  'AI Career Roadmap',
    description: 'Get a dynamic, personalized preparation plan with daily tasks and weekly milestones — automatically adjusted based on your progress.',
    color:  'text-secondary',
    bg:     'bg-secondary/10',
    glow:   'hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]',
    border: 'hover:border-secondary/30',
  },
  {
    icon:   Mic,
    title:  'Mock Interviews',
    description: 'Practice role-specific technical and behavioral interviews with AI. Receive scored feedback, improvement suggestions, and build real confidence.',
    color:  'text-accent',
    bg:     'bg-accent/10',
    glow:   'hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]',
    border: 'hover:border-accent/30',
  },
  {
    icon:   TrendingUp,
    title:  'Progress Tracking',
    description: 'Visual dashboards track your readiness score, skill progression, task completion, and interview performance — all in one place.',
    color:  'text-success',
    bg:     'bg-success/10',
    glow:   'hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]',
    border: 'hover:border-success/30',
  },
  {
    icon:   Bell,
    title:  'Smart Alerts',
    description: 'Proactive interventions when you go off track — inactivity nudges, performance dips, deadline reminders, and motivational insights.',
    color:  'text-warning',
    bg:     'bg-warning/10',
    glow:   'hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]',
    border: 'hover:border-warning/30',
  },
  {
    icon:   Brain,
    title:  'AI Mentor Chat',
    description: 'Context-aware AI that knows your resume, progress, and weaknesses — giving you strategic answers, not generic advice.',
    color:  'text-secondary',
    bg:     'bg-secondary/10',
    glow:   'hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]',
    border: 'hover:border-secondary/30',
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="orb w-[500px] h-[500px] bg-secondary/6 top-1/2 right-0 -translate-y-1/2" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-secondary/10 border border-secondary/20 text-secondary text-xs font-semibold px-4 py-2 rounded-full mb-4">
            Core Capabilities
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Everything you need to{' '}
            <span className="gradient-text">land your dream job</span>
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            An end-to-end career intelligence platform — from resume to offer letter.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className={`bg-card border border-border rounded-2xl p-6 transition-all duration-300 group cursor-default ${feature.glow} ${feature.border}`}
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{feature.description}</p>
                <div className={`mt-5 h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-current to-transparent transition-all duration-500 rounded-full ${feature.color}`} />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
