"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    AreaChart,
    Area
} from 'recharts';
import { jetbrainsMono } from "@/components/ds";

interface JobStage {
    id: number;
    name: string;
    count: number;
}

interface JobMetrics {
    pipeline: number;
    submitted: number;
    end_client: number;
    interviews: number;
    confirmations: number;
    rejected: number;
    onboarded: number;
}

interface Application {
    id: string;
    candidate: {
        id: string;
        full_name: string;
        email: string;
        skills: string[];
    };
    current_stage: number;
    ai_match_score?: number;
    applied_at: string;
}

interface Job {
    id: string;
    title: string;
    description: string;
    location: string;
    created_at: string;
    status_id: number;
    salary_min?: number;
    salary_max?: number;
    salary_currency?: string;
    salary_frequency?: string;
    experience_min?: number;
    experience_max?: number;
    job_type?: string;
    work_mode?: string;
    department?: string;
    required_skills?: string[];
    client_job_id?: string;
    customer_type?: string;
    customer?: string;
    metrics?: JobMetrics;
    stages?: JobStage[];
}

const STATIC_LEADING_TABS = [
    { id: "overview", label: "Overview", count: undefined },
    { id: "info", label: "Info", count: undefined },
    { id: "onboarding_tab", label: "Onboarding", count: undefined },
];

