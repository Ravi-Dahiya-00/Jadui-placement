import { CheckCircle2, Clock, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/context/AppContext'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const ROADMAP = [
  {
    day: 'Mon', date: 'Apr 7', status: 'done',
    tasks: ['Solve 3 LeetCode Easy', 'Read OS Chapter 1', 'Update resume skills section'],
  },
  {
    day: 'Tue', date: 'Apr 8', status: 'done',
    tasks: ['LeetCode Medium × 2', 'Complete OOP revision', 'Mock HR interview'],
  },
  {
    day: 'Wed', date: 'Apr 9', status: 'active',
    tasks: ['System Design intro', 'LeetCode Medium × 2', 'AI mock interview session'],
  },
  {
    day: 'Thu', date: 'Apr 10', status: 'upcoming',
    tasks: ['DBMS concepts review', 'Build mini REST API', 'Behavioral prep'],
  },
  {
    day: 'Fri', date: 'Apr 11', status: 'upcoming',
    tasks: ['LeetCode Hard × 1', 'System Design deep dive', 'GitHub profile update'],
  },
  {
    day: 'Sat', date: 'Apr 12', status: 'upcoming',
    tasks: ['Full mock interview', 'Review feedback', 'Project deployment'],
  },
  {
    day: 'Sun', date: 'Apr 13', status: 'upcoming',
    tasks: ['Weekly review', 'Plan next week', 'Rest & revision'],
  },
]

const STATUS_STYLES = {
  done:     { border: 'border-success/30',   bg: 'bg-success/10',   icon: CheckCircle2, iconColor: 'text-success',  label: 'Completed' },
  active:   { border: 'border-primary/40',   bg: 'bg-primary/10',   icon: Clock,        iconColor: 'text-primary',  label: 'Today'     },
  upcoming: { border: 'border-border',        bg: 'bg-card',         icon: Lock,         iconColor: 'text-muted/40', label: 'Upcoming'  },
}

export default function WeeklyRoadmap() {
  const { state } = useApp()
  const roadmap = state.roadmap?.length ? state.roadmap : ROADMAP

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
      {roadmap.map((day) => {
        const s    = STATUS_STYLES[day.status]
        const Icon = s.icon
        return (
          <div
            key={day.day}
            className={cn(
              'border rounded-xl p-4 transition-all duration-200',
              s.bg, s.border,
              day.status === 'active' && 'ring-1 ring-primary/30 shadow-glow-sm',
              day.status === 'upcoming' && 'opacity-70'
            )}
          >
            {/* Day header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className={cn('text-sm font-bold', day.status === 'active' ? 'text-primary' : 'text-white')}>
                  {day.day}
                </p>
                <p className="text-xs text-muted">{day.date}</p>
              </div>
              <Icon className={cn('w-4 h-4', s.iconColor)} />
            </div>

            {/* Tasks */}
            <ul className="space-y-1.5">
              {day.tasks.map((task, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs">
                  <div className={cn('w-1 h-1 rounded-full mt-1.5 flex-shrink-0',
                    day.status === 'done' ? 'bg-success' : day.status === 'active' ? 'bg-primary' : 'bg-muted/40')} />
                  <span className={cn(
                    'leading-relaxed',
                    day.status === 'done' ? 'text-muted line-through' : 'text-muted'
                  )}>
                    {task}
                  </span>
                </li>
              ))}
            </ul>

            {/* Status badge */}
            <div className="mt-3 pt-3 border-t border-current/10">
              <span className={cn('text-xs font-medium', s.iconColor)}>{s.label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
