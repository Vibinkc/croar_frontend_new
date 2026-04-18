"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiClient } from "@/utils/api";
import { useDivision } from "@/context/DivisionContext";

import HierarchyDrilldown from "@/components/admin/HierarchyDrilldown";

export default function JobSimulationDashboard() {
    return (
        <HierarchyDrilldown
            title="Job Simulator"
            description="Manage process simulations by college and department."
            renderContent={(divId, deptId) => (
                <JobSimulationList divisionId={divId} departmentId={deptId} />
            )}
        />
    );
}

function JobSimulationList({ divisionId, departmentId }: { divisionId: number | null, departmentId: number | null }) {
    const { selectedBatch } = useDivision();
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfiles = async () => {
            setLoading(true);
            try {
                let url = '/api/v1/job-simulation/';
                const params = new URLSearchParams();
                if (divisionId) params.append('division_id', divisionId.toString());
                if (departmentId) params.append('department_id', departmentId.toString());
                if (selectedBatch) params.append('batch', selectedBatch);

                const queryString = params.toString();
                if (queryString) url += `?${queryString}`;

                const res = await apiClient.get(url);
                if (res.ok) {
                    setProfiles(await res.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchProfiles();
    }, [divisionId, departmentId, selectedBatch]);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this simulation? This action cannot be undone.")) return;

        try {
            const res = await apiClient.delete(`/api/v1/job-simulation/${id}`);

            if (res.ok) {
                setProfiles(prev => prev.filter(p => p.id !== id));
            } else {
                alert("Failed to delete simulation");
            }
        } catch (e) {
            console.error(e);
            alert("Error deleting simulation");
        }
    };

    if (loading) return <div className="py-20 text-center text-slate-400 font-bold">Loading simulations...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight ">Created Simulations</h1>
                    <p className="text-[10px] font-bold text-slate-400   mt-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Management Portal / Repository
                    </p>
                </div>
                <Link
                    href={`/admin/job-simulation/create${departmentId ? `?department_id=${departmentId}` : ""}`}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black  tracking-[0.2em] hover:bg-slate-800 shadow-xl shadow-slate-200 hover:shadow-slate-300 transition-all flex items-center gap-2 group active:scale-95"
                >
                    <span className="material-icons-outlined text-sm group-hover:rotate-90 transition-transform duration-300 font-bold">add</span>
                    New Simulation
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.map((profile) => (
                    <div key={profile.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group relative flex flex-col min-h-[240px]">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-sm">
                                <span className="material-icons-outlined text-xl">architecture</span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-[9px] font-black text-indigo-600  tracking-[0.1em] border border-indigo-100/50">
                                    {profile.rounds?.length || 0} Rounds
                                </span>
                                <span className="text-[7px] font-black text-slate-300  ">Ver 1.0.4</span>
                            </div>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-base font-black text-slate-900 mb-0.5 group-hover:text-indigo-600 transition-colors  tracking-tight">{profile.title}</h3>
                            <p className="text-[9px] font-black text-slate-400   leading-none">Simulation Architecture</p>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex flex-wrap gap-1.5">
                                {profile.rounds?.slice(0, 3).map((r: any, idx: number) => (
                                    <div key={r.id || idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] text-slate-500 font-bold transition-all hover:bg-white hover:border-indigo-100">
                                        <div className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-indigo-400"></div>
                                        <span>{r.round_title}</span>
                                    </div>
                                ))}
                                {profile.rounds?.length > 3 && (
                                    <div className="text-[8px] font-black text-slate-400 py-1 px-2 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                                        + {profile.rounds.length - 3} MORE
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-slate-50 mt-auto">
                            <Link
                                href={`/admin/job-simulation/edit/${profile.id}`}
                                className="flex-1 py-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-900 hover:text-white text-[9px] font-black   text-center transition-all shadow-sm"
                            >
                                Edit Focus
                            </Link>
                            <button
                                onClick={() => handleDelete(profile.id)}
                                className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition-all border border-transparent hover:border-rose-100 shadow-sm"
                            >
                                <span className="material-icons-outlined text-base">delete_outline</span>
                            </button>
                        </div>

                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                            </div>
                        </div>
                    </div>
                ))}
                {profiles.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-inner">
                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                            <span className="material-icons-outlined text-4xl text-slate-200">inventory_2</span>
                        </div>
                        <p className="text-slate-400 font-black  text-[12px] tracking-[0.3em]">No simulations found in repository</p>
                        <p className="text-[10px] text-slate-300 font-bold   mt-2">Initialize your first simulation to begin</p>
                    </div>
                )}
            </div>
        </div>
    );
}
