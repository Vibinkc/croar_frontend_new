"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { apiClient } from "@/utils/api";
import {
    ArrowLeft,
    Search,
    Plus,
    FileText,
    ListChecks,
    Pencil,
    Trash2,
    LayoutTemplate,
} from "lucide-react";
import { StatGrid, StatCard, Badge, PageHelp, jetbrainsMono } from "@/components/ds";

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
    const { canAccess } = useAuth();
    const { t: tr } = useI18n();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

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
        if (!window.confirm(tr("surveysExt.confirmDeleteTemplate"))) return;
        try {
            const res = await apiClient.delete(`/api/v1/enterprise/surveys/templates/${id}`);
            if (res.ok) fetchTemplates();
        } catch (error) {
            console.error("Failed to delete template:", error);
        }
    };

    const filteredTemplates = templates.filter((tpl) =>
        tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.survey_type?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalQuestions = templates.reduce((sum, t) => sum + (t.questions?.length || 0), 0);
    const categoryCount = new Set(templates.map((t) => t.survey_type?.name).filter(Boolean)).size;

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => router.push('/enterprise/surveys')}
                        className="w-9 h-9 shrink-0 flex items-center justify-center rounded-[10px] bg-white border border-[#E1E4E8] text-[#374151] hover:bg-[#F4F5F7] hover:text-[#15171C] transition-colors shadow-sm"
                        aria-label={tr("surveysExt.backToSurveys")}
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">{tr("surveysExt.surveyFrameworks")}</h1>
                            <PageHelp title={tr("surveysExt.surveyFrameworks")}>{tr("surveysExt.frameworksHelp")}</PageHelp>
                        </div>
                        <p className="text-[12.5px] text-[#8A929E] mt-0.5 truncate">{tr("surveysExt.frameworksSubtitle")}</p>
                    </div>
                </div>
                {canAccess("surveys:create") && (
                    <Link
                        href="/enterprise/surveys/templates/new"
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-semibold hover:bg-[#4A43C9] shadow-[0_4px_12px_rgba(91,83,224,0.28)] transition-colors shrink-0 self-start sm:self-auto"
                    >
                        <Plus className="w-3.5 h-3.5" /> {tr("surveysExt.newTemplate")}
                    </Link>
                )}
            </header>

            {/* Stat cards */}
            <StatGrid>
                <StatCard label={tr("surveysExt.frameworks")} value={templates.length} icon="poll" gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)" glow="rgba(91,83,224,0.25)" />
                <StatCard label={tr("surveysExt.categories")} value={categoryCount} icon="category" gradient="linear-gradient(135deg,#6E8BEA,#3559C7)" glow="rgba(53,89,199,0.25)" />
                <StatCard label={tr("surveysExt.totalQuestions")} value={totalQuestions} icon="quiz" gradient="linear-gradient(135deg,#34D399,#0E8A6E)" glow="rgba(14,138,110,0.25)" />
                <StatCard label={tr("surveysExt.showing")} value={filteredTemplates.length} icon="description" gradient="linear-gradient(135deg,#F6B65C,#D97706)" glow="rgba(217,119,6,0.25)" />
            </StatGrid>

            {/* Toolbar: search */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9AA3AF]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={tr("surveysExt.searchFrameworks")}
                        className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] pl-10 pr-4 text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                    />
                </div>
            </div>

            {/* Templates grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-[164px] bg-[#F4F5F7] border border-[#E8EAED] rounded-[14px] animate-pulse" />
                    ))}
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div className="bg-white rounded-[14px] border border-[#E8EAED] min-h-[420px] flex flex-col items-center justify-center p-16 md:p-20 text-center">
                    <div className="w-16 h-16 bg-[#F4F5F7] rounded-[16px] flex items-center justify-center mb-5">
                        <LayoutTemplate className="w-8 h-8 text-[#C7CCD4]" />
                    </div>
                    <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#15171C] mb-2">
                        {templates.length === 0 ? tr("surveysExt.noFrameworksYet") : tr("surveysExt.noFrameworksMatch")}
                    </h3>
                    <p className="text-[#8A929E] text-[14px] max-w-xs mx-auto mb-7">
                        {templates.length === 0
                            ? tr("surveysExt.noFrameworksYetDesc")
                            : tr("surveysExt.noFrameworksMatchDesc")}
                    </p>
                    {templates.length === 0 ? (
                        canAccess("surveys:moderate") && (
                            <Link href="/enterprise/surveys/templates/new" className="inline-flex items-center gap-2 h-[42px] px-4 rounded-[10px] bg-[#5B53E0] text-white text-[13.5px] font-semibold hover:bg-[#4A43C9] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-colors">
                                <Plus className="w-4 h-4" /> {tr("surveysExt.newTemplate")}
                            </Link>
                        )
                    ) : (
                        <button onClick={() => setSearchQuery("")} className="inline-flex items-center h-[42px] px-4 rounded-[10px] bg-[#5B53E0] text-white text-[13.5px] font-semibold hover:bg-[#4A43C9] transition-colors">
                            {tr("surveysExt.clearSearch")}
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map((tpl) => (
                        <div
                            key={tpl.id}
                            onClick={() => router.push(`/enterprise/surveys/templates/edit/${tpl.id}`)}
                            className="group bg-white border border-[#E8EAED] rounded-[14px] p-5 flex flex-col transition-colors hover:border-[#D4D7DC] cursor-pointer"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <span className="w-10 h-10 rounded-[11px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0 group-hover:bg-[#5B53E0] group-hover:text-white transition-colors">
                                    <FileText className="w-[18px] h-[18px]" />
                                </span>
                                <Badge tone="indigo">{tpl.survey_type.name}</Badge>
                            </div>

                            <div className="mt-4 min-w-0">
                                <h3 className="text-[15px] font-bold text-[#15171C] tracking-[-0.2px] leading-snug group-hover:text-[#5B53E0] transition-colors line-clamp-1">{tpl.title}</h3>
                                <p className="text-[10px] font-semibold text-[#C7CCD4] uppercase tracking-[0.04em] mt-1">ID: {tpl.id.slice(0, 8)}</p>
                                <p className="text-[13px] text-[#8A929E] mt-2 line-clamp-2 leading-relaxed">{tpl.description || tr("surveysExt.engagementAnalyticsFramework")}</p>
                            </div>

                            <div className="mt-auto pt-4 flex items-center justify-between border-t border-[#F0F0F1]">
                                <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[#374151]">
                                    <ListChecks className="w-3.5 h-3.5 text-[#9AA3AF]" />
                                    <span className={jetbrainsMono.className}>{tpl.questions?.length || 0}</span> {tr("surveysExt.questions")}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/enterprise/surveys/templates/edit/${tpl.id}`);
                                        }}
                                        className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#ECEBFB] hover:text-[#5B53E0] transition-colors"
                                        title={tr("surveysExt.editFramework")}
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(tpl.id);
                                        }}
                                        className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#FDECEC] hover:text-[#C0383C] transition-colors"
                                        title={tr("surveysExt.deleteFramework")}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
