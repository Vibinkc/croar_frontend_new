"use client";

import React, { useState, useEffect } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import Link from "next/link";

interface OnboardingField {
    name: string;
    label: string;
    type: "text" | "number" | "date" | "select" | "email" | "phone" | "file";
    required: boolean;
    options?: string[];
}

interface Section {
    id: string;
    title: string;
    fields: OnboardingField[];
}

interface OnboardingTemplate {
    id: string;
    name: string;
    description?: string;
    sections: string[];
    form_config: { sections: Section[] };
    created_at: string;
}

export default function OnboardingTemplatesPage() {
    const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { token } = useAuth();

    useEffect(() => {
        fetchTemplates();
    }, [token]);

    const fetchTemplates = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/onboarding/templates/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error("Error fetching templates:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteTemplate = async (id: string) => {
        if (!confirm("Are you sure you want to delete this template?")) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/onboarding/templates/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) fetchTemplates();
        } catch (error) {
            console.error("Error deleting template:", error);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-[#FDFDFF] font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Onboarding Builder</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">Create fully dynamic onboarding flows with custom sections and fields.</p>
                </div>
                <Link 
                    href="/enterprise/settings/onboarding-templates/create"
                    className="flex items-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-900/20"
                >
                    <span className="material-icons-outlined text-lg">add</span>
                    Create Template
                </Link>
            </div>

            {/* Template List */}
            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin material-icons-outlined text-indigo-500 text-4xl">sync</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {templates.map((t) => (
                        <motion.div 
                            key={t.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm hover:shadow-2xl transition-all group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <Link 
                                    href={`/enterprise/settings/onboarding-templates/${t.id}/edit`}
                                    className="p-4 bg-indigo-50 text-indigo-600 rounded-[20px] group-hover:bg-indigo-600 group-hover:text-white transition-all cursor-pointer"
                                >
                                    <span className="material-icons-outlined text-2xl">architecture</span>
                                </Link>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link 
                                        href={`/enterprise/settings/onboarding-templates/${t.id}/edit`}
                                        className="p-3 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-colors"
                                    >
                                        <span className="material-icons-outlined">edit</span>
                                    </Link>
                                    <button onClick={() => deleteTemplate(t.id)} className="p-3 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-colors">
                                        <span className="material-icons-outlined">delete</span>
                                    </button>
                                </div>
                            </div>
                            <Link href={`/enterprise/settings/onboarding-templates/${t.id}/edit`}>
                                <h3 className="text-xl font-black text-slate-900 mb-2 hover:text-indigo-600 transition-colors cursor-pointer">{t.name}</h3>
                            </Link>
                            <p className="text-slate-500 text-xs font-medium mb-8 line-clamp-2 leading-relaxed">{t.description || "Fully customizable onboarding process."}</p>
                            

                            <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{(t.form_config?.sections || []).length} Sections</span>
                                <Link 
                                    href={`/enterprise/settings/onboarding-templates/${t.id}/edit`}
                                    className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                                >
                                    Configuration
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                    {templates.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-slate-50 rounded-[40px] border-4 border-dashed border-slate-200">
                             <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <span className="material-icons-outlined text-4xl text-slate-300">description</span>
                             </div>
                             <p className="text-slate-500 font-black uppercase text-xs tracking-widest">No templates found. Start by creating one.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
