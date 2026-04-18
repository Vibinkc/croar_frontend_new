"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/utils/api";
import { useDivision } from "@/context/DivisionContext";
import HierarchyDrilldown from "@/components/admin/HierarchyDrilldown";

interface CodingQuestion {
    id: number;
    topic: string;
    difficulty: string;
    content: {
        question: string;
    };
}

export default function CodingQuestionsPage() {
    return (
        <HierarchyDrilldown
            title="CODING PROTOCOL HUB"
            description="Manage technical challenges, algorithmic modules, and technical assessments."
            renderContent={(divisionId, departmentId) => (
                <CodingList divisionId={divisionId} departmentId={departmentId} />
            )}
        />
    );
}

function CodingList({ divisionId, departmentId }: { divisionId: number | null, departmentId: number | null }) {
    const { selectedBatch } = useDivision();
    const [questions, setQuestions] = useState<CodingQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

    useEffect(() => {
        fetchQuestions();
    }, [divisionId, departmentId, selectedBatch]);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("type", "CODING");
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
        if (!confirm("Confirm Protocol Dissolution? This action cannot be reversed.")) return;
        try {
            const res = await apiClient.delete(`/api/v1/content/questions/${id}`);
            if (res.ok) {
                setQuestions(questions.filter(q => q.id !== id));
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Group questions by topic
    const groupedQuestions = questions.reduce((acc, q) => {
        const topicName = q.topic || "Uncategorized";
        if (!acc[topicName]) acc[topicName] = [];
        acc[topicName].push(q);
        return acc;
    }, {} as Record<string, CodingQuestion[]>);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-32 animate-in fade-in duration-700">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-indigo-50 rounded-full animate-pulse"></div>
                </div>
            </div>
            <p className="text-[10px] font-black  tracking-[0.4em] text-slate-400 mt-8 animate-pulse">Synchronizing_Vaults</p>
        </div>
    );

    // Topic Detail View (Drill-down)
    if (selectedTopic) {
        const topicQuestions = groupedQuestions[selectedTopic] || [];
        return (
            <div className="max-w-[1400px] mx-auto space-y-4 pb-12 px-4 animate-in fade-in slide-in-from-right-8 duration-700">
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-8">
                        <button
                            onClick={() => setSelectedTopic(null)}
                            className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all duration-500 shadow-sm hover:shadow-xl active:scale-95 group"
                        >
                            <span className="material-icons-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black   rounded-lg border border-indigo-100">Module Sector</span>
                                <span className="text-slate-300 text-xs">/</span>
                                <span className="text-[9px] font-black text-slate-400  ">{selectedTopic}</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight  leading-none">{selectedTopic}</h1>
                        </div>
                    </div>
                    <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-900   flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            {topicQuestions.length} Protocols Loaded
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {topicQuestions.map((q) => (
                        <div key={q.id} className="group bg-white p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:shadow-sm transition-all duration-300 flex items-center justify-between relative overflow-hidden">
                            <div className="absolute -left-12 -top-12 w-24 h-24 bg-indigo-50/50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="flex-1 pr-12 relative z-10">
                                <div className="flex items-center gap-4 mb-4">
                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black   border transition-all duration-500 ${q.difficulty === 'HARD' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                        q.difficulty === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                            'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        }`}>
                                        {q.difficulty}
                                    </span>
                                    <span className="text-[9px] font-black text-slate-300  tracking-[0.2em]">Protocol ID: #{q.id}</span>
                                </div>
                                <h3 className="text-sm font-bold text-slate-600 leading-relaxed group-hover:text-slate-900 transition-colors  tracking-tight">
                                    {q.content.question}
                                </h3>
                            </div>

                            <div className="flex items-center gap-4 relative z-10">
                                <Link
                                    href={`/admin/coding/edit/${q.id}`}
                                    className="w-14 h-14 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-2xl transition-all shadow-sm hover:shadow-xl active:scale-95"
                                    title="Calibrate Protocol"
                                >
                                    <span className="material-icons-outlined text-xl">tune</span>
                                </Link>
                                <button
                                    onClick={() => handleDelete(q.id)}
                                    className="w-14 h-14 flex items-center justify-center bg-slate-50 text-slate-300 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm hover:shadow-xl active:scale-95"
                                    title="Dissolve Protocol"
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
        <div className="max-w-[1400px] mx-auto space-y-4 pb-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Multi-Action Hub */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight  leading-none mb-2">Algorithmic Vaults</h1>
                    <p className="text-[10px] font-bold text-slate-400  tracking-[0.2em] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        Central Repository / Coding Protocol Hub
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link
                        href={`/admin/coding/create?tab=MANUAL${departmentId ? `&department_id=${departmentId}` : ""}`}
                        className="px-5 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg text-[10px] font-black  tracking-[0.1em] hover:bg-slate-100 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                    >
                        <span className="material-icons-outlined text-sm font-bold">add</span>
                        Manual Init
                    </Link>
                    <Link
                        href={`/admin/coding/create?tab=BULK${departmentId ? `&department_id=${departmentId}` : ""}`}
                        className="px-5 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg text-[10px] font-black  tracking-[0.1em] hover:bg-slate-100 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                    >
                        <span className="material-icons-outlined text-sm font-bold">terminal</span>
                        Bulk Ingestion
                    </Link>
                    <Link
                        href={`/admin/coding/create?tab=AI${departmentId ? `&department_id=${departmentId}` : ""}`}
                        className="px-6 py-3 bg-slate-900 text-white rounded-lg text-[10px] font-black  tracking-[0.2em] hover:bg-black shadow-lg shadow-slate-200 hover:shadow-indigo-500/20 transition-all flex items-center gap-2 group active:scale-95"
                    >
                        <span className="material-icons-outlined text-sm group-hover:rotate-180 transition-transform duration-700 font-bold">auto_awesome</span>
                        AI Architect
                    </Link>
                </div>
            </div>

            {Object.keys(groupedQuestions).length === 0 ? (
                <div className="flex flex-col items-center justify-center p-24 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100 text-center animate-in fade-in zoom-in duration-1000">
                    <div className="w-24 h-24 bg-white rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-center mb-8 rotate-3 hover:rotate-0 transition-transform duration-500">
                        <span className="material-icons-outlined text-4xl text-slate-200">code_off</span>
                    </div>
                    <h3 className="text-sm font-black text-slate-900   mb-2 text-indigo-900">Vault_Depleted</h3>
                    <p className="text-[10px] text-slate-400 font-bold max-w-xs  tracking-[0.2em] leading-loose">No neural protocols identified for the current sector. Initialize the gateway to begin ingestion.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(groupedQuestions).map(([topic, topicQuestions], index) => (
                        <div
                            key={topic}
                            className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 relative flex flex-col min-h-[200px] active:scale-[0.99]"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-900 group-hover:text-white transition-all duration-700 shadow-sm group-hover:rotate-6">
                                    <span className="material-icons-outlined text-3xl font-light">terminal</span>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="px-4 py-1.5 rounded-xl bg-slate-900 text-[10px] font-black text-white  tracking-[0.1em] border border-slate-800 shadow-lg shadow-slate-100">
                                        {topicQuestions.length} Protocols
                                    </span>
                                    <span className="text-[8px] font-black text-slate-300  tracking-[0.2em]">Coding_Bank_v2</span>
                                </div>
                            </div>

                            <div className="mb-8">
                                <div className="text-[9px] font-black text-slate-300  tracking-[0.3em] mb-2 px-1">Active Module</div>
                                <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors  tracking-tight leading-none mb-3 truncate">{topic}</h3>
                                <div className="h-1 w-8 bg-slate-100 group-hover:w-16 group-hover:bg-indigo-500 transition-all duration-700 rounded-full"></div>
                            </div>

                            <div className="space-y-4 mb-10">
                                <div className="flex flex-wrap gap-2">
                                    {topicQuestions.slice(0, 3).map((q, idx) => (
                                        <div key={q.id || idx} className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-[9px] text-slate-500 font-bold transition-all hover:bg-white hover:border-indigo-100 group/item">
                                            <div className={`w-1.5 h-1.5 rounded-full ${q.difficulty === 'HARD' ? 'bg-rose-400 animate-pulse' :
                                                q.difficulty === 'MEDIUM' ? 'bg-amber-400' :
                                                    'bg-emerald-400'
                                                }`}></div>
                                            <span className="truncate max-w-[100px] ">P_ID#{q.id}</span>
                                        </div>
                                    ))}
                                    {topicQuestions.length > 3 && (
                                        <div className="text-[9px] font-black text-slate-400 py-2 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200  ">
                                            + {topicQuestions.length - 3} MORE
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-8 border-t border-slate-50 mt-auto relative z-10">
                                <button
                                    onClick={() => setSelectedTopic(topic)}
                                    className="flex-1 py-4 rounded-2xl bg-slate-50 text-slate-500 hover:bg-indigo-900 hover:text-white text-[10px] font-black  tracking-[0.2em] text-center transition-all shadow-sm active:scale-95 group/btn"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        Manage Protocol
                                        <span className="material-icons-outlined text-sm group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                                    </span>
                                </button>
                            </div>

                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-1000 pointer-events-none">
                                <span className="material-icons-outlined text-[12rem] -rotate-12">architecture</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
