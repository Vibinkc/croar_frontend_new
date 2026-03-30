"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { apiClient } from "@/utils/api";
import HierarchyDrilldown from "@/components/admin/HierarchyDrilldown";

interface Interview {
    id: number;
    title: string;
    job_description: string;
    is_active: boolean;
    created_at: string;
}

export default function AdminInterviewsPage() {
    return (
        <HierarchyTrilldownWrapper />
    );
}

function HierarchyTrilldownWrapper() {
    return (
        <HierarchyDrilldown
            title="INTERVIEW PROTOCOL HUB"
            description="Manage AI interview assignments, evaluation protocols, and virtual recruiter personas."
            renderContent={(divisionId, departmentId) => (
                <InterviewList divisionId={divisionId} departmentId={departmentId} />
            )}
        />
    );
}

function InterviewList({ divisionId, departmentId }: { divisionId: number | null, departmentId: number | null }) {
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchInterviews();
    }, [divisionId, departmentId]);

    const fetchInterviews = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (divisionId) params.append("division_id", divisionId.toString());
            if (departmentId) params.append("department_id", departmentId.toString());

            const res = await apiClient.get(`/api/v1/interviews?${params.toString()}`);
            if (res.ok) {
                setInterviews(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure?")) return;
        try {
            const res = await apiClient.delete(`/api/v1/interviews/${id}`);
            if (res.ok) {
                setInterviews(prev => prev.filter(i => i.id !== id));
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (isLoading) return (
        <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Premium Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Virtual Recruiters</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        AI Evaluation / Active Protocols
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.push(`/admin/interviews/create${departmentId ? `?department_id=${departmentId}` : ""}`)}
                        className="px-5 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] hover:bg-slate-100 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                    >
                        <span className="material-icons-outlined text-sm font-bold">record_voice_over</span>
                        Init Protocol
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push(`/admin/interviews/create${departmentId ? `?department_id=${departmentId}` : ""}`)}
                        className="px-6 py-3 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black shadow-lg shadow-slate-200 hover:shadow-indigo-500/20 transition-all flex items-center gap-2 group active:scale-95"
                    >
                        <span className="material-icons-outlined text-sm group-hover:rotate-180 transition-transform duration-700 font-bold">auto_awesome</span>
                        AI Recruiter
                    </button>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md border border-slate-200">
                <ul className="divide-y divide-gray-200">
                    {interviews.length === 0 ? (
                        <li className="px-6 py-4 text-center text-gray-500">No interviews found for this selection.</li>
                    ) : (
                        interviews.map((interview) => (
                            <li key={interview.id}>
                                <div className="px-4 py-3 sm:px-5 hover:bg-gray-50 transition duration-150 ease-in-out">
                                    <div className="flex items-center justify-between">
                                        <div className="truncate flex-1">
                                            <div className="flex items-center text-sm">
                                                <p className="font-bold text-slate-800 truncate text-sm mr-2">{interview.title}</p>
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${interview.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                    {interview.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                            <div className="mt-1 flex">
                                                <div className="flex items-center text-[10px] text-gray-400 font-medium">
                                                    <span className="material-symbols-rounded mr-1 text-sm text-gray-300">calendar_today</span>
                                                    <p>Created on {format(new Date(interview.created_at), "PPP p")}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ml-5 flex-shrink-0 flex items-center gap-1">
                                            <button
                                                onClick={() => router.push(`/admin/interviews/edit/${interview.id}`)}
                                                className="p-1.5 text-slate-400 hover:text-[var(--color-primary)] hover:bg-slate-100 rounded-lg transition-all"
                                                title="Edit Interview"
                                            >
                                                <span className="material-symbols-rounded text-lg">edit</span>
                                            </button>
                                            <button
                                                onClick={() => router.push(`/admin/interviews/${interview.id}`)}
                                                className="p-1.5 text-slate-400 hover:text-[var(--color-primary)] hover:bg-slate-100 rounded-lg transition-all"
                                                title="View Results"
                                            >
                                                <span className="material-symbols-rounded text-lg">analytics</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(interview.id)}
                                                className="p-1.5 text-slate-400 hover:text-[var(--color-primary)] hover:bg-slate-100 rounded-lg transition-all"
                                                title="Delete Interview"
                                            >
                                                <span className="material-symbols-rounded text-lg">delete</span>
                                            </button>
                                            <Link href={`/practice/interviews/${interview.id}`} target="_blank" className="p-1.5 text-slate-400 hover:text-[var(--color-primary)] hover:bg-slate-100 rounded-lg transition-all" title="View Preview">
                                                <span className="material-symbols-rounded text-lg">visibility</span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
