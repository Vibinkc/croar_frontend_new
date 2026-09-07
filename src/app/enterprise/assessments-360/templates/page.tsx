"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { BACKEND_URL } from "@/utils/api";
import { Card, Input, Badge, PageHelp, jetbrainsMono } from "@/components/ds";

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
    const { token, canAccess } = useAuth();
    const { t: tr } = useI18n();
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchTemplates = useCallback(async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/x360/templates`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setTemplates(data);
            } else {
                setTemplates([]);
            }
        } catch (error) {
            console.error("Failed to fetch templates:", error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleDelete = async (id: string) => {
        if (!window.confirm(tr("assess360.confirmDeleteTemplate"))) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/x360/templates/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchTemplates();
            }
        } catch (error) {
            console.error("Failed to delete template:", error);
        }
    };

    const filteredTemplates = templates.filter((tpl) =>
        tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tpl.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalQuestions = templates.reduce((sum, tpl) => sum + (tpl.questions?.length || 0), 0);

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => router.push('/enterprise/assessments-360')}
                        className="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-[4px] text-[#757575] hover:bg-white hover:text-[#212121] border border-transparent hover:border-[#E0E0E0] transition-colors"
                        title={tr("assess360.backToAssessments")}
                    >
                        <span className="material-symbols-rounded text-[20px]">arrow_back</span>
                    </button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight truncate">{tr("assess360.assessmentLibrary")}</h1>
                            <PageHelp title={tr("assess360.assessmentLibrary")}>{tr("assess360.libraryHelp")}</PageHelp>
                        </div>
                        <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("assess360.librarySubtitle")}</p>
                    </div>
                </div>
                {canAccess("assessments:moderate") && (
                    <div className="flex items-center gap-2.5 shrink-0">
                        <button
                            onClick={() => router.push('/enterprise/assessments-360/templates/new')}
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-[4px] bg-[#1976D2] text-white text-[13px] font-semibold hover:bg-[#1565C0] shadow-[0_4px_12px_rgba(25,118,210,0.28)] transition-colors"
                        >
                            <span className="material-symbols-rounded text-[17px]">add</span>
                            {tr("assess360.newTemplate")}
                        </button>
                    </div>
                )}
            </header>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="relative bg-white border border-[#E0E0E0] rounded-[4px] p-5 overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: "linear-gradient(135deg,#42A5F5,#1976D2)" }} />
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("assess360.templates")}</span>
                            <div className={`text-[28px] font-semibold tracking-[-1px] text-[#212121] mt-2 ${jetbrainsMono.className}`}>{loading ? "—" : templates.length}</div>
                        </div>
                        <span className="w-10 h-10 rounded-[4px] flex items-center justify-center text-white shrink-0" style={{ background: "linear-gradient(135deg,#42A5F5,#1976D2)", boxShadow: "0 6px 14px rgba(25,118,210,0.28)" }}>
                            <span className="material-symbols-rounded text-[18px]">description</span>
                        </span>
                    </div>
                </div>
                <div className="relative bg-white border border-[#E0E0E0] rounded-[4px] p-5 overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: "linear-gradient(135deg,#42A5F5,#1565C0)" }} />
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("assess360.totalQuestions")}</span>
                            <div className={`text-[28px] font-semibold tracking-[-1px] text-[#212121] mt-2 ${jetbrainsMono.className}`}>{loading ? "—" : totalQuestions}</div>
                        </div>
                        <span className="w-10 h-10 rounded-[4px] flex items-center justify-center text-white shrink-0" style={{ background: "linear-gradient(135deg,#42A5F5,#1565C0)", boxShadow: "0 6px 14px rgba(21,101,192,0.25)" }}>
                            <span className="material-symbols-rounded text-[18px]">quiz</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Toolbar: search */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <Input
                    icon="search"
                    type="text"
                    placeholder={tr("assess360.searchTemplatesPlaceholder")}
                    className="flex-1"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Templates grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-[168px] bg-[#F5F6F8] rounded-[4px] animate-pulse" />
                    ))}
                </div>
            ) : filteredTemplates.length === 0 ? (
                <Card padding="none" className="min-h-[420px] flex flex-col items-center justify-center p-16 md:p-20 text-center">
                    <div className="w-16 h-16 bg-[#F5F6F8] rounded-[4px] flex items-center justify-center mb-5 text-[#BDBDBD]">
                        <span className="material-symbols-rounded text-[32px]">description</span>
                    </div>
                    <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#212121] mb-2">
                        {searchQuery ? tr("assess360.noTemplatesSearch") : tr("assess360.noTemplatesYet")}
                    </h3>
                    <p className="text-[#757575] text-[14px] max-w-xs mx-auto mb-7">
                        {searchQuery
                            ? tr("assess360.adjustSearchTerms")
                            : tr("assess360.buildFirstTemplate")}
                    </p>
                    {searchQuery ? (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="inline-flex items-center h-[42px] px-4 rounded-[4px] bg-[#1976D2] text-white text-[13.5px] font-semibold hover:bg-[#1565C0] transition-colors"
                        >
                            {tr("assess360.clearSearch")}
                        </button>
                    ) : (
                        canAccess("assessments:moderate") && (
                            <button
                                onClick={() => router.push('/enterprise/assessments-360/templates/new')}
                                className="inline-flex items-center gap-2 h-[42px] px-4 rounded-[4px] bg-[#1976D2] text-white text-[13.5px] font-semibold hover:bg-[#1565C0] shadow-[0_6px_16px_rgba(25,118,210,0.28)] transition-colors"
                            >
                                <span className="material-symbols-rounded text-[19px]">add</span> {tr("assess360.newTemplate")}
                            </button>
                        )
                    )}
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map((tpl) => (
                        <Card
                            key={tpl.id}
                            interactive
                            padding="none"
                            className="group flex flex-col p-5 cursor-pointer"
                            onClick={() => router.push(`/enterprise/assessments-360/templates/${tpl.id}/edit`)}
                        >
                            <div className="flex items-start gap-3 min-w-0">
                                <span className="w-10 h-10 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center shrink-0 transition-colors group-hover:bg-[#1976D2] group-hover:text-white">
                                    <span className="material-symbols-rounded text-[20px]">description</span>
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[14.5px] font-bold text-[#212121] tracking-[-0.2px] leading-tight truncate group-hover:text-[#1976D2] transition-colors">{tpl.name}</p>
                                    <p className={`text-[11px] text-[#757575] mt-1 ${jetbrainsMono.className}`}>
                                        {new Date(tpl.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <p className="text-[12.5px] text-[#424242] mt-3.5 line-clamp-2 min-h-[36px]">
                                {tpl.description || tr("assess360.perfArchTemplate")}
                            </p>

                            <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-[#EEEEEE]">
                                <Badge tone="indigo">
                                    {tpl.questions?.length || 0} {tr("assess360.questionsSuffix")}
                                </Badge>
                                <div className="flex items-center gap-1">
                                    {canAccess("assessments:moderate") && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); router.push(`/enterprise/assessments-360/templates/${tpl.id}/edit`); }}
                                            className="w-9 h-9 flex items-center justify-center rounded-[4px] text-[#9E9E9E] hover:bg-[#E3F2FD] hover:text-[#1976D2] transition-colors"
                                            title={tr("assess360.editTemplate")}
                                        >
                                            <span className="material-symbols-rounded text-[19px]">edit</span>
                                        </button>
                                    )}
                                    {canAccess("assessments:moderate") && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(tpl.id); }}
                                            className="w-9 h-9 flex items-center justify-center rounded-[4px] text-[#9E9E9E] hover:bg-[#FFEBEE] hover:text-[#C62828] transition-colors"
                                            title={tr("assess360.deleteTemplate")}
                                        >
                                            <span className="material-symbols-rounded text-[19px]">delete</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
