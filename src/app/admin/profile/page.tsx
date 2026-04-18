"use client";

import { useAuth } from "@/context/AuthContext";
import { useDivision } from "@/context/DivisionContext";
import { apiClient } from "@/utils/api";
import { useEffect, useState } from "react";
import { format, subDays, eachDayOfInterval, isSameDay } from "date-fns";
import Image from "next/image";

interface AdminStats {
    total_users: number;
    total_questions: number;
    total_scenarios: number;
    total_resumes: number;
    total_interviews: number;
    total_staff: number;
    total_divisions: number;
    total_departments: number;
    activity_history: { date: string; count: number }[];
    performance_trends: { date: string; score: number }[];
    contribution_history: { date: string; count: number }[];
    proficiency_radar: { type: string; score: number }[];
}

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

export default function AdminProfilePage() {
    const { role, user, divisionId } = useAuth();
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

    // Heatmap Logic
    const endDate = new Date();
    const startDate = subDays(endDate, 364);
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });

    const heatmapData = allDays.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const entry = stats?.activity_history?.find(h => h.date === dateStr);
        return {
            date: dateStr,
            count: entry ? entry.count : 0
        };
    });

    const totalSignals = heatmapData.reduce((acc, curr) => acc + curr.count, 0);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400 font-bold   text-xs">Synchronizing Intelligence...</p>
            </div>
        </div>
    );

    const getRoleTitle = () => {
        if (role === "ADMIN" && !divisionId) return "Management Admin";
        if (role === "ADMIN" && divisionId) return "Institutional Admin";
        if (role === "SUB_ADMIN") return "HOD Admin";
        if (role === "STAFF") return "Staff Admin";
        return "Administrator";
    };

    const isHOD = role === "SUB_ADMIN";
    const isManagement = role === "ADMIN" && !divisionId;
    const isInstitutional = role === "ADMIN" && divisionId;

    const getPrimaryKPI = () => {
        if (isManagement) return { label: "Institutions Managed", val: stats?.total_divisions, icon: "account_balance" };
        if (isInstitutional) return { label: "Departments Managed", val: stats?.total_departments, icon: "hub" };
        if (isHOD) return { label: "Staff Managed", val: stats?.total_staff, icon: "badge" };
        return { label: "Students Managed", val: stats?.total_users, icon: "groups" };
    };

    const primaryKPI = getPrimaryKPI();

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
            {/* Admin Header Card */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl border border-slate-800">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <span className="material-symbols-rounded text-[12rem]">admin_panel_settings</span>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-5xl font-black shadow-xl border-4 border-slate-800/50">
                            {user ? user.charAt(0).toUpperCase() : "A"}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-full border-4 border-slate-900 flex items-center justify-center">
                            <span className="material-symbols-rounded text-white text-xl">verified</span>
                        </div>
                    </div>

                    <div className="text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                            <h1 className="text-3xl font-black tracking-tight ">{user || "Administrator"}</h1>
                            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black px-3 py-1 rounded-full border border-indigo-500/30  ">
                                {getRoleTitle()}
                            </span>
                        </div>
                        <p className="text-slate-400 text-sm font-medium mb-6">Overseeing academic excellence and system performance.</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <p className="text-[10px] font-black text-slate-500  tracking-[0.2em] mb-1">System Tier</p>
                                <p className="text-xs font-bold text-white ">{role}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500  tracking-[0.2em] mb-1">Status</p>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                    <p className="text-xs font-bold text-white ">Active</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Jurisdiction KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: primaryKPI.label, val: primaryKPI.val, icon: primaryKPI.icon, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Questions Pool", val: stats?.total_questions, icon: "quiz", color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Resumes Tracked", val: stats?.total_resumes, icon: "assignment_ind", color: "text-purple-600", bg: "bg-purple-50" },
                    { label: "Simulation Runs", val: stats?.total_interviews, icon: "psychology", color: "text-amber-600", bg: "bg-amber-50" },
                ].map((item, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                        <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center ${item.color} mb-4`}>
                            <span className="material-symbols-rounded text-2xl">{item.icon}</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400   mb-1">{item.label}</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{item.val || 0}</h3>
                    </div>
                ))}
            </div>

            {/* Contribution and Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Staff Contribution Chart */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm transition-all hover:shadow-lg">
                    <div className="mb-6">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white  tracking-tight ">{isHOD ? "Departmental Staff Output" : "Personal Impact Log"}</h3>
                        <p className="text-[10px] font-bold text-slate-400   mt-0.5">{isHOD ? "Aggregated Staff Contributions" : "Your Admin Contribs (Questions, GDs, Reviews)"}</p>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.contribution_history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorContrib" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorContrib)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Performance Trend Chart */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm transition-all hover:shadow-lg">
                    <div className="mb-6">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white  tracking-tight ">{isHOD ? "Departmental Performance Pulse" : "Batch Performance Pulse"}</h3>
                        <p className="text-[10px] font-bold text-slate-400   mt-0.5">{isHOD ? "Team & Student Accuracy Trends" : "Average Assessment Accuracy Trends"}</p>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats?.performance_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={4} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Main Command Center Heatmap */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                        <h2 className="text-sm font-black text-slate-900 dark:text-white  tracking-tight">{isHOD ? "Departmental Engagement Intelligence" : "Student Practice Intelligence"}</h2>
                        <p className="text-[10px] font-bold text-slate-400   mt-0.5">{isHOD ? "Aggregated Staff & Student Activity" : "Aggregated Daily Activity (Last 365 Days)"}</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400   mb-0.5">Total Signals</p>
                            <p className="text-xl font-black text-indigo-600 tracking-tighter">{totalSignals}</p>
                        </div>
                        <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-800"></div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400   mb-0.5">System Load</p>
                            <p className="text-xl font-black text-emerald-600 tracking-tighter">Optimized</p>
                        </div>
                    </div>
                </div>

                {/* Heatmap Grid */}
                <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto pb-6 scrollbar-hide">
                    {heatmapData.map((day, i) => {
                        const level = day.count === 0 ? 0 :
                            day.count <= 5 ? 1 :
                                day.count <= 15 ? 2 :
                                    day.count <= 30 ? 3 : 4;
                        return (
                            <div
                                key={i}
                                className={`w-3.5 h-3.5 rounded-[3px] transition-all duration-300 hover:scale-125 ${level === 0 ? 'bg-slate-50 dark:bg-slate-800/50' :
                                    level === 1 ? 'bg-indigo-100 dark:bg-indigo-900/20' :
                                        level === 2 ? 'bg-indigo-300 dark:bg-indigo-700/40' :
                                            level === 3 ? 'bg-indigo-500 dark:bg-indigo-500/60' :
                                                'bg-indigo-700 shadow-[0_0_10px_rgba(67,56,202,0.3)]'
                                    }`}
                                title={`${format(new Date(day.date), "MMM d, yyyy")}: ${day.count} aggregated actions`}
                            ></div>
                        );
                    })}
                </div>

                <div className="mt-4 flex justify-between items-center text-[10px] font-black text-slate-400  ">
                    <div className="flex w-full justify-between items-center pr-12 md:pr-24 lg:pr-32">
                        {Array.from({ length: 12 }).map((_, i) => {
                            const date = new Date();
                            date.setMonth(date.getMonth() - (11 - i));
                            return <span key={i}>{format(date, "MMM")}</span>;
                        })}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span>Low Engagement</span>
                        <div className="flex gap-1">
                            {[0, 1, 2, 3, 4].map(l => (
                                <div key={l} className={`w-3 h-3 rounded-sm ${l === 0 ? 'bg-slate-50 dark:bg-slate-800/50' :
                                    l === 1 ? 'bg-indigo-100' :
                                        l === 2 ? 'bg-indigo-300' :
                                            l === 3 ? 'bg-indigo-500' :
                                                'bg-indigo-700'
                                    }`}></div>
                            ))}
                        </div>
                        <span>High Engagement</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions / Jurisdiction Control */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                            <span className="material-symbols-rounded text-2xl">shield_person</span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white  tracking-tight">Access Control</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-hover hover:border-purple-500/30">
                            <h4 className="text-[10px] font-black text-slate-400   mb-1">Current Jurisdiction</h4>
                            <p className="text-xs font-bold text-slate-900 dark:text-white ">
                                {selectedDivisionId ? `Division ${selectedDivisionId}` : 'ALL DIVISIONS'}
                                {selectedDepartmentId ? ` » Dept ${selectedDepartmentId}` : ''}
                                {selectedBatch ? ` » ${selectedBatch}` : ''}
                            </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            <h4 className="text-[10px] font-black text-slate-400   mb-1">Security Level</h4>
                            <p className="text-xs font-bold text-emerald-500  ">Maximum Clearance Level ({role})</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                            <span className="material-symbols-rounded text-2xl">verified</span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white  tracking-tight">System Integrity</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-500 ">Database Sync</span>
                            <span className="text-[10px] font-black text-emerald-500  tracking-tighter ">LATEST</span>
                        </div>
                        <div className="flex justify-between items-center p-3 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-500 ">Audit Logging</span>
                            <span className="text-[10px] font-black text-blue-500  tracking-tighter">ENABLED</span>
                        </div>
                        <div className="flex justify-between items-center p-3 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-500 ">Multi-Tenant Isolation</span>
                            <span className="text-[10px] font-black text-purple-500  tracking-tighter">SECURED</span>
                        </div>
                    </div>
                </div>

                {/* Proficiency Radar */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm md:col-span-2">
                    <div className="mb-6 text-center">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white  tracking-tight">{isHOD ? "Institutional Skill Balance" : "Student Skill Equilibrium"}</h3>
                        <p className="text-[10px] font-bold text-slate-400   mt-0.5">{isHOD ? "Departmental Proficiency Mapping" : "Average Performance across Categories"}</p>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats?.proficiency_radar}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="type" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} />
                                <Radar name="Proficiency" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
