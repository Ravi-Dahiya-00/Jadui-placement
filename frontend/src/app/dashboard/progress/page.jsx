'use client'

import { TrendingUp, Target, CheckSquare, Mic, Flame } from 'lucide-react'
import StatCard       from '@/components/dashboard/StatCard'
import { ProgressBar } from '@/components/ui'
import ProgressCharts  from '@/features/progress/ProgressCharts'
import { useApp } from '@/context/AppContext'

export default function ProgressPage() {
  const { state } = useApp()
  const { progress } = state

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-success" />
          Progress Tracker
        </h1>
        <p className="text-muted text-sm mt-1">
          Track your readiness score, skill growth, and preparation velocity over time.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Readiness Score" value={`${progress.readinessScore}%`}
          subtitle="Overall career readiness" icon={Target}    color="primary"   trend="up" trendValue="+4% week" />
        <StatCard title="Task Completion" value={`${progress.taskCompletion}%`}
          subtitle="Of assigned tasks done"   icon={CheckSquare} color="success"  trend="up" trendValue="+8%" />
        <StatCard title="Interview Score" value={`${progress.interviewScore}%`}
          subtitle="Latest mock session"      icon={Mic}        color="accent"    trend="up" trendValue="+6 pts" />
        <StatCard title="Day Streak"      value={`${progress.streak}🔥`}
          subtitle="Consecutive active days"  icon={Flame}      color="warning"   trend="up" trendValue="+1 today" />
      </div>

      {/* Skill bars */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold text-white mb-5">Skill Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          {progress.skillData.map((skill) => {
            const color = skill.level >= 75 ? 'success' : skill.level >= 50 ? 'primary' : 'warning'
            return (
              <div key={skill.name}>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium text-white">{skill.name}</span>
                  <span className="text-muted">{skill.level}%</span>
                </div>
                <ProgressBar value={skill.level} max={100} color={color} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Charts */}
      <div>
        <h3 className="font-semibold text-white mb-5">Performance Analytics</h3>
        <ProgressCharts />
      </div>

      {/* Readiness breakdown */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold text-white mb-5">Readiness Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Technical Skills',  value: 68, color: 'primary'   },
            { label: 'Interview Prep',    value: 81, color: 'accent'    },
            { label: 'Project Portfolio', value: 55, color: 'secondary' },
          ].map((item) => (
            <div key={item.label} className="bg-surface rounded-xl p-4 border border-border">
              <p className="text-sm font-medium text-white mb-1">{item.label}</p>
              <p className="text-3xl font-black text-white mb-3">{item.value}%</p>
              <ProgressBar value={item.value} max={100} color={item.color} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
