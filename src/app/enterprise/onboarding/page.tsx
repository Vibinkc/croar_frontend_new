"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { 
    Briefcase, 
    Calendar, 
    Search, 
    RefreshCcw, 
    ChevronRight,
    Activity,
    UserCircle,
    ClipboardList
} from "lucide-react";
import { jetbrainsMono, PageHelp } from "@/components/ds";

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    application?: any;
}

const getStatusColor = (statusName: string) => {
    switch (statusName) {
        case "In Progress": 
            return "bg-[#ECEBFB] text-[#5B53E0] border-[#DAD7F6]/80";
        case "Awaiting Confirmation": 
            return "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]/80";
        case "Completed": 
            return "bg-[#E3F4EF] text-[#0E8A6E] border-[#BFF0E2]/80";
        case "Discontinued": 
            return "bg-slate-100 text-[#6B6F76] border-[#E8EAED]";
        case "Washed Away": 
            return "bg-rose-50 text-rose-600 border-rose-100";
        case "Pending Approvals": 
            return "bg-[#F5F3FF] text-[#8B5CF6] border-[#EBE7FF]/80";
        default: 
            return "bg-slate-100 text-[#6B6F76] border-[#E8EAED]";
    }
};

// date-fns format() throws RangeError on an Invalid Date; guard before formatting.
const safeFormat = (value: string | null | undefined, pattern: string): string => {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "—" : format(d, pattern);
};

