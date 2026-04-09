import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  || ''
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/**
 * Supabase client singleton.
 * Falls back gracefully if env vars are not set (demo / dev mode).
 */
export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

/**
 * Sign up a new user with email + password.
 */
export async function signUp(email, password) {
  if (!supabase) return mockSignUp(email)
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

/**
 * Sign in an existing user.
 */
export async function signIn(email, password) {
  if (!supabase) return mockSignIn(email)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

/**
 * Get the currently authenticated user.
 */
export async function getCurrentUser() {
  if (!supabase) return mockUser
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ─── Demo / mock auth for development without Supabase ───────────────────────

const mockUser = {
  id:    'demo-user-001',
  email: 'demo@aicareercoach.io',
  user_metadata: { full_name: 'Alex Johnson' },
}

async function mockSignIn(email) {
  return { user: { ...mockUser, email }, session: { access_token: 'mock-token' } }
}

async function mockSignUp(email) {
  return { user: { ...mockUser, email }, session: { access_token: 'mock-token' } }
}
