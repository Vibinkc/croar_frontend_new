"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/utils/api";
import { useDivision } from "@/context/DivisionContext";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, Cell
} from 'recharts';

interface AdminActivityItem {
    id: number;
    user: string;
    action: string;
    details: string;
    timestamp: string;
    type: "RESUME" | "INTERVIEW" | "ASSESSMENT";
}

interface ScoreDistribution {
    range: string;
    count: number;
}

interface GrowthItem {
    date: string;
    count: number;
}

interface AdminStats {
    total_users: number;
    total_questions: number;
    total_scenarios: number;
    total_resumes: number;
    total_interviews: number;
    pending_reviews: number;
    assessment_score_distribution: ScoreDistribution[];
    student_growth: GrowthItem[];
    recent_activity: AdminActivityItem[];
}

export default function AdminDashboard() {
    const { selectedDivisionId, selectedDepartmentId, selectedBatch } = useDivision();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (selectedDivisionId) params.append("division_id", selectedDivisionId.toString());
                if (selectedDepartmentId) params.append("department_id", selectedDepartmentId.toString());
                if (selectedBatch) params.append("batch", selectedBatch);

                const res = await apiClient.get(`/api/v1/users/admin/stats?${params.toString()}`);
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
        fetchStats();
    }, [selectedDivisionId, selectedDepartmentId, selectedBatch]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Dashboard...</p>
            </div>
        </div>
    );

    // Default to 0 if null
    const s = stats || {
        total_users: 0, total_questions: 0, total_scenarios: 0,
        total_resumes: 0, total_interviews: 0, pending_reviews: 0,
        assessment_score_distribution: [], student_growth: [], recent_activity: []
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">COMMAND CENTER</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Academik.ai // Admin_Console</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg border border-slate-200">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500"></span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest">System Online</span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Students", val: s.total_users, icon: "school", color: "text-indigo-600", bg: "bg-indigo-50", iconBg: "bg-indigo-100", accent: "indigo" },
                    { label: "Questions DB", val: s.total_questions, icon: "library_books", color: "text-emerald-600", bg: "bg-emerald-50", iconBg: "bg-emerald-100", accent: "emerald" },
                    { label: "Resumes Scanned", val: s.total_resumes, icon: "description", color: "text-purple-600", bg: "bg-purple-50", iconBg: "bg-purple-100", accent: "purple" },
                    { label: "Mock Interviews", val: s.total_interviews, icon: "duo", color: "text-amber-600", bg: "bg-amber-50", iconBg: "bg-amber-100", accent: "amber" },
                ].map((item, i) => (
                    <div key={i} className={`bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all group relative overflow-hidden`}>
                        <div className={`absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity ${item.color}`}>
                            <span className="material-icons-outlined text-7xl">{item.icon}</span>
                        </div>
                        <div className="relative z-10">
                            <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center ${item.color} mb-3 group-hover:scale-110 transition-transform`}>
                                <span className="material-icons-outlined text-xl">{item.icon}</span>
                            </div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{item.val}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Review Chart */}
                <div className="lg:col-span-2 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-800">Student Assessment Performance</h3>
                            <p className="text-[10px] text-slate-400 font-medium">Distribution of scores across completed assessments</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Performance Spectrum</h4>
                        </div>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={s.assessment_score_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="range"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }}
                                    dy={10}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(99,102,241,0.05)' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                                    {s.assessment_score_distribution.map((entry, index) => {
                                        const colors = ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#FB7185'];
                                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* User Growth */}
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                    <div className="mb-4">
                        <h3 className="text-base font-bold text-slate-800">Student Growth</h3>
                        <p className="text-[10px] text-slate-400 font-medium">New registrations (Monthly)</p>
                    </div>
                    <div className="flex-1 min-h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={s.student_growth} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                <Area type="monotone" dataKey="count" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorGrowth)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-800">Live Activity Feed</h3>
                        <p className="text-[10px] text-slate-400 font-medium">Real-time system events</p>
                    </div>

                </div>
                <div className="divide-y divide-slate-50">
                    {s.recent_activity.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">No recent activity found.</div>
                    ) : (
                        s.recent_activity.map((item, i) => {
                            const configs = {
                                RESUME: { icon: "description", bg: "bg-indigo-50", text: "text-indigo-600", badge: "bg-indigo-100 text-indigo-700" },
                                INTERVIEW: { icon: "duo", bg: "bg-purple-50", text: "text-purple-600", badge: "bg-purple-100 text-purple-700" },
                                ASSESSMENT: { icon: "school", bg: "bg-emerald-50", text: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700" }
                            };
                            const config = configs[item.type] || configs.ASSESSMENT;

                            return (
                                <div key={i} className="p-3 hover:bg-slate-50 transition-colors flex items-center gap-3">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${config.bg} ${config.text}`}>
                                        <span className="material-icons-outlined text-base">
                                            {config.icon}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h4 className="text-sm font-bold text-slate-800 truncate">{item.user}</h4>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {new Date(item.timestamp).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500 font-medium">{item.action}</span>
                                            <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                                            <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full ${config.badge}`}>
                                                {item.details}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
