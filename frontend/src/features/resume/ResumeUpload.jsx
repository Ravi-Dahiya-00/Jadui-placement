'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Loader2, X, CheckCircle2 } from 'lucide-react'
import { useApp, ACTIONS } from '@/context/AppContext'
import { cn } from '@/lib/utils'

export default function ResumeUpload({ onResult }) {
  const { dispatch } = useApp()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onDrop = useCallback((acceptedFiles) => {
    const f = acceptedFiles[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { 
      setError('File must be under 5 MB.')
      return 
    }
    setError('')
    setFile(f)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1
  })

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('jdText', 'Software Developer / Engineer Role')

      const response = await fetch('/api/resume/analyze', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze resume.')
      }

      dispatch({ type: ACTIONS.SET_RESUME, payload: data })
      onResult?.(data)
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer outline-none',
          isDragActive ? 'border-primary bg-primary/10 scale-105' : 'border-border hover:border-primary/50 hover:bg-primary/5',
          file && 'border-success/50 bg-success/5 scale-100'
        )}
      >
        <input {...getInputProps()} />

        {file ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{file.name}</p>
              <p className="text-xs text-muted mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null) }}
              className="text-xs text-muted hover:text-error flex items-center gap-1 transition-colors mt-2"
            >
              <X className="w-3 h-3" /> Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 pointer-events-none">
            <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200',
              isDragActive ? 'bg-primary/20 scale-110' : 'bg-primary/10')}>
              <Upload className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-white font-medium">Drop your resume here</p>
              <p className="text-muted text-sm mt-1">or click to browse • PDF only • Max 5 MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-error text-sm flex items-center gap-2">
          <X className="w-4 h-4" /> {error}
        </p>
      )}

      {/* Upload button */}
      <button
        id="analyze-resume-btn"
        onClick={handleUpload}
        disabled={!file || loading}
        className="btn-primary w-full py-3 text-sm justify-center disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        {loading ? 'Analyzing your resume...' : 'Analyze Resume'}
      </button>

      {loading && (
        <div className="text-center">
          <p className="text-xs text-muted animate-pulse">AI is parsing your resume with Groq logic. This takes a few seconds...</p>
        </div>
      )}
    </div>
  )
}
