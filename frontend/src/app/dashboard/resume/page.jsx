'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'
import ResumeUpload  from '@/features/resume/ResumeUpload'
import ResumeResults from '@/features/resume/ResumeResults'
import { FileText, RefreshCw } from 'lucide-react'

export default function ResumePage() {
  const { state } = useApp()
  const [result, setResult] = useState(state.resumeData || null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const loadHistory = async () => {
    try {
      setHistoryLoading(true)
      const response = await fetch('/api/resume/history?limit=10', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to load history')
      setHistory(data.history || [])
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Resume Analysis
          </h1>
          <p className="text-muted text-sm mt-1">
            Upload your resume and get an AI-powered skill gap analysis with actionable recommendations.
          </p>
        </div>
        {result && (
          <button
            onClick={() => setResult(null)}
            className="btn-outline text-xs px-4 py-2 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Re-upload
          </button>
        )}
      </div>

      {/* Upload or results */}
      {!result ? (
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-white mb-1">Upload Your Resume</h2>
          <p className="text-muted text-sm mb-6">
            Our AI engine will parse your resume (PDF/DOCX/TXT), detect skills and gaps, and generate a personalized improvement plan.
          </p>
          <ResumeUpload onResult={setResult} onUploaded={loadHistory} />
        </div>
      ) : (
        <ResumeResults data={result} />
      )}

      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">My Uploaded Resumes History</h2>
          <button onClick={loadHistory} className="btn-outline text-xs px-3 py-1.5">Refresh</button>
        </div>
        {historyLoading ? (
          <p className="text-sm text-muted">Loading history...</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted">No uploaded resumes yet.</p>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.result_id} className="rounded-xl border border-border bg-surface/40 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{item.candidate_name || 'Unknown Candidate'}</p>
                  <p className="text-xs text-muted">{item.score}/100</p>
                </div>
                <p className="text-xs text-muted mt-1">{item.filename}</p>
                <p className="text-xs text-muted mt-1">
                  {item.role_target || 'General Role'} • {item.experience_level || 'unknown'} • {item.created_at?.slice(0, 10)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
