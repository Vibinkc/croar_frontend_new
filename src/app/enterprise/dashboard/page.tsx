"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { useCachedFetch } from "@/hooks/useCachedFetch";

const DEFAULT_STATS: Stats = {
    active_jobs: 0,
    total_candidates: 0,
    total_applications: 0,
    interviews_scheduled: 0,
    agent_name: "COMMANDER",
    high_value_matches: 0,
};

interface Stats {
    active_jobs: number;
    total_candidates: number;
    total_applications: number;
    interviews_scheduled: number;
    agent_name: string;
    high_value_matches: number;
}

export default function EnterpriseDashboard() {
    const { user, token, role, canAccess, isLoading: isAuthLoading } = useAuth();
    const [greeting, setGreeting] = useState("");

    // Cached: revisiting the dashboard shows the last stats INSTANTLY, then refreshes
    // in the background instead of blocking on a fresh fetch every time.
    const { data: statsData, isLoading } = useCachedFetch<Stats>(
        token ? `${BACKEND_URL}/api/v1/enterprise/dashboard/stats` : null,
        { token },
    );
    const stats = statsData ?? DEFAULT_STATS;

    useEffect(() => {
        const hour = new Date().getHours();
        const g = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setGreeting(g);
    }, []);

    const modules = [
        {
            title: "Manage Jobs",
            description: "Create and track job openings for your team.",
            icon: "business_center",
            path: "/enterprise/jobs",
            badge: "Active",
            color: "purple",
            features: ["AI Job Description", "Job Boards", "Hiring Budget"],
            permission: "jobs:read"
        },
        {
            title: "Candidates",
            description: "View and manage all candidates in your hiring process.",
            icon: "psychology",
            path: "/enterprise/candidates/kanban",
            badge: "AI Screening",
            color: "indigo",
            features: ["Auto-Sync", "Background Check", "Group Actions"],
            permission: "candidates:read"
        },
        {
            title: "360 Feedback",
            description: "Manage performance reviews and multi-rater feedback.",
            icon: "360",
            path: "/enterprise/assessments-360",
            badge: "Performance",
            color: "emerald",
            features: ["Reports", "Reviews", "Comparisons"],
            permission: "assessments:read"
        },
        {
            title: "Surveys",
            description: "Send engagement surveys and culture pulse checks.",
            icon: "poll",
            path: "/enterprise/surveys",
            badge: "Insights",
            color: "rose",
            features: ["Engagement", "Culture", "Analytics"],
            permission: "surveys:read"
        }
    ];

    interface ColorClasses {
        border: string;
        bg: string;
        text: string;
        dot: string;
    }

    const getColorClasses = (color: string): ColorClasses => {
        const colors: Record<string, ColorClasses> = {
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
            <section className="bg-slate-900 rounded-2xl p-6 md:p-8 text-white flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl">
                <div className="relative z-10 flex-1 space-y-6">
                    <div>
                        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black   mb-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            {"Dashboard"}
                        </div>
                        <h2 className="text-2xl md:text-4xl font-black tracking-tighter leading-none mb-3 ">
                            {greeting}, <span className="text-indigo-400">{isLoading ? 'COMMANDER' : stats.agent_name}</span>.
                        </h2>
                        <p className="text-slate-400 text-[11px] max-w-sm font-bold   leading-relaxed opacity-70">
                            AI found <span className="text-white bg-indigo-500/50 px-1 rounded">{isLoading ? '---' : stats.high_value_matches}</span> recommended candidates for you. Take a look at them now.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {canAccess("jobs:read") && (
                            <Link href="/enterprise/croar-pilot" className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl text-[10px] font-black hover:from-indigo-400 hover:to-violet-400 transition-all shadow-xl shadow-indigo-900/30 active:scale-95 flex items-center gap-2">
                                <span className="material-symbols-rounded text-lg">smart_toy</span>
                                {"Hire with AI"}
                            </Link>
                        )}
                        {canAccess("jobs:create") && (
                            <Link href="/enterprise/jobs/create" className="px-6 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black   hover:bg-indigo-400 hover:text-white transition-all shadow-xl active:scale-95 flex items-center gap-2">
                                <span className="material-symbols-rounded text-lg">add_box</span>
                                {"Post New Job"}
                            </Link>
                        )}
                        {canAccess("candidates:read") && (
                            <Link href="/enterprise/candidates/kanban" className="px-6 py-3 bg-white/10 border border-white/10 text-white rounded-xl text-[10px] font-black   hover:bg-white/20 transition-all active:scale-95 flex items-center gap-2">
                                <span className="material-symbols-rounded text-lg">grid_goldenratio</span>
                                {"Manage Pipeline"}
                            </Link>
                        )}
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
                        <div key={stat.label} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 min-w-[140px] flex flex-col gap-2 group hover:bg-white/10 transition-all border-b-4 border-b-transparent hover:border-b-white/20">
                            <div className="flex items-center justify-between">
                                <span className={`material-symbols-rounded text-xl ${stat.color}`}>{stat.icon}</span>
                                <div className="flex flex-col items-end">
                                    <span className="text-[7px] font-black text-white/30  tracking-[0.2em]">Live Feed</span>
                                    <div className="w-4 h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                                        <div className="h-full bg-emerald-400 w-2/3 animate-[shimmer_2s_infinite]"></div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-white/40   block mb-1">{stat.label}</span>
                                <span className="text-2xl font-black tracking-tighter leading-none">
                                    {isLoading ? '---' : stat.value}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -mr-64 -mt-64"></div>
            </section>

            {/* Getting Started checklist — guides a new user; hides once set up */}
            {!isLoading && !(stats.active_jobs > 0 && stats.total_candidates > 0) && (
                <section className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-rounded text-indigo-600">rocket_launch</span>
                        <h3 className="text-sm font-black text-slate-900">Getting started</h3>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold mb-5">A few steps to get your first hire moving.</p>
                    <div className="grid gap-3 md:grid-cols-3">
                        {[
                            {
                                done: stats.active_jobs > 0,
                                title: "Create your first job",
                                desc: "Describe the role and we'll set it up.",
                                actions: [
                                    { label: "Hire with AI", href: "/enterprise/croar-pilot", primary: true, perm: "jobs:read" },
                                    { label: "Post manually", href: "/enterprise/jobs/create", primary: false, perm: "jobs:create" },
                                ],
                            },
                            {
                                done: stats.total_candidates > 0,
                                title: "Get candidates",
                                desc: "Source talent or share your apply link.",
                                actions: [
                                    { label: "Source candidates", href: "/enterprise/sourcing/chat", primary: true, perm: "candidates:read" },
                                    { label: "View jobs", href: "/enterprise/jobs", primary: false, perm: "jobs:read" },
                                ],
                            },
                            {
                                done: stats.total_applications > 0,
                                title: "Review your pipeline",
                                desc: "Screen, assess and interview applicants.",
                                actions: [
                                    { label: "Open pipeline", href: "/enterprise/candidates/kanban", primary: true, perm: "candidates:read" },
                                ],
                            },
                        ].map((step, i) => (
                            <div key={i} className={`rounded-xl border p-4 ${step.done ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-slate-50/50"}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${step.done ? "bg-emerald-500 text-white" : "bg-indigo-100 text-indigo-600"}`}>
                                        {step.done ? "✓" : i + 1}
                                    </span>
                                    <span className="text-xs font-black text-slate-800">{step.title}</span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-semibold mb-3 leading-relaxed">{step.desc}</p>
                                {!step.done && (
                                    <div className="flex flex-wrap gap-2">
                                        {step.actions.filter((a) => canAccess(a.perm)).map((a) => (
                                            <Link key={a.label} href={a.href} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${a.primary ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"}`}>
                                                {a.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Tactical Grid Modules */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
                {/* Core Modules List */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5">
                    {modules.filter(m => canAccess(m.permission)).map((module) => (
                        <Link href={module.path} key={module.title} className="group">
                            <div className={`relative ${getColorClasses(module.color).bg} border ${getColorClasses(module.color).border} p-5 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full overflow-hidden flex flex-col`}>
                                <div className={`w-11 h-11 rounded-xl bg-white border border-slate-50 ${getColorClasses(module.color).text} flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-6 shadow-sm mb-4`}>
                                    <span className="material-symbols-rounded text-xl">{module.icon}</span>
                                </div>
                                <h3 className="text-sm font-black text-slate-900 tracking-tight group-hover:text-[#7C3AED] transition-colors">
                                    {module.title}
                                </h3>
                                <p className="text-[11px] text-slate-500 font-bold leading-relaxed opacity-70 mt-1 mb-4 flex-1">
                                    {module.description}
                                </p>
                                <div className={`flex items-center gap-1 text-[10px] font-black ${getColorClasses(module.color).text}`}>
                                    {"Open"}
                                    <span className="material-symbols-rounded text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Needs your attention — real, clickable items from your live stats */}
                <div className="lg:col-span-4">
                    <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm h-full flex flex-col">
                        <div className="flex items-center justify-between mb-5">
                            <span className="text-sm font-black text-slate-900">Needs your attention</span>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border-4 border-emerald-50"></div>
                        </div>

                        {isLoading ? (
                            <div className="flex-1 flex items-center justify-center text-slate-300 text-sm py-10">Loading…</div>
                        ) : (() => {
                            const items = [
                                { show: stats.high_value_matches > 0, count: stats.high_value_matches, label: "recommended candidates to review", icon: "stars", color: "text-indigo-600 bg-indigo-50" },
                                { show: stats.interviews_scheduled > 0, count: stats.interviews_scheduled, label: "interviews scheduled", icon: "videocam", color: "text-amber-600 bg-amber-50" },
                                { show: stats.total_applications > 0, count: stats.total_applications, label: "applications in your pipeline", icon: "conversion_path", color: "text-emerald-600 bg-emerald-50" },
                            ].filter((i) => i.show && canAccess("candidates:read"));

                            if (items.length === 0) {
                                return (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
                                            <span className="material-symbols-rounded text-2xl">task_alt</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-700">You&apos;re all caught up</p>
                                        <p className="text-xs text-slate-400 font-semibold mt-1">New candidates and interviews will show up here.</p>
                                    </div>
                                );
                            }
                            return (
                                <div className="space-y-2.5 flex-1">
                                    {items.map((i) => (
                                        <Link key={i.label} href="/enterprise/candidates/kanban" className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50/50 transition-all group">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${i.color}`}>
                                                <span className="material-symbols-rounded text-xl">{i.icon}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-lg font-black text-slate-900 leading-none">{i.count}</span>
                                                <p className="text-[11px] text-slate-500 font-semibold leading-tight mt-0.5">{i.label}</p>
                                            </div>
                                            <span className="material-symbols-rounded text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all">chevron_right</span>
                                        </Link>
                                    ))}
                                </div>
                            );
                        })()}

                        {/* Quick actions */}
                        <div className="mt-5 pt-4 border-t border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Quick actions</p>
                            <div className="flex flex-wrap gap-2">
                                {canAccess("jobs:read") && (
                                    <Link href="/enterprise/croar-pilot" className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-[11px] font-bold hover:bg-indigo-700 transition-all flex items-center gap-1.5">
                                        <span className="material-symbols-rounded text-base">smart_toy</span> Hire with AI
                                    </Link>
                                )}
                                {canAccess("candidates:read") && (
                                    <Link href="/enterprise/sourcing/chat" className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-[11px] font-bold hover:border-indigo-300 transition-all flex items-center gap-1.5">
                                        <span className="material-symbols-rounded text-base">person_search</span> Source
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