export default function OnboardingDashboard() {
    const { token } = useAuth();
    const router = useRouter();
    const [onboardings, setOnboardings] = useState<Onboarding[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                setJobs(Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []));
            }
        } catch (error) {
            console.error("Error fetching jobs:", error);
        }
    };

    const fetchOnboardings = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/onboarding/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOnboardings(Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []));
            }
        } catch (error) {
            console.error("Error fetching onboardings:", error);
        } finally {
            setTimeout(() => setIsLoading(false), 500);
        }
    };

    const filteredOnboardings = useMemo(() => {
        return onboardings.filter(o => {
            const candidateName = o.application?.candidate?.full_name || "Unknown Candidate";
            const matchesSearch = o.onboarding_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (o.candidate_email || "").toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesJob = selectedJobId === "all" || o.application?.job_requirement_id === selectedJobId;
            
            return matchesSearch && matchesJob;
        });
    }, [onboardings, searchQuery, selectedJobId]);

    if (isLoading) {
        return (
            <div className="px-4 sm:px-5 pb-20 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
                <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="w-40 h-6 bg-[#E8EAED] rounded-[8px] animate-pulse" />
                        <div className="w-60 h-4 bg-[#E8EAED] rounded-[6px] animate-pulse" />
                    </div>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white h-72 rounded-[14px] border border-[#E8EAED] animate-pulse shadow-sm" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-5 pb-20 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 relative">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">Onboarding Hub</h1>
                        <PageHelp title="Onboarding Hub">
                            <p>Run onboarding for new hires, then convert them into employees.</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#8A929E] mt-0.5">Manage new hire integration, workflows, and checklist progress.</p>
                </div>
            </header>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 relative group w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA3AF] w-4 h-4 group-focus-within:text-[#5B53E0] transition-colors" />
                    <input
                        type="text"
                        placeholder="Search candidate name or onboarding code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-white border border-[#E1E4E8] rounded-[10px] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15 transition-all text-[13.5px] text-[#15171C] placeholder:text-[#9AA3AF]"
                    />
                </div>

                <div className="flex items-center gap-2 bg-white border border-[#E1E4E8] px-3 h-10 rounded-[10px] shadow-sm shrink-0 w-full sm:w-auto">
                    <span className="material-symbols-rounded text-[#9AA3AF] text-[20px]">filter_list</span>
                    <select 
                        value={selectedJobId}
                        onChange={(e) => setSelectedJobId(e.target.value)}
                        className="bg-transparent text-[12.5px] font-bold text-[#374151] outline-none pr-2 cursor-pointer flex-1 sm:flex-initial"
                    >
                        <option value="all">All Pipelines</option>
                        {jobs.map(job => (
                            <option key={job.id} value={job.id}>{job.title}</option>
                        ))}
                    </select>
                </div>

                <button 
                    onClick={fetchOnboardings}
                    className="w-10 h-10 bg-white border border-[#E1E4E8] rounded-[10px] text-[#6B6F76] hover:text-[#374151] hover:bg-[#F4F5F7] transition-all flex items-center justify-center shadow-sm shrink-0"
                >
                    <RefreshCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Hub List Grid */}
            {filteredOnboardings.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredOnboardings.map((ob) => {
                            const candidateName = ob.application?.candidate?.full_name || "Unknown Candidate";
                            return (
                                <motion.div 
                                    layout
                                    key={ob.id}
                                    className="group bg-white border border-[#E8EAED] hover:border-[#5B53E0]/40 rounded-[14px] p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                                    onClick={() => router.push(`/enterprise/onboarding/${ob.id}`)}
                                >
                                    <div className="space-y-5">
                                        <div className="flex justify-between items-start">
                                            {/* Initials Avatar */}
                                            <div className="w-11 h-11 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center font-extrabold border border-[#DAD7F6]/60 shadow-sm text-[12.5px] uppercase transition-all shrink-0">
                                                {candidateName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5 text-right">
                                                <span className={`text-[10px] font-bold text-[#5B53E0] bg-[#ECEBFB] border border-[#DAD7F6]/60 px-2 py-0.5 rounded-[6px] ${jetbrainsMono.className}`}>
                                                    {ob.onboarding_code}
                                                </span>
                                                {ob.status && (
                                                    <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-[6px] border ${getStatusColor(ob.status.name)}`}>
                                                        {ob.status.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-0.5">
                                            <h3 className="text-[16px] font-bold text-[#15171C] group-hover:text-[#5B53E0] transition-colors truncate">
                                                {candidateName}
                                            </h3>
                                            <p className="text-[12.5px] text-[#6B6F76] font-medium truncate">
                                                {ob.candidate_email}
                                            </p>
                                        </div>

                                        {/* nested details container */}
                                        <div className="bg-[#F8F9FA] rounded-[10px] p-3.5 space-y-3.5 border border-[#E8EAED] group-hover:border-[#5B53E0]/15 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-[8px] bg-white border border-[#E8EAED] flex items-center justify-center shadow-sm shrink-0">
                                                    <Briefcase className="w-4 h-4 text-[#5B53E0]" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[12px] font-bold text-[#15171C] truncate leading-tight">
                                                        {ob.job_title || "Unspecified Role"}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-[#8A929E] uppercase tracking-wider mt-0.5 leading-none">Hired Role</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-[8px] bg-white border border-[#E8EAED] flex items-center justify-center shadow-sm shrink-0">
                                                    <Calendar className="w-4 h-4 text-emerald-500" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[12px] font-bold text-[#15171C] leading-tight">
                                                        {safeFormat(ob.initiation_date, "MMM dd, yyyy")}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-[#8A929E] uppercase tracking-wider mt-0.5 leading-none">Start Date</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="flex items-center justify-between pt-3.5 border-t border-[#E8EAED] mt-5">
                                        <div className="flex items-center gap-1.5 text-[#8A929E] text-[10.5px] font-semibold uppercase tracking-wider">
                                            <Activity className="w-3.5 h-3.5" />
                                            <span>Active Cycle</span>
                                        </div>
                                        <div className="text-[#5B53E0] group-hover:text-[#4A43C9] transition-all flex items-center gap-1 text-[13px] font-bold">
                                            <span>View details</span>
                                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
            
            {/* Empty State */}
            {filteredOnboardings.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-[14px] border border-dashed border-[#E8EAED] shadow-sm w-full">
                    <div className="relative mb-5">
                        <div className="absolute -inset-3 rounded-full bg-[#5B53E0]/10 blur-xl" />
                        <div className="relative w-14 h-14 rounded-[16px] flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#8B7DFF,#5B53E0)", boxShadow: "0 8px 24px rgba(91,83,224,0.3)" }}>
                            <ClipboardList className="w-6 h-6" />
                        </div>
                    </div>
                    <h4 className="text-[16px] font-bold text-[#15171C] mb-1">No Onboarding Records</h4>
                    <p className="text-[13px] text-[#8A929E] font-medium max-w-[280px] leading-relaxed mb-5">Candidate records will appear here once they begin the onboarding process.</p>
                    <button 
                        onClick={() => { setSearchQuery(""); setSelectedJobId("all"); }} 
                        className="px-5 h-9 bg-[#5B53E0] hover:bg-[#4A43C9] text-white rounded-[10px] font-semibold text-[13px] shadow-[0_4px_12px_rgba(91,83,224,0.2)] transition-all"
                    >
                        Reset Filters
                    </button>
                </div>
            )}
        </div>
    );
}
