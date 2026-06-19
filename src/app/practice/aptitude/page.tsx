"use client";

import { useEffect, useState } from "react";
// import Cookies from "js-cookie";
import { apiClient } from "@/utils/api";
import Link from "next/link";

interface TopicProgress {
    topic: string;
    progress_percentage: number;
    completed_questions: number;
    total_questions: number;
}

// Helper to deterministically generate a color based on topic name string
const getColorForTopic = (topic: string) => {
    const colors = ["slate"];
    let hash = 0;
    for (let i = 0; i < topic.length; i++) {
        hash = (topic.codePointAt(i) ?? 0) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

const getTopicDescription = (topic: string) => {
    // In a future update, we could fetch descriptions from the backend.
    // For now, we use a generic dynamic description.
    return `Practice and master ${topic} concepts with our AI-driven question bank.`;
};

export default function AptitudePage() {
    const [progressData, setProgressData] = useState<TopicProgress[]>([]);
    const [availableTopics, setAvailableTopics] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [progressRes, topicsRes] = await Promise.all([
                apiClient.get(`/api/v1/progress/APTITUDE`),
                apiClient.get(`/api/v1/content/questions/topics?type=APTITUDE`)
            ]);

            if (progressRes.ok) {
                const data = await progressRes.json();
                setProgressData(data);
            }
            if (topicsRes.ok) {
                const data = await topicsRes.json();
                setAvailableTopics(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };



    const getProgress = (topicName: string) => {
        const progress = progressData.find(p => p.topic?.toLowerCase() === topicName.toLowerCase());
        return progress ? Math.round(progress.progress_percentage) : 0;
    };

    const getColorClasses = (color: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const colors: any = {
            slate: { border: "bg-slate-500", bg: "bg-slate-50 dark:bg-slate-800", text: "text-slate-600", progress: "bg-slate-500" },
        };
        return colors[color] || colors.slate;
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-[1.5rem] bg-amber-600 p-6 text-white shadow-lg">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black  tracking-tight">Skill Mastery</h2>
                        <p className="text-slate-100 text-xs max-w-sm font-medium leading-relaxed">
                            Maintain your streak. Every mission completed brings you closer to the next Rank.
                        </p>
                        {(() => {
                            // Find next incomplete topic from available ones
                            const nextTopic = availableTopics.find(t => getProgress(t) < 100);
                            return nextTopic ? (
                                <Link href={`/practice/aptitude/${nextTopic.toLowerCase()}`}>
                                    <button className="px-4 py-2 bg-white text-slate-900 text-[10px] font-black   rounded-lg hover:bg-slate-50 transition-colors">
                                        RESUME {nextTopic}
                                    </button>
                                </Link>
                            ) : (
                                <button className="px-4 py-2 bg-white/20 text-white backdrop-blur-md border border-white/20 text-[10px] font-black   rounded-lg transition-colors">
                                    All Missions Clear 🎉
                                </button>
                            );
                        })()}
                    </div>
                    <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20">
                        <div className="relative w-14 h-14">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle className="text-white/20" cx="28" cy="28" fill="transparent" r="24" stroke="currentColor" strokeWidth="4"></circle>
                                <circle
                                    className="text-white"
                                    cx="28"
                                    cy="28"
                                    fill="transparent"
                                    r="24"
                                    stroke="currentColor"
                                    strokeDasharray="150.8"
                                    strokeDashoffset={150.8 * (1 - (progressData.reduce((acc, p) => acc + p.progress_percentage, 0) / (progressData.length * 100 || 1)))}
                                    strokeWidth="4"
                                ></circle>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center font-black text-xs">
                                {Math.round(progressData.reduce((acc, p) => acc + p.progress_percentage, 0) / (progressData.length || 1))}%
                            </div>
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-slate-200  ">Total XP</p>
                            <p className="text-sm font-black  tracking-tight">
                                {(() => {
                                    const avg = progressData.length > 0
                                        ? Math.round(progressData.reduce((acc, p) => acc + p.progress_percentage, 0) / progressData.length)
                                        : 0;
                                    if (avg === 100) return 'Mastery Reached';
                                    if (avg > 0) return 'Training Active';
                                    return 'Ready to Start';
                                })()}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-48 h-48 bg-slate-500/10 rounded-full blur-2xl"></div>
            </section>

            {/* Topics Grid */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black   text-slate-400">Available Missions</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableTopics.map((topicName) => {
                        const colorKey = getColorForTopic(topicName);
                        const colors = getColorClasses(colorKey);
                        const progress = getProgress(topicName);
                        const isCompleted = progress === 100;
                        const description = getTopicDescription(topicName);

                        return (
                            <div key={topicName} className="group relative flex flex-col bg-amber-50/50 dark:bg-slate-900 rounded-2xl p-4 shadow-md hover:shadow-lg border border-amber-100 dark:border-slate-800 transition-all duration-300 overflow-hidden">
                                <div className={`absolute top-0 left-0 w-full h-1 ${colors.border}`}></div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center ${colors.text} transition-transform group-hover:scale-105`}>
                                        <span className="material-icons-outlined text-2xl">auto_stories</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[8px] font-black text-slate-300  ">Topic</span>
                                    </div>
                                </div>
                                <h4 className="text-base font-black tracking-tight mb-1 ">{topicName}</h4>
                                <p className="text-slate-600 dark:text-slate-400 text-[10px] mb-4 flex-grow leading-snug line-clamp-2">
                                    {description}
                                </p>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[8px] font-black text-slate-300  ">Progress</span>
                                        <span className={`text-[10px] font-black ${colors.text}`}>{progress}%</span>
                                    </div>
                                    <div className="h-1 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full ${colors.progress} rounded-full transition-all duration-500`} style={{ width: `${progress}%` }}></div>
                                    </div>
                                    {isCompleted ? (
                                        <button className="w-full py-2 px-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 text-[9px] font-black   rounded-lg transition-all flex items-center justify-center gap-1.5">
                                            <span className="material-icons-outlined text-sm">check_circle</span>
                                            {"COMPLETE"}
                                        </button>
                                    ) : (
                                        <Link href={`/practice/aptitude/${topicName.toLowerCase()}`}>
                                            <button className={`w-full py-2 px-4 ${colors.bg} ${colors.text} text-[9px] font-black   rounded-lg transition-all hover:opacity-80`}>
                                                INITIATE
                                            </button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Coming Soon Card */}
                    <div className="relative flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl p-4 border-2 border-dashed border-slate-100 dark:border-slate-800 transition-all duration-300">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-200 mb-2">
                            <span className="material-icons-outlined text-2xl">add</span>
                        </div>
                        <p className="font-black text-slate-300   text-[8px]">New Nodes Incoming</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
