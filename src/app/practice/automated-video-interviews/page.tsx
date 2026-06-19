"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";

import { apiClient } from "@/utils/api";

interface Interview {
    id: number;
    title: string;
    job_description: string;
    created_at: string;
    user_attempt?: {
        overall_score: number;
        created_at: string;
    };
}

export default function AutomatedVideoInterviewsListPage() {
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // const { accessToken } = useAuth();

    useEffect(() => {
        fetchInterviews();
    }, []);

    const fetchInterviews = async () => {
        try {
            const response = await apiClient.get(`/api/v1/interviews?type=VIDEO`);
            if (response.ok) {
                const data = await response.json();
                setInterviews(data);
            }
        } catch (error) {
            console.error("Failed to fetch interviews", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-500 rounded-full animate-spin"></div>
                <span className="text-[10px] font-black tracking-[0.3em] text-slate-400 ">Loading_Modules</span>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 bg-white min-h-screen">
            {/* Hero Section */}
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-[1.5rem] bg-indigo-600 p-6 text-white shadow-lg">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black  tracking-tight">Async Video Hub</h2>
                        <p className="text-slate-100 text-xs max-w-sm font-medium leading-relaxed">
                            Record structured video responses to technical challenges. Receive AI-driven feedback on content and delivery.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20 min-w-[140px]">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white">
                            <span className="material-icons-outlined text-2xl">videocam</span>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-200   mb-1">Active_Challenges</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black">{interviews.length}</span>
                                <span className="text-[9px] font-bold text-slate-200 ">Available</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-48 h-48 bg-slate-500/10 rounded-full blur-2xl"></div>
            </section>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {interviews.map((interview) => (
                    <div key={interview.id} className="group relative bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 transition-all duration-300 shadow-md hover:shadow-lg hover:border-indigo-200 flex flex-col h-full overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-slate-400"></div>

                        {/* Card Top */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center transition-transform group-hover:scale-110">
                                <span className="material-icons-outlined text-lg">mic_external_on</span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                {interview.user_attempt ? (
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[7px] font-black  text-slate-500  border border-slate-200 animate-pulse">
                                        COMPLETED // {interview.user_attempt.overall_score}%
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-slate-50 text-[7px] font-black  text-slate-400  border border-slate-100">
                                        PENDING_SEQUENCE
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Card Body */}
                        <div className="space-y-3 flex-grow">
                            <div>
                                <h3 className="text-base font-black tracking-tight leading-tight  transition-colors text-slate-900 group-hover:text-slate-600">
                                    {interview.title}
                                </h3>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <div className="flex items-center gap-1">
                                        <span className="material-icons-outlined text-[10px] text-slate-400">calendar_today</span>
                                        <span className="text-[8px] font-bold text-slate-500  tracking-tighter">
                                            {format(new Date(interview.created_at), "MMM d, yyyy")}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-[10px] text-slate-400 leading-relaxed font-medium line-clamp-3 ">
                                {interview.job_description}
                            </p>
                        </div>

                        {/* Card Action */}
                        <div className="mt-4 pt-4 border-t border-slate-50">
                            {interview.user_attempt ? (
                                <Link href={`/practice/automated-video-interviews/${interview.id}/result`}>
                                    <button className="w-full bg-slate-100 hover:bg-slate-900 text-slate-900 hover:text-white font-black text-[9px] tracking-[0.2em]  py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 shadow-sm shadow-slate-100">
                                        {"VIEW_RESULTS"}
                                        <span className="material-symbols-rounded text-base">analytics</span>
                                    </button>
                                </Link>
                            ) : (
                                <Link href={`/practice/automated-video-interviews/${interview.id}/room`}>
                                    <button className="w-full bg-slate-100 hover:bg-slate-900 text-slate-900 hover:text-white font-black text-[9px] tracking-[0.2em]  py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 shadow-sm shadow-slate-100">
                                        {"START_RECORDING"}
                                        <span className="material-symbols-rounded text-base">arrow_forward</span>
                                    </button>
                                </Link>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {interviews.length === 0 && (
                <div className="bg-white rounded-[2.5rem] p-20 border border-slate-100 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center animate-bounce">
                        <span className="material-icons-outlined text-3xl text-slate-300">video_camera_front</span>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-black text-slate-900  tracking-tight">No Active Challenges</h2>
                        <p className="text-xs text-slate-400 font-medium tracking-wide">Check back later for new video interview assignments.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
