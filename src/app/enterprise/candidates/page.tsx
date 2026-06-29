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
    LayoutGrid,
    Mail,
    Phone,
    Briefcase,
} from "lucide-react";
import { jetbrainsMono, PageHelp } from "@/components/ds";

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

const AVATAR_PALETTE = [
    "bg-[#ECEBFB] text-[#5B53E0]",
    "bg-[#E3F4EF] text-[#0E8A6E]",
    "bg-[#FEF3E2] text-[#D97706]",
    "bg-[#E7ECFB] text-[#3559C7]",
    "bg-[#FDECEC] text-[#C0383C]",
];
const avatarFor = (name: string) => AVATAR_PALETTE[(name?.charCodeAt(0) || 0) % AVATAR_PALETTE.length];

const CandidateProfileModal = ({ candidate, onClose }: { candidate: Candidate; onClose: () => void }) => {
    return (
        <div
            role="button"
            tabIndex={0}
            className="fixed inset-0 z-50 flex items-center justify-end bg-[#15171C]/40 backdrop-blur-sm"
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
                {/* Header */}
                <div className="relative px-6 pt-7 pb-6 text-white overflow-hidden" style={{ background: "linear-gradient(135deg,#1B1D24,#0E1014)" }}>
                    <div className="absolute -top-12 -right-10 w-48 h-48 rounded-full" style={{ background: "radial-gradient(circle,rgba(91,83,224,0.5),transparent 70%)" }} />
                    <button onClick={onClose} className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="relative flex items-center gap-4">
                        <div className="w-16 h-16 rounded-[18px] flex items-center justify-center font-extrabold text-[22px] text-white shrink-0" style={{ background: "linear-gradient(135deg,#8B7DFF,#5B53E0)", boxShadow: "0 10px 24px rgba(91,83,224,0.45)" }}>
                            {candidate.full_name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-[22px] font-extrabold tracking-[-0.4px] truncate">{candidate.full_name}</h2>
                            <div className="flex flex-col gap-1 mt-1.5 text-[13px] text-white/65">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{candidate.email}</span>
                                </div>
                                {candidate.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 shrink-0" />
                                        {candidate.phone}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-7">
                    {/* Resume Action */}
                    {candidate.resume_url && (
                        <div className="bg-[#F7F8FA] rounded-[14px] p-5 border border-[#E8EAED] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-[12px] bg-white border border-[#E8EAED] flex items-center justify-center text-[#C0383C] shadow-sm">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-bold text-[#15171C]">Resume Document</h3>
                                    <p className="text-[12px] font-medium text-[#8A929E] mt-0.5">Uploaded {new Date(candidate.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => window.open(candidate.resume_url, '_blank')}
                                className="px-5 h-10 bg-white border border-[#E8EAED] rounded-[10px] text-[13px] font-semibold text-[#374151] hover:bg-[#F4F5F7] hover:border-[#DAD7F6] transition-colors shadow-sm"
                            >
                                View Resume
                            </button>
                        </div>
                    )}

                    {/* Applied Jobs */}
                    <div>
                        <h3 className="font-bold text-[#15171C] text-[14px] mb-3.5 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-[9px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center"><Briefcase className="w-4 h-4" /></span>
                            Target Positions
                        </h3>
                        {candidate.applied_jobs && candidate.applied_jobs.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {candidate.applied_jobs.map((job, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[#ECEBFB]/70 text-[#5B53E0] text-[12px] font-semibold border border-[#DAD7F6]">
                                        {job.title}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 rounded-[12px] border border-dashed border-[#E1E4E8] text-[#9AA3AF] text-[13px] font-medium">
                                No specific jobs linked (General Talent Pool)
                            </div>
                        )}
                    </div>

                    {/* Skills */}
                    {candidate.skills && candidate.skills.length > 0 && (
                        <div>
                            <h3 className="font-bold text-[#15171C] text-[14px] mb-3.5 flex items-center gap-2">
                                <span className="w-7 h-7 rounded-[9px] bg-[#E3F4EF] text-[#0E8A6E] flex items-center justify-center"><Zap className="w-4 h-4" /></span>
                                Skills
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {candidate.skills.map((skill, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-white border border-[#E8EAED] rounded-[10px] text-[12px] text-[#374151] font-semibold shadow-sm">
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

    const statCards = [
        { label: "Total Profiles", value: stats.total, Icon: Users, grad: "linear-gradient(135deg,#8B7DFF,#5B53E0)", glow: "rgba(91,83,224,0.3)" },
        { label: "Active Pipeline", value: stats.fastTrack, Icon: Zap, grad: "linear-gradient(135deg,#34D399,#0E8A6E)", glow: "rgba(14,138,110,0.3)" },
        { label: "Highly Skilled", value: stats.topTalent, Icon: Star, grad: "linear-gradient(135deg,#FBBF24,#D97706)", glow: "rgba(217,119,6,0.3)" },
        { label: "With Resume", value: stats.qualified, Icon: CheckCircle2, grad: "linear-gradient(135deg,#60A5FA,#3559C7)", glow: "rgba(53,89,199,0.3)" },
    ];

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">Candidate Bank</h1>
                        <PageHelp title="Candidate Search">
                            <p>Search and review every candidate. Filter, open a profile, or shortlist promising people.</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#8A929E] mt-0.5">Discover &amp; manage qualified talent across your organization</p>
                </div>
            </header>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {statCards.map((s) => (
                    <div
                        key={s.label}
                        className="relative bg-white border border-[#E8EAED] rounded-[14px] p-5 overflow-hidden"
                    >
                        <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: s.grad }} />
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{s.label}</span>
                                <div className={`text-[28px] font-semibold tracking-[-1px] text-[#15171C] mt-2 ${jetbrainsMono.className}`}>{s.value}</div>
                            </div>
                            <span className="w-10 h-10 rounded-[11px] flex items-center justify-center text-white shrink-0" style={{ background: s.grad, boxShadow: `0 6px 14px ${s.glow}` }}>
                                <s.Icon className="w-[18px] h-[18px]" />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] group-focus-within:text-[#5B53E0] transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, email, or skills..."
                        className="w-full bg-white border border-[#E1E4E8] rounded-[12px] h-11 pl-11 pr-4 text-[14px] font-medium text-[#15171C] placeholder:text-[#9AA3AF] focus:outline-none focus:ring-2 focus:ring-[#5B53E0]/30 focus:border-[#5B53E0] transition-all"
                    />
                </div>

                <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                    <select
                        value={selectedJobId}
                        onChange={(e) => setSelectedJobId(e.target.value)}
                        className="bg-white border border-[#E1E4E8] rounded-[12px] h-11 pl-10 pr-10 text-[13.5px] font-semibold text-[#374151] outline-none appearance-none cursor-pointer hover:border-[#DAD7F6] focus:ring-2 focus:ring-[#5B53E0]/30 focus:border-[#5B53E0] transition-all w-full sm:min-w-[200px]"
                    >
                        <option value="ALL">All Applications</option>
                        {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-[16px] border border-[#E8EAED] overflow-hidden min-h-[480px]">
                {isLoading ? (
                    <div className="p-6 space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
                        ))}
                    </div>
                ) : filteredCandidates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-center">
                        <div className="relative mb-6">
                            <div className="absolute -inset-3 rounded-full bg-[#5B53E0]/12 blur-2xl" />
                            <div className="relative w-16 h-16 rounded-[18px] flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#8B7DFF,#5B53E0)", boxShadow: "0 12px 30px rgba(91,83,224,0.4)" }}>
                                <Users className="w-7 h-7" />
                            </div>
                        </div>
                        <h3 className="text-[18px] font-bold text-[#15171C] mb-1.5">No candidates matched</h3>
                        <p className="text-[#8A929E] text-[14px] max-w-xs mx-auto mb-6">Refine your search parameters to discover other talent in your pool.</p>
                        <button onClick={() => { setSearchQuery(""); setSelectedJobId("ALL"); }} className="px-6 h-11 bg-[#5B53E0] text-white rounded-[10px] font-semibold text-[13.5px] hover:bg-[#4A43C9] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-colors">Reset Search</button>
                    </div>
                ) : (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[#F7F8FA] border-b border-[#E8EAED]">
                                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">Candidate</th>
                                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">Target Pipeline</th>
                                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">Top Skills</th>
                                <th className="px-6 py-3.5 text-right text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F0F1]">
                            {filteredCandidates.map((candidate) => (
                                <tr key={candidate.id} className="hover:bg-[#F7F8FA] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3.5">
                                            <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center font-semibold text-[14px] shrink-0 ${avatarFor(candidate.full_name)}`}>
                                                {candidate.full_name?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[14px] font-semibold text-[#15171C] group-hover:text-[#5B53E0] transition-colors truncate">{candidate.full_name}</span>
                                                <span className="text-[12px] text-[#9AA3AF] truncate">{candidate.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {candidate.applied_jobs && candidate.applied_jobs.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {candidate.applied_jobs.slice(0, 2).map((job, idx) => (
                                                    <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-[8px] bg-[#F4F5F7] text-[#4B5563] text-[11px] font-semibold border border-[#E8EAED]">
                                                        {job.title}
                                                    </span>
                                                ))}
                                                {candidate.applied_jobs.length > 2 && (
                                                    <span className="text-[11px] font-semibold text-[#9AA3AF] self-center">+{candidate.applied_jobs.length - 2}</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-[12px] font-medium text-[#9AA3AF] italic">General Pool</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {candidate.skills?.slice(0, 3).map((s, idx) => (
                                                <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-[8px] bg-[#ECEBFB]/70 text-[#5B53E0] text-[11px] font-semibold border border-[#DAD7F6]">
                                                    {s}
                                                </span>
                                            ))}
                                            {candidate.skills && candidate.skills.length > 3 && (
                                                <span className="text-[11px] font-semibold text-[#9AA3AF] self-center">+{candidate.skills.length - 3}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2.5">
                                            {candidate.resume_url && (
                                                <button
                                                    onClick={() => window.open(candidate.resume_url, '_blank')}
                                                    className="w-9 h-9 flex items-center justify-center rounded-[9px] bg-[#F4F5F7] text-[#9AA3AF] hover:bg-[#FDECEC] hover:text-[#C0383C] transition-colors border border-[#E8EAED]"
                                                    title="View Resume"
                                                >
                                                    <FileText className="w-[18px] h-[18px]" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setViewCandidate(candidate)}
                                                className="h-9 px-4 rounded-[9px] bg-[#ECEBFB] text-[#5B53E0] text-[12.5px] font-semibold hover:bg-[#5B53E0] hover:text-white transition-colors flex items-center gap-1.5"
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
