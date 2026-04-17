"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";

export default function X360Dashboard() {
    const { token, canAccess } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({
        activeCycles: 0,
        pendingMyAssessments: 0,
        completedMyAssessments: 0,
        totalParticipants: 0
    });
    const [recentCycles, setRecentCycles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
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
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
            <div className="w-12 h-12 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-4 sm:p-5 max-w-7xl mx-auto space-y-6 pt-2 animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl border border-slate-100 p-2 shadow-lg shadow-slate-200/20">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-9 h-9 bg-violet-50 text-[#7C3AED] rounded-xl flex items-center justify-center">
                        <span className="material-symbols-rounded">360</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 tracking-tight">360 Assessments</h1>
                        <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest">Enterprise Talent Review Hub</p>
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
                                className="px-8 py-2.5 bg-[#7C3AED] text-white rounded-xl hover:bg-[#6D28D9] transition-all font-black text-[9px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-100"
                            >
                                <span className="material-symbols-rounded text-base">add</span>
                                New Cycle
                            </Link>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-lg shadow-slate-100/30 group hover:border-[#7C3AED] transition-all duration-500">
                    <div className="w-10 h-10 bg-violet-50 text-[#7C3AED] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#7C3AED] group-hover:text-white transition-all duration-500">
                        <span className="material-symbols-rounded text-xl">sync</span>
                    </div>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-none mb-1.5">Active Cycles</p>
                    <p className="text-2xl font-black text-slate-900 mt-1 leading-none">{stats.activeCycles}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-lg shadow-slate-100/30 group hover:border-orange-500 transition-all duration-500">
                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
                        <span className="material-symbols-rounded text-xl">pending_actions</span>
                    </div>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-none mb-1.5">Pending Action</p>
                    <p className="text-2xl font-black text-slate-900 mt-1 leading-none">{stats.pendingMyAssessments}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-lg shadow-slate-100/30 group hover:border-emerald-500 transition-all duration-500">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                        <span className="material-symbols-rounded text-xl">check_circle</span>
                    </div>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-none mb-1.5">Completed</p>
                    <p className="text-2xl font-black text-slate-900 mt-1 leading-none">{stats.completedMyAssessments}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-lg shadow-slate-100/30 group hover:border-blue-500 transition-all duration-500">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                        <span className="material-symbols-rounded text-xl">groups</span>
                    </div>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-none mb-1.5">Participants</p>
                    <p className="text-2xl font-black text-slate-900 mt-1 leading-none">{stats.totalParticipants}</p>
                </div>
            </div>

            <div className="mt-2">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
                    <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-rounded text-[#7C3AED] text-lg">dashboard_customize</span>
                            <h2 className="font-black text-slate-900 text-[11px] uppercase tracking-tight">Manage Active Cycles</h2>
                        </div>
                        <Link href="/enterprise/assessments-360/cycles" className="text-[#7C3AED] text-[9px] font-black uppercase tracking-widest hover:underline">View All Cycles</Link>
                    </div>
                    <div className="p-4 space-y-2">
                        {recentCycles.length > 0 ? recentCycles.map((cycle) => (
                            <div key={cycle.id} className="group p-5 bg-slate-50 rounded-2xl hover:bg-slate-900 transition-all duration-500 flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer" onClick={() => router.push(`/enterprise/assessments-360/cycles/${cycle.id}`)}>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 group-hover:text-white leading-tight mb-1">{cycle.name}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 group-hover:text-slate-500 uppercase tracking-widest">{new Date(cycle.start_date).toLocaleDateString()} - {new Date(cycle.end_date).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                        cycle.status === 'ACTIVE' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                                    }`}>
                                        {cycle.status}
                                    </span>
                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 group-hover:text-[#7C3AED] shadow-sm transition-all transition-transform group-hover:scale-110">
                                        <span className="material-symbols-rounded text-base">trending_up</span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <p className="text-slate-400 text-xs font-medium italic py-10 text-center border-2 border-dashed border-slate-50 rounded-2xl">
                                No assessment cycles currently active. Start one to begin tracking performance.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
