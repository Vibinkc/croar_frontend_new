"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { apiClient } from "@/utils/api";
import HierarchyDrilldown from "@/components/admin/HierarchyDrilldown";

interface Interview {
    id: number;
    title: string;
    job_description: string;
    created_at: string;
    type: string;
}

export default function AdminVideoInterviewsPage() {
    return (
        <HierarchyDrilldown
            title="VIDEO INTERVIEW HUB"
            description="Manage async video interview challenges, analyze candidate responses, and organize evaluation protocols."
            renderContent={(divisionId, departmentId) => (
                <VideoInterviewList divisionId={divisionId} departmentId={departmentId} />
            )}
        />
    );
}

function VideoInterviewList({ divisionId, departmentId }: { divisionId: number | null, departmentId: number | null }) {
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchInterviews();
    }, [divisionId, departmentId]);

    const fetchInterviews = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("type", "VIDEO");
            if (divisionId) params.append("division_id", divisionId.toString());
            if (departmentId) params.append("department_id", departmentId.toString());

            const response = await apiClient.get(`/api/v1/interviews?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setInterviews(data);
            }
        } catch (error) {
            console.error("Failed to fetch video interviews", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this video interview?")) return;
        try {
            const response = await apiClient.delete(`/api/v1/interviews/${id}`);
            if (response.ok) {
                setInterviews(prev => prev.filter(i => i.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete video interview", error);
        }
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-20 animate-in fade-in duration-500">
            <div className="w-10 h-10 border-4 border-indigo-50 border-t-[var(--color-primary)] rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black  tracking-[0.3em] text-slate-400">Loading_Interview_Vault</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Premium Action Hub */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight  leading-none mb-1.5">Simulation Repository</h1>
                    <p className="text-[10px] font-bold text-slate-400  tracking-[0.2em] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Asynchronous Evaluation / Video Protocols
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link
                        href={`/admin/automated-video-interviews/create${departmentId ? `?department_id=${departmentId}` : ""}`}
                        className="px-5 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg text-[10px] font-black  tracking-[0.1em] hover:bg-slate-100 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                    >
                        <span className="material-icons-outlined text-sm font-bold">add</span>
                        Manual Protocol
                    </Link>
                    <Link
                        href={`/admin/automated-video-interviews/create${departmentId ? `?department_id=${departmentId}` : ""}`}
                        className="px-6 py-3 bg-slate-900 text-white rounded-lg text-[10px] font-black  tracking-[0.2em] hover:bg-black shadow-lg shadow-slate-200 hover:shadow-indigo-500/20 transition-all flex items-center gap-2 group active:scale-95"
                    >
                        <span className="material-icons-outlined text-sm group-hover:rotate-180 transition-transform duration-700 font-bold">auto_awesome</span>
                        AI Architect
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-50">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400  ">Protocol / Title</th>
                            <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400  ">Initialization_Date</th>
                            <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400   flex justify-end pr-6">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-50">
                        {interviews.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-10 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-300">
                                        <span className="material-icons-outlined text-4xl mb-3 opacity-30">videocam_off</span>
                                        <p className="text-[9px] font-black  tracking-[0.2em]">No_Video_Protocols_Found</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            interviews.map((interview) => (
                                <tr key={interview.id} className="hover:bg-slate-50/80 transition-all group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all">
                                                <span className="material-icons-outlined text-lg">smart_display</span>
                                            </div>
                                            <div className="text-xs font-black text-slate-900  tracking-tight">{interview.title}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-[10px] font-black text-slate-400 font-mono">
                                            {format(new Date(interview.created_at), "MMM dd, yyyy")}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <Link
                                                href={`/admin/automated-video-interviews/edit/${interview.id}`}
                                                className="text-slate-300 hover:text-[var(--color-primary)] transition-all hover:scale-110 flex items-center gap-1"
                                                title="Edit Protocol"
                                            >
                                                <span className="material-icons-outlined text-base">edit</span>
                                            </Link>
                                            <Link
                                                href={`/admin/automated-video-interviews/${interview.id}`}
                                                className="text-slate-300 hover:text-[var(--color-primary)] transition-all hover:scale-110 flex items-center gap-1"
                                                title="View Results"
                                            >
                                                <span className="material-icons-outlined text-base">analytics</span>
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(interview.id)}
                                                className="text-slate-200 hover:text-[var(--color-primary)] transition-all hover:scale-110 flex items-center gap-1"
                                                title="Delete Protocol"
                                            >
                                                <span className="material-icons-outlined text-base">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
