"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { BACKEND_URL } from "@/utils/api";
import {
    Briefcase,
    Zap,
    Clock,
    CheckCircle2,
    Search,
    Building2,
    Filter,
    ChevronDown,
    Plus,
    MapPin,
    Copy,
    Check,
    FileEdit,
    Archive,
    MoreHorizontal,
    Sparkles,
    Globe as GlobeIcon,
} from "lucide-react";
import PublishJobModal from "@/components/enterprise/PublishJobModal";
import { Badge, PageHelp, EmptyState, Button, jetbrainsMono } from "@/components/ds";

interface JobPosting {
    platform: string;
    status: string;
}

interface Company {
    id: string;
    name: string;
}

interface Member {
    id: string;
    full_name: string;
    email: string;
    profile_image?: string | null;
}

interface Job {
    id: string;
    title: string;
    description: string;
    location: string;
    created_at: string;
    status_id: number;
    salary_min: number;
    salary_max: number;
    experience_min: number;
    experience_max: number;
    job_type?: string;
    postings: JobPosting[];
    company_id?: string;
    owner?: Member | null;
    collaborators?: Member[];
}

function initials(name?: string): string {
    if (!name) return "?";
    const p = name.trim().split(/\s+/);
    return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase() || "?";
}

type TabStatus = "ALL" | "ACTIVE" | "DRAFTS" | "CLOSED";

