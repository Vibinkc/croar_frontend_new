"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Zap, 
    ArrowLeft, 
    BarChart3, 
    User, 
    TrendingUp, 
    ChevronRight, 
    Eye,
    ShieldAlert,
    Atom
} from "lucide-react";

interface Result {
    id: string;
    employee_name: string;
    scenario_title: string;
    category: string;
    overall_score: number | null;
    created_at: string;
    completed_at?: string;
}

const MOCK_RESULTS: Result[] = [
    {
        id: "mock_1",
        employee_name: "Alex Johnson",
        scenario_title: "Conflict Resolution: Q3 Deliverable Delay",
        category: "CONFLICT",
        overall_score: 8.5,
        created_at: new Date().toISOString()
    },
    {
        id: "mock_2",
        employee_name: "Sarah Miller",
        scenario_title: "Strategic Sales: Neural Core Pitch",
        category: "SALES",
        overall_score: 9.2,
        created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
        id: "mock_3",
        employee_name: "Marcus Chen",
        scenario_title: "Leadership: Team Performance Review",
        category: "LEADERSHIP",
        overall_score: 4.8,
        created_at: new Date(Date.now() - 172800000).toISOString()
    },
    {
        id: "mock_4",
        employee_name: "Elena Rodriguez",
        scenario_title: "Exit Interview: Senior Architect",
        category: "EXIT_INTERVIEW",
        overall_score: 7.0,
        created_at: new Date(Date.now() - 259200000).toISOString()
    }
];

export default function ResultsDashboard() {
    const { token } = useAuth();
    const router = useRouter();
    const [results, setResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);

    useEffect(() => {
        if (token) fetchResults();
    }, [token]);

    const fetchResults = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/simulations/results`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setResults(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            // Add a small delay for smoother skeleton transition
            setTimeout(() => setLoading(false), 800);
        }
    };

    const handleSeedData = () => {
        setSeeding(true);
        setTimeout(() => {
            setResults(prev => [...MOCK_RESULTS, ...prev]);
            setSeeding(false);
        }, 1200);
    };

    if (loading) {
        return (
            <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
                <div className="h-32 bg-slate-900 rounded-2xl relative overflow-hidden flex items-center px-10 border-b-4 border-slate-800 shadow-2xl">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/5 rounded-xl animate-pulse" />
                        <div className="space-y-2">
                            <div className="w-48 h-6 bg-white/10 rounded-xl animate-pulse" />
                            <div className="w-32 h-3 bg-white/5 rounded-xl animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-8 space-y-4 shadow-sm animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-20 bg-slate-50 rounded-xl border border-slate-100" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-12 max-w-7xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700">
            {/* Tactical Command Header */}
            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 rounded-2xl p-8 md:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl border-b-4 border-slate-800"
            >
                <div className="relative z-10 flex items-center gap-8">
                    <button 
                        onClick={() => router.push('/enterprise/ai-training/scenarios')} 
                        className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl hover:bg-white/10 transition-all active:scale-95 group shadow-inner"
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-white group-hover:-translate-x-1 transition-all" />
                    </button>
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                            <span className="text-[8px] font-black  tracking-[0.1em] text-indigo-400">Performance Analytics</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter leading-none   flex items-center gap-4">
                            Performance Results
                        </h1>
                        <p className="text-[10px] text-slate-400 font-bold  tracking-[0.3em] mt-3 opacity-60">Review training session outcomes and behavioral analytics</p>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-4">
                    <button
                        onClick={handleSeedData}
                        disabled={seeding}
                        className="px-8 h-14 bg-indigo-600 text-white rounded-xl text-[10px] font-black  tracking-[0.2em] hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-30 shadow-xl shadow-indigo-500/20 flex items-center gap-3 group"
                    >
                        {seeding ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Zap className="w-5 h-5 group-hover:animate-bounce" />
                        )}
                        Seed Test Data
                    </button>
                </div>

                {/* Tactical background elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -mr-64 -mt-64" />
                <div className="absolute bottom-0 left-0 w-64 h-1 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
            </motion.header>

            {/* Tactical Grid List */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/20 overflow-hidden relative">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400  tracking-[0.2em]">Employee Name</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400  tracking-[0.2em]">Scenario</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400  tracking-[0.2em]">Archetype</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400  tracking-[0.2em]">Overall Score</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400  tracking-[0.2em]">Timestamp</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400  tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {results.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-6 opacity-30">
                                            <Atom className="w-20 h-20 text-slate-200 animate-spin-slow" />
                                            <div>
                                                <h3 className="text-xl font-black text-slate-800  tracking-tighter ">No Results Found</h3>
                                                <p className="text-xs text-slate-400 font-bold   mt-1">Complete a training scenario to generate results</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : results.map((res, idx) => (
                                <motion.tr 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={res.id} 
                                    className="group hover:bg-slate-50/80 transition-all duration-300"
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-[10px]  shadow-lg shadow-slate-200 transition-transform group-hover:scale-110">
                                                {res.employee_name?.[0]}
                                            </div>
                                            <div>
                                                <span className="text-xs font-black text-slate-800  tracking-tight block">{res.employee_name}</span>
                                                <span className="text-[8px] font-black text-slate-400  ">Employee</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="space-y-1">
                                            <span className="text-[11px] font-black text-slate-600 tracking-tight block   leading-none">{res.scenario_title}</span>
                                            <span className="text-[7px] font-black text-indigo-400   leading-none">Training Module</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-xl shadow-sm">
                                            <span className="w-1 h-1 rounded-full bg-indigo-500" />
                                            <span className="text-[8px] font-black text-slate-600  ">
                                                {res.category}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        {res.overall_score ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden p-[2px]">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${res.overall_score * 10}%` }}
                                                        transition={{ duration: 1, delay: 0.5 }}
                                                        className={`h-full rounded-full ${
                                                            res.overall_score >= 8 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 
                                                            res.overall_score >= 5 ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                                                        }`}
                                                    ></motion.div>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-900 tabular-nums ">{res.overall_score.toFixed(1)} <span className="text-slate-300 opacity-60">/ 10</span></span>
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center gap-2 text-[9px] font-black text-slate-300  ">
                                                <TrendingUp className="w-3 h-3 animate-pulse" />
                                                Processing Results...
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-[9px] font-black text-slate-400   tabular-nums ">
                                            {new Date(res.completed_at || res.created_at).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button 
                                            onClick={() => router.push(`/enterprise/ai-training/portal?session_id=${res.id}`)}
                                            className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-white hover:bg-slate-900 hover:border-slate-900 transition-all flex items-center justify-center shadow-sm group/btn"
                                        >
                                            <Eye className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tactical Footer Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Total Sessions", val: results.length, icon: BarChart3, color: "text-indigo-400" },
                    { label: "Avg. Score", val: results.length ? (results.reduce((a,b)=>a+(b.overall_score||0),0)/results.length).toFixed(1) : "0.0", icon: TrendingUp, color: "text-emerald-400" },
                    { label: "Top Archetype", val: "CONFLICT", icon: ShieldAlert, color: "text-amber-400" },
                    { label: "Status", val: "OPTIMAL", icon: Zap, color: "text-indigo-400" }
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-100 p-6 flex items-center justify-between shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                        <div>
                            <p className="text-[8px] font-black text-slate-400   mb-1">{stat.label}</p>
                            <p className="text-xl font-black text-slate-900  tracking-tighter leading-none">{stat.val}</p>
                        </div>
                        <stat.icon className={`w-6 h-6 ${stat.color} opacity-40`} />
                    </div>
                ))}
            </div>
        </div>
    );
}
