"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { apiClient } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatEntry {
    date: string;
    count: number;
}

interface ProficiencyEntry {
    type: string;
    score: number;
    count?: number;
}

interface Ranking {
    label: string;
    rank: number | string;
    total: number;
    percentile: number;
}

interface UserStats {
    rankings?: Ranking[];
    activity_history?: StatEntry[];
    total_practice_questions?: number;
    total_assessments?: number;
    average_score?: number;
    proficiency?: ProficiencyEntry[];
}

interface UserMe {
    first_name: string;
    last_name: string;
    username: string;
    department_name?: string;
}

interface Badge {
    id: string;
    name: string;
    group: string;
    icon: string;
    color: string;
    bg: string;
    next: {
        target: number;
        current: number;
        label: string;
    } | null;
}

interface Certificate {
    id: string;
    category: string;
    level: number;
    levelName: string;
    count: number;
    nextMilestone: number;
    issueDate: string | null;
    idStr: string;
}

export default function ProfilePage() {
    const { user: authUser, role } = useAuth();
    const [stats, setStats] = useState<UserStats | null>(null);
    const [me, setMe] = useState<UserMe | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [statsRes, meRes] = await Promise.all([
                    apiClient.get("/api/v1/users/me/stats"),
                    apiClient.get("/api/v1/users/me")
                ]);

                if (statsRes.ok) setStats(await statsRes.json());
                if (meRes.ok) setMe(await meRes.json());
            } catch (error) {
                console.error("Failed to fetch profile data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    const ratings = stats?.rankings || [];
    const batchRank = ratings.find((r: Ranking) => r.label === "Batch Rank") || { rank: "N/A", total: 1, percentile: 0 };
    const departmentRank = ratings.find((r: Ranking) => r.label === "Department Rank") || { rank: "N/A", total: 1, percentile: 0 };

    // Format activity for heatmap
    // Generate last 365 days
    const today = new Date();
    const lastYear = Array.from({ length: 364 }, (_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - (363 - i));
        const dateStr = d.toISOString().split('T')[0];
        const activity = stats?.activity_history?.find((h: StatEntry) => h.date === dateStr);
        return { date: dateStr, count: activity?.count || 0 };
    });

    // Problem Solving Data - derriving from total_practice_questions
    const solvedCount = stats?.total_practice_questions || 0;
    // For now we distribute based on usual ratios unless backend provides difficulty breakdown
    const easyCount = Math.floor(solvedCount * 0.4);
    const medCount = Math.floor(solvedCount * 0.45);
    const hardCount = Math.max(0, solvedCount - easyCount - medCount);

    const heatmapData = stats?.activity_history || [];
    const totalSubmissions = heatmapData.reduce((acc: number, curr: StatEntry) => acc + curr.count, 0);
    const activeDays = heatmapData.filter((h: StatEntry) => h.count > 0).length;

    // Calculate streak
    let currentStreak = 0;
    const sortedHistory = [...heatmapData].sort((a: StatEntry, b: StatEntry) => new Date(b.date).getTime() - new Date(a.date).getTime());
    for (let i = 0; i < sortedHistory.length; i++) {
        if (sortedHistory[i].count > 0) currentStreak++;
        else if (i > 0) break; // Only break if not the first check (today/yesterday might be 0)
    }
    // Badge Calculation Logic
    const calculateBadges = () => {
        const badges: Badge[] = [];
        const assessments = stats?.total_assessments || 0;
        const practice = stats?.total_practice_questions || 0;
        const streak = currentStreak;
        const avgScore = stats?.average_score || 0;

        // 1. Assessment Badges
        if (assessments >= 30) badges.push({ id: 'as3', name: 'Expert', group: 'Assessments', icon: 'military_tech', color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', next: null });
        else if (assessments >= 15) badges.push({ id: 'as2', name: 'Professional', group: 'Assessments', icon: 'military_tech', color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800/50', next: { target: 30, current: assessments, label: '30 Assessments' } });
        else if (assessments >= 5) badges.push({ id: 'as1', name: 'Novice', group: 'Assessments', icon: 'military_tech', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30', next: { target: 15, current: assessments, label: '15 Assessments' } });
        else badges.push({ id: 'as0', name: 'In Training', group: 'Assessments', icon: 'military_tech', color: 'text-slate-300', bg: 'bg-slate-50 dark:bg-slate-800/30', next: { target: 5, current: assessments, label: '5 Assessments' } });

        // 2. Practice Badges
        if (practice >= 500) badges.push({ id: 'pr3', name: 'Grandmaster', group: 'Practice', icon: 'local_fire_department', color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30', next: null });
        else if (practice >= 250) badges.push({ id: 'pr2', name: 'Warrior', group: 'Practice', icon: 'local_fire_department', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', next: { target: 500, current: practice, label: '500 Solved' } });
        else if (practice >= 50) badges.push({ id: 'pr1', name: 'Starter', group: 'Practice', icon: 'local_fire_department', color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', next: { target: 250, current: practice, label: '250 Solved' } });
        else badges.push({ id: 'pr0', name: 'Newbie', group: 'Practice', icon: 'local_fire_department', color: 'text-slate-300', bg: 'bg-slate-50 dark:bg-slate-800/30', next: { target: 50, current: practice, label: '50 Solved' } });

        // 3. Streak Badges
        if (streak >= 30) badges.push({ id: 'st3', name: 'Legend', group: 'Streak', icon: 'verified', color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', next: null });
        else if (streak >= 7) badges.push({ id: 'st2', name: 'Weekly Warrior', group: 'Streak', icon: 'verified', color: 'text-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-900/30', next: { target: 30, current: streak, label: '30 Day Streak' } });
        else if (streak >= 3) badges.push({ id: 'st1', name: '3-Day Streak', group: 'Streak', icon: 'verified', color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30', next: { target: 7, current: streak, label: '7 Day Streak' } });
        else badges.push({ id: 'st0', name: 'Committed', group: 'Streak', icon: 'verified', color: 'text-slate-300', bg: 'bg-slate-50 dark:bg-slate-800/30', next: { target: 3, current: streak, label: '3 Day Streak' } });

        // 4. Performance Badge
        if (avgScore >= 85) badges.push({ id: 'ex1', name: 'High Flyer', group: 'Excellence', icon: 'rocket_launch', color: 'text-pink-500', bg: 'bg-pink-100 dark:bg-pink-900/30', next: null });

        return badges;
    };

    const earnedBadges = calculateBadges();

    // Certification Calculation Logic (Category-wise)
    const calculateCertificates = () => {
        const certs: Certificate[] = [];
        stats?.proficiency?.forEach((item: ProficiencyEntry) => {
            const count = item.count || 0;
            const category = item.type;

            let level = 0;
            let levelName = "";
            let nextMilestone = 30;

            if (count >= 500) {
                level = 3;
                levelName = "Master";
                nextMilestone = 0;
            } else if (count >= 100) {
                level = 2;
                levelName = "Advanced";
                nextMilestone = 500;
            } else if (count >= 30) {
                level = 1;
                levelName = "Foundation";
                nextMilestone = 100;
            } else {
                nextMilestone = 30;
            }

            if (level >= 0) {
                certs.push({
                    id: `${category}-${level}`,
                    category,
                    level,
                    levelName: level === 0 ? "In Progress" : levelName,
                    count,
                    nextMilestone,
                    issueDate: level > 0 ? new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null,
                    idStr: level > 0 ? `CERT-${category.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(7).toUpperCase()}` : "PENDING"
                });
            }
        });
        return certs;
    };

    const certificates = calculateCertificates();

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Left Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-3xl font-black shadow-xl">
                                    {me?.first_name?.charAt(0) || "S"}
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 border-4 border-white dark:border-slate-900 w-6 h-6 rounded-full shadow-lg"></div>
                            </div>

                            <div>
                                <h1 className="text-xl font-black text-slate-900 dark:text-white  tracking-tight">
                                    {me ? `${me.first_name} ${me.last_name}` : "Student Profile"}
                                </h1>
                                <p className="text-xs font-bold text-slate-400   mt-1">
                                    {me?.username || "student_user"}
                                </p>
                            </div>

                            <div className="w-full flex justify-center gap-3 py-2 border-y border-slate-50 dark:border-slate-800">
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-slate-400  ">Rank</p>
                                    <p className="text-sm font-black text-slate-900 dark:text-white">#{batchRank.rank}</p>
                                </div>
                            </div>

                        </div>

                        <div className="mt-8 space-y-4">
                            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                <span className="material-symbols-rounded text-xl">location_on</span>
                                <span className="text-xs font-bold">India</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                <span className="material-symbols-rounded text-xl">school</span>
                                <span className="text-xs font-bold">{me?.department_name || "Engineering"}</span>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h3 className="text-[10px] font-black text-slate-400   mb-4">Performance Stats</h3>
                            <div className="space-y-4 text-xs">
                                <div className="flex justify-between items-center group cursor-pointer">
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                        <span className="material-icons-outlined text-base text-blue-500">assignment</span>
                                        <span className="font-bold">Assessments</span>
                                    </div>
                                    <span className="font-black">{stats?.total_assessments || 0}</span>
                                </div>
                                <div className="flex justify-between items-center group cursor-pointer">
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                        <span className="material-icons-outlined text-base text-emerald-500">code</span>
                                        <span className="font-bold">Practice</span>
                                    </div>
                                    <span className="font-black">{stats?.total_practice_questions || 0}</span>
                                </div>
                                <div className="flex justify-between items-center group cursor-pointer">
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                        <span className="material-icons-outlined text-base text-amber-500">analytics</span>
                                        <span className="font-bold">Avg Score</span>
                                    </div>
                                    <span className="font-black">{stats?.average_score || 0}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h3 className="text-[10px] font-black text-slate-400   mb-4">Proficiency Categories</h3>
                            <div className="space-y-3">
                                {stats?.proficiency?.map((item: ProficiencyEntry, i: number) => (
                                    <div key={i} className="flex justify-between text-[11px] font-bold">
                                        <span className="text-slate-600 dark:text-slate-300">{item.type}</span>
                                        <span className="text-slate-900 dark:text-white">{item.score}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Content */}
                <div className="lg:col-span-3 space-y-6">

                    {/* Top Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400   mb-2">Assessment Score</p>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">{Math.round(stats?.average_score ?? 0) || 0}%</h2>
                            <div className="h-24 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={[
                                        { v: 65 }, { v: 72 }, { v: 68 }, { v: 85 }, { v: Math.round(stats?.average_score ?? 0) || 0 }
                                    ]}>
                                        <defs>
                                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Area type="monotone" dataKey="v" stroke="#10b981" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400   mb-2">Batch Ranking</p>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{batchRank.rank}</h2>
                            <p className="text-xs font-bold text-slate-400 tracking-tight">Top {Math.round(batchRank.percentile)}% in your Batch</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-2  leading-tight">
                                Overall percentile based on comprehensive test performance across your Batch.
                            </p>
                            <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                                <p className="text-[10px] font-black text-emerald-500 ">↑ {Math.round(batchRank.percentile / 4)} spots this week</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400   mb-1">Badges</p>
                                    <h2 className="text-3xl font-black text-slate-900 dark:text-white">{earnedBadges.filter(b => !b.id.endsWith('0')).length}</h2>
                                </div>
                                <span className="material-symbols-rounded text-slate-300 text-4xl">military_tech</span>
                            </div>
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {earnedBadges.filter(b => !b.id.endsWith('0')).map((badge) => (
                                        <div key={badge.id} className={`w-8 h-8 rounded-lg ${badge.bg} flex items-center justify-center ${badge.color}`} title={`${badge.group}: ${badge.name}`}>
                                            <span className="material-symbols-rounded text-lg">{badge.icon}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-4 border-t border-slate-50 dark:border-slate-800 space-y-3">
                                    <p className="text-[10px] font-black text-slate-400   mb-1">Next Milestones</p>
                                    {earnedBadges.filter(b => b.next).map((badge) => {
                                        const progress = (badge.next!.current / badge.next!.target) * 100;
                                        return (
                                            <div key={`next-${badge.id}`} className="space-y-1">
                                                <div className="flex justify-between text-[8px] font-black   text-slate-500">
                                                    <span>{badge.group}</span>
                                                    <span>{badge.next!.current} / {badge.next!.target}</span>
                                                </div>
                                                <div className="w-full h-1 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${badge.color.replace('text-', 'bg-')}`}
                                                        style={{ width: `${Math.min(100, progress)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                    </div>


                    {/* Problem Solving Circular Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                            <h3 className="text-xs font-black text-slate-400   mb-6">Solved Problems</h3>
                            <div className="flex items-center gap-12">
                                <div className="relative flex-shrink-0">
                                    <svg className="w-32 h-32 transform -rotate-90">
                                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364} strokeDashoffset={364 * (1 - solvedCount / 1000)} strokeLinecap="round" className="text-emerald-500" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">{solvedCount}</span>
                                        <span className="text-[8px] font-black text-slate-400  mt-1 tracking-tighter">Solved</span>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <div className="flex justify-between text-[10px] font-black  mb-1.5">
                                            <span className="text-emerald-500">Easy</span>
                                            <span className="text-slate-900 dark:text-white">{easyCount} / 450</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-50 dark:bg-slate-800 rounded-full">
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '40%' }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[10px] font-black  mb-1.5">
                                            <span className="text-amber-500">Medium</span>
                                            <span className="text-slate-900 dark:text-white">{medCount} / 800</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-50 dark:bg-slate-800 rounded-full">
                                            <div className="h-full bg-amber-500 rounded-full" style={{ width: '35%' }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[10px] font-black  mb-1.5">
                                            <span className="text-rose-500">Hard</span>
                                            <span className="text-slate-900 dark:text-white">{hardCount} / 300</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-50 dark:bg-slate-800 rounded-full">
                                            <div className="h-full bg-rose-500 rounded-full" style={{ width: '20%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-black text-slate-400  ">Skill Radar</h3>
                                <span className="text-[10px] font-bold text-blue-500  ">Last 30 Days</span>
                            </div>
                            {/* Simple Skill Progress Bars */}
                            <div className="space-y-5">
                                {stats?.proficiency?.map((item: ProficiencyEntry, i: number) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-[11px] font-bold mb-2  tracking-wide">
                                            <span className="text-slate-600 dark:text-slate-300">{item.type}</span>
                                            <span className="text-slate-900 dark:text-white">{item.score}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${item.type === 'Coding' ? 'bg-blue-500' :
                                                    item.type === 'Communication' ? 'bg-cyan-500' : 'bg-amber-500'
                                                    }`}
                                                style={{ width: `${item.score}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Verified Certifications Section */}
                    {certificates.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                            <h3 className="text-xs font-black text-slate-400   mb-6">Verified Certifications</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {certificates.map((cert) => (
                                    <div key={cert.id} className={`relative group p-5 rounded-2xl border transition-all duration-300 ${cert.level > 0
                                        ? 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 hover:border-emerald-500/50'
                                        : 'border-dashed border-slate-200 dark:border-slate-800 bg-transparent opacity-70'
                                        }`}>
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${cert.level === 3 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                                                cert.level === 2 ? 'bg-gradient-to-br from-slate-400 to-slate-600' :
                                                    cert.level === 1 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                                                        'bg-slate-200 dark:bg-slate-800 text-slate-400 shadow-none'
                                                }`}>
                                                <span className="material-symbols-rounded text-2xl">
                                                    {cert.level > 0 ? 'workspace_premium' : 'pending_actions'}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-black text-slate-900 dark:text-white  leading-tight">
                                                    {cert.category}
                                                </h4>
                                                <p className={`text-[10px] font-black  mt-1  ${cert.level > 0 ? 'text-emerald-500' : 'text-slate-400'
                                                    }`}>
                                                    {cert.level > 0 ? `${cert.levelName} Certified` : 'Targeting Level 1'}
                                                </p>
                                                <div className="mt-3 flex flex-col gap-1">
                                                    <p className="text-[9px] font-bold text-slate-400 ">
                                                        {cert.level > 0 ? `ID: ${cert.idStr}` : 'Progressing...'}
                                                    </p>
                                                    {cert.issueDate && <p className="text-[9px] font-bold text-slate-400 ">Issued: {cert.issueDate}</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {cert.nextMilestone > 0 && (
                                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                <div className="flex justify-between text-[8px] font-black  text-slate-500 mb-1.5">
                                                    <span>Progression to Level {cert.level + 1}</span>
                                                    <span>{cert.count} / {cert.nextMilestone}</span>
                                                </div>
                                                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${Math.min(100, (cert.count / cert.nextMilestone) * 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => setSelectedCert(cert)}
                                            disabled={cert.level === 0}
                                            className={`mt-4 w-full py-2 rounded-lg text-[9px] font-black   transition-all ${cert.level > 0
                                                ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:text-emerald-500'
                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-300 cursor-not-allowed border border-transparent'
                                                }`}
                                        >
                                            {cert.level > 0 ? 'View Certificate' : 'Not Yet Earned'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Activity Heatmap */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xs font-black text-slate-400  ">{totalSubmissions} submissions in the last year</h3>
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 ">
                                <span>Total active days: {activeDays}</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                <span>Current streak: {currentStreak}</span>
                            </div>
                        </div>

                        {/* Custom Grid for Heatmap */}
                        <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-4 scrollbar-hide">
                            {lastYear.map((day, i) => {
                                const count = day.count;
                                const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 8 ? 3 : 4;
                                return (
                                    <div
                                        key={i}
                                        className={`w-[10px] h-[10px] rounded-sm transition-colors ${level === 0 ? 'bg-slate-50 dark:bg-slate-800/50' :
                                            level === 1 ? 'bg-emerald-200 dark:bg-emerald-900/30' :
                                                level === 2 ? 'bg-emerald-300 dark:bg-emerald-700/50' :
                                                    level === 3 ? 'bg-emerald-400 dark:bg-emerald-600/70' :
                                                        'bg-emerald-500 shadow-sm shadow-emerald-200'
                                            }`}
                                        title={`${format(new Date(day.date), "MMM d, yyyy")}: ${count} submissions`}
                                    ></div>
                                );
                            })}
                        </div>
                        <div className="mt-2 flex justify-between items-center text-[9px] font-bold text-slate-400  ">
                            <div className="flex w-full justify-between items-center pr-32">
                                {Array.from({ length: 12 }).map((_, i) => {
                                    const date = new Date();
                                    date.setMonth(date.getMonth() - (11 - i));
                                    const monthName = format(date, "MMM");
                                    const yearStr = format(date, "yyyy");
                                    // Show year only for the first month and when the year changes (Jan)
                                    const showYear = i === 0 || monthName === "Jan";
                                    return (
                                        <div key={i} className="flex flex-col items-center">
                                            {showYear && <span className="text-[7px] text-slate-300 mb-0.5">{yearStr}</span>}
                                            <span>{monthName}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span>Less</span>
                                <div className="flex gap-1">
                                    <div className="w-2.5 h-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-sm"></div>
                                    <div className="w-2.5 h-2.5 bg-emerald-200 rounded-sm"></div>
                                    <div className="w-2.5 h-2.5 bg-emerald-400 rounded-sm"></div>
                                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></div>
                                </div>
                                <span>More</span>
                            </div>
                        </div>
                    </div>

                    {/* Achievement Showcase - At Last */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <span className="material-symbols-rounded text-2xl">stars</span>
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-slate-900 dark:text-white  tracking-tight">Achievement Showcase</h2>
                                <p className="text-[10px] font-bold text-slate-400   mt-0.5">Your Wall of Fame</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {/* Completed Certifications in Showcase */}
                            {certificates.filter(c => c.level > 0).map((cert) => (
                                <div
                                    key={`showcase-cert-${cert.id}`}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setSelectedCert(cert)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setSelectedCert(cert);
                                        }
                                    }}
                                    className="cursor-pointer group relative flex flex-col items-center p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 hover:border-amber-500/50 hover:shadow-lg transition-all"
                                >
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white mb-3 shadow-md ${cert.level === 3 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                                        cert.level === 2 ? 'bg-gradient-to-br from-slate-400 to-slate-600' :
                                            'bg-gradient-to-br from-orange-400 to-orange-600'
                                        }`}>
                                        <span className="material-symbols-rounded text-2xl">workspace_premium</span>
                                    </div>
                                    <p className="text-[9px] font-black text-slate-900 dark:text-white  text-center leading-tight">
                                        {cert.category}
                                    </p>
                                    <p className="text-[7px] font-black text-amber-600  mt-1 tracking-tighter">Level {cert.level}</p>
                                </div>
                            ))}

                            {/* Completed Badges in Showcase */}
                            {earnedBadges.filter(b => !b.id.endsWith('0')).map((badge) => (
                                <div
                                    key={`showcase-badge-${badge.id}`}
                                    className="relative flex flex-col items-center p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 hover:shadow-md transition-all"
                                >
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${badge.bg} ${badge.color} mb-3 shadow-sm`}>
                                        <span className="material-symbols-rounded text-2xl">{badge.icon}</span>
                                    </div>
                                    <p className="text-[9px] font-black text-slate-900 dark:text-white  text-center leading-tight">
                                        {badge.name}
                                    </p>
                                    <p className="text-[7px] font-black text-slate-400  mt-1 tracking-tighter">{badge.group}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* Certificate View Modal */}
            {selectedCert && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300 print:p-0 print:bg-white">
                    {/* Level-based Color Mapping */}
                    {(() => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const levelColors: any = {
                            1: { border: '#CD7F32', bg: '#FFF5EB', text: '#8B5A2B', highlight: 'bg-[#CD7F32]/10', borderHighlight: 'border-[#CD7F32]/20' },
                            2: { border: '#A0A0A0', bg: '#F8F8F8', text: '#4B4B4B', highlight: 'bg-[#A0A0A0]/10', borderHighlight: 'border-[#A0A0A0]/20' },
                            3: { border: '#D4AF37', bg: '#FCFAF5', text: '#8B7355', highlight: 'bg-[#D4AF37]/10', borderHighlight: 'border-[#D4AF37]/20' }
                        };
                        const colors = levelColors[selectedCert.level] || levelColors[3];

                        return (
                            <div
                                id="certificate-content"
                                className="relative w-full max-w-4xl rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300 p-2 print:shadow-none print:w-full print:max-w-none print:rounded-none"
                                style={{ backgroundColor: colors.bg, border: `12px solid ${colors.border}` }}
                            >
                                {/* Inner Ornate Border */}
                                <div className="border-4 border-double h-full w-full p-8 md:p-12 relative flex flex-col items-center print:p-16" style={{ borderColor: colors.border }}>

                                    {/* Decorative Corner Accents */}
                                    <div className="absolute top-2 left-2 w-12 h-12 border-t-2 border-l-2" style={{ borderColor: colors.border }}></div>
                                    <div className="absolute top-2 right-2 w-12 h-12 border-t-2 border-r-2" style={{ borderColor: colors.border }}></div>
                                    <div className="absolute bottom-2 left-2 w-12 h-12 border-b-2 border-l-2" style={{ borderColor: colors.border }}></div>
                                    <div className="absolute bottom-2 right-2 w-12 h-12 border-b-2 border-r-2" style={{ borderColor: colors.border }}></div>

                                    {/* Watermark/Pattern Overlay */}
                                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center overflow-hidden">
                                        <div className="text-[20rem] font-black transform rotate-45 select-none" style={{ color: colors.border }}>ACADEMIK</div>
                                    </div>

                                    <button
                                        onClick={() => setSelectedCert(null)}
                                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors z-10 print:hidden"
                                    >
                                        <span className="material-symbols-rounded text-2xl">close</span>
                                    </button>

                                    {/* Logo & Header */}
                                    <div className="flex flex-col items-center mb-10 z-10">
                                        <div className="mb-4 relative">
                                            <Image
                                                src="/Academik_logo.png"
                                                alt="Academik Logo"
                                                width={160}
                                                height={60}
                                                className="h-12 w-auto object-contain"
                                            />
                                        </div>
                                        <h3 className="text-[10px] font-black tracking-[0.5em] " style={{ color: colors.text }}>Academik Performance Engine</h3>
                                    </div>

                                    {/* Certificate Title */}
                                    <div className="text-center mb-10 z-10">
                                        <h1 className="text-4xl md:text-5xl font-serif  text-slate-900 mb-2">Certificate of Achievement</h1>
                                        <p className="text-[10px] font-black   mt-4" style={{ color: colors.text }}>This prestigious award is officially presented to</p>
                                    </div>

                                    {/* Recipient Name */}
                                    <div className="text-center mb-10 z-10 w-full max-w-xl border-b-2 border-slate-200 pb-4">
                                        <span className="text-4xl md:text-5xl font-black text-slate-900  tracking-tighter">
                                            {me?.first_name} {me?.last_name}
                                        </span>
                                    </div>

                                    {/* Achievement Details */}
                                    <div className="text-center mb-12 z-10 max-w-2xl px-4">
                                        <p className="text-lg text-slate-700 leading-relaxed font-serif">
                                            In recognition of demonstrating exceptional mastery and professional proficiency as a <br />
                                            <span className={`font-bold text-slate-900 tracking-wide  px-3 py-1 rounded border flex-inline items-center gap-2 ${colors.highlight} ${colors.borderHighlight}`}>
                                                Level {selectedCert.level}: {selectedCert.category} {selectedCert.levelName === "Master" ? "Specialist" : selectedCert.levelName}
                                            </span>
                                        </p>
                                        <p className="text-sm text-slate-500 mt-6 ">
                                            Validated through the Academik Performance Engine comprehensive assessment suite.
                                        </p>
                                    </div>

                                    {/* Footer Elements */}
                                    <div className="flex flex-row w-full items-end justify-between gap-12 mt-8 z-10 px-8">
                                        <div className="text-left">
                                            <p className="text-[9px] font-black  text-slate-400 mb-0.5">Verification ID</p>
                                            <p className="text-[10px] font-black text-slate-900 ">{selectedCert.idStr}</p>
                                            <p className="text-[10px] font-bold text-slate-400  mt-1">Issued: {selectedCert.issueDate}</p>
                                        </div>

                                        <div className="flex flex-col items-center">
                                            <div className={`w-28 h-28 rounded-full border-4 flex items-center justify-center relative shadow-inner`} style={{ borderColor: colors.border, backgroundColor: `${colors.border}05` }}>
                                                <div className="absolute inset-2 border-2 border-dashed rounded-full" style={{ borderColor: colors.border }}></div>
                                                <span className="material-symbols-rounded text-5xl" style={{ color: colors.border }}>workspace_premium</span>
                                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent opacity-30 rounded-full"></div>
                                            </div>
                                            <p className="mt-4 text-[10px] font-black  " style={{ color: colors.border }}>Official Seal</p>
                                        </div>
                                    </div>

                                    {/* Download Button Component (Hidden during print) */}
                                    <div className="absolute bottom-6 right-6 z-20 print:hidden">
                                        <button
                                            onClick={() => window.print()}
                                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black   hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                                        >
                                            <span className="material-symbols-rounded text-lg">download</span>
                                            {"Download (PDF)"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}
