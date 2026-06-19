"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";

import { 
    Search, 
    FileText, 
    ArrowRight, 
    Users, 
    Zap, 
    Star, 
    CheckCircle2, 
    ChevronDown, 
    Building2,
    X,
    Filter,
    LayoutGrid,
    List,
    Download,
    Mail
} from "lucide-react";

interface Job {
    id: string;
    title: string;
}

interface Candidate {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    skills: string[];
    created_at: string;
    resume_url?: string;
    applied_jobs?: { id: string; title: string }[];
    parsed_data?: Record<string, unknown>;
}

interface Application {
    id: string;
    job_requirement_id: string;
    candidate: Candidate;
}

const CandidateProfileModal = ({ candidate, onClose }: { candidate: Candidate; onClose: () => void }) => {
    const details = candidate.parsed_data || {};

    return (
        <div
            role="button"
            tabIndex={0}
            className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { onClose(); } }}
        >
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-white z-10 border-b border-slate-100 px-6 py-5 flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">{candidate.full_name}</h2>
                        <div className="flex flex-col gap-1.5 mt-2 text-xs text-slate-500">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-slate-400" />
                                {candidate.email}
                            </div>
                            {candidate.phone && (
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-slate-400" />
                                    {candidate.phone}
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-8">
                    {/* Resume Action */}
                    {candidate.resume_url && (
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-rose-500 shadow-sm">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900">Resume Document</h3>
                                    <p className="text-xs font-medium text-slate-400 mt-0.5">Uploaded {new Date(candidate.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => window.open(candidate.resume_url, '_blank')}
                                className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                            >
                                View Resume
                            </button>
                        </div>
                    )}

                    {/* Applied Jobs */}
                    <div>
                        <h3 className="font-black text-slate-900 text-sm mb-4 flex items-center gap-2">
                            <LayoutGrid className="w-4 h-4 text-indigo-500" />
                            Target Positions
                        </h3>
                        {candidate.applied_jobs && candidate.applied_jobs.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {candidate.applied_jobs.map((job, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-[10px] font-black border border-indigo-100">
                                        {job.title}
                                        <div className="w-1 h-1 rounded-full bg-indigo-400"></div>
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl border border-dashed border-slate-200 text-slate-400 text-[11px] font-medium">
                                No specific jobs linked (General Talent Pool)
                            </div>
                        )}
                    </div>

                    {/* Skills */}
                    {candidate.skills && candidate.skills.length > 0 && (
                        <div>
                            <h3 className="font-black text-slate-900 text-sm mb-4 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-emerald-500" />
                                Verified Skills
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {candidate.skills.map((skill, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] text-slate-600 font-black shadow-sm uppercase tracking-wider">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default function AllCandidatesPage() {
    const { token } = useAuth();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedJobId, setSelectedJobId] = useState<string>("ALL");
    const [viewCandidate, setViewCandidate] = useState<Candidate | null>(null);

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [appsRes, jobsRes] = await Promise.all([
                fetch(`${BACKEND_URL}/api/v1/enterprise/applications/`, {
                    headers: { "Authorization": `Bearer ${token}` }
                }),
                fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/`, {
                    headers: { "Authorization": `Bearer ${token}` }
                })
            ]);

            if (appsRes.ok) {
                const appsRaw = await appsRes.json();
                const appsData: Application[] = Array.isArray(appsRaw) ? appsRaw : [];
                let currentJobs: Job[] = [];
                if (jobsRes.ok) {
                    const jobsRaw = await jobsRes.json();
                    currentJobs = Array.isArray(jobsRaw) ? jobsRaw : [];
                    setJobs(currentJobs);
                }

                const jobsMap = new Map(currentJobs.map((j: Job) => [j.id, j]));
                const candidateMap = new Map<string, Candidate>();

                appsData.forEach((app: Application) => {
                    const cand = app.candidate;
                    if (!cand) return;
                    if (!candidateMap.has(cand.id)) {
                        candidateMap.set(cand.id, {
                            ...cand,
                            applied_jobs: []
                        });
                    }

                    const jobId = app.job_requirement_id;
                    if (jobId && jobsMap.has(jobId)) {
                        const jobInfo = jobsMap.get(jobId);
                        const candidateEntry = candidateMap.get(cand.id);
                        if (candidateEntry && !candidateEntry.applied_jobs?.some(j => j.id === jobId)) {
                            candidateEntry.applied_jobs?.push({
                                id: jobId,
                                title: jobInfo!.title
                            });
                        }
                    }
                });

                setCandidates(Array.from(candidateMap.values()));
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCandidates = candidates.filter(candidate => {
        const matchesSearch = candidate.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            candidate.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            candidate.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesJob = selectedJobId === "ALL" || candidate.applied_jobs?.some(job => job.id === selectedJobId);

        return matchesSearch && matchesJob;
    });

    const stats = {
        total: candidates.length,
        fastTrack: candidates.filter((c: Candidate) => c.applied_jobs && c.applied_jobs.length > 1).length,
        topTalent: candidates.filter((c: Candidate) => c.skills && c.skills.length > 5).length,
        qualified: candidates.filter((c: Candidate) => c.resume_url).length
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Candidate Bank</h1>
                    <p className="text-sm font-medium text-slate-400">Discover and manage qualified talent across your organization</p>
                </div>
            </div>

            {/* Stat Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Profiles", value: stats.total, icon: Users, color: "text-indigo-500", bg: "bg-indigo-50/50", hoverBg: "bg-indigo-50" },
                    { label: "Active Pipeline", value: stats.fastTrack, icon: Zap, color: "text-emerald-500", bg: "bg-emerald-50/50", hoverBg: "bg-emerald-50" },
                    { label: "Highly Skilled", value: stats.topTalent, icon: Star, color: "text-amber-500", bg: "bg-amber-50/50", hoverBg: "bg-amber-50" },
                    { label: "Qualified Repos", value: stats.qualified, icon: CheckCircle2, color: "text-rose-500", bg: "bg-rose-50/50", hoverBg: "bg-rose-50" },
                ].map((card, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between min-h-[140px]"
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</span>
                            <div className={`w-12 h-12 rounded-xl ${card.bg} ${card.color} flex items-center justify-center transition-all group-hover:scale-110 group-hover:${card.hoverBg}`}>
                                <card.icon className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="text-4xl font-black text-slate-900 mt-auto leading-none">
                            {card.value}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-4">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#7C3AED] transition-colors" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, email, or skills..."
                        className="w-full bg-white border border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-[#7C3AED] transition-all shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <Building2 className="w-4 h-4" />
                        </div>
                        <select 
                            value={selectedJobId}
                            onChange={(e) => setSelectedJobId(e.target.value)}
                            className="bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-9 pr-10 text-xs font-bold text-slate-600 outline-none appearance-none cursor-pointer hover:bg-white transition-all shadow-sm min-w-[160px]"
                        >
                            <option value="ALL">All Applications</option>
                            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="flex items-center p-1.5 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-[#7C3AED] shadow-sm">
                            <LayoutGrid className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/10 overflow-hidden min-h-[500px]">
                {isLoading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredCandidates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                            <Users className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">No candidates matched</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mb-8">Refine your search parameters to discover other talent in your pool.</p>
                        <button onClick={() => { setSearchQuery(""); setSelectedJobId("ALL"); }} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm">Reset Search</button>
                    </div>
                ) : (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-wider">Candidate</th>
                                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-wider">Target Pipeline</th>
                                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-wider">Top Skills</th>
                                <th className="px-6 py-4 text-right text-[11px] font-black text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredCandidates.map((candidate, index) => (
                                <tr key={candidate.id} className="hover:bg-slate-50/30 transition-all group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-slate-50 text-[#7C3AED] flex items-center justify-center font-black text-xs border border-indigo-100 shadow-sm">
                                                {candidate.full_name?.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900 group-hover:text-[#7C3AED] transition-colors">{candidate.full_name}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{candidate.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        {candidate.applied_jobs && candidate.applied_jobs.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {candidate.applied_jobs.slice(0, 2).map((job, idx) => (
                                                    <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-black border border-slate-200">
                                                        {job.title}
                                                    </span>
                                                ))}
                                                {candidate.applied_jobs.length > 2 && (
                                                    <span className="text-[10px] font-black text-slate-300">+{candidate.applied_jobs.length - 2}</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-black text-slate-400 uppercase italic">General Pool</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-wrap gap-1.5">
                                            {candidate.skills?.slice(0, 3).map((s, idx) => (
                                                <span key={idx} className="inline-flex items-center px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[9px] font-black border border-indigo-100 uppercase tracking-wider">
                                                    {s}
                                                </span>
                                            ))}
                                            {candidate.skills && candidate.skills.length > 3 && (
                                                <span className="text-[10px] font-black text-slate-300">+{candidate.skills.length - 3}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            {candidate.resume_url && (
                                                <button
                                                    onClick={() => window.open(candidate.resume_url, '_blank')}
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all border border-transparent shadow-sm"
                                                    title="View Resume"
                                                >
                                                    <FileText className="w-5 h-5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setViewCandidate(candidate)}
                                                className="h-10 px-4 rounded-xl bg-[#7C3AED]/10 text-[#7C3AED] text-[11px] font-black hover:bg-[#7C3AED] hover:text-white transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                                            >
                                                Open Profile
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            
            <AnimatePresence>
                {viewCandidate && (
                    <CandidateProfileModal candidate={viewCandidate} onClose={() => setViewCandidate(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}
