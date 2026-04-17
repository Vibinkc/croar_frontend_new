"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";

interface Company {
    id: string;
    name: string;
    industry: string;
    location: string;
    logo_url: string;
    created_at: string;
}

interface Analytics {
    active_jobs: number;
    total_candidates: number;
    avg_match_score: number;
    sourcing_efficiency: number;
    recent_jobs: any[];
    recent_activity: any[];
}

interface GlobalStats {
    total_companies: number;
    total_jobs: number;
    active_nodes: number;
}

export default function CompaniesPage() {
    const { token, canAccess } = useAuth();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [companyAnalytics, setCompanyAnalytics] = useState<Analytics | null>(null);
    const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

    const [newCompany, setNewCompany] = useState({
        name: "",
        industry: "",
        location: ""
    });

    const fetchGlobalStats = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/company/stats`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setGlobalStats(data);
            }
        } catch (error) {
            console.error("Error fetching global stats:", error);
        }
    }, [token]);

    const fetchCompanies = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
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
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        const loadInitialData = async () => {
            if (token) {
                // Fetch sequentially to avoid potential locking/parallel request issues
                await fetchGlobalStats();
                await fetchCompanies();
            }
        };
        loadInitialData();
    }, [token, fetchGlobalStats, fetchCompanies]);

    const fetchAnalytics = async (companyId: string) => {
        setIsAnalyticsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/company/${companyId}/analytics`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setCompanyAnalytics(data);
            }
        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setIsAnalyticsLoading(false);
        }
    };

    const handleAddCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/company/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(newCompany)
            });
            if (res.ok) {
                setShowAddModal(false);
                setNewCompany({ name: "", industry: "", location: "" });
                await fetchCompanies();
                await fetchGlobalStats();
            }
        } catch (error) {
            console.error("Error adding company:", error);
        }
    };

    return (
        <div className="p-8 space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto">
            {/* Page Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Strategic Partners</h1>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-3">Consultancy Node Network & Partnership Management</p>
                </div>
                {canAccess("platform:moderate") && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="self-start md:self-center px-8 py-4 bg-[#7C3AED] text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-[#6D28D9] transition-all shadow-2xl shadow-indigo-200 flex items-center gap-3 group active:scale-95"
                    >
                        <span className="material-symbols-rounded text-xl group-hover:rotate-90 transition-transform">add</span>
                        Onboard_Strategic_Partner
                    </button>
                )}
            </header>

            {/* Overall Analytics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Strategic Partners", value: globalStats?.total_companies ?? "--", icon: "corporate_fare", color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Active Jobs Sync", value: globalStats?.total_jobs ?? "--", icon: "business_center", color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Network Health", value: globalStats ? "Live" : "--", icon: "rocket_launch", color: "text-amber-600", bg: "bg-amber-50" }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-6 group hover:border-indigo-100 transition-all shadow-sm"
                    >
                        <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                            <span className="material-symbols-rounded text-3xl">{stat.icon}</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <h4 className="text-2xl font-black text-slate-900 mt-0.5">{stat.value}</h4>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Content Section */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-white border border-slate-50 rounded-[3rem] animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {companies.map((company, i) => (
                        <motion.div
                            key={company.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white border-2 border-slate-50 p-10 rounded-[3rem] shadow-sm hover:shadow-2xl hover:border-indigo-100 hover:-translate-y-2 transition-all group overflow-hidden relative cursor-pointer"
                            onClick={() => {
                                setSelectedCompany(company);
                                fetchAnalytics(company.id);
                            }}
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-16 h-16 bg-slate-50 rounded-[1.25rem] flex items-center justify-center text-[#7C3AED] border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                    <span className="material-symbols-rounded text-3xl">corporate_fare</span>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">Live_Node</span>
                                </div>
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-1.5 group-hover:text-[#7C3AED] transition-colors">{company.name}</h3>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-8">{company.industry || "Global Operations"}</p>

                            <div className="flex items-center gap-6 pt-8 border-t border-slate-50/80">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <span className="material-symbols-rounded text-lg">location_on</span>
                                    <span className="text-[10px] font-black uppercase tracking-wider">{company.location || "Headquarters"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400">
                                    <span className="material-symbols-rounded text-lg">calendar_today</span>
                                    <span className="text-[10px] font-black uppercase tracking-wider">{new Date(company.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Hover Action Blob */}
                            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-[#7C3AED]/5 rounded-full blur-2xl group-hover:bg-[#7C3AED]/10 transition-all"></div>
                            <div className="absolute bottom-10 right-10 w-12 h-12 bg-[#7C3AED] text-white rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl">
                                <span className="material-symbols-rounded">insights</span>
                            </div>
                        </motion.div>
                    ))}

                    {companies.length === 0 && (
                        <div className="col-span-full py-24 text-center bg-slate-50/50 rounded-[4rem] border-4 border-dashed border-slate-100">
                            <span className="material-symbols-rounded text-7xl text-slate-200 mb-6">explore</span>
                            <h3 className="text-2xl font-black text-slate-400 uppercase tracking-tighter">No strategic partners detected</h3>
                            <p className="text-slate-300 font-bold mt-2 uppercase text-xs tracking-widest">Begin by onboarding your first professional partner node</p>
                        </div>
                    )}
                </div>
            )}

            {/* FULL PAGE ANALYTICS VIEW */}
            <AnimatePresence>
                {selectedCompany && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-white overflow-y-auto"
                    >
                        {/* Status Bar */}
                        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-12 py-6 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setSelectedCompany(null)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#7C3AED] hover:text-[#6D28D9] bg-indigo-50 px-4 py-2 rounded-xl transition-all">
                                    <span className="material-symbols-rounded text-sm">arrow_back</span>
                                    Back_to_Grid
                                </button>
                                <span className="text-slate-200 font-black">/</span>
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-tighter">{selectedCompany.name}</h2>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Live_Synchronization
                                </div>
                            </div>
                        </div>

                        <div className="max-w-6xl mx-auto p-12 lg:p-20">
                            {/* Summary Header */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-start mb-20 animate-in slide-in-from-bottom duration-700">
                                <div className="lg:col-span-2">
                                    <div className="flex items-center gap-4 mb-4 text-[#7C3AED]">
                                        <span className="material-symbols-rounded">business</span>
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Enterprise Partner Profile</span>
                                    </div>
                                    <h2 className="text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9] mb-8">{selectedCompany.name}</h2>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Vertical / Industry</p>
                                            <p className="font-bold text-slate-800 uppercase tracking-tight">{selectedCompany.industry || "Global Operations"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Primary Node</p>
                                            <p className="font-bold text-slate-800 uppercase tracking-tight">{selectedCompany.location || "Global HQ"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Management Since</p>
                                            <p className="font-bold text-slate-800 uppercase tracking-tight">{new Date(selectedCompany.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col justify-between h-full shadow-2xl shadow-indigo-200">
                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Internal Meta Tag</h4>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold uppercase tracking-wider">Enterprise_Level</span>
                                            <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold uppercase tracking-wider">Automated_Sync</span>
                                        </div>
                                    </div>
                                    <div className="mt-12">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">System Status</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-white">ACTIVE</span>
                                            <span className="text-emerald-400 font-bold uppercase text-[10px] tracking-widest">Healthy</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {isAnalyticsLoading ? (
                                <div className="py-40 flex items-center justify-center">
                                    <div className="w-16 h-16 border-8 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : companyAnalytics ? (
                                <div className="space-y-24 animate-in fade-in slide-in-from-bottom duration-1000">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {[
                                            { label: "Active Jobs", value: companyAnalytics.active_jobs, icon: "business_center", bg: "bg-indigo-50", text: "text-indigo-600" },
                                            { label: "Active Pipeline", value: companyAnalytics.total_candidates, icon: "groups", bg: "bg-emerald-50", text: "text-emerald-600" },
                                            { label: "Avg. Match", value: `${companyAnalytics.avg_match_score}%`, icon: "bolt", bg: "bg-amber-50", text: "text-amber-600" },
                                            { label: "Efficiency", value: `${companyAnalytics.sourcing_efficiency}%`, icon: "verified", bg: "bg-rose-50", text: "text-rose-600" },
                                        ].map((s, idx) => (
                                            <div key={idx} className="bg-white border border-slate-100 p-8 rounded-[2.5rem] flex flex-col gap-4">
                                                <div className={`w-12 h-12 ${s.bg} ${s.text} rounded-2xl flex items-center justify-center`}>
                                                    <span className="material-symbols-rounded text-2xl">{s.icon}</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{s.value}</h4>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Detailed Sections */}
                                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
                                        <div className="lg:col-span-3 space-y-12">
                                            <div>
                                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-8 border-b border-slate-100 pb-4">Latest Opportunities</h3>
                                                <div className="space-y-4">
                                                    {(companyAnalytics.recent_jobs || []).map((job: any) => (
                                                        <div key={job.id} className="group flex items-center justify-between p-6 bg-slate-50/50 hover:bg-indigo-50 rounded-[2rem] border border-transparent hover:border-indigo-100 transition-all cursor-pointer">
                                                            <div className="flex items-center gap-6">
                                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors shadow-sm">
                                                                    <span className="material-symbols-rounded">work</span>
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-900 transition-colors">{job.title}</h4>
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Posted on {new Date(job.created_at).toLocaleDateString()}</p>
                                                                </div>
                                                            </div>
                                                            <span className="material-symbols-rounded text-slate-300 group-hover:text-indigo-400 transition-all group-hover:translate-x-1">arrow_forward_ios</span>
                                                        </div>
                                                    ))}
                                                    {(companyAnalytics.recent_jobs || []).length === 0 && (
                                                        <div className="py-12 text-center text-slate-400 font-bold uppercase text-[11px] tracking-widest italic">No active requisitions found</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="lg:col-span-2 space-y-12">
                                            <div>
                                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-8 border-b border-slate-100 pb-4">KPI Performance</h3>
                                                <div className="space-y-10">
                                                    {[
                                                        { label: "Sourcing Radius", val: companyAnalytics.sourcing_efficiency, color: "bg-indigo-600" },
                                                        { label: "Candidate Match", val: companyAnalytics.avg_match_score, color: "bg-[#7C3AED]" },
                                                        { label: "Data Integrity", val: 100, color: "bg-emerald-500" }
                                                    ].map((m, idx) => (
                                                        <div key={idx} className="space-y-4">
                                                            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-slate-400">
                                                                <span>{m.label}</span>
                                                                <span className="text-slate-900">{m.val}%</span>
                                                            </div>
                                                            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden p-1">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${m.val}%` }}
                                                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                                                    className={`h-full ${m.color} rounded-full`}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-[#7C3AED] p-10 rounded-[3rem] text-white">
                                                <h4 className="text-3xl font-black mb-1">DATA SYNC</h4>
                                                <p className="text-[11px] font-black uppercase tracking-widest opacity-80">Connected to Enterprise DB</p>
                                                <div className="mt-8 pt-8 border-t border-white/20">
                                                    <p className="text-xs font-medium leading-relaxed italic opacity-90">"Live telemetry active. All metrics reflect current database state."</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Company Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-6"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white w-full max-w-xl rounded-[4rem] p-16 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] relative overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4 uppercase leading-none text-center">Onboard Partner</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-12 text-center">Synchronize new professional node to consultancy network</p>

                            <form onSubmit={handleAddCompany} className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Enterprise Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-8 py-5 rounded-[2rem] bg-slate-50 border border-slate-100 font-bold text-slate-900 focus:bg-white focus:border-[#7C3AED] focus:ring-8 focus:ring-[#7C3AED]/5 outline-none transition-all shadow-inner"
                                        placeholder="e.g. Acme Global Innovations"
                                        value={newCompany.name}
                                        onChange={e => setNewCompany({ ...newCompany, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Vertical</label>
                                        <input
                                            type="text"
                                            className="w-full px-8 py-5 rounded-[2rem] bg-slate-50 border border-slate-100 font-bold text-slate-900 focus:bg-white focus:border-[#7C3AED] outline-none transition-all shadow-inner"
                                            placeholder="Fintech"
                                            value={newCompany.industry}
                                            onChange={e => setNewCompany({ ...newCompany, industry: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">HQ Location</label>
                                        <input
                                            type="text"
                                            className="text-xs w-full px-8 py-5 rounded-[2rem] bg-slate-50 border border-slate-100 font-bold text-slate-900 focus:bg-white focus:border-[#7C3AED] outline-none transition-all shadow-inner"
                                            placeholder="London, UK"
                                            value={newCompany.location}
                                            onChange={e => setNewCompany({ ...newCompany, location: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-2xl shadow-indigo-100 mt-6 active:scale-95">
                                    Initialize_Partner_Node
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
