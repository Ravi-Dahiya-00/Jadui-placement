'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import ResumeUpload  from '@/features/resume/ResumeUpload'
import ResumeResults from '@/features/resume/ResumeResults'
import { FileText, RefreshCw } from 'lucide-react'

export default function ResumePage() {
  const { state } = useApp()
  const [result, setResult] = useState(state.resumeData || null)

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
            Our AI engine will parse your PDF and extract skills, detect gaps, and generate a personalized improvement plan.
          </p>
          <ResumeUpload onResult={setResult} />
        </div>
      ) : (
        <ResumeResults data={result} />
      )}
    </div>
  )
}
