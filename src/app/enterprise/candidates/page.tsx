"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
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
    resume_file_path?: string;
    resume_url?: string;
    applied_jobs?: { id: string; title: string }[];
    parsed_data?: Record<string, unknown>;
}

// Uploaded files are served statically at `/uploads` (mounted in backend main.py). Build a
// viewable URL from the stored path (strip the /api/v1 API suffix, normalize backslashes).
const resumeUrlFromPath = (path?: string): string | undefined =>
    path ? `${BACKEND_URL.replace("/api/v1", "")}/${path.replaceAll("\\", "/").replace(/^\/+/, "")}` : undefined;

const AVATAR_PALETTE = [
    "bg-[#ECEBFB] text-[#5B53E0]",
    "bg-[#E3F4EF] text-[#0E8A6E]",
    "bg-[#FEF3E2] text-[#D97706]",
    "bg-[#E7ECFB] text-[#3559C7]",
    "bg-[#FDECEC] text-[#C0383C]",
];
const avatarFor = (name: string) => AVATAR_PALETTE[(name?.charCodeAt(0) || 0) % AVATAR_PALETTE.length];

const CandidateProfileModal = ({ candidate, onClose }: { candidate: Candidate; onClose: () => void }) => {
    const { t: tr } = useI18n();
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
                                    <h3 className="text-[14px] font-bold text-[#15171C]">{tr("pipeline.resumeDocument")}</h3>
                                    <p className="text-[12px] font-medium text-[#8A929E] mt-0.5">{tr("pipeline.uploaded")} {new Date(candidate.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => window.open(candidate.resume_url, '_blank')}
                                className="px-5 h-10 bg-white border border-[#E8EAED] rounded-[10px] text-[13px] font-semibold text-[#374151] hover:bg-[#F4F5F7] hover:border-[#DAD7F6] transition-colors shadow-sm"
                            >
                                {tr("pipeline.viewResume")}
                            </button>
                        </div>
                    )}

                    {/* Applied Jobs */}
                    <div>
                        <h3 className="font-bold text-[#15171C] text-[14px] mb-3.5 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-[9px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center"><Briefcase className="w-4 h-4" /></span>
                            {tr("pipeline.targetPositions")}
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
                                {tr("pipeline.noJobsLinked")}
                            </div>
                        )}
                    </div>

                    {/* Skills */}
                    {candidate.skills && candidate.skills.length > 0 && (
                        <div>
                            <h3 className="font-bold text-[#15171C] text-[14px] mb-3.5 flex items-center gap-2">
                                <span className="w-7 h-7 rounded-[9px] bg-[#E3F4EF] text-[#0E8A6E] flex items-center justify-center"><Zap className="w-4 h-4" /></span>
                                {tr("pipeline.skills")}
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
    const { t: tr } = useI18n();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [selectedJobId, setSelectedJobId] = useState<string>("ALL");
    const [viewCandidate, setViewCandidate] = useState<Candidate | null>(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [stats, setStats] = useState({ total: 0, multi_role: 0, highly_skilled: 0, with_resume: 0 });
    const PAGE_SIZE = 25;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    // "Invite to a role" — reach out to a candidate about a job that suits their skills.
    const [inviteCandidate, setInviteCandidate] = useState<Candidate | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [matchingJobs, setMatchingJobs] = useState<any[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [sendingJobId, setSendingJobId] = useState<string | null>(null);
    const [inviteMsg, setInviteMsg] = useState<string>("");
    const [jobSearch, setJobSearch] = useState("");

    const openInvite = async (candidate: Candidate) => {
        setInviteCandidate(candidate);
        setMatchingJobs([]);
        setInviteMsg("");
        setJobSearch("");
        setLoadingJobs(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/candidates/${candidate.id}/matching-jobs`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) { const d = await res.json(); setMatchingJobs(d.jobs || []); }
        } catch (e) { console.error("Failed to load matching jobs:", e); } finally { setLoadingJobs(false); }
    };

    const sendInvite = async (jobId: string) => {
        if (!inviteCandidate) return;
        setSendingJobId(jobId);
        setInviteMsg("");
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${jobId}/invite-candidate`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ candidate_id: inviteCandidate.id }),
            });
            const d = await res.json().catch(() => ({}));
            if (res.ok && d.sent) {
                setInviteMsg(d.test_mode
                    ? tr("pipeline.testInviteSent", { email: d.test_email })
                    : tr("pipeline.inviteSent", { name: inviteCandidate.full_name || inviteCandidate.email }));
            } else {
                setInviteMsg(d.detail || tr("pipeline.inviteFailed"));
            }
        } catch { setInviteMsg(tr("pipeline.inviteNetworkError")); } finally { setSendingJobId(null); }
    };

    // Debounce the search box so we query the server as the user pauses, not on every keystroke.
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 350);
        return () => clearTimeout(t);
    }, [searchQuery]);

    // Any change to the query/filter resets to the first page.
    useEffect(() => { setPage(1); }, [debouncedQuery, selectedJobId]);

    useEffect(() => { if (token) fetchJobs(); }, [token]);

    useEffect(() => {
        if (token) fetchCandidates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, debouncedQuery, selectedJobId, page]);

    const fetchJobs = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const d = await res.json();
                setJobs(Array.isArray(d) ? d : []);
            }
        } catch (error) {
            console.error("Error fetching jobs:", error);
        }
    };

    const fetchCandidates = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
            if (debouncedQuery) params.set("q", debouncedQuery);
            if (selectedJobId !== "ALL") params.set("job_id", selectedJobId);

            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/candidates/?${params.toString()}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const d = await res.json();
                const items: Candidate[] = (Array.isArray(d.items) ? d.items : []).map((c: Candidate) => ({
                    ...c,
                    resume_url: c.resume_url || resumeUrlFromPath(c.resume_file_path),
                }));
                setCandidates(items);
                setTotal(d.total || 0);
                if (d.stats) setStats(d.stats);
            }
        } catch (error) {
            console.error("Error fetching candidates:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const statCards = [
        { label: tr("pipeline.totalProfiles"), value: stats.total, Icon: Users, grad: "linear-gradient(135deg,#8B7DFF,#5B53E0)", glow: "rgba(91,83,224,0.3)" },
        { label: tr("pipeline.multiRoleApplicants"), value: stats.multi_role, Icon: Zap, grad: "linear-gradient(135deg,#34D399,#0E8A6E)", glow: "rgba(14,138,110,0.3)" },
        { label: tr("pipeline.highlySkilled"), value: stats.highly_skilled, Icon: Star, grad: "linear-gradient(135deg,#FBBF24,#D97706)", glow: "rgba(217,119,6,0.3)" },
        { label: tr("pipeline.withResume"), value: stats.with_resume, Icon: CheckCircle2, grad: "linear-gradient(135deg,#60A5FA,#3559C7)", glow: "rgba(53,89,199,0.3)" },
    ];

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">{tr("pipeline.candidateBank")}</h1>
                        <PageHelp title={tr("pipeline.candidateBank")}>
                            <p>{tr("pipeline.helpCandidateBank")}</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#8A929E] mt-0.5">{tr("pipeline.candidateBankSubtitle")}</p>
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
                        placeholder={tr("pipeline.searchNameEmailSkills")}
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
                        <option value="ALL">{tr("pipeline.allApplications")}</option>
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
                ) : candidates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-center">
                        <div className="relative mb-6">
                            <div className="absolute -inset-3 rounded-full bg-[#5B53E0]/12 blur-2xl" />
                            <div className="relative w-16 h-16 rounded-[18px] flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#8B7DFF,#5B53E0)", boxShadow: "0 12px 30px rgba(91,83,224,0.4)" }}>
                                <Users className="w-7 h-7" />
                            </div>
                        </div>
                        <h3 className="text-[18px] font-bold text-[#15171C] mb-1.5">{tr("pipeline.noCandidatesMatched")}</h3>
                        <p className="text-[#8A929E] text-[14px] max-w-xs mx-auto mb-6">{tr("pipeline.refineSearchParams")}</p>
                        <button onClick={() => { setSearchQuery(""); setSelectedJobId("ALL"); }} className="px-6 h-11 bg-[#5B53E0] text-white rounded-[10px] font-semibold text-[13.5px] hover:bg-[#4A43C9] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-colors">{tr("pipeline.resetSearch")}</button>
                    </div>
                ) : (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[#F7F8FA] border-b border-[#E8EAED]">
                                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">{tr("pipeline.candidate")}</th>
                                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">{tr("pipeline.targetPipeline")}</th>
                                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">{tr("pipeline.topSkills")}</th>
                                <th className="px-6 py-3.5 text-right text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">{tr("general.actions")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F0F1]">
                            {candidates.map((candidate) => (
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
                                            <span className="text-[12px] font-medium text-[#9AA3AF] italic">{tr("pipeline.generalPool")}</span>
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
                                                    title={tr("pipeline.viewResume")}
                                                >
                                                    <FileText className="w-[18px] h-[18px]" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openInvite(candidate)}
                                                className="h-9 px-3.5 rounded-[9px] bg-white border border-[#E1E4E8] text-[#374151] text-[12.5px] font-semibold hover:border-[#5B53E0] hover:text-[#5B53E0] transition-colors flex items-center gap-1.5"
                                                title={tr("pipeline.inviteMatchingRoleTitle")}
                                            >
                                                <Mail className="w-4 h-4" />
                                                {tr("pipeline.inviteToRole")}
                                            </button>
                                            <button
                                                onClick={() => setViewCandidate(candidate)}
                                                className="h-9 px-4 rounded-[9px] bg-[#ECEBFB] text-[#5B53E0] text-[12.5px] font-semibold hover:bg-[#5B53E0] hover:text-white transition-colors flex items-center gap-1.5"
                                            >
                                                {tr("pipeline.openProfile")}
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

            {/* Pagination — server-side, so this pages through the full result set, not just what's loaded. */}
            {!isLoading && total > PAGE_SIZE && (
                <div className="flex items-center justify-between gap-3">
                    <span className="text-[12.5px] text-[#8A929E]">
                        {tr("pipeline.showing")} <span className="font-semibold text-[#374151]">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)}</span> {tr("pipeline.ofLabel")} <span className="font-semibold text-[#374151]">{total}</span>
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="h-9 px-3 rounded-[9px] bg-white border border-[#E1E4E8] text-[13px] font-semibold text-[#374151] hover:bg-[#F4F5F7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            {tr("pipeline.previous")}
                        </button>
                        <span className="text-[12.5px] font-semibold text-[#6B6F76] px-1">{tr("pipeline.pageOf", { page, total: totalPages })}</span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="h-9 px-3 rounded-[9px] bg-white border border-[#E1E4E8] text-[13px] font-semibold text-[#374151] hover:bg-[#F4F5F7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            {tr("pipeline.next")}
                        </button>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {viewCandidate && (
                    <CandidateProfileModal candidate={viewCandidate} onClose={() => setViewCandidate(null)} />
                )}
            </AnimatePresence>

            {/* Invite-to-a-role picker: choose a job (ranked by fit) and email the candidate about it. */}
            <AnimatePresence>
                {inviteCandidate && (
                    <div
                        role="button" tabIndex={0}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-[#15171C]/40 backdrop-blur-sm p-4"
                        onClick={() => setInviteCandidate(null)}
                        onKeyDown={(e) => { if (e.key === "Escape") setInviteCandidate(null); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                            className="w-full max-w-lg max-h-[80vh] flex flex-col bg-white rounded-[16px] border border-[#E8EAED] shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="px-6 py-4 border-b border-[#E8EAED] flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-[15px] font-bold text-[#15171C]">{tr("pipeline.inviteNameToRole", { name: inviteCandidate.full_name || tr("pipeline.candidateFallback") })}</h3>
                                    <p className="text-[12.5px] text-[#8A929E] mt-0.5">{tr("pipeline.pickJobSuits")}</p>
                                </div>
                                <button onClick={() => setInviteCandidate(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-[#9AA3AF] hover:bg-[#F4F5F7]"><X className="w-5 h-5" /></button>
                            </div>
                            {inviteMsg && (
                                <div className={`mx-6 mt-4 px-4 py-2.5 rounded-[10px] text-[12.5px] font-semibold ${inviteMsg.startsWith("✓") ? "bg-[#E6F4EA] text-[#15803D]" : "bg-[#FDECEC] text-[#C0383C]"}`}>{inviteMsg}</div>
                            )}
                            {!loadingJobs && matchingJobs.length > 0 && (
                                <div className="px-6 pt-4">
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA3AF]" />
                                        <input
                                            type="text"
                                            autoFocus
                                            value={jobSearch}
                                            onChange={(e) => setJobSearch(e.target.value)}
                                            placeholder={tr("pipeline.searchJobsPlaceholder")}
                                            className="w-full h-10 bg-[#F7F8FA] border border-[#E1E4E8] rounded-[10px] pl-10 pr-3 text-[13px] text-[#15171C] placeholder:text-[#9AA3AF] focus:bg-white focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {loadingJobs ? (
                                    <div className="p-8 text-center text-[13px] text-[#8A929E]">{tr("pipeline.findingMatchingRoles")}</div>
                                ) : matchingJobs.length === 0 ? (
                                    <div className="p-8 text-center text-[13px] text-[#8A929E]">{tr("pipeline.noJobsOrg")}</div>
                                ) : (() => {
                                    const q = jobSearch.trim().toLowerCase();
                                    const shown = q
                                        ? matchingJobs.filter((j) =>
                                            (j.title || "").toLowerCase().includes(q)
                                            || (j.location || "").toLowerCase().includes(q)
                                            || (j.matched_skills || []).some((s: string) => s.toLowerCase().includes(q))
                                            || (j.required_skills || []).some((s: string) => s.toLowerCase().includes(q)))
                                        : matchingJobs;
                                    if (shown.length === 0) {
                                        return <div className="p-8 text-center text-[13px] text-[#8A929E]">{tr("pipeline.noJobsMatchQuery", { q: jobSearch })}</div>;
                                    }
                                    return shown.map((j) => (
                                    <div key={j.id} className="flex items-center justify-between gap-3 p-3.5 rounded-[12px] border border-[#E8EAED] hover:border-[#DAD7F6] transition-colors">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[13.5px] font-bold text-[#15171C] truncate">{j.title}</span>
                                                {j.match_count > 0 && (
                                                    <span className="shrink-0 text-[10px] font-bold text-[#5B53E0] bg-[#ECEBFB] rounded-full px-2 py-0.5">{tr("pipeline.pctMatch", { pct: j.match_pct })}</span>
                                                )}
                                                {j.already_applied && (
                                                    <span className="shrink-0 text-[10px] font-bold text-[#15803D] bg-[#E6F4EA] rounded-full px-2 py-0.5">{tr("pipeline.applied")}</span>
                                                )}
                                            </div>
                                            {j.matched_skills?.length > 0 && (
                                                <p className="text-[11.5px] text-[#8A929E] mt-0.5 truncate">{tr("pipeline.matchesLabel")} {j.matched_skills.slice(0, 5).join(", ")}</p>
                                            )}
                                            {j.location && <p className="text-[11px] text-[#9AA3AF] mt-0.5">{j.location}</p>}
                                        </div>
                                        <button
                                            onClick={() => sendInvite(j.id)}
                                            disabled={sendingJobId === j.id}
                                            className="shrink-0 h-9 px-4 rounded-[10px] bg-[#5B53E0] text-white text-[12.5px] font-semibold hover:bg-[#4A43C9] disabled:opacity-50 transition-colors"
                                        >
                                            {sendingJobId === j.id ? tr("pipeline.sending") : tr("pipeline.sendInvite")}
                                        </button>
                                    </div>
                                    ));
                                })()}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
