import { CheckCircle2, AlertTriangle, Lightbulb, Target } from 'lucide-react'
import { Badge, ProgressBar } from '@/components/ui'

export default function ResumeResults({ data }) {
  if (!data) return null

  const {
    skills = [],
    weaknesses = [],
    recommendations = [],
    score = 0,
    domain = '',
    sectionReviews = [],
  } = data

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Score banner */}
      <div className="bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/25 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-1">Resume Score</p>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-black text-white">{score}</span>
              <span className="text-muted text-lg mb-1">/100</span>
            </div>
            {domain && <p className="text-primary text-sm font-medium mt-1">{domain}</p>}
          </div>
          <div className="flex-shrink-0 w-full sm:w-48">
            <p className="text-xs text-muted mb-2">Career readiness</p>
            <ProgressBar value={score} max={100} color={score >= 75 ? 'success' : score >= 50 ? 'primary' : 'warning'} />
            <p className="text-xs text-muted mt-1.5">
              {score >= 75 ? '🟢 Strong profile' : score >= 50 ? '🟡 Needs improvement' : '🔴 Significant gaps'}
            </p>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-success/15 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <h4 className="font-semibold text-white">Detected Skills</h4>
          <span className="ml-auto text-xs text-muted">{skills.length} found</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <Badge key={skill} variant="success">{skill}</Badge>
          ))}
        </div>
      </div>

      {/* Weaknesses */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-warning/15 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-warning" />
          </div>
          <h4 className="font-semibold text-white">Skill Gaps</h4>
          <span className="ml-auto text-xs text-muted">{weaknesses.length} areas</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {weaknesses.map((w) => (
            <Badge key={w} variant="warning">{w}</Badge>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-primary" />
          </div>
          <h4 className="font-semibold text-white">AI Recommendations</h4>
        </div>
        <ol className="space-y-3">
          {recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-muted leading-relaxed">{rec}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Section-wise AI review */}
      {sectionReviews.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <h4 className="font-semibold text-white">Section-wise AI Resume Review</h4>
          </div>

          {sectionReviews.map((review, idx) => {
            const title = String(review.section || `section-${idx + 1}`)
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase())
            const issues = Array.isArray(review.issues) ? review.issues : []
            const tips = Array.isArray(review.tips) ? review.tips : []
            const improved = String(review.improved_block || '').trim()
            const bsFactor = Number(review.bs_factor || 0)

            return (
              <div key={`${title}-${idx}`} className="rounded-lg border border-border p-4 bg-surface/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-semibold text-white">{title}</h5>
                  {bsFactor > 0 ? (
                    <span className="text-xs text-warning">BS factor: {bsFactor}/10</span>
                  ) : null}
                </div>

                {issues.length > 0 && (
                  <div>
                    <p className="text-xs text-muted mb-1">Brutal assessment</p>
                    <ul className="space-y-1">
                      {issues.slice(0, 5).map((issue, issueIdx) => (
                        <li key={issueIdx} className="text-sm text-muted">- {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {improved && (
                  <div>
                    <p className="text-xs text-muted mb-1">Improved version</p>
                    <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{improved}</p>
                  </div>
                )}

                {tips.length > 0 && (
                  <div>
                    <p className="text-xs text-muted mb-1">Final tips</p>
                    <ul className="space-y-1">
                      {tips.slice(0, 3).map((tip, tipIdx) => (
                        <li key={tipIdx} className="text-sm text-muted">- {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
