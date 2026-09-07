"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
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
} from "@/components/icons";
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
    const { t: tr } = useI18n();
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
                <header className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="w-40 h-6 bg-[#E0E0E0] rounded-[4px] animate-pulse" />
                        <div className="w-60 h-4 bg-[#E0E0E0] rounded-[3px] animate-pulse" />
                    </div>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white h-64 rounded-[4px] border border-[#E0E0E0] animate-pulse shadow-sm" />
                    ))}
                </div>
            </div>
        );
    }

    const filteredTemplates = templates.filter(t => t.name.toLowerCase().includes(onboardingSearch.toLowerCase()));

    return (
        <div className="px-4 sm:px-5 pb-20 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 relative">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight">{tr("templatesMgmt.onboardingTemplatesTitle")}</h1>
                        <PageHelp title={tr("templatesMgmt.onboardingTemplatesTitle")}>
                            <p>{tr("templatesMgmt.onboardingTemplatesHelp")}</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("templatesMgmt.onboardingTemplatesSubtitle")}</p>
                </div>

                <div className="flex items-center gap-2.5">
                    {canAccess("onboarding:moderate") && (
                        <Link 
                            href="/enterprise/templates/onboarding-templates/create"
                            className="h-8 px-4 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-[4px] text-[13px] font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            {tr("templatesMgmt.newTemplate")}
                        </Link>
                    )}
                    <button 
                        onClick={fetchTemplates}
                        className="w-8 h-8 bg-white border border-[#E0E0E0] rounded-[4px] text-[#616161] hover:text-[#424242] hover:bg-[#F5F6F8] transition-all flex items-center justify-center shadow-sm"
                    >
                        <RefreshCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[
                    { label: tr("templatesMgmt.activeFlows"), value: templates.length, Icon: Layers, grad: "linear-gradient(135deg,#42A5F5,#1976D2)", glow: "rgba(25,118,210,0.25)" },
                    { label: tr("templatesMgmt.totalSections"), value: templates.reduce((acc, t) => acc + (t.form_config?.sections?.length || 0), 0), Icon: ClipboardList, grad: "linear-gradient(135deg,#66BB6A,#2E7D32)", glow: "rgba(46,125,50,0.25)" },
                    { label: tr("templatesMgmt.formFields"), value: templates.reduce((acc, t) => acc + (t.form_config?.sections?.reduce((sAcc, s) => sAcc + (s.fields?.length || 0), 0) || 0), 0), Icon: Cpu, grad: "linear-gradient(135deg,#42A5F5,#1565C0)", glow: "rgba(21,101,192,0.25)" },
                    { label: tr("templatesMgmt.avgSteps"), value: templates.length ? Math.round(templates.reduce((acc, t) => acc + (t.form_config?.sections?.length || 0), 0) / templates.length) : 0, Icon: Layout, grad: "linear-gradient(135deg,#FFB300,#EF6C00)", glow: "rgba(239,108,0,0.25)" },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="relative bg-white border border-[#E0E0E0] rounded-[4px] p-5 overflow-hidden flex flex-col justify-between min-h-[110px]"
                    >
                        <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: s.grad }} />
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{s.label}</span>
                                <div className={`text-[26px] font-semibold tracking-[-1px] text-[#212121] mt-1.5 ${jetbrainsMono.className}`}>{s.value}</div>
                            </div>
                            <span className="w-9 h-9 rounded-[4px] flex items-center justify-center text-white shrink-0" style={{ background: s.grad, boxShadow: `0 6px 14px ${s.glow}` }}>
                                <s.Icon className="w-4.5 h-4.5" />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 relative group w-full">
                    <i className="mdi mdi-magnify absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9E9E] group-focus-within:text-[#1976D2] transition-colors text-[20px]" />
                    <input 
                        type="text"
                        placeholder={tr("templatesMgmt.searchOnboardingPlaceholder")}
                        className="w-full h-10 pl-11 pr-4 bg-white border border-[#E0E0E0] rounded-[4px] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all text-[13.5px] text-[#212121] placeholder:text-[#9E9E9E]"
                        value={onboardingSearch}
                        onChange={(e) => setOnboardingSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Template List Grid */}
            {filteredTemplates.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-[4px] border border-dashed border-[#E0E0E0] shadow-sm max-w-md mx-auto">
                    <div className="relative mb-5">
                        <div className="absolute -inset-3 rounded-full bg-[#1976D2]/10 blur-xl" />
                        <div className="relative w-14 h-14 rounded-[4px] flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#42A5F5,#1976D2)", boxShadow: "0 8px 24px rgba(25,118,210,0.3)" }}>
                            <ClipboardList className="w-6 h-6" />
                        </div>
                    </div>
                    {templates.length === 0 ? (
                        <>
                            <h3 className="text-[16px] font-bold text-[#212121] mb-1">{tr("templatesMgmt.noTemplatesYet")}</h3>
                            <p className="text-[13px] text-[#757575] font-medium max-w-[280px] leading-relaxed mb-5">{tr("templatesMgmt.onboardingEmptyDesc")}</p>
                            {canAccess("onboarding:moderate") && (
                                <Link
                                    href="/enterprise/templates/onboarding-templates/create"
                                    className="px-5 h-9 inline-flex items-center gap-1.5 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-[4px] font-semibold text-[13px] shadow-[0_4px_12px_rgba(25,118,210,0.2)] transition-all"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    {tr("templatesMgmt.newTemplate")}
                                </Link>
                            )}
                        </>
                    ) : (
                        <>
                            <h3 className="text-[16px] font-bold text-[#212121] mb-1">{tr("templatesMgmt.noResultsFound")}</h3>
                            <p className="text-[13px] text-[#757575] font-medium max-w-[280px] leading-relaxed mb-5">{tr("templatesMgmt.onboardingNoResultsDesc")}</p>
                            <button
                                onClick={() => setOnboardingSearch("")}
                                className="px-5 h-9 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-[4px] font-semibold text-[13px] shadow-[0_4px_12px_rgba(25,118,210,0.2)] transition-all"
                            >
                                {tr("templatesMgmt.resetFilters")}
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map((t) => (
                        <motion.div
                            layout
                            key={t.id}
                            className="group bg-white rounded-[4px] border border-[#E0E0E0] hover:border-[#1976D2]/40 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[170px]"
                            onClick={(e) => {
                                router.push(`/enterprise/templates/onboarding-templates/${t.id}/edit`);
                            }}
                        >
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="w-10 h-10 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center border border-[#BBDEFB]/60 group-hover:scale-105 transition-transform shrink-0">
                                        <Layers className="w-5 h-5 stroke-[1.5]" />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {canAccess("onboarding:moderate") && (
                                            <>
                                                <Link 
                                                    href={`/enterprise/templates/onboarding-templates/${t.id}/edit`}
                                                    className="w-8 h-8 flex items-center justify-center text-[#757575] hover:text-[#1976D2] hover:bg-[#E3F2FD] rounded-[4px] border border-transparent hover:border-[#BBDEFB]/60 transition-all"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <i className="mdi mdi-pencil text-[18px]" />
                                                </Link>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setTemplateToDelete({ id: t.id, name: t.name });
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center text-[#757575] hover:text-rose-500 hover:bg-rose-50 rounded-[4px] border border-transparent hover:border-rose-100 transition-all"
                                                >
                                                    <i className="mdi mdi-delete text-[18px]" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-[15px] font-bold text-[#212121] group-hover:text-[#1976D2] transition-colors truncate">{t.name}</h3>
                                    <p className="text-[12px] text-[#757575] font-medium leading-relaxed line-clamp-2 h-9">
                                        {t.description || tr("templatesMgmt.onboardingDescFallback")}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-3 border-t border-[#E0E0E0] mt-4">
                                <div className="flex items-center gap-2 text-[#757575] text-[10px] font-semibold">
                                    <span className="flex items-center gap-1">
                                        <History className="w-3.5 h-3.5" />
                                        {tr("templatesMgmt.sectionsCount", { count: (t.form_config?.sections || []).length })}
                                    </span>
                                </div>
                                <Link 
                                    href={`/enterprise/templates/onboarding-templates/${t.id}/edit`}
                                    className="w-8 h-8 rounded-lg bg-white border border-[#E0E0E0] flex items-center justify-center text-[#757575] group-hover:text-[#1976D2] group-hover:border-[#BBDEFB]/60 transition-all"
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
                title={tr("templatesMgmt.deleteTemplateTitle")}
                message={tr("templatesMgmt.deleteConfirmOnboarding", { name: templateToDelete?.name ?? "" })}
                confirmLabel={tr("templatesMgmt.deleteTemplate")}
                cancelLabel={tr("common.cancel")}
                isDestructive={true}
            />
        </div>
    );
}
