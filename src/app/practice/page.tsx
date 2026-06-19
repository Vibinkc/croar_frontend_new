"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";

interface ModuleProgress {
    module_type: string;
    progress_percentage: number;
    topic: string;
}

interface StudentStats {
    total_assessments: number;
    average_score: number;
    total_practice_questions: number;
    proficiency: { type: string; score: number }[];
}

export default function StudentDashboard() {
    const [greeting, setGreeting] = useState("");
    const [progressData, setProgressData] = useState<ModuleProgress[]>([]);
    const [stats, setStats] = useState<StudentStats | null>(null);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("GOOD MORNING");
        else if (hour < 18) setGreeting("GOOD AFTERNOON");
        else setGreeting("GOOD EVENING");

        // eslint-disable-next-line react-hooks/immutability
        fetchProgress();
        // eslint-disable-next-line react-hooks/immutability
        fetchStats();
    }, []);

    async function fetchProgress() {
        try {
            console.log("Fetching progress from:", `/api/v1/progress/`);
            const res = await apiClient.get(`/api/v1/progress/`);
            if (res.ok) {
                const data = await res.json();
                setProgressData(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    async function fetchStats() {
        try {
            const res = await apiClient.get(`/api/v1/users/me/stats`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const getModuleProgress = (type: string) => {
        const items = progressData.filter(p => p.module_type === type);
        if (items.length === 0) return 0;
        const total = items.reduce((acc, curr) => acc + curr.progress_percentage, 0);
        // Average over found items (active topics)
        return total / items.length;
    };

    const modules = [
        {
            title: "Algorithms & DS",
            description: "Core programming fundamentals and advanced data structures.",
            icon: "code",
            path: "/practice/coding",
            progress: getModuleProgress('CODING'),
            badge: "CODING PRO",
            color: "blue",
            features: ["Live Code Editor", "Test Cases", "Multiple Languages"]
        },
        {
            title: "AI Interview",
            description: "Practice real-world interview scenarios with our advanced AI mentor.",
            icon: "smart_toy",
            path: "/practice/interviews",
            progress: 0,
            badge: "AI INTERVIEW",
            color: "rose",
            features: ["Real-time AI", "Voice Interaction", "Instant Feedback"]
        },
        {
            title: "Group Discussion",
            description: "Engage in collaborative solving and verbal reasoning sessions.",
            icon: "groups",
            path: "/practice/discussion",
            progress: 0,
            badge: "GD SESSIONS",
            color: "amber",
            features: ["Live Sessions", "Team Collaboration", "Peer Evaluation"]
        },
        {
            title: "AI Resume Scorer",
            description: "Get instant feedback and optimization tips for your professional resume.",
            icon: "description",
            path: "/practice/resume-scorer",
            progress: 0,
            badge: "RESUME SCORE",
            color: "emerald",
            features: ["ATS Analysis", "Smart Suggestions", "Industry Standards"]
        }
    ];

    const getColorClasses = (color: string) => {
        const colors: Record<string, { border: string; bg: string; text: string; progress: string }> = {
            blue: { border: "border-blue-100", bg: "bg-blue-50 dark:bg-slate-800", text: "text-blue-600", progress: "bg-blue-500" },
            purple: { border: "border-purple-100", bg: "bg-purple-50 dark:bg-slate-800", text: "text-purple-600", progress: "bg-purple-500" },
            rose: { border: "border-rose-100", bg: "bg-rose-50 dark:bg-slate-800", text: "text-rose-600", progress: "bg-rose-500" },
            slate: { border: "border-slate-100", bg: "bg-slate-50 dark:bg-slate-800", text: "text-slate-600", progress: "bg-slate-400" },
            indigo: { border: "border-indigo-100", bg: "bg-indigo-50 dark:bg-slate-800", text: "text-indigo-600", progress: "bg-indigo-500" },
            teal: { border: "border-teal-100", bg: "bg-teal-50 dark:bg-slate-800", text: "text-teal-600", progress: "bg-teal-500" },
            amber: { border: "border-amber-100", bg: "bg-amber-50 dark:bg-slate-800", text: "text-amber-600", progress: "bg-amber-500" },
            cyan: { border: "border-cyan-100", bg: "bg-cyan-50 dark:bg-slate-800", text: "text-cyan-600", progress: "bg-cyan-500" },
            emerald: { border: "border-emerald-100", bg: "bg-emerald-50 dark:bg-slate-800", text: "text-emerald-600", progress: "bg-emerald-500" },
        };
        return colors[color] || colors.slate;
    };

    return (
        <div className="space-y-4">
            {/* Hero Section */}
            <section className="bg-[var(--color-primary)] rounded-[1.5rem] p-6 md:p-8 text-white flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
                <div className="relative z-10 flex-1 space-y-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tighter leading-tight mb-2 ">
                            {greeting},<br />ELITE PLAYER.
                        </h2>
                        <p className="text-slate-100 text-xs max-w-sm font-medium opacity-90">
                            The skill tree is waiting. Ready to dominate today&apos;s missions and claim your XP?
                        </p>
                    </div>
                </div>

                {/* Dashboard Stats HUD */}
                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
                    <div className="hero-glass rounded-2xl p-4 min-w-[140px] flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="material-icons-outlined text-lg text-violet-200">assignment</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></div>
                        </div>
                        <div>
                            <span className="text-[8px] font-black text-violet-100  tracking-[0.2em] block mb-0.5">Assessments_Completed</span>
                            <span className="text-2xl font-black tracking-tighter text-white">{stats?.total_assessments || 0}</span>
                        </div>
                    </div>

                    <div className="hero-glass rounded-2xl p-4 min-w-[140px] flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="material-icons-outlined text-lg text-cyan-200">verified</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                        </div>
                        <div>
                            <span className="text-[8px] font-black text-cyan-100  tracking-[0.2em] block mb-0.5">Agility_Score_Avg</span>
                            <span className="text-2xl font-black tracking-tighter text-white">{stats?.average_score || 0}%</span>
                        </div>
                    </div>

                    <div className="hero-glass rounded-2xl p-4 min-w-[140px] flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="material-icons-outlined text-lg text-pink-200">quiz</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-pink-400"></div>
                        </div>
                        <div>
                            <span className="text-[8px] font-black text-pink-100  tracking-[0.2em] block mb-0.5">Questions_Completed</span>
                            <span className="text-2xl font-black tracking-tighter text-white">{stats?.total_practice_questions || 0}</span>
                        </div>
                    </div>
                </div>

                <div className="absolute -top-16 -right-16 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-slate-400 opacity-10 rounded-full blur-3xl"></div>
            </section>

            {/* Analytics Telemetry */}
            <section className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black   text-slate-400">Tactical Analytics</h2>
                    <span className="text-[10px] font-black text-slate-300  ">Live_Telemetry_Feed</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Modules Grid */}
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {modules.map((module) => (
                            <Link href={module.path} key={module.title}>
                                <div className={`relative group ${getColorClasses(module.color).bg} border ${getColorClasses(module.color).border} dark:border-slate-800 p-5 rounded-[2rem] shadow-md hover:shadow-lg transition-all duration-300 h-full overflow-hidden`}>
                                    {!['/practice/communication', '/practice/coding', '/practice/interviews', '/practice/discussion', '/practice/resume-scorer', '/practice/resume-builder'].includes(module.path) && (
                                        <div className={`absolute top-0 left-0 w-full h-1 ${getColorClasses(module.color).progress}`}></div>
                                    )}

                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-10 h-10 rounded-2xl ${getColorClasses(module.color).bg} ${getColorClasses(module.color).text} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                            <span className="material-icons-outlined text-xl">{module.icon}</span>
                                        </div>
                                        <span className={`px-2 py-[3px] rounded-lg text-[7px] font-black   ${getColorClasses(module.color).bg} ${getColorClasses(module.color).text}`}>
                                            {module.badge}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white  tracking-tight group-hover:text-slate-500 transition-colors">
                                            {module.title}
                                        </h3>
                                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed line-clamp-2">
                                            {module.description}
                                        </p>
                                    </div>

                                    {/* Features List */}
                                    {module.features && (
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {module.features.map((feature: string, idx: number) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md text-[8px] font-bold  tracking-wide"
                                                >
                                                    {feature}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {!['/practice/communication', '/practice/coding', '/practice/interviews', '/practice/discussion', '/practice/resume-scorer', '/practice/resume-builder'].includes(module.path) && (
                                        <div className="mt-4">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-[7px] font-black text-slate-300  ">Progress</span>
                                                <span className={`text-[9px] font-black ${getColorClasses(module.color).text}`}>{Math.round(module.progress)}%</span>
                                            </div>
                                            <div className="h-1 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${getColorClasses(module.color).progress} transition-all duration-1000 ease-out`}
                                                    style={{ width: `${module.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}


                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Radar Proficiency */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm flex flex-col items-center">
                        <span className="text-[8px] font-black text-slate-400   mb-6 self-start">Proficiency_Distribution</span>
                        <div className="relative w-48 h-48">
                            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                                {/* Base Grids */}
                                {[0.2, 0.4, 0.6, 0.8, 1].map((step, i) => (
                                    <polygon
                                        key={i}
                                        points={`50,${50 - 50 * step} ${50 + 43.3 * step},${50 + 25 * step} ${50 - 43.3 * step},${50 + 25 * step}`}
                                        className="fill-none stroke-slate-100 dark:stroke-slate-800 stroke-[0.5]"
                                    />
                                ))}
                                {/* Axes */}
                                <line x1="50" y1="50" x2="50" y2="0" className="stroke-slate-100 dark:stroke-slate-800 stroke-[0.5]" />
                                <line x1="50" y1="50" x2="93.3" y2="75" className="stroke-slate-100 dark:stroke-slate-800 stroke-[0.5]" />
                                <line x1="50" y1="50" x2="6.7" y2="75" className="stroke-slate-100 dark:stroke-slate-800 stroke-[0.5]" />

                                {/* Data Polygon */}
                                {stats?.proficiency && (() => {
                                    const scores = {
                                        "Communication": stats.proficiency.find((p: { type: string; score: number }) => p.type === 'Communication')?.score || 0,
                                        "Aptitude": stats.proficiency.find((p: { type: string; score: number }) => p.type === 'Aptitude')?.score || 0,
                                        "Coding": stats.proficiency.find((p: { type: string; score: number }) => p.type === 'Coding')?.score || 0,
                                    };
                                    // Scale 0-100 to 0-50
                                    const p1 = { x: 50, y: 50 - (scores["Aptitude"] * 0.5) };
                                    const p2 = { x: 50 + (scores["Coding"] * 0.433), y: 50 + (scores["Coding"] * 0.25) };
                                    const p3 = { x: 50 - (scores["Communication"] * 0.433), y: 50 + (scores["Communication"] * 0.25) };
                                    return (
                                        <polygon
                                            points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`}
                                            className="fill-slate-500/20 stroke-slate-500 stroke-[1.5] transition-all duration-1000"
                                        />
                                    );
                                })()}
                            </svg>
                            {/* Labels */}
                            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[7px] font-black text-slate-500 ">Aptitude</span>
                            <span className="absolute -bottom-2 -right-4 text-[7px] font-black text-slate-500 ">Coding</span>
                            <span className="absolute -bottom-2 -left-4 text-[7px] font-black text-slate-500 ">Comm.</span>
                        </div>

                        <div className="mt-8 w-full">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-icons-outlined text-[10px] text-slate-500">terminal</span>
                                <span className="text-[8px] font-black text-slate-400  ">System_Analysis</span>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800 relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 dark:bg-slate-700 group-hover:bg-slate-500 transition-colors"></div>
                                <p className="text-[10px] font-medium text-slate-500 leading-relaxed">
                                    <span>Profile telemetry indicates consistent growth. Maintain current training velocity to optimize the proficiency triad.</span>
                                    <span className="block mt-2 text-slate-400 ">
                                        {`// Recommendation: prioritize under-indexed vectors for balanced skill acquisition.`}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </section>
        </div>
    );
}
