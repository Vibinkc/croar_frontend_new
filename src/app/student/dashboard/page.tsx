"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export default function StudentDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token || role !== "STUDENT") {
            router.push("/student/login");
        } else {
            setLoading(false);
        }
    }, [router]);

    if (loading) return null;

    return (
        <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 ${plusJakartaSans.className}`}>
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-4 sticky top-0 z-10 flex justify-between items-center transition-colors">
                <div className="flex items-center gap-4">
                    <img src="/Academik_logo.png" alt="Logo" className="h-8" />
                    <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800"></div>
                    <span className="text-sm font-bold text-slate-400  ">Student Portal</span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            localStorage.clear();
                            router.push("/student/login");
                        }}
                        className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                        <span className="material-icons-outlined">logout</span>
                    </button>
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                        S
                    </div>
                </div>
            </header>

            <main className="p-8 max-w-7xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Welcome Academic,</h1>
                    <p className="text-slate-500 dark:text-slate-400">Track your learning progress and prepare for your future.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {[
                        { title: 'Courses In-Progress', value: '4', icon: 'auto_stories', color: 'blue' },
                        { title: 'Credits Earned', value: '124', icon: 'stars', color: 'amber' },
                        { title: 'Placement Score', value: '850', icon: 'trending_up', color: 'emerald' }
                    ].map(card => (
                        <div key={card.title} className="bg-white dark:bg-slate-900 p-6 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                <p className="text-xs font-bold text-slate-400   mb-1">{card.title}</p>
                                <p className="text-3xl font-black text-slate-900 dark:text-white">{card.value}</p>
                            </div>
                            <div className={`w-12 h-12 bg-${card.color}-50 dark:bg-${card.color}-900/20 rounded-2xl flex items-center justify-center text-${card.color}-500`}>
                                <span className="material-icons-outlined">{card.icon}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                        <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Recent Activities</h3>
                        <div className="space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors cursor-pointer group">
                                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-500 shrink-0">
                                        <span className="material-icons-outlined">play_circle</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">Advanced Algorithm Challenge {i}</p>
                                        <p className="text-xs text-slate-400">Completed 2 hours ago</p>
                                    </div>
                                    <div className="text-emerald-500 font-bold">+25 pts</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                        <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Upcoming Deadlines</h3>
                        <div className="space-y-6">
                            {[
                                { title: 'Mock Interview Prep', date: 'Tomorrow, 10:00 AM' },
                                { title: 'Coding Lab Submission', date: 'Monday, 11:59 PM' }
                            ].map((task, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900 dark:text-white">{task.title}</p>
                                        <p className="text-xs text-slate-400">{task.date}</p>
                                    </div>
                                    <button className="text-xs font-bold text-indigo-500 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-all   leading-none">View</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
