"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";

interface Cycle {
    id: string;
    name: string;
    status: string;
    start_date: string;
    end_date: string;
}

export default function X360Dashboard() {
    const { canAccess } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({
        activeCycles: 0,
        pendingMyAssessments: 0,
        completedMyAssessments: 0,
        totalParticipants: 0
    });
    const [recentCycles, setRecentCycles] = useState<Cycle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const filteredCycles = recentCycles.filter(cycle => 
        (statusFilter === "all" || cycle.status === statusFilter) &&
        (cycle.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const fetchDashboardData = useCallback(async () => {
        try {
            const [statsRes, cyclesRes] = await Promise.all([
                apiClient.get('/api/v1/enterprise/x360/stats'),
                apiClient.get('/api/v1/enterprise/x360/cycles')
            ]);

            if (statsRes.ok && cyclesRes.ok) {
                const statsData = await statsRes.json();
                const cycles = await cyclesRes.json();
                
                setStats({
                    activeCycles: statsData.active_cycles,
                    pendingMyAssessments: statsData.pending_my_assignments,
                    completedMyAssessments: statsData.completed_my_assignments,
                    totalParticipants: statsData.total_participants
                });
                setRecentCycles(cycles.slice(0, 3));
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);


    if (loading) return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
            <div className="w-12 h-12 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-4 sm:p-5 max-w-7xl mx-auto space-y-6 pt-2 animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl border border-slate-100 p-2 shadow-lg shadow-slate-200/20">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-9 h-9 bg-violet-50 text-[#7C3AED] rounded-xl flex items-center justify-center">
                        <span className="material-symbols-rounded">360</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 tracking-tight">360 Assessments</h1>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">Enterprise Talent Review Hub</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    {canAccess("assessments:moderate") && (
                        <>
                            <Link 
                                href="/enterprise/assessments-360/questions" 
                                className="px-5 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-[#7C3AED] hover:border-violet-100 transition-all font-black text-[9px] uppercase tracking-widest flex items-center gap-2"
                            >
                                <span className="material-symbols-rounded text-base">quiz</span>
                                Question Bank
                            </Link>
                            <Link 
                                href="/enterprise/assessments-360/templates" 
                                className="px-5 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-[#7C3AED] hover:border-violet-100 transition-all font-black text-[9px] uppercase tracking-widest flex items-center gap-2"
                            >
                                <span className="material-symbols-rounded text-base">description</span>
                                Templates
                            </Link>
                            <Link 
                                href="/enterprise/assessments-360/new" 
                                className="px-8 py-2.5 bg-[#7C3AED] text-white rounded-xl hover:bg-[#6D28D9] transition-all font-black text-[9px] uppercase tracking-[0.2em] flex items-center gap-2 shadow-xl shadow-indigo-100"
                            >
                                <span className="material-symbols-rounded text-base">add</span>
                                New Cycle
                            </Link>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-lg shadow-slate-100/30 group hover:border-[#7C3AED] transition-all duration-500">
                    <div className="w-10 h-10 bg-violet-50 text-[#7C3AED] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#7C3AED] group-hover:text-white transition-all duration-500">
                        <span className="material-symbols-rounded text-xl">sync</span>
                    </div>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-none mb-1.5">Active Cycles</p>
                    <p className="text-2xl font-black text-slate-900 mt-1 leading-none tracking-tighter">{stats.activeCycles}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-lg shadow-slate-100/30 group hover:border-orange-500 transition-all duration-500">
                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
                        <span className="material-symbols-rounded text-xl">pending_actions</span>
                    </div>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-none mb-1.5">Pending Action</p>
                    <p className="text-2xl font-black text-slate-900 mt-1 leading-none tracking-tighter">{stats.pendingMyAssessments}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-lg shadow-slate-100/30 group hover:border-emerald-500 transition-all duration-500">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                        <span className="material-symbols-rounded text-xl">check_circle</span>
                    </div>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-none mb-1.5">Completed</p>
                    <p className="text-2xl font-black text-slate-900 mt-1 leading-none tracking-tighter">{stats.completedMyAssessments}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-lg shadow-slate-100/30 group hover:border-blue-500 transition-all duration-500">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                        <span className="material-symbols-rounded text-xl">groups</span>
                    </div>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-none mb-1.5">Participants</p>
                    <p className="text-2xl font-black text-slate-900 mt-1 leading-none tracking-tighter">{stats.totalParticipants}</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 relative w-full group">
                    <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg transition-colors group-focus-within:text-[#7C3AED]">search</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search cycles by name..."
                        className="w-full h-12 bg-white border border-slate-100 rounded-xl pl-12 pr-4 text-[13px] font-bold text-slate-700 placeholder:text-slate-400 focus:border-[#7C3AED] focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none shadow-sm"
                    />
                </div>
                
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm min-w-[200px]">
                    <span className="material-symbols-rounded text-slate-400 ml-2 text-lg">filter_list</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-transparent border-none text-[11px] font-black text-slate-700 focus:outline-none focus:ring-0 cursor-pointer uppercase tracking-wider"
                    >
                        <option value="all">All Cycles</option>
                        <option value="ACTIVE">Active Only</option>
                        <option value="DRAFT">Drafts</option>
                        <option value="CLOSED">Closed</option>
                    </select>
                </div>
            </div>

            <div className="mt-2">
                <div className="bg-white rounded-xl border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
                    <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-rounded text-[#7C3AED] text-lg">dashboard_customize</span>
                            <h2 className="font-black text-slate-900 text-[10px] uppercase tracking-widest">Assessment Cycles</h2>
                        </div>
                        <Link href="/enterprise/assessments-360/cycles" className="text-[#7C3AED] text-[9px] font-black uppercase tracking-widest hover:underline">View All Cycles</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/20">
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Cycle Details</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Timeline</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Status</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredCycles.length > 0 ? filteredCycles.map((cycle) => (
                                    <tr 
                                        key={cycle.id} 
                                        className="group hover:bg-slate-50/50 transition-all cursor-pointer" 
                                        onClick={() => router.push(`/enterprise/assessments-360/cycles/${cycle.id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-violet-50 text-[#7C3AED] rounded-xl flex items-center justify-center group-hover:bg-[#7C3AED] group-hover:text-white transition-all">
                                                    <span className="material-symbols-rounded text-base">sync</span>
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 leading-tight mb-0.5 text-xs">{cycle.name}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 tracking-tight">Enterprise talent review</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <span className="material-symbols-rounded text-[10px]">calendar_today</span>
                                                    <span className="text-[9px] font-bold font-mono tracking-tighter">
                                                        {new Date(cycle.start_date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <span className="material-symbols-rounded text-[10px]">event</span>
                                                    <span className="text-[9px] font-bold font-mono tracking-tighter">
                                                        {new Date(cycle.end_date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black inline-flex items-center gap-1.5 ${
                                                cycle.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                                                cycle.status === 'DRAFT' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                'bg-slate-50 text-slate-500 border border-slate-100'
                                            }`}>
                                                <span className={`w-1 h-1 rounded-full ${
                                                    cycle.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                                                }`}></span>
                                                {cycle.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button className="px-4 py-1.5 bg-white border border-slate-100 text-slate-900 rounded-xl font-black text-[8px] hover:bg-slate-900 hover:text-white transition-all shadow-sm flex items-center gap-1.5">
                                                    Manage
                                                    <span className="material-symbols-rounded text-[10px]">trending_up</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center">
                                            <p className="text-slate-300 font-black text-[10px] uppercase tracking-widest">
                                                {searchQuery || statusFilter !== 'all' ? "No cycles match parameters" : "No assessment cycles active"}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
