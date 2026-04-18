"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiClient } from "@/utils/api";
import HierarchyDrilldown from "@/components/admin/HierarchyDrilldown";

interface Assessment {
    id: number;
    title: string;
    description: string;
    time_limit_minutes: number;
    question_count: number;
    is_completed: boolean;
}

export default function AdminAssessmentsPage() {
    return (
        <HierarchyDrilldown
            title="ASSESSMENT PROTOCOL HUB"
            description="Manage certification exams, skill evaluation protocols, and neural performance benchmarks."
            renderContent={(divisionId, departmentId) => (
                <AssessmentList divisionId={divisionId} departmentId={departmentId} />
            )}
        />
    );
}

function AssessmentList({ divisionId, departmentId }: { divisionId: number | null, departmentId: number | null }) {
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAssessments();
    }, [divisionId, departmentId]);

    const fetchAssessments = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (divisionId) params.append("division_id", divisionId.toString());
            if (departmentId) params.append("department_id", departmentId.toString());

            const res = await apiClient.get(`/api/v1/assessments?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setAssessments(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this assessment protocol?")) return;
        try {
            const res = await apiClient.delete(`/api/v1/assessments/${id}`);
            if (res.ok) {
                setAssessments(assessments.filter(a => a.id !== id));
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
        </div>
    );

    return (
        <div className="max-w-[1400px] mx-auto space-y-4 pb-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Multi-Action Hub */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight  leading-none mb-2">Evaluation Vaults</h1>
                    <p className="text-[10px] font-bold text-slate-400  tracking-[0.2em] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        Central Repository / Assessment Engine
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link
                        href={`/admin/assessments/create?tab=MANUAL${departmentId ? `&department_id=${departmentId}` : ""}`}
                        className="px-5 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg text-[10px] font-black  tracking-[0.1em] hover:bg-slate-100 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                    >
                        <span className="material-icons-outlined text-sm font-bold">add</span>
                        Manual Init
                    </Link>
                    <Link
                        href={`/admin/assessments/create?tab=BULK${departmentId ? `&department_id=${departmentId}` : ""}`}
                        className="px-5 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg text-[10px] font-black  tracking-[0.1em] hover:bg-slate-100 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                    >
                        <span className="material-icons-outlined text-sm font-bold">table_view</span>
                        Bulk Ingestion
                    </Link>
                    <Link
                        href={`/admin/assessments/create?tab=AI${departmentId ? `&department_id=${departmentId}` : ""}`}
                        className="px-6 py-3 bg-slate-900 text-white rounded-lg text-[10px] font-black  tracking-[0.2em] hover:bg-black shadow-lg shadow-slate-200 hover:shadow-indigo-500/20 transition-all flex items-center gap-2 group active:scale-95"
                    >
                        <span className="material-icons-outlined text-sm group-hover:rotate-180 transition-transform duration-700 font-bold">auto_awesome</span>
                        AI Architect
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th scope="col" className="px-4 py-2 text-left text-[10px] font-black text-slate-400  ">Protocol_ID</th>
                            <th scope="col" className="px-4 py-2 text-left text-[10px] font-black text-slate-400  ">Title</th>
                            <th scope="col" className="px-4 py-2 text-left text-[10px] font-black text-slate-400  ">Duration</th>
                            <th scope="col" className="px-4 py-2 text-left text-[10px] font-black text-slate-400  ">Volume</th>
                            <th scope="col" className="relative px-4 py-2"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {assessments.map((assessment) => (
                            <tr key={assessment.id} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="px-4 py-2 whitespace-nowrap text-[10px] font-black text-slate-400 font-mono">
                                    ASM_{assessment.id.toString().padStart(3, '0')}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                    <div className="text-xs font-bold text-slate-900">{assessment.title}</div>
                                    <div className="text-[10px] font-medium text-slate-400 truncate max-w-xs">{assessment.description}</div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[9px] font-black   border border-slate-200">
                                        {assessment.time_limit_minutes} MINS
                                    </span>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-[10px] font-bold text-slate-600">
                                    {assessment.question_count} Questions
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-right text-xs font-medium">
                                    <div className="flex items-center justify-end gap-1 transition-opacity">
                                        <Link href={`/admin/assessments/edit/${assessment.id}`} className="p-1.5 text-slate-400 hover:text-[var(--color-primary)] hover:bg-indigo-50/50 rounded-lg transition-colors">
                                            <span className="material-icons-outlined text-sm">edit</span>
                                        </Link>
                                        <Link href={`/admin/assessments/${assessment.id}`} className="p-1.5 text-slate-400 hover:text-[var(--color-primary)] hover:bg-indigo-50/50 rounded-lg transition-colors" title="View Candidates">
                                            <span className="material-icons-outlined text-sm">groups</span>
                                        </Link>
                                        <button onClick={() => handleDelete(assessment.id)} className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                            <span className="material-icons-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {assessments.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <span className="material-icons-outlined text-4xl mb-2 opacity-50">low_priority</span>
                                        <p className="text-sm font-medium">No assessment protocols active.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div >
    );
}
