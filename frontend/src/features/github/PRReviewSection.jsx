'use client'

import { useState, useEffect } from 'react'
import { GitPullRequest, Search, CheckCircle2, AlertTriangle, Bug, ShieldAlert, Code2, Loader2, Sparkles, FolderTree, BarChart3, Binary, LayoutTemplate } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/context/AppContext'

export default function GitHubRepoAnalyzer() {
  const { state } = useApp()
  const [repoUrl, setRepoUrl] = useState('')
  const [prNumber, setPrNumber] = useState('')
  const [analysisMode, setAnalysisMode] = useState('pr') // pr | repo
  const [loading, setLoading] = useState(false)
  const [review, setReview] = useState(null)
  const [repoAnalysis, setRepoAnalysis] = useState(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [activeTab, setActiveTab] = useState('new') // new | history

  const fetchHistory = async () => {
    if (!state.user?.id) return
    try {
      const endpoint = analysisMode === 'pr' ? 'review' : 'analyze'
      const res = await fetch(`/api/github/${endpoint}/history?user_id=${state.user.id}`)
      const data = await res.json()
      if (res.ok) setHistory(data.history || [])
    } catch (err) {
      console.error('History fetch failed', err)
    }
  }

  useEffect(() => {
    if (activeTab === 'history') fetchHistory()
  }, [activeTab, analysisMode])

  const handleAction = async (e) => {
    e.preventDefault()
    if (!repoUrl || !state.user?.id) return
    if (analysisMode === 'pr' && !prNumber) return
    
    setLoading(true)
    setError('')
    setReview(null)
    setRepoAnalysis(null)

    try {
      const endpoint = analysisMode === 'pr' ? 'review/pr' : 'analyze/repo'
      const body = analysisMode === 'pr' 
        ? { user_id: state.user.id, repo_url: repoUrl, pr_number: parseInt(prNumber) }
        : { user_id: state.user.id, repo_url: repoUrl }

      const res = await fetch(`/api/github/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Analysis failed')
      
      if (analysisMode === 'pr') setReview(data.review)
      else setRepoAnalysis(data.analysis)
      
      fetchHistory()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center border border-accent/30">
             <GitPullRequest className={cn("w-4 h-4 text-accent", analysisMode === 'repo' && "hidden")} />
             <FolderTree className={cn("w-4 h-4 text-accent", analysisMode === 'pr' && "hidden")} />
           </div>
           <div>
             <h3 className="text-white font-semibold">Action Agent: Repo Analyzer</h3>
             <p className="text-[10px] text-muted font-bold uppercase tracking-wider">GitHub Intelligence Engine</p>
           </div>
        </div>
        <div className="flex bg-surface/50 border border-border p-1 rounded-lg">
            <div className="flex mr-1 border-r border-border pr-1">
                <button onClick={() => setAnalysisMode('pr')} className={cn("px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all", analysisMode === 'pr' ? "bg-accent/20 text-accent border border-accent/30" : "text-muted hover:text-white")}>PR Review</button>
                <button onClick={() => setAnalysisMode('repo')} className={cn("px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all", analysisMode === 'repo' ? "bg-accent/20 text-accent border border-accent/30" : "text-muted hover:text-white")}>Project Audit</button>
            </div>
           <button onClick={() => setActiveTab('new')} className={cn("px-4 py-1.5 text-xs font-medium rounded-md transition-all", activeTab === 'new' ? "bg-accent text-white shadow-glow-sm" : "text-muted hover:text-white")}>Run</button>
           <button onClick={() => setActiveTab('history')} className={cn("px-4 py-1.5 text-xs font-medium rounded-md transition-all", activeTab === 'history' ? "bg-accent text-white shadow-glow-sm" : "text-muted hover:text-white")}>History</button>
        </div>
      </div>

      {activeTab === 'new' ? (
        <div className="space-y-6">
          <form onSubmit={handleAction} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block ml-1">Repository URL</label>
                <input 
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="w-full bg-surface/50 border border-border rounded-xl px-4 py-3 text-sm text-white focus:border-accent outline-none transition-all"
                  required
                />
              </div>
              <div className={cn(analysisMode === 'repo' && "opacity-30 pointer-events-none")}>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block ml-1">PR Number</label>
                <input 
                  type="number"
                  value={prNumber}
                  onChange={(e) => setPrNumber(e.target.value)}
                  placeholder="24"
                  className="w-full bg-surface/50 border border-border rounded-xl px-4 py-3 text-sm text-white focus:border-accent outline-none transition-all"
                  required={analysisMode === 'pr'}
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full py-4 justify-center text-sm shadow-glow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? (analysisMode === 'pr' ? 'Analyzing line-by-line...' : 'Auditing Architecture...') : (analysisMode === 'pr' ? 'Analyze Pull Request' : 'Start Project-Wide Audit')}
            </button>
            {error && <p className="text-error text-xs text-center mt-2">{error}</p>}
          </form>

          {review && <ReviewResult review={review} />}
          {repoAnalysis && <RepoResult analysis={repoAnalysis} />}
        </div>
      ) : (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center">
              <p className="text-muted text-sm">No analysis history yet for this mode.</p>
            </div>
          ) : history.map(h => (
            <div key={h.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-accent/40 transition-all" onClick={() => { 
                if (analysisMode === 'pr') setReview(h);
                else setRepoAnalysis(h);
                setActiveTab('new');
            }}>
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white", (h.score || h.architecture_score) >= 80 ? 'bg-success/20' : (h.score || h.architecture_score) >= 60 ? 'bg-warning/20' : 'bg-error/20')}>
                  {h.score || h.architecture_score}
                </div>
                <div>
                   <h4 className="text-sm font-bold text-white">{h.repo_owner}/{h.repo_name}</h4>
                   <p className="text-xs text-muted">{analysisMode === 'pr' ? `PR #${h.pr_number}` : 'Project Audit'} • {new Date(h.created_at).toLocaleDateString()}</p>
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

function RepoResult({ analysis }) {
    return (
        <div className="space-y-6 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/30 rounded-3xl p-8">
                    <div className="flex items-start gap-6">
                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 rounded-2xl bg-surface/80 border border-white/5 flex flex-col items-center justify-center shadow-2xl">
                                <span className="text-3xl font-black text-accent tracking-tighter">{analysis.architecture_score}</span>
                                <span className="text-[8px] font-black uppercase text-muted">Arch Score</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                             <h4 className="text-xl font-black text-white tracking-tight">Repository Intelligence Summary</h4>
                             <p className="text-muted text-sm leading-relaxed font-medium">{analysis.summary}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-3xl p-6">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-muted mb-4 block">Tech Stack Detected</h5>
                    <div className="flex flex-wrap gap-2">
                         {analysis.tech_stack?.map((tag, i) => (
                             <span key={i} className="px-3 py-1 bg-surface border border-border rounded-full text-[10px] font-bold text-white uppercase tracking-tighter shadow-sm">{tag}</span>
                         ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass border border-accent/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <LayoutTemplate className="w-5 h-5 text-accent" />
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">Design Patterns</h4>
                    </div>
                    <ul className="space-y-3">
                         {analysis.design_patterns?.map((d, i) => (
                             <li key={i} className="flex items-start gap-3 text-sm text-muted font-medium">
                                 <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                                 {d}
                             </li>
                         ))}
                    </ul>
                </div>

                <div className="glass border border-error/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <BarChart3 className="w-5 h-5 text-error" />
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">Technical Debt</h4>
                    </div>
                    <ul className="space-y-3">
                         {analysis.technical_debt?.map((td, i) => (
                             <li key={i} className="flex items-start gap-3 text-sm text-muted font-medium">
                                 <AlertTriangle className="w-4 h-4 text-error mt-0.5 shrink-0" />
                                 {td}
                             </li>
                         ))}
                    </ul>
                </div>
            </div>
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
             <pre className="text-xs text-muted leading-relaxed font-mono whitespace-pre-wrap font-medium">{review.ideal_code}</pre>
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
