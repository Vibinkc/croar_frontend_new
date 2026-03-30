"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiClient } from "@/utils/api";
import HierarchyDrilldown from "@/components/admin/HierarchyDrilldown";

interface PsychometricTest {
    id: number;
    title: string;
    trait: string;
    description: string;
    created_at: string;
    test_type?: string;
    questions?: any[];
}

export default function PsychometricDashboardPage() {
    return (
        <HierarchyDrilldown
            title="Psychometric Control"
            description="Manage personality assessments and psychological evaluation protocols."
            renderContent={(divisionId, departmentId) => (
                <PsychometricList divisionId={divisionId} departmentId={departmentId} />
            )}
        />
    );
}

function PsychometricList({ divisionId, departmentId }: { divisionId: number | null, departmentId: number | null }) {
    const [tests, setTests] = useState<PsychometricTest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTests();
    }, [divisionId, departmentId]);

    const fetchTests = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (divisionId) params.append("division_id", divisionId.toString());
            if (departmentId) params.append("department_id", departmentId.toString());

            const res = await apiClient.get(`/api/v1/psychometric?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setTests(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this test? This action will remove all associated user data.")) return;

        try {
            const res = await apiClient.delete(`/api/v1/psychometric/${id}`);

            if (res.ok) {
                setTests(prev => prev.filter(t => t.id !== id));
            } else {
                alert("Failed to delete test");
            }
        } catch (e) {
            console.error(e);
            alert("Error deleting test");
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-12 pb-32 px-6">
            {/* Action Hub */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none mb-2">Psychometric Vaults</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        Active Personality Constructs & Assessments
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link
                        href={`/admin/psychometric/create${departmentId ? `?department_id=${departmentId}` : ""}`}
                        className="px-5 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] hover:bg-slate-100 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                    >
                        <span className="material-icons-outlined text-sm font-bold">add</span>
                        Initialize Protocol
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-slate-50 rounded-[2rem] animate-pulse border border-slate-100" />
                    ))}
                </div>
            ) : tests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-slate-50 rounded-[2.5rem] border border-slate-100 border-dashed">
                    <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-slate-100">
                        <span className="material-icons-outlined text-4xl text-slate-300">psychology_alt</span>
                    </div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">No Protocols Online</h3>
                    <p className="text-xs font-medium text-slate-400 max-w-md text-center">Initialize a new psychometric protocol to begin student evaluation.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tests.map((test) => (
                        <div key={test.id} className="group bg-white hover:bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all duration-500 hover:shadow-lg hover:shadow-slate-100 relative overflow-hidden flex flex-col h-full min-h-[240px]">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-2xl -mr-6 -mt-6 transition-transform group-hover:scale-150 duration-700" />

                            <div className="relative z-10 mb-5 flex justify-between items-start">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-md shadow-indigo-100 group-hover:scale-110 transition-transform duration-500">
                                    <span className="material-icons-outlined text-xl">
                                        {test.test_type === 'SPOT_ON' ? 'extension' : test.test_type === 'FREE_TRANSPORT' ? 'sailing' : 'psychology_alt'}
                                    </span>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-widest shadow-sm">
                                        {new Date(test.created_at).toLocaleDateString()}
                                    </span>
                                    <span className="px-2.5 py-1 bg-indigo-50 rounded-lg text-[8px] font-black text-indigo-500 uppercase tracking-widest">
                                        {test.trait}
                                    </span>
                                </div>
                            </div>

                            <h3 className="relative z-10 text-lg font-black text-slate-900 uppercase tracking-tight mb-2 group-hover:text-indigo-600 transition-colors">
                                {test.title}
                            </h3>

                            <p className="relative z-10 text-[10px] font-bold text-slate-400 leading-relaxed mb-4 line-clamp-3">
                                {test.description}
                            </p>

                            <div className="relative z-10 mt-auto pt-5 border-t border-slate-100 flex items-center gap-3">
                                <Link
                                    href={`/admin/psychometric/edit/${test.id}`}
                                    className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 group/btn"
                                >
                                    <span>Calibrate Protocol</span>
                                    <span className="material-icons-outlined text-xs group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                                </Link>
                                <button
                                    onClick={() => handleDelete(test.id)}
                                    className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                                    title="Delete Protocol"
                                >
                                    <span className="material-icons-outlined text-xs">delete</span>
                                </button>
                            </div>
                        </div>
                    ))
                    }
                </div>
            )
            }
        </div >
    );
}
