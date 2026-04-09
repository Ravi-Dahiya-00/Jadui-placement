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
    const nextContext = {
      ...(state.chatContext || {}),
      githubUsername: data.user.login,
    }
    const payload = {
      user_id: state.user.id,
      tasks: state.tasks,
      roadmap: state.roadmap,
      notifications: [
        {
          id: `notif-gh-sync-${Date.now()}`,
          title: 'GitHub linked to profile',
          body: `Successfully linked @${data.user.login}. Career insights will now include technical depth.`,
          read: false,
        },
        ...(state.notifications || []),
      ].slice(0, 20),
      skillGaps: state.skillGaps,
      chatContext: nextContext,
      chatHistory: state.chatHistory,
      chatSessions: state.chatSessions,
      activeChatSessionId: state.activeChatSessionId,
    }

    dispatch({ type: ACTIONS.SET_SYSTEM_INSIGHTS, payload })
    
    try {
      await fetch('/api/system/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch (err) {
      console.error('Failed to sync to server:', err)
    }
  }

  const user = data?.user

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-glow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Github className="w-5 h-5 text-primary" />
              GitHub public profile
            </h2>
            <p className="text-sm text-muted mt-1 max-w-xl">
              Analytics ported from <span className="text-muted/80">profile-summary-for-github</span>: languages,
              commits per quarter, repo activity, and optional AI read (Gemini on your backend).
            </p>
          </div>
        </div>

        <form onSubmit={handleAnalyze} className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex rounded-xl border border-border bg-surface/50 overflow-hidden">
            <span className="pl-3 flex items-center text-muted text-sm">github.com/</span>
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
              className="flex-1 bg-transparent py-3 pr-4 text-white placeholder:text-muted/50 focus:outline-none text-sm"
              autoComplete="off"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-muted cursor-pointer px-2">
            <input
              type="checkbox"
              checked={withAi}
              onChange={(e) => setWithAi(e.target.checked)}
              className="rounded border-border"
            />
            AI summary (Gemini)
          </label>
          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="btn-primary px-6 py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Analyze
          </button>
        </form>

        {error ? (
          <div className="mt-4 p-4 rounded-xl border border-error/20 bg-error/5">
            <p className="text-sm text-error">{error}</p>
            {error.toLowerCase().includes('rate limit') && (
              <p className="text-xs text-muted mt-2">
                Tip: Create a <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-primary hover:underline">Personal Access Token</a> and set it as `GITHUB_TOKEN` in your environment.
              </p>
            )}
          </div>
        ) : null}
        <p className="text-xs text-muted mt-3">
          Set <code className="text-accent/90">GITHUB_TOKEN</code> for higher rate limits. Public data only.
        </p>
      </div>

      {isMounted && data && user && (
        <div className="space-y-8 animate-slide-up">
          {/* Header card */}
          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.avatarUrl || ''}
                alt={user.login}
                width={120}
                height={120}
                className="rounded-xl border border-border w-[120px] h-[120px] object-cover bg-surface"
              />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-baseline gap-2">
                <h3 className="text-xl font-bold text-white">{user.login}</h3>
                {user.name ? <span className="text-muted">({user.name})</span> : null}
              </div>
              <p className="text-sm text-muted">
                <BarChart3 className="w-4 h-4 inline mr-1" />
                {user.publicRepos} public repos · Joined {formatJoined(user.createdAt)}
              </p>
              <a
                href={user.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                View on GitHub <ExternalLink className="w-3.5 h-3.5" />
              </a>
              {data.meta ? (
                <p className="text-xs text-muted/70 pt-2">
                  Analyzed {data.meta.reposAnalyzed} repos (most recently updated, non-fork, non-empty).
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2 justify-center">
              <button
                onClick={handleSyncToProfile}
                disabled={state.chatContext?.githubUsername === user.login}
                className="btn-primary text-xs py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:bg-success/20 disabled:text-success"
              >
                {state.chatContext?.githubUsername === user.login ? (
                  <>✓ Linked to Profile</>
                ) : (
                  <><Sparkles className="w-3 h-3" /> Sync to Career Profile</>
                )}
              </button>
            </div>
          </div>

          {data.insights ? (
            <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> AI profile read
              </p>
              <div className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{renderBold(data.insights)}</div>
            </div>
          ) : null}

          {/* Commits per quarter */}
          {quarterData.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h4 className="text-sm font-semibold text-white mb-4">Commits per quarter</h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={quarterData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="quarter" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-35} textAnchor="end" height={60} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#e2e8f0' }}
                    />
                    <Line type="monotone" dataKey="commits" stroke="#438ee9" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DonutCard title="Repos per language" data={langRepoData} type="language" username={user.login} />
            <DonutCard title="Commits per language" data={langCommitData} type="language" username={user.login} />
            {langStarData.some((d) => d.value > 0) ? (
              <DonutCard title="Stars per language" data={langStarData} type="language" username={user.login} />
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-surface/30 p-6 flex items-center justify-center text-sm text-muted">
                No stars on analyzed repos
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DonutCard
              title="Commits per repo (top 10)"
              data={repoCommitData}
              type="repo"
              username={user.login}
              descriptions={data.repoCommitCountDescriptions}
            />
            {repoStarData.some((d) => d.value > 0) ? (
              <DonutCard
                title="Stars per repo (top 10)"
                data={repoStarData}
                type="repo"
                username={user.login}
                descriptions={data.repoStarCountDescriptions}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-surface/30 p-6 flex items-center justify-center text-sm text-muted">
                No stargazers on top repos
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function DonutCard({ title, data, type, username, descriptions }) {
  if (!data?.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted">{title}: no data</div>
    )
  }

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
    <div className="rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/30">
      <h4 className="text-sm font-semibold text-white mb-3 text-center">{title}</h4>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={2}
              onClick={handleClick}
              className="cursor-pointer"
            >
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={type === 'language' ? getLanguageColor(entry.name, i) : DONUT_COLORS[i % DONUT_COLORS.length]}
                  stroke="transparent"
                  className="hover:opacity-80 transition-opacity"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
              itemStyle={{ fontSize: '12px' }}
              labelStyle={{ color: '#e2e8f0', fontWeight: 'bold', marginBottom: '4px' }}
              formatter={(value, name, { payload }) => {
                const desc = descriptions?.[payload.name]
                if (desc) {
                  return [
                    <div key="content" className="max-w-[200px] space-y-1">
                      <div className="font-bold text-white">{value}</div>
                      <div className="text-[10px] text-muted leading-tight italic">{desc}</div>
                    </div>,
                    '',
                  ]
                }
                return [value, '']
              }}
            />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
