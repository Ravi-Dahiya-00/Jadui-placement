'use client'

import { useState, useEffect } from 'react'
import { 
  X, Mail, Github, Award, CheckCircle2, 
  MapPin, Calendar, Briefcase, Code2, 
  Mic2, FileText, Zap, ChevronRight, MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function StudentDossier({ studentId, onClose }) {
  const [dossier, setDossier] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDossier() {
      try {
        const res = await fetch(`/api/admin/students/${studentId}/dossier`)
        const data = await res.json()
        setDossier(data.dossier)
      } catch (err) {
        console.error('Failed to fetch dossier', err)
      } finally {
        setLoading(false)
      }
    }
    if (studentId) fetchDossier()
  }, [studentId])

  if (loading) return (
     <div className="flex flex-col items-center justify-center p-20 gap-4">
        <div className="w-10 h-10 border-2 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Compiling Dossier...</p>
     </div>
  )

  const { radar, latest_resume, top_prs, top_interviews, github_stats, profile, overall_tier } = dossier || {}

  const handleToggleShortlist = async () => {
    try {
      const res = await fetch(`/api/admin/students/${studentId}/shortlist`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setDossier(prev => ({ ...prev, profile: { ...prev.profile, is_shortlisted: data.is_shortlisted } }))
      }
    } catch (err) { console.error(err) }
  }

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-l border-neutral-800 animate-slide-left shadow-2xl overflow-y-auto min-w-[400px]">
      {/* Header */}
      <div className="p-8 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur sticky top-0 z-10 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="relative">
               <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-neutral-950 font-black text-xl">
                  {dossier.user_id[0]?.toUpperCase()}
               </div>
               {profile?.is_shortlisted && (
                 <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1 border-2 border-neutral-900">
                    <Award className="w-3 h-3 text-neutral-950" />
                 </div>
               )}
            </div>
            <div>
               <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-white leading-none">Hiring Dossier</h3>
                  <button 
                    onClick={handleToggleShortlist}
                    className={cn(
                      "p-1.5 rounded-lg transition-all",
                      profile?.is_shortlisted ? "text-amber-500 bg-amber-500/10" : "text-neutral-600 hover:text-amber-500"
                    )}
                  >
                     <Award className={cn("w-4 h-4", profile?.is_shortlisted && "fill-amber-500")} />
                  </button>
               </div>
               <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1">ID: {studentId.slice(0, 8)}</p>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               {profile?.linkedin_url && (
                 <a href={profile.linkedin_url} target="_blank" className="p-2 hover:bg-neutral-800 rounded-xl transition-colors text-blue-400">
                    <Github className="w-4 h-4" /> {/* Swap with Linkedin icon if lucide has it */}
                 </a>
               )}
               {profile?.portfolio_url && (
                 <a href={profile.portfolio_url} target="_blank" className="p-2 hover:bg-neutral-800 rounded-xl transition-colors text-emerald-400">
                    <MapPin className="w-4 h-4" />
                 </a>
               )}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
               <X className="w-5 h-5 text-neutral-500" />
            </button>
         </div>
      </div>

      <div className="p-8 space-y-10">
         {/* Tier Badge */}
         <div className="flex items-center gap-4">
            <span className={cn(
              "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-lg",
              overall_tier === 'FAANG-READY' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10" :
              overall_tier === 'PRODUCT-READY' ? "bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-blue-500/10" :
              "bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-amber-500/10"
            )}>
               {overall_tier}
            </span>
            <span className="text-xs text-neutral-500 font-medium">Derived from 4 readiness points</span>
         </div>

         {/* Readiness Metrics */}
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
             {Object.entries(radar || {}).map(([key, val]) => (
               <div key={key} className="bg-neutral-800/50 border border-white/5 rounded-2xl p-4 text-center">
                  <p className="text-[10px] font-black uppercase text-neutral-500 mb-1">{key}</p>
                  <p className="text-lg font-black text-white">{val}%</p>
               </div>
             ))}
         </div>

         {/* Resume Summary */}
         <Section title="Latest Resume Outcome" icon={FileText}>
            {latest_resume ? (
               <div className="bg-neutral-800/30 border border-white/5 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                     <p className="text-sm font-bold text-white">{latest_resume.role_target || 'General Profile'}</p>
                     <span className="text-lg font-black text-emerald-500">{latest_resume.score}/100</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed italic">&quot;{latest_resume.summary}&quot;</p>
               </div>
            ) : <NoData />}
         </Section>

         {/* Top Code Reviews */}
         <Section title="AI Code Quality (PR History)" icon={Code2}>
            {top_prs?.length > 0 ? (
               <div className="space-y-3">
                  {top_prs.map((pr, i) => (
                    <div key={i} className="flex items-center justify-between bg-neutral-800/30 border border-white/5 p-4 rounded-xl">
                       <div className="flex items-center gap-3">
                          <Github className="w-4 h-4 text-neutral-500" />
                          <div>
                            <p className="text-xs font-bold text-white leading-none">{pr.repo_name}</p>
                            <p className="text-[10px] text-neutral-500">PR #{pr.pr_number}</p>
                          </div>
                       </div>
                       <span className="text-xs font-black text-amber-500">{pr.score}%</span>
                    </div>
                  ))}
               </div>
            ) : <NoData />}
         </Section>

         {/* Interview Feedback */}
         <Section title="Communication Performance" icon={MessageSquare}>
             {top_interviews?.length > 0 ? (
                <div className="space-y-3">
                   {top_interviews.map((int, i) => (
                     <div key={i} className="bg-neutral-800/30 border border-white/5 p-4 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                           <p className="text-xs font-bold text-white tracking-widest uppercase">{int.role}</p>
                           <p className="text-xs font-black text-blue-400">{int.overall_score}%</p>
                        </div>
                        <p className="text-[10px] text-neutral-500 line-clamp-2">{int.strengths?.[0] || 'Good clarity'}</p>
                     </div>
                   ))}
                </div>
             ) : <NoData />}
         </Section>

          {/* Technical Footprint (GitHub) */}
          <Section title="Technical Footprint (GitHub)" icon={Github}>
             {github_stats ? (
                <div className="bg-neutral-800/30 border border-white/5 rounded-3xl overflow-hidden shadow-inner">
                   <div className="p-5 border-b border-white/5 flex items-center justify-between">
                      <div className="flex gap-4">
                         <div className="text-center">
                            <p className="text-[10px] font-black text-neutral-500 uppercase">Repos</p>
                            <p className="text-sm font-black text-white">{github_stats.meta?.reposAnalyzed}</p>
                         </div>
                         <div className="text-center">
                            <p className="text-[10px] font-black text-neutral-500 uppercase">Stars</p>
                            <p className="text-sm font-black text-white">
                                {Object.values(github_stats.repoStarCount || {}).reduce((a, b) => a + b, 0)}
                            </p>
                         </div>
                      </div>
                      <a 
                        href={github_stats.user?.htmlUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-amber-500 rounded-lg text-neutral-950 hover:scale-105 transition-transform"
                      >
                         <Github className="w-4 h-4" />
                      </a>
                   </div>
                   
                   <div className="p-5 space-y-4">
                      {/* Language Mix */}
                      <div className="space-y-2">
                         <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Stack Dominance</p>
                         <div className="flex flex-wrap gap-2">
                            {Object.entries(github_stats.langRepoCount || {}).slice(0, 3).map(([lang, count]) => (
                               <span key={lang} className="px-2 py-1 bg-neutral-900 border border-white/5 rounded-md text-[10px] font-bold text-neutral-300">
                                  {lang} ({count} repos)
                               </span>
                            ))}
                         </div>
                      </div>

                      {/* AI Verdict */}
                      {github_stats.insights && (
                        <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl">
                           <p className="text-[10px] font-black text-amber-500 uppercase mb-2">Technical AI Verdict</p>
                           <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                              {github_stats.insights.split('\n')[0]}
                           </p>
                        </div>
                      )}
                   </div>
                </div>
             ) : (
                <div className="p-6 border border-dashed border-neutral-800 rounded-2xl flex flex-col items-center gap-2">
                   <Code2 className="w-5 h-5 text-neutral-700" />
                   <p className="text-xs text-neutral-600 font-bold uppercase tracking-widest">No Technical Profile Linked</p>
                </div>
             )}
          </Section>

         {/* Action: Manual Intervention */}
         <Intervention studentId={studentId} />

         {/* Internal TPO Section */}
         <TPONotes studentId={studentId} initialNotes={profile?.tpo_notes} />
      </div>
    </div>
  )
}

