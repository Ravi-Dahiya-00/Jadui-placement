'use client'

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, ResponsiveContainer, Legend,
} from 'recharts'

const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-card-hover text-xs">
      <p className="text-white font-semibold mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-6">
          <span className="text-muted capitalize">{p.dataKey}</span>
          <span style={{ color: p.color }} className="font-bold">{p.value}%</span>
        </div>
      ))}
    </div>
  )
}

export default function ProgressCharts({ skillData = [], weeklyTrend = [], taskTrend = [] }) {
  const radarData = skillData.map((s) => ({ subject: s.name, A: s.level, fullMark: 100 }))

  return (
    <div className="space-y-6">
      {/* Row 1: Area chart (trends) + Radar (skills) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Readiness trend */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h4 className="font-semibold text-white mb-1">Readiness Trend</h4>
          <p className="text-muted text-xs mb-5">5-week progress across all dimensions</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyTrend} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="readinessGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="interviewGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
              <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Area type="monotone" dataKey="readiness" stroke="#6366f1" strokeWidth={2} fill="url(#readinessGrad)" name="readiness" dot={{ fill: '#6366f1', r: 3 }} />
              <Area type="monotone" dataKey="interview"  stroke="#06b6d4" strokeWidth={2} fill="url(#interviewGrad)" name="interview"  dot={{ fill: '#06b6d4', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Skill radar */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h4 className="font-semibold text-white mb-1">Skill Radar</h4>
          <p className="text-muted text-xs mb-2">Current skill level across key domains</p>
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="rgba(99,102,241,0.15)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Skills" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Tasks bar chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h4 className="font-semibold text-white mb-1">Weekly Task Completion</h4>
        <p className="text-muted text-xs mb-5">Tasks completed vs total across weeks</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={taskTrend} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
            <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CUSTOM_TOOLTIP />} />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '12px' }} />
            <Bar dataKey="total"     fill="rgba(99,102,241,0.2)" radius={[4, 4, 0, 0]} name="Total tasks" />
            <Bar dataKey="completed" fill="#10b981"               radius={[4, 4, 0, 0]} name="Completed"   />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
