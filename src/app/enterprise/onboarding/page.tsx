"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

interface OnboardingStatus {
    id: number;
    name: string;
    description?: string;
}

interface Onboarding {
    id: string;
    onboarding_code: string;
    status_id: number;
    status?: OnboardingStatus;
    initiation_date: string;
    completed_at?: string;
    candidate_email?: string;
    job_title?: string;
    application?: any;
}

const getStatusColor = (statusName: string) => {
    switch (statusName) {
        case "In Progress": return "bg-blue-50 text-blue-700 border-blue-200";
        case "Awaiting Confirmation": return "bg-amber-50 text-amber-700 border-amber-200";
        case "Completed": return "bg-emerald-50 text-emerald-700 border-emerald-200";
        case "Discontinued": return "bg-slate-50 text-slate-700 border-slate-200";
        case "Washed Away": return "bg-rose-50 text-rose-700 border-rose-200";
        case "Pending Approvals": return "bg-purple-50 text-purple-700 border-purple-200";
        default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
};

export default function OnboardingDashboard() {
    const { token } = useAuth();
    const router = useRouter();
    const [onboardings, setOnboardings] = useState<Onboarding[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedJobId, setSelectedJobId] = useState<string>("all");

    useEffect(() => {
        if (token) {
            fetchOnboardings();
            fetchJobs();
        }
    }, [token]);

    const fetchJobs = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setJobs(data);
            }
        } catch (error) {
            console.error("Error fetching jobs:", error);
        }
    };

    const fetchOnboardings = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/onboarding/`, {
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
            setIsLoading(false);
        }
    };

    const filteredOnboardings = useMemo(() => {
        return onboardings.filter(o => {
            const matchesSearch = o.onboarding_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (o.application?.candidate?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesJob = selectedJobId === "all" || o.application?.job_requirement_id === selectedJobId;
            
            return matchesSearch && matchesJob;
        });
    }, [onboardings, searchQuery, selectedJobId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-8 font-sans">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Onboarding Hub</h1>
                    <p className="text-sm text-slate-500 font-medium">Manage and track candidate onboarding processes.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter by JD:</span>
                        <select 
                            value={selectedJobId}
                            onChange={(e) => setSelectedJobId(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl py-2 px-4 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                        >
                            <option value="all">All Jobs</option>
                            {jobs.map(job => (
                                <option key={job.id} value={job.id}>{job.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative group">
                        <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-indigo-500 transition-colors">search</span>
                        <input
                            type="text"
                            placeholder="Search by code or name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none w-64"
                        />
                    </div>
                    <button 
                        onClick={fetchOnboardings}
                        className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                    >
                        <span className="material-icons-outlined text-lg">refresh</span>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredOnboardings.map((ob, i) => (
                        <motion.div 
                            key={ob.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => router.push(`/enterprise/onboarding/${ob.id}`)}
                            className="group bg-white p-6 rounded-[32px] border border-slate-100 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all cursor-pointer flex flex-col h-full relative overflow-hidden"
                        >
                            {/* Decorative Background Element */}
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50/50 rounded-full blur-2xl group-hover:bg-indigo-100/50 transition-colors" />
                            
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm border border-indigo-100/50">
                                    <span className="material-icons-outlined text-xl">person_outline</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-wider mb-2 border border-indigo-100/50">
                                        {ob.onboarding_code}
                                    </span>
                                    {ob.status && (
                                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-tighter ${getStatusColor(ob.status.name)}`}>
                                            {ob.status.name}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="mb-6 relative z-10">
                                <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                                    {ob.application?.candidate?.full_name || "Unknown Candidate"}
                                </h3>
                                <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-tight">
                                    {ob.candidate_email || "No email assigned"}
                                </p>
                            </div>

                            <div className="bg-slate-50/80 rounded-[20px] p-4 mb-6 border border-slate-100/50 group-hover:bg-white transition-colors relative z-10">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                                        <span className="material-icons-outlined text-indigo-500 text-sm">work_outline</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight leading-none">
                                            {ob.job_title || "Unspecified Role"}
                                        </span>
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Designation</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                                        <span className="material-icons-outlined text-indigo-500 text-sm">calendar_today</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-black text-slate-800 leading-none">
                                            {format(new Date(ob.initiation_date), "MMM dd, yyyy")}
                                        </span>
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Initiated On</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between relative z-10">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map((_, i) => (
                                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">
                                            {i + 1}
                                        </div>
                                    ))}
                                    <div className="w-6 h-6 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[8px] font-black text-indigo-400">
                                        +
                                    </div>
                                </div>
                                <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 group/btn hover:gap-2 transition-all">
                                    View Full Details
                                    <span className="material-icons-outlined text-xs group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            {filteredOnboardings.length === 0 && !isLoading && (
                <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-[40px] border-4 border-dashed border-slate-100 mt-8">
                    <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-3xl flex items-center justify-center mb-6">
                        <span className="material-icons-outlined text-4xl">fact_check</span>
                    </div>
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">No active processes</h4>
                    <p className="text-[10px] text-slate-400 font-bold max-w-[240px] uppercase tracking-widest leading-relaxed mt-2">Adjust your filters or initiate new onboardings from the candidates list.</p>
                </div>
            )}
        </div>
    );
}
