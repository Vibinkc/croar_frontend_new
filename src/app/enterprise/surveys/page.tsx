"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";

export default function SurveyDashboard() {
    const { token, canAccess } = useAuth();
    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [instances, setInstances] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const filteredInstances = instances.filter(inst => 
        (statusFilter === "all" || inst.status === statusFilter) &&
        (inst.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [instRes, tplRes] = await Promise.all([
                    apiClient.get('/api/v1/enterprise/surveys/instances'),
                    apiClient.get('/api/v1/enterprise/surveys/templates')
                ]);
                if (instRes.ok) setInstances(await instRes.json());
                if (tplRes.ok) setTemplates(await tplRes.json());
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
            <div className="w-12 h-12 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-4 sm:p-5 max-w-7xl mx-auto space-y-6 pt-2 animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl border border-slate-100 p-2 shadow-lg shadow-slate-200/20">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-9 h-9 bg-violet-50 text-[#7C3AED] rounded-xl flex items-center justify-center">
                        <span className="material-symbols-rounded">poll</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 tracking-tight">HR Surveys</h1>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">Measure engagement and culture</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    {canAccess("surveys:moderate") && (
                        <>
                            <Link 
                                href="/enterprise/surveys/templates" 
                                className="px-5 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-[#7C3AED] hover:border-violet-100 transition-all font-black text-[9px] uppercase tracking-widest flex items-center gap-2"
                            >
                                <span className="material-symbols-rounded text-base">description</span>
                                <span>Templates</span>
                            </Link>
                            <Link 
                                href="/enterprise/surveys/new" 
                                className="px-8 py-2.5 bg-[#7C3AED] text-white rounded-xl hover:bg-[#6D28D9] transition-all font-black text-[9px] uppercase tracking-[0.2em] flex items-center gap-2 shadow-xl shadow-indigo-100"
                            >
                                <span className="material-symbols-rounded text-base">add</span>
                                <span>Launch Survey</span>
                            </Link>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-lg shadow-slate-100/30 group hover:border-[#7C3AED] transition-all duration-500">
                    <div className="w-10 h-10 bg-violet-50 text-[#7C3AED] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#7C3AED] group-hover:text-white transition-all duration-500">
                        <span className="material-symbols-rounded text-xl">rocket_launch</span>
                    </div>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-none mb-1.5">Active Campaigns</p>
                    <p className="text-2xl font-black text-slate-900 mt-1 leading-none tracking-tighter">{instances.filter(i => i.status === 'ACTIVE').length}</p>
                </div>
                
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-lg shadow-slate-100/30 group hover:border-orange-500 transition-all duration-500">
                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
                        <span className="material-symbols-rounded text-xl">hourglass_empty</span>
                    </div>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-none mb-1.5">In Progress</p>
                    <p className="text-2xl font-black text-slate-900 mt-1 leading-none tracking-tighter">{instances.filter(i => i.status === 'DRAFT').length}</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-lg shadow-slate-100/30 group hover:border-emerald-500 transition-all duration-500">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                        <span className="material-symbols-rounded text-xl">check_circle</span>
                    </div>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-none mb-1.5">Total Completed</p>
                    <p className="text-2xl font-black text-slate-900 mt-1 leading-none tracking-tighter">{instances.filter(i => i.status === 'CLOSED').length}</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-lg shadow-slate-100/30 group hover:border-blue-500 transition-all duration-500">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                        <span className="material-symbols-rounded text-xl">poll</span>
                    </div>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-none mb-1.5">Frameworks</p>
                    <p className="text-2xl font-black text-slate-900 mt-1 leading-none tracking-tighter">{templates.length}</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 relative w-full group">
                    <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg transition-colors group-focus-within:text-[#7C3AED]">search</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search surveys by name..."
                        className="w-full h-12 bg-white border border-slate-100 rounded-xl pl-12 pr-4 text-[13px] font-bold text-slate-700 placeholder:text-slate-400 focus:border-[#7C3AED] focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none shadow-sm"
                    />
                </div>
                
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm min-w-[200px]">
                    <span className="material-symbols-rounded text-slate-400 ml-2 text-lg">filter_list</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-transparent border-none text-[11px] font-black text-slate-700 focus:outline-none focus:ring-0 cursor-pointer uppercase tracking-wider"
                    >
                        <option value="all">All Campaigns</option>
                        <option value="ACTIVE">Active Only</option>
                        <option value="DRAFT">Drafts</option>
                        <option value="CLOSED">Closed</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-rounded text-[#7C3AED] text-lg">history</span>
                        <h2 className="font-black text-slate-900 text-[10px] uppercase tracking-widest">Survey Campaigns</h2>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/20">
                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Campaign Details</th>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Timeline</th>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Status</th>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredInstances.length > 0 ? filteredInstances.map((instance) => (
                                <tr key={instance.id} className="group hover:bg-slate-50/50 transition-all cursor-pointer" onClick={() => router.push(`/enterprise/surveys/instances/${instance.id}`)}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-violet-50 text-[#7C3AED] rounded-xl flex items-center justify-center group-hover:bg-[#7C3AED] group-hover:text-white transition-all">
                                                <span className="material-symbols-rounded text-base">description</span>
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 leading-tight mb-0.5 text-xs truncate max-w-[200px]">{instance.name}</p>
                                                <p className="text-[9px] font-bold text-slate-400  tracking-tight ">Target: {instance.target_group}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <span className="material-symbols-rounded text-[10px]">calendar_today</span>
                                                <span className="text-[9px] font-bold font-mono tracking-tighter">
                                                    {new Date(instance.start_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <span className="material-symbols-rounded text-[10px]">event</span>
                                                <span className="text-[9px] font-bold font-mono tracking-tighter">
                                                    {new Date(instance.end_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black   inline-flex items-center gap-1.5 ${
                                            instance.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                                            instance.status === 'CLOSED' ? 'bg-slate-50 text-slate-500 border border-slate-100' : 
                                            'bg-amber-50 text-amber-600 border border-amber-100'
                                        }`}>
                                            <span className={`w-1 h-1 rounded-full ${
                                                instance.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                                            }`}></span>
                                            {instance.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {instance.status === 'ACTIVE' && canAccess("surveys:moderate") && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        apiClient.post(`/api/v1/enterprise/surveys/instances/${instance.id}/notify`, {})
                                                            .then(() => alert("Reminder sent successfully!"))
                                                            .catch(() => alert("Failed to send reminder."));
                                                    }}
                                                    className="px-3 py-1.5 bg-violet-50 text-[#7C3AED] rounded-xl font-black text-[8px]   hover:bg-[#7C3AED] hover:text-white transition-all border border-violet-100 flex items-center gap-1.5"
                                                >
                                                    <span>Remind</span>
                                                    <span className="material-symbols-rounded text-[10px]">send</span>
                                                </button>
                                            )}
                                            <button className="px-4 py-1.5 bg-white border border-slate-100 text-slate-900 rounded-xl font-black text-[8px]   hover:bg-slate-900 hover:text-white transition-all shadow-sm flex items-center gap-1.5">
                                                <span>View</span>
                                                <span className="material-symbols-rounded text-[10px]">analytics</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center">
                                        <p className="text-slate-300 font-black   text-[10px]">No active survey campaigns found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
