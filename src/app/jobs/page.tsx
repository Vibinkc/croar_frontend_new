"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BACKEND_URL } from "@/utils/api";
import {
    Search,
    MapPin,
    Briefcase,
    Building2,
    ChevronRight,
    Filter,
    LayoutGrid,
    List,
    ArrowUpRight,
    Globe,
    Zap,
    Clock,
    DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PublicJob {
    id: string;
    title: string;
    description: string;
    job_type?: string;
    work_mode?: string;
    location?: string;
    experience_min?: number;
    experience_max?: string | number;
    salary_min?: number;
    salary_max?: number;
    salary_currency?: string;
    salary_frequency?: string;
    required_skills?: string[];
    company?: {
        name: string;
        logo_url?: string;
        slug: string;
    };
    created_at: string;
}

function JobPortalContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const companyId = searchParams.get("company_id");
    const companySlug = searchParams.get("company");

    const [jobs, setJobs] = useState<PublicJob[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [selectedType, setSelectedType] = useState<string>("ALL");
    const [selectedLocation, setSelectedLocation] = useState<string>("ALL");

    useEffect(() => {
        fetchJobs();
    }, [companyId, companySlug]);

    const fetchJobs = async () => {
        setIsLoading(true);
        try {
            let url = `${BACKEND_URL}/api/v1/enterprise/public/jobs/list`;
            const params = new URLSearchParams();
            if (companyId) params.append("company_id", companyId);
            if (companySlug) params.append("company_slug", companySlug);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setJobs(Array.isArray(data) ? data : (data?.jobs ?? []));
            }
        } catch (error) {
            console.error("Error fetching jobs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = (job.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.location?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType === "ALL" || job.job_type === selectedType;
        const matchesLocation = selectedLocation === "ALL" || job.location === selectedLocation;
        return matchesSearch && matchesType && matchesLocation;
    });

    const locations = Array.from(new Set(jobs.map(j => j.location).filter(Boolean)));
    const jobTypes = Array.from(new Set(jobs.map(j => j.job_type).filter(Boolean)));

    const companyInfo = jobs.length > 0 ? jobs[0].company : null;

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* Header / Navbar */}
            <nav className="fixed top-0 left-0 right-0 bg-white/70 backdrop-blur-xl border-b border-slate-100 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                            {companyInfo?.logo_url ? (
                                <img src={companyInfo.logo_url} alt="Logo" className="w-8 h-8 object-contain" />
                            ) : (
                                <span className="text-white font-black text-xl">
                                    {companyInfo?.name?.[0] || "C"}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900 leading-tight">Career Portal</span>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{companyInfo?.name || "Our Organization"}</span>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#" className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors">Jobs</a>
                        <a href="#" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">About</a>
                        <a href="#" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Teams</a>
                        <button className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-600 transition-all">
                            Sign In
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-40 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full -mr-64 -mt-64 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-50/30 rounded-full -ml-64 -mb-64 blur-3xl" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[11px] font-black uppercase tracking-[0.2em] rounded-full mb-6 inline-block">
                            Join Our Mission
                        </span>
                        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-8 leading-[1.05]">
                            Shape the future with <span className="text-indigo-600">{companyInfo?.name || "Us"}</span>
                        </h1>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto mb-12">
                            We're looking for passionate individuals to join our team and build amazing things together. Browse our open positions below.
                        </p>
                    </motion.div>

                    {/* Main Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-white p-2 rounded-[32px] shadow-2xl shadow-indigo-100 border border-slate-100 flex flex-col md:flex-row items-center gap-2"
                    >
                        <div className="flex-1 flex items-center px-6 gap-3 w-full">
                            <Search className="w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by job title or keyword..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full py-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none"
                            />
                        </div>
                        <div className="h-8 w-px bg-slate-100 hidden md:block" />
                        <div className="flex-[0.7] flex items-center px-6 gap-3 w-full">
                            <MapPin className="w-5 h-5 text-slate-400" />
                            <select
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                className="w-full py-4 text-sm font-bold text-slate-900 bg-transparent outline-none appearance-none"
                            >
                                <option value="ALL">Any Location</option>
                                {locations.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>
                        <button className="w-full md:w-auto bg-indigo-600 text-white px-10 py-4 rounded-[24px] font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                            Find Jobs
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* Filter & View Toggle */}
            <div className="max-w-7xl mx-auto px-6 mb-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-100 pb-8">
                    <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 md:pb-0 w-full md:w-auto">
                        <button
                            onClick={() => setSelectedType("ALL")}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${selectedType === "ALL" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white text-slate-500 border border-slate-100 hover:border-indigo-100"}`}
                        >
                            All Positions
                        </button>
                        {jobTypes.map(type => (
                            <button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${selectedType === type ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white text-slate-500 border border-slate-100 hover:border-indigo-100"}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-slate-400">{filteredJobs.length} Positions Available</span>
                        <div className="flex items-center p-1 bg-white border border-slate-100 rounded-xl">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${viewMode === "grid" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"}`}
                            >
                                <LayoutGrid className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${viewMode === "list" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"}`}
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Jobs List */}
            <main className="max-w-7xl mx-auto px-6 pb-32">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-64 bg-white rounded-[32px] border border-slate-100 animate-pulse" />
                        ))}
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="text-center py-32 bg-white rounded-[40px] border border-slate-100">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Search className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">No matching jobs</h3>
                        <p className="text-slate-500 font-medium max-w-sm mx-auto">Try adjusting your search or filters to find what you're looking for.</p>
                    </div>
                ) : (
                    <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-6"}>
                        {filteredJobs.map((job, idx) => (
                            <motion.div
                                key={job.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => router.push(`/jobs/${job.id}`)}
                                className={`group cursor-pointer bg-white rounded-[32px] border border-slate-100 p-8 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 relative overflow-hidden ${viewMode === "list" ? "flex items-center gap-8 py-6" : ""}`}
                            >
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-indigo-100 transition-colors" />

                                {viewMode === "grid" ? (
                                    <>
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-500">
                                                <Briefcase className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors duration-500" />
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{job.job_type || "Full Time"}</span>
                                                <span className="text-[10px] font-bold text-emerald-500 mt-1">NEW</span>
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-black text-slate-900 mb-4 group-hover:text-indigo-600 transition-colors leading-tight">{job.title}</h3>

                                        <div className="flex flex-wrap gap-4 text-slate-400 font-bold text-xs mb-8">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-slate-300" />
                                                {job.location || "Remote"}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-slate-300" />
                                                {job.experience_min || 0}-{job.experience_max || 5} Yrs
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 uppercase">Salary</span>
                                                <span className="text-sm font-black text-slate-900">
                                                    {job.salary_min ? `${job.salary_currency || 'INR'} ${job.salary_min.toLocaleString()}` : 'Competitive'}
                                                </span>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <ArrowUpRight className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 transition-colors duration-500">
                                            <Briefcase className="w-7 h-7 text-slate-400 group-hover:text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{job.title}</h3>
                                            <div className="flex items-center gap-6 mt-2">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                                    <MapPin className="w-4 h-4 text-slate-300" />
                                                    {job.location || "Remote"}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                                    <Building2 className="w-4 h-4 text-slate-300" />
                                                    {job.job_type || "Full Time"}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                                    <DollarSign className="w-4 h-4 text-slate-300" />
                                                    {job.salary_min ? `${job.salary_currency || 'INR'} ${job.salary_min.toLocaleString()}` : 'Competitive'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-black text-slate-300 uppercase">Posted 2d ago</span>
                                            <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs group-hover:bg-indigo-600 transition-all">
                                                Apply Now
                                            </button>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-100 pt-24 pb-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl">
                                    {companyInfo?.name?.[0] || "C"}
                                </div>
                                <span className="text-xl font-black text-slate-900 tracking-tight">{companyInfo?.name || "Croar"}</span>
                            </div>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                Join the leading team in technology and innovation. We build solutions that matter.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">Teams</h4>
                            <ul className="space-y-4">
                                {['Engineering', 'Product', 'Design', 'Marketing'].map(t => (
                                    <li key={t}><a href="#" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">{t}</a></li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">Company</h4>
                            <ul className="space-y-4">
                                {['About Us', 'Culture', 'Benefits', 'FAQ'].map(t => (
                                    <li key={t}><a href="#" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">{t}</a></li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">Resources</h4>
                            <ul className="space-y-4">
                                {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Contact'].map(t => (
                                    <li key={t}><a href="#" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">{t}</a></li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            © 2026 {companyInfo?.name || "Croar"}. All Rights Reserved.
                        </p>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-xs font-black text-indigo-600">
                                <Globe className="w-4 h-4" />
                                English (US)
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default function JobPortalPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
                <div className="animate-spin material-icons-outlined text-indigo-600 text-4xl">sync</div>
            </div>
        }>
            <JobPortalContent />
        </Suspense>
    );
}
