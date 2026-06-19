"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { 
    User, 
    Briefcase, 
    Calendar, 
    ArrowRight, 
    Search, 
    RefreshCcw, 
    ChevronRight,
    Users,
    Activity,
    ShieldCheck,
    AlertCircle,
    UserCircle,
    ClipboardList
} from "lucide-react";

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
        case "In Progress": return "bg-indigo-50 text-indigo-700 border-indigo-200";
        case "Awaiting Confirmation": return "bg-amber-50 text-amber-700 border-amber-200";
        case "Completed": return "bg-emerald-50 text-emerald-700 border-emerald-200";
        case "Discontinued": return "bg-slate-50 text-slate-700 border-slate-200";
        case "Washed Away": return "bg-rose-50 text-rose-700 border-rose-200";
        case "Pending Approvals": return "bg-purple-50 text-purple-700 border-purple-200";
        default: return "bg-slate-50 text-slate-700 border-slate-200";
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
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOnboardings(data);
            }
        } catch (error) {
            console.error("Error fetching onboardings:", error);
        } finally {
            setTimeout(() => setIsLoading(false), 800);
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
            <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
                <div className="h-32 bg-slate-900 rounded-2xl relative overflow-hidden flex items-center px-10 shadow-2xl">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/5 rounded-xl animate-pulse" />
                        <div className="space-y-2">
                            <div className="w-48 h-6 bg-white/10 rounded-xl animate-pulse" />
                            <div className="w-32 h-3 bg-white/5 rounded-xl animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white h-80 rounded-2xl border border-slate-100 animate-pulse shadow-sm" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-5 max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-700 relative">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl border border-slate-100 p-2 shadow-lg shadow-slate-200/20">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-9 h-9 bg-violet-50 text-[#7C3AED] rounded-xl flex items-center justify-center">
                        <span className="material-symbols-rounded">person_add</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 tracking-tight">Onboarding Hub</h1>
                        <p className="text-slate-500 text-[10px] font-medium   ">Talent integration and workflows</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex bg-slate-50 border border-slate-100 rounded-xl p-1 shrink-0">
                        <select 
                            value={selectedJobId}
                            onChange={(e) => setSelectedJobId(e.target.value)}
                            className="bg-transparent border-none py-1.5 px-3 text-[10px] font-bold text-slate-600   outline-none cursor-pointer appearance-none min-w-[120px]"
                        >
                            <option value="all">All Pipelines</option>
                            {jobs.map(job => (
                                <option key={job.id} value={job.id}>{job.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative group shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 group-focus-within:text-[#7C3AED] transition-colors" />
                        <input
                            type="text"
                            placeholder="Find candidate..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-4 text-[11px] font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#7C3AED] transition-all w-full sm:w-40"
                        />
                    </div>

                    <button 
                        onClick={fetchOnboardings}
                        className="w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-[#7C3AED] hover:bg-slate-50 hover:border-violet-100 transition-all flex items-center justify-center shadow-sm"
                    >
                        <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Hub List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                    {filteredOnboardings.map((ob, i) => (
                        <motion.div 
                            layout
                            key={ob.id}
                            className="group bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden cursor-pointer"
                            onClick={() => router.push(`/enterprise/onboarding/${ob.id}`)}
                        >
                            <div className="p-6 pb-2 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                        <User className="w-6 h-6 stroke-[1.5]" />
                                    </div>
                                    <div className="flex flex-col items-end gap-2 text-right">
                                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-xl  ">
                                            {ob.onboarding_code}
                                        </span>
                                        {ob.status && (
                                            <span className={`text-[9px] font-bold px-3 py-1 rounded-full border   ${getStatusColor(ob.status.name)}`}>
                                                {ob.status.name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                                        {ob.application?.candidate?.full_name || "Unknown Candidate"}
                                    </h3>
                                    <p className="text-sm text-slate-400 font-medium truncate">
                                        {ob.candidate_email}
                                    </p>
                                </div>

                                <div className="bg-slate-50/50 rounded-xl p-4 space-y-4 border border-slate-100/50 group-hover:bg-indigo-50/30 group-hover:border-indigo-100/50 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                                            <Briefcase className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[140px]">
                                                {ob.job_title || "Unspecified Role"}
                                            </p>
                                            <p className="text-[9px] font-bold text-slate-400   mt-1">Hired Role</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                                            <Calendar className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800 leading-none">
                                                {safeFormat(ob.initiation_date, "MMM dd, yyyy")}
                                            </p>
                                            <p className="text-[9px] font-bold text-slate-400   mt-1">Start Date</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="px-6 py-4 flex items-center justify-between bg-slate-50/50 border-t border-slate-100/50 rounded-b-3xl">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Activity className="w-4 h-4" />
                                    <span className="text-[10px] font-bold  ">Active Cycle</span>
                                </div>
                                <div className="text-indigo-400 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5 translate-x-1 group-hover:translate-x-0">
                                    <span className="text-[10px] font-bold  ">Details</span>
                                    <ArrowRight className="w-4 h-4 text-indigo-500" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            
            {filteredOnboardings.length === 0 && (
                <div className="py-32 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-xl flex items-center justify-center mb-6">
                        <ClipboardList className="w-10 h-10" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900">No Onboarding Records</h4>
                    <p className="text-sm text-slate-400 font-medium max-w-[280px] mt-2 leading-relaxed">Candidate records will appear here once they begin the onboarding process.</p>
                </div>
            )}
        </div>
    );
}
