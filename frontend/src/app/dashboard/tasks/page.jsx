'use client'

import { useState } from 'react'
import { CheckSquare, List, CalendarDays, BarChart2 } from 'lucide-react'
import TaskList     from '@/features/tasks/TaskList'
import WeeklyRoadmap from '@/features/tasks/WeeklyRoadmap'
import { ProgressBar } from '@/components/ui'
import { useApp } from '@/context/AppContext'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'today',    label: 'Today',         icon: List        },
  { id: 'all',      label: 'All Tasks',     icon: CheckSquare },
  { id: 'roadmap',  label: 'Weekly Roadmap',icon: CalendarDays },
]

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState('today')
  const { state } = useApp()

  const total     = state.tasks.length
  const completed = state.tasks.filter((t) => t.completed).length
  const pct       = total ? Math.round((completed / total) * 100) : 0

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-success" />
            Task Planner
          </h1>
          <p className="text-muted text-sm mt-1">
            Your AI-generated daily tasks and weekly preparation roadmap.
          </p>
        </div>
        {/* Overall progress */}
        <div className="bg-card border border-border rounded-xl px-5 py-3 flex items-center gap-4 min-w-[200px]">
          <BarChart2 className="w-5 h-5 text-success flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted">Overall</span>
              <span className="text-white font-semibold">{pct}%</span>
            </div>
            <ProgressBar value={completed} max={total || 1} color="success" />
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              id={`tasks-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-glow-sm'
                  : 'text-muted hover:text-white hover:bg-surface'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {activeTab === 'roadmap' ? (
        <WeeklyRoadmap />
      ) : (
        <TaskList filter={activeTab} />
      )}
    </div>
  )
}
