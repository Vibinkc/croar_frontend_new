"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";

export default function ResultsDashboard() {
    const { token } = useAuth();
    const router = useRouter();
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) fetchResults();
    }, [token]);

    const fetchResults = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/simulations/results`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setResults(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700">
            <header className="flex justify-between items-center pb-8 border-b border-slate-100 uppercase tracking-widest whitespace-nowrap overflow-x-auto no-scrollbar gap-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/enterprise/ai-training/scenarios')} className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center font-black">
                        <span className="material-symbols-rounded text-xl">arrow_back</span>
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Performance Intelligence</h1>
                        <p className="text-slate-500 font-black uppercase tracking-widest text-[9px] flex items-center gap-2">
                            <span className="material-symbols-rounded text-sm text-indigo-500">analytics</span>
                            Behavioral audit results from neural coaching lab
                        </p>
                    </div>
                </div>
            </header>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/20 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-900 border-b border-white text-white">
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Participant</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Scenario Blueprint</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Archetype</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Neural Score</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Timestamp</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-right">Insight</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {results.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-black text-[10px] uppercase tracking-widest leading-none">
                                    No simulation recordings yet detected in the laboratory.
                                </td>
                            </tr>
                        ) : results.map((res) => (
                            <tr key={res.id} className="group hover:bg-slate-50 transition-all">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 text-xs">
                                            {res.employee_name[0]}
                                        </div>
                                        <span className="text-sm font-black text-slate-800">{res.employee_name}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className="text-sm font-black text-slate-600 tracking-tight">{res.scenario_title}</span>
                                </td>
                                <td className="px-8 py-6">
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                                        {res.category}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    {res.overall_score ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-12 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${
                                                        res.overall_score >= 8 ? 'bg-emerald-500' : 
                                                        res.overall_score >= 5 ? 'bg-amber-500' : 'bg-rose-500'
                                                    }`}
                                                    style={{ width: `${res.overall_score * 10}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-900">{res.overall_score}/10</span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-black text-slate-300 uppercase italic">Calculating...</span>
                                    )}
                                </td>
                                <td className="px-8 py-6">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {new Date(res.completed_at || res.created_at).toLocaleDateString()}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <button 
                                        onClick={() => router.push(`/enterprise/ai-training/portal?session_id=${res.id}`)}
                                        className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                    >
                                        <span className="material-symbols-rounded text-lg">visibility</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
