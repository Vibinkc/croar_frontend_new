"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface Question {
    id: string;
    text: string;
    type: string;
    category: string;
}

interface TemplateQuestion {
    question: Question;
}

interface Template {
    id: string;
    name: string;
    description: string;
    questions: TemplateQuestion[];
    created_at: string;
}

export default function X360Templates() {
    const { token } = useAuth();
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/enterprise/x360/templates`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setTemplates(data);
            } else {
                setTemplates([]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this template?")) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/enterprise/x360/templates/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchTemplates();
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <header className="flex justify-between items-center pb-8 border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/enterprise/assessments-360')} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                        <span className="material-symbols-rounded">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1">Assessment Library</h1>
                        <p className="text-slate-500 text-xs font-medium">Design and manage high-fidelity templates for 360 feedback cycles</p>
                    </div>
                </div>
                <button 
                    onClick={() => router.push('/enterprise/assessments-360/templates/new')}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold text-xs flex items-center gap-2 shadow-md shadow-indigo-100"
                >
                    <span className="material-symbols-rounded text-lg">add_box</span>
                    Construct Template
                </button>
            </header>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden translate-y-0.5 animate-in slide-in-from-bottom-2 duration-400">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Framework Title</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Strategic Context</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Items</th>
                                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {templates.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-24 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-40">
                                            <span className="material-symbols-rounded text-5xl mb-4">architecture</span>
                                            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Library Empty</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                templates.map((tpl) => (
                                    <tr key={tpl.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    <span className="material-symbols-rounded text-lg">architecture</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{tpl.name}</p>
                                                    <p className="text-[10px] font-medium text-slate-400 mt-0.5 whitespace-nowrap">Initialized {new Date(tpl.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-xs text-slate-500 italic font-medium line-clamp-1 max-w-sm leading-relaxed">{tpl.description || "General performance framework architecture."}</p>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="inline-block bg-indigo-50 text-indigo-600 text-[10px] font-bold px-3 py-1 rounded-md border border-indigo-100 uppercase tracking-wider">
                                                {tpl.questions?.length || 0} Items
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => router.push(`/enterprise/assessments-360/templates/${tpl.id}/edit`)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                >
                                                    <span className="material-symbols-rounded text-xl">edit_note</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(tpl.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                >
                                                    <span className="material-symbols-rounded text-xl">delete_sweep</span>
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
        </div>
    );
}
