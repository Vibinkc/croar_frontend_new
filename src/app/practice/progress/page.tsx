"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/utils/api";

interface ActivityItem {
    id: number;
    title: string;
    score: number;
    total_questions: number;
    completed_at: string;
    type: string;
}

interface UserStats {
    total_assessments: number;
    average_score: number;
    total_practice_questions: number;
    recent_activity: ActivityItem[];
}

export default function ProgressPage() {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await apiClient.get(`/api/v1/users/me/stats`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
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
                <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                <span className="text-[10px] font-black tracking-[0.3em] text-slate-400 ">Synchronizing_Telemetry</span>
            </div>
        </div>
    );

    if (!stats) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-[2.5rem] p-12 border border-slate-100 flex flex-col items-center justify-center text-center space-y-4 max-w-md">
                <span className="material-icons-outlined text-4xl text-slate-400 animate-pulse">error_outline</span>
                <h2 className="text-xl font-black text-slate-900  tracking-tight">Telemetry_Link_Failure</h2>
                <p className="text-xs text-slate-400 font-medium tracking-wide">Failed to establish a secure link to the progress data servers.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header HUD */}
            <div className="bg-white border-b border-slate-100 mb-8">
                <div className="max-w-[1200px] mx-auto px-6 py-10">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-slate-500 tracking-[0.4em] ">Student Portal // Performance Telemetry</span>
                        <Link href="/practice" className="group flex items-center gap-1.5 text-slate-400 hover:text-slate-900 transition-all text-[10px] font-black tracking-[0.2em] ">
                            <span className="material-icons-outlined text-[14px]">arrow_back</span>
                            {"Leave_Dashboard"}
                        </Link>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2 ">Progress_Analytics</h1>
                        <p className="text-[11px] text-slate-500 font-bold   max-w-lg leading-relaxed">
                            Monitor your cognitive trajectory and mission success rates across all active training modules.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-6 space-y-8">
                {/* KPI Metrics Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 shadow-sm shadow-blue-100/20 group hover:border-blue-200 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-4 transition-transform group-hover:scale-110">
                            <span className="material-icons-outlined text-xl">assignment</span>
                        </div>
                        <dt className="text-[10px] font-black text-blue-400   mb-1">Assessments_Completed</dt>
                        <dd className="text-3xl font-black text-blue-900 tracking-tighter">{stats.total_assessments}</dd>
                    </div>

                    <div className="bg-violet-50/50 border border-violet-100 rounded-3xl p-6 shadow-sm shadow-violet-100/20 group hover:border-violet-200 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-900 mb-4 transition-transform group-hover:scale-110">
                            <span className="material-icons-outlined text-xl">verified</span>
                        </div>
                        <dt className="text-[10px] font-black text-violet-400   mb-1">Agility_Score_Avg</dt>
                        <dd className="text-3xl font-black text-violet-900 tracking-tighter">{stats.average_score}%</dd>
                    </div>

                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 shadow-sm shadow-indigo-100/20 group hover:border-indigo-200 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 mb-4 transition-transform group-hover:scale-110">
                            <span className="material-icons-outlined text-xl">quiz</span>
                        </div>
                        <dt className="text-[10px] font-black text-indigo-400   mb-1">Questions_Analyzed</dt>
                        <dd className="text-3xl font-black text-indigo-900 tracking-tighter">{stats.total_practice_questions}</dd>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Activity Log Panel */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden flex flex-col shadow-sm">
                        <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse"></div>
                                <span className="text-[9px] font-black tracking-[0.4em] text-slate-400 ">Recent_Activity_Log</span>
                            </div>
                        </div>

                        <div className="p-8">
                            <ul className="space-y-4">
                                {stats.recent_activity.length === 0 ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300">
                                            <span className="material-symbols-rounded text-2xl">history</span>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-300  ">No_Activity_Detected</p>
                                    </div>
                                ) : (
                                    stats.recent_activity.map((item) => {
                                        const typeColors = getTypeColors(item.type);
                                        return (
                                            <li key={item.id} className={`group flex items-center justify-between p-4 ${typeColors.bg} rounded-2xl border ${typeColors.border} hover:border-slate-200 hover:bg-white transition-all`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center ${typeColors.text} shadow-sm border border-slate-100 transition-colors`}>
                                                        <span className="material-icons-outlined text-xl">
                                                            {item.type === 'CODING' ? 'terminal' : item.type === 'COMMUNICATION' ? 'forum' : 'psychology'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900  tracking-tight group-hover:text-slate-700 transition-colors">{item.title}</p>
                                                        <p className="text-[9px] font-black text-slate-400  tracking-[0.2em]">{new Date(item.completed_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                                                    <span className="text-[10px] font-black text-slate-900 tracking-tighter">
                                                        {item.score}<span className="text-slate-400 mx-0.5">/</span>{item.total_questions}
                                                    </span>
                                                </div>
                                            </li>
                                        );
                                    })
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Performance Visualization */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden flex flex-col shadow-sm">
                        <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse"></div>
                                <span className="text-[9px] font-black tracking-[0.4em] text-slate-400 ">Success_Trajectory</span>
                            </div>
                        </div>

                        <div className="p-8 pb-12 flex-1 flex flex-col">
                            {stats.recent_activity.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 border-2 border-dashed border-slate-50 rounded-[2rem]">
                                    <span className="material-icons-outlined text-4xl text-slate-200">monitoring</span>
                                    <p className="text-[10px] font-black text-slate-300  ">Awaiting_Data_Streams</p>
                                </div>
                            ) : (
                                <div className="flex-1 relative mt-8">
                                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#000000" stopOpacity="0.2" />
                                                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>

                                        {/* Grid Lines */}
                                        {[0, 25, 50, 75, 100].map((line) => (
                                            <line
                                                key={line}
                                                x1="0" y1={line} x2="100" y2={line}
                                                stroke="#f1f5f9" strokeWidth="0.5"
                                            />
                                        ))}

                                        {/* Area Fill */}
                                        <path
                                            d={`M 0 100 ${stats.recent_activity.map((item, i) => {
                                                const x = (i / (stats.recent_activity.length - 1)) * 100;
                                                const y = 100 - (item.score / item.total_questions) * 100;
                                                return `L ${x} ${y}`;
                                            }).join(' ')} L 100 100 Z`}
                                            fill="url(#chartGradient)"
                                            className="transition-all duration-1000"
                                        />

                                        {/* Line Path */}
                                        <path
                                            d={`M ${stats.recent_activity.map((item, i) => {
                                                const x = (i / (stats.recent_activity.length - 1)) * 100;
                                                const y = 100 - (item.score / item.total_questions) * 100;
                                                return `${i === 0 ? '' : 'L'} ${x} ${y}`;
                                            }).join(' ')}`}
                                            fill="none"
                                            stroke="#000000"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="transition-all duration-1000"
                                        />

                                        {/* Interactive Points */}
                                        {stats.recent_activity.map((item, i) => {
                                            const x = (i / (stats.recent_activity.length - 1)) * 100;
                                            const y = 100 - (item.score / item.total_questions) * 100;
                                            return (
                                                <g key={i} className="group/point">
                                                    <circle
                                                        cx={x} cy={y} r="1.5"
                                                        fill="white"
                                                        stroke="#000000"
                                                        strokeWidth="1"
                                                        className="transition-all group-hover/point:r-2 group-hover/point:stroke-[2]"
                                                    />
                                                    {/* Tooltip on hover simulation */}
                                                    <foreignObject x={x - 10} y={y - 12} width="20" height="10" className="overflow-visible pointer-events-none opacity-0 group-hover/point:opacity-100 transition-opacity">
                                                        <div className="bg-slate-900 text-white text-[6px] font-black px-1 py-0.5 rounded shadow-xl whitespace-nowrap text-center">
                                                            {Math.round((item.score / item.total_questions) * 100)}%
                                                        </div>
                                                    </foreignObject>
                                                </g>
                                            );
                                        })}
                                    </svg>

                                    {/* X-Axis Labels */}
                                    <div className="absolute top-[105%] left-0 right-0 flex justify-between">
                                        {stats.recent_activity.map((item, i) => (
                                            <div key={i} className="flex flex-col items-center w-0 overflow-visible">
                                                <span className="text-[7px] font-black text-slate-400  tracking-tighter whitespace-nowrap rotate-12 origin-left mt-2 px-1">
                                                    {item.title}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                                <span className="text-[8px] font-black text-slate-300  tracking-[0.3em]">Historical_Trend_v1.0</span>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-900"></div>
                                        <span className="text-[8px] font-black text-slate-400  ">Efficiency</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function getTypeColors(type: string) {
    switch (type) {
        case 'CODING': return { bg: 'bg-blue-50/50', border: 'border-blue-100', text: 'text-blue-500' };
        case 'COMMUNICATION': return { bg: 'bg-cyan-50/50', border: 'border-cyan-100', text: 'text-cyan-500' };
        case 'APTITUDE': return { bg: 'bg-amber-50/50', border: 'border-amber-100', text: 'text-amber-500' };
        default: return { bg: 'bg-slate-50/50', border: 'border-slate-100', text: 'text-slate-400' };
    }
}
