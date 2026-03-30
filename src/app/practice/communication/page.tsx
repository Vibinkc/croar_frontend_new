"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/utils/api";

interface Scenario {
    id: number;
    title: string;
    difficulty: string;
    prompt: string;
}

interface ScenarioProgress {
    topic: string;
    progress_percentage: number;
    completed_questions: number;
    total_questions: number;
}

export default function CommunicationPracticePage() {
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [progressData, setProgressData] = useState<ScenarioProgress[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [scenariosRes, progressRes] = await Promise.all([
                apiClient.get(`/api/v1/content/scenarios`),
                apiClient.get(`/api/v1/progress/COMMUNICATION`)
            ]);

            if (scenariosRes.ok) {
                const data = await scenariosRes.json();
                setScenarios(data);
            }
            if (progressRes.ok) {
                const data = await progressRes.json();
                setProgressData(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getScenarioIcon = (title: string) => {
        const t = title.toLowerCase();
        if (t.includes('introduction') || t.includes('self')) return 'record_voice_over';
        if (t.includes('conflict')) return 'groups';
        if (t.includes('company')) return 'business';
        if (t.includes('weakness')) return 'psychology';
        if (t.includes('aspiration') || t.includes('future')) return 'rocket_launch';
        return 'campaign';
    };

    const getDifficultyColor = (difficulty: string) => {
        const d = difficulty.toLowerCase();
        if (d.includes('easy') || d.includes('beginner')) return 'bg-slate-100 text-slate-600 border-slate-200';
        if (d.includes('medium') || d.includes('intermediate')) return 'bg-slate-200 text-slate-700 border-slate-300';
        if (d.includes('hard') || d.includes('advanced')) return 'bg-slate-800 text-slate-100 border-slate-900';
        return 'bg-slate-50 text-slate-500 border-slate-200';
    };

    const getScenarioColor = (title: string) => {
        return { bar: 'bg-slate-500', border: 'hover:border-slate-400', iconBg: 'bg-slate-50 dark:bg-slate-900/20', iconText: 'text-slate-600', button: 'bg-slate-100 hover:bg-slate-200 text-slate-900' };
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="w-12 h-12 border-4 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium animate-pulse">Loading Mission Briefings...</p>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-8 bg-white min-h-screen">
            {/* Header Section */}
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-[1.5rem] bg-cyan-600 p-6 text-white shadow-lg">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black uppercase tracking-tight">Vocal Command</h2>
                        <p className="text-slate-100 text-xs max-w-sm font-medium leading-relaxed">
                            Signal strength optimal. Calibrate your frequency and dominate the airwaves.
                        </p>
                        {(() => {
                            const nextScenario = scenarios.length > 0 ? scenarios[0] : null; // Simple fallback as scenarios don't store distinct progress locally in this view
                            return nextScenario ? (
                                <Link href={`/practice/communication/${nextScenario.id}?title=${encodeURIComponent(nextScenario.title)}&prompt=${encodeURIComponent(nextScenario.prompt)}`}>
                                    <button className="px-4 py-2 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-50 transition-colors">
                                        RESUME PROTOCOL
                                    </button>
                                </Link>
                            ) : (
                                <button className="px-4 py-2 bg-white/20 text-white backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors">
                                    All Channels Clear 📡
                                </button>
                            );
                        })()}
                    </div>
                    <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20 min-w-[140px]">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white">
                            <span className="material-icons-outlined text-2xl">graphic_eq</span>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-200 uppercase tracking-widest mb-1">Signal_Status</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black">{scenarios.length}</span>
                                <span className="text-[9px] font-bold text-slate-200 uppercase">Channels</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-48 h-48 bg-slate-500/10 rounded-full blur-2xl"></div>
            </section>

            {/* Scenarios Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scenarios.map((s) => {
                    const colors = getScenarioColor(s.title);
                    return (
                        <div key={s.id} className={`group relative bg-cyan-50/50 border border-cyan-100 dark:border-slate-800 rounded-2xl p-4 transition-all duration-300 shadow-md hover:shadow-lg ${colors.border} flex flex-col h-full overflow-hidden`}>
                            <div className={`absolute top-0 left-0 w-full h-1 ${colors.bar}`}></div>
                            {/* Top Bar: Icon and Difficulty */}
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center ${colors.iconText} transition-transform group-hover:scale-105`}>
                                    <span className="material-icons-outlined text-xl">{getScenarioIcon(s.title)}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase border ${getDifficultyColor(s.difficulty)} shadow-sm`}>
                                    {s.difficulty}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="space-y-2 flex-grow">
                                <h3 className={`text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight uppercase group-hover:${colors.iconText} transition-colors`}>{s.title}</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-[10px] leading-relaxed font-medium line-clamp-2">
                                    {s.prompt}
                                </p>
                            </div>

                            {/* Action */}
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                <Link href={`/practice/communication/${s.id}?title=${encodeURIComponent(s.title)}&prompt=${encodeURIComponent(s.prompt)}`}>
                                    <button className={`w-full ${colors.button} font-black text-[9px] tracking-widest uppercase py-2.5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 active:scale-95`}>
                                        INITIATE PROTOCOL
                                        <span className="material-symbols-rounded text-base">arrow_forward</span>
                                    </button>
                                </Link>
                            </div>
                        </div>
                    );
                })}

                {/* More Scenarios Placeholder */}
                <div className="relative border-2 border-dashed border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2 group hover:border-slate-300 transition-colors duration-300">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 group-hover:bg-slate-100 group-hover:text-slate-500 transition-all duration-300">
                        <span className="material-icons-outlined text-xl">add</span>
                    </div>
                    <div className="space-y-0.5">
                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-slate-400 transition-colors">Nodes Pending</h4>
                        <p className="text-[8px] text-slate-300 font-black uppercase tracking-widest">Awaiting Update</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
