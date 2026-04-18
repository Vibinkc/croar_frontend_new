"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/utils/api";
import { useDivision } from "@/context/DivisionContext";
import HierarchyDrilldown from "@/components/admin/HierarchyDrilldown";

interface Scenario {
    id: number;
    title: string;
    difficulty: string;
    prompt: string;
}

export default function ScenariosPage() {
    return (
        <HierarchyDrilldown
            title="COMMUNICATION SIMULATION HUB"
            description="Manage voice scenarios, soft-skill simulations, and communication assessment protocols."
            renderContent={(divisionId, departmentId) => (
                <CommunicationList divisionId={divisionId} departmentId={departmentId} />
            )}
        />
    );
}

function CommunicationList({ divisionId, departmentId }: { divisionId: number | null, departmentId: number | null }) {
    const { selectedBatch } = useDivision();
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchScenarios();
    }, [divisionId, departmentId, selectedBatch]);

    const fetchScenarios = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (divisionId) params.append("division_id", divisionId.toString());
            if (departmentId) params.append("department_id", departmentId.toString());
            if (selectedBatch) params.append("batch", selectedBatch);

            const res = await apiClient.get(`/api/v1/content/scenarios?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setScenarios(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Confirm Simulation Purge? This action will permanently dissolve the protocol data.")) return;
        try {
            const res = await apiClient.delete(`/api/v1/content/scenarios/${id}`);
            if (res.ok) {
                setScenarios(scenarios.filter(s => s.id !== id));
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-32 animate-in fade-in duration-700">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-indigo-50 rounded-full animate-pulse"></div>
                </div>
            </div>
            <p className="text-[10px] font-black  tracking-[0.4em] text-slate-400 mt-8 animate-pulse">Synchronizing_Realities</p>
        </div>
    );

    return (
        <div className="max-w-[1400px] mx-auto space-y-12 pb-32 px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Premium Action Hub */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight  leading-none mb-2">Communication Vaults</h1>
                    <p className="text-[10px] font-bold text-slate-400  tracking-[0.2em] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        Central Repository / Communication Simulation Hub
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link
                        href={`/admin/communication/create${departmentId ? `?department_id=${departmentId}` : ""}`}
                        className="px-5 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg text-[10px] font-black  tracking-[0.1em] hover:bg-slate-100 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                    >
                        <span className="material-icons-outlined text-sm font-bold">add</span>
                        Manual Scenario
                    </Link>
                    <Link
                        href={`/admin/communication/create?ai=true${departmentId ? `&department_id=${departmentId}` : ""}`}
                        className="px-6 py-3 bg-slate-900 text-white rounded-lg text-[10px] font-black  tracking-[0.2em] hover:bg-black shadow-lg shadow-slate-200 hover:shadow-indigo-500/20 transition-all flex items-center gap-2 group active:scale-95"
                    >
                        <span className="material-icons-outlined text-sm group-hover:rotate-180 transition-transform duration-700 font-bold">auto_awesome</span>
                        AI Scripting
                    </Link>
                </div>
            </div>

            {scenarios.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100 text-center animate-in fade-in zoom-in duration-1000">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 rotate-3 hover:rotate-0 transition-transform duration-500">
                        <span className="material-icons-outlined text-3xl text-slate-200">record_voice_over</span>
                    </div>
                    <h3 className="text-xs font-black text-slate-900   mb-1 text-indigo-900">Vault_Empty</h3>
                    <p className="text-[9px] text-slate-400 font-bold max-w-xs  tracking-[0.2em] leading-loose">No communication protocols identified for the current sector. Initialize the gateway to begin scripting.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {scenarios.map((s, index) => (
                        <div
                            key={s.id}
                            className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-500 relative flex flex-col min-h-[240px] active:scale-[0.99] overflow-hidden"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-1000 pointer-events-none">
                                <span className="material-icons-outlined text-[10rem] -rotate-12 font-light">keyboard_voice</span>
                            </div>

                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-900 group-hover:text-white transition-all duration-500 shadow-sm group-hover:rotate-6">
                                    <span className="material-icons-outlined text-2xl font-light">record_voice_over</span>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black   border transition-all duration-500 ${s.difficulty === 'HARD' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                        s.difficulty === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                            'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        }`}>
                                        {s.difficulty}
                                    </span>
                                    <span className="text-[8px] font-black text-slate-300  tracking-[0.2em]">Scenario_v1.2</span>
                                </div>
                            </div>

                            <div className="mb-4 relative z-10 flex-1 flex flex-col">
                                <div className="text-[8px] font-black text-slate-300  tracking-[0.3em] mb-1 px-1">Simulation Protocol</div>
                                <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors  tracking-tight leading-tight mb-3 line-clamp-2">{s.title}</h3>

                                <div className="bg-slate-50/80 p-5 rounded-2xl border border-dashed border-slate-100 group-hover:bg-white group-hover:border-indigo-100 transition-all duration-500  flex-1">
                                    <p className="text-[10px] font-bold text-slate-400 line-clamp-4 leading-relaxed  tracking-wide">
                                        "{s.prompt}"
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-8 border-t border-slate-50 relative z-10 mt-auto">
                                <Link
                                    href={`/admin/communication/edit/${s.id}`}
                                    className="flex-1 bg-white hover:bg-slate-900 border border-slate-100 hover:border-slate-900 text-slate-400 hover:text-white py-2.5 rounded-xl text-[8px] font-black  tracking-[0.2em] flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 group/btn"
                                >
                                    <span className="material-icons-outlined text-xs">tune</span>
                                    Modify Protocol
                                </Link>
                                <button
                                    onClick={() => handleDelete(s.id)}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-200 hover:bg-rose-500 hover:text-white border border-slate-50 hover:border-rose-500 transition-all duration-500 active:scale-90"
                                    title="Purge Protocol"
                                >
                                    <span className="material-icons-outlined text-base">delete_outline</span>
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Add New Protocol CTA Card */}
                    <Link
                        href={`/admin/communication/create${departmentId ? `?department_id=${departmentId}` : ""}`}
                        className="group flex flex-col items-center justify-center gap-4 p-6 rounded-[2rem] border-2 border-dashed border-slate-100 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all duration-700 min-h-[240px]"
                    >
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-lg shadow-slate-200 flex items-center justify-center group-hover:scale-110 group-hover:rotate-90 transition-all duration-700">
                            <span className="material-icons-outlined text-3xl text-slate-200 group-hover:text-indigo-500">add_reaction</span>
                        </div>
                        <div className="text-center">
                            <h4 className="text-lg font-black text-slate-900  tracking-tight mb-2 leading-none">Initialize New Simulation</h4>
                            <p className="text-[10px] text-slate-400 font-bold  tracking-[0.2em]">Construct more soft-skill realities</p>
                        </div>
                    </Link>
                </div>
            )}
        </div>
    );
}
