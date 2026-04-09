import { Trophy, TrendingUp, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react'
import { ProgressBar, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

export default function FeedbackPanel({ feedback, onRestart }) {
  if (!feedback) return null
  const { score = 0, summary = '', strengths = [], improvements = [], answers = [] } = feedback

  const grade = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Needs Work'
  const gradeColor = score >= 85 ? 'text-success' : score >= 70 ? 'text-primary' : score >= 50 ? 'text-warning' : 'text-error'

  return (
    <div className="space-y-8 animate-slide-up pb-10">
      {/* Score card */}
      <div className="glass bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border border-primary/30 rounded-3xl p-10 text-center shadow-glow relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Trophy className="w-40 h-40 text-primary" />
        </div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent/5 blur-[80px] rounded-full" />
        
        <div className="relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto mb-6 shadow-xl relative overflow-hidden group">
            <Trophy className="w-10 h-10 text-primary relative z-10 group-hover:scale-110 transition-transform" />
            <div className="absolute inset-0 bg-primary/10 animate-pulse" />
          </div>
          
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-2">Performance Analytics</p>
          <div className="flex items-end justify-center gap-1 mb-2">
            <span className={cn('text-7xl font-black tracking-tighter', gradeColor)}>{score}</span>
            <span className="text-muted text-2xl font-bold mb-3">/100</span>
          </div>
          <div className={cn('inline-block px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-current/20 bg-current/5', gradeColor)}>
            {grade}
          </div>
          
          {summary && (
            <p className="text-muted text-sm mt-6 max-w-xl mx-auto leading-relaxed font-medium">
              "{summary}"
            </p>
          )}

          {/* Score bar */}
          <div className="mt-8 max-w-md mx-auto">
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
               <div 
                 className={cn("h-full transition-all duration-1000", score >= 70 ? 'bg-success' : score >= 50 ? 'bg-primary' : 'bg-warning')}
                 style={{ width: `${score}%`, boxShadow: '0 0 20px currentColor' }}
               />
            </div>
          </div>
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="glass border border-success/30 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <CheckCircle2 className="w-16 h-16 text-success" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center border border-success/20">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest">Key Strengths</h4>
          </div>
          <ul className="space-y-3">
            {strengths.length === 0 ? (
              <li className="text-muted text-xs italic">Continue sessions to identify patterns.</li>
            ) : strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-muted font-medium hover:text-white transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="glass border border-warning/30 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-16 h-16 text-warning" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center border border-warning/20">
              <TrendingUp className="w-5 h-5 text-warning" />
            </div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest">Growth Areas</h4>
          </div>
          <ul className="space-y-3">
            {improvements.length === 0 ? (
              <li className="text-muted text-xs italic">Outstanding! No major gaps detected.</li>
            ) : improvements.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-muted font-medium hover:text-white transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Per-answer breakdown */}
      {answers.length > 0 && (
        <div className="glass border border-border rounded-2xl overflow-hidden relative">
          <div className="px-8 py-5 border-b border-border bg-surface/40 flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-widest text-white">Detailed Transcript Analysis</h4>
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="divide-y divide-border/50">
            {answers.map((a, i) => (
              <div key={i} className="px-8 py-6 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-black text-white tracking-tight flex-1 pr-4">
                    <span className="text-primary mr-2">Q{i + 1}</span> {a.question}
                  </p>
                  <div className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10 glass-light",
                    a.score >= 70 ? 'text-success' : a.score >= 50 ? 'text-primary' : 'text-warning'
                  )}>
                    {a.score}/100
                  </div>
                </div>
                <p className="text-sm text-muted leading-relaxed mb-4">{a.feedback}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.isArray(a.suggestions) && a.suggestions.length > 0 && (
                    <div className="space-y-2">
                       <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">Expert Tips</p>
                       <ul className="space-y-1">
                        {a.suggestions.slice(0, 2).map((s, idx) => (
                          <li key={idx} className="text-[11px] text-muted font-medium ml-2">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(a.idealFramework) && a.idealFramework.length > 0 && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Ideal Response Architecture</p>
                      <ul className="space-y-1">
                        {a.idealFramework.map((step, idx) => (
                          <li key={idx} className="text-[11px] text-muted font-medium">• {step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Restart button */}
      <div className="text-center">
        <button id="restart-interview-btn" onClick={onRestart} className="btn-outline px-8 py-3">
          <RefreshCw className="w-4 h-4" />
          Start New Interview
        </button>
      </div>
    </div>
  )
}
