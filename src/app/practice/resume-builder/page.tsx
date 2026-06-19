"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/utils/api";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResumeTemplate {
    id: string;
    name: string;
    extracted_fields?: {
        sections?: Record<string, unknown>[];
    };
}

interface ResumeSubmission {
    id: number;
    template_id: string;
    created_at: string;
}

export default function ResumeBuilderStudent() {
    const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
    const [submissions, setSubmissions] = useState<ResumeSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            // eslint-disable-next-line react-hooks/immutability
            await Promise.all([fetchTemplates(), fetchSubmissions()]);
            setIsLoading(false);
        };
        load();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await apiClient.get(`/api/v1/resume/builder/templates`);
            if (res.ok) {
                setTemplates(await res.json());
            }
        } catch (err) { console.error(err); }
    };

    const fetchSubmissions = async () => {
        try {
            const res = await apiClient.get(`/api/v1/resume/builder/submissions/my`);
            if (res.ok) {
                setSubmissions(await res.json());
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteSubmission = async (id: number) => {
        if (!confirm("Delete this resume?")) return;
        try {
            const res = await apiClient.delete(`/api/v1/resume/builder/submission/${id}`);
            if (res.ok) fetchSubmissions();
        } catch (err) { console.error(err); }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500 font-bold">Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-12">
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-[1.5rem] bg-orange-600 p-6 text-white shadow-lg">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black  tracking-tight">Resume Builder</h2>
                        <p className="text-slate-100 text-xs max-w-sm font-medium leading-relaxed">
                            Choose a professional template approved by your institution.
                            Our system will guide you through the required fields to build a perfect resume.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20 min-w-[140px]">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white">
                            <span className="material-icons-outlined text-2xl">build</span>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-48 h-48 bg-slate-500/10 rounded-full blur-2xl"></div>
            </section>

            {submissions.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="material-icons-outlined text-slate-600">history</span>
                        {"My Resumes"}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {submissions.map((s: ResumeSubmission) => {
                            const tmpl = templates.find((t: ResumeTemplate) => t.id === s.template_id);
                            return (
                                <div key={s.id} className="bg-orange-50/50 p-6 rounded-xl border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-slate-800">{tmpl?.name || "Resume"}</h3>
                                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full border border-slate-200">COMPLETED</span>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium mb-4">
                                        Created on {new Date(s.created_at).toLocaleDateString()}
                                    </p>
                                    <div className="flex gap-2">
                                        <Link href={`/practice/resume-builder/submission/${s.id}`} className="flex-1 flex items-center justify-center text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-lg hover:bg-slate-200 transition-colors">
                                            View
                                        </Link>
                                        <Link href={`/practice/resume-builder/${s.template_id}?sub=${s.id}`} className="flex items-center justify-center px-3 py-2 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100 transition-colors" title="Edit Data">
                                            <span className="material-icons-outlined text-sm">edit</span>
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteSubmission(s.id)}
                                            className="flex items-center justify-center px-3 py-2 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100 transition-colors"
                                            title="Delete Resume"
                                        >
                                            <span className="material-icons-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <span className="material-icons-outlined text-slate-600">add_circle_outline</span>
                    {"Create New Resume"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {templates.map((t: ResumeTemplate) => (
                        <Link key={t.id} href={`/practice/resume-builder/${t.id}`} className="group relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                            <div className="h-40 bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                                <span className="material-icons-outlined text-6xl text-slate-300 group-hover:text-slate-500 transition-colors">description</span>
                            </div>
                            <div className="p-6 flex-1">
                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-slate-600 transition-colors">{t.name}</h3>
                                <p className="text-xs text-slate-400 mt-2 font-bold  ">{t.extracted_fields?.sections?.length || 0} Sections</p>
                            </div>
                            <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white flex items-center justify-center shadow text-slate-600 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                <span className="material-icons-outlined text-sm">arrow_forward</span>
                            </div>
                        </Link>
                    ))}

                    {templates.length === 0 && (
                        <div className="col-span-full py-20 text-center">
                            <div className="inline-block p-4 rounded-full bg-slate-100 mb-4">
                                <span className="material-icons-outlined text-2xl text-slate-400">inventory_2</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-600">No Templates Available</h3>
                            <p className="text-sm text-slate-400">Check back later when admin uploads new resume templates.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
