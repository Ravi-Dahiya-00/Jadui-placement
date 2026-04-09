'use client'

import Link from 'next/link'
import { Target, CheckSquare, Mic, Flame, ArrowRight, Circle } from 'lucide-react'
import StatCard       from '@/components/dashboard/StatCard'
import { ProgressBar } from '@/components/ui'
import { useApp, ACTIONS } from '@/context/AppContext'
import { cn } from '@/lib/utils'

const CATEGORY_COLORS = {
  DSA:       'text-primary bg-primary/10',
  Design:    'text-secondary bg-secondary/10',
  Interview: 'text-accent bg-accent/10',
  Project:   'text-success bg-success/10',
  Core:      'text-warning bg-warning/10',
  Career:    'text-muted bg-muted/10',
}

export default function DashboardPage() {
  const { state, dispatch } = useApp()
  const { progress, tasks } = state

  const todayTasks  = tasks.filter((t) => t.due === 'Today')
  const completedToday = todayTasks.filter((t) => t.completed).length

  const handleComplete = (id) => {
    dispatch({ type: ACTIONS.COMPLETE_TASK, payload: id })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Good {getGreeting()},{' '}
          <span className="gradient-text-primary">
            {state.user?.user_metadata?.full_name?.split(' ')[0] || 'there'} 👋
          </span>
        </h1>
        <p className="text-muted text-sm mt-1">Here&apos;s your placement readiness snapshot for today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          id="stat-readiness"
          title="Readiness Score"
          value={`${progress.readinessScore}%`}
          subtitle="Overall career readiness"
          icon={Target}
          color="primary"
          trend="up"
          trendValue="+4% this week"
        />
        <StatCard
          id="stat-tasks"
          title="Tasks Complete"
          value={`${progress.taskCompletion}%`}
          subtitle={`${completedToday}/${todayTasks.length} tasks today`}
          icon={CheckSquare}
          color="success"
          trend="up"
          trendValue="+8%"
        />
        <StatCard
          id="stat-interview"
          title="Interview Score"
          value={`${progress.interviewScore}%`}
          subtitle="Last mock session"
          icon={Mic}
          color="accent"
          trend="up"
          trendValue="+6 pts"
        />
        <StatCard
          id="stat-streak"
          title="Day Streak"
          value={`${progress.streak}🔥`}
          subtitle="Keep it going!"
          icon={Flame}
          color="warning"
          trend="up"
          trendValue="+1 today"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's tasks */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="font-semibold text-white">Today&apos;s Tasks</h3>
            <Link href="/dashboard/tasks" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {todayTasks.length === 0 ? (
              <div className="px-6 py-8 text-center text-muted text-sm">No tasks for today.</div>
            ) : (
              todayTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface/40 transition-colors group">
                  <button onClick={() => handleComplete(task.id)} className="flex-shrink-0">
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200',
                      task.completed
                        ? 'bg-success border-success'
                        : 'border-muted/40 group-hover:border-primary'
                    )}>
                      {task.completed && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium truncate', task.completed ? 'line-through text-muted' : 'text-white')}>
                      {task.title}
                    </p>
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0', CATEGORY_COLORS[task.category] || 'text-muted bg-muted/10')}>
                    {task.category}
                  </span>
                </div>
              ))
            )}
          </div>
          {/* Progress bar */}
          {todayTasks.length > 0 && (
            <div className="px-6 py-4 border-t border-border">
              <div className="flex items-center justify-between text-xs text-muted mb-2">
                <span>Daily progress</span>
                <span className="font-medium text-white">{completedToday}/{todayTasks.length} done</span>
              </div>
              <ProgressBar value={completedToday} max={todayTasks.length} color="success" />
            </div>
          )}
        </div>

        {/* Skill overview */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="font-semibold text-white">Skill Levels</h3>
            <Link href="/dashboard/progress" className="text-xs text-primary hover:underline flex items-center gap-1">
              Details <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="px-6 py-4 space-y-4">
            {progress.skillData.map((skill) => (
              <div key={skill.name}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted font-medium">{skill.name}</span>
                  <span className="text-white font-semibold">{skill.level}%</span>
                </div>
                <ProgressBar value={skill.level} max={100} color={skill.level >= 75 ? 'success' : skill.level >= 50 ? 'primary' : 'warning'} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Upload Resume',   href: '/dashboard/resume',    emoji: '📄', color: 'hover:border-primary/40 hover:bg-primary/5'    },
            { label: 'Start Interview', href: '/dashboard/interview', emoji: '🎤', color: 'hover:border-accent/40 hover:bg-accent/5'      },
            { label: 'Ask AI Mentor',   href: '/dashboard/chat',      emoji: '🧠', color: 'hover:border-secondary/40 hover:bg-secondary/5'},
            { label: 'View Progress',   href: '/dashboard/progress',  emoji: '📈', color: 'hover:border-success/40 hover:bg-success/5'    },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={cn(
                'bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2',
                'transition-all duration-200 text-center group',
                action.color
              )}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{action.emoji}</span>
              <span className="text-xs font-medium text-white">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
