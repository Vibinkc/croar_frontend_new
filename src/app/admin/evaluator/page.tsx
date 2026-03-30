"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/utils/api";
import Link from "next/link";
import HierarchyDrilldown from "@/components/admin/HierarchyDrilldown";

interface SubjectiveQuestion {
    id: number;
    topic: string;
    difficulty: string;
    content: {
        question: string;
    };
}

export default function AIEvaluatorAdminPage() {
    return (
        <HierarchyDrilldown
            title="AI EVALUATOR CONTROL"
            description="Manage neural scoring tasks, human-centric evaluation criteria, and rubric configurations."
            renderContent={(divisionId, departmentId) => (
                <EvaluatorList divisionId={divisionId} departmentId={departmentId} />
            )}
        />
    );
}

function EvaluatorList({ divisionId, departmentId }: { divisionId: number | null, departmentId: number | null }) {
    const [questions, setQuestions] = useState<SubjectiveQuestion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuestions();
    }, [divisionId, departmentId]);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("type", "SUBJECTIVE");
            if (divisionId) params.append("division_id", divisionId.toString());
            if (departmentId) params.append("department_id", departmentId.toString());

            const res = await apiClient.get(`/api/v1/content/questions?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setQuestions(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this subjective task?")) return;
        try {
            const res = await apiClient.delete(`/api/v1/content/questions/${id}`);
            if (res.ok) {
                setQuestions(questions.filter(q => q.id !== id));
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 animate-in fade-in duration-500">
            <div className="w-10 h-10 border-4 border-indigo-50 border-t-[var(--color-primary)] rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading_Evaluator_Matrix</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section matching Aptitude style */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Evaluator Control Grid</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        Neural Scoring & Human-Centric Review
                    </p>
                </div>
                <div className="flex gap-4">
                    <Link
                        href={`/admin/evaluator/create${departmentId ? `?department_id=${departmentId}` : ""}`}
                        className="px-6 py-3.5 bg-[var(--color-primary)] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[var(--color-primary-dark)] shadow-xl shadow-indigo-100 hover:shadow-indigo-200 transition-all flex items-center gap-3 group active:scale-95"
                    >
                        <span className="material-icons-outlined text-sm group-hover:rotate-90 transition-transform duration-500 font-bold">add</span>
                        New Protocol
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {questions.map((q) => (
                    <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col group hover:shadow-xl hover:border-slate-300 transition-all duration-500 h-full min-h-[220px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                            <span className="material-icons-outlined text-6xl">rate_review</span>
                        </div>

                        <div className="flex items-start justify-between mb-4 relative z-10">
                            <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all duration-300">
                                <span className="material-icons-outlined text-lg">history_edu</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-slate-50 text-slate-400 border border-slate-100 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all`}>
                                {q.difficulty}
                            </span>
                        </div>

                        <div className="flex-1 mb-4 relative z-10">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight mb-1.5 line-clamp-1">{q.topic}</h3>
                            <p className="text-[9px] font-medium text-slate-400 line-clamp-3 leading-relaxed bg-slate-50/50 p-2.5 rounded-lg border border-dashed border-slate-100 italic">
                                "{q.content.question}"
                            </p>
                        </div>

                        <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-50 relative z-10">
                            <Link
                                href={`/admin/evaluator/${q.id}`}
                                className="flex-1 bg-slate-50 hover:bg-[var(--color-primary)] hover:text-white text-slate-400 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all active:scale-95"
                            >
                                <span className="material-icons-outlined text-xs">analytics</span>
                                Results
                            </Link>
                            <Link
                                href={`/admin/evaluator/edit/${q.id}`}
                                className="flex-1 bg-slate-50 hover:bg-[var(--color-primary)] hover:text-white text-slate-400 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all active:scale-95"
                            >
                                <span className="material-icons-outlined text-xs">edit_note</span>
                                Configure
                            </Link>
                            <button
                                onClick={() => handleDelete(q.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-900 hover:text-white transition-all active:scale-95"
                                title="Purge Protocol"
                            >
                                <span className="material-icons-outlined text-base">delete_sweep</span>
                            </button>
                        </div>
                    </div>
                ))}

                <Link href={`/admin/evaluator/create${departmentId ? `?department_id=${departmentId}` : ""}`} className="border-2 border-dashed border-slate-100 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-300 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-indigo-50/50 transition-all group cursor-pointer h-full min-h-[220px]">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 group-hover:bg-[var(--color-primary)] group-hover:text-white flex items-center justify-center mb-3 transition-all duration-300 transform group-hover:scale-110 shadow-sm">
                        <span className="material-icons-outlined text-2xl group-hover:rotate-90 transition-all duration-500">add</span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Deploy_New_Matrix</span>
                </Link>
            </div>
        </div>
    );
}
