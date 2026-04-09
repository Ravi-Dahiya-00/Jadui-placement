'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Cpu, ClipboardList, TrendingUp } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    icon: Upload,
    title: 'Upload Your Resume',
    description: 'Drop your PDF resume. Our AI engine parses it in seconds — extracting skills, projects, experience, and education instantly.',
    color: 'text-primary',
    bg: 'bg-primary',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'AI Analyzes Your Skills',
    description: 'The Agentic AI benchmarks your profile against industry standards, identifies skill gaps, and maps your strengths.',
    color: 'text-secondary',
    bg: 'bg-secondary',
  },
  {
    number: '03',
    icon: ClipboardList,
    title: 'Get Your Personalized Plan',
    description: 'Receive a dynamic roadmap with daily tasks, mock interview schedules, and curated resources tailored exactly to you.',
    color: 'text-accent',
    bg: 'bg-accent',
  },
  {
    number: '04',
    icon: TrendingUp,
    title: 'Track Progress & Improve',
    description: 'Monitor your readiness score, skill growth, and task completion in real time — with the AI adapting your plan as you improve.',
    color: 'text-success',
    bg: 'bg-success',
  },
]

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 bg-background">
      <div className="max-w-7xl mx-auto bg-surface/50 border border-border rounded-[2.5rem] p-8 md:p-16 shadow-2xl relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left Side: Navigation */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-muted mb-3">
              Daily Workflow
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
              A lightweight system that feels <span className="text-accent text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">native to learning.</span>
            </h2>
            <p className="text-muted text-lg mb-12">
              The interface stays quiet while the AI does the heavy lifting. You keep your focus, and the knowledge compounds.
            </p>

            <div className="flex flex-col gap-8">
              {STEPS.map((item, idx) => (
                <div
                  key={item.number}
                  onClick={() => setActiveStep(idx)}
                  className={`flex gap-6 cursor-pointer transition-all duration-500 ease-out ${activeStep === idx ? 'opacity-100 scale-105' : 'opacity-40 scale-100 hover:opacity-70'}`}
                >
                  <div className={`font-black text-xl pt-1 ${activeStep === idx ? item.color : 'text-muted'}`}>
                    {item.number}.
                  </div>
                  <div>
                    <h4 className={`text-lg font-bold mb-1 ${activeStep === idx ? 'text-white' : 'text-muted'}`}>{item.title}</h4>
                    <p className="text-sm text-muted/80 leading-relaxed max-w-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Animated Panel */}
          <div className="relative h-[450px] w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 bg-[#0a0a0b] rounded-3xl p-8 border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center text-center"
              >
                <div className="flex gap-2 w-full absolute top-6 left-6">
                   <div className="w-2.5 h-2.5 rounded-full bg-error" />
                   <div className="w-2.5 h-2.5 rounded-full bg-warning" />
                   <div className="w-2.5 h-2.5 rounded-full bg-success" />
                </div>

                <div className={`w-20 h-20 rounded-2xl ${STEPS[activeStep].bg}/20 flex items-center justify-center mb-6`}>
                   {(() => {
                     const Icon = STEPS[activeStep].icon;
                     return <Icon className={`w-10 h-10 ${STEPS[activeStep].color}`} />;
                   })()}
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4">
                  {STEPS[activeStep].title}
                </h3>
                
                <div className="w-full max-w-[80%] h-2 bg-white/5 rounded-full overflow-hidden mt-4">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 4.8, ease: "linear" }}
                    className={`h-full ${STEPS[activeStep].bg}`}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  )
}
