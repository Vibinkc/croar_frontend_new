"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";

interface ProgressBreakdown {
    rater_relation: string;
    status: string;
}

interface RateeProgress {
    ratee_id: string;
    ratee_name: string;
    total: number;
    completed: number;
    ai_score?: number;
    breakdown: ProgressBreakdown[];
}

export default function X360CycleProgress() {
    const { token } = useAuth();
    const router = useRouter();
    const params = useParams();
    const cycleId = params.id as string;
    
    const [progress, setProgress] = useState<RateeProgress[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const res = await apiClient.get(`/api/v1/enterprise/x360/cycles/${cycleId}/progress`);
                if (res.ok) {
                    setProgress(await res.json());
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchProgress();
    }, [cycleId]);

    const getRelationIcon = (rel: string) => {
        switch(rel) {
            case 'SELF': return 'person';
            case 'MANAGER': return 'supervisor_account';
            case 'PEER': return 'groups';
            case 'REPORT': return 'assignment_ind';
            default: return 'help';
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center">
                            <span className="material-symbols-rounded text-xl">arrow_back</span>
                        </button>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Cycle Progress Tracker</h1>
                    </div>
                    <p className="text-slate-400 font-black   text-[10px] flex items-center gap-2">
                        <span className="material-symbols-rounded text-sm text-indigo-500">monitoring</span>
                        Detailed Breakdown by Employee
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {progress.length > 0 ? progress.map((ratee, idx) => {
                    const pct = Math.round((ratee.completed / ratee.total) * 100);
                    return (
                        <div 
                            key={ratee.ratee_id} 
                            className="bg-white p-6 rounded-xl border border-slate-100 shadow-xl shadow-slate-100/10 hover:shadow-2xl hover:shadow-slate-200/20 transition-all group animate-in slide-in-from-bottom-4 duration-700"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                                {/* Employee Identity */}
                                <div className="lg:w-1/4 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 overflow-hidden">
                                            <span className="material-symbols-rounded text-2xl">account_circle</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 tracking-tight">{ratee.ratee_name}</h3>
                                            <p className="text-[9px] font-black text-slate-400   leading-none">Project Ratee</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Rater Breakdown */}
                                <div className="flex-1">
                                    <div className="flex flex-wrap gap-3">
                                        {ratee.breakdown.map((b, bIdx) => (
                                            <div key={bIdx} className={`px-3 py-2 rounded-xl border flex items-center gap-2.5 transition-all shrink-0 ${
                                                b.status === 'COMPLETED' 
                                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                                                : 'bg-slate-50/50 border-slate-100 text-slate-400 opacity-60'
                                            }`}>
                                                <span className="material-symbols-rounded text-base leading-none shrink-0">{getRelationIcon(b.rater_relation)}</span>
                                                <div className="text-left min-w-0">
                                                    <p className="text-[6px] font-black   leading-none mb-0.5 truncate">{b.rater_relation}</p>
                                                    <p className="text-[9px] font-black leading-none truncate">{b.status === 'COMPLETED' ? 'Done' : 'Pending'}</p>
                                                </div>
                                                {b.status === 'COMPLETED' && (
                                                    <span className="material-symbols-rounded text-[10px] shrink-0">verified</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Progress Bar & Stats */}
                                <div className="lg:w-1/3 space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center gap-4">
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] font-black text-slate-400   leading-none">Status</p>
                                                <p className="text-xl font-black text-slate-900 leading-none">{pct}% Complete</p>
                                            </div>
                                            {ratee.ai_score !== null && ratee.ai_score !== undefined && (
                                                <div className="bg-indigo-600 px-4 py-2 rounded-xl text-white shadow-lg shadow-indigo-100 animate-in zoom-in duration-500">
                                                    <p className="text-[8px] font-black   leading-none mb-1 opacity-80">AI Perf Score</p>
                                                    <p className="text-lg font-black leading-none">{ratee.ai_score} <span className="text-[10px] opacity-60">/ 10</span></p>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs font-black text-slate-400 leading-none mb-1">{ratee.completed} / {ratee.total}</p>
                                    </div>
                                    <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${pct === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                                            style={{ width: `${pct}%` }}
                                        ></div>
                                    </div>
                                    
                                    {pct === 100 && (
                                        <button 
                                            onClick={() => router.push(`/enterprise/assessments-360/reports/${ratee.ratee_id}/${cycleId}`)}
                                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[9px]   hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            Full Insight Report
                                            <span className="material-symbols-rounded text-base">analytics</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="py-20 text-center bg-white rounded-xl border border-dashed border-slate-200">
                        <span className="material-symbols-rounded text-4xl text-slate-200 mb-4">group_off</span>
                        <p className="text-slate-400 font-bold   text-[10px]">No project ratees found for this cycle</p>
                    </div>
                )}
            </div>
        </div>
    );
}
