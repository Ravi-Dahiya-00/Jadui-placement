'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Zap, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { signUp } from '@/lib/supabase'
import { useApp, ACTIONS } from '@/context/AppContext'

const PERKS = ['Free forever plan', 'AI resume analysis', 'Personalized roadmap']

export default function SignupPage() {
  const router     = useRouter()
  const { dispatch } = useApp()

  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) { setError('Please fill in all fields.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      const data = await signUp(form.email, form.password)
      const user = data?.user || {
        email: form.email,
        id: `user-${Date.now()}`,
        user_metadata: { full_name: form.name },
      }
      if (data?.session?.access_token) localStorage.setItem('auth_token', data.session.access_token)
      dispatch({ type: ACTIONS.SET_USER, payload: user })
      router.push('/dashboard')
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = () => {
    const p = form.password
    if (!p) return null
    if (p.length < 6)  return { label: 'Weak',   color: 'bg-error',   width: 'w-1/3'  }
    if (p.length < 10) return { label: 'Fair',    color: 'bg-warning', width: 'w-2/3'  }
    return               { label: 'Strong', color: 'bg-success', width: 'w-full' }
  }
  const strength = passwordStrength()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="orb w-[500px] h-[500px] bg-secondary/10 top-0 left-0" />
      <div className="orb w-[400px] h-[400px] bg-primary/8 bottom-0 right-0" />

      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">
                <span className="gradient-text-primary">Agentic</span>
                <span className="text-white"> AI</span>
              </span>
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">Start your journey</h1>
            <p className="text-muted text-sm">Create your account and get placement-ready</p>
          </div>

          {/* Perks row */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {PERKS.map((p) => (
              <span key={p} className="flex items-center gap-1.5 text-xs text-muted bg-surface border border-border px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-success" /> {p}
              </span>
            ))}
          </div>

          <div className="glass rounded-2xl p-8">
            {error && (
              <div className="bg-error/10 border border-error/25 text-error text-sm rounded-lg px-4 py-3 mb-6">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" id="signup-form">
              {/* Name */}
              <div>
                <label htmlFor="signup-name" className="block text-sm font-medium text-muted mb-1.5">Full Name</label>
                <input id="signup-name" name="name" type="text" autoComplete="name"
                  value={form.name} onChange={handleChange} placeholder="Alex Johnson"
                  className="input-base" />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-muted mb-1.5">Email address</label>
                <input id="signup-email" name="email" type="email" autoComplete="email"
                  value={form.email} onChange={handleChange} placeholder="you@example.com"
                  className="input-base" />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-muted mb-1.5">Password</label>
                <div className="relative">
                  <input id="signup-password" name="password" type={showPwd ? 'text' : 'password'}
                    autoComplete="new-password" value={form.password} onChange={handleChange}
                    placeholder="Min. 8 characters" className="input-base pr-12" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors p-1">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Strength meter */}
                {strength && (
                  <div className="mt-2">
                    <div className="h-1 w-full bg-surface rounded-full overflow-hidden">
                      <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300 rounded-full`} />
                    </div>
                    <p className="text-xs text-muted mt-1">{strength.label} password</p>
                  </div>
                )}
              </div>

              <button id="signup-submit-btn" type="submit" disabled={loading}
                className="btn-primary w-full py-3 text-sm justify-center disabled:opacity-60">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-xs text-muted mt-5">
              By signing up, you agree to our{' '}
              <a href="#" className="text-primary hover:underline">Terms</a> and{' '}
              <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
            </p>
          </div>

          <p className="text-center text-sm text-muted mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:text-primary-hover font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
