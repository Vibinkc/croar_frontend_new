"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";

export default function X360Dashboard() {
    const { token } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({
        activeCycles: 0,
        pendingMyAssessments: 0,
        completedMyAssessments: 0
    });
    const [recentCycles, setRecentCycles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [cyclesRes, myRes] = await Promise.all([
                    apiClient.get('/api/v1/enterprise/x360/cycles'),
                    apiClient.get('/api/v1/enterprise/x360/my-assessments')
                ]);

                if (cyclesRes.ok && myRes.ok) {
                    const cycles = await cyclesRes.json();
                    const myAssignments = await myRes.json();
                    
                    setStats({
                        activeCycles: cycles.filter((c: any) => c.status === 'ACTIVE').length,
                        pendingMyAssessments: myAssignments.filter((a: any) => a.status === 'PENDING').length,
                        completedMyAssessments: myAssignments.filter((a: any) => a.status === 'COMPLETED').length
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
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-end pb-6 border-b border-slate-100">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">360° Feedback</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1 italic">Cultivate excellence through comprehensive perspective.</p>
                </div>
                <div className="flex gap-4">
                    <Link 
                        href="/enterprise/assessments-360/questions" 
                        className="px-6 py-3 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                    >
                        <span className="material-symbols-rounded text-lg">quiz</span>
                        Question Bank
                    </Link>
                    <Link 
                        href="/enterprise/assessments-360/templates" 
                        className="px-6 py-3 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                    >
                        <span className="material-symbols-rounded text-lg">description</span>
                        Templates
                    </Link>
                    <Link 
                        href="/enterprise/assessments-360/new" 
                        className="px-10 py-3 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 shadow-2xl shadow-indigo-100"
                    >
                        <span className="material-symbols-rounded text-lg">add</span>
                        New Cycle
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/30 group hover:border-indigo-600 transition-all duration-500">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                        <span className="material-symbols-rounded text-2xl">sync</span>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-2">Active Cycles</p>
                    <p className="text-3xl font-black text-slate-900 mt-1 leading-none">{stats.activeCycles}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/30 group hover:border-orange-500 transition-all duration-500">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
                        <span className="material-symbols-rounded text-2xl">pending_actions</span>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-2">Pending My Action</p>
                    <p className="text-3xl font-black text-slate-900 mt-1 leading-none">{stats.pendingMyAssessments}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/30 group hover:border-emerald-500 transition-all duration-500">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                        <span className="material-symbols-rounded text-2xl">check_circle</span>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-2">Completed Tasks</p>
                    <p className="text-3xl font-black text-slate-900 mt-1 leading-none">{stats.completedMyAssessments}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-slate-200/20 overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-rounded text-indigo-600 text-xl">notification_important</span>
                            <h2 className="font-black text-slate-900 text-sm uppercase tracking-tight">Recent Activity</h2>
                        </div>
                        <Link href="/enterprise/assessments-360/my" className="text-indigo-600 text-[9px] font-black uppercase tracking-widest hover:underline">Full Feed</Link>
                    </div>
                    <div className="p-6">
                        <p className="text-slate-400 text-xs font-medium italic py-6 text-center border-2 border-dashed border-slate-50 rounded-2xl">
                            Personal action items will appear here as they are assigned.
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-slate-200/20 overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-rounded text-indigo-600 text-xl">dashboard_customize</span>
                            <h2 className="font-black text-slate-900 text-sm uppercase tracking-tight">Manage Active Cycles</h2>
                        </div>
                        <Link href="/enterprise/assessments-360/cycles" className="text-indigo-600 text-[9px] font-black uppercase tracking-widest hover:underline">View All Cycles</Link>
                    </div>
                    <div className="p-6 space-y-3">
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
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm transition-all transition-transform group-hover:scale-110">
                                        <span className="material-symbols-rounded text-lg">trending_up</span>
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
