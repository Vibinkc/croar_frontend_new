"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { jetbrainsMono, PageHelp } from "@/components/ds";

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
    const router = useRouter();
    const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { token, canAccess } = useAuth();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<{ id: string; name: string } | null>(null);
    const [onboardingSearch, setOnboardingSearch] = useState("");

    const fetchTemplates = useCallback(async () => {
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
    }, [token]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);


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
            <div className="px-4 sm:px-5 pb-20 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
                <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="w-40 h-6 bg-[#E8EAED] rounded-[8px] animate-pulse" />
                        <div className="w-60 h-4 bg-[#E8EAED] rounded-[6px] animate-pulse" />
                    </div>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white h-64 rounded-[14px] border border-[#E8EAED] animate-pulse shadow-sm" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-5 pb-20 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 relative">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">Onboarding Templates</h1>
                        <PageHelp title="Onboarding Templates">
                            <p>Reusable onboarding checklists for new hires.</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#8A929E] mt-0.5">Design integration sequences and standard documents.</p>
                </div>

                <div className="flex items-center gap-2.5">
                    {canAccess("onboarding:moderate") && (
                        <Link 
                            href="/enterprise/templates/onboarding-templates/create"
                            className="h-8 px-4 bg-[#5B53E0] hover:bg-[#4A43C9] text-white rounded-[10px] text-[13px] font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            New Template
                        </Link>
                    )}
                    <button 
                        onClick={fetchTemplates}
                        className="w-8 h-8 bg-white border border-[#E1E4E8] rounded-[10px] text-[#6B6F76] hover:text-[#374151] hover:bg-[#F4F5F7] transition-all flex items-center justify-center shadow-sm"
                    >
                        <RefreshCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[
                    { label: "Active Flows", value: templates.length, Icon: Layers, grad: "linear-gradient(135deg,#8B7DFF,#5B53E0)", glow: "rgba(91,83,224,0.25)" },
                    { label: "Total Sections", value: templates.reduce((acc, t) => acc + (t.form_config?.sections?.length || 0), 0), Icon: ClipboardList, grad: "linear-gradient(135deg,#34D399,#0E8A6E)", glow: "rgba(14,138,110,0.25)" },
                    { label: "Form Fields", value: templates.reduce((acc, t) => acc + (t.form_config?.sections?.reduce((sAcc, s) => sAcc + (s.fields?.length || 0), 0) || 0), 0), Icon: Cpu, grad: "linear-gradient(135deg,#6E8BEA,#3559C7)", glow: "rgba(53,89,199,0.25)" },
                    { label: "Avg Steps", value: templates.length ? Math.round(templates.reduce((acc, t) => acc + (t.form_config?.sections?.length || 0), 0) / templates.length) : 0, Icon: Layout, grad: "linear-gradient(135deg,#FBBF24,#D97706)", glow: "rgba(217,119,6,0.25)" },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="relative bg-white border border-[#E8EAED] rounded-[14px] p-5 overflow-hidden flex flex-col justify-between min-h-[110px]"
                    >
                        <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: s.grad }} />
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{s.label}</span>
                                <div className={`text-[26px] font-semibold tracking-[-1px] text-[#15171C] mt-1.5 ${jetbrainsMono.className}`}>{s.value}</div>
                            </div>
                            <span className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white shrink-0" style={{ background: s.grad, boxShadow: `0 6px 14px ${s.glow}` }}>
                                <s.Icon className="w-4.5 h-4.5" />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 relative group w-full">
                    <span className="material-symbols-rounded absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA3AF] group-focus-within:text-[#5B53E0] transition-colors text-[20px]">search</span>
                    <input 
                        type="text"
                        placeholder="Search onboarding templates by name..."
                        className="w-full h-10 pl-11 pr-4 bg-white border border-[#E1E4E8] rounded-[10px] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15 transition-all text-[13.5px] text-[#15171C] placeholder:text-[#9AA3AF]"
                        value={onboardingSearch}
                        onChange={(e) => setOnboardingSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Template List Grid */}
            {templates.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-[14px] border border-dashed border-[#E8EAED] shadow-sm max-w-md mx-auto">
                    <div className="relative mb-5">
                        <div className="absolute -inset-3 rounded-full bg-[#5B53E0]/10 blur-xl" />
                        <div className="relative w-14 h-14 rounded-[16px] flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#8B7DFF,#5B53E0)", boxShadow: "0 8px 24px rgba(91,83,224,0.3)" }}>
                            <ClipboardList className="w-6 h-6" />
                        </div>
                    </div>
                    <h3 className="text-[16px] font-bold text-[#15171C] mb-1">No Templates Found</h3>
                    <p className="text-[13px] text-[#8A929E] font-medium max-w-[280px] leading-relaxed mb-5">Synthesize your first onboarding sequence to standardize the cultural handshake.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.filter(t => t.name.toLowerCase().includes(onboardingSearch.toLowerCase())).map((t) => (
                        <motion.div
                            layout
                            key={t.id}
                            className="group bg-white rounded-[14px] border border-[#E8EAED] hover:border-[#5B53E0]/40 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[170px]"
                            onClick={(e) => {
                                router.push(`/enterprise/templates/onboarding-templates/${t.id}/edit`);
                            }}
                        >
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="w-10 h-10 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center border border-[#DAD7F6]/60 group-hover:scale-105 transition-transform shrink-0">
                                        <Layers className="w-5 h-5 stroke-[1.5]" />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {canAccess("onboarding:moderate") && (
                                            <>
                                                <Link 
                                                    href={`/enterprise/templates/onboarding-templates/${t.id}/edit`}
                                                    className="w-8 h-8 flex items-center justify-center text-[#8A929E] hover:text-[#5B53E0] hover:bg-[#ECEBFB] rounded-[8px] border border-transparent hover:border-[#DAD7F6]/60 transition-all"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <span className="material-symbols-rounded text-[18px]">edit</span>
                                                </Link>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setTemplateToDelete({ id: t.id, name: t.name });
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center text-[#8A929E] hover:text-rose-500 hover:bg-rose-50 rounded-[8px] border border-transparent hover:border-rose-100 transition-all"
                                                >
                                                    <span className="material-symbols-rounded text-[18px]">delete</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-[15px] font-bold text-[#15171C] group-hover:text-[#5B53E0] transition-colors truncate">{t.name}</h3>
                                    <p className="text-[12px] text-[#8A929E] font-medium leading-relaxed line-clamp-2 h-9">
                                        {t.description || "Standard organizational integration workflow."}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-3 border-t border-[#E8EAED] mt-4">
                                <div className="flex items-center gap-2 text-[#8A929E] text-[10px] font-semibold">
                                    <span className="flex items-center gap-1">
                                        <History className="w-3.5 h-3.5" />
                                        {(t.form_config?.sections || []).length} Sections
                                    </span>
                                </div>
                                <Link 
                                    href={`/enterprise/templates/onboarding-templates/${t.id}/edit`}
                                    className="w-8 h-8 rounded-lg bg-white border border-[#E1E4E8] flex items-center justify-center text-[#8A929E] group-hover:text-[#5B53E0] group-hover:border-[#DAD7F6]/60 transition-all"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
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
