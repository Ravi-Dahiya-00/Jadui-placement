'use client'

import { useState, useEffect } from 'react'
import { GitPullRequest, Search, CheckCircle2, AlertTriangle, Bug, ShieldAlert, Code2, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/context/AppContext'

export default function PRReviewSection() {
  const { state } = useApp()
  const [repoUrl, setRepoUrl] = useState('')
  const [prNumber, setPrNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [review, setReview] = useState(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [activeTab, setActiveTab] = useState('new') // new | history

  const fetchHistory = async () => {
    if (!state.user?.id) return
    try {
      const res = await fetch(`/api/github/review/history?user_id=${state.user.id}`)
      const data = await res.json()
      if (res.ok) setHistory(data.history || [])
    } catch (err) {
      console.error('History fetch failed', err)
    }
  }

  useEffect(() => {
    if (activeTab === 'history') fetchHistory()
  }, [activeTab])

  const handleReview = async (e) => {
    e.preventDefault()
    if (!repoUrl || !prNumber) return
    
    setLoading(true)
    setError('')
    setReview(null)

    try {
      const res = await fetch('/api/github/review/pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: state.user.id,
          repo_url: repoUrl,
          pr_number: parseInt(prNumber)
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Review failed')
      setReview(data.review)
      fetchHistory()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center border border-accent/30">
             <GitPullRequest className="w-4 h-4 text-accent" />
           </div>
           <h3 className="text-white font-semibold">Action Agent: PR Reviewer</h3>
        </div>
        <div className="flex bg-surface/50 border border-border p-1 rounded-lg">
           <button onClick={() => setActiveTab('new')} className={cn("px-4 py-1.5 text-xs font-medium rounded-md transition-all", activeTab === 'new' ? "bg-accent text-white shadow-glow-sm" : "text-muted hover:text-white")}>Analyze PR</button>
           <button onClick={() => setActiveTab('history')} className={cn("px-4 py-1.5 text-xs font-medium rounded-md transition-all", activeTab === 'history' ? "bg-accent text-white shadow-glow-sm" : "text-muted hover:text-white")}>History</button>
        </div>
      </div>

      {activeTab === 'new' ? (
        <div className="space-y-6">
          <form onSubmit={handleReview} className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block ml-1">Repository URL</label>
                <input 
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="w-full bg-surface/50 border border-border rounded-xl px-4 py-3 text-sm text-white focus:border-accent outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block ml-1">PR Number</label>
                <input 
                  type="number"
                  value={prNumber}
                  onChange={(e) => setPrNumber(e.target.value)}
                  placeholder="24"
                  className="w-full bg-surface/50 border border-border rounded-xl px-4 py-3 text-sm text-white focus:border-accent outline-none transition-all"
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full py-4 justify-center text-sm shadow-glow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? 'AI analyzing code quality...' : 'Start One-Click PR Review'}
            </button>
            {error && <p className="text-error text-xs text-center mt-2">{error}</p>}
          </form>

          {review && <ReviewResult review={review} />}
        </div>
      ) : (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center">
              <p className="text-muted text-sm">No PR reviews yet. Analyze your first PR to boost your Consistency score!</p>
            </div>
          ) : history.map(h => (
            <div key={h.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-accent/40 transition-all" onClick={() => { setReview(h); setActiveTab('new') }}>
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm", h.score >= 80 ? 'bg-success/10 text-success' : h.score >= 60 ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error')}>
                  {h.score}
                </div>
                <div>
                   <h4 className="text-sm font-bold text-white">{h.repo_owner}/{h.repo_name}</h4>
                   <p className="text-xs text-muted">PR #{h.pr_number} • {new Date(h.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ReviewResult({ review }) {
  return (
    <div className="space-y-6 animate-slide-up">
      {/* Score and Summary */}
      <div className={cn(
        "bg-gradient-to-br border rounded-3xl p-8 relative overflow-hidden",
        review.score >= 80 ? "from-success/10 to-primary/10 border-success/30" : review.score >= 60 ? "from-warning/10 to-primary/10 border-warning/30" : "from-error/10 to-primary/10 border-error/30"
      )}>
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
           <div className="w-24 h-24 rounded-2xl bg-surface/80 border border-white/5 flex flex-col items-center justify-center shadow-2xl shrink-0">
              <span className={cn("text-4xl font-black tracking-tighter", review.score >= 80 ? "text-success" : review.score >= 60 ? "text-warning" : "text-error")}>
                {review.score}
              </span>
              <span className="text-[10px] font-black uppercase text-muted">Quality</span>
           </div>
           <div>
              <h4 className="text-2xl font-black text-white tracking-tight leading-tight mb-3">AI Code Review Report</h4>
              <p className="text-muted text-sm leading-relaxed max-w-xl font-medium">{review.summary}</p>
           </div>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <GitPullRequest className="w-40 h-40" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="glass border border-success/30 rounded-2xl p-6 group">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center border border-success/20">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest">Strengths</h4>
          </div>
          <ul className="space-y-3">
             {review.strengths?.map((s, i) => (
               <li key={i} className="flex items-start gap-3 text-sm text-muted font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                  {s}
               </li>
             ))}
          </ul>
        </div>

        {/* Flaws/Bugs */}
        <div className="glass border border-error/30 rounded-2xl p-6 group">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-error/15 flex items-center justify-center border border-error/20">
              <Bug className="w-5 h-5 text-error" />
            </div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest">Detected Gaps</h4>
          </div>
          <ul className="space-y-3">
             {(review.bugs || review.security_risks)?.map((b, i) => (
               <li key={i} className="flex items-start gap-3 text-sm text-muted font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-error mt-1.5 shrink-0" />
                  {b}
               </li>
             ))}
          </ul>
        </div>
      </div>

      {/* Ideal Implementation */}
      {review.ideal_code && (
        <div className="glass border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-surface/40 flex items-center gap-3">
            <Code2 className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-black uppercase tracking-widest text-white">Recommended Architecture</h4>
          </div>
          <div className="p-6 overflow-x-auto">
             <pre className="text-xs text-muted leading-relaxed font-mono whitespace-pre-wrap">{review.ideal_code}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

function ChevronRight({ className }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  )
}
