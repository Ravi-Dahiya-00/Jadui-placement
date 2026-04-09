'use client'

import { Cpu, Code2, Database, Network, Briefcase, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

const ROLES = [
  { id: 'sde',        label: 'SDE / Backend',       icon: Code2,    color: 'text-primary',   bg: 'bg-primary/10',   border: 'border-primary/25'   },
  { id: 'frontend',   label: 'Frontend / React',     icon: Brain,    color: 'text-accent',    bg: 'bg-accent/10',    border: 'border-accent/25'    },
  { id: 'fullstack',  label: 'Full Stack',            icon: Cpu,      color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/25' },
  { id: 'data',       label: 'Data Science / ML',     icon: Database, color: 'text-warning',   bg: 'bg-warning/10',   border: 'border-warning/25'   },
  { id: 'networking', label: 'System Design',         icon: Network,  color: 'text-success',   bg: 'bg-success/10',   border: 'border-success/25'   },
  { id: 'pm',         label: 'Product Manager',       icon: Briefcase,color: 'text-muted',     bg: 'bg-muted/10',     border: 'border-muted/25'     },
]

export default function RoleSelector({ selected, onSelect }) {
  return (
    <div>
      <h3 className="text-white font-semibold mb-1">Select a Role</h3>
      <p className="text-muted text-sm mb-5">The AI will generate role-specific questions tailored to your skill level.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ROLES.map((role) => {
          const Icon    = role.icon
          const isSelected = selected === role.id
          return (
            <button
              key={role.id}
              id={`role-${role.id}`}
              onClick={() => onSelect(role.id)}
              className={cn(
                'glass relative flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border text-center transition-all duration-500 overflow-hidden group',
                isSelected
                  ? `${role.border.replace('border-', 'border-')} ring-1 ring-current shadow-glow-sm scale-[1.02]`
                  : 'border-border/40 hover:border-primary/40 hover:shadow-glow translate-y-0 hover:-translate-y-1'
              )}
            >
              <div className={cn(
                'absolute top-0 right-0 w-20 h-20 blur-2xl rounded-full -mr-10 -mt-10 transition-colors duration-500',
                isSelected ? 'bg-primary/20' : 'bg-transparent group-hover:bg-primary/5'
              )} />
              
              <div className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500',
                isSelected ? role.bg.replace('/10', '/30') : 'bg-surface/50 border border-border group-hover:bg-primary/10'
              )}>
                <Icon className={cn('w-7 h-7', isSelected ? role.color : 'text-muted group-hover:text-primary')} />
              </div>

              <div>
                <span className={cn('text-sm font-bold tracking-tight', isSelected ? 'text-white' : 'text-muted group-hover:text-white')}>
                  {role.label}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
