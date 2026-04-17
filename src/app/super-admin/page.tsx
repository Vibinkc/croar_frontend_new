"use client";

import { useEffect, useState, Suspense } from "react";
import { apiClient } from "@/utils/api";
import Link from "next/link";

function SuperAdminDashboardContent() {
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await apiClient.get("/api/v1/super-admin/stats");
                if (res.ok) {
                    setStats(await res.json());
                }
            } catch (e) {
                console.error("Failed to fetch platform stats", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    const statCards = [
        { label: "Total Organizations", value: stats?.tenants || 0, icon: "corporate_fare", color: "bg-indigo-600", trend: "+2 this month" },
        { label: "Total Platform Users", value: stats?.users || 0, icon: "groups", color: "bg-emerald-600", trend: "+12% growth" },
        { label: "Global System Roles", value: stats?.global_roles || 0, icon: "security", color: "bg-slate-900", trend: "System Default" },
        { label: "System Health", value: stats?.system_status || "Operational", icon: "dns", color: "bg-amber-500", trend: "Latency: 24ms" },
    ];

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header / Title */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Platform Overview</h1>
                <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Platform Status
                </div>
            </div>

            {/* Welcome Section */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1 italic">Welcome, Root Admin</h2>
                <p className="text-sm text-slate-500 font-medium">Platform-wide analytics and system controls for Croar.ai</p>
            </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        {statCards.map((stat, i) => (
                            <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                                <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center text-white mb-3 shadow-lg shadow-slate-100 group-hover:scale-110 transition-transform`}>
                                    <span className="material-icons-outlined text-xl">{stat.icon}</span>
                                </div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</h3>
                                <div className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</div>
                                <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">
                                    {stat.trend}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions & Recent Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
                        {/* Quick Actions */}
                        <div className="lg:col-span-2 space-y-5">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Administrative Actions</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Link href="/super-admin/organizations" className="flex items-center gap-3 p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-900 transition-all group">
                                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                                        <span className="material-icons-outlined text-sm">add_business</span>
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 text-xs">Provision New Org</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Spin up dedicated node</p>
                                    </div>
                                </Link>

                                <Link href="/super-admin/roles" className="flex items-center gap-3 p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-900 transition-all group">
                                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                                        <span className="material-icons-outlined text-sm">security</span>
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 text-xs">Global RBAC Editor</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Manage platform roles</p>
                                    </div>
                                </Link>
 
                                <Link href="/super-admin/colleges/list" className="flex items-center gap-3 p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-900 transition-all group">
                                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                                        <span className="material-icons-outlined text-sm">storage</span>
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 text-xs">Instances Monitor</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Database health check</p>
                                    </div>
                                </Link>

                                <button className="flex items-center gap-3 p-5 bg-slate-900 rounded-2xl text-white hover:bg-slate-800 transition-all group text-left">
                                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                                        <span className="material-icons-outlined text-sm">backup</span>
                                    </div>
                                    <div>
                                        <p className="font-black text-white text-xs">Platform Backup</p>
                                        <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest italic">Snapshot system state</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="space-y-5">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Audit Logs</h3>
                            <div className="bg-white rounded-3xl border border-slate-200 p-5 divide-y divide-slate-50">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="py-4 first:pt-0 last:pb-0">
                                        <div className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                            <div>
                                                <p className="text-[11px] font-bold text-slate-800 leading-snug tracking-tight">Organization "TechCorp" was provisioned by root_admin.</p>
                                                <p className="text-[9px] text-slate-400 font-medium mt-1 uppercase tracking-widest">45 minutes ago</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button className="w-full mt-6 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-slate-50 rounded-xl transition-all">
                                    View Detailed Logs
                                </button>
                            </div>
                        </div>
                </div>
            </div>
    );
}

export default function SuperAdminDashboard() {
    return (
        <Suspense fallback={<div className="p-8">Loading System Metrics...</div>}>
            <SuperAdminDashboardContent />
        </Suspense>
    );
}
