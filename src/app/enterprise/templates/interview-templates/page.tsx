"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import {
    Trash2,
    Settings2, 
    Mic2, 
    Video, 
    Clock, 
    Search, 
    RefreshCcw, 
    MessagesSquare,
    Calendar,
    ArrowRight,
    Plus
} from "@/components/icons";
import TemplateBuilder from "@/app/enterprise/automation/interview/TemplateBuilder";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { jetbrainsMono, PageHelp } from "@/components/ds";

interface InterviewTemplate {
    id: string;
    title: string;
    topic: string;
    duration: number;
    difficulty: string;
    require_video: boolean;
    type: string;
    created_at: string;
    plan?: Record<string, unknown>;
}

function InterviewTemplatesContent() {
    const { token, canAccess } = useAuth();
    const { t: tr } = useI18n();
    const [templates, setTemplates] = useState<InterviewTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showBuilder, setShowBuilder] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<InterviewTemplate | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<{ id: string; name: string } | null>(null);
    const [interviewSearch, setInterviewSearch] = useState("");
    const [difficultyFilter, setDifficultyFilter] = useState("ALL");

    const fetchTemplates = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/interview-templates/`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                },
            });
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error("Failed to fetch interview templates:", error);
        } finally {
            setTimeout(() => setIsLoading(false), 600);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchTemplates();
        }
    }, [token, fetchTemplates]);

    const handleDelete = async () => {
        if (!templateToDelete) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/interview-templates/${templateToDelete.id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
            });
            if (res.ok) {
                setTemplates((prev) => prev.filter((t) => t.id !== templateToDelete.id));
            }
        } catch (error) {
            console.error("Failed to delete interview template:", error);
        } finally {
            setIsDeleteModalOpen(false);
            setTemplateToDelete(null);
        }
    };

    if (isLoading && templates.length === 0) {
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

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = (t.title + t.topic).toLowerCase().includes(interviewSearch.toLowerCase());
        const matchesDiff = difficultyFilter === "ALL" || t.difficulty === difficultyFilter;
        return matchesSearch && matchesDiff;
    });

    return (
        <div className="px-4 sm:px-5 pb-20 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 relative">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight">{tr("templatesMgmt.interviewTemplatesTitle")}</h1>
                        <PageHelp title={tr("templatesMgmt.interviewTemplatesTitle")}>
                            <p>{tr("templatesMgmt.interviewTemplatesHelp")}</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("templatesMgmt.interviewTemplatesSubtitle")}</p>
                </div>

                <div className="flex items-center gap-2.5">
                    {canAccess("interviews:moderate") && (
                        <button 
                            onClick={() => {
                                setEditingTemplate(null);
                                setShowBuilder(true);
                            }}
                            className="h-8 px-4 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-[4px] text-[13px] font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            {tr("templatesMgmt.newTemplate")}
                        </button>
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
                    { label: tr("templatesMgmt.totalTemplates"), value: templates.length, Icon: MessagesSquare, grad: "linear-gradient(135deg,#42A5F5,#1976D2)", glow: "rgba(25,118,210,0.25)" },
                    { label: tr("templatesMgmt.videoCalls"), value: templates.filter(t => t.require_video).length, Icon: Video, grad: "linear-gradient(135deg,#66BB6A,#2E7D32)", glow: "rgba(46,125,50,0.25)" },
                    { label: tr("templatesMgmt.audioOnly"), value: templates.filter(t => !t.require_video).length, Icon: Mic2, grad: "linear-gradient(135deg,#42A5F5,#1565C0)", glow: "rgba(21,101,192,0.25)" },
                    { label: tr("templatesMgmt.avgDuration"), value: templates.length ? Math.round(templates.reduce((acc, t) => acc + t.duration, 0) / templates.length) + "m" : "0m", Icon: Clock, grad: "linear-gradient(135deg,#FFB300,#EF6C00)", glow: "rgba(239,108,0,0.25)" },
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

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 relative group w-full">
                    <i className="mdi mdi-magnify absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9E9E] group-focus-within:text-[#1976D2] transition-colors text-[20px]" />
                    <input 
                        type="text"
                        placeholder={tr("templatesMgmt.searchInterviewPlaceholder")}
                        className="w-full h-10 pl-11 pr-4 bg-white border border-[#E0E0E0] rounded-[4px] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all text-[13.5px] text-[#212121] placeholder:text-[#9E9E9E]"
                        value={interviewSearch}
                        onChange={(e) => setInterviewSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 bg-white border border-[#E0E0E0] px-3 h-10 rounded-[4px] shadow-sm shrink-0 w-full sm:w-auto">
                    <i className="mdi mdi-filter-variant text-[#9E9E9E] text-[20px]" />
                    <select 
                        className="bg-transparent text-[12px] font-bold text-[#424242] outline-none pr-2 cursor-pointer flex-1 sm:flex-initial"
                        value={difficultyFilter}
                        onChange={(e) => setDifficultyFilter(e.target.value)}
                    >
                        <option value="ALL">{tr("templatesMgmt.allDifficulties")}</option>
                        <option value="Entry">{tr("templatesMgmt.diffEntry")}</option>
                        <option value="Intermediate">{tr("templatesMgmt.diffIntermediate")}</option>
                        <option value="Advanced">{tr("templatesMgmt.diffAdvanced")}</option>
                        <option value="Expert">{tr("templatesMgmt.diffExpert")}</option>
                    </select>
                </div>
            </div>

            {filteredTemplates.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-[4px] border border-dashed border-[#E0E0E0] shadow-sm max-w-md mx-auto">
                    <div className="relative mb-5">
                        <div className="absolute -inset-3 rounded-full bg-[#1976D2]/10 blur-xl" />
                        <div className="relative w-14 h-14 rounded-[4px] flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#42A5F5,#1976D2)", boxShadow: "0 8px 24px rgba(25,118,210,0.3)" }}>
                            <MessagesSquare className="w-6 h-6" />
                        </div>
                    </div>
                    {templates.length === 0 ? (
                        <>
                            <h3 className="text-[16px] font-bold text-[#212121] mb-1">{tr("templatesMgmt.noTemplatesYet")}</h3>
                            <p className="text-[13px] text-[#757575] font-medium max-w-[280px] leading-relaxed mb-5">{tr("templatesMgmt.interviewEmptyDesc")}</p>
                            {canAccess("interviews:moderate") && (
                                <button
                                    onClick={() => { setEditingTemplate(null); setShowBuilder(true); }}
                                    className="px-5 h-9 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-[4px] font-semibold text-[13px] shadow-[0_4px_12px_rgba(25,118,210,0.2)] transition-all flex items-center gap-1.5"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    {tr("templatesMgmt.newTemplate")}
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <h3 className="text-[16px] font-bold text-[#212121] mb-1">{tr("templatesMgmt.noResultsFound")}</h3>
                            <p className="text-[13px] text-[#757575] font-medium max-w-[280px] leading-relaxed mb-5">{tr("templatesMgmt.interviewNoResultsDesc")}</p>
                            <button
                                onClick={() => { setInterviewSearch(""); setDifficultyFilter("ALL"); }}
                                className="px-5 h-9 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-[4px] font-semibold text-[13px] shadow-[0_4px_12px_rgba(25,118,210,0.2)] transition-all"
                            >
                                {tr("templatesMgmt.resetFilters")}
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map(template => (
                        <motion.div
                            layout
                            key={template.id}
                            className="group bg-white rounded-[4px] border border-[#E0E0E0] hover:border-[#1976D2]/40 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[170px]"
                            onClick={() => {
                                if (canAccess("interviews:moderate")) {
                                    setEditingTemplate(template);
                                    setShowBuilder(true);
                                }
                            }}
                        >
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="w-10 h-10 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center border border-[#BBDEFB]/60 group-hover:scale-105 transition-transform shrink-0">
                                        {template.require_video ? <Video className="w-5 h-5 stroke-[1.5]" /> : <Mic2 className="w-5 h-5 stroke-[1.5]" />}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {canAccess("interviews:moderate") && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingTemplate(template);
                                                    setShowBuilder(true);
                                                }}
                                                className="w-8 h-8 flex items-center justify-center text-[#757575] hover:text-[#1976D2] hover:bg-[#E3F2FD] rounded-[4px] border border-transparent hover:border-[#BBDEFB]/60 transition-all"
                                            >
                                                <i className="mdi mdi-pencil text-[18px]" />
                                            </button>
                                        )}
                                        {canAccess("interviews:delete") && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTemplateToDelete({ id: template.id, name: template.title });
                                                    setIsDeleteModalOpen(true);
                                                }}
                                                className="w-8 h-8 flex items-center justify-center text-[#757575] hover:text-rose-500 hover:bg-rose-50 rounded-[4px] border border-transparent hover:border-rose-100 transition-all"
                                            >
                                                <i className="mdi mdi-delete text-[18px]" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-[3px] border bg-[#E3F2FD] text-[#1976D2] border-[#BBDEFB]/80">
                                            {template.topic}
                                        </span>
                                        <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-[3px] border bg-slate-100 text-[#616161] border-[#E0E0E0]">
                                            {template.difficulty}
                                        </span>
                                    </div>
                                    <h3 className="text-[15px] font-bold text-[#212121] group-hover:text-[#1976D2] transition-colors truncate">{template.title}</h3>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-3 border-t border-[#E0E0E0] mt-4">
                                <div className="flex items-center gap-4 text-[#757575] text-[10px] font-semibold">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {template.duration}m
                                    </span>
                                    <span className="flex items-center gap-1">
                                        {template.require_video ? <Video className="w-3.5 h-3.5" /> : <Mic2 className="w-3.5 h-3.5" />}
                                        {template.require_video ? tr("templatesMgmt.video") : tr("templatesMgmt.audio")}
                                    </span>
                                </div>
                                <div className="text-[#757575] group-hover:text-[#1976D2] transition-colors">
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {showBuilder && (
                    <TemplateBuilder
                        token={token || ""}
                        backendUrl={BACKEND_URL}
                        initialData={
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            editingTemplate as any
                        }
                        onClose={() => {
                            setShowBuilder(false);
                            setEditingTemplate(null);
                        }}
                        onSave={() => {
                            fetchTemplates();
                            setShowBuilder(false);
                            setEditingTemplate(null);
                        }}
                    />
                )}
            </AnimatePresence>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title={tr("templatesMgmt.deleteTemplateTitle")}
                message={tr("templatesMgmt.deleteConfirmInterview", { name: templateToDelete?.name ?? "" })}
                confirmLabel={tr("templatesMgmt.deleteTemplate")}
                cancelLabel={tr("common.cancel")}
                isDestructive={true}
            />
        </div>
    );
}

function InterviewTemplatesFallback() {
    const { t: tr } = useI18n();
    return (
        <div className="flex items-center justify-center h-screen bg-[#F5F6F8]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-[#1976D2] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[#757575] text-sm font-medium">{tr("templatesMgmt.loadingInterview")}</p>
            </div>
        </div>
    );
}

export default function InterviewTemplatesPage() {
    return (
        <Suspense fallback={<InterviewTemplatesFallback />}>
            <InterviewTemplatesContent />
        </Suspense>
    );
}
