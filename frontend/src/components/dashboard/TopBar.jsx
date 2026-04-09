'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Search, Menu, X, Zap,
         LayoutDashboard, FileText, CheckSquare,
         Mic, MessageSquare, TrendingUp, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/supabase'
import { useApp, ACTIONS } from '@/context/AppContext'

const PAGE_TITLES = {
  '/dashboard':          'Overview',
  '/dashboard/resume':   'Resume Analysis',
  '/dashboard/tasks':    'Task Planner',
  '/dashboard/interview':'Mock Interview',
  '/dashboard/chat':     'AI Mentor Chat',
  '/dashboard/progress': 'Progress Tracker',
}

const MOB_NAV = [
  { label: 'Overview',  href: '/dashboard',          icon: LayoutDashboard },
  { label: 'Resume',    href: '/dashboard/resume',   icon: FileText        },
  { label: 'Tasks',     href: '/dashboard/tasks',    icon: CheckSquare     },
  { label: 'Interview', href: '/dashboard/interview',icon: Mic             },
  { label: 'Chat',      href: '/dashboard/chat',     icon: MessageSquare   },
  { label: 'Progress',  href: '/dashboard/progress', icon: TrendingUp      },
]

export default function TopBar() {
  const pathname   = usePathname()
  const router     = useRouter()
  const { state, dispatch } = useApp()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [notifOpen,  setNotifOpen]  = useState(false)

  const pageTitle  = PAGE_TITLES[pathname] || 'Dashboard'
  const user       = state.user
  const name       = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const initials   = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  const unread     = state.notifications.filter((n) => !n.read).length

  const handleLogout = async () => {
    await signOut()
    localStorage.removeItem('auth_token')
    dispatch({ type: ACTIONS.LOGOUT })
    router.push('/')
  }

  return (
    <>
      <header className="h-16 bg-surface/60 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
        {/* Left: mobile menu + page title */}
        <div className="flex items-center gap-3">
          <button className="md:hidden text-muted hover:text-white p-2 rounded-lg hover:bg-white/5 transition-all"
            onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-white text-base">{pageTitle}</h2>
        </div>

        {/* Right: search + notifications + avatar */}
        <div className="flex items-center gap-2">
          {/* Search (desktop) */}
          <div className="hidden sm:flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 text-muted text-sm w-52 cursor-pointer hover:border-primary/30 transition-colors">
            <Search className="w-3.5 h-3.5" />
            <span className="text-xs">Search...</span>
            <span className="ml-auto text-xs bg-surface px-1.5 py-0.5 rounded">⌘K</span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => setNotifOpen(!notifOpen)}
              className="relative text-muted hover:text-white p-2 rounded-lg hover:bg-white/5 transition-all">
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-card-hover overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-white">Notifications</p>
                </div>
                {state.notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-muted text-sm">No new notifications</div>
                ) : (
                  state.notifications.slice(0, 5).map((n, i) => (
                    <div key={i} className="px-4 py-3 hover:bg-surface/60 transition-colors border-b border-border/50 last:border-0">
                      <p className="text-sm text-white">{n.title}</p>
                      <p className="text-xs text-muted mt-0.5">{n.body}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center cursor-pointer hover:border-primary/60 transition-colors">
            <span className="text-xs font-bold text-primary">{initials}</span>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <nav className="relative w-72 bg-surface border-r border-border h-full flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-sm">
                  <span className="gradient-text-primary">Agentic</span>
                  <span className="text-white"> AI</span>
                </span>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="text-muted hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer nav */}
            <div className="flex-1 py-4 px-2 space-y-1">
              {MOB_NAV.map((item) => {
                const Icon     = item.icon
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <Link key={item.href} href={item.href} onClick={() => setDrawerOpen(false)}
                    className={cn('sidebar-link', isActive && 'active')}>
                    <Icon className={cn('w-4 h-4', isActive ? 'text-primary' : '')} />
                    {item.label}
                  </Link>
                )
              })}
            </div>

            {/* Drawer footer */}
            <div className="border-t border-border p-3">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{name}</p>
                  <p className="text-xs text-muted truncate">{user?.email || 'demo@aicareercoach.io'}</p>
                </div>
                <button onClick={handleLogout} className="text-muted hover:text-error transition-colors p-1">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
