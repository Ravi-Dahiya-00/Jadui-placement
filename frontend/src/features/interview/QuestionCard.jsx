'use client'

import { useState } from 'react'
import { Send, Loader2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function QuestionCard({ question, index, total, onSubmit, loading }) {
  const [answer, setAnswer] = useState('')

  const handleSubmit = () => {
    if (!answer.trim()) return
    onSubmit(answer.trim())
    setAnswer('')
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Progress header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/40">
        <span className="text-xs font-medium text-muted">
          Question {index} of {total}
        </span>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1 rounded-full transition-all duration-300',
                  i < index - 1 ? 'w-6 bg-success' : i === index - 1 ? 'w-6 bg-primary animate-pulse-glow' : 'w-4 bg-border'
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted">{Math.round(((index - 1) / total) * 100)}%</span>
        </div>
      </div>

      {/* Question */}
      <div className="px-6 py-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-primary">{index}</span>
          </div>
          <div>
            {question.type && (
              <span className="inline-block text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full mb-2">
                {question.type}
              </span>
            )}
            <p className="text-white font-medium text-base leading-relaxed">{question.text}</p>
            {question.hint && (
              <p className="text-muted text-sm mt-2 italic">💡 Hint: {question.hint}</p>
            )}
          </div>
        </div>

        {/* Answer textarea */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted">Your Answer</label>
          <textarea
            id={`answer-textarea-${index}`}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here... Be as detailed as possible."
            rows={5}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white text-sm
                       placeholder:text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30
                       resize-none transition-all duration-200"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">{answer.length} characters</span>
            <button
              id={`submit-answer-btn-${index}`}
              onClick={handleSubmit}
              disabled={!answer.trim() || loading}
              className="btn-primary text-sm px-6 py-2.5 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? 'Evaluating...' : 'Submit Answer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
