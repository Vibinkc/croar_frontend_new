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
    Architecture, 
    FileText, 
    Settings2, 
    History, 
    Layers,
    ArrowRight,
    Search,
    ChevronRight,
    Cpu
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
    const { token } = useAuth();
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
                <div className="h-32 bg-slate-900 rounded-[2.5rem] relative overflow-hidden flex items-center px-10 border-b-4 border-slate-800 shadow-2xl">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl animate-pulse" />
                        <div className="space-y-2">
                            <div className="w-48 h-6 bg-white/10 rounded-lg animate-pulse" />
                            <div className="w-32 h-3 bg-white/5 rounded-lg animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white h-80 rounded-[2.5rem] border border-slate-100 animate-pulse shadow-sm" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-12 max-w-7xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700 relative">
            {/* Tactical Command Header */}
            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl border-b-4 border-slate-800"
            >
                <div className="relative z-10 flex items-center gap-8">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-inner text-indigo-400 font-black italic">
                        <Cpu className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                            <span className="text-[8px] font-black uppercase tracking-[0.1em] text-indigo-400">Flow Architect Matrix</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter leading-none italic uppercase">Onboarding Builder</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-3 opacity-60">Dynamic Protocol Synthesis</p>
                    </div>
                </div>

                <div className="relative z-10">
                    <Link 
                        href="/enterprise/settings/onboarding-templates/create"
                        className="px-8 h-14 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-400 hover:text-white transition-all active:scale-95 shadow-xl shadow-slate-900/50 flex items-center gap-3"
                    >
                        <Plus className="w-5 h-5 text-indigo-400 group-hover:text-white" />
                        Create Protocol
                    </Link>
                </div>

                {/* Tactical background elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -mr-64 -mt-64" />
            </motion.header>

            {/* Template List */}
            {templates.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Layers className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">No Dynamics Found</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 max-w-[240px] mx-auto leading-relaxed">Synthesize your first onboarding sequence to standardize the cultural handshake.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {templates.map((t) => (
                        <motion.div 
                            layout
                            key={t.id}
                            className="group bg-white rounded-[2.5rem] border border-slate-100 p-1.5 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 relative overflow-hidden flex flex-col"
                        >
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="p-8 pb-4 space-y-6 flex-1">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-inner">
                                        <Layers className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                                        <Link 
                                            href={`/enterprise/settings/onboarding-templates/${t.id}/edit`}
                                            className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all"
                                        >
                                            <Edit3 className="w-5 h-5" />
                                        </Link>
                                        <button 
                                            onClick={() => {
                                                setTemplateToDelete({ id: t.id, name: t.name });
                                                setIsDeleteModalOpen(true);
                                            }} 
                                            className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tighter leading-none italic uppercase group-hover:text-indigo-600 transition-colors truncate">{t.name}</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate opacity-60 italic">Sequential Protocol Architect</p>
                                </div>

                                <p className="text-[11px] font-bold text-slate-500 line-clamp-2 leading-relaxed uppercase opacity-80 h-10 italic">
                                    {t.description || "Synthesizing dynamic organizational integration protocols."}
                                </p>
                                
                                <div className="bg-slate-50/50 rounded-2xl p-4 space-y-4 border border-slate-50 group-hover:bg-white group-hover:border-slate-100 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                                                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                                            </div>
                                            <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest italic truncate max-w-[120px]">{(t.form_config?.sections || []).length} Functional Nodes</span>
                                        </div>
                                        <ChevronRight className="w-3 h-3 text-slate-300" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="px-8 py-5 flex items-center justify-between bg-slate-50/50 border-t border-slate-50 rounded-b-[2.5rem]">
                                <div className="flex items-center gap-2 opacity-40">
                                    <History className="w-4 h-4" />
                                    <span className="text-[9px] font-black uppercase tracking-widest truncate">{new Date(t.created_at).toLocaleDateString()}</span>
                                </div>
                                <Link 
                                    href={`/enterprise/settings/onboarding-templates/${t.id}/edit`}
                                    className="text-[9px] font-black text-slate-400 group-hover:text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-1.5 transition-all italic underline underline-offset-4"
                                >
                                    Modify Matrix
                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
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
                title="Decommission Protocol?"
                message={`Are you sure you want to permanently wipe the blueprint "${templateToDelete?.name}"? All associated onboarding scripts will lose this dynamic reference.`}
                confirmLabel="Yes, Decommission"
                cancelLabel="No"
                isDestructive={true}
            />
        </div>
    );
}

// Fixed missing icon mapping
import { Layers as LayersIcon } from "lucide-react";
