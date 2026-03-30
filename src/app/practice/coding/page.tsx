"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";

interface Question {
    id: number;
    topic: string;
    content: {
        question: string;
        title?: string;
        description?: string;
    };
    difficulty: string;
    is_completed: boolean;
    is_correct?: boolean;
}

export default function CodingProblemsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTopic = searchParams.get("topic");

    const [selectedTopic, setSelectedTopic] = useState<string | null>(initialTopic);
    const [problems, setProblems] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [availableTopics, setAvailableTopics] = useState<string[]>([]);

    useEffect(() => {
        // Fetch all problems initially to build the topic list and stats locally
        // This avoids multiple API calls if we already have the data
        fetchProblems();
    }, []);

    useEffect(() => {
        const topic = searchParams.get("topic");
        if (topic) {
            setSelectedTopic(topic);
        } else {
            setSelectedTopic(null);
        }
    }, [searchParams]);

    const handleSelectTopic = (topic: string) => {
        setSelectedTopic(topic);
        router.push(`/practice/coding?topic=${encodeURIComponent(topic)}`);
    };

    const handleClearTopic = () => {
        setSelectedTopic(null);
        router.push('/practice/coding');
    };

    const fetchProblems = async () => {
        try {
            const res = await apiClient.get(`/api/v1/progress/module-all/CODING`);
            if (res.ok) {
                const data: Question[] = await res.json();
                setProblems(data);

                // Extract unique topics from the problems themselves or use an API if preferred
                // Using problems ensures we only show topics that actually have content
                const topics = Array.from(new Set(data.map(p => p.topic))).sort();
                setAvailableTopics(topics);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getTopicIcon = (topic: string) => {
        const t = topic.toLowerCase();
        if (t.includes('array')) return 'data_array';
        if (t.includes('string')) return 'text_fields';
        if (t.includes('dp') || t.includes('dynamic')) return 'layers';
        if (t.includes('tree')) return 'account_tree';
        if (t.includes('graph')) return 'hub';
        if (t.includes('search') || t.includes('sort')) return 'sort';
        if (t.includes('stack') || t.includes('queue')) return 'toc';
        if (t.includes('linked')) return 'link';
        return 'terminal';
    };

    const getDifficultyColor = (difficulty: string) => {
        const d = difficulty.toLowerCase();
        if (d.includes('easy')) return 'bg-emerald-50 text-emerald-600 border-emerald-200';
        if (d.includes('medium')) return 'bg-amber-50 text-amber-600 border-amber-200';
        if (d.includes('hard')) return 'bg-rose-50 text-rose-600 border-rose-200';
        return 'bg-slate-50 text-slate-500 border-slate-200';
    };

    const getTopicStats = (topic: string) => {
        const topicProblems = problems.filter(p => p.topic === topic);
        const total = topicProblems.length;
        const completed = topicProblems.filter(p => p.is_completed).length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { total, completed, progress };
    };

    const getTopicColor = (topic: string) => {
        const t = topic.toLowerCase();
        if (t.includes('array') || t.includes('stack') || t.includes('queue')) return { bar: 'bg-blue-500', border: 'hover:border-blue-400', iconBg: 'bg-blue-50', iconText: 'text-blue-600', button: 'bg-blue-50 hover:bg-blue-100 text-blue-900', bg: 'bg-blue-50/50', borderBase: 'border-blue-100' };
        if (t.includes('string') || t.includes('search')) return { bar: 'bg-emerald-500', border: 'hover:border-emerald-400', iconBg: 'bg-emerald-50', iconText: 'text-emerald-600', button: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900', bg: 'bg-emerald-50/50', borderBase: 'border-emerald-100' };
        if (t.includes('dp') || t.includes('recursion')) return { bar: 'bg-purple-500', border: 'hover:border-purple-400', iconBg: 'bg-purple-50', iconText: 'text-purple-600', button: 'bg-purple-50 hover:bg-purple-100 text-purple-900', bg: 'bg-purple-50/50', borderBase: 'border-purple-100' };
        if (t.includes('graph') || t.includes('tree')) return { bar: 'bg-amber-500', border: 'hover:border-amber-400', iconBg: 'bg-amber-50', iconText: 'text-amber-600', button: 'bg-amber-50 hover:bg-amber-100 text-amber-900', bg: 'bg-amber-50/50', borderBase: 'border-amber-100' };
        return { bar: 'bg-slate-500', border: 'hover:border-slate-400', iconBg: 'bg-slate-50', iconText: 'text-slate-600', button: 'bg-slate-50 hover:bg-slate-100 text-slate-900', bg: 'bg-slate-50/50', borderBase: 'border-slate-100' };
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-600 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Challenges...</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 bg-white min-h-screen">
            {/* Hero Section */}
            <section className="relative rounded-[2rem] bg-slate-900 overflow-hidden shadow-xl mb-8 border border-white/10">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-transparent"></div>
                <div className="relative z-10 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <span className="inline-block px-2 py-0.5 bg-white/10 border border-white/10 rounded text-[9px] font-black uppercase tracking-widest text-indigo-300">System Kernel v2.4</span>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tight">Algorithmic Vaults</h2>
                        </div>
                        <p className="text-slate-400 text-xs max-w-md font-medium leading-relaxed">
                            Access categorized coding protocols. Complete algorithmic challenges to optimize your neural ranking.
                        </p>
                    </div>

                    <div className="flex items-center gap-5 bg-white/5 p-5 rounded-2xl backdrop-blur-md border border-white/10 min-w-[180px]">
                        <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                            <span className="material-icons-outlined text-3xl">data_object</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Vault Status</p>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-black text-white">{availableTopics.length}</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Sectors</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {selectedTopic ? (
                /* -------------------------------------------------------------------------- */
                /*                             Problem List View                              */
                /* -------------------------------------------------------------------------- */
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleClearTopic}
                            className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95"
                        >
                            <span className="material-icons-outlined text-lg">arrow_back</span>
                        </button>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Active Sector</p>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                <span className="material-icons-outlined text-2xl text-indigo-500">{getTopicIcon(selectedTopic)}</span>
                                {selectedTopic}
                            </h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {problems.filter(p => p.topic === selectedTopic).map((problem) => {
                            const colors = getTopicColor(problem.topic);
                            return (
                                <div key={problem.id} className={`group relative ${problem.is_completed ? 'bg-white opacity-75 grayscale-[0.5]' : colors.bg} border ${problem.is_completed ? 'border-slate-200' : colors.borderBase} rounded-2xl p-4 transition-all duration-300 shadow-md hover:shadow-lg ${colors.border} flex flex-col h-full overflow-hidden`}>
                                    {!problem.is_completed && <div className={`absolute top-0 left-0 w-full h-1 ${colors.bar}`}></div>}

                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-10 h-10 rounded-xl ${problem.is_completed ? 'bg-slate-100 text-slate-400' : `${colors.iconBg} ${colors.iconText}`} flex items-center justify-center transition-transform group-hover:scale-105`}>
                                            <span className="material-icons-outlined text-xl">{problem.is_completed ? 'check_circle' : 'code'}</span>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase border ${getDifficultyColor(problem.difficulty)}`}>
                                            {problem.difficulty}
                                        </span>
                                    </div>

                                    <div className="space-y-2 flex-grow mb-5">
                                        <h3 className={`text-sm font-black text-slate-900 uppercase tracking-tight line-clamp-2 transition-colors ${problem.is_completed ? '' : `group-hover:${colors.iconText}`}`}>
                                            {problem.content.title || problem.content.question?.split('\n')[0].replace(/#+\s*/, '') || "Coding Challenge"}
                                        </h3>
                                        <p className="text-[10px] leading-relaxed font-medium text-slate-500 line-clamp-2">
                                            {problem.content.description || problem.content.question?.split('\n').filter(l => l && !l.startsWith('#')).join(' ').substring(0, 150)}
                                        </p>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-slate-200/50">
                                        <Link href={`/practice/coding/${problem.id}`}>
                                            <button className={`w-full ${problem.is_completed ? 'bg-slate-50 text-slate-400' : colors.button} font-black text-[9px] tracking-[0.2em] uppercase py-2.5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 active:scale-95`}>
                                                {problem.is_completed ? 'Review_Protocol' : 'Initialize'}
                                                <span className="material-symbols-rounded text-sm">{problem.is_completed ? 'history' : 'arrow_forward'}</span>
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* -------------------------------------------------------------------------- */
                /*                               Topic Grid View                              */
                /* -------------------------------------------------------------------------- */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {availableTopics.length === 0 ? (
                        <div className="col-span-full py-20 text-center space-y-4 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                            <span className="material-icons-outlined text-4xl text-slate-300">dataset_linked</span>
                            <div>
                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">No Vaults Detected</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">System awaiting protocol injection</p>
                            </div>
                        </div>
                    ) : (
                        availableTopics.map(topic => {
                            const stats = getTopicStats(topic);
                            const colors = getTopicColor(topic);
                            return (
                                <button
                                    key={topic}
                                    onClick={() => handleSelectTopic(topic)}
                                    className={`group ${colors.bg} rounded-3xl border ${colors.borderBase} p-6 text-left transition-all duration-500 relative overflow-hidden active:scale-95 hover:shadow-xl ${colors.border}`}
                                >
                                    <div className={`absolute top-0 left-0 w-full h-1.5 ${colors.bar}`}></div>
                                    <div className={`absolute top-0 right-0 p-6 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-500 ${colors.iconText}`}>
                                        <span className="material-icons-outlined text-8xl">{getTopicIcon(topic)}</span>
                                    </div>

                                    <div className="relative z-10 space-y-6">
                                        <div className={`w-14 h-14 rounded-2xl ${colors.iconBg} flex items-center justify-center ${colors.iconText} transition-all duration-300 shadow-sm`}>
                                            <span className="material-icons-outlined text-3xl">{getTopicIcon(topic)}</span>
                                        </div>

                                        <div>
                                            <h3 className={`text-lg font-black text-slate-900 uppercase tracking-tight mb-2 group-hover:${colors.iconText} transition-colors`}>{topic}</h3>
                                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                <span>{stats.total} Challenges</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span className={stats.progress === 100 ? 'text-emerald-500' : ''}>{stats.progress}% Complete</span>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="h-1.5 w-full bg-white/50 rounded-full overflow-hidden border border-white/20">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ease-out ${stats.progress === 100 ? 'bg-emerald-500' : colors.bar.replace('bg-', 'bg-').replace('500', '500')}`}
                                                style={{ width: `${stats.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}


