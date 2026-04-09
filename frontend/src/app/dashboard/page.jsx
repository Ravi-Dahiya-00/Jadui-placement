'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Target, CheckSquare, Mic, Flame, ArrowRight, Sparkles } from 'lucide-react'
import StatCard       from '@/components/dashboard/StatCard'
import { ProgressBar } from '@/components/ui'
import { useApp, ACTIONS } from '@/context/AppContext'
import { cn } from '@/lib/utils'
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
} from 'recharts'

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
  const { tasks, skillGaps, chatContext } = state
  const [resumeHistory, setResumeHistory] = useState([])
  const [interviewHistory, setInterviewHistory] = useState([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [goalRole, setGoalRole] = useState(chatContext?.targetRole || '')
  const [goalDate, setGoalDate] = useState(chatContext?.targetPlacementDate || '')
  const [goalSaved, setGoalSaved] = useState(false)
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [syncStatus, setSyncStatus] = useState('idle') // idle | syncing | synced | error
  const [lastSyncedAt, setLastSyncedAt] = useState('')
  const [isMounted, setIsMounted] = useState(false)

  const todayTasks  = tasks.filter((t) => t.due === 'Today')
  const completedToday = todayTasks.filter((t) => t.completed).length

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoadingStats(true)
        const [resumeRes, interviewRes] = await Promise.all([
          fetch('/api/resume/history?limit=12', { cache: 'no-store' }),
          fetch('/api/interview/history?limit=12', { cache: 'no-store' }),
        ])
        const resumeData = await resumeRes.json()
        const interviewData = await interviewRes.json()
        if (resumeRes.ok) setResumeHistory(resumeData.history || [])
        if (interviewRes.ok) setInterviewHistory(interviewData.history || [])
      } catch {
        setResumeHistory([])
        setInterviewHistory([])
      } finally {
        setLoadingStats(false)
        setLastSyncedAt(new Date().toISOString())
      }
    }
    
    const loadRadarAndBio = async () => {
      if (!state.user?.id) return
      try {
        setLoadingRadar(true)
        // Note: The backend uses Query parameters for github_username
        const gh = state.chatContext?.githubUsername || ''
        const [radarRes, sugRes] = await Promise.all([
          fetch(`/api/system/readiness?user_id=${state.user.id}${gh ? `&github_username=${gh}` : ''}`, { cache: 'no-store' }),
          fetch(`/api/system/suggestions?github_username=${gh}`, { cache: 'no-store' })
        ])
        const radarJson = await radarRes.json()
        const sugJson = await sugRes.json()
        
        if (radarRes.ok) {
          const transformed = [
            { subject: 'Resume',   value: radarJson.resume || 0,      fullMark: 100 },
            { subject: 'Technical',value: radarJson.technical || 0,   fullMark: 100 },
            { subject: 'Interview',value: radarJson.interview || 0,   fullMark: 100 },
            { subject: 'Execution',value: radarJson.consistency || 0, fullMark: 100 },
          ]
          setReadinessData(transformed)
        }
        if (sugRes.ok) {
          setCareerSuggestions(sugJson.suggestions || [])
        }
      } catch (err) {
        console.error('Radar load failed', err)
      } finally {
        setLoadingRadar(false)
      }
    }

    loadStats()
    loadRadarAndBio()
    setIsMounted(true)
  }, [state.user?.id, state.chatContext?.githubUsername])

  const [readinessData, setReadinessData] = useState([])
  const [careerSuggestions, setCareerSuggestions] = useState([])
  const [loadingRadar, setLoadingRadar] = useState(false)

  const derived = useMemo(() => {
    const latestResume = resumeHistory[0] || null
    const avgResume =
      resumeHistory.length > 0
        ? Math.round(resumeHistory.reduce((sum, item) => sum + Number(item.score || 0), 0) / resumeHistory.length)
        : 0
    const avgInterview =
      interviewHistory.length > 0
        ? Math.round(interviewHistory.reduce((sum, item) => sum + Number(item.overall_score || 0), 0) / interviewHistory.length)
        : 0
    const taskCompletion = todayTasks.length ? Math.round((completedToday / todayTasks.length) * 100) : 0
    const readiness = Math.round((avgResume * 0.45) + (avgInterview * 0.4) + (taskCompletion * 0.15))

    const skillBucket = {}
    resumeHistory.forEach((row) => {
      ;(row.skills || []).forEach((skill) => {
        const key = String(skill || '').trim()
        if (!key) return
        skillBucket[key] = (skillBucket[key] || 0) + 1
      })
    })
    const skillData = Object.entries(skillBucket)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({
        name,
        level: Math.min(95, 40 + count * 15),
      }))

    return {
      readiness,
      taskCompletion,
      avgInterview,
      avgResume,
      latestResume,
      skillData,
      totalResumes: resumeHistory.length,
      totalInterviews: interviewHistory.length,
    }
  }, [resumeHistory, interviewHistory, todayTasks.length, completedToday])

  const readinessBand = useMemo(() => {
    if (derived.readiness >= 75) return { label: 'On Track', tone: 'text-success', note: 'Keep consistency and start harder mocks.' }
    if (derived.readiness >= 50) return { label: 'Needs Focus', tone: 'text-warning', note: 'Close top skill gaps and improve interview consistency.' }
    return { label: 'At Risk', tone: 'text-error', note: 'Prioritize fundamentals and daily execution this week.' }
  }, [derived.readiness])

  const nextBestAction = useMemo(() => {
    if (!resumeHistory.length) return 'Upload your resume to unlock personalized skill-gap insights.'
    if (!interviewHistory.length) return 'Take your first mock interview to benchmark communication and clarity.'
    if (todayTasks.length && completedToday < todayTasks.length) return 'Complete remaining today tasks to increase readiness quickly.'
    if (skillGaps?.length) return `Focus on top gap: ${skillGaps[0]}. Add one targeted practice block today.`
    return 'Review your latest feedback and push one high-impact improvement today.'
  }, [resumeHistory.length, interviewHistory.length, todayTasks.length, completedToday, skillGaps])

  const riskAlerts = useMemo(() => {
    const alerts = []
    if (!resumeHistory.length) alerts.push('No resume analysis found yet.')
    if (!interviewHistory.length) alerts.push('No interview practice session recorded yet.')
    if (todayTasks.length > 0 && completedToday === 0) alerts.push('No task completed today.')
    if (skillGaps?.length >= 4) alerts.push('Multiple skill gaps detected. Prioritize top 2 this week.')
    return alerts
  }, [resumeHistory.length, interviewHistory.length, todayTasks.length, completedToday, skillGaps])

  const handleComplete = (id) => {
    dispatch({ type: ACTIONS.COMPLETE_TASK, payload: id })
  }

  useEffect(() => {
    setGoalRole(chatContext?.targetRole || '')
    setGoalDate(chatContext?.targetPlacementDate || '')
  }, [chatContext?.targetRole, chatContext?.targetPlacementDate])

  const saveStateServer = async (nextPayload) => {
    if (!state.user?.id) return
    try {
      setSyncStatus('syncing')
      const response = await fetch('/api/system/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: state.user.id,
          tasks: nextPayload.tasks ?? state.tasks,
          roadmap: nextPayload.roadmap ?? state.roadmap,
          notifications: nextPayload.notifications ?? state.notifications,
          skill_gaps: nextPayload.skillGaps ?? state.skillGaps,
          chat_context: nextPayload.chatContext ?? state.chatContext ?? {},
          chat_history: nextPayload.chatHistory ?? state.chatHistory ?? [],
          chat_sessions: nextPayload.chatSessions ?? state.chatSessions ?? [],
          active_chat_session_id: nextPayload.activeChatSessionId ?? state.activeChatSessionId ?? '',
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to sync')
      }
      setSyncStatus('synced')
      setLastSyncedAt(data?.state?.updated_at || new Date().toISOString())
      return data
    } catch {
      setSyncStatus('error')
      return null
    }
  }

  const weakestTwoSkills = useMemo(() => {
    if (skillGaps?.length) return skillGaps.slice(0, 2)
    return derived.skillData
      .slice()
      .sort((a, b) => a.level - b.level)
      .slice(0, 2)
      .map((s) => s.name)
  }, [skillGaps, derived.skillData])

  const readinessTrend = useMemo(() => {
    const points = Array.from({ length: 7 }, (_, i) => ({
      day: i + 1,
      value: Math.max(0, Math.min(100, derived.readiness - (6 - i) * 4 + (i % 2 === 0 ? 2 : -1))),
    }))
    return points
  }, [derived.readiness])

  useEffect(() => {
    const loadReadiness = async () => {
      if (!state.user?.id) return
      try {
        const githubUsername = state.chatContext?.githubUsername || ''
        const url = `/api/system/readiness?user_id=${state.user.id}${githubUsername ? `&github_username=${githubUsername}` : ''}`
        const res = await fetch(url)
        const d = await res.json()
        if (res.ok) {
          setReadinessData([
            { subject: 'Resume', A: d.resume, fullMark: 100 },
            { subject: 'Technical', A: d.technical, fullMark: 100 },
            { subject: 'Interview', A: d.interview, fullMark: 100 },
            { subject: 'Consistency', A: d.consistency, fullMark: 100 },
          ])
        }
        
        if (githubUsername) {
          const sugRes = await fetch(`/api/system/suggestions?github_username=${githubUsername}`)
          const sugData = await sugRes.json()
          if (sugRes.ok) setCareerSuggestions(sugData.suggestions || [])
        }
      } catch (err) {
        console.error('Failed to load readiness mapping:', err)
      }
    }
    loadReadiness()
  }, [state.user?.id, state.chatContext?.githubUsername, resumeHistory.length, interviewHistory.length])

  const sparklinePath = useMemo(() => {
    if (!readinessTrend.length) return ''
    const max = Math.max(...readinessTrend.map((p) => p.value), 1)
    const min = Math.min(...readinessTrend.map((p) => p.value), 0)
    const range = Math.max(1, max - min)
    return readinessTrend
      .map((p, i) => {
        const x = (i / (readinessTrend.length - 1 || 1)) * 100
        const y = 100 - ((p.value - min) / range) * 100
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')
  }, [readinessTrend])

  const [goalSaved, setGoalSaved] = useState(false)
  const [syncingBooster, setSyncingBooster] = useState(null)

  const handleApplyBooster = async (boosterText, index) => {
    const latestResumeId = resumeHistory[0]?.id
    if (!latestResumeId) return
    
    setSyncingBooster(index)
    try {
      const res = await fetch('/api/resume/result', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result_id: latestResumeId,
          add_strengths: [boosterText]
        })
      })
      
      if (!res.ok) throw new Error('Failed to apply booster')
      
      const data = await res.json()
      
      // Update global context
      dispatch({ 
        type: ACTIONS.SET_RESUME, 
        payload: data.result 
      })

      // Show temporary success state
      setSyncingBooster( -1 ) // -1 for success indicator
      setTimeout(() => setSyncingBooster(null), 2000)
    } catch (err) {
      console.error('Booster application failed:', err)
      setSyncingBooster(null)
    }
  }

  const saveGoal = async () => {
    const mergedContext = {
      ...(chatContext || {}),
      targetRole: goalRole,
      targetPlacementDate: goalDate,
    }
    const payload = {
      tasks: state.tasks,
      roadmap: state.roadmap,
      notifications: state.notifications,
      skillGaps: state.skillGaps,
      chatContext: mergedContext,
      chatHistory: state.chatHistory,
      chatSessions: state.chatSessions,
      activeChatSessionId: state.activeChatSessionId,
    }
    dispatch({
      type: ACTIONS.SET_SYSTEM_INSIGHTS,
      payload,
    })
    await saveStateServer(payload)
    setGoalSaved(true)
    setTimeout(() => setGoalSaved(false), 1500)
  }

  const generateTodayPlan = async () => {
    setGeneratingPlan(true)
    const focusA = weakestTwoSkills[0] || 'Core Fundamentals'
    const focusB = weakestTwoSkills[1] || 'Interview Clarity'
    const generatedTasks = [
      {
        id: `plan-${Date.now()}-1`,
        title: `Deep practice: ${focusA} (45 min)`,
        category: 'Core',
        completed: false,
        due: 'Today',
      },
      {
        id: `plan-${Date.now()}-2`,
        title: `Targeted drill: ${focusB} (2 focused problems)`,
        category: 'DSA',
        completed: false,
        due: 'Today',
      },
      {
        id: `plan-${Date.now()}-3`,
        title: 'Mock response practice using STAR format (20 min)',
        category: 'Interview',
        completed: false,
        due: 'Today',
      },
    ]
    const deduped = [...generatedTasks, ...state.tasks.filter((t) => t.due !== 'Today')]
    const payload = {
      tasks: deduped,
      roadmap: state.roadmap,
      notifications: [
        {
          id: `notif-plan-${Date.now()}`,
          title: 'Today plan generated',
          body: `Your focus plan is ready: ${focusA} + ${focusB}.`,
          read: false,
        },
        ...(state.notifications || []),
      ].slice(0, 20),
      skillGaps: state.skillGaps,
      chatContext: state.chatContext,
      chatHistory: state.chatHistory,
      chatSessions: state.chatSessions,
      activeChatSessionId: state.activeChatSessionId,
    }
    dispatch({
      type: ACTIONS.SET_SYSTEM_INSIGHTS,
      payload,
    })
    await saveStateServer(payload)
    setTimeout(() => setGeneratingPlan(false), 600)
  }

  return (
    <div className={`max-w-7xl mx-auto space-y-8 transition-opacity duration-700 ${isMounted ? 'opacity-100' : 'opacity-0'} relative`}>
      {/* Background orbs for premium feel */}
      <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-primary/10 blur-[100px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-[200px] left-[-100px] w-72 h-72 bg-secondary/10 blur-[80px] rounded-full -z-10" />

      {/* Greeting */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Good {isMounted ? getGreeting() : '...'},{' '}
            <span className="gradient-text-primary">
              {state.user?.user_metadata?.full_name?.split(' ')[0] || 'Candidate'} 👋
            </span>
          </h1>
          <p className="text-muted text-sm mt-1 font-medium italic opacity-80">
            Insights synced and parsed by Jadui Intelligence Layer.
          </p>
          <div className="flex items-center gap-3 mt-3">
            <span className={cn(
              'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all duration-300',
              syncStatus === 'synced' && 'bg-success/10 border-success/30 text-success',
              syncStatus === 'syncing' && 'bg-primary/10 border-primary/30 text-primary animate-pulse',
              syncStatus === 'error' && 'bg-error/10 border-error/30 text-error',
              syncStatus === 'idle' && 'bg-surface/50 border-border text-muted'
            )}>
              {syncStatus === 'syncing' ? 'Analyzing...' : syncStatus === 'error' ? 'Sync Error' : 'System Ready'}
            </span>
            <p className="text-[11px] text-muted font-medium">
              {isMounted && lastSyncedAt
                ? `Updated ${new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Hydrating profile...'}
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => window.location.reload()}
          className="btn-outline px-4 py-2 mt-4 md:mt-0"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          Full Re-Sync
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          id="stat-readiness"
          title="Readiness Score"
          value={`${derived.readiness}%`}
          subtitle={loadingStats ? 'Syncing your latest records...' : 'Computed from resume + interview + tasks'}
          icon={Target}
          color="primary"
          trend="up"
          trendValue={derived.totalResumes || derived.totalInterviews ? `${derived.totalResumes} resumes, ${derived.totalInterviews} interviews` : 'No records yet'}
        />
        <StatCard
          id="stat-tasks"
          title="Tasks Complete"
          value={`${derived.taskCompletion}%`}
          subtitle={`${completedToday}/${todayTasks.length} tasks today`}
          icon={CheckSquare}
          color="success"
          trend="up"
          trendValue={`${completedToday} done`}
        />
        <StatCard
          id="stat-interview"
          title="Interview Score"
          value={`${derived.avgInterview}%`}
          subtitle={interviewHistory[0] ? `Last role: ${interviewHistory[0].role}` : 'No interview attempt yet'}
          icon={Mic}
          color="accent"
          trend="up"
          trendValue={interviewHistory[0] ? `${interviewHistory[0].answered_count}/${interviewHistory[0].total_questions} answered` : 'Start first interview'}
        />
        <StatCard
          id="stat-resume"
          title="Resume Score"
          value={`${derived.avgResume}%`}
          subtitle={derived.latestResume ? `Target role: ${derived.latestResume.role_target}` : 'Upload resume to start'}
          icon={Flame}
          color="warning"
          trend="up"
          trendValue={derived.latestResume?.experience_level ? `${derived.latestResume.experience_level} level` : 'No resume yet'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass border border-border rounded-2xl p-6 shadow-glow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Readiness Radar
              </h3>
              <p className="text-xs text-muted mt-1">Cross-module candidate analysis</p>
            </div>
            <div className="flex gap-2">
               <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-1 rounded">Resume</span>
               <span className="text-[10px] uppercase font-bold text-accent bg-accent/10 px-2 py-1 rounded">Dev</span>
               <span className="text-[10px] uppercase font-bold text-success bg-success/10 px-2 py-1 rounded">Comm</span>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={readinessData}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
                <Radar
                   name="Candidate"
                   dataKey="value"
                   stroke="#6366f1"
                   fill="#6366f1"
                   fillOpacity={0.5}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111120', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass border border-border rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles className="w-16 h-16 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Technical Bio Booster</h3>
          <p className="text-xs text-muted mb-6">AI-generated resume bullets from GitHub</p>
          
          <div className="space-y-4">
            {careerSuggestions.length > 0 ? (
              careerSuggestions.map((sug, i) => (
                <div key={i} className="relative pl-4 border-l-2 border-primary/30 group/item flex justify-between items-start gap-4">
                  <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-primary/40 group-hover/item:bg-primary transition-colors" />
                  <p className="text-sm text-muted group-hover/item:text-white transition-colors leading-relaxed">
                    {sug}
                  </p>
                  <button 
                    disabled={syncingBooster !== null}
                    onClick={() => handleApplyBooster(sug, i)}
                    className={cn(
                      "flex-shrink-0 text-[10px] font-bold uppercase py-1 px-2 rounded border transition-all",
                      syncingBooster === i ? "bg-primary/20 text-primary animate-pulse" : 
                      syncingBooster === -1 ? "bg-success/20 text-success border-success/30" :
                      "bg-surface border-border text-muted hover:text-white hover:border-primary/50"
                    )}
                  >
                    {syncingBooster === i ? "Applying..." : syncingBooster === -1 ? "✓ Added" : "Add to Resume"}
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-surface/50 flex items-center justify-center mx-auto mb-3">
                   <Target className="w-6 h-6 text-muted" />
                </div>
                <p className="text-xs text-muted italic">No technical boosters yet. Scan your GitHub profile to unlock.</p>
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-4 border-t border-border/50">
             <button className="flex items-center gap-2 text-xs text-primary font-bold hover:gap-3 transition-all">
                Copy all to clipboard
                <ArrowRight className="w-3 h-3" />
             </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass border border-border rounded-xl p-8">
          <h3 className="text-xl font-bold text-white mb-2">Personal Coach Summary</h3>
          <p className="text-sm text-muted leading-relaxed">
            Readiness status: <span className={cn('font-bold border-b-2', readinessBand.tone, readinessBand.tone.replace('text-', 'border-'))}>{readinessBand.label}</span>. {readinessBand.note}
          </p>
          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Sparkles className="w-20 h-20 text-primary" />
            </div>
            <p className="text-[10px] uppercase font-black tracking-widest text-primary mb-2">Next Best Action</p>
            <p className="text-lg font-bold text-white leading-tight pr-10">{nextBestAction}</p>
          </div>
        </div>
        <div className="glass border border-border rounded-xl p-8">
          <h3 className="text-xl font-bold text-white mb-4">Risk Alerts</h3>
          {riskAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <p className="text-sm text-success font-medium">All clear! No critical risks detected.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {riskAlerts.map((alert) => (
                <li key={alert} className="text-sm text-warning rounded-xl border border-warning/10 bg-warning/5 px-4 py-3 flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 shrink-0" />
                  {alert}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-white mb-3">Goal Setting</h3>
          <div className="space-y-3">
            <input
              value={goalRole}
              onChange={(e) => setGoalRole(e.target.value)}
              placeholder="Target role (e.g., SDE-1)"
              className="w-full rounded-lg border border-border bg-surface/40 px-3 py-2 text-sm text-white outline-none focus:border-primary"
            />
            <input
              type="date"
              value={goalDate}
              onChange={(e) => setGoalDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface/40 px-3 py-2 text-sm text-white outline-none focus:border-primary"
            />
            <button onClick={saveGoal} className="btn-primary w-full text-sm py-2">
              {goalSaved ? 'Saved' : 'Save Goal'}
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 flex flex-col">
          <h3 className="font-semibold text-white mb-3">Readiness Radar</h3>
          {readinessData ? (
            <div className="flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={readinessData}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Readiness"
                    dataKey="A"
                    stroke="#438ee9"
                    fill="#438ee9"
                    fillOpacity={0.4}
                  />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '10px' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-muted">
              Connect GitHub & Resume for Radar scan
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-white mb-3">Auto Priority (Weakest 2)</h3>
          {weakestTwoSkills.length === 0 ? (
            <p className="text-sm text-muted">No weak skills detected yet.</p>
          ) : (
            <div className="space-y-2">
              {weakestTwoSkills.map((skill) => (
                <div key={skill} className="rounded-md border border-warning/20 bg-warning/5 px-3 py-2 text-sm text-warning">
                  {skill}
                </div>
              ))}
            </div>
          )}
          <button onClick={generateTodayPlan} className="btn-outline w-full mt-4 text-sm py-2">
            {generatingPlan ? 'Generating...' : 'Generate Today Plan'}
          </button>
        </div>
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
            <h3 className="font-semibold text-white">Skill Snapshot</h3>
            <Link href="/dashboard/progress" className="text-xs text-primary hover:underline flex items-center gap-1">
              Details <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="px-6 py-4 space-y-4">
            {derived.skillData.length === 0 ? (
              <p className="text-xs text-muted">Upload resumes to generate your personalized skill snapshot.</p>
            ) : derived.skillData.map((skill) => (
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

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-white mb-4">Recent Resume Uploads</h3>
          {resumeHistory.length === 0 ? (
            <p className="text-sm text-muted">No resume uploads yet.</p>
          ) : (
            <div className="space-y-3">
              {resumeHistory.slice(0, 4).map((item) => (
                <div key={item.result_id} className="rounded-lg border border-border bg-surface/40 p-3">
                  <p className="text-sm text-white font-medium">{item.candidate_name}</p>
                  <p className="text-xs text-muted mt-1">{item.role_target || 'General Role'} • Score {item.score}/100</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-white mb-4">Recent Interviews</h3>
          {interviewHistory.length === 0 ? (
            <p className="text-sm text-muted">No interview sessions yet.</p>
          ) : (
            <div className="space-y-3">
              {interviewHistory.slice(0, 4).map((item) => (
                <div key={item.session_id} className="rounded-lg border border-border bg-surface/40 p-3">
                  <p className="text-sm text-white font-medium">{item.role}</p>
                  <p className="text-xs text-muted mt-1">Score {item.overall_score}/100 • {item.answered_count}/{item.total_questions} answered</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-white mb-3">Top Skill Gaps</h3>
        {!skillGaps?.length ? (
          <p className="text-sm text-muted">No major skill gaps detected yet. Upload resume for personalized insights.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skillGaps.slice(0, 8).map((gap) => (
              <span key={gap} className="text-xs rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-warning">
                {gap}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Upload Resume',   href: '/dashboard/resume',    emoji: '📄', color: 'hover:border-primary/40 hover:bg-primary/5'    },
            { label: 'Start Interview', href: '/dashboard/interview', emoji: '🎤', color: 'hover:border-accent/40 hover:bg-accent/5'      },
            { label: 'Ask AI Mentor',   href: '/dashboard/chat',      emoji: '🧠', color: 'hover:border-secondary/40 hover:bg-secondary/5'},
            { label: 'GitHub profile',  href: '/dashboard/github-profile', emoji: '🐙', color: 'hover:border-primary/40 hover:bg-primary/5' },
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
