'use client'

import { useEffect, useMemo, useState } from 'react'
import { TrendingUp, Target, CheckSquare, Mic, Flame } from 'lucide-react'
import StatCard       from '@/components/dashboard/StatCard'
import { ProgressBar } from '@/components/ui'
import ProgressCharts  from '@/features/progress/ProgressCharts'
import { useApp } from '@/context/AppContext'

const DEFAULT_WEEKLY = [
  { week: 'Week 1', readiness: 0, tasks: 0, interview: 0 },
  { week: 'Week 2', readiness: 0, tasks: 0, interview: 0 },
  { week: 'Week 3', readiness: 0, tasks: 0, interview: 0 },
  { week: 'Week 4', readiness: 0, tasks: 0, interview: 0 },
  { week: 'Week 5', readiness: 0, tasks: 0, interview: 0 },
]

export default function ProgressPage() {
  const { state } = useApp()
  const { tasks } = state
  const [resumeHistory, setResumeHistory] = useState([])
  const [interviewHistory, setInterviewHistory] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const [resumeRes, interviewRes] = await Promise.all([
          fetch('/api/resume/history?limit=20', { cache: 'no-store' }),
          fetch('/api/interview/history?limit=20', { cache: 'no-store' }),
        ])
        const r = await resumeRes.json()
        const i = await interviewRes.json()
        if (resumeRes.ok) setResumeHistory(r.history || [])
        if (interviewRes.ok) setInterviewHistory(i.history || [])
      } catch {
        setResumeHistory([])
        setInterviewHistory([])
      }
    }
    load()
  }, [])

  const progress = useMemo(() => {
    const taskCompletion = tasks.length ? Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100) : 0
    const interviewScore = interviewHistory.length
      ? Math.round(interviewHistory.reduce((sum, row) => sum + Number(row.overall_score || 0), 0) / interviewHistory.length)
      : 0
    const resumeScore = resumeHistory.length
      ? Math.round(resumeHistory.reduce((sum, row) => sum + Number(row.score || 0), 0) / resumeHistory.length)
      : 0
    const readinessScore = Math.round((resumeScore * 0.45) + (interviewScore * 0.4) + (taskCompletion * 0.15))

    const skillsMap = {}
    resumeHistory.forEach((row) => {
      ;(row.skills || []).forEach((skill) => {
        const key = String(skill || '').trim()
        if (!key) return
        skillsMap[key] = (skillsMap[key] || 0) + 1
      })
    })
    const skillData = Object.entries(skillsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, level: Math.min(95, 40 + count * 12) }))

    const weekly = DEFAULT_WEEKLY.map((w, idx) => ({
      week: w.week,
      readiness: Math.max(0, readinessScore - (4 - idx) * 6),
      tasks: Math.max(0, taskCompletion - (4 - idx) * 5),
      interview: Math.max(0, interviewScore - (4 - idx) * 6),
    }))
    const taskTrend = DEFAULT_WEEKLY.map((w, idx) => ({
      week: w.week,
      total: 14,
      completed: Math.max(0, Math.min(14, Math.round((taskCompletion / 100) * 14) - (4 - idx))),
    }))
    return {
      readinessScore,
      taskCompletion,
      interviewScore,
      resumeScore,
      skillData,
      weekly,
      taskTrend,
      streak: Math.min(30, Math.max(1, interviewHistory.length + resumeHistory.length)),
    }
  }, [tasks, interviewHistory, resumeHistory])

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-success" />
          Progress Tracker
        </h1>
        <p className="text-muted text-sm mt-1">
          Track your readiness score, skill growth, and preparation velocity over time.
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Readiness Score" value={`${progress.readinessScore}%`}
          subtitle="Overall career readiness" icon={Target} color="primary" trend="up" trendValue={`${resumeHistory.length} resume records`} />
        <StatCard title="Task Completion" value={`${progress.taskCompletion}%`}
          subtitle="Of assigned tasks done" icon={CheckSquare} color="success" trend="up" trendValue={`${tasks.filter((t) => t.completed).length}/${tasks.length}`} />
        <StatCard title="Interview Score" value={`${progress.interviewScore}%`}
          subtitle="Average mock sessions" icon={Mic} color="accent" trend="up" trendValue={`${interviewHistory.length} sessions`} />
        <StatCard title="Day Streak" value={`${progress.streak}🔥`}
          subtitle="Activity streak estimate" icon={Flame} color="warning" trend="up" trendValue={`Resume avg ${progress.resumeScore}%`} />
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold text-white mb-5">Skill Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          {progress.skillData.length === 0 ? (
            <p className="text-sm text-muted">No skill data yet. Upload resumes to build your skill profile.</p>
          ) : progress.skillData.map((skill) => {
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

      <div>
        <h3 className="font-semibold text-white mb-5">Performance Analytics</h3>
        <ProgressCharts skillData={progress.skillData} weeklyTrend={progress.weekly} taskTrend={progress.taskTrend} />
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold text-white mb-5">Readiness Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Technical Skills', value: progress.resumeScore, color: 'primary' },
            { label: 'Interview Prep', value: progress.interviewScore, color: 'accent' },
            { label: 'Execution Discipline', value: progress.taskCompletion, color: 'secondary' },
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
