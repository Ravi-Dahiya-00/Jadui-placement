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
                'flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200',
                isSelected
                  ? `${role.bg} ${role.border} ring-1 ring-current shadow-glow-sm`
                  : 'bg-card border-border hover:border-primary/30 hover:bg-primary/5'
              )}
            >
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', role.bg)}>
                <Icon className={cn('w-5 h-5', role.color)} />
              </div>
              <span className={cn('text-sm font-medium', isSelected ? role.color : 'text-white')}>
                {role.label}
              </span>
              {isSelected && (
                <div className={cn('ml-auto w-2 h-2 rounded-full', role.bg.replace('/10', ''), 'bg-current', role.color)} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
