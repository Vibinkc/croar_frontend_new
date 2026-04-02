"use client";

import { useEffect, useState } from "react";
import { apiClient, FRONTEND_DOMAIN } from "@/utils/api";
import Link from "next/link";

export default function DeployedNodesList() {
    const [colleges, setColleges] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchColleges();
    }, []);

    const fetchColleges = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get("/api/v1/super-admin/tenants");
            if (res.ok) {
                setColleges(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to decommission this node? This action cannot be undone.")) return;
        try {
            const res = await apiClient.delete(`/api/v1/super-admin/tenants/${id}`);
            if (res.ok || res.status === 204) {
                fetchColleges();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const toggleStatus = async (college: any) => {
        try {
            await apiClient.put(`/api/v1/super-admin/tenants/${college.id}`, { is_active: !college.is_active });
            fetchColleges();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/50">
            {/* Header */}
            <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-8 shrink-0 sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">Deployed Cluster Nodes</h1>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-700 leading-tight">Super Administrator</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">System Control</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm border border-slate-200">
                            S
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 lg:p-12">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900">
                                    <span className="material-icons-outlined text-lg">view_list</span>
                                </div>
                                <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">Active Deployments ({colleges.length})</h2>
                            </div>
                            <Link href="/super-admin/colleges" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2">
                                <span className="material-icons-outlined text-sm">add</span>
                                New Node
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">College Name</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Slug / URL</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Database</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {colleges.map((c) => (
                                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                                        {c.admin_profile_image ? (
                                                            <img src={c.admin_profile_image} className="w-full h-full object-cover rounded-lg" alt="" />
                                                        ) : (
                                                            <span className="text-xs font-bold text-slate-500">{c.name.charAt(0)}</span>
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-700">{c.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs font-mono text-slate-500">
                                                    {c.slug}.{FRONTEND_DOMAIN}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-mono text-slate-400">{c.db_name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => toggleStatus(c)}
                                                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer ${c.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100 dashed hover:bg-slate-100'}`}
                                                >
                                                    {c.is_active ? 'Active' : 'Offline'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/super-admin/colleges?edit=${c.id}`} className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors" title="Edit Configuration">
                                                        <span className="material-icons-outlined text-lg">edit</span>
                                                    </Link>
                                                    <Link href={`/super-admin/colleges/${c.id}/admins`} className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Manage Admins">
                                                        <span className="material-icons-outlined text-lg">manage_accounts</span>
                                                    </Link>
                                                    <Link href={`/super-admin/colleges/${c.id}/divisions`} className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Manage Divisions">
                                                        <span className="material-icons-outlined text-lg">account_balance</span>
                                                    </Link>
                                                    <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete">
                                                        <span className="material-icons-outlined text-lg">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {colleges.length === 0 && !isLoading && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                                No nodes deployed yet
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
