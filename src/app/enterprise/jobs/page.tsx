"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
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
}

type TabStatus = "ALL" | "ACTIVE" | "DRAFTS" | "CLOSED";

export default function EnterpriseJobsPage() {
    const { token, canAccess } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<TabStatus>("ALL");
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("ALL");
    const [selectedLocation, setSelectedLocation] = useState<string>("ALL");
    const [selectedType, setSelectedType] = useState<string>("ALL");
    const [copiedJobId, setCopiedJobId] = useState<string | null>(null);

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
    }, [token]);

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
        if (!confirm("Are you sure you want to delete this job and all associated automations? This action cannot be undone.")) return;

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
                alert(`Error deleting job: ${error.detail || "Unknown error"}`);
            }
        } catch (error) {
            console.error("Error deleting job:", error);
            alert("Failed to delete job. Please try again.");
        }
    };

    const fetchJobs = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/`, {
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

    const stats = {
        total: statsJobs.length,
        active: statsJobs.filter(j => j.status_id === 2).length,
        drafts: statsJobs.filter(j => j.status_id === 1).length,
        closed: statsJobs.filter(j => j.status_id === 3).length
    };

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.location?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesTab = activeTab === "ALL" ||
            (activeTab === "ACTIVE" && job.status_id === 2) ||
            (activeTab === "DRAFTS" && job.status_id === 1) ||
            (activeTab === "CLOSED" && job.status_id === 3);

        const matchesCompany = selectedCompanyId === "ALL" || job.company_id === selectedCompanyId;
        const matchesLocation = selectedLocation === "ALL" || (job.location && job.location === selectedLocation);
        const matchesType = selectedType === "ALL" || job.job_type === selectedType;

        return matchesSearch && matchesTab && matchesCompany && matchesLocation && matchesType;
    });

    const locations = Array.from(new Set(jobs.map(j => j.location).filter(Boolean)));
    const jobTypes = Array.from(new Set(jobs.map(j => j.job_type).filter(Boolean)));

    const statCards = [
        { tab: "ALL" as TabStatus, label: "Total Positions", value: stats.total, Icon: Briefcase, grad: "linear-gradient(135deg,#8B7DFF,#5B53E0)", glow: "rgba(91,83,224,0.28)" },
        { tab: "ACTIVE" as TabStatus, label: "Active Jobs", value: stats.active, Icon: Zap, grad: "linear-gradient(135deg,#34D399,#0E8A6E)", glow: "rgba(14,138,110,0.25)" },
        { tab: "DRAFTS" as TabStatus, label: "Drafts", value: stats.drafts, Icon: Clock, grad: "linear-gradient(135deg,#F6B65C,#D97706)", glow: "rgba(217,119,6,0.25)" },
        { tab: "CLOSED" as TabStatus, label: "Closed / Filled", value: stats.closed, Icon: CheckCircle2, grad: "linear-gradient(135deg,#6E8BEA,#3559C7)", glow: "rgba(53,89,199,0.25)" },
    ];

    const selectCls =
        "appearance-none bg-white border border-[#E1E4E8] rounded-[10px] h-10 pl-9 pr-9 text-[13px] font-medium text-[#374151] outline-none cursor-pointer hover:bg-[#F7F7F8] focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all";

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

    const statusBadge = (statusId: number) =>
        statusId === 2 ? (
            <Badge tone="success" dot>Active</Badge>
        ) : statusId === 1 ? (
            <Badge tone="neutral" dot>Draft</Badge>
        ) : (
            <Badge tone="danger" dot>Closed</Badge>
        );

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">Jobs</h1>
                        <PageHelp title="Jobs">
                            <p>Every open position lives here. Each job has its own candidate pipeline.</p>
                            <p><strong>New Position</strong> posts a job manually; <strong>Hire with AI</strong> lets Croar set up the whole pipeline for you.</p>
                            <p>Open a job to track applicants, or use the row actions to share, edit or publish it.</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#8A929E] mt-0.5">Manage your pipeline &amp; open positions</p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                    {canAccess("jobs:create") && (
                        <>
                            <Link
                                href="/enterprise/croar-pilot"
                                className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] bg-white border border-[#E1E4E8] text-[#374151] text-[13px] font-semibold hover:bg-[#F4F5F7] transition-colors shadow-sm"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-[#5B53E0]" /> Hire with AI
                            </Link>
                            <Link
                                href="/enterprise/jobs/create"
                                className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-semibold hover:bg-[#4A43C9] shadow-[0_4px_12px_rgba(91,83,224,0.28)] transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" /> New Position
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

            {/* Toolbar: search + filters */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9AA3AF]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by title, location or keywords…"
                        className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] pl-10 pr-4 text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                    />
                </div>

                <div className="flex items-center gap-2.5">
                    <div className="relative flex-1 md:flex-none">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                        <select
                            value={selectedCompanyId}
                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                            className={`${selectCls} w-full md:min-w-[150px]`}
                        >
                            <option value="ALL">All clients</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                    </div>

                    <div className="relative flex-1 md:flex-none">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                        <select
                            value={activeTab}
                            onChange={(e) => setActiveTab(e.target.value as TabStatus)}
                            className={`${selectCls} w-full md:min-w-[150px]`}
                        >
                            <option value="ALL">Any status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="DRAFTS">Draft</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Job list */}
            <div className="bg-white rounded-[14px] border border-[#E8EAED] overflow-hidden min-h-[420px]">
                {isLoading ? (
                    <div className="p-4 space-y-2.5">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
                        ))}
                    </div>
                ) : filteredJobs.length === 0 ? (
                    jobs.length === 0 ? (
                        <EmptyState
                            tone="brand"
                            icon="work"
                            title="Post your first job"
                            description="Create a role and Croar sets up its candidate pipeline. Post it manually, or let AI build the whole pipeline."
                            action={
                                canAccess("jobs:create") ? (
                                    <Link href="/enterprise/croar-pilot">
                                        <Button icon="auto_awesome">Hire with AI</Button>
                                    </Link>
                                ) : undefined
                            }
                            secondary={
                                canAccess("jobs:create") ? (
                                    <Link href="/enterprise/jobs/create">
                                        <Button variant="secondary" icon="add">Post a job</Button>
                                    </Link>
                                ) : undefined
                            }
                        />
                    ) : (
                        <EmptyState
                            tone="muted"
                            icon="search_off"
                            title="No jobs match your filters"
                            description="Try adjusting your filters or search terms to find what you're looking for."
                            action={
                                <Button
                                    variant="secondary"
                                    onClick={() => { setSearchQuery(""); setActiveTab("ALL"); setSelectedCompanyId("ALL"); }}
                                >
                                    Clear all filters
                                </Button>
                            }
                        />
                    )
                ) : (
                    <>
                        {/* Column header (desktop) */}
                        <div className="hidden md:grid grid-cols-[2.4fr_1.2fr_0.9fr_1fr_120px] gap-4 px-5 py-3 bg-[#F7F8FA] border-b border-[#E8EAED]">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Position</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Location</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Experience</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Status</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Actions</span>
                        </div>

                        <div className="divide-y divide-[#F0F0F1]">
                            {filteredJobs.map((job, index) => (
                                <div
                                    key={job.id}
                                    className="grid grid-cols-[1fr_auto] md:grid-cols-[2.4fr_1.2fr_0.9fr_1fr_120px] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#F7F7F8] transition-colors group"
                                >
                                    {/* Position */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                                            <Briefcase className="w-[17px] h-[17px]" />
                                        </span>
                                        <div className="min-w-0">
                                            <Link href={`/enterprise/jobs/${job.id}`} className="block text-[14px] font-bold text-[#15171C] group-hover:text-[#5B53E0] transition-colors truncate">
                                                {job.title}
                                            </Link>
                                            {/* mobile-only meta */}
                                            <div className="flex items-center gap-2.5 mt-0.5 text-[12px] text-[#8A929E] md:hidden">
                                                <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location || "Remote"}</span>
                                                <span className={jetbrainsMono.className}>{job.experience_min || 0}–{job.experience_max || 5}y</span>
                                            </div>
                                            <span className="hidden md:block text-[11px] text-[#C7CCD4] mt-0.5">#{job.id.substring(0, 8)}</span>
                                        </div>
                                    </div>

                                    {/* Location (desktop) */}
                                    <div className="hidden md:flex items-center gap-1.5 text-[13px] text-[#374151] min-w-0">
                                        <MapPin className="w-4 h-4 text-[#9AA3AF] shrink-0" />
                                        <span className="truncate">{job.location || "Remote"}</span>
                                    </div>

                                    {/* Experience (desktop) */}
                                    <div className={`hidden md:block text-[13px] text-[#374151] ${jetbrainsMono.className}`}>
                                        {job.experience_min || 0}–{job.experience_max || 5} yrs
                                    </div>

                                    {/* Status */}
                                    <div className="hidden md:flex items-center">{statusBadge(job.status_id)}</div>

                                    {/* Status + actions (single cell on mobile, actions cell on desktop) */}
                                    <div className="flex items-center gap-1 justify-end">
                                        <div className="md:hidden mr-1">{statusBadge(job.status_id)}</div>

                                        <button
                                            onClick={() => copyLink(job.id)}
                                            className={`w-9 h-9 flex items-center justify-center rounded-[9px] transition-colors border border-transparent ${copiedJobId === job.id ? "bg-[#E6F4EA] text-[#15803D]" : "text-[#9AA3AF] hover:bg-[#F1F2F5] hover:text-[#374151]"}`}
                                            title="Copy JD link"
                                        >
                                            {copiedJobId === job.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>

                                        {canAccess("jobs:update") && (
                                            <Link href={`/enterprise/jobs/${job.id}/edit`} className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#ECEBFB] hover:text-[#5B53E0] transition-colors" title="Edit job">
                                                <FileEdit className="w-4 h-4" />
                                            </Link>
                                        )}

                                        <div className="relative group/menu">
                                            <button className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#F1F2F5] hover:text-[#374151] transition-colors" title="More">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                            <div className={`absolute right-0 w-48 bg-white rounded-[12px] shadow-[0_14px_34px_rgba(15,23,42,0.16)] border border-[#E8EAED] py-1.5 z-50 invisible group-hover/menu:visible opacity-0 group-hover/menu:opacity-100 transition-all ${index >= filteredJobs.length - 2 ? "bottom-full mb-2" : "top-full mt-2"}`}>
                                                <button
                                                    onClick={() => setPublishModal({ isOpen: true, jobId: job.id, jobTitle: job.title })}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-[#5B53E0] hover:bg-[#ECEBFB] transition-colors"
                                                >
                                                    <GlobeIcon className="w-4 h-4" /> Publish job
                                                </button>
                                                <button onClick={() => {}} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-[#374151] hover:bg-[#F4F5F7] transition-colors">
                                                    <Plus className="w-4 h-4" /> Post template
                                                </button>
                                                {canAccess("jobs:delete") && (
                                                    <button
                                                        onClick={() => handleDeleteJob(job.id)}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-[#C0383C] hover:bg-[#FDECEC] transition-colors"
                                                    >
                                                        <Archive className="w-4 h-4" /> Delete job
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

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