export default function JobDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const { token, canAccess } = useAuth();

    const [job, setJob] = useState<Job | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [onboardings, setOnboardings] = useState<any[]>([]);
    const [isOnboardingLoading, setIsOnboardingLoading] = useState(false);

    useEffect(() => {
        if (id && token) {
            fetchJobDetails();
            fetchApplications();
            fetchOnboardings();
        }
    }, [id, token]);

    const fetchJobDetails = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${id}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setJob(data);
            }
        } catch (error) {
            console.error("Error fetching job:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchApplications = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/applications?job_id=${id}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setApplications(data);
            }
        } catch (error) {
            console.error("Error fetching applications:", error);
        }
    };

    const fetchOnboardings = async () => {
        setIsOnboardingLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/onboarding?job_id=${id}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setOnboardings(data);
            }
        } catch (error) {
            console.error("Error fetching onboardings:", error);
        } finally {
            setIsOnboardingLoading(false);
        }
    };

    const getOnboardingStatusColor = (status: string) => {
        switch (status) {
            case "In Progress": return "bg-blue-50 text-blue-600 border-blue-100";
            case "Awaiting Confirmation": return "bg-amber-50 text-amber-600 border-amber-100";
            case "Completed": return "bg-emerald-50 text-emerald-600 border-emerald-100";
            case "Discontinued": return "bg-rose-50 text-rose-600 border-rose-100";
            default: return "bg-[#F7F8FA] text-[#4B5563] border-[#E8EAED]";
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin material-symbols-rounded text-[#5B53E0] text-4xl">sync</div>
            </div>
        );
    }

    if (!job) {
        return (
             <div className="p-8 text-center">
                <h1 className="text-xl font-bold text-[#15171C]">Job Not Found</h1>
                <Link href="/enterprise/jobs" className="text-[#5B53E0] hover:underline mt-4 inline-block">Back to Jobs</Link>
             </div>
        );
    }

    const { metrics } = job;

    const getStatusLabel = (statusId: number) => {
        switch (statusId) {
            case 1: return "Active";
            case 2: return "Draft";
            case 3: return "Closed";
            default: return "Active";
        }
    };

    // Prepare pipeline data for the chart
    const pipelineData = (job.stages || []).map(s => {
        return {
            name: s.name,
            count: applications.filter(app => app.current_stage === s.id).length
        };
    });

    const totalCandidates = applications.length;

    // Match-score distribution (donut)
    const scoreBuckets = [
        { name: "Strong (80+)", value: applications.filter(a => (a.ai_match_score ?? 0) >= 80).length, color: "#15803D" },
        { name: "Good (60–79)", value: applications.filter(a => (a.ai_match_score ?? 0) >= 60 && (a.ai_match_score ?? 0) < 80).length, color: "#5B53E0" },
        { name: "Low (<60)", value: applications.filter(a => (a.ai_match_score ?? 0) > 0 && (a.ai_match_score ?? 0) < 60).length, color: "#D97706" },
        { name: "Unscored", value: applications.filter(a => !a.ai_match_score).length, color: "#C7CCD4" },
    ].filter(b => b.value > 0);
    const scoreTotal = scoreBuckets.reduce((s, b) => s + b.value, 0);

    // Applications over the last 14 days (area)
    const appsByDay = (() => {
        const days: { key: string; label: string; count: number }[] = [];
        const today = new Date();
        for (let i = 13; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            days.push({ key: d.toISOString().slice(0, 10), label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), count: 0 });
        }
        const byKey: Record<string, { key: string; label: string; count: number }> = Object.fromEntries(days.map(d => [d.key, d]));
        applications.forEach(a => {
            if (!a.applied_at) return;
            const k = new Date(a.applied_at).toISOString().slice(0, 10);
            if (byKey[k]) byKey[k].count += 1;
        });
        return days;
    })();
    const hasTimeData = appsByDay.some(d => d.count > 0);

    return (
        <div className="min-h-screen bg-[#F4F5F7] pb-20">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-[#E8EAED] px-6 py-[18px] flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 flex items-center justify-center rounded-[10px] border border-[#E1E4E8] text-[#4B5563] hover:bg-[#F7F8FA] transition-all shrink-0"
                    >
                        <span className="material-symbols-rounded text-xl">arrow_back</span>
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-[#9AA3AF]   mb-0.5">
                            <Link href="/enterprise/jobs" className="hover:text-[#5B53E0]">Jobs</Link>
                            <span>/</span>
                            <span>{job.id.slice(0, 8)}</span>
                        </div>
                        <h1 className="text-[20px] font-extrabold tracking-[-0.3px] text-[#15171C] flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            {job.title}
                            <span className="px-2 py-0.5 bg-[#E6F4EA] text-[#15803D] text-[10px] font-semibold rounded-full border border-[#CDEAD7] tracking-wide">
                                {getStatusLabel(job.status_id)}
                            </span>
                            {job.location && (
                                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#8A929E]">
                                    <span className="material-symbols-rounded text-[15px]">location_on</span>
                                    {job.location}
                                </span>
                            )}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="w-10 h-10 flex items-center justify-center rounded-[10px] border border-[#E1E4E8] text-[#9AA3AF] hover:text-[#5B53E0] hover:border-[#DAD7F6] transition-all">
                        <span className="material-symbols-rounded text-xl">share</span>
                    </button>
                    {canAccess("jobs:update") && (
                        <Link
                            href={`/enterprise/jobs/${id}/edit`}
                            className="h-10 px-4 flex items-center justify-center gap-1.5 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-semibold hover:bg-[#4A43C9] transition-colors shadow-[0_6px_16px_rgba(91,83,224,0.28)]"
                        >
                            <span className="material-symbols-rounded text-[16px]">edit</span>
                            {"Edit"}
                        </Link>
                    )}
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                    {[
                        { label: "Pipeline", value: metrics?.pipeline || 0, icon: "account_tree", grad: "linear-gradient(135deg,#8B7DFF,#5B53E0)", glow: "rgba(91,83,224,0.28)" },
                        { label: "Submitted", value: metrics?.submitted || 0, icon: "assignment_ind", grad: "linear-gradient(135deg,#6E8BEA,#3559C7)", glow: "rgba(53,89,199,0.25)" },
                        { label: "Interviews", value: metrics?.interviews || 0, icon: "groups", grad: "linear-gradient(135deg,#F6B65C,#D97706)", glow: "rgba(217,119,6,0.25)" },
                        { label: "Rejected", value: metrics?.rejected || 0, icon: "block", grad: "linear-gradient(135deg,#F08C8C,#E5484D)", glow: "rgba(229,72,77,0.22)" },
                        { label: "Onboarded", value: metrics?.onboarded || 0, icon: "person_add", grad: "linear-gradient(135deg,#34D399,#0E8A6E)", glow: "rgba(14,138,110,0.25)" },
                    ].map((card, i) => (
                        <div key={i} className="relative bg-white border border-[#E8EAED] rounded-[14px] p-5 overflow-hidden transition-colors hover:border-[#D4D7DC]">
                            <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: card.grad }} />
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{card.label}</span>
                                    <div className={`text-[28px] font-semibold tracking-[-1px] text-[#15171C] mt-2 ${jetbrainsMono.className}`}>{card.value}</div>
                                </div>
                                <span className="w-10 h-10 rounded-[11px] flex items-center justify-center text-white shrink-0" style={{ background: card.grad, boxShadow: `0 6px 14px ${card.glow}` }}>
                                    <span className="material-symbols-rounded text-[20px]">{card.icon}</span>
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tabs & Content */}
                <div className="space-y-6">
                    {/* Tabs Navigation */}
                    <div className="flex border-b border-[#E1E4E8] gap-8 overflow-x-auto no-scrollbar">
                        {[
                            ...STATIC_LEADING_TABS,
                            ...(job.stages || []).map(s => {
                                const dynamicCount = applications.filter(app => app.current_stage === s.id).length;
                                return { 
                                    id: s.name.toLowerCase().replace(/\s+/g, '_'), 
                                    label: s.name, 
                                    count: dynamicCount 
                                };
                            })
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-4 px-1 text-sm font-bold whitespace-nowrap transition-all relative ${
                                    activeTab === tab.id ? "text-[#5B53E0]" : "text-[#6B6F76] hover:text-[#374151]"
                                }`}
                            >
                                {tab.label}
                                {tab.count !== undefined && <span className="ml-1 text-xs">({tab.count})</span>}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5B53E0] rounded-full"></div>
                                )}
                            </button>
                        ))}
                    </div>


                    {/* Active Tab Content (Overview) */}
                    {activeTab === "overview" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Pipeline Visualization */}
                                <div className="lg:col-span-2 bg-white rounded-[14px] border border-[#E8EAED] p-6 overflow-hidden">
                                     <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-sm font-bold text-[#15171C]  tracking-tight">Recruitment Pipeline</h3>
                                            <p className="text-[10px] font-bold text-[#9AA3AF]   mt-0.5">Distribution across rounds</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F7F8FA] border border-[#E8EAED] rounded-[10px]">
                                            <span className="w-2 h-2 rounded-full bg-[#5B53E0]"></span>
                                            <span className="text-[10px] font-bold text-[#4B5563]  tracking-tight">{totalCandidates} TOTAL</span>
                                        </div>
                                    </div>

                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={pipelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EAED" />
                                                <XAxis 
                                                    dataKey="name" 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#8A929E' }} 
                                                    dy={10}
                                                />
                                                <YAxis 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#C7CCD4' }}
                                                />
                                                <RechartsTooltip 
                                                    cursor={{ fill: '#F7F8FA' }}
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div className="bg-[#15171C] border border-[#1F2127] rounded-[10px] p-3 shadow-xl">
                                                                    <p className="text-[10px] font-bold text-[#9AA3AF]   leading-none mb-1">{payload[0].payload.name}</p>
                                                                    <p className="text-xs font-bold text-white">{payload[0].value} Candidates</p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                                                    {pipelineData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#5B53E0" : "#8B7DFF"} fillOpacity={1 - (index * 0.1)} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Summary Sidebar */}
                                <div className="space-y-6">
                                    <div className="bg-white rounded-[14px] border border-[#E8EAED] p-6">
                                        <h3 className="text-xs font-bold text-[#15171C]   mb-4">Stage Efficiency</h3>
                                        <div className="space-y-4">
                                            {pipelineData.map((stage, i) => (
                                                <div key={i} className="flex flex-col gap-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-[#6B6F76]  tracking-tight">{stage.name}</span>
                                                        <span className="text-[10px] font-bold text-[#15171C] ">{Math.round((stage.count / (totalCandidates || 1)) * 100)}%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-[#F7F8FA] rounded-full overflow-hidden border border-[#E8EAED]">
                                                        <div 
                                                            className="h-full bg-[#5B53E0] transition-all duration-1000"
                                                            style={{ width: `${(stage.count / (totalCandidates || 1)) * 100}%`, opacity: 1 - (i * 0.15) }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="rounded-[14px] p-6 shadow-[0_10px_24px_rgba(91,83,224,0.3)]" style={{ background: "linear-gradient(135deg,#6E63E6,#4A43C9)" }}>
                                        <div className="w-10 h-10 rounded-[11px] bg-white/15 flex items-center justify-center text-white mb-4">
                                            <span className="material-symbols-rounded text-white">trending_up</span>
                                        </div>
                                        <h4 className="text-[15px] font-bold text-white tracking-tight">Quick Insight</h4>
                                        <p className="text-white/80 text-[11px] font-medium leading-relaxed mt-1">
                                            Most candidates are currently in the <strong>{pipelineData.length > 0 ? pipelineData.reduce((prev, current) => (prev.count > current.count) ? prev : current).name : "initial"}</strong> stage. 
                                            Consider reviewing this pipeline to speed up the hiring process.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Extra insights: match-score mix + applications over time */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Match-score distribution donut */}
                                <div className="bg-white rounded-[14px] border border-[#E8EAED] p-6">
                                    <h3 className="text-[15px] font-bold text-[#15171C]">Match-score mix</h3>
                                    <p className="text-[12.5px] text-[#8A929E] mt-0.5 mb-3">AI fit across the pipeline</p>
                                    {scoreTotal === 0 ? (
                                        <div className="flex flex-col items-center justify-center text-center py-10">
                                            <div className="w-12 h-12 rounded-[12px] bg-[#F4F5F7] text-[#8A929E] flex items-center justify-center mb-3">
                                                <span className="material-symbols-rounded text-2xl">donut_large</span>
                                            </div>
                                            <p className="text-[13px] text-[#8A929E]">No scored candidates yet</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="relative h-[170px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={scoreBuckets} dataKey="value" nameKey="name" innerRadius={54} outerRadius={78} paddingAngle={2} stroke="none">
                                                            {scoreBuckets.map((b) => <Cell key={b.name} fill={b.color} />)}
                                                        </Pie>
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                    <span className={`text-[26px] font-semibold text-[#15171C] leading-none ${jetbrainsMono.className}`}>{scoreTotal}</span>
                                                    <span className="text-[11px] text-[#8A929E] mt-1">candidates</span>
                                                </div>
                                            </div>
                                            <div className="mt-4 space-y-2">
                                                {scoreBuckets.map((b) => (
                                                    <div key={b.name} className="flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: b.color }} />
                                                        <span className="text-[12.5px] text-[#374151] flex-1">{b.name}</span>
                                                        <span className={`text-[12.5px] font-semibold text-[#15171C] ${jetbrainsMono.className}`}>{b.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Applications over time (area) */}
                                <div className="lg:col-span-2 bg-white rounded-[14px] border border-[#E8EAED] p-6">
                                    <h3 className="text-[15px] font-bold text-[#15171C]">Applications over time</h3>
                                    <p className="text-[12.5px] text-[#8A929E] mt-0.5 mb-3">New applicants · last 14 days</p>
                                    {!hasTimeData ? (
                                        <div className="flex flex-col items-center justify-center text-center py-14">
                                            <div className="w-12 h-12 rounded-[12px] bg-[#F4F5F7] text-[#8A929E] flex items-center justify-center mb-3">
                                                <span className="material-symbols-rounded text-2xl">show_chart</span>
                                            </div>
                                            <p className="text-[13px] text-[#8A929E]">No applications in this window yet</p>
                                        </div>
                                    ) : (
                                        <div className="h-[200px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={appsByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="appsArea" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#5B53E0" stopOpacity={0.28} />
                                                            <stop offset="100%" stopColor="#5B53E0" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EAED" />
                                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#8A929E' }} interval={1} dy={8} />
                                                    <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#C7CCD4' }} />
                                                    <RechartsTooltip
                                                        cursor={{ stroke: '#5B53E0', strokeWidth: 1, strokeDasharray: '4 4' }}
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                return (
                                                                    <div className="bg-[#0E1014] rounded-[10px] px-3 py-2 shadow-xl">
                                                                        <p className="text-[10px] font-semibold text-[#9AA3AF] leading-none mb-1">{payload[0].payload.label}</p>
                                                                        <p className="text-[12.5px] font-semibold text-white">{payload[0].value} applicants</p>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        }}
                                                    />
                                                    <Area type="monotone" dataKey="count" stroke="#5B53E0" strokeWidth={2.5} fill="url(#appsArea)" dot={false} activeDot={{ r: 4, fill: '#5B53E0' }} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Active Tab Content (Info) */}
                    {activeTab === "info" && (
                        <div className="bg-white rounded-[14px] border border-[#E8EAED] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-3 px-6 py-4 border-b border-[#F0F0F1]">
                                <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                                    <span className="material-symbols-rounded text-[20px]">info</span>
                                </span>
                                <div>
                                    <h3 className="text-[15px] font-bold text-[#15171C]">Job Details</h3>
                                    <p className="text-[12px] text-[#8A929E]">Requisition information</p>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {[
                                        { label: "Client Job ID", value: job.client_job_id || "—", icon: "tag" },
                                        { label: "Job ID", value: `EXAIN-${job.id.slice(0, 8).toUpperCase()}`, icon: "fingerprint" },
                                        { label: "Status", value: getStatusLabel(job.status_id), icon: "flag" },
                                        { label: "Job Title", value: job.title, icon: "work" },
                                        { label: "Customer Type", value: job.customer_type || "Internal", icon: "category" },
                                        { label: "Customer", value: job.customer || "Internal", icon: "corporate_fare" },
                                        {
                                            label: "Experience",
                                            value: job.experience_min !== undefined && job.experience_max !== undefined
                                                ? `${job.experience_min} – ${job.experience_max} Years`
                                                : job.experience_min !== undefined ? `${job.experience_min}+ Years` : "Not specified",
                                            icon: "work_history"
                                        },
                                        {
                                            label: "Salary Range",
                                            value: job.salary_min && job.salary_max
                                                ? `${job.salary_currency || "INR"} ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()} / ${job.salary_frequency || "Yearly"}`
                                                : "Not specified",
                                            icon: "payments"
                                        },
                                        { label: "Work Mode", value: job.work_mode || "On-site", icon: "home_work" },
                                    ].map((d) => (
                                        <div key={d.label} className="flex items-start gap-3 p-4 rounded-[12px] bg-[#F7F8FA] border border-[#E8EAED]">
                                            <span className="w-9 h-9 rounded-[10px] bg-white border border-[#E8EAED] text-[#5B53E0] flex items-center justify-center shrink-0">
                                                <span className="material-symbols-rounded text-[19px]">{d.icon}</span>
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9AA3AF]">{d.label}</p>
                                                <p className="text-[14px] font-semibold text-[#15171C] mt-0.5 break-words">{d.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 pt-5 border-t border-[#F0F0F1]">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9AA3AF] mb-3">Required Skills</p>
                                    <div className="flex flex-wrap gap-2">
                                        {job.required_skills?.map((skill, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-[#ECEBFB] text-[#5B53E0] text-[12px] font-medium rounded-[8px]">
                                                {skill.trim()}
                                            </span>
                                        ))}
                                        {(!job.required_skills || job.required_skills.length === 0) && (
                                            <span className="text-[13px] text-[#9AA3AF]">No skills specified</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Onboarding Tab Content */}
                    {activeTab === "onboarding_tab" && (
                        <div className="bg-white rounded-[10px] border border-[#E1E4E8] shadow-sm overflow-hidden min-h-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="px-6 py-4 border-b border-[#E8EAED] flex items-center justify-between">
                                <h3 className="text-xs font-bold text-[#15171C]  ">Onboarding Candidates</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#F7F8FA]/50">
                                            <th className="px-6 py-3 text-[10px] font-bold text-[#9AA3AF]  ">Code</th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-[#9AA3AF]  ">Candidate</th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-[#9AA3AF]   text-center">Status</th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-[#9AA3AF]   text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E8EAED]">
                                        {onboardings.map((ob) => (
                                            <tr key={ob.id} className="hover:bg-[#F7F8FA]/50 transition-colors group cursor-pointer" onClick={() => router.push(`/enterprise/onboarding/${ob.id}`)}>
                                                <td className="px-6 py-4">
                                                    <span className="text-[10px] font-bold text-[#5B53E0] bg-[#ECEBFB] px-2 py-1 rounded ">
                                                        {ob.onboarding_code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-[#E8EAED] text-[#9AA3AF] flex items-center justify-center font-bold text-xs ">
                                                            {ob.application?.candidate?.full_name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-[#15171C] leading-tight">
                                                                {ob.application?.candidate?.full_name}
                                                            </p>
                                                            <p className="text-[10px] font-bold text-[#9AA3AF]">
                                                                {ob.application?.candidate?.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {ob.status && (
                                                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full border  tracking-tight ${getOnboardingStatusColor(ob.status.name)}`}>
                                                            {ob.status.name}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="h-7 px-3 rounded-[10px] bg-[#E8EAED] text-[#6B6F76] text-[9px] font-bold   hover:bg-[#E1E4E8] transition-all">
                                                        Track
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {onboardings.length === 0 && !isOnboardingLoading && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="w-12 h-12 rounded-full bg-[#F7F8FA] flex items-center justify-center text-[#D4D7DC]">
                                                            <span className="material-symbols-rounded text-2xl">person_add</span>
                                                        </div>
                                                        <p className="text-xs font-bold text-[#9AA3AF]">No onboarding processes for this job yet.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Candidate List Content (for stage tabs) */}
                    {!STATIC_LEADING_TABS.some(t => t.id === activeTab) && (
                        <div className="bg-white rounded-[10px] border border-[#E1E4E8] shadow-sm overflow-hidden min-h-[400px]">
                            <div className="px-6 py-4 border-b border-[#E8EAED] flex items-center justify-between">
                                <h3 className="text-xs font-bold text-[#15171C]  ">Candidates</h3>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA3AF] text-sm">search</span>
                                        <input type="text" placeholder="Search..." className="pl-9 pr-4 py-1.5 bg-[#F7F8FA] border-none rounded-[10px] text-xs font-medium focus:ring-1 focus:ring-[#5B53E0] w-48" />
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-[#F7F8FA]/50">
                                            <th className="px-6 py-3 text-[10px] font-bold text-[#9AA3AF]  ">Candidate</th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-[#9AA3AF]   text-center">Match Score</th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-[#9AA3AF]  ">Status</th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-[#9AA3AF]  ">Applied</th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-[#9AA3AF]  "></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E8EAED]">
                                        {applications
                                            .filter(app => {
                                                const stage = job.stages?.find(s => s.name.toLowerCase().replace(/\s+/g, '_') === activeTab);
                                                return stage ? app.current_stage === stage.id : false;
                                            })
                                            .map((app) => (
                                                <tr key={app.id} className="hover:bg-[#F7F8FA]/50 transition-colors group cursor-pointer">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-[#DAD7F6] text-[#5B53E0] flex items-center justify-center font-bold text-xs">
                                                                {app.candidate?.full_name?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-[#15171C]">{app.candidate?.full_name}</p>
                                                                <p className="text-[10px] font-bold text-[#9AA3AF]">{app.candidate?.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col items-center">
                                                            <div className={`text-xs font-bold ${
                                                                (app.ai_match_score || 0) > 80 ? "text-emerald-600" : 
                                                                (app.ai_match_score || 0) > 60 ? "text-[#5B53E0]" : "text-[#6B6F76]"
                                                            }`}>
                                                                {app.ai_match_score ? `${Math.round(app.ai_match_score)}%` : "-"}
                                                            </div>
                                                            <div className="w-16 h-1 bg-[#E8EAED] rounded-full mt-1 overflow-hidden">
                                                                <div 
                                                                    className={`h-full rounded-full ${
                                                                        (app.ai_match_score || 0) > 80 ? "bg-emerald-500" : 
                                                                        (app.ai_match_score || 0) > 60 ? "bg-[#5B53E0]" : "bg-[#D4D7DC]"
                                                                    }`}
                                                                    style={{ width: `${app.ai_match_score || 0}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-0.5 bg-[#ECEBFB] text-[#5B53E0] text-[10px] font-bold rounded-[10px] border border-[#DAD7F6]  tracking-wide">
                                                            In Progress
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-[10px] font-bold text-[#6B6F76] ">
                                                        {new Date(app.applied_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="text-[#D4D7DC] hover:text-[#5B53E0] transition-colors">
                                                            <span className="material-symbols-rounded text-lg">arrow_forward</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        {applications.filter(app => {
                                            const stage = job.stages?.find(s => s.name.toLowerCase().replace(/\s+/g, '_') === activeTab);
                                            return stage ? app.current_stage === stage.id : false;
                                        }).length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="w-12 h-12 rounded-full bg-[#F7F8FA] flex items-center justify-center text-[#D4D7DC]">
                                                            <span className="material-symbols-rounded text-2xl">person_search</span>
                                                        </div>
                                                        <p className="text-xs font-bold text-[#9AA3AF]">No candidates found in this stage.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions Removed */}
            </div>
        </div>
    );
}
