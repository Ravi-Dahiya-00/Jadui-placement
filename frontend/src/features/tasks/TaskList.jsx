'use client'

import { useApp, ACTIONS } from '@/context/AppContext'
import { CheckCircle2, Circle, Calendar, Tag } from 'lucide-react'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

const CATEGORY_BADGE = {
  DSA:       'default',
  Design:    'secondary',
  Interview: 'accent',
  Project:   'success',
  Core:      'warning',
  Career:    'muted',
}

export default function TaskList({ filter = 'all' }) {
  const { state, dispatch } = useApp()

  const tasks = state.tasks.filter((t) => {
    if (filter === 'today')     return t.due === 'Today'
    if (filter === 'completed') return t.completed
    if (filter === 'pending')   return !t.completed
    return true
  })

  const handleComplete = (id) => {
    dispatch({ type: ACTIONS.COMPLETE_TASK, payload: id })
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No tasks found for this filter.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={cn(
            'flex items-center gap-4 bg-card border rounded-xl px-5 py-4 transition-all duration-200 group',
            task.completed ? 'border-border opacity-60' : 'border-border hover:border-primary/30 hover:shadow-card-hover'
          )}
        >
          {/* Complete toggle */}
          <button
            id={`task-complete-${task.id}`}
            onClick={() => handleComplete(task.id)}
            disabled={task.completed}
            className="flex-shrink-0 focus:outline-none"
          >
            {task.completed ? (
              <CheckCircle2 className="w-5 h-5 text-success" />
            ) : (
              <Circle className="w-5 h-5 text-muted/40 group-hover:text-primary transition-colors" />
            )}
          </button>

          {/* Task content */}
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium', task.completed ? 'line-through text-muted' : 'text-white')}>
              {task.title}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-muted">
                <Calendar className="w-3 h-3" />
                {task.due}
              </span>
            </div>
          </div>

          {/* Category badge */}
          <Badge variant={CATEGORY_BADGE[task.category] || 'muted'}>
            <Tag className="w-2.5 h-2.5 mr-1" />
            {task.category}
          </Badge>
        </div>
      ))}
    </div>
  )
}