export default function EnterpriseJobsPage() {
    const { token, canAccess } = useAuth();
    const { t: tr } = useI18n();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<TabStatus>("ALL");
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("ALL");
    const [selectedLocation, setSelectedLocation] = useState<string>("ALL");
    const [selectedType, setSelectedType] = useState<string>("ALL");
    const [copiedJobId, setCopiedJobId] = useState<string | null>(null);
    const [mineOnly, setMineOnly] = useState(false);
    // Which row's "More" menu is open. Click-toggle (not hover) so it works on touch devices.
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Publish Modal State
    const [publishModal, setPublishModal] = useState<{ isOpen: boolean; jobId: string; jobTitle: string }>({
        isOpen: false,
        jobId: "",
        jobTitle: ""
    });

    useEffect(() => {
        if (token) {
            fetchJobs();
            fetchCompanies();
        }
    }, [token, mineOnly]);

    const fetchCompanies = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/company/`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data: Company[] = await res.json();
                setCompanies(data);
            }
        } catch (error) {
            console.error("Error fetching companies:", error);
        }
    };

    const handleDeleteJob = async (jobId: string) => {
        if (!confirm(tr("jobs.confirmDeleteJob"))) return;

        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${jobId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (res.ok) {
                setJobs(prev => prev.filter(j => j.id !== jobId));
            } else {
                const error = await res.json();
                alert(tr("jobs.errorDeletingJob", { error: error.detail || tr("jobs.unknownError") }));
            }
        } catch (error) {
            console.error("Error deleting job:", error);
            alert(tr("jobs.failedDeleteJob"));
        }
    };

    const fetchJobs = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${mineOnly ? "?mine=true" : ""}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data: Job[] = await res.json();
                setJobs(data);
            }
        } catch (error) {
            console.error("Error fetching jobs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const statsJobs = jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.location?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCompany = selectedCompanyId === "ALL" || job.company_id === selectedCompanyId;
        const matchesLocation = selectedLocation === "ALL" || (job.location && job.location === selectedLocation);
        const matchesType = selectedType === "ALL" || job.job_type === selectedType;

        return matchesSearch && matchesCompany && matchesLocation && matchesType;
    });

    // job_statuses: 1 Draft · 2 Active · 3 On Hold · 4 Closed.
    // "Closed / On hold" groups the two non-open states (3 + 4) so no job vanishes from view.
    const stats = {
        total: statsJobs.length,
        active: statsJobs.filter(j => j.status_id === 2).length,
        drafts: statsJobs.filter(j => j.status_id === 1).length,
        closed: statsJobs.filter(j => j.status_id === 3 || j.status_id === 4).length
    };

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.location?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesTab = activeTab === "ALL" ||
            (activeTab === "ACTIVE" && job.status_id === 2) ||
            (activeTab === "DRAFTS" && job.status_id === 1) ||
            (activeTab === "CLOSED" && (job.status_id === 3 || job.status_id === 4));

        const matchesCompany = selectedCompanyId === "ALL" || job.company_id === selectedCompanyId;
        const matchesLocation = selectedLocation === "ALL" || (job.location && job.location === selectedLocation);
        const matchesType = selectedType === "ALL" || job.job_type === selectedType;

        return matchesSearch && matchesTab && matchesCompany && matchesLocation && matchesType;
    });

    const locations = Array.from(new Set(jobs.map(j => j.location).filter((l): l is string => Boolean(l))));
    const jobTypes = Array.from(new Set(jobs.map(j => j.job_type).filter((t): t is string => Boolean(t))));

    const statCards = [
        { tab: "ALL" as TabStatus, label: tr("jobs.totalPositions"), value: stats.total, Icon: Briefcase, grad: "linear-gradient(135deg,#42A5F5,#1976D2)", glow: "rgba(25,118,210,0.28)" },
        { tab: "ACTIVE" as TabStatus, label: tr("jobs.activeJobs"), value: stats.active, Icon: Zap, grad: "linear-gradient(135deg,#66BB6A,#2E7D32)", glow: "rgba(46,125,50,0.25)" },
        { tab: "DRAFTS" as TabStatus, label: tr("jobs.drafts"), value: stats.drafts, Icon: Clock, grad: "linear-gradient(135deg,#FFB74D,#EF6C00)", glow: "rgba(239,108,0,0.25)" },
        { tab: "CLOSED" as TabStatus, label: tr("jobs.closedOnHold"), value: stats.closed, Icon: CheckCircle2, grad: "linear-gradient(135deg,#42A5F5,#1565C0)", glow: "rgba(21,101,192,0.25)" },
    ];

    const selectCls =
        "appearance-none bg-white border border-[#E0E0E0] rounded-[4px] h-10 pl-9 pr-9 text-[13px] font-medium text-[#424242] outline-none cursor-pointer hover:bg-[#FAFAFA] focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all";

    const copyLink = async (jobId: string) => {
        const url = `${window.location.origin}/jobs/${jobId}?source=Direct Link`;
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(url);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = url;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                textArea.remove();
            }
            setCopiedJobId(jobId);
            setTimeout(() => setCopiedJobId(null), 2000);
        } catch (err) {
            console.error("Failed to copy: ", err);
        }
    };

    // job_statuses: 1 Draft · 2 Active · 3 On Hold · 4 Closed.
    const statusBadge = (statusId: number) =>
        statusId === 2 ? (
            <Badge tone="success" dot>{tr("jobs.active")}</Badge>
        ) : statusId === 1 ? (
            <Badge tone="neutral" dot>{tr("jobs.draft")}</Badge>
        ) : statusId === 3 ? (
            <Badge tone="warning" dot>{tr("jobs.onHold")}</Badge>
        ) : (
            <Badge tone="danger" dot>{tr("jobs.closed")}</Badge>
        );

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight">{tr("jobs.title")}</h1>
                        <PageHelp title={tr("jobs.title")}>
                            <p>{tr("jobs.help1")}</p>
                            <p><strong>{tr("jobs.newPosition")}</strong> {tr("jobs.help2a")} <strong>{tr("jobs.hireWithAI")}</strong> {tr("jobs.help2b")}</p>
                            <p>{tr("jobs.help3")}</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("jobs.subtitle")}</p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                    {canAccess("jobs:create") && (
                        <>
                            <Link
                                href="/enterprise/croar-pilot"
                                className="inline-flex items-center gap-2 h-9 px-4 rounded-[4px] bg-white border border-[#E0E0E0] text-[#424242] text-[13px] font-semibold hover:bg-[#F5F6F8] transition-colors shadow-sm"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-[#1976D2]" /> {tr("jobs.hireWithAI")}
                            </Link>
                            <Link
                                href="/enterprise/jobs/create"
                                className="inline-flex items-center gap-2 h-9 px-4 rounded-[4px] bg-[#1976D2] text-white text-[13px] font-semibold hover:bg-[#1565C0] shadow-[0_4px_12px_rgba(25,118,210,0.28)] transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" /> {tr("jobs.newPosition")}
                            </Link>
                        </>
                    )}
                </div>
            </header>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {statCards.map((s) => (
                    <div
                        key={s.tab}
                        className="relative bg-white border border-[#E0E0E0] rounded-[4px] p-5 overflow-hidden"
                    >
                        <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: s.grad }} />
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{s.label}</span>
                                <div className={`text-[28px] font-semibold tracking-[-1px] text-[#212121] mt-2 ${jetbrainsMono.className}`}>{s.value}</div>
                            </div>
                            <span className="w-10 h-10 rounded-[4px] flex items-center justify-center text-white shrink-0" style={{ background: s.grad, boxShadow: `0 6px 14px ${s.glow}` }}>
                                <s.Icon className="w-[18px] h-[18px]" />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Toolbar: search + filters */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9E9E9E]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={tr("jobs.searchPlaceholder")}
                        className="w-full h-10 bg-white border border-[#E0E0E0] rounded-[4px] pl-10 pr-4 text-[14px] text-[#212121] placeholder:text-[#9E9E9E] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all"
                    />
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => setMineOnly((v) => !v)}
                        className={`h-10 px-3.5 rounded-[4px] text-[13px] font-semibold whitespace-nowrap transition-colors border ${
                            mineOnly
                                ? "bg-[#1976D2] text-white border-[#1976D2] shadow-[0_4px_12px_rgba(25,118,210,0.24)]"
                                : "bg-white text-[#424242] border-[#E0E0E0] hover:border-[#1976D2]/40"
                        }`}
                        title={tr("jobs.myJobsHint")}
                    >
                        {tr("jobs.myJobs")}
                    </button>
                    <div className="relative flex-1 md:flex-none">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
                        <select
                            value={selectedCompanyId}
                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                            className={`${selectCls} w-full md:min-w-[150px]`}
                        >
                            <option value="ALL">{tr("jobs.allClients")}</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
                    </div>

                    <div className="relative flex-1 md:flex-none">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
                        <select
                            value={activeTab}
                            onChange={(e) => setActiveTab(e.target.value as TabStatus)}
                            className={`${selectCls} w-full md:min-w-[150px]`}
                        >
                            <option value="ALL">{tr("jobs.anyStatus")}</option>
                            <option value="ACTIVE">{tr("jobs.active")}</option>
                            <option value="DRAFTS">{tr("jobs.draft")}</option>
                            <option value="CLOSED">{tr("jobs.closedOnHold")}</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
                    </div>

                    {locations.length > 0 && (
                        <div className="relative flex-1 md:flex-none">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
                            <select
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                className={`${selectCls} w-full md:min-w-[150px]`}
                            >
                                <option value="ALL">{tr("jobs.allLocations")}</option>
                                {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
                        </div>
                    )}

                    {jobTypes.length > 0 && (
                        <div className="relative flex-1 md:flex-none">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className={`${selectCls} w-full md:min-w-[140px]`}
                            >
                                <option value="ALL">{tr("jobs.allTypes")}</option>
                                {jobTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
                        </div>
                    )}
                </div>
            </div>

            {/* Job list */}
            <div className="bg-white rounded-[4px] border border-[#E0E0E0] overflow-hidden min-h-[420px]">
                {isLoading ? (
                    <div className="p-4 space-y-2.5">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 bg-[#F5F6F8] rounded-[4px] animate-pulse" />
                        ))}
                    </div>
                ) : filteredJobs.length === 0 ? (
                    jobs.length === 0 ? (
                        <EmptyState
                            tone="brand"
                            icon="work"
                            title={tr("jobs.postFirstJob")}
                            description={tr("jobs.postFirstJobDesc")}
                            action={
                                canAccess("jobs:create") ? (
                                    <Link href="/enterprise/croar-pilot">
                                        <Button icon="auto_awesome">{tr("jobs.hireWithAI")}</Button>
                                    </Link>
                                ) : undefined
                            }
                            secondary={
                                canAccess("jobs:create") ? (
                                    <Link href="/enterprise/jobs/create">
                                        <Button variant="secondary" icon="add">{tr("jobs.postAJob")}</Button>
                                    </Link>
                                ) : undefined
                            }
                        />
                    ) : (
                        <EmptyState
                            tone="muted"
                            icon="search_off"
                            title={tr("jobs.noJobsMatch")}
                            description={tr("jobs.noJobsMatchDesc")}
                            action={
                                <Button
                                    variant="secondary"
                                    onClick={() => { setSearchQuery(""); setActiveTab("ALL"); setSelectedCompanyId("ALL"); setSelectedLocation("ALL"); setSelectedType("ALL"); }}
                                >
                                    {tr("jobs.clearAllFilters")}
                                </Button>
                            }
                        />
                    )
                ) : (
                    <>
                        {/* Column header (desktop) */}
                        <div className="hidden md:grid grid-cols-[2.4fr_1.2fr_0.9fr_1fr_120px] gap-4 px-5 py-3 bg-[#FAFAFA] border-b border-[#E0E0E0]">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("jobs.colPosition")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("jobs.colLocation")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("jobs.colExperience")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("jobs.colStatus")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575] text-right">{tr("jobs.colActions")}</span>
                        </div>

                        <div className="divide-y divide-[#EEEEEE]">
                            {filteredJobs.map((job, index) => (
                                <div
                                    key={job.id}
                                    className="grid grid-cols-[1fr_auto] md:grid-cols-[2.4fr_1.2fr_0.9fr_1fr_120px] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors group"
                                >
                                    {/* Position */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-9 h-9 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center shrink-0">
                                            <Briefcase className="w-[17px] h-[17px]" />
                                        </span>
                                        <div className="min-w-0">
                                            <Link href={`/enterprise/jobs/${job.id}`} className="block text-[14px] font-bold text-[#212121] group-hover:text-[#1976D2] transition-colors truncate">
                                                {job.title}
                                            </Link>
                                            {/* mobile-only meta */}
                                            <div className="flex items-center gap-2.5 mt-0.5 text-[12px] text-[#757575] md:hidden">
                                                <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location || tr("jobs.remote")}</span>
                                                <span className={jetbrainsMono.className}>{job.experience_min || 0}–{job.experience_max || 5}y</span>
                                            </div>
                                            <div className="hidden md:flex items-center gap-1.5 mt-1">
                                                {job.owner ? (
                                                    <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[#616161]" title={`${tr("jobs.owner")}: ${job.owner.full_name}`}>
                                                        <span className="w-[18px] h-[18px] rounded-full bg-[#1976D2] text-white text-[8.5px] font-bold flex items-center justify-center shrink-0">{initials(job.owner.full_name)}</span>
                                                        {job.owner.full_name}
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] font-semibold text-[#EF6C00] bg-[#FFF3E0] px-1.5 py-0.5 rounded">{tr("jobs.unassigned")}</span>
                                                )}
                                                {(job.collaborators?.length ?? 0) > 0 && (
                                                    <span className="text-[11px] text-[#757575]">+{job.collaborators!.length}</span>
                                                )}
                                                <span className="text-[11px] text-[#BDBDBD]">· #{job.id.substring(0, 8)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Location (desktop) */}
                                    <div className="hidden md:flex items-center gap-1.5 text-[13px] text-[#424242] min-w-0">
                                        <MapPin className="w-4 h-4 text-[#9E9E9E] shrink-0" />
                                        <span className="truncate">{job.location || tr("jobs.remote")}</span>
                                    </div>

                                    {/* Experience (desktop) */}
                                    <div className={`hidden md:block text-[13px] text-[#424242] ${jetbrainsMono.className}`}>
                                        {job.experience_min || 0}–{job.experience_max || 5} {tr("jobs.yrs")}
                                    </div>

                                    {/* Status */}
                                    <div className="hidden md:flex items-center">{statusBadge(job.status_id)}</div>

                                    {/* Status + actions (single cell on mobile, actions cell on desktop) */}
                                    <div className="flex items-center gap-1 justify-end">
                                        <div className="md:hidden mr-1">{statusBadge(job.status_id)}</div>

                                        <button
                                            onClick={() => copyLink(job.id)}
                                            className={`w-9 h-9 flex items-center justify-center rounded-[4px] transition-colors border border-transparent ${copiedJobId === job.id ? "bg-[#E8F5E9] text-[#2E7D32]" : "text-[#9E9E9E] hover:bg-[#EEEEEE] hover:text-[#424242]"}`}
                                            title={tr("jobs.copyJdLink")}
                                        >
                                            {copiedJobId === job.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>

                                        {canAccess("jobs:update") && (
                                            <Link href={`/enterprise/jobs/${job.id}/edit`} className="w-9 h-9 flex items-center justify-center rounded-[4px] text-[#9E9E9E] hover:bg-[#E3F2FD] hover:text-[#1976D2] transition-colors" title={tr("jobs.editJob")}>
                                                <FileEdit className="w-4 h-4" />
                                            </Link>
                                        )}

                                        <div className="relative">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === job.id ? null : job.id); }}
                                                className={`w-9 h-9 flex items-center justify-center rounded-[4px] transition-colors ${openMenuId === job.id ? "bg-[#EEEEEE] text-[#424242]" : "text-[#9E9E9E] hover:bg-[#EEEEEE] hover:text-[#424242]"}`}
                                                title={tr("jobs.more")}
                                                aria-haspopup="menu"
                                                aria-expanded={openMenuId === job.id}
                                            >
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                            {openMenuId === job.id && (
                                                <div className={`absolute right-0 w-48 bg-white rounded-[4px] shadow-[0_14px_34px_rgba(0,0,0,0.16)] border border-[#E0E0E0] py-1.5 z-50 ${index >= filteredJobs.length - 2 ? "bottom-full mb-2" : "top-full mt-2"}`}>
                                                    {canAccess("jobs:publish") && (
                                                        <button
                                                            onClick={() => { setPublishModal({ isOpen: true, jobId: job.id, jobTitle: job.title }); setOpenMenuId(null); }}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-[#1976D2] hover:bg-[#E3F2FD] transition-colors"
                                                        >
                                                            <GlobeIcon className="w-4 h-4" /> {tr("jobs.publishJob")}
                                                        </button>
                                                    )}
                                                    {canAccess("jobs:delete") && (
                                                        <button
                                                            onClick={() => { setOpenMenuId(null); handleDeleteJob(job.id); }}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-[#C62828] hover:bg-[#FFEBEE] transition-colors"
                                                        >
                                                            <Archive className="w-4 h-4" /> {tr("jobs.deleteJob")}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Invisible backdrop: click anywhere (incl. touch) to close an open row menu. */}
            {openMenuId && (
                <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} aria-hidden="true" />
            )}

            {/* Publish Modal */}
            <PublishJobModal
                isOpen={publishModal.isOpen}
                onClose={() => setPublishModal({ ...publishModal, isOpen: false })}
                jobId={publishModal.jobId}
                jobTitle={publishModal.jobTitle}
                token={token}
            />
        </div>
    );
};
