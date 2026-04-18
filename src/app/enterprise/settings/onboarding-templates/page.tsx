"use client";

import React, { useState, useEffect } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
    Plus, 
    Trash2, 
    Edit3, 
    Search,
    ChevronRight,
    Cpu,
    RefreshCcw,
    Layers,
    History,
    ArrowRight,
    ClipboardList,
    Layout
} from "lucide-react";
import ConfirmationModal from "@/components/common/ConfirmationModal";

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
    const { token, canAccess } = useAuth();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<{ id: string; name: string } | null>(null);

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
            setTimeout(() => setIsLoading(false), 600);
        }
    };

    const handleDelete = async () => {
        if (!templateToDelete) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/onboarding/templates/${templateToDelete.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) fetchTemplates();
        } catch (error) {
            console.error("Error deleting template:", error);
        } finally {
            setIsDeleteModalOpen(false);
            setTemplateToDelete(null);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
                <div className="h-32 bg-slate-900 rounded-2xl relative overflow-hidden flex items-center px-10 shadow-2xl">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/5 rounded-xl animate-pulse" />
                        <div className="space-y-2">
                            <div className="w-48 h-6 bg-white/10 rounded-xl animate-pulse" />
                            <div className="w-32 h-3 bg-white/5 rounded-xl animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white h-80 rounded-2xl border border-slate-100 animate-pulse shadow-sm" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-5 max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-700 relative">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl border border-slate-100 p-2 shadow-lg shadow-slate-200/20">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-9 h-9 bg-violet-50 text-[#7C3AED] rounded-xl flex items-center justify-center">
                        <span className="material-symbols-rounded">rule</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 tracking-tight">Onboarding Templates</h1>
                        <p className="text-slate-500 text-[10px] font-medium   ">Design integration sequences</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {canAccess("onboarding:moderate") && (
                        <Link 
                            href="/enterprise/settings/onboarding-templates/create"
                            className="px-6 py-2.5 bg-[#7C3AED] text-white rounded-xl hover:bg-[#6D28D9] transition-all font-black text-[9px]   flex items-center gap-2 shadow-xl shadow-indigo-100"
                        >
                            <span className="material-symbols-rounded text-base">add</span>
                            New Template
                        </Link>
                    )}
                    <button 
                        onClick={fetchTemplates}
                        className="w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-[#7C3AED] hover:bg-slate-50 hover:border-violet-100 transition-all flex items-center justify-center shadow-sm"
                    >
                        <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Template List */}
            {templates.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-2xl border border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-xl flex items-center justify-center mx-auto mb-6">
                        <ClipboardList className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">No Templates Found</h3>
                    <p className="text-sm text-slate-400 font-medium mt-2 max-w-[280px] mx-auto leading-relaxed">Synthesize your first onboarding sequence to standardize the cultural handshake.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {templates.map((t) => (
                        <motion.div 
                            layout
                            key={t.id}
                            className="group bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col cursor-pointer"
                        >
                            <div className="p-6 pb-2 space-y-6 flex-1">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                        <Layers className="w-6 h-6 stroke-[1.5]" />
                                    </div>
                                    {canAccess("onboarding:moderate") && (
                                        <div className="flex gap-2">
                                            <Link 
                                                href={`/enterprise/settings/onboarding-templates/${t.id}/edit`}
                                                className="p-2 bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all rounded-xl"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </Link>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTemplateToDelete({ id: t.id, name: t.name });
                                                    setIsDeleteModalOpen(true);
                                                }} 
                                                className="p-2 bg-rose-50 text-rose-300 hover:bg-rose-500 hover:text-white transition-all rounded-xl"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{t.name}</h3>
                                    <p className="text-sm text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Onboarding flow architect</p>
                                </div>

                                <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed h-10 font-medium">
                                    {t.description || "Standard organizational integration workflow."}
                                </p>
                                
                                <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100/50 group-hover:bg-indigo-50/30 group-hover:border-indigo-100/50 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <p className="text-[10px] font-bold text-slate-800  ">
                                                {(t.form_config?.sections || []).length} Sections Defined
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="px-6 py-4 flex items-center justify-between bg-slate-50/50 border-t border-slate-200/50 rounded-b-3xl mt-auto">
                                <div className="flex items-center gap-2 text-slate-300">
                                    <History className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold  ">{new Date(t.created_at).toLocaleDateString()}</span>
                                </div>
                                <Link 
                                    href={`/enterprise/settings/onboarding-templates/${t.id}/edit`}
                                    className="text-slate-300 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <span className="text-[10px] font-bold  ">Configure</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Template?"
                message={`Are you sure you want to delete "${templateToDelete?.name}"? This will remove all associated onboarding logic.`}
                confirmLabel="Delete Template"
                cancelLabel="Cancel"
                isDestructive={true}
            />
        </div>
    );
}
