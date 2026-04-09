'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, FileText, CheckSquare, Mic,
  MessageSquare, TrendingUp, Zap, LogOut,
  ChevronLeft, ChevronRight, User, Github,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/supabase'
import { useApp, ACTIONS } from '@/context/AppContext'

const NAV_ITEMS = [
  { label: 'Dashboard',       href: '/dashboard',          icon: LayoutDashboard },
  { label: 'Resume Analysis', href: '/dashboard/resume',   icon: FileText        },
  { label: 'Task Planner',    href: '/dashboard/tasks',    icon: CheckSquare     },
  { label: 'Mock Interview',  href: '/dashboard/interview',icon: Mic             },
  { label: 'GitHub profile',  href: '/dashboard/github-profile', icon: Github },
  { label: 'AI Mentor Chat',  href: '/dashboard/chat',     icon: MessageSquare   },
  { label: 'Progress',        href: '/dashboard/progress', icon: TrendingUp      },
]

export default function Sidebar() {
  const pathname   = usePathname()
  const router     = useRouter()
  const { state, dispatch } = useApp()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    await signOut()
    localStorage.removeItem('auth_token')
    dispatch({ type: ACTIONS.LOGOUT })
    router.push('/')
  }

  const user = state.user
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen sticky top-0 bg-sidebar-gradient border-r border-border',
        'transition-all duration-300 ease-in-out flex-shrink-0',
        collapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-border', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-glow-sm">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">
              <span className="gradient-text-primary">Agentic</span>
              <span className="text-white"> AI</span>
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-glow-sm">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn('text-muted hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all', collapsed && 'mt-0')}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon     = item.icon
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              id={`sidebar-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={cn(
                'sidebar-link',
                isActive && 'active',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-primary' : '')} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User profile + logout */}
      <div className="border-t border-border p-2">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{name}</p>
              <p className="text-xs text-muted truncate">{user?.email || 'demo@aicareercoach.io'}</p>
            </div>
            <button onClick={handleLogout} className="text-muted hover:text-error transition-colors p-1" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{initials}</span>
            </div>
            <button onClick={handleLogout} className="text-muted hover:text-error transition-colors p-1" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
