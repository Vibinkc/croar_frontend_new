"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";

export default function SurveyDashboard() {
    const { token } = useAuth();
    const router = useRouter();
    const [instances, setInstances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInstances = async () => {
            try {
                const res = await apiClient.get('/api/v1/enterprise/surveys/instances');
                if (res.ok) {
                    setInstances(await res.json());
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchInstances();
    }, []);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-end pb-6 border-b border-slate-100">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">HR Surveys</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1 italic">Measure engagement, satisfaction, and culture with 13 specialized survey types.</p>
                </div>
                <div className="flex gap-4">
                    <Link 
                        href="/enterprise/surveys/templates" 
                        className="px-6 py-3 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                    >
                        <span className="material-symbols-rounded text-lg">description</span>
                        Templates
                    </Link>
                    <Link 
                        href="/enterprise/surveys/new" 
                        className="px-10 py-3 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 shadow-2xl shadow-indigo-100"
                    >
                        <span className="material-symbols-rounded text-lg">add</span>
                        Launch Survey
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/30">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-rounded">rocket_launch</span>
                        </div>
                        <div>
                            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Active Campaigns</p>
                            <p className="text-2xl font-black text-slate-900 leading-none">{instances.filter(i => i.status === 'ACTIVE').length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/30">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-rounded">checklist</span>
                        </div>
                        <div>
                            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Total Completed</p>
                            <p className="text-2xl font-black text-slate-900 leading-none">{instances.filter(i => i.status === 'CLOSED').length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/30">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-rounded">poll</span>
                        </div>
                        <div>
                            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Available Frameworks</p>
                            <p className="text-2xl font-black text-slate-900 leading-none">13</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-slate-200/20 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-rounded text-indigo-600 text-xl">history</span>
                        <h2 className="font-black text-slate-900 text-sm uppercase tracking-tight">Recent Survey Campaigns</h2>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/20">
                                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Campaign Details</th>
                                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Timeline</th>
                                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Status</th>
                                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {instances.length > 0 ? instances.map((instance) => (
                                <tr key={instance.id} className="group hover:bg-slate-50/50 transition-all cursor-pointer" onClick={() => router.push(`/enterprise/surveys/instances/${instance.id}`)}>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <span className="material-symbols-rounded text-xl">description</span>
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 leading-tight mb-1">{instance.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight italic">Target: {instance.target_group}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <span className="material-symbols-rounded text-xs">calendar_today</span>
                                                <span className="text-[10px] font-bold font-mono tracking-tighter">
                                                    {new Date(instance.start_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <span className="material-symbols-rounded text-xs">event</span>
                                                <span className="text-[10px] font-bold font-mono tracking-tighter">
                                                    {new Date(instance.end_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${
                                            instance.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                                            instance.status === 'CLOSED' ? 'bg-slate-50 text-slate-500 border border-slate-100' : 
                                            'bg-amber-50 text-amber-600 border border-amber-100'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                instance.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                                            }`}></span>
                                            {instance.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-3">
                                            {instance.status === 'ACTIVE' && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        apiClient.post(`/api/v1/enterprise/surveys/instances/${instance.id}/notify`, {});
                                                    }}
                                                    className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 flex items-center gap-2"
                                                >
                                                    Remind
                                                    <span className="material-symbols-rounded text-xs">send</span>
                                                </button>
                                            )}
                                            <button className="px-6 py-2 bg-white border border-slate-100 text-slate-900 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm flex items-center gap-2">
                                                View Report
                                                <span className="material-symbols-rounded text-xs">analytics</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center">
                                        <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">No active survey campaigns found</p>
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
