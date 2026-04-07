"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";

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
    const { token } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<TabStatus>("ALL");
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("ALL");
    const [selectedLocation, setSelectedLocation] = useState<string>("ALL");
    const [selectedType, setSelectedType] = useState<string>("ALL");

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
                const data = await res.json();
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
                const data = await res.json();
                setJobs(data);
            }
        } catch (error) {
            console.error("Error fetching jobs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const companyFilteredJobs = jobs.filter(j => selectedCompanyId === "ALL" || j.company_id === selectedCompanyId);

    const stats = {
        total: companyFilteredJobs.length,
        active: companyFilteredJobs.filter(j => j.status_id === 2).length,
        drafts: companyFilteredJobs.filter(j => j.status_id === 1).length,
        closed: companyFilteredJobs.filter(j => j.status_id === 3).length
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
        <div className="p-4 space-y-4 pt-2 animate-in fade-in duration-500">
            {/* Ultra-Compact Command Bar */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-30 overflow-x-auto no-scrollbar">

                {/* Search */}
                <div className="relative group min-w-[200px] flex-1">
                    <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-[#7C3AED] transition-colors">search</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search jobs..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-9 pr-3 text-[11px] font-bold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/5 focus:bg-white focus:border-[#7C3AED] transition-all"
                    />
                </div>

                <div className="h-4 w-px bg-slate-200 mx-0.5 flex-shrink-0"></div>

                {/* Company Filter */}
                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-indigo-100 transition-all flex-shrink-0">
                    <span className="material-symbols-rounded text-slate-400 text-base">corporate_fare</span>
                    <select
                        value={selectedCompanyId}
                        onChange={(e) => setSelectedCompanyId(e.target.value)}
                        className="bg-transparent text-[10px] font-black text-slate-600 uppercase tracking-tight outline-none cursor-pointer pr-1"
                    >
                        <option value="ALL">All Clients</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                {/* Location Filter */}
                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-indigo-100 transition-all flex-shrink-0">
                    <span className="material-symbols-rounded text-slate-400 text-base">location_on</span>
                    <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="bg-transparent text-[10px] font-black text-slate-600 uppercase tracking-tight outline-none cursor-pointer pr-1"
                    >
                        <option value="ALL">All Locations</option>
                        {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                </div>

                {/* Type Filter */}
                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-indigo-100 transition-all flex-shrink-0">
                    <span className="material-symbols-rounded text-slate-400 text-base">category</span>
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="bg-transparent text-[10px] font-black text-slate-600 uppercase tracking-tight outline-none cursor-pointer pr-1"
                    >
                        <option value="ALL">All Types</option>
                        {jobTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                {/* Status Filter (Dropdown instead of tabs to save space) */}
                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-indigo-100 transition-all flex-shrink-0">
                    <span className="material-symbols-rounded text-slate-400 text-base">filter_list</span>
                    <select
                        value={activeTab}
                        onChange={(e) => setActiveTab(e.target.value as TabStatus)}
                        className="bg-transparent text-[10px] font-black text-slate-600 uppercase tracking-tight outline-none cursor-pointer pr-1"
                    >
                        {tabs.map(tab => (
                            <option key={tab.id} value={tab.id}>{tab.label} ({tab.count})</option>
                        ))}
                    </select>
                </div>

                <div className="h-4 w-px bg-slate-200 mx-0.5 flex-shrink-0"></div>

                <Link
                    href="/enterprise/jobs/create"
                    className="bg-[#7C3AED] text-white px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-[#6D28D9] shadow-lg shadow-indigo-100 transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap flex-shrink-0"
                >
                    <span className="material-symbols-rounded text-base">add</span>
                    Create_Job
                </Link>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[calc(100vh-12rem)]">
                {isLoading ? (
                    <div className="p-6 space-y-4 flex-1">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-slate-50 h-16 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <span className="material-symbols-rounded text-3xl text-slate-300">work_off</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mb-1">No Jobs Found</h3>
                        <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">
                            There are no jobs matching your current filters.
                        </p>
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-lg hover:bg-slate-200 transition-all">Clear Filters</button>
                        )}
                    </div>
                ) : (
                    <div>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Job Title</th>
                                    <th className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Location</th>
                                    <th className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Experience</th>
                                    <th className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredJobs.map((job, index) => (
                                    <tr key={job.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="px-3 py-1.5">
                                            <Link href={`/enterprise/jobs/${job.id}`}>
                                                <span className="text-xs font-bold text-slate-800 hover:text-[#7C3AED] transition-colors cursor-pointer">{job.title}</span>
                                            </Link>
                                        </td>

                                        <td className="px-3 py-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-rounded text-sm text-slate-400">location_on</span>
                                                <span className="text-xs font-semibold text-slate-600">{job.location || "Remote"}</span>
                                            </div>
                                        </td>

                                        <td className="px-3 py-1.5">
                                            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                                                {job.experience_min || 0}-{job.experience_max || '5'} Yrs
                                            </span>
                                        </td>

                                        <td className="px-3 py-1.5">
                                            {job.status_id === 2 ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-bold border border-emerald-100 uppercase tracking-wide">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    Active
                                                </span>
                                            ) : job.status_id === 1 ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[9px] font-bold border border-slate-200 uppercase tracking-wide">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                    Draft
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 text-[9px] font-bold border border-rose-100 uppercase tracking-wide">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                                                    Closed
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-3 py-1.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={`/enterprise/jobs/${job.id}/edit`}
                                                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-[#7C3AED] hover:bg-[#7C3AED]/5 border border-transparent hover:border-[#7C3AED]/10 flex items-center justify-center transition-all"
                                                    title="Edit Job"
                                                >
                                                    <span className="material-symbols-rounded text-base">edit</span>
                                                </Link>
                                                {job.status_id === 2 && (
                                                    <Link
                                                        href={`/jobs/${job.id}`}
                                                        target="_blank"
                                                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 flex items-center justify-center transition-all"
                                                        title="View Public Page"
                                                    >
                                                        <span className="material-symbols-rounded text-lg">open_in_new</span>
                                                    </Link>
                                                )}

                                                <div className="relative group/menu">
                                                    <button className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 flex items-center justify-center transition-all">
                                                        <span className="material-symbols-rounded text-lg">more_vert</span>
                                                    </button>
                                                    <div className={`absolute right-0 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 invisible group-hover/menu:visible opacity-0 group-hover/menu:opacity-100 transition-all scale-95 group-hover/menu:scale-100 flex flex-col ${index >= filteredJobs.length - 2 ? "bottom-full mb-1 origin-bottom-right" : "top-full mt-1 origin-top-right"}`}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                const url = `${window.location.origin}/jobs/${job.id}`;
                                                                navigator.clipboard.writeText(url);
                                                                alert("Link copied to clipboard.");
                                                            }}
                                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#7C3AED] transition-colors"
                                                        >
                                                            <span className="material-symbols-rounded text-base">link</span>
                                                            Copy Link
                                                        </button>
                                                        <div className="h-px bg-slate-50 mx-3 my-1"></div>
                                                        <button
                                                            onClick={async (e) => {
                                                                e.preventDefault();
                                                                if (confirm("Are you sure you want to delete this job?")) {
                                                                    try {
                                                                        const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${job.id}`, {
                                                                            method: "DELETE",
                                                                            headers: {
                                                                                "Authorization": `Bearer ${token}`
                                                                            }
                                                                        });
                                                                        if (res.ok) fetchJobs();
                                                                    } catch (e) { console.error(e); }
                                                                }
                                                            }}
                                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 transition-colors"
                                                        >
                                                            <span className="material-symbols-rounded text-base">delete</span>
                                                            Delete Job
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
