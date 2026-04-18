"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";

export default function SurveyTemplates() {
    const { token } = useAuth();
    const router = useRouter();
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await apiClient.get('/api/v1/enterprise/surveys/templates');
                if (res.ok) setTemplates(await res.json());
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, []);

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
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1">Survey Frameworks</h1>
                        <p className="text-slate-500 text-xs font-medium">Manage and deploy specialized organizational pulse frameworks</p>
                    </div>
                </div>
                <button 
                    onClick={() => router.push('/enterprise/surveys/templates/new')}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold text-xs flex items-center gap-2 shadow-md shadow-indigo-100"
                >
                    <span className="material-symbols-rounded text-lg">add_box</span>
                    Launch New Framework
                </button>
            </header>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-8 py-4 text-[11px] font-bold text-slate-500  ">Framework Title</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500   text-center">Category</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500   text-center">Items</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500  ">Strategic Description</th>
                                <th className="px-8 py-4 text-[11px] font-bold text-slate-500   text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {templates.length > 0 ? templates.map((tpl) => (
                                <tr key={tpl.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <span className="material-symbols-rounded text-lg">architecture</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{tpl.title}</p>
                                                <p className="text-[10px] font-medium text-slate-400 mt-0.5">ID: {tpl.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className="inline-block bg-indigo-50 text-indigo-600 text-[10px] font-bold px-3 py-1 rounded-xl border border-indigo-100  ">
                                            {tpl.survey_type.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className="text-sm font-bold text-slate-600">{tpl.questions.length}</span>
                                    </td>
                                    <td className="px-6 py-5 max-w-sm">
                                        <p className="text-xs text-slate-500 line-clamp-1  font-medium leading-relaxed">
                                            {tpl.description || "General framework designed for comprehensive feedback."}
                                        </p>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => router.push(`/enterprise/surveys/templates/edit/${tpl.id}`)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                            >
                                                <span className="material-symbols-rounded text-xl">edit_note</span>
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                                <span className="material-symbols-rounded text-xl">delete_sweep</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-40">
                                            <span className="material-symbols-rounded text-5xl mb-4">inventory_2</span>
                                            <p className="text-sm font-bold   text-slate-400">Library Empty</p>
                                        </div>
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
