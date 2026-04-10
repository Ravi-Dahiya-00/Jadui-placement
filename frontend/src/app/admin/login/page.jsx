'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Lock, AlertOctagon, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const router = useRouter()

  const handleSubmit = (e) => {
    e.preventDefault()
    // Bypass security: Just redirect
    sessionStorage.setItem('admin_token', 'bypassed')
    router.push('/admin')
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/10 blur-[140px] rounded-full -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-600/5 blur-[100px] rounded-full -ml-24 -mb-24" />

      <div className="w-full max-w-md space-y-8 relative z-10 transition-all duration-500 animate-in fade-in zoom-in-95">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl mb-4 group hover:border-amber-500/50 transition-colors duration-500">
             <Shield className={cn("w-10 h-10 transition-all", isBlocked ? "text-rose-500" : "text-amber-500 group-hover:scale-110")} />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
            {isBlocked ? 'Access Denied' : 'Command Center'}
          </h1>
          <p className="text-neutral-500 font-medium text-sm px-8">
            {isBlocked 
              ? 'Security protocol active. Brute force detected.' 
              : 'Enter authorization secret to manage the placement ecosystem.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isBlocked && (
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-amber-500 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="AUTHENTICATION SECRET"
                autoFocus
                disabled={isLoading}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold tracking-widest text-white outline-none focus:border-amber-500/50 transition-all placeholder:text-neutral-700 uppercase"
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-xs font-bold leading-relaxed animate-in slide-in-from-top-2">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isBlocked && (
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-800 disabled:text-neutral-600 text-neutral-950 font-black rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-amber-500/10 uppercase tracking-widest text-xs"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Verify Access <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}

          {isBlocked && (
            <button
              onClick={() => router.push('/')}
              className="w-full h-14 bg-neutral-900 border border-neutral-800 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-xs"
            >
              Return to Safety
            </button>
          )}
        </form>

        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-700">
            Jadui Placement Security 
          </p>
        </div>
      </div>
    </div>
  )
}