function TPONotes({ studentId, initialNotes }) {
  const [notes, setNotes] = useState(initialNotes || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await fetch(`/api/admin/students/${studentId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })
    } catch { /* error */ }
    setIsSaving(false)
  }

  return (
    <div className="pt-10 border-t border-neutral-800 space-y-4">
       <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Internal TPO Remarks</h4>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="text-[10px] font-black text-amber-500 uppercase hover:underline"
          >
            {isSaving ? 'Saving...' : 'Save Notes'}
          </button>
       </div>
       <textarea 
         value={notes}
         onChange={(e) => setNotes(e.target.value)}
         placeholder="Enter private observations (FAANG potential, soft-skill gaps, etc.)"
         className="w-full h-32 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-xs text-neutral-400 outline-none focus:border-amber-500/30 font-medium resize-none"
       />
       <p className="text-[10px] text-neutral-600 italic">⚠️ These notes are private and NOT visible to the student.</p>
    </div>
  )
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="space-y-4">
       <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600">
          <Icon className="w-4 h-4" /> {title}
       </h4>
       {children}
    </div>
  )
}

function NoData() {
  return <p className="text-xs text-neutral-600 italic">No data synced for this student yet.</p>
}

function Intervention({ studentId }) {
  const [taskText, setTaskText] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleAssign = async () => {
    if (!taskText) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/intervene/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: studentId, title: taskText })
      })
      if (res.ok) {
        setSuccess(true)
        setTaskText('')
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch { /* error handling */ }
    setLoading(false)
  }

  return (
    <div className="pt-6 border-t border-neutral-800 space-y-4">
       <h4 className="text-xs font-black uppercase text-amber-500 flex items-center gap-2">
         <Zap className="w-4 h-4 fill-amber-500" /> Mission Control: Inject Task
       </h4>
       <div className="flex gap-2">
          <input 
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            disabled={loading}
            placeholder="e.g. Redo System Design Mock Interview"
            className="flex-1 bg-neutral-800 border border-white/5 rounded-xl px-4 py-2 text-xs outline-none focus:border-amber-500/50"
          />
          <button 
            onClick={handleAssign}
            disabled={loading || !taskText}
            className="px-4 py-2 bg-amber-500 text-neutral-950 text-[10px] font-black uppercase rounded-xl disabled:opacity-50"
          >
            {loading ? '...' : (success ? 'Sent!' : 'Assign')}
          </button>
       </div>
    </div>
  )
}
