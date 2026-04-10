'use client'

import { useState, useEffect } from 'react'
import { Shield, Users, BarChart3, Settings, LogOut, LayoutDashboard, Zap, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useApp, ACTIONS } from '@/context/AppContext'
import { signOut } from '@/lib/supabase'
import TPOAssistant from '@/features/admin/TPOAssistant'

const ADMIN_NAV = [
  { label: 'Command Center', href: '/admin',        icon: LayoutDashboard },
  { label: 'Student Roster', href: '/admin/students', icon: Users          },
  { label: 'Batch Analytics',href: '/admin/batch',    icon: BarChart3       },
  { label: 'Training Squads',href: '/admin/workshops', icon: Zap            },
  { label: 'TPO Settings',   href: '/admin/settings', icon: Settings        },
]

export default function AdminLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const { state, dispatch } = useApp()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Security check: Verify Admin Token
  useEffect(() => {
    const adminToken = sessionStorage.getItem('admin_token')
    
    // Allow the login page itself to load
    if (pathname === '/admin/login') return

    if (!adminToken) {
      router.push('/admin/login')
      return
    }

    // Role check (optional but good as a secondary layer if using Supabase roles)
    if (!state.isLoading && state.isAuthenticated && state.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [state.user, state.role, state.isLoading, state.isAuthenticated, pathname])

  const handleLogout = async () => {
    await signOut()
    dispatch({ type: ACTIONS.LOGOUT })
    router.push('/')
  }

  return (
    <div className="flex h-screen bg-neutral-950 font-sans text-neutral-200 overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-72 h-screen border-r border-neutral-800 bg-neutral-900/50 backdrop-blur-xl shrink-0">
        <div className="h-20 flex items-center px-8 border-b border-neutral-800">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
               <Shield className="w-5 h-5 text-neutral-950" />
             </div>
             <div>
               <h1 className="text-sm font-black text-white uppercase tracking-tighter">Placement</h1>
               <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Command Center</p>
             </div>
           </div>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          {ADMIN_NAV.map((item) => {
             const Icon = item.icon
             const isActive = pathname === item.href
             return (
               <Link 
                 key={item.href} 
                 href={item.href}
                 className={cn(
                   "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group",
                   isActive 
                     ? "bg-amber-500/10 border border-amber-500/20 text-white shadow-inner" 
                     : "text-neutral-500 hover:text-neutral-200 hover:bg-white/5"
                 )}
               >
                 <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-amber-500" : "")} />
                 <span className="text-sm font-bold tracking-tight">{item.label}</span>
               </Link>
             )
          })}
        </nav>

        <div className="p-6 border-t border-neutral-800">
           <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-neutral-500 hover:text-red-400 hover:bg-red-500/5 transition-all">
             <LogOut className="w-5 h-5" />
             <span className="text-sm font-bold">Sign Out</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between px-6 z-50">
           <div className="flex items-center gap-2">
             <Zap className="w-5 h-5 text-amber-500" />
             <span className="font-black text-xs uppercase text-white tracking-widest">TPO Panel</span>
           </div>
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
             {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
           </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-10 relative">
          {/* Subtle Ambient BG */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none" />
          <div className="relative z-10 w-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        
        {/* Placement Readiness Bot */}
        <TPOAssistant />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}>
           <div className="w-64 h-full bg-neutral-900 p-6 space-y-4" onClick={e => e.stopPropagation()}>
              {/* Mobile menu items... */}
           </div>
        </div>
      )}
    </div>
  )
}
