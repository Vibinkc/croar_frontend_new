"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/utils/api";

interface Question {
    id: number;
    type: string;
    topic: string;
    difficulty: string;
    content: {
        question: string;
        min_words?: number;
        max_words?: number;
    };
    user_attempt?: {
        score: number;
        attempted_at: string;
    };
}

export default function AIEvaluatorListPage() {
    const [tasks, setTasks] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await apiClient.get(`/api/v1/content/questions?type=SUBJECTIVE`);
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-500 rounded-full animate-spin"></div>
                <span className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">Synchronizing_Evaluator_Modules</span>
            </div>
        </div>
    );

    const getDifficultyColor = (difficulty: string) => {
        const d = difficulty.toLowerCase();
        if (d.includes('easy')) return 'bg-slate-100 text-slate-600 border-slate-200';
        if (d.includes('medium')) return 'bg-slate-200 text-slate-700 border-slate-300';
        return 'bg-slate-800 text-slate-100 border-slate-900';
    };

    const getTopicColor = (topic: string) => {
        return { bar: 'bg-slate-500', iconText: 'text-slate-600', iconBg: 'bg-slate-50 dark:bg-slate-900/20', button: 'bg-slate-50 hover:bg-slate-100 text-slate-600', border: 'hover:border-slate-300' };
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-8 bg-white min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-[1.5rem] bg-fuchsia-600 p-6 text-white shadow-lg">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black uppercase tracking-tight">Neural Evaluator</h2>
                        <p className="text-slate-100 text-xs max-w-sm font-medium leading-relaxed">
                            Advanced subjective analysis. Get instant feedback on your writing style, tone, and clarity.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20 min-w-[140px]">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white">
                            <span className="material-icons-outlined text-2xl">psychology</span>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-200 uppercase tracking-widest mb-1">Core_Status</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black">{tasks.length}</span>
                                <span className="text-[9px] font-bold text-slate-200 uppercase">Modules</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-48 h-48 bg-slate-500/10 rounded-full blur-2xl"></div>
            </section>

            {/* List Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.map((task) => {
                    const colors = getTopicColor(task.topic);
                    return (
                        <div key={task.id} className={`group relative bg-fuchsia-50/50 border border-fuchsia-100 dark:border-slate-800 rounded-2xl p-4 transition-all duration-300 shadow-md hover:shadow-lg ${colors.border} flex flex-col h-full overflow-hidden`}>
                            <div className={`absolute top-0 left-0 w-full h-1 ${colors.bar}`}></div>

                            {/* Top Bar */}
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center ${colors.iconText} transition-transform group-hover:scale-105`}>
                                    <span className="material-icons-outlined text-xl">history_edu</span>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    {task.user_attempt ? (
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[7px] font-black uppercase tracking-widest border border-slate-200">COMPLETED</span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 text-[7px] font-black uppercase tracking-widest border border-slate-100">NOT STARTED</span>
                                    )}
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase border ${getDifficultyColor(task.difficulty)} shadow-sm`}>
                                        {task.difficulty}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="space-y-2 flex-grow">
                                <h3 className={`text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight uppercase group-hover:${colors.iconText} transition-colors line-clamp-2`}>
                                    {task.topic}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 text-[10px] leading-relaxed font-medium line-clamp-2">
                                    {task.content.question}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                        <span className="material-icons-outlined text-[10px]">edit_note</span>
                                        {task.content.max_words || 250} Words
                                    </span>
                                </div>
                            </div>

                            {/* Action */}
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                <Link href={`/practice/evaluator/${task.id}?title=${encodeURIComponent(task.topic)}`}>
                                    <button className={`w-full ${colors.button} font-black text-[9px] tracking-widest uppercase py-2.5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 active:scale-95`}>
                                        {task.user_attempt ? 'REVISIT MODULE' : 'INITIATE MODULE'}
                                        <span className="material-symbols-rounded text-base">arrow_forward</span>
                                    </button>
                                </Link>
                            </div>
                        </div>
                    );
                })}

                {tasks.length === 0 && (
                    <div className="relative border-2 border-dashed border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2 group hover:border-slate-200 transition-colors duration-300 col-span-full h-48">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 group-hover:bg-slate-100 group-hover:text-slate-400 transition-all duration-300">
                            <span className="material-icons-outlined text-xl">cloud_off</span>
                        </div>
                        <div className="space-y-0.5">
                            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-slate-400 transition-colors">System Idle</h4>
                            <p className="text-[8px] text-slate-300 font-black uppercase tracking-widest">No Active Modules</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
