'use client'

import { useState, useEffect } from 'react'
import { 
  Users, Target, Trophy, TrendingUp, AlertCircle, 
  ArrowUpRight, ArrowDownRight, Search, Filter, 
  ExternalLink, BrainCircuit, Zap, Globe, Sparkles 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import StudentDossier from '@/features/admin/StudentDossier'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, top, struggling, shortlisted
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [isSimulating, setIsSimulating] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      try {
        const [statsRes, studentsRes] = await Promise.all([
          fetch(`${backendUrl}/api/admin/stats`),
          fetch(`${backendUrl}/api/admin/students`)
        ])
        const statsData = await statsRes.json()
        const studentsData = await studentsRes.json()
        
        setStats(statsData.stats || null)
        setStudents(studentsData.students || [])
      } catch (err) {
        console.error('Failed to fetch admin data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSimulate = async (e) => {
    e.preventDefault()
    if (!searchTerm) return
    setIsSimulating(true)
    setLoading(true)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${backendUrl}/api/admin/simulate/hiring?q=${searchTerm}`)
      const data = await res.json()
      setStudents(data.ranked || [])
    } catch (err) {
      console.error('Simulation failed', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !isSimulating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-neutral-500 font-bold text-sm uppercase tracking-widest">Hydrating Command Center...</p>
      </div>
    )
  }

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-2 h-8 bg-amber-500 rounded-full" />
             <h2 className="text-4xl font-black text-white tracking-tighter uppercase">
            {isSimulating ? 'Hiring Simulation' : 'Batch Command'}
          </h2>
          </div>
          <p className="text-neutral-500 font-medium max-w-lg">
            Real-time aggregate intelligence of your placement cohort. Track readiness, identify gaps, and fast-track top talent.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-neutral-900 border border-neutral-800 p-1.5 rounded-2xl w-full md:w-auto">
           <form onSubmit={handleSimulate} className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-11 pr-4 py-2.5 text-xs outline-none focus:border-amber-500/50 transition-all font-bold uppercase tracking-widest placeholder:text-neutral-700"
                placeholder={isSimulating ? "Simulating for: " + searchTerm : "Search or Predict Match (e.g. Node.js)"}
              />
              <button type="submit" className="hidden">Simulate</button>
           </form>
           
           <div className="h-4 w-px bg-neutral-800 hidden md:block mx-1" />
           
           <button 
             onClick={() => setIsSimulating(false)} 
             className={cn("px-5 py-2.5 font-black text-xs uppercase rounded-xl transition-all", isSimulating ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" : "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20")}
           >
             {isSimulating ? 'Exit Simulation' : 'Live Sync'}
           </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Students" 
          value={stats?.totalStudents || 0} 
          subText="Active in ecosystem" 
          icon={Users} 
          color="amber" 
        />
        <StatCard 
          title="Avg Readiness" 
          value={`${stats?.avgReadiness || 0}%`} 
          subText="Across all metrics" 
          icon={Target} 
          color="blue" 
          trend="+5.2%" 
        />
        <StatCard 
          title="Placement Ready" 
          value={stats?.readyForPlacement || 0} 
          subText="Score above 80%" 
          icon={Trophy} 
          color="emerald" 
        />
        <StatCard 
          title="Avg Interview" 
          value="72%" 
          subText="Mock performance" 
          icon={TrendingUp} 
          color="purple" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Students Table */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Student Roster</h3>
              <div className="flex flex-wrap gap-2">
                 {['all', 'top', 'struggling', 'shortlisted'].map(f => (
                   <button 
                     key={f}
                     onClick={() => setFilter(f)}
                     className={cn(
                       "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                       filter === f ? "bg-amber-500 border-amber-500 text-neutral-950" : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-white"
                     )}
                   >
                     {f}
                   </button>
                 ))}
              </div>
           </div>

           <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl overflow-hidden backdrop-blur-sm">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-neutral-800/30 text-[10px] font-black uppercase tracking-widest text-neutral-500 border-b border-neutral-800">
                    <th className="px-6 py-4 font-black">Student Profile</th>
                    <th className="px-6 py-4 font-black">Readiness</th>
                    <th className="px-6 py-4 font-black">Missions</th>
                    <th className="px-6 py-4 font-black">Status</th>
                    <th className="px-6 py-4 font-black text-right">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-neutral-800/50">
                 {filteredStudents.map(s => (
                   <tr key={s.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-6 py-5">
                         <div className="flex items-center gap-4">
                            <div className="relative">
                               <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-400">
                                  {s.name[0]}
                               </div>
                               {s.is_shortlisted && (
                                 <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 border-2 border-neutral-900">
                                    <Trophy className="w-2.5 h-2.5 text-neutral-950" />
                                 </div>
                               )}
                            </div>
                            <button 
                              onClick={() => setSelectedStudentId(s.id)}
                              className="text-left group/name"
                            >
                               <p className="text-sm font-bold text-white group-hover/name:text-amber-400 transition-colors flex items-center gap-2">
                                 {s.name}
                                 {s.relevance > 0 && <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />}
                               </p>
                               <p className="text-[10px] text-neutral-500 font-medium">{s.email}</p>
                            </button>
                         </div>
                      </td>
                      <td className="px-6 py-5">
                         <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-white">{s.avgScore}%</span>
                            <div className="flex-1 min-w-[60px] h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                               <div className="h-full bg-amber-500 rounded-full" style={{ width: `${s.avgScore}%` }} />
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                         {s.pending_tpo_tasks > 0 ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black">
                               {s.pending_tpo_tasks} PENDING
                            </span>
                         ) : (
                            <span className="text-[10px] font-bold text-neutral-600">CLEAR</span>
                         )}
                      </td>
                      <td className="px-6 py-5">
                         <span className={cn(
                           "text-[10px] font-black uppercase px-2.5 py-1 rounded-full border",
                           s.avgScore >= 75 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                           s.avgScore >= 50 ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                           "bg-rose-500/10 border-rose-500/20 text-rose-500"
                         )}>
                           {s.avgScore >= 75 ? 'Placement Ready' : s.avgScore >= 50 ? 'Gaining Depth' : 'Initial Phase'}
                         </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                         <button 
                           onClick={() => setSelectedStudentId(s.id)}
                           className="p-2 h-8 w-8 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white hover:border-white/20 transition-all"
                         >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                         </button>
                      </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>

        {/* AI Column: Batch Insights */}
        <div className="space-y-8">
           <div className="bg-gradient-to-br from-amber-500/10 to-neutral-900 border border-amber-500/20 rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                 <BrainCircuit className="w-24 h-24 text-amber-500" />
              </div>
              <div className="relative z-10 space-y-4">
                 <h4 className="text-xs font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5" /> AI Batch Briefing
                 </h4>
                 <h5 className="text-xl font-black text-white leading-tight">Current Batch Health: Optimal with Minor Gaps</h5>
                 <p className="text-sm text-neutral-400 leading-relaxed font-medium">
                   The current cohort shows strong expertise in <strong>React & Frontend Architecture</strong>. 
                   However, cross-student analysis reveals a 25% drop in performance regarding <strong>System Design</strong> fundamentals. 
                 </p>
                 <div className="pt-4 space-y-3">
                   <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-4">
                     <p className="text-[10px] font-bold text-neutral-500 uppercase mb-2">Top Skill Gaps</p>
                     <div className="flex flex-wrap gap-2">
                        {stats?.topSkillGaps?.map(g => (
                          <span key={g} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-neutral-200">{g}</span>
                        ))}
                     </div>
                   </div>
                 </div>
              </div>
           </div>

           <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 space-y-6">
              <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                 <AlertCircle className="w-4 h-4 text-rose-500" /> At-Risk Students
              </h4>
              <div className="space-y-4">
                 {students.filter(s => s.avgScore < 40).slice(0, 3).map(s => (
                   <div key={s.id} className="flex items-center gap-4 bg-neutral-800/40 p-3 rounded-2xl border border-white/5">
                      <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-[10px] font-black text-rose-500">
                         {s.name[0]}
                      </div>
                      <div className="flex-1">
                         <p className="text-xs font-bold text-white leading-none">{s.name}</p>
                         <p className="text-[10px] text-neutral-500 font-medium">Readiness: {s.avgScore}%</p>
                      </div>
                      <button className="text-[10px] font-black text-amber-500 uppercase tracking-widest hover:underline">Intervene</button>
                   </div>
                 ))}
                 {students.filter(s => s.avgScore < 40).length === 0 && <p className="text-xs text-neutral-500 font-medium italic">No students at critical risk.</p>}
              </div>
           </div>
        </div>
      </div>

      {/* Side Dossier Overlay */}
      {selectedStudentId && (
        <div className="fixed inset-0 z-[100] flex justify-end">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedStudentId(null)} />
           <div className="relative w-full max-w-2xl h-full">
              <StudentDossier 
                studentId={selectedStudentId} 
                onClose={() => setSelectedStudentId(null)} 
              />
           </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, subText, icon: Icon, color, trend }) {
  const colorMap = {
    amber: "from-amber-500 to-amber-600 shadow-amber-500/10",
    emerald: "from-emerald-500 to-emerald-600 shadow-emerald-500/10",
    blue: "from-blue-500 to-blue-600 shadow-blue-500/10",
    purple: "from-purple-500 to-purple-600 shadow-purple-500/10"
  }
  
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-[32px] p-8 space-y-6 hover:border-neutral-700 transition-all group">
      <div className="flex items-center justify-between">
         <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-tr text-neutral-950 shadow-xl", colorMap[color])}>
            <Icon className="w-6 h-6" />
         </div>
         {trend && (
           <span className="flex items-center gap-1 text-[11px] font-black text-emerald-500 bg-emerald-500/5 px-2 py-1 rounded-full border border-emerald-500/10">
              <ArrowUpRight className="w-3 h-3" /> {trend}
           </span>
         )}
      </div>
      <div>
         <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">{title}</p>
         <h4 className="text-4xl font-black text-white tracking-tighter">{value}</h4>
         <p className="text-xs font-bold text-neutral-600 mt-2">{subText}</p>
      </div>
    </div>
  )
}
