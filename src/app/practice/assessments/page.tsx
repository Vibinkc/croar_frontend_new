"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/utils/api";
import Link from "next/link";

interface Assessment {
    id: number;
    title: string;
    description: string;
    time_limit_minutes: number;
    question_count: number;
    is_completed: boolean;
    categories: string[];
    start_at: string | null;
    end_at: string | null;
}

export default function AssessmentsListPage() {
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        fetchAssessments();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchAssessments = async () => {
        try {
            // const token = Cookies.get("auth_");
            const res = await apiClient.get(`/api/v1/assessments`);
            if (res.ok) {
                const data = await res.json();
                setAssessments(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const isAssessmentActive = (a: Assessment) => {
        const now = currentTime.getTime();
        const start = a.start_at ? new Date(a.start_at).getTime() : 0;
        const end = a.end_at ? new Date(a.end_at).getTime() : Infinity;
        return now >= start && now <= end;
    };

    const getAssessmentStatus = (a: Assessment) => {
        if (a.is_completed) return "FINALIZED";
        const now = currentTime.getTime();
        const start = a.start_at ? new Date(a.start_at).getTime() : 0;
        const end = a.end_at ? new Date(a.end_at).getTime() : Infinity;

        if (now < start) return "SCHEDULED";
        if (now > end) return "EXPIRED";
        return "ACTIVE";
    };

    const formatShortDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getAssessmentIcon = (title: string, categories: string[] = []) => {
        if (categories.includes('CODING')) return 'terminal';
        if (categories.includes('COMMUNICATION')) return 'forum';
        if (categories.includes('PERSONALITY')) return 'face';
        if (categories.includes('BEHAVIORAL')) return 'self_improvement';
        const t = title.toLowerCase();
        if (t.includes('aptitude')) return 'psychology';
        if (t.includes('math') || t.includes('algebra')) return 'functions';
        return 'assignment';
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-500 rounded-full animate-spin"></div>
                <span className="text-[10px] font-black tracking-[0.3em] text-slate-400 ">Synchronizing_Assessments</span>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 bg-white min-h-screen">
            {/* Hero Section */}
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-[1.5rem] bg-sky-600 p-6 text-white shadow-lg">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black  tracking-tight">Assessment Hub</h2>
                        <p className="text-slate-100 text-xs max-w-sm font-medium leading-relaxed">
                            Validate your technical precision. Complete high-stakes simulated protocols within your scheduled window.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20 min-w-[140px]">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white">
                            <span className="material-icons-outlined text-2xl">verified_user</span>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-200   mb-1">Active_Protocols</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black">{assessments.filter(a => isAssessmentActive(a) && !a.is_completed).length}</span>
                                <span className="text-[9px] font-bold text-slate-200 ">Live</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-48 h-48 bg-slate-500/10 rounded-full blur-2xl"></div>
            </section>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assessments.map((a) => {
                    const status = getAssessmentStatus(a);
                    const isActive = status === 'ACTIVE';

                    return (
                        <div key={a.id} className={`group relative ${!isActive && !a.is_completed ? 'bg-white' : 'bg-sky-50/50'} border ${a.is_completed ? 'border-slate-200 bg-slate-50/50' : 'border-sky-100'} rounded-3xl p-6 transition-all duration-300 ${!isActive && !a.is_completed ? 'opacity-60 grayscale-[0.5]' : 'shadow-md hover:shadow-xl hover:border-sky-200'} flex flex-col h-full overflow-hidden`}>
                            {isActive && !a.is_completed && <div className="absolute top-0 left-0 w-full h-1 bg-slate-400 animate-pulse"></div>}

                            {/* Card Top */}
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-12 h-12 rounded-2xl ${a.is_completed ? 'bg-slate-100 text-slate-400' : 'bg-slate-100 text-slate-600'} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm shadow-slate-100`}>
                                    <span className="material-icons-outlined text-xl">{a.is_completed ? 'check_circle' : getAssessmentIcon(a.title, a.categories)}</span>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[8px] font-black  text-slate-500  border border-slate-200">
                                        PR_0{a.id}
                                    </span>
                                    {status === 'SCHEDULED' && <span className="text-[7px] font-black text-slate-500   bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">Coming Up</span>}
                                    {status === 'EXPIRED' && <span className="text-[7px] font-black text-slate-400   bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">Expired</span>}
                                    {status === 'ACTIVE' && <span className="text-[7px] font-black text-slate-900   bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">Live Now</span>}
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="space-y-4 flex-grow">
                                <div className="space-y-2">
                                    <h3 className={`text-base font-black tracking-tight leading-tight  transition-colors ${a.is_completed ? 'text-slate-400' : 'text-slate-900 group-hover:text-slate-600'}`}>
                                        {a.title}
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {(a.categories || []).map(cat => (
                                            <span key={cat} className="px-2 py-0.5 rounded-md bg-slate-100 text-[7px] font-black text-slate-500   border border-slate-200">
                                                {cat}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-icons-outlined text-[12px] text-slate-400">schedule</span>
                                            <span className="text-[9px] font-black text-slate-500 ">{a.time_limit_minutes}m Duration</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-icons-outlined text-[12px] text-slate-400">quiz</span>
                                            <span className="text-[9px] font-black text-slate-500 ">{a.question_count} Questions</span>
                                        </div>
                                    </div>
                                    {(a.start_at || a.end_at) && (
                                        <div className="flex flex-col gap-1 mt-1 pt-2 border-t border-slate-100">
                                            {a.start_at && (
                                                <div className="flex justify-between items-center text-[8px] font-bold text-slate-400  tracking-tighter">
                                                    <span>Open:</span>
                                                    <span className="text-slate-600">{formatShortDate(a.start_at)}</span>
                                                </div>
                                            )}
                                            {a.end_at && (
                                                <div className="flex justify-between items-center text-[8px] font-bold text-slate-400  tracking-tighter">
                                                    <span>Close:</span>
                                                    <span className="text-slate-600">{formatShortDate(a.end_at)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <p className="text-[10px] text-slate-400 leading-relaxed font-medium line-clamp-2 ">
                                    {a.description || "No specific protocol instructions provided by Command Center."}
                                </p>
                            </div>

                            {/* Card Action */}
                            <div className="mt-6">
                                {a.is_completed ? (
                                    <button disabled className="w-full bg-slate-50 text-slate-400 font-black text-[9px] tracking-[0.2em]  py-3 rounded-2xl cursor-not-allowed flex items-center justify-center gap-2 border border-slate-100">
                                        <span>PROTOCOL_FINALIZED</span>
                                        <span className="material-symbols-rounded text-base">verified</span>
                                    </button>
                                ) : isActive ? (
                                    <Link href={`/practice/assessments/${a.id}`}>
                                        <button className="w-full bg-slate-100 hover:bg-slate-900 text-slate-900 hover:text-white font-black text-[9px] tracking-[0.2em]  py-3 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 shadow-sm shadow-slate-100">
                                            <span>INITIATE_PROTOCOL</span>
                                            <span className="material-symbols-rounded text-base">arrow_forward</span>
                                        </button>
                                    </Link>
                                ) : (
                                    <button disabled className="w-full bg-slate-50 text-slate-400 font-black text-[9px] tracking-[0.2em]  py-3 rounded-2xl cursor-not-allowed flex items-center justify-center border border-slate-100">
                                        {status === 'SCHEDULED' ? 'WINDOW_PENDING' : 'PROTOCOL_EXPIRED'}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {assessments.length === 0 && (
                <div className="bg-white rounded-[2.5rem] p-20 border border-slate-100 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center animate-bounce">
                        <span className="material-icons-outlined text-3xl text-slate-300">upcoming</span>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-black text-slate-900  tracking-tight">Systems_Idle</h2>
                        <p className="text-xs text-slate-400 font-medium tracking-wide">No active assessment sessions currently assigned to your protocol.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
