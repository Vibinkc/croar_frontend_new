"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";

interface Cycle {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
}

export default function X360CyclesList() {
    const { token } = useAuth();
    const router = useRouter();
    const [cycles, setCycles] = useState<Cycle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCycles = async () => {
            try {
                const res = await apiClient.get('/api/v1/enterprise/x360/cycles');
                if (res.ok) {
                    setCycles(await res.json());
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchCycles();
    }, []);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-end pb-6 border-b border-slate-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center">
                            <span className="material-symbols-rounded text-xl">arrow_back</span>
                        </button>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assessment Cycles</h1>
                    </div>
                    <p className="text-slate-400 font-black   text-[10px] flex items-center gap-2">
                        <span className="material-symbols-rounded text-sm text-indigo-500">sync</span>
                        Manage performance reviews and comprehensive feedback
                    </p>
                </div>
                <Link href="/enterprise/assessments-360/new" className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs   hover:bg-indigo-600 transition-all shadow-xl shadow-slate-100">
                    New Cycle
                </Link>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-2xl shadow-slate-200/20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400   border-b border-slate-50">Cycle Name</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400   border-b border-slate-50">Timeline</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400   border-b border-slate-50">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400   border-b border-slate-50 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {cycles.length > 0 ? cycles.map((cycle, idx) => (
                                <tr key={cycle.id} className="group hover:bg-slate-50/50 transition-all duration-300 animate-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                                <span className="material-symbols-rounded text-xl">refresh</span>
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 leading-none mb-1">{cycle.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400  tracking-tight ">360° Assessment</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <span className="material-symbols-rounded text-sm opacity-40">calendar_month</span>
                                            <span className="text-xs font-bold font-mono tracking-tighter">
                                                {new Date(cycle.start_date).toLocaleDateString()}
                                                <span className="mx-2 text-slate-300">→</span>
                                                {new Date(cycle.end_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black   inline-flex items-center gap-2 ${
                                            cycle.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                                            cycle.status === 'DRAFT' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                                            'bg-slate-50 text-slate-500 border border-slate-100'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                cycle.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 
                                                cycle.status === 'DRAFT' ? 'bg-amber-500' : 'bg-slate-400'
                                            }`}></span>
                                            {cycle.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button 
                                            onClick={() => router.push(`/enterprise/assessments-360/cycles/${cycle.id}`)}
                                            className="px-6 py-2.5 bg-white border border-slate-100 text-slate-900 rounded-xl font-black text-[10px]   hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm flex items-center gap-2 ml-auto"
                                        >
                                            Track Progress
                                            <span className="material-symbols-rounded text-sm">trending_up</span>
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center text-slate-200">
                                                <span className="material-symbols-rounded text-4xl">folder_off</span>
                                            </div>
                                            <p className="text-slate-400 font-bold   text-[10px]">No active cycles found in repository</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
