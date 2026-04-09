'use client'

import { useState, useEffect } from 'react'
import { 
  Sparkles, Calendar, Users, ChevronRight, 
  BookOpen, Clock, CheckCircle2, Loader2, Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function WorkshopsPage() {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [scheduling, setScheduling] = useState(null) // ID of workshop being scheduled

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const res = await fetch('/api/admin/workshops/suggestions')
        const data = await res.json()
        setSuggestions(data.suggestions || [])
      } catch (err) {
        console.error('Failed to fetch suggestions', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSuggestions()
  }, [])

  const handleSchedule = async (suggestion) => {
    setScheduling(suggestion.title)
    try {
      const res = await fetch('/api/admin/workshops/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...suggestion,
          scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Suggesting next week
        })
      })
      if (res.ok) {
        setSuggestions(prev => prev.filter(s => s.title !== suggestion.title))
      }
    } catch (err) {
      console.error('Scheduling failed', err)
    } finally {
      setScheduling(null)
    }
  }

  if (loading) return (
     <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-neutral-500 font-bold text-sm uppercase tracking-widest">Scanning Skill Clusters...</p>
     </div>
  )

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-2 h-8 bg-amber-500 rounded-full" />
             <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Workshop Agent</h2>
          </div>
          <p className="text-neutral-500 font-medium max-w-lg">
            Our AI Agent has grouped students by their shared skill gaps and generated specialized 1-day training missions.
          </p>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-[32px] p-20 text-center space-y-4">
           <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto border border-white/5">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
           </div>
           <h3 className="text-xl font-bold text-white">No Critical Gaps Found</h3>
           <p className="text-neutral-500 text-sm max-w-sm mx-auto">Your batch is looking strong. Re-scan after the next round of mock interviews!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
           {suggestions.map((s, i) => (
             <div key={i} className="group bg-neutral-900 border border-neutral-800 rounded-[32px] overflow-hidden flex flex-col hover:border-amber-500/30 transition-all duration-500">
               <div className="p-8 space-y-6 flex-1">
                  <div className="flex items-center justify-between">
                     <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-full">AI Recommendation</span>
                     <div className="flex items-center gap-2 text-neutral-500">
                        <Users className="w-4 h-4" />
                        <span className="text-xs font-bold">{s.student_ids?.length} Students</span>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <h3 className="text-2xl font-black text-white tracking-tight leading-loose group-hover:text-amber-400 transition-colors uppercase">{s.title}</h3>
                     <p className="text-sm text-neutral-500 font-medium leading-relaxed">{s.description}</p>
                  </div>

                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5" /> Proposed Curriculum
                     </p>
                     <ul className="space-y-2">
                        {s.curriculum?.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-3 text-xs text-neutral-400 font-medium">
                             <div className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                             {item}
                          </li>
                        ))}
                     </ul>
                  </div>
               </div>

               <div className="p-8 pt-0 mt-auto">
                  <button 
                    onClick={() => handleSchedule(s)}
                    disabled={scheduling === s.title}
                    className="w-full py-4 bg-white/5 hover:bg-amber-500 border border-white/10 hover:border-amber-400 text-neutral-400 hover:text-neutral-950 text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95"
                  >
                    {scheduling === s.title ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                    {scheduling === s.title ? 'Confirming...' : 'Approve & Schedule'}
                  </button>
                  <p className="text-center text-[10px] text-neutral-600 font-bold mt-4 flex items-center justify-center gap-1.5 uppercase tracking-tighter">
                    <Info className="w-3 h-3" /> Will notify {s.student_ids?.length} students instantly
                  </p>
               </div>
             </div>
           ))}
        </div>
      )}
    </div>
  )
}
