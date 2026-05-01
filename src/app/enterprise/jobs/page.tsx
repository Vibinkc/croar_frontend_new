"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { 
    Briefcase, 
    CheckCircle2, 
    FileEdit, 
    Archive, 
    LayoutGrid,
    Search,
    Building2,
    MapPin,
    Tag,
    Filter,
    Plus,
    Clock,
    Zap,
    List,
    ChevronDown,
    Building,
    Copy,
    Check
} from "lucide-react";
import { motion } from "framer-motion";
import PublishJobModal from "@/components/enterprise/PublishJobModal";
import { Globe as GlobeIcon } from "lucide-react";

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

    const tabs: { id: TabStatus, label: string, count: number }[] = [
        { id: "ALL", label: "All Jobs", count: stats.total },
        { id: "ACTIVE", label: "Active", count: stats.active },
        { id: "DRAFTS", label: "Drafts", count: stats.drafts },
        { id: "CLOSED", label: "Closed", count: stats.closed },
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 bg-[#F8FAFC] min-h-screen">
            {/* Header Section */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Job Board</h1>
                    <p className="text-sm font-medium text-slate-400">Manage your pipeline & open positions</p>
                </div>
                {canAccess("jobs:create") && (
                    <Link
                        href="/enterprise/jobs/create"
                        className="bg-[#7C3AED] text-white px-6 py-3 rounded-xl font-black text-xs hover:bg-[#6D28D9] shadow-xl shadow-indigo-100 transition-all flex items-center gap-2 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Create New Position
                    </Link>
                )}
            </div>

            {/* Stat Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Positions */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setActiveTab("ALL")}
                    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between min-h-[140px]"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-colors group-hover:text-indigo-400">Total Positions</span>
                        <div className="w-12 h-12 rounded-xl bg-indigo-50/50 text-indigo-500 flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-indigo-50">
                            <Briefcase className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="text-4xl font-black text-slate-900 mt-auto leading-none">
                        {stats.total}
                    </div>
                </motion.div>

                {/* Active Jobs */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => setActiveTab("ACTIVE")}
                    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between min-h-[140px]"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-colors group-hover:text-emerald-500">Active Jobs</span>
                        <div className="w-12 h-12 rounded-xl bg-emerald-50/50 text-emerald-500 flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-emerald-50">
                            <Zap className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="text-4xl font-black text-slate-900 mt-auto leading-none">
                        {stats.active}
                    </div>
                </motion.div>

                {/* Draft Postings */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => setActiveTab("DRAFTS")}
                    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between min-h-[140px]"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-colors group-hover:text-amber-500">Draft Postings</span>
                        <div className="w-12 h-12 rounded-xl bg-amber-50/50 text-amber-500 flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-amber-50">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="text-4xl font-black text-slate-900 mt-auto leading-none">
                        {stats.drafts}
                    </div>
                </motion.div>

                {/* Closed/Filled */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => setActiveTab("CLOSED")}
                    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between min-h-[140px]"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-colors group-hover:text-rose-500">Closed/Filled</span>
                        <div className="w-12 h-12 rounded-xl bg-rose-50/50 text-rose-500 flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-rose-50">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="text-4xl font-black text-slate-900 mt-auto leading-none">
                        {stats.closed}
                    </div>
                </motion.div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-4">
                {/* Search Bar */}
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#7C3AED] transition-colors" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by title, location or keywords..."
                        className="w-full bg-white border border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-[#7C3AED] transition-all shadow-sm"
                    />
                </div>

                {/* Grid/List Toggle */}
                <div className="flex items-center p-1.5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-[#7C3AED] shadow-sm">
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-white/50 transition-all">
                        <List className="w-5 h-5" />
                    </button>
                </div>

                {/* Dropdowns */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <Building2 className="w-4 h-4" />
                        </div>
                        <select 
                            value={selectedCompanyId}
                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                            className="bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-9 pr-10 text-xs font-bold text-slate-600 outline-none appearance-none cursor-pointer hover:bg-white transition-all shadow-sm min-w-[140px]"
                        >
                            <option value="ALL">All Clients</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <Filter className="w-4 h-4" />
                        </div>
                        <select 
                            value={activeTab}
                            onChange={(e) => setActiveTab(e.target.value as TabStatus)}
                            className="bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-9 pr-10 text-xs font-bold text-slate-600 outline-none appearance-none cursor-pointer hover:bg-white transition-all shadow-sm min-w-[140px]"
                        >
                            <option value="ALL">Any Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="DRAFTS">Draft</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden min-h-[500px]">
                {isLoading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                            <Briefcase className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">No jobs available</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mb-8">Try adjusting your filters or search terms to find what you&apos;re looking for.</p>
                        <button onClick={() => { setSearchQuery(""); setActiveTab("ALL"); setSelectedCompanyId("ALL"); }} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm">Clear All Filters</button>
                    </div>
                ) : (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-wider">Position Name</th>
                                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-wider">Experience</th>
                                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-[11px] font-black text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredJobs.map((job, index) => (
                                <tr key={job.id} className="hover:bg-slate-50/30 transition-all group">
                                    <td className="px-6 py-5">
                                        <Link href={`/enterprise/jobs/${job.id}`}>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900 group-hover:text-[#7C3AED] transition-all cursor-pointer">{job.title}</span>
                                                <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">#{job.id.substring(0, 8)}</span>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <MapPin className="w-4 h-4" />
                                            <span className="text-xs font-bold">{job.location || "Remote"}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-[11px] font-black text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                            {job.experience_min || 0}-{job.experience_max || '5'} YRS
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        {job.status_id === 2 ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black border border-emerald-100">
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                                ACTIVE
                                            </span>
                                        ) : job.status_id === 1 ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-500 text-[10px] font-black border border-slate-200">
                                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                                DRAFT
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-500 text-[10px] font-black border border-rose-100">
                                                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                                                CLOSED
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            {/* Copy Link Button */}
                                            <button 
                                                onClick={async () => {
                                                    const url = `${window.location.origin}/jobs/${job.id}`;
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
                                                        setCopiedJobId(job.id);
                                                        setTimeout(() => setCopiedJobId(null), 2000);
                                                    } catch (err) {
                                                        console.error("Failed to copy: ", err);
                                                    }
                                                }}
                                                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all border border-transparent ${copiedJobId === job.id ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600 hover:border-slate-200"}`}
                                                title="Copy JD Link"
                                            >
                                                {copiedJobId === job.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            </button>

                                            {canAccess("jobs:update") && (
                                                <Link href={`/enterprise/jobs/${job.id}/edit`} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-[#7C3AED]/5 hover:text-[#7C3AED] transition-all border border-transparent hover:border-indigo-100" title="Edit Job">
                                                    <FileEdit className="w-4 h-4" />
                                                </Link>
                                            )}
                                            
                                            <div className="relative group/menu">
                                                <button className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                                                    <Tag className="w-4 h-4" />
                                                </button>
                                                <div className={`absolute right-0 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 invisible group-hover/menu:visible opacity-0 group-hover/menu:opacity-100 transition-all scale-95 group-hover/menu:scale-100 flex flex-col ${index >= filteredJobs.length - 2 ? "bottom-full mb-2 origin-bottom-right" : "top-full mt-2 origin-top-right"}`}>
                                                    <button 
                                                        onClick={() => setPublishModal({ isOpen: true, jobId: job.id, jobTitle: job.title })} 
                                                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-indigo-600 hover:bg-indigo-50 transition-all"
                                                    >
                                                        <GlobeIcon className="w-4 h-4" />
                                                        Publish Job
                                                    </button>
                                                    <button onClick={() => {}} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-slate-600 hover:bg-slate-50 hover:text-[#7C3AED] transition-all">
                                                        <Plus className="w-4 h-4" />
                                                        Post Template
                                                    </button>
                                                    {canAccess("jobs:delete") && (
                                                        <button onClick={() => { if(confirm("Delete job?")) {} }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-rose-500 hover:bg-rose-50 transition-all">
                                                            <Archive className="w-4 h-4" />
                                                            Delete Job
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
