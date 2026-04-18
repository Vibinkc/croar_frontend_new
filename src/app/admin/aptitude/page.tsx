"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/utils/api";
import { useDivision } from "@/context/DivisionContext";
import HierarchyDrilldown from "@/components/admin/HierarchyDrilldown";

interface Question {
    id: number;
    topic: string;
    difficulty: string;
    content: {
        question: string;
    };
}

export default function QuestionsPage() {
    return (
        <HierarchyDrilldown
            title="CENTRAL KNOWLEDGE BANK"
            description="Manage aptitude protocols, organize knowledge entries, and monitor question distributions."
            renderContent={(divisionId, departmentId) => (
                <AptitudeList divisionId={divisionId} departmentId={departmentId} />
            )}
        />
    );
}

function AptitudeList({ divisionId, departmentId }: { divisionId: number | null, departmentId: number | null }) {
    const { selectedBatch } = useDivision();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

    useEffect(() => {
        fetchQuestions();
    }, [divisionId, departmentId, selectedBatch]);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("type", "APTITUDE");
            if (divisionId) params.append("division_id", divisionId.toString());
            if (departmentId) params.append("department_id", departmentId.toString());
            if (selectedBatch) params.append("batch", selectedBatch);

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
        if (!confirm("Are you sure?")) return;
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
            <p className="text-[10px] font-black  tracking-[0.3em] text-slate-400">Syncing_Knowledge_Bank</p>
        </div>
    );

    const groupedQuestions = questions.reduce((acc, q) => {
        if (!acc[q.topic]) acc[q.topic] = [];
        acc[q.topic].push(q);
        return acc;
    }, {} as Record<string, Question[]>);

    // Topic Detail View
    if (selectedTopic) {
        const topicQuestions = groupedQuestions[selectedTopic] || [];
        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setSelectedTopic(null)}
                            className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all duration-300"
                        >
                            <span className="material-icons-outlined">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight ">{selectedTopic}</h1>
                            <p className="text-[10px] font-bold text-slate-400   mt-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                {topicQuestions.length} Protocols Loaded in this Sector
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {topicQuestions.map((q) => (
                        <div key={q.id} className="group bg-white p-4 rounded-xl border border-slate-50 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 flex items-center justify-between">
                            <div className="flex-1 pr-10">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black   border ${q.difficulty === 'HARD' ? 'bg-rose-50 text-rose-500 border-rose-100' :
                                        q.difficulty === 'MEDIUM' ? 'bg-amber-50 text-amber-500 border-amber-100' :
                                            'bg-emerald-50 text-emerald-500 border-emerald-100'
                                        }`}>
                                        {q.difficulty}
                                    </span>
                                    <span className="text-[8px] font-black text-slate-300  ">Protocol ID: #{q.id}</span>
                                </div>
                                <p className="text-sm font-bold text-slate-600 leading-relaxed group-hover:text-slate-900 transition-colors">
                                    {q.content.question || (q.content as any).description || "No preview available"}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                <Link
                                    href={`/admin/aptitude/edit/${q.id}`}
                                    className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-2xl transition-all shadow-sm"
                                    title="Edit Protocol"
                                >
                                    <span className="material-icons-outlined text-xl">edit</span>
                                </Link>
                                <button
                                    onClick={() => handleDelete(q.id)}
                                    className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all shadow-sm"
                                    title="Purge Data"
                                >
                                    <span className="material-icons-outlined text-xl">delete_outline</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Header Section matching Job Sim style */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight ">Knowledge Protocols</h1>
                    <p className="text-[10px] font-bold text-slate-400   mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        Central Repository / Aptitude Bank
                    </p>
                </div>
                <div className="flex gap-4">
                    <Link
                        href={`/admin/aptitude/create?tab=MANUAL${departmentId ? `&department_id=${departmentId}` : ""}`}
                        className="px-6 py-3.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-2xl text-[10px] font-black   hover:bg-slate-100 transition-all flex items-center gap-3 active:scale-95 shadow-sm"
                    >
                        <span className="material-icons-outlined text-sm font-bold">add</span>
                        Manual Creation
                    </Link>
                    <Link
                        href={`/admin/aptitude/create?tab=BULK${departmentId ? `&department_id=${departmentId}` : ""}`}
                        className="px-6 py-3.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-2xl text-[10px] font-black   hover:bg-slate-100 transition-all flex items-center gap-3 active:scale-95 shadow-sm"
                    >
                        <span className="material-icons-outlined text-sm font-bold">cloud_upload</span>
                        Bulk Upload
                    </Link>
                    <Link
                        href={`/admin/aptitude/create?tab=AI${departmentId ? `&department_id=${departmentId}` : ""}`}
                        className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black  tracking-[0.2em] hover:bg-black shadow-2xl shadow-slate-200 hover:shadow-slate-300 transition-all flex items-center gap-3 group active:scale-95"
                    >
                        <span className="material-icons-outlined text-sm group-hover:rotate-180 transition-transform duration-500 font-bold">auto_awesome</span>
                        AI Generator
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(groupedQuestions).map(([topic, topicQuestions]) => (
                    <div key={topic} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group relative flex flex-col min-h-[180px]">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-sm">
                                <span className="material-icons-outlined text-2xl">category</span>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className="px-3 py-1 rounded-xl bg-slate-900 text-[10px] font-black text-white  tracking-[0.1em] border border-slate-800">
                                    {topicQuestions.length} Protocols
                                </span>
                                <span className="text-[8px] font-black text-slate-300  ">Aptitude DB</span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors  tracking-tight truncate pr-4">{topic}</h3>
                            <p className="text-[10px] font-black text-slate-400   leading-none">Topic Assessment Batch</p>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex flex-wrap gap-2">
                                {topicQuestions.slice(0, 4).map((q, idx) => (
                                    <div key={q.id || idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[9px] text-slate-500 font-bold transition-all hover:bg-white hover:border-indigo-100">
                                        <div className={`w-1.5 h-1.5 rounded-full ${q.difficulty === 'HARD' ? 'bg-rose-400' :
                                            q.difficulty === 'MEDIUM' ? 'bg-amber-400' :
                                                'bg-emerald-400'
                                            }`}></div>
                                        <span className="truncate max-w-[80px]">Question #{q.id}</span>
                                    </div>
                                ))}
                                {topicQuestions.length > 4 && (
                                    <div className="text-[9px] font-black text-slate-400 py-1.5 px-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 ">
                                        + {topicQuestions.length - 4} MORE
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-6 border-t border-slate-50 mt-auto">
                            <button
                                onClick={() => setSelectedTopic(topic)}
                                className="flex-1 py-3 rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-900 hover:text-white text-[10px] font-black   text-center transition-all shadow-sm"
                            >
                                Manage Topic
                            </button>
                        </div>

                        {/* Top-right decorative dots */}
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                            </div>
                        </div>
                    </div>
                ))}

                {questions.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-inner">
                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                            <span className="material-icons-outlined text-4xl text-slate-200">grid_view</span>
                        </div>
                        <p className="text-slate-400 font-black  text-[12px] tracking-[0.3em]">Knowledge_Bank_Depleted</p>
                        <p className="text-[10px] text-slate-300 font-bold   mt-2">Initialize your first protocol to begin</p>
                    </div>
                )}
            </div>
        </div>
    );
}
