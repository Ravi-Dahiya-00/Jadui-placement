'use client'

import { useState, useEffect } from 'react'
import { Users, Search, Trophy, ArrowUpRight, Sparkles, Filter, MoreVertical, DownloadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'
import StudentDossier from '@/features/admin/StudentDossier'

export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, top, struggling, shortlisted
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  
  useEffect(() => {
    async function fetchData() {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      try {
        const res = await fetch(`${backendUrl}/api/admin/students`);
        const data = await res.json();
        setStudents(data.students || []);
      } catch (err) {
        console.error('Failed to fetch students', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleShortlistToggle = async (userId, e) => {
    if (e) e.stopPropagation();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${backendUrl}/api/admin/students/${userId}/shortlist`, { method: 'POST' });
      const data = await res.json();
      setStudents(prev => prev.map(s => s.id === userId ? { ...s, is_shortlisted: data.is_shortlisted } : s));
    } catch (err) {
      console.error('Toggle shortlist failed', err);
    }
  }

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.email?.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesFilter = true;
    if (filter === 'top') matchesFilter = s.avgScore >= 75;
    if (filter === 'struggling') matchesFilter = s.avgScore < 50;
    if (filter === 'shortlisted') matchesFilter = s.is_shortlisted;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-neutral-500 font-bold text-sm uppercase tracking-widest">Loading Master Roster...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-3">
             <div className="w-2 h-8 bg-amber-500 rounded-full" />
             <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Master Roster</h2>
           </div>
           <p className="text-neutral-500 font-medium max-w-lg">
             Manage all active candidates in your cohort. Double click any student to review their complete Dossier.
           </p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="bg-neutral-900 border border-neutral-800 p-1.5 rounded-2xl w-full md:w-80 flex relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-11 pr-4 py-2 text-xs outline-none focus:border-amber-500/50 transition-all font-bold tracking-widest placeholder:text-neutral-700"
                placeholder="Search by Name or Email..."
              />
           </div>
           <button className="h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-2 hover:bg-emerald-500 hover:text-neutral-950 hover:border-emerald-500 transition-all duration-300 whitespace-nowrap">
             <DownloadCloud className="w-4 h-4" />
             Export CSV
           </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="flex flex-wrap items-center gap-2 bg-neutral-900/50 p-2 rounded-2xl border border-neutral-800">
         <div className="flex items-center gap-2 px-4 border-r border-neutral-800">
            <Filter className="w-4 h-4 text-neutral-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Filters:</span>
         </div>
         {['all', 'top', 'struggling', 'shortlisted'].map(f => (
           <button 
             key={f}
             onClick={() => setFilter(f)}
             className={cn(
               "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
               filter === f 
                 ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20" 
                 : "bg-transparent text-neutral-500 hover:bg-white/5 hover:text-white"
             )}
           >
             {f === 'all' ? 'All Students' : f === 'top' ? 'Top Tier (>75%)' : f === 'struggling' ? 'Needs Focus (<50%)' : 'Shortlisted'}
           </button>
         ))}
      </div>

      {/* Full Width Roster Table */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
               <thead>
                 <tr className="bg-neutral-800/40 text-[10px] font-black uppercase tracking-widest text-neutral-400 border-b border-neutral-800">
                    <th className="px-6 py-5">Profile</th>
                    <th className="px-6 py-5">Global Readiness</th>
                    <th className="px-6 py-5">Missions Pending</th>
                    <th className="px-6 py-5">Status Tier</th>
                    <th className="px-6 py-5">Joined On</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-neutral-800/40">
                 {filteredStudents.length === 0 ? (
                   <tr>
                     <td colSpan={6} className="px-6 py-12 text-center">
                       <Users className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                       <h3 className="text-sm font-bold text-white mb-1">No candidates found</h3>
                       <p className="text-xs text-neutral-500">Adjust filters or search parameters</p>
                     </td>
                   </tr>
                 ) : filteredStudents.map(s => (
                   <tr key={s.id} className="group hover:bg-amber-500/[0.02] transition-colors cursor-pointer" onClick={() => setSelectedStudentId(s.id)}>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-4">
                            <div className="relative">
                               <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-sm font-black text-neutral-400 group-hover:border-amber-500/50 transition-colors shadow-inner">
                                  {s.name && s.name[0]?.toUpperCase()}
                               </div>
                               {s.is_shortlisted && (
                                 <div className="absolute -top-1.5 -right-1.5 bg-amber-500 rounded-xl p-1 border-[3px] border-neutral-950 shadow-lg" title="Shortlisted">
                                    <Trophy className="w-3 h-3 text-neutral-950" />
                                 </div>
                               )}
                            </div>
                            <div>
                               <p className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
                                 {s.name}
                                 {s.avgScore >= 80 && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                               </p>
                               <p className="text-[11px] text-neutral-500 font-medium mt-0.5">{s.email}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-4 w-48">
                            <span className="text-sm font-black text-white w-10">{s.avgScore}%</span>
                            <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                               <div className={cn(
                                 "h-full rounded-full transition-all duration-1000",
                                 s.avgScore >= 75 ? "bg-emerald-500" : s.avgScore >= 50 ? "bg-amber-500" : "bg-rose-500"
                               )} style={{ width: \`\${s.avgScore}%\` }} />
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         {s.pending_tpo_tasks > 0 ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-wider">
                               <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                               {s.pending_tpo_tasks} PENDING
                            </span>
                         ) : (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-neutral-800/50 border border-neutral-800 text-neutral-500 text-[10px] font-black uppercase tracking-wider">
                               All Clear
                            </span>
                         )}
                      </td>
                      <td className="px-6 py-4">
                         <span className={cn(
                           "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border",
                           s.avgScore >= 75 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                           s.avgScore >= 50 ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                           "bg-rose-500/10 border-rose-500/20 text-rose-400"
                         )}>
                           {s.avgScore >= 75 ? 'Placement Ready' : s.avgScore >= 50 ? 'Gaining Depth' : 'Initial Phase'}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                         <span className="text-xs text-neutral-500 font-medium whitespace-nowrap">
                           {new Date(s.joined_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center justify-end gap-2">
                           <button 
                             onClick={(e) => handleShortlistToggle(s.id, e)}
                             className={cn(
                               "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                               s.is_shortlisted 
                                ? "bg-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.2)] text-neutral-950" 
                                : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                             )}
                           >
                             {s.is_shortlisted ? '★ Starred' : 'Star'}
                           </button>
                           <button 
                             onClick={(e) => { e.stopPropagation(); setSelectedStudentId(s.id) }}
                             className="p-2 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white hover:border-white/20 hover:bg-neutral-700 transition-all font-bold flex items-center gap-2"
                             title="View Dossier"
                           >
                              <span className="text-[10px] uppercase tracking-widest hidden xl:inline">Dossier</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                           </button>
                         </div>
                      </td>
                   </tr>
                 ))}
               </tbody>
            </table>
         </div>
         {filteredStudents.length > 0 && (
           <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/80 flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                 Showing {filteredStudents.length} {filteredStudents.length === 1 ? 'Candidate' : 'Candidates'}
              </span>
           </div>
         )}
      </div>

      {/* Side Dossier Overlay */}
      {selectedStudentId && (
        <div className="fixed inset-0 z-[100] flex justify-end">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedStudentId(null)} />
           <div className="relative w-full max-w-2xl h-full animate-slide-left">
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
