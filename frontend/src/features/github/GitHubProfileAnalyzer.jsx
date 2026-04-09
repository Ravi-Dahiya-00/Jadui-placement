'use client'

import { useState, useMemo, useEffect } from 'react'
import { useApp, ACTIONS } from '@/context/AppContext'
import {
  Github,
  Loader2,
  Search,
  ExternalLink,
  Sparkles,
  BarChart3,
  LayoutGrid,
  TrendingUp,
  Code2,
  Box,
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
const DONUT_COLORS = ['#54ca76', '#f5c452', '#f2637f', '#9261f3', '#31a4e6', '#55cbcb']

const LANGUAGE_COLORS = {
  Python: '#3572A5',
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Java: '#b07219',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Kotlin: '#A97BFF',
  Go: '#00ADD8',
  Rust: '#dea584',
  PHP: '#4F5D95',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Ruby: '#701516',
  Dart: '#00B4AB',
  Swift: '#F05138',
}

function getLanguageColor(name, index) {
  return LANGUAGE_COLORS[name] || DONUT_COLORS[index % DONUT_COLORS.length]
}

function toChartData(obj) {
  if (!obj || typeof obj !== 'object') return []
  return Object.entries(obj).map(([name, value]) => ({ name, value: Number(value) || 0 }))
}

function formatJoined(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

function renderBold(text) {
  if (!text) return null
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) =>
    part.startsWith('**') ? (
      <strong key={i} className="text-white font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

export default function GitHubProfileAnalyzer() {
  const [username, setUsername] = useState('')
  const [withAi, setWithAi] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [isMounted, setIsMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('overview') // overview | languages | repos
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const langRepoData = useMemo(() => toChartData(data?.langRepoCount), [data])
  const langCommitData = useMemo(() => toChartData(data?.langCommitCount), [data])
  const langStarData = useMemo(() => toChartData(data?.langStarCount), [data])
  const repoCommitData = useMemo(() => toChartData(data?.repoCommitCount), [data])
  const repoStarData = useMemo(() => toChartData(data?.repoStarCount), [data])
  const quarterData = useMemo(() => {
    const qc = data?.quarterCommitCount
    if (!qc) return []
    return Object.entries(qc).map(([q, v]) => ({ quarter: q, commits: v }))
  }, [data])

  const { state, dispatch } = useApp()

  const handleAnalyze = async (e) => {
    e?.preventDefault()
    const u = username.trim()
    if (!u) return
    setError('')
    setLoading(true)
    setData(null)
    try {
      const qs = new URLSearchParams({ username: u })
      if (withAi) qs.set('insights', '1')
      const res = await fetch(`/api/github/profile?${qs}`, { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error || json.detail || 'Failed to load profile')
      }
      setData(json)
    } catch (err) {
      setError(err?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleSyncToProfile = async () => {
    if (!data?.user?.login || !state.user?.id) return
    setIsSyncing(true)

    const nextContext = {
      ...(state.chatContext || {}),
      githubUsername: data.user.login,
    }

    const payload = {
      user_id: state.user.id,
      tasks: state.tasks || [],
      roadmap: state.roadmap || [],
      notifications: [
        {
          id: `notif-gh-sync-${Date.now()}`,
          title: 'GitHub Identity Linked',
          body: `Successfully linked @${data.user.login} to your placement profile.`,
          read: false,
        },
        ...(state.notifications || []),
      ].slice(0, 20),
      skill_gaps: state.skillGaps || [],
      chat_context: nextContext,
      chat_history: state.chatHistory || [],
      chat_sessions: state.chatSessions || [],
      active_chat_session_id: state.activeChatSessionId || "",
    }

    // Update local state first for instant UX
    dispatch({ type: ACTIONS.SET_SYSTEM_INSIGHTS, payload: {
      ...payload,
      skillGaps: payload.skill_gaps,
      chatContext: payload.chat_context,
      chatHistory: payload.chat_history,
      chatSessions: payload.chat_sessions,
      activeChatSessionId: payload.active_chat_session_id,
    }})
    
    try {
      const res = await fetch('/api/system/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to sync state')
    } catch (err) {
      console.error('Failed to sync to server:', err)
    } finally {
      setIsSyncing(false)
    }
  }

  const user = data?.user

  return (
    <div className="space-y-8">
      {/* Search Bar Refined */}
      <div className="glass rounded-2xl p-6 shadow-glow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <Github className="w-6 h-6 text-primary" />
              Technical Identity Scan
            </h2>
            <p className="text-sm text-muted mt-1 max-w-xl">
              Deep-dive into contribution patterns, language mastery, and career suitability.
            </p>
          </div>
        </div>

        <form onSubmit={handleAnalyze} className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex rounded-xl border border-border bg-surface/30 overflow-hidden focus-within:border-primary/50 transition-colors">
            <span className="pl-4 flex items-center text-muted text-sm font-medium">github.com/</span>
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
              className="flex-1 bg-transparent py-4 pr-4 text-white placeholder:text-muted/50 focus:outline-none text-sm font-medium"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="btn-primary px-8 py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            Analyze Profile
          </button>
        </form>

        {error ? (
          <div className="mt-4 p-4 rounded-xl border border-error/20 bg-error/5 flex flex-col gap-1">
            <p className="text-sm text-error font-medium">{error}</p>
            {error.toLowerCase().includes('rate limit') && (
              <p className="text-xs text-muted mt-2">
                Tip: Create a <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-primary hover:underline">Personal Access Token</a> and set it as `GITHUB_TOKEN` in your environment.
              </p>
            )}
          </div>
        ) : null}
        
        <div className="flex items-center gap-4 mt-4">
          <label className="flex items-center gap-2 text-xs text-muted cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={withAi}
              onChange={(e) => setWithAi(e.target.checked)}
              className="rounded border-border bg-transparent text-primary focus:ring-primary"
            />
            Enhanced AI Insights
          </label>
        </div>
      </div>

      {isMounted && data && user && (
        <div className="space-y-6 animate-slide-up">
          {/* Tabs Navigation */}
          <div className="flex items-center gap-1 p-1 bg-surface/50 border border-border rounded-xl w-fit">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutGrid },
              { id: 'languages', label: 'Languages', icon: Code2 },
              { id: 'repos', label: 'Repositories', icon: Box },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary/20 text-primary border border-primary/20 shadow-sm'
                    : 'text-muted hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Hero Identity Card */}
              <div className="glass rounded-2xl p-8 flex flex-col lg:flex-row gap-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Github className="w-32 h-32" />
                </div>
                
                <div className="flex-shrink-0 flex flex-col items-center">
                  <img
                    src={user.avatarUrl || ''}
                    alt={user.login}
                    className="rounded-2xl border-2 border-primary/30 w-32 h-32 object-cover shadow-xl"
                  />
                  <div className="mt-4 text-center">
                    <h3 className="text-2xl font-black text-white">{user.login}</h3>
                    <p className="text-sm text-primary font-bold uppercase tracking-widest mt-1">
                      {user.name || 'Candidate'}
                    </p>
                  </div>
                </div>

                <div className="flex-1 space-y-6">
                  {data.insights ? (
                    <div className="rounded-xl bg-primary/5 border border-primary/10 p-5 relative">
                      <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 animate-pulse" /> Recruiter Intel
                      </p>
                      <div className="text-sm text-slate-300 leading-relaxed space-y-2">
                        {renderBold(data.insights)}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-4">
                    <div className="px-5 py-3 rounded-xl bg-surface/40 border border-border">
                      <p className="text-xs text-muted font-medium mb-1">Public Impact</p>
                      <p className="text-xl font-bold text-white">{user.publicRepos} <span className="text-xs text-muted font-normal ml-1">Repos</span></p>
                    </div>
                    <div className="px-5 py-3 rounded-xl bg-surface/40 border border-border">
                      <p className="text-xs text-muted font-medium mb-1">Account Age</p>
                      <p className="text-xl font-bold text-white">{formatJoined(user.createdAt)}</p>
                    </div>
                    <button
                      onClick={handleSyncToProfile}
                      disabled={isSyncing || state.chatContext?.githubUsername === user.login}
                      className="ml-auto px-6 py-3 rounded-xl bg-primary text-white text-sm font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:bg-success/20 disabled:text-success shadow-lg shadow-primary/20"
                    >
                      {isSyncing ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Syncing...</>
                      ) : state.chatContext?.githubUsername === user.login ? (
                        <>✓ Linked to Profile</>
                      ) : (
                        <><Sparkles className="w-4 h-4" /> Sync Readiness</>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Activity Trend Breakdown */}
              {quarterData.length > 0 && (
                <div className="glass rounded-2xl p-6 chart-glow">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-secondary" />
                      Commit Velocity Trend
                    </h4>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={quarterData}>
                        <defs>
                          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis 
                          dataKey="quarter" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 10 }}
                        />
                        <Tooltip
                          contentStyle={{ 
                            background: 'rgba(15, 23, 42, 0.9)', 
                            border: '1px solid rgba(99, 102, 241, 0.2)', 
                            borderRadius: '12px',
                            backdropFilter: 'blur(8px)',
                            padding: '12px'
                          }}
                          labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px' }}
                          itemStyle={{ fontSize: '14px', fontWeight: 'bold' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="commits" 
                          stroke="url(#lineGradient)" 
                          strokeWidth={4} 
                          dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#0f172a' }}
                          activeDot={{ r: 6, shadowSize: 10, fill: '#fff' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Languages */}
          {activeTab === 'languages' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <DonutCard title="Language Distribution" data={langRepoData} type="language" username={user.login} />
              <DonutCard title="Contribution Effort" data={langCommitData} type="language" username={user.login} />
              {langStarData.length > 0 && (
                <DonutCard title="Star Attraction" data={langStarData} type="language" username={user.login} />
              )}
            </div>
          )}

          {/* Tab Content: Repos */}
          {activeTab === 'repos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DonutCard
                title="Highest Activity Repos"
                data={repoCommitData}
                type="repo"
                username={user.login}
                descriptions={data.repoCommitCountDescriptions}
              />
              {repoStarData.length > 0 && (
                <DonutCard
                  title="Most Starred Projects"
                  data={repoStarData}
                  type="repo"
                  username={user.login}
                  descriptions={data.repoStarCountDescriptions}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DonutCard({ title, data, type, username, descriptions }) {
  if (!data?.length) return null

  const handleClick = (entry) => {
    if (!username) return
    let url = ''
    if (type === 'repo') {
      url = `https://github.com/${username}/${entry.name}`
    } else {
      const lang = encodeURIComponent(entry.name)
      url = `https://github.com/${username}?tab=repositories&q=&type=source&language=${lang}`
    }
    window.open(url, '_blank')
  }

  return (
    <div className="glass rounded-2xl p-6 flex flex-col items-center transition-all hover:border-primary/40 hover:-translate-y-1 duration-300 shadow-glow-sm h-full">
      <h4 className="text-xs font-bold text-muted uppercase tracking-widest mb-6 text-center">{title}</h4>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={4}
              onClick={handleClick}
              className="cursor-pointer"
            >
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={type === 'language' ? getLanguageColor(entry.name, i) : DONUT_COLORS[i % DONUT_COLORS.length]}
                  stroke="rgba(0,0,0,0.1)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ 
                background: 'rgba(15, 23, 42, 0.95)', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                borderRadius: '12px',
                fontSize: '11px',
                backdropFilter: 'blur(8px)'
              }}
              formatter={(value, name, { payload }) => {
                const desc = descriptions?.[payload.name]
                return [
                  <div key="val" className="space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted">{name}</span>
                      <span className="font-bold text-white">{value}</span>
                    </div>
                    {desc && <div className="text-[10px] text-primary/60 max-w-[140px] italic">{desc}</div>}
                  </div>,
                  ''
                ]
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1">
        {data.slice(0, 4).map((entry, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: type === 'language' ? getLanguageColor(entry.name, i) : DONUT_COLORS[i % DONUT_COLORS.length] }} />
            <span className="text-[10px] font-medium text-muted">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
