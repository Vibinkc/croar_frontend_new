"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";

interface Template {
    id: string;
    title: string;
    description: string;
    survey_type: {
        name: string;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    questions?: any[];
}

export default function SurveyTemplates() {
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTemplates = useCallback(async () => {
        try {
            const res = await apiClient.get('/api/v1/enterprise/surveys/templates');
            if (res.ok) setTemplates(await res.json());
        } catch (error) {
            console.error("Failed to fetch survey templates:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this template?")) return;
        try {
            const res = await apiClient.delete(`/api/v1/enterprise/surveys/templates/${id}`);
            if (res.ok) fetchTemplates();
        } catch (error) {
            console.error("Failed to delete template:", error);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
            <header className="flex justify-between items-center pb-8 border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/enterprise/surveys')} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                        <span className="material-symbols-rounded">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">Survey Frameworks</h1>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-70">Manage and deploy specialized organizational pulse frameworks</p>
                    </div>
                </div>
                <button 
                    onClick={() => router.push('/enterprise/surveys/templates/new')}
                    className="px-6 py-2.5 bg-[#7C3AED] text-white rounded-xl hover:bg-[#6D28D9] transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-100"
                >
                    <span className="material-symbols-rounded text-lg">add_box</span>
                    Launch New Framework
                </button>
            </header>

            <div className="bg-white rounded-xl border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-rounded text-[#7C3AED] text-lg">description</span>
                        <h2 className="font-black text-slate-900 text-[10px] uppercase tracking-widest">Survey Frameworks</h2>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/20">
                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Framework Title</th>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-center">Category</th>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-center">Items</th>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Strategic Description</th>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {templates.length > 0 ? templates.map((tpl) => (
                                <tr key={tpl.id} className="group hover:bg-slate-50/50 transition-all">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-9 h-9 rounded-xl bg-violet-50 text-[#7C3AED] flex items-center justify-center group-hover:bg-[#7C3AED] group-hover:text-white transition-all">
                                                <span className="material-symbols-rounded text-lg">description</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900 tracking-tight leading-tight">{tpl.title}</p>
                                                <p className="text-[9px] font-bold text-slate-400 mt-0.5">ID: {tpl.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-block bg-violet-50 text-[#7C3AED] text-[9px] font-black px-3 py-1 rounded-full border border-violet-100 uppercase tracking-tighter">
                                            {tpl.survey_type.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-[11px] font-bold text-slate-600 tabular-nums">
                                            {tpl.questions?.length || 0} Questions
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-[11px] text-slate-500 font-medium line-clamp-1 max-w-sm">{tpl.description || "Engagement analytics framework."}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button 
                                                onClick={() => router.push(`/enterprise/surveys/templates/edit/${tpl.id}`)}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                                            >
                                                <span className="material-symbols-rounded text-[20px]">edit</span>
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(tpl.id)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                                            >
                                                <span className="material-symbols-rounded text-[20px]">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <p className="text-slate-300 font-black text-[10px] uppercase tracking-widest">Library Empty</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
