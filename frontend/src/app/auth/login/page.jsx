'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Zap, ArrowRight, Loader2 } from 'lucide-react'
import { signIn } from '@/lib/supabase'
import { useApp, ACTIONS } from '@/context/AppContext'

export default function LoginPage() {
  const router   = useRouter()
  const { dispatch } = useApp()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    try {
      const data = await signIn(form.email, form.password)
      const user = data?.user || { email: form.email, id: 'demo', user_metadata: { full_name: 'Demo User' } }
      if (data?.session?.access_token) localStorage.setItem('auth_token', data.session.access_token)
      dispatch({ type: ACTIONS.SET_USER, payload: user })
      router.push('/dashboard')
    } catch (err) {
      setError(err.message || 'Invalid credentials. Try demo@aicareercoach.io')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setForm({ email: 'demo@aicareercoach.io', password: 'demo1234' })
    setLoading(true)
    try {
      const data = await signIn('demo@aicareercoach.io', 'demo1234')
      dispatch({ type: ACTIONS.SET_USER, payload: data?.user || { email: 'demo@aicareercoach.io', id: 'demo', user_metadata: { full_name: 'Alex Johnson' } } })
      router.push('/dashboard')
    } catch {
      dispatch({ type: ACTIONS.SET_USER, payload: { email: 'demo@aicareercoach.io', id: 'demo', user_metadata: { full_name: 'Alex Johnson' } } })
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background orbs */}
      <div className="orb w-[500px] h-[500px] bg-primary/10 top-0 right-0" />
      <div className="orb w-[400px] h-[400px] bg-secondary/8 bottom-0 left-0" />

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
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-muted text-sm">Sign in to continue your career journey</p>
          </div>

          {/* Form card */}
          <div className="glass rounded-2xl p-8">
            {error && (
              <div className="bg-error/10 border border-error/25 text-error text-sm rounded-lg px-4 py-3 mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" id="login-form">
              {/* Email */}
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-muted mb-1.5">Email address</label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="input-base"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-password" className="text-sm font-medium text-muted">Password</label>
                  <a href="#" className="text-xs text-primary hover:text-primary-hover transition-colors">Forgot password?</a>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    name="password"
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="input-base pr-12"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors p-1">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button id="login-submit-btn" type="submit" disabled={loading}
                className="btn-primary w-full py-3 text-sm justify-center disabled:opacity-60">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Demo login */}
            <button id="demo-login-btn" onClick={handleDemoLogin} disabled={loading}
              className="btn-outline w-full py-3 text-sm justify-center">
              🚀 Try Demo Account
            </button>
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-muted mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-primary hover:text-primary-hover font-medium transition-colors">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
