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
    AlertCircle
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
    application?: any;
}

const getStatusColor = (statusName: string) => {
    switch (statusName) {
        case "In Progress": return "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-[0_0_8px_rgba(99,102,241,0.2)]";
        case "Awaiting Confirmation": return "bg-amber-50 text-amber-700 border-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.2)]";
        case "Completed": return "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.2)]";
        case "Discontinued": return "bg-slate-50 text-slate-700 border-slate-200 shadow-sm";
        case "Washed Away": return "bg-rose-50 text-rose-700 border-rose-200 shadow-[0_0_8px_rgba(244,63,94,0.2)]";
        case "Pending Approvals": return "bg-purple-50 text-purple-700 border-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.2)]";
        default: return "bg-slate-50 text-slate-700 border-slate-200 shadow-sm";
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
                <div className="h-32 bg-slate-900 rounded-[2.5rem] relative overflow-hidden flex items-center px-10 border-b-4 border-slate-800 shadow-2xl">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl animate-pulse" />
                        <div className="space-y-2">
                            <div className="w-48 h-6 bg-white/10 rounded-lg animate-pulse" />
                            <div className="w-32 h-3 bg-white/5 rounded-lg animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white h-80 rounded-[2.5rem] border border-slate-100 animate-pulse shadow-sm" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-12 max-w-7xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700 relative">
            {/* Tactical Command Header */}
            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl border-b-4 border-slate-800"
            >
                <div className="relative z-10 flex items-center gap-8">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-inner text-indigo-400">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                            <span className="text-[8px] font-black uppercase tracking-[0.1em] text-indigo-400">Onboarding Data Core</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter leading-none italic uppercase">Onboarding Hub</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-3 opacity-60">Strategic Integration Command</p>
                    </div>
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 w-full sm:w-auto">
                        <select 
                            value={selectedJobId}
                            onChange={(e) => setSelectedJobId(e.target.value)}
                            className="bg-transparent border-none py-2.5 px-4 text-[10px] font-black text-white uppercase tracking-widest outline-none cursor-pointer w-full sm:w-48 appearance-none"
                        >
                            <option value="all" className="bg-slate-900 text-white">All Active Pipelines</option>
                            {jobs.map(job => (
                                <option key={job.id} value={job.id} className="bg-slate-900 text-white truncate">{job.title}</option>
                            ))}
                        </select>
                    </div>
                    <div className="relative group w-full sm:w-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-white transition-colors" />
                        <input
                            type="text"
                            placeholder="Identify Candidate..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-6 text-[11px] font-black placeholder:text-slate-500 placeholder:uppercase placeholder:tracking-widest focus:outline-none focus:bg-white focus:text-slate-900 transition-all shadow-inner w-full sm:w-64"
                        />
                    </div>
                    <button 
                        onClick={fetchOnboardings}
                        className="w-14 h-14 bg-white/5 hover:bg-indigo-600 border border-white/10 rounded-2xl text-white transition-all flex items-center justify-center active:scale-95 shadow-inner group"
                    >
                        <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                    </button>
                </div>
                {/* Tactical background elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -mr-64 -mt-64" />
            </motion.header>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                    {filteredOnboardings.map((ob, i) => (
                        <motion.div 
                            layout
                            key={ob.id}
                            className="group bg-white rounded-[2.5rem] border border-slate-100 p-1.5 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 relative overflow-hidden"
                            onClick={() => router.push(`/enterprise/onboarding/${ob.id}`)}
                        >
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="p-8 pb-4 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-inner">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-widest border border-indigo-100/30">
                                            {ob.onboarding_code}
                                        </span>
                                        {ob.status && (
                                            <span className={`text-[8px] font-black px-2.5 py-1 rounded-full border uppercase tracking-tighter ${getStatusColor(ob.status.name)}`}>
                                                {ob.status.name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tighter leading-none italic uppercase group-hover:text-indigo-600 transition-colors truncate">
                                        {ob.application?.candidate?.full_name || "Unknown Identity"}
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate opacity-60 italic">
                                        {ob.candidate_email}
                                    </p>
                                </div>

                                <div className="bg-slate-50/50 rounded-2xl p-4 space-y-4 border border-slate-50 group-hover:bg-white group-hover:border-slate-100 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 group-hover:bg-indigo-50">
                                            <Briefcase className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight leading-none truncate max-w-[140px]">
                                                {ob.job_title || "Unspecified Sector"}
                                            </p>
                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1">Strategic Sector</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 group-hover:bg-emerald-50">
                                            <Calendar className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight leading-none italic tabular-nums">
                                                {format(new Date(ob.initiation_date), "MMM dd, yyyy")}
                                            </p>
                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1">Initiation Protocol</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="px-8 py-5 flex items-center justify-between bg-slate-50/50 border-t border-slate-50 rounded-b-[2.5rem]">
                                <div className="flex items-center gap-1.5 opacity-40">
                                    <Activity className="w-4 h-4" />
                                    <span className="text-[9px] font-black uppercase tracking-widest truncate">Activity Level: Optimal</span>
                                </div>
                                <button className="text-[9px] font-black text-slate-400 group-hover:text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-1.5 transition-all italic underline underline-offset-4">
                                    Access HUB
                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            
            {filteredOnboardings.length === 0 && (
                <div className="py-32 flex flex-col items-center justify-center text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-50 mt-8 group hover:border-slate-100 transition-all">
                    <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-3xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform">
                        <ShieldCheck className="w-10 h-10" />
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Sector Empty</h4>
                    <p className="text-[10px] text-slate-400 font-bold max-w-[240px] uppercase tracking-widest leading-relaxed mt-2 opacity-60">Initiate new onboarding cycles from the candidate pipeline to populate this tactical node.</p>
                </div>
            )}
        </div>
    );
}
