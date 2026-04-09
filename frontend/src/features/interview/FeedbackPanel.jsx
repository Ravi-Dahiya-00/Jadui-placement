import { Trophy, TrendingUp, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react'
import { ProgressBar, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

export default function FeedbackPanel({ feedback, onRestart }) {
  if (!feedback) return null
  const { score = 0, summary = '', strengths = [], improvements = [], answers = [] } = feedback

  const grade = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Needs Work'
  const gradeColor = score >= 85 ? 'text-success' : score >= 70 ? 'text-primary' : score >= 50 ? 'text-warning' : 'text-error'

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Score card */}
      <div className="bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/10 border border-primary/25 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <p className="text-muted text-sm mb-1">Interview Score</p>
        <div className="flex items-end justify-center gap-1 mb-2">
          <span className={cn('text-6xl font-black', gradeColor)}>{score}</span>
          <span className="text-muted text-xl mb-2">/100</span>
        </div>
        <span className={cn('text-lg font-bold', gradeColor)}>{grade}</span>
        {summary && <p className="text-muted text-sm mt-4 max-w-lg mx-auto leading-relaxed">{summary}</p>}

        {/* Score bar */}
        <div className="mt-6 max-w-sm mx-auto">
          <ProgressBar value={score} max={100} color={score >= 70 ? 'success' : score >= 50 ? 'primary' : 'warning'} />
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="bg-card border border-success/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-success/15 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
            <h4 className="font-semibold text-white">Strengths</h4>
          </div>
          <ul className="space-y-2">
            {strengths.length === 0 ? (
              <li className="text-muted text-sm">Keep practising to identify strengths.</li>
            ) : strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted">
                <div className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 flex-shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="bg-card border border-warning/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-warning/15 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-warning" />
            </div>
            <h4 className="font-semibold text-white">Areas to Improve</h4>
          </div>
          <ul className="space-y-2">
            {improvements.length === 0 ? (
              <li className="text-muted text-sm">Great job! No major gaps found.</li>
            ) : improvements.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted">
                <div className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Per-answer breakdown */}
      {answers.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h4 className="font-semibold text-white">Answer-by-Answer Breakdown</h4>
          </div>
          <div className="divide-y divide-border">
            {answers.map((a, i) => (
              <div key={i} className="px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-white">Q{i + 1}: {a.question}</p>
                  <Badge variant={a.score >= 70 ? 'success' : a.score >= 50 ? 'default' : 'warning'}>
                    {a.score}/100
                  </Badge>
                </div>
                <p className="text-xs text-muted leading-relaxed">{a.feedback}</p>
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
