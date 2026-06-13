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
    Cell
} from 'recharts';

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
            default: return "bg-slate-50 text-slate-600 border-slate-100";
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin material-symbols-rounded text-indigo-600 text-4xl">sync</div>
            </div>
        );
    }

    if (!job) {
        return (
             <div className="p-8 text-center">
                <h1 className="text-xl font-bold text-slate-900">Job Not Found</h1>
                <Link href="/enterprise/jobs" className="text-indigo-600 hover:underline mt-4 inline-block">Back to Jobs</Link>
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

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                    >
                        <span className="material-symbols-rounded text-xl">arrow_back</span>
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400   mb-0.5">
                            <Link href="/enterprise/jobs" className="hover:text-indigo-600">Jobs</Link>
                            <span>/</span>
                            <span>{job.id.slice(0, 8)}</span>
                        </div>
                        <h1 className="text-sm font-black text-slate-900 flex items-center gap-2">
                            {job.title}
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-xl border border-emerald-100  tracking-wide">
                                {getStatusLabel(job.status_id)}
                            </span>
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
                        <span className="material-symbols-rounded text-xl">share</span>
                    </button>
                    {canAccess("jobs:update") && (
                        <Link 
                            href={`/enterprise/jobs/${id}/edit`}
                            className="px-4 py-1.5 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-white text-[11px] font-black hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100"
                        >
                            <span className="material-symbols-rounded text-[14px]">edit</span>
                            Edit
                        </Link>
                    )}
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Header Stats Info */}
                <div className="flex flex-wrap items-end justify-between gap-6 pb-2">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{job.title}</h2>
                        <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs  tracking-tight">
                            <span className="material-symbols-rounded text-sm">location_on</span>
                            {job.location}
                        </div>
                    </div>
                    
                    <div></div>
                </div>

                {/* Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {[
                        { label: "PIPELINE", value: metrics?.pipeline || 0, icon: "account_tree", color: "text-[#7C3AED]", bg: "bg-[#7C3AED]/5" },
                        { label: "SUBMITTED", value: metrics?.submitted || 0, icon: "assignment_ind", color: "text-pink-500", bg: "bg-pink-50" },
                        { label: "INTERVIEWS", value: metrics?.interviews || 0, icon: "groups", color: "text-purple-400", bg: "bg-purple-50" },
                        { label: "REJECTED", value: metrics?.rejected || 0, icon: "block", color: "text-slate-400", bg: "bg-slate-100" },
                        { label: "ONBOARDED", value: metrics?.onboarded || 0, icon: "person_add", color: "text-fuchsia-400", bg: "bg-fuchsia-50" },
                    ].map((card, i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-slate-400  transition-colors group-hover:text-slate-600">{card.label}</span>
                                <div className={`w-8 h-8 rounded-xl ${card.bg} flex items-center justify-center ${card.color}`}>
                                    <span className="material-symbols-rounded text-lg">{card.icon}</span>
                                </div>
                            </div>
                            <div className="text-2xl font-black text-slate-900">{card.value}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs & Content */}
                <div className="space-y-6">
                    {/* Tabs Navigation */}
                    <div className="flex border-b border-slate-200 gap-8 overflow-x-auto no-scrollbar">
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
                                    activeTab === tab.id ? "text-[#7C3AED]" : "text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                {tab.label}
                                {tab.count !== undefined && <span className="ml-1 text-xs">({tab.count})</span>}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C3AED] rounded-full"></div>
                                )}
                            </button>
                        ))}
                    </div>


                    {/* Active Tab Content (Overview) */}
                    {activeTab === "overview" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Pipeline Visualization */}
                                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden">
                                     <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900  tracking-tight">Recruitment Pipeline</h3>
                                            <p className="text-[10px] font-bold text-slate-400   mt-0.5">Distribution across rounds</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-xl">
                                            <span className="w-2 h-2 rounded-full bg-[#7C3AED]"></span>
                                            <span className="text-[10px] font-black text-slate-600  tracking-tight">{totalCandidates} TOTAL</span>
                                        </div>
                                    </div>

                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={pipelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis 
                                                    dataKey="name" 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                                                    dy={10}
                                                />
                                                <YAxis 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#cbd5e1' }}
                                                />
                                                <RechartsTooltip 
                                                    cursor={{ fill: '#f8fafc' }}
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xl">
                                                                    <p className="text-[10px] font-black text-slate-400   leading-none mb-1">{payload[0].payload.name}</p>
                                                                    <p className="text-xs font-black text-white">{payload[0].value} Candidates</p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                                                    {pipelineData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#7C3AED" : "#A78BFA"} fillOpacity={1 - (index * 0.1)} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Summary Sidebar */}
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                        <h3 className="text-xs font-black text-slate-900   mb-4">Stage Efficiency</h3>
                                        <div className="space-y-4">
                                            {pipelineData.map((stage, i) => (
                                                <div key={i} className="flex flex-col gap-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-slate-500  tracking-tight">{stage.name}</span>
                                                        <span className="text-[10px] font-black text-slate-900 ">{Math.round((stage.count / (totalCandidates || 1)) * 100)}%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                        <div 
                                                            className="h-full bg-[#7C3AED] transition-all duration-1000"
                                                            style={{ width: `${(stage.count / (totalCandidates || 1)) * 100}%`, opacity: 1 - (i * 0.15) }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-[#7C3AED] rounded-xl p-6 shadow-lg shadow-indigo-200">
                                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white mb-4">
                                            <span className="material-symbols-rounded text-white">trending_up</span>
                                        </div>
                                        <h4 className="text-sm font-black text-white  tracking-tight">Quick Insight</h4>
                                        <p className="text-white/80 text-[11px] font-medium leading-relaxed mt-1">
                                            Most candidates are currently in the <strong>{pipelineData.length > 0 ? pipelineData.reduce((prev, current) => (prev.count > current.count) ? prev : current).name : "initial"}</strong> stage. 
                                            Consider reviewing this pipeline to speed up the hiring process.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Active Tab Content (Info) */}
                    {activeTab === "info" && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <button className="w-full px-6 py-4 flex items-center justify-between bg-slate-50/50 border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                                <h3 className="text-sm font-black text-slate-900  tracking-tight">Job Details</h3>
                                <span className="material-symbols-rounded text-slate-400 group-hover:text-slate-600">expand_more</span>
                            </button>
                            
                            <div className="p-10">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12 gap-x-12">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400  ">Client Job ID</p>
                                        <p className="text-xs font-bold text-slate-800">{job.client_job_id || "-"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400  ">Job ID</p>
                                        <p className="text-xs font-bold text-slate-800">EXAIN-{job.id.slice(0, 8).toUpperCase()}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400  ">Status</p>
                                        <p className="text-xs font-bold text-slate-800">{getStatusLabel(job.status_id)}</p>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400  ">Job Title</p>
                                        <p className="text-xs font-bold text-slate-800">{job.title}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400  ">Customer Type</p>
                                        <p className="text-xs font-bold text-slate-800">{job.customer_type || "Internal"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400  ">Customer</p>
                                        <p className="text-xs font-bold text-slate-800">{job.customer || "Internal"}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400  ">Experience</p>
                                        <p className="text-xs font-bold text-slate-800">
                                            {job.experience_min !== undefined && job.experience_max !== undefined 
                                                ? `${job.experience_min} - ${job.experience_max} Years`
                                                : job.experience_min !== undefined ? `${job.experience_min}+ Years` : "Not Specified"}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400  ">Salary Range</p>
                                        <p className="text-xs font-bold text-slate-800">
                                            {job.salary_min && job.salary_max 
                                                ? `${job.salary_currency || "INR"} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} / ${job.salary_frequency || "Yearly"}`
                                                : "Not Specified"}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400  ">Work Mode</p>
                                        <p className="text-xs font-bold text-slate-800">{job.work_mode || "On-site"}</p>
                                    </div>

                                    <div className="space-y-1 md:col-span-3">
                                        <p className="text-[10px] font-black text-slate-400  ">Required Skills</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {job.required_skills?.map((skill, i) => (
                                                <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-xl  tracking-tight">
                                                    {skill.trim()}
                                                </span>
                                            ))}
                                            {(!job.required_skills || job.required_skills.length === 0) && (
                                                <span className="text-xs font-bold text-slate-400 ">No skills specified</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Onboarding Tab Content */}
                    {activeTab === "onboarding_tab" && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xs font-black text-slate-900  ">Onboarding Candidates</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-6 py-3 text-[10px] font-black text-slate-400  ">Code</th>
                                            <th className="px-6 py-3 text-[10px] font-black text-slate-400  ">Candidate</th>
                                            <th className="px-6 py-3 text-[10px] font-black text-slate-400   text-center">Status</th>
                                            <th className="px-6 py-3 text-[10px] font-black text-slate-400   text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {onboardings.map((ob) => (
                                            <tr key={ob.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => router.push(`/enterprise/onboarding/${ob.id}`)}>
                                                <td className="px-6 py-4">
                                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded ">
                                                        {ob.onboarding_code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs ">
                                                            {ob.application?.candidate?.full_name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-slate-900 leading-tight">
                                                                {ob.application?.candidate?.full_name}
                                                            </p>
                                                            <p className="text-[10px] font-bold text-slate-400">
                                                                {ob.application?.candidate?.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {ob.status && (
                                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full border  tracking-tighter ${getOnboardingStatusColor(ob.status.name)}`}>
                                                            {ob.status.name}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="h-7 px-3 rounded-xl bg-slate-100 text-slate-500 text-[9px] font-black   hover:bg-slate-200 transition-all">
                                                        Track
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {onboardings.length === 0 && !isOnboardingLoading && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                                                            <span className="material-symbols-rounded text-2xl">person_add</span>
                                                        </div>
                                                        <p className="text-xs font-bold text-slate-400">No onboarding processes for this job yet.</p>
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
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xs font-black text-slate-900  ">Candidates</h3>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                                        <input type="text" placeholder="Search..." className="pl-9 pr-4 py-1.5 bg-slate-50 border-none rounded-xl text-xs font-medium focus:ring-1 focus:ring-indigo-500 w-48" />
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-6 py-3 text-[10px] font-black text-slate-400  ">Candidate</th>
                                            <th className="px-6 py-3 text-[10px] font-black text-slate-400   text-center">Match Score</th>
                                            <th className="px-6 py-3 text-[10px] font-black text-slate-400  ">Status</th>
                                            <th className="px-6 py-3 text-[10px] font-black text-slate-400  ">Applied</th>
                                            <th className="px-6 py-3 text-[10px] font-black text-slate-400  "></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {applications
                                            .filter(app => {
                                                const stage = job.stages?.find(s => s.name.toLowerCase().replace(/\s+/g, '_') === activeTab);
                                                return stage ? app.current_stage === stage.id : false;
                                            })
                                            .map((app) => (
                                                <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                                {app.candidate?.full_name?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black text-slate-900">{app.candidate?.full_name}</p>
                                                                <p className="text-[10px] font-bold text-slate-400">{app.candidate?.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col items-center">
                                                            <div className={`text-xs font-black ${
                                                                (app.ai_match_score || 0) > 80 ? "text-emerald-600" : 
                                                                (app.ai_match_score || 0) > 60 ? "text-indigo-600" : "text-slate-500"
                                                            }`}>
                                                                {app.ai_match_score ? `${Math.round(app.ai_match_score)}%` : "-"}
                                                            </div>
                                                            <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                                <div 
                                                                    className={`h-full rounded-full ${
                                                                        (app.ai_match_score || 0) > 80 ? "bg-emerald-500" : 
                                                                        (app.ai_match_score || 0) > 60 ? "bg-indigo-500" : "bg-slate-300"
                                                                    }`}
                                                                    style={{ width: `${app.ai_match_score || 0}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-xl border border-indigo-100  tracking-wide">
                                                            In Progress
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-[10px] font-bold text-slate-500 ">
                                                        {new Date(app.applied_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="text-slate-300 hover:text-indigo-600 transition-colors">
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
                                                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                                                            <span className="material-symbols-rounded text-2xl">person_search</span>
                                                        </div>
                                                        <p className="text-xs font-bold text-slate-400">No candidates found in this stage.</p>
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
