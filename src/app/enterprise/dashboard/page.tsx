"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";

interface Stats {
    active_jobs: number;
    total_candidates: number;
    total_applications: number;
    interviews_scheduled: number;
    agent_name: string;
    high_value_matches: number;
}

export default function EnterpriseDashboard() {
    const { user, token, role } = useAuth();
    const [greeting, setGreeting] = useState("");
    const [stats, setStats] = useState<Stats>({
        active_jobs: 0,
        total_candidates: 0,
        total_applications: 0,
        interviews_scheduled: 0,
        agent_name: "COMMANDER",
        high_value_matches: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("OPERATIONAL_START");
        else if (hour < 18) setGreeting("MID_DAY_SYNC");
        else setGreeting("EVENING_LOG");

        if (token) {
            fetchStats();
        }
    }, [token]);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/dashboard/stats`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const modules = [
        {
            title: "Job Requisitions",
            description: "Deploy precision job tracking and manage active talent requisitions.",
            icon: "business_center",
            path: "/enterprise/jobs",
            badge: "Hiring Velocity",
            color: "purple",
            features: ["AI Assisted JD", "Node Publishing", "Fiscal Tracking"]
        },
        {
            title: "Candidate Pipeline",
            description: "Automated screening algorithms via proprietary fit-scoring heuristics.",
            icon: "psychology",
            path: "/enterprise/candidates/kanban",
            badge: "AI Screening",
            color: "indigo",
            features: ["Smart Sync", "Cross Check", "Batch Ops"]
        },
        {
            title: "Talent Pool",
            description: "Search the global Academik node network for validated elite talent.",
            icon: "public",
            path: "/enterprise/candidates/kanban",
            badge: "Direct Sourcing",
            color: "emerald",
            features: ["Skill Matrix", "Verified Tier", "Public API"]
        },
        {
            title: "Evaluation Matrix",
            description: "Critically evaluate AI assessment telemetry and selection metrics.",
            icon: "analytics",
            path: "/enterprise/assessments-360",
            badge: "Data Verification",
            color: "rose",
            features: ["Audio Trace", "Bias Filter", "Output Valid"]
        }
    ];

    const getColorClasses = (color: string) => {
        const colors: any = {
            indigo: { border: "border-indigo-100", bg: "bg-indigo-50/30", text: "text-indigo-600", dot: "bg-indigo-400" },
            purple: { border: "border-[#7C3AED]/10", bg: "bg-[#7C3AED]/5", text: "text-[#7C3AED]", dot: "bg-[#7C3AED]" },
            rose: { border: "border-rose-100", bg: "bg-rose-50/30", text: "text-rose-600", dot: "bg-rose-400" },
            emerald: { border: "border-emerald-100", bg: "bg-emerald-50/30", text: "text-emerald-600", dot: "bg-emerald-400" },
        };
        return colors[color] || { border: "border-slate-100", bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" };
    };

    return (
        <div className="p-4 space-y-4 animate-in fade-in duration-500 overflow-hidden">
            {/* Tactical Command Header */}
            <section className="bg-slate-900 rounded-[2rem] p-8 md:p-10 text-white flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden shadow-2xl">
                <div className="relative z-10 flex-1 space-y-6">
                    <div>
                        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black tracking-widest uppercase mb-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Recruitment Control Center v2.4
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-none mb-3 uppercase">
                            {greeting}, <span className="text-indigo-400">{isLoading ? 'COMMANDER' : stats.agent_name}</span>.
                        </h2>
                        <p className="text-slate-400 text-[11px] max-w-sm font-bold uppercase tracking-widest leading-relaxed opacity-70">
                            Neural analysis detected <span className="text-white bg-indigo-500/50 px-1 rounded">{isLoading ? '---' : stats.high_value_matches}</span> high-value matches in the screening queue. Recommend immediate verification.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link href="/enterprise/jobs/create" className="px-6 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-400 hover:text-white transition-all shadow-xl active:scale-95 flex items-center gap-2">
                            <span className="material-symbols-rounded text-lg">add_box</span>
                            Post New Job
                        </Link>
                        <Link href="/enterprise/candidates/kanban" className="px-6 py-3 bg-white/10 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95 flex items-center gap-2">
                            <span className="material-symbols-rounded text-lg">grid_goldenratio</span>
                            Manage Pipeline
                        </Link>
                    </div>
                </div>

                {/* Performance HUD Elements */}
                <div className="relative z-10 grid grid-cols-2 gap-4 w-full lg:w-auto">
                    {[
                        { label: "Active Jobs", value: stats.active_jobs, icon: "rocket_launch", color: "text-indigo-400", bg: "bg-indigo-500/10" },
                        { label: "Total Candidates", value: stats.total_candidates, icon: "sensor_occupied", color: "text-emerald-400", bg: "bg-emerald-500/10" },
                        { label: "Total Applications", value: stats.total_applications, icon: "conversion_path", color: "text-rose-400", bg: "bg-rose-500/10" },
                        { label: "Scheduled Interviews", value: stats.interviews_scheduled, icon: "videocam", color: "text-amber-400", bg: "bg-amber-500/10" },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-5 min-w-[160px] flex flex-col gap-3 group hover:bg-white/10 transition-all border-b-4 border-b-transparent hover:border-b-white/20">
                            <div className="flex items-center justify-between">
                                <span className={`material-symbols-rounded text-2xl ${stat.color}`}>{stat.icon}</span>
                                <div className="flex flex-col items-end">
                                    <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em]">Live Feed</span>
                                    <div className="w-4 h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                                        <div className="h-full bg-emerald-400 w-2/3 animate-[shimmer_2s_infinite]"></div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1">{stat.label}</span>
                                <span className="text-3xl font-black tracking-tighter leading-none">
                                    {isLoading ? '---' : stat.value}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -mr-64 -mt-64"></div>
            </section>

            {/* Tactical Grid Modules */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
                {/* Core Modules List */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5">
                    {modules.map((module) => (
                        <Link href={module.path} key={module.title} className="group">
                            <div className={`relative ${getColorClasses(module.color).bg} border ${getColorClasses(module.color).border} p-7 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full overflow-hidden flex flex-col justify-between`}>
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`w-12 h-12 rounded-2xl bg-white border border-slate-50 ${getColorClasses(module.color).text} flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-6 shadow-sm`}>
                                            <span className="material-symbols-rounded text-2xl">{module.icon}</span>
                                        </div>
                                        <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black tracking-widest uppercase bg-white/50 border border-slate-50 text-slate-400 group-hover:bg-white group-hover:text-[#7C3AED] transition-all`}>
                                            {module.badge}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-[15px] font-black text-slate-900 uppercase tracking-tighter group-hover:text-[#7C3AED] transition-colors">
                                            {module.title}
                                        </h3>
                                        <p className="text-[11px] text-slate-500 font-bold leading-relaxed uppercase opacity-70 mb-6">
                                            {module.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-1.5 pt-4 border-t border-slate-100/50 mt-4">
                                    {module.features.map((feature, idx) => (
                                        <span key={idx} className="px-2.5 py-1 bg-white border border-slate-50 text-slate-400 rounded-lg text-[8px] font-black uppercase tracking-tight group-hover:border-indigo-100/50 transition-all">
                                            {feature}
                                        </span>
                                    ))}
                                </div>

                                <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-white border border-slate-100/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all scale-50 group-hover:scale-100">
                                    <span className="material-symbols-rounded text-[#7C3AED]">arrow_forward</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Strategic Side-Ops */}
                <div className="lg:col-span-4 space-y-5">
                    <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm h-full flex flex-col">
                        <div className="flex items-center justify-between mb-10">
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Efficiency_Matrix</span>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border-4 border-emerald-50"></div>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center py-6">
                            <div className="relative w-48 h-48 group">
                                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible drop-shadow-2xl">
                                    {[0.2, 0.4, 0.6, 0.8, 1].map((step, i) => (
                                        <circle key={i} cx="50" cy="50" r={50 * step} className="fill-none stroke-slate-50 stroke-[0.5]" />
                                    ))}
                                    <line x1="50" y1="50" x2="50" y2="0" className="stroke-slate-50 stroke-[0.5]" />
                                    <line x1="50" y1="50" x2="100" y2="50" className="stroke-slate-50 stroke-[0.5]" />
                                    <line x1="50" y1="50" x2="50" y2="100" className="stroke-slate-50 stroke-[0.5]" />
                                    <line x1="50" y1="50" x2="0" y2="50" className="stroke-slate-50 stroke-[0.5]" />

                                    <polygon
                                        points="50,15 85,40 60,80 20,50"
                                        className="fill-[#7C3AED]/10 stroke-[#7C3AED] stroke-[3] transition-all duration-1000 group-hover:fill-[#7C3AED]/20"
                                    />
                                    <circle cx="50" cy="15" r="2" className="fill-[#7C3AED]" />
                                    <circle cx="85" cy="40" r="2" className="fill-indigo-400" />
                                    <circle cx="60" cy="80" r="2" className="fill-emerald-400" />
                                    <circle cx="20" cy="50" r="2" className="fill-rose-400" />
                                </svg>

                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 text-[8px] font-black text-slate-400 uppercase tracking-widest">Velocity</div>
                                <div className="absolute top-1/2 right-0 translate-x-10 -translate-y-1/2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Accuracy</div>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 text-[8px] font-black text-slate-400 uppercase tracking-widest">Volume</div>
                                <div className="absolute top-1/2 left-0 -translate-x-10 -translate-y-1/2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Precision</div>
                            </div>
                        </div>

                        <div className="mt-10">
                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 relative group overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-[#7C3AED]"></div>
                                <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">
                                    System suggests <span className="text-[#7C3AED]">Optimization_Beta</span>. Candidate throughput is 14% higher than average.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
