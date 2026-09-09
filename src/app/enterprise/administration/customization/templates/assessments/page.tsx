"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { GenLanguage, localeToLanguageName } from "@/i18n/config";
import GenLanguageSelect from "@/components/ds/GenLanguageSelect";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Trash2, 
    X, 
    Save, 
    Zap, 
    Sparkles, 
    Code, 
    Brain, 
    Clock, 
    ListChecks, 
    ArrowRight,
    Search,
    RefreshCcw,
    Settings2,
    Calendar,
    Loader2,
    AlertTriangle
} from "@/components/icons";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { jetbrainsMono, PageHelp } from "@/components/ds";

interface GeneratedQuestion {
    id: string;
    type?: string;
    question?: string;
    options?: string[];
    correct_answer?: string;
    title?: string;
    description?: string;
    problem_statement?: string;
    [key: string]: unknown;
}

interface AssessmentTemplate {
    id: string;
    name: string;
    type: "APTITUDE" | "CODING" | "BOTH";
    topic: string;
    question_count: number;
    test_duration: number;
    generated_questions?: GeneratedQuestion[];
    email_template_id?: string;
    created_at?: string;
}

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
}

export default function AssessmentTemplatesPage() {
    const { token, canAccess } = useAuth();
    const { t: tr, locale } = useI18n();
    const [genLang, setGenLang] = useState<GenLanguage>(localeToLanguageName(locale));
    const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<AssessmentTemplate | null>(null);
    const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
    
    // Deletion
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<{ id: string; name: string } | null>(null);
    const [assessmentSearch, setAssessmentSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");

    // Form State
    const [name, setName] = useState("");
    const [type, setType] = useState<"APTITUDE" | "CODING" | "BOTH">("APTITUDE");
    const [topic, setTopic] = useState("");
    const [questionCount, setQuestionCount] = useState(10);
    const [duration, setDuration] = useState(30);
    const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState("");
    
    // Tab and Generation State
    const [activeTab, setActiveTab] = useState<'config' | 'questions'>('config');
    const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    // Save / validation / dirty-check state
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [initialSnapshot, setInitialSnapshot] = useState("");
    const [isRegenConfirmOpen, setIsRegenConfirmOpen] = useState(false);

    const fetchEmailTemplates = useCallback(async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/communication/templates`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEmailTemplates(data);
            }
        } catch (error) {
            console.error("Failed to fetch email templates:", error);
        }
    }, [token]);

    const fetchTemplates = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment-templates/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error("Failed to fetch assessment templates:", error);
        } finally {
            setTimeout(() => setIsLoading(false), 600);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchTemplates();
            fetchEmailTemplates();
        }
    }, [token, fetchTemplates, fetchEmailTemplates]);

    const snapshotOf = (vals: {
        name: string; type: string; topic: string; questionCount: number;
        duration: number; selectedEmailTemplateId: string; generatedQuestions: GeneratedQuestion[];
    }) => JSON.stringify(vals);

    const handleOpenModal = (template?: AssessmentTemplate) => {
        setSaveError(null);
        if (template) {
            const vals = {
                name: template.name,
                type: template.type,
                topic: template.topic,
                questionCount: template.question_count,
                duration: template.test_duration,
                selectedEmailTemplateId: template.email_template_id || "",
                generatedQuestions: template.generated_questions || [],
            };
            setEditingTemplate(template);
            setName(vals.name);
            setType(template.type);
            setTopic(vals.topic);
            setQuestionCount(vals.questionCount);
            setDuration(vals.duration);
            setSelectedEmailTemplateId(vals.selectedEmailTemplateId);
            setGeneratedQuestions(vals.generatedQuestions);
            setInitialSnapshot(snapshotOf(vals));
        } else {
            const vals = {
                name: "", type: "APTITUDE", topic: "", questionCount: 10,
                duration: 30, selectedEmailTemplateId: "", generatedQuestions: [] as GeneratedQuestion[],
            };
            setEditingTemplate(null);
            setName("");
            setType("APTITUDE");
            setTopic("");
            setQuestionCount(10);
            setDuration(30);
            setSelectedEmailTemplateId("");
            setGeneratedQuestions([]);
            setInitialSnapshot(snapshotOf(vals));
        }
        setActiveTab('config');
        setIsModalOpen(true);
    };

    const currentSnapshot = snapshotOf({ name, type, topic, questionCount, duration, selectedEmailTemplateId, generatedQuestions });
    const isDirty = currentSnapshot !== initialSnapshot;

    // Returns a human-readable problem (with the tab to focus), or null when valid.
    const validateTemplate = (): { message: string; tab: 'config' | 'questions' } | null => {
        if (!name.trim()) return { message: tr("templatesMgmt.errNameRequired"), tab: 'config' };
        if (!topic.trim()) return { message: tr("templatesMgmt.errTopicRequired"), tab: 'config' };
        if (generatedQuestions.length === 0)
            return { message: tr("templatesMgmt.errQuestionRequired"), tab: 'questions' };
        for (let i = 0; i < generatedQuestions.length; i++) {
            const q = generatedQuestions[i];
            const n = i + 1;
            if (q.type === 'CODING') {
                if (!(q.title || "").trim()) return { message: tr("templatesMgmt.errQChallengeTitle", { n }), tab: 'questions' };
                if (!((q.description || q.problem_statement || "") as string).trim())
                    return { message: tr("templatesMgmt.errQProblemSpec", { n }), tab: 'questions' };
            } else {
                if (!(q.question || "").trim()) return { message: tr("templatesMgmt.errQText", { n }), tab: 'questions' };
                const opts = (q.options || []).map(o => (o || "").trim());
                if (opts.length < 2 || opts.some(o => !o))
                    return { message: tr("templatesMgmt.errQOptions", { n }), tab: 'questions' };
                if (!(q.correct_answer || "").trim() || !opts.includes((q.correct_answer || "").trim()))
                    return { message: tr("templatesMgmt.errQCorrect", { n }), tab: 'questions' };
            }
        }
        return null;
    };

    // Generating replaces ALL existing questions. If the user already has some
    // (including a half-filled manual one), confirm before discarding them.
    const requestGenerate = () => {
        if (!topic.trim()) {
            setSaveError(tr("templatesMgmt.errTopicForAI"));
            setActiveTab('config');
            return;
        }
        if (generatedQuestions.length > 0) {
            setIsRegenConfirmOpen(true);
            return;
        }
        handleGenerateQuestions();
    };

    const handleGenerateQuestions = async () => {
        if (!topic) return;
        setSaveError(null);
        setIsGenerating(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment/generate-preview?type=${type}&topic=${encodeURIComponent(topic)}&count=${questionCount}&language=${encodeURIComponent(genLang)}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const questions = await res.json();
                setGeneratedQuestions(questions);
                setActiveTab('questions');
            }
        } catch (error) {
            console.error("Failed to generate questions:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleUpdateQuestion = (qId: string, field: string, value: string | string[]) => {
        setGeneratedQuestions(prev => prev.map(q => q.id === qId ? { ...q, [field]: value } : q));
    };

    const handleDeleteQuestion = (qId: string) => {
        setGeneratedQuestions(prev => prev.filter(q => q.id !== qId));
    };

    const handleAddQuestion = () => {
        const newQ = type === 'APTITUDE' ? {
            id: crypto.randomUUID(),
            type: 'APTITUDE',
            question: '',
            options: ['', '', '', ''],
            correct_answer: ''
        } : {
            id: crypto.randomUUID(),
            type: 'CODING',
            title: '',
            description: '',
            problem_statement: ''
        };
        setGeneratedQuestions([...generatedQuestions, newQ]);
    };

    const handleSave = async () => {
        const problem = validateTemplate();
        if (problem) {
            setSaveError(problem.message);
            setActiveTab(problem.tab);
            return;
        }
        setSaveError(null);
        setIsSaving(true);
        try {
            const url = editingTemplate
                ? `${BACKEND_URL}/api/v1/enterprise/assessment-templates/${editingTemplate.id}`
                : `${BACKEND_URL}/api/v1/enterprise/assessment-templates/`;

            const method = editingTemplate ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    type,
                    topic,
                    question_count: generatedQuestions.length || questionCount,
                    test_duration: duration,
                    email_template_id: selectedEmailTemplateId || null,
                    generated_questions: generatedQuestions
                })
            });

            if (res.ok) {
                fetchTemplates();
                setIsModalOpen(false);
            } else {
                setSaveError(tr("templatesMgmt.errCouldNotSave"));
            }
        } catch (error) {
            console.error("Failed to save assessment template:", error);
            setSaveError(tr("templatesMgmt.errSaveGeneric"));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!templateToDelete) return;

        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment-templates/${templateToDelete.id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));
            }
        } catch (error) {
            console.error("Failed to delete assessment template:", error);
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

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = (t.name + t.topic).toLowerCase().includes(assessmentSearch.toLowerCase());
        const matchesType = typeFilter === "ALL" || t.type === typeFilter;
        return matchesSearch && matchesType;
    });

    return (
        <div className="px-4 sm:px-5 pb-20 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 relative">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight">{tr("templatesMgmt.assessmentTemplatesTitle")}</h1>
                        <PageHelp title={tr("templatesMgmt.assessmentTemplatesTitle")}>
                            <p>{tr("templatesMgmt.assessmentTemplatesHelp")}</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("templatesMgmt.assessmentTemplatesSubtitle")}</p>
                </div>

                <div className="flex items-center gap-2.5">
                    {canAccess("assessments:moderate") && (
                        <button 
                            onClick={() => handleOpenModal()}
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
                    { label: tr("templatesMgmt.totalAssessments"), value: templates.length, Icon: ListChecks, grad: "linear-gradient(135deg,#42A5F5,#1976D2)", glow: "rgba(25,118,210,0.25)" },
                    { label: tr("templatesMgmt.codingTests"), value: templates.filter(t => t.type === 'CODING' || t.type === 'BOTH').length, Icon: Code, grad: "linear-gradient(135deg,#66BB6A,#2E7D32)", glow: "rgba(46,125,50,0.25)" },
                    { label: tr("templatesMgmt.aptitude"), value: templates.filter(t => t.type === 'APTITUDE' || t.type === 'BOTH').length, Icon: Brain, grad: "linear-gradient(135deg,#42A5F5,#1565C0)", glow: "rgba(21,101,192,0.25)" },
                    { label: tr("templatesMgmt.avgDuration"), value: templates.length ? Math.round(templates.reduce((acc, t) => acc + t.test_duration, 0) / templates.length) + "m" : "0m", Icon: Clock, grad: "linear-gradient(135deg,#FFB300,#EF6C00)", glow: "rgba(239,108,0,0.25)" },
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
                        placeholder={tr("templatesMgmt.searchAssessmentPlaceholder")}
                        className="w-full h-10 pl-11 pr-4 bg-white border border-[#E0E0E0] rounded-[4px] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all text-[13.5px] text-[#212121] placeholder:text-[#9E9E9E]"
                        value={assessmentSearch}
                        onChange={(e) => setAssessmentSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 bg-white border border-[#E0E0E0] px-3 h-10 rounded-[4px] shadow-sm shrink-0 w-full sm:w-auto">
                    <i className="mdi mdi-filter-variant text-[#9E9E9E] text-[20px]" />
                    <select 
                        className="bg-transparent text-[12px] font-bold text-[#424242] outline-none pr-2 cursor-pointer flex-1 sm:flex-initial"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="ALL">{tr("templatesMgmt.allTypes")}</option>
                        <option value="APTITUDE">{tr("templatesMgmt.aptitude")}</option>
                        <option value="CODING">{tr("templatesMgmt.coding")}</option>
                        <option value="BOTH">{tr("templatesMgmt.hybrid")}</option>
                    </select>
                </div>
            </div>

            {filteredTemplates.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-[4px] border border-dashed border-[#E0E0E0] shadow-sm max-w-md mx-auto">
                    <div className="relative mb-5">
                        <div className="absolute -inset-3 rounded-full bg-[#1976D2]/10 blur-xl" />
                        <div className="relative w-14 h-14 rounded-[4px] flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#42A5F5,#1976D2)", boxShadow: "0 8px 24px rgba(25,118,210,0.3)" }}>
                            <ListChecks className="w-6 h-6" />
                        </div>
                    </div>
                    {templates.length === 0 ? (
                        <>
                            <h3 className="text-[16px] font-bold text-[#212121] mb-1">{tr("templatesMgmt.noTemplatesYet")}</h3>
                            <p className="text-[13px] text-[#757575] font-medium max-w-[280px] leading-relaxed mb-5">{tr("templatesMgmt.assessmentEmptyDesc")}</p>
                            {canAccess("assessments:moderate") && (
                                <button
                                    onClick={() => handleOpenModal()}
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
                            <p className="text-[13px] text-[#757575] font-medium max-w-[280px] leading-relaxed mb-5">{tr("templatesMgmt.assessmentNoResultsDesc")}</p>
                            <button
                                onClick={() => { setAssessmentSearch(""); setTypeFilter("ALL"); }}
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
                            onClick={() => handleOpenModal(template)}
                        >
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="w-10 h-10 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center border border-[#BBDEFB]/60 group-hover:scale-105 transition-transform shrink-0">
                                        {template.type === 'CODING' ? <Code className="w-5 h-5 stroke-[1.5]" /> : (template.type === 'BOTH' ? <Brain className="w-5 h-5 stroke-[1.5]" /> : <ListChecks className="w-5 h-5 stroke-[1.5]" />)}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleOpenModal(template); }}
                                            className="w-8 h-8 flex items-center justify-center text-[#757575] hover:text-[#1976D2] hover:bg-[#E3F2FD] rounded-[4px] border border-transparent hover:border-[#BBDEFB]/60 transition-all"
                                        >
                                            <i className="mdi mdi-pencil text-[18px]" />
                                        </button>
                                        {canAccess("assessments:delete") && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTemplateToDelete({ id: template.id, name: template.name });
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
                                            {template.type}
                                        </span>
                                        {template.topic && (
                                            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-[3px] border bg-slate-100 text-[#616161] border-[#E0E0E0] truncate max-w-[120px]">
                                                {template.topic}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-[15px] font-bold text-[#212121] group-hover:text-[#1976D2] transition-colors truncate">{template.name}</h3>
                                    <p className={`text-[10px] text-[#757575] ${jetbrainsMono.className}`}>ID: {template.id.slice(0, 8)}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-3 border-t border-[#E0E0E0] mt-4">
                                <div className="flex items-center gap-4 text-[#757575] text-[10px] font-semibold">
                                    <span className="flex items-center gap-1">
                                        <ListChecks className="w-3.5 h-3.5" />
                                        {template.generated_questions?.length || template.question_count} Qs
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {template.test_duration}m
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

            {/* Template Drawer */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[200] flex justify-end overflow-hidden">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#212121]/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-2xl bg-white border-l border-[#E0E0E0] shadow-2xl h-full flex flex-col pointer-events-auto">
                            
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between px-8 py-5 border-b border-[#E0E0E0] shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center border border-[#BBDEFB]/60">
                                        <Settings2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-[16px] font-bold text-[#212121] tracking-tight leading-tight">{editingTemplate ? tr("templatesMgmt.configureAssessment") : tr("templatesMgmt.newAssessment")}</h2>
                                        <p className="text-[12px] text-[#757575] mt-0.5">{tr("templatesMgmt.designEvalSteps")}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex bg-[#F5F6F8] p-1 rounded-[4px] border border-[#E0E0E0]">
                                        <button type="button" onClick={() => setActiveTab('config')} className={`px-3 py-1.5 rounded-[4px] text-[11px] font-bold transition-all ${activeTab === 'config' ? 'bg-white text-[#212121] shadow-sm' : 'text-[#757575] hover:text-[#212121]'}`}>{tr("templatesMgmt.tabDetails")}</button>
                                        <button type="button" onClick={() => setActiveTab('questions')} className={`px-3 py-1.5 rounded-[4px] text-[11px] font-bold transition-all ${activeTab === 'questions' ? 'bg-white text-[#212121] shadow-sm' : 'text-[#757575] hover:text-[#212121]'}`}>{tr("templatesMgmt.tabQuestions")}</button>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-[4px] bg-white border border-[#E0E0E0] text-[#616161] hover:bg-[#F5F6F8] hover:text-[#424242] transition-all flex items-center justify-center shadow-sm">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 custom-scrollbar">
                                {activeTab === 'config' ? (
                                    <form id="matrix-form" onSubmit={e => { e.preventDefault(); handleSave(); }} className="space-y-6">
                                        <div className="space-y-1.5 group">
                                            <label htmlFor="assessment-template-name" className="text-[11.5px] font-bold text-[#757575] ml-0.5">{tr("templatesMgmt.templateName")}</label>
                                            <input
                                                id="assessment-template-name"
                                                type="text"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                className="w-full h-10 bg-white border border-[#E0E0E0] rounded-[4px] px-3.5 text-[14px] text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all"
                                                placeholder={tr("templatesMgmt.nameAssessmentPlaceholder")}
                                                required
                                                readOnly={!canAccess("assessments:moderate")}
                                            />
                                        </div>

                                        <div className="bg-[#F8F9FA] border border-[#E0E0E0] rounded-[4px] p-5 space-y-5">
                                            <div className="flex items-center gap-2">
                                                <Zap className="w-4 h-4 text-[#1976D2]" />
                                                <span className="text-[12.5px] font-bold text-[#212121]">{tr("templatesMgmt.testParameters")}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label htmlFor="assessment-type" className="text-[11px] font-bold text-[#757575] ml-0.5">{tr("templatesMgmt.type")}</label>
                                                    <select
                                                        id="assessment-type"
                                                        value={type}
                                                        onChange={e => setType(e.target.value as "APTITUDE" | "CODING" | "BOTH")}
                                                        className="w-full h-10 bg-white border border-[#E0E0E0] rounded-[4px] px-3 text-[13.5px] text-[#424242] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all cursor-pointer"
                                                        disabled={!canAccess("assessments:moderate")}
                                                    >
                                                        <option value="APTITUDE">{tr("templatesMgmt.typeAptitudeTest")}</option>
                                                        <option value="CODING">{tr("templatesMgmt.typeCodingChallenge")}</option>
                                                        <option value="BOTH">{tr("templatesMgmt.typeHybridAssessment")}</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label htmlFor="assessment-topic" className="text-[11px] font-bold text-[#757575] ml-0.5">{tr("templatesMgmt.topicSkills")}</label>
                                                    <input
                                                        id="assessment-topic"
                                                        type="text"
                                                        value={topic}
                                                        onChange={e => setTopic(e.target.value)}
                                                        className="w-full h-10 bg-white border border-[#E0E0E0] rounded-[4px] px-3.5 text-[14px] text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all"
                                                        placeholder={tr("templatesMgmt.topicPlaceholder")}
                                                        required
                                                        readOnly={!canAccess("assessments:moderate")}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label htmlFor="assessment-question-count" className="text-[11px] font-bold text-[#757575] ml-0.5">{tr("templatesMgmt.questionCount")}</label>
                                                    <input
                                                        id="assessment-question-count"
                                                        type="number"
                                                        value={questionCount}
                                                        onChange={e => setQuestionCount(Number.parseInt(e.target.value))}
                                                        className="w-full h-10 bg-white border border-[#E0E0E0] rounded-[4px] px-3.5 text-[14px] text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all"
                                                        required
                                                        readOnly={!canAccess("assessments:moderate")}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label htmlFor="assessment-duration" className="text-[11px] font-bold text-[#757575] ml-0.5">{tr("templatesMgmt.durationMins")}</label>
                                                    <input
                                                        id="assessment-duration"
                                                        type="number"
                                                        value={duration}
                                                        onChange={e => setDuration(Number.parseInt(e.target.value))}
                                                        className="w-full h-10 bg-white border border-[#E0E0E0] rounded-[4px] px-3.5 text-[14px] text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all"
                                                        required
                                                        readOnly={!canAccess("assessments:moderate")}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 group">
                                            <label htmlFor="assessment-email-template" className="text-[11.5px] font-bold text-[#757575] ml-0.5">{tr("templatesMgmt.invitationEmailTemplate")}</label>
                                            <select
                                                id="assessment-email-template"
                                                value={selectedEmailTemplateId}
                                                onChange={e => setSelectedEmailTemplateId(e.target.value)}
                                                className="w-full h-10 bg-white border border-[#E0E0E0] rounded-[4px] px-3 text-[13.5px] text-[#424242] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all cursor-pointer"
                                                disabled={!canAccess("assessments:moderate")}
                                            >
                                                <option value="">{tr("templatesMgmt.selectEmailTemplate")}</option>
                                                {emailTemplates.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <h3 className="text-[14px] font-bold text-[#212121]">{tr("templatesMgmt.assessmentQuestions")}</h3>
                                                <p className="text-[11.5px] text-[#757575] font-medium mt-0.5">{tr("templatesMgmt.configQuestionsDesc")}</p>
                                            </div>
                                            <div className="flex gap-2 items-center">
                                                {canAccess("assessments:moderate") && (
                                                    <GenLanguageSelect value={genLang} onChange={setGenLang} />
                                                )}
                                                {canAccess("assessments:moderate") && (
                                                    <button
                                                        onClick={requestGenerate}
                                                        disabled={isGenerating || !topic}
                                                        className="h-8 px-3.5 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-[4px] text-[12px] font-bold flex items-center gap-1.5 transition-all disabled:opacity-20 shadow-sm"
                                                    >
                                                        {isGenerating ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-200" />}
                                                        {tr("templatesMgmt.generateAI")}
                                                    </button>
                                                )}
                                                {canAccess("assessments:moderate") && (
                                                    <button 
                                                        onClick={handleAddQuestion}
                                                        className="h-8 px-3.5 bg-white border border-[#E0E0E0] text-[#424242] hover:bg-[#F5F6F8] rounded-[4px] text-[12px] font-bold flex items-center gap-1.5 transition-all shadow-sm"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        {tr("templatesMgmt.addQuestion")}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            {generatedQuestions.map((q, idx) => (
                                                <motion.div 
                                                    layout
                                                    key={q.id} 
                                                    className="bg-white border border-[#E0E0E0] rounded-[4px] p-5 shadow-sm relative group"
                                                >
                                                    <div className="absolute -top-2.5 -left-2.5 w-7 h-7 bg-[#F5F6F8] text-[#616161] rounded-[4px] flex items-center justify-center font-bold text-[11px] border border-[#E0E0E0] group-hover:bg-[#1976D2] group-hover:text-white transition-all">{idx + 1}</div>
                                                    
                                                    {canAccess("assessments:moderate") && (
                                                        <button 
                                                            onClick={() => handleDeleteQuestion(q.id)}
                                                            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-[#757575] hover:text-rose-500 hover:bg-rose-50 rounded-[3px] opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}

                                                    <div className="space-y-4 pt-2">
                                                        {q.type === 'APTITUDE' ? (
                                                            <>
                                                                <div className="space-y-1.5">
                                                                    <label htmlFor={`question-text-${q.id}`} className="text-[11px] font-bold text-[#757575] ml-0.5">{tr("templatesMgmt.questionText")}</label>
                                                                    <textarea
                                                                        id={`question-text-${q.id}`}
                                                                        value={q.question}
                                                                        onChange={(e) => handleUpdateQuestion(q.id, "question", e.target.value)}
                                                                        className="w-full h-20 bg-white border border-[#E0E0E0] rounded-[4px] px-3.5 py-2.5 text-[13.5px] text-[#424242] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all resize-none leading-relaxed"
                                                                        readOnly={!canAccess("assessments:moderate")}
                                                                        placeholder={tr("templatesMgmt.questionTextPlaceholder")}
                                                                    />
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    {(q.options || []).map((opt: string, oi: number) => (
                                                                        <div key={oi} className="relative group/opt">
                                                                            <input 
                                                                                value={opt} 
                                                                                onChange={(e) => {
                                                                                    const newOpts = [...(q.options ?? [])];
                                                                                    newOpts[oi] = e.target.value;
                                                                                    handleUpdateQuestion(q.id, "options", newOpts);
                                                                                }}
                                                                                className={`w-full h-10 bg-white border-2 rounded-[4px] pl-10 pr-4 text-[12.5px] font-semibold transition-all outline-none ${q.correct_answer === opt ? "border-[#1976D2] bg-[#E3F2FD]/30 text-[#1976D2]" : "border-[#E0E0E0] text-[#424242] focus:border-[#1976D2]"}`}
                                                                                readOnly={!canAccess("assessments:moderate")}
                                                                                placeholder={tr("templatesMgmt.optionLabel", { n: oi + 1 })}
                                                                            />
                                                                            <button 
                                                                                onClick={() => handleUpdateQuestion(q.id, "correct_answer", opt)}
                                                                                disabled={!canAccess("assessments:moderate")}
                                                                                className={`absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-[3px] flex items-center justify-center transition-all ${q.correct_answer === opt ? "bg-[#1976D2] text-white" : "bg-[#F5F6F8] text-[#757575] hover:text-[#1976D2] border border-[#E0E0E0]"}`}
                                                                            >
                                                                                <span className="text-[10px] font-bold">{oi === 0 ? "A" : oi === 1 ? "B" : oi === 2 ? "C" : "D"}</span>
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="space-y-4">
                                                                    <div className="space-y-1.5">
                                                                        <label htmlFor={`challenge-title-${q.id}`} className="text-[11px] font-bold text-[#757575] ml-0.5">{tr("templatesMgmt.challengeTitle")}</label>
                                                                        <input
                                                                            id={`challenge-title-${q.id}`}
                                                                            type="text"
                                                                            value={q.title}
                                                                            onChange={(e) => handleUpdateQuestion(q.id, "title", e.target.value)}
                                                                            className="w-full h-10 bg-white border border-[#E0E0E0] rounded-[4px] px-3.5 text-[13.5px] text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all"
                                                                            placeholder={tr("templatesMgmt.challengeTitlePlaceholder")}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <label htmlFor={`problem-spec-${q.id}`} className="text-[11px] font-bold text-[#757575] ml-0.5">{tr("templatesMgmt.problemSpec")}</label>
                                                                        <textarea
                                                                            id={`problem-spec-${q.id}`}
                                                                            value={q.description || q.problem_statement}
                                                                            onChange={(e) => handleUpdateQuestion(q.id, "description", e.target.value)}
                                                                            className="w-full h-44 bg-white border border-[#E0E0E0] rounded-[4px] px-4 py-3 text-[13.5px] text-[#424242] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all resize-none leading-relaxed"
                                                                            readOnly={!canAccess("assessments:moderate")}
                                                                            placeholder={tr("templatesMgmt.problemSpecPlaceholder")}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                            {generatedQuestions.length === 0 && (
                                                <div className="py-12 flex flex-col items-center justify-center text-center bg-white rounded-[4px] border border-dashed border-[#E0E0E0] max-w-sm mx-auto">
                                                    <Search className="w-10 h-10 text-[#757575] mb-3" />
                                                    <h4 className="text-[14px] font-bold text-[#212121] leading-tight">{tr("templatesMgmt.noQuestionsDefined")}</h4>
                                                    <p className="text-[12px] text-[#757575] font-medium max-w-[220px] mt-1.5 leading-relaxed">{tr("templatesMgmt.noQuestionsDesc")}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Drawer Footer */}
                            {canAccess("assessments:moderate") && (
                                <div className="border-t border-[#E0E0E0] shrink-0">
                                    {saveError && (
                                        <div className="mx-8 mt-4 flex items-start gap-2.5 rounded-[4px] border border-amber-200 bg-amber-50 px-3.5 py-3">
                                            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                            <p className="text-[12px] font-semibold text-amber-800 leading-relaxed">{saveError}</p>
                                        </div>
                                    )}
                                    <div className="p-8 flex items-center justify-between gap-6">
                                        <p className="text-[11.5px] text-[#757575] leading-normal max-w-[280px]">{tr("templatesMgmt.assessmentFooterNote")}</p>
                                        <button
                                            onClick={handleSave}
                                            type="button"
                                            disabled={isSaving || (!!editingTemplate && !isDirty)}
                                            title={editingTemplate && !isDirty ? tr("templatesMgmt.noChangesYet") : undefined}
                                            className="h-10 px-6 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-[4px] font-semibold text-[13.5px] shadow-[0_4px_12px_rgba(25,118,210,0.2)] transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1976D2]"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            {isSaving ? tr("templatesMgmt.saving") : editingTemplate ? tr("templatesMgmt.updateTemplate") : tr("templatesMgmt.saveTemplate")}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title={tr("templatesMgmt.deleteTemplateTitle")}
                message={tr("templatesMgmt.deleteConfirmAssessment", { name: templateToDelete?.name ?? "" })}
                confirmLabel={tr("templatesMgmt.deleteTemplate")}
                cancelLabel={tr("common.cancel")}
                isDestructive={true}
            />

            <ConfirmationModal
                isOpen={isRegenConfirmOpen}
                onClose={() => setIsRegenConfirmOpen(false)}
                onConfirm={() => { setIsRegenConfirmOpen(false); handleGenerateQuestions(); }}
                title={tr("templatesMgmt.replaceQuestionsTitle")}
                message={tr("templatesMgmt.replaceQuestionsMsg", { count: generatedQuestions.length })}
                confirmLabel={tr("templatesMgmt.replaceGenerate")}
                cancelLabel={tr("templatesMgmt.keepCurrent")}
                isDestructive={true}
            />
        </div>
    );
}
