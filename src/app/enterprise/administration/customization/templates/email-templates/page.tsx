"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import {
    Mail,
    Plus,
    Trash2,
    Sparkles,
    Zap,
    X,
    Save,
    ArrowRight,
    ArrowLeft,
    FileText,
    History,
    ChevronDown,
    RefreshCcw,
    Layout,
    Lock,
    Loader2,
    AlertTriangle
} from "@/components/icons";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { jetbrainsMono, PageHelp } from "@/components/ds";

interface Template {
    id: string;
    name: string;
    subject: string;
    body: string;
    category: string;
    variables: string[];
    created_at?: string;
    updated_at?: string;
}

export default function EmailTemplatesPage() {
    const router = useRouter();
    const { token, canAccess } = useAuth();
    const { t: tr } = useI18n();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<{ id: string; name: string } | null>(null);
    const [templateSearch, setTemplateSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("ALL");

    // Form State
    const [name, setName] = useState("");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [category, setCategory] = useState("GENERAL");

    // AI Generator State
    const [isAiMode, setIsAiMode] = useState(false);
    const [aiPurpose, setAiPurpose] = useState("");
    const [aiTone, setAiTone] = useState("professional");
    const [isGenerating, setIsGenerating] = useState(false);

    // Save / validation / dirty-check state
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [initialSnapshot, setInitialSnapshot] = useState("");
    const [isOverwriteConfirmOpen, setIsOverwriteConfirmOpen] = useState(false);

    useEffect(() => {
        if (token) {
            fetchTemplates();
        }
    }, [token]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return tr("templatesMgmt.never");
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/communication/templates`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setTimeout(() => setIsLoading(false), 500);
        }
    };

    const snapshotOf = (vals: { name: string; subject: string; body: string; category: string }) => JSON.stringify(vals);

    const handleOpenModal = (template?: Template) => {
        setIsAiMode(false);
        setAiPurpose("");
        setSaveError(null);
        if (template) {
            const vals = { name: template.name, subject: template.subject, body: template.body, category: template.category || "GENERAL" };
            setEditingTemplate(template);
            setName(vals.name);
            setSubject(vals.subject);
            setBody(vals.body);
            setCategory(vals.category);
            setInitialSnapshot(snapshotOf(vals));
        } else {
            setEditingTemplate(null);
            setName("");
            setSubject("");
            setBody("");
            setCategory("GENERAL");
            setInitialSnapshot(snapshotOf({ name: "", subject: "", body: "", category: "GENERAL" }));
        }
        setIsModalOpen(true);
    };

    const isDirty = snapshotOf({ name, subject, body, category }) !== initialSnapshot;

    const validateTemplate = (): string | null => {
        if (!name.trim()) return tr("templatesMgmt.errNameRequired");
        if (!subject.trim()) return tr("templatesMgmt.errSubjectRequired");
        if (!body.trim()) return tr("templatesMgmt.errBodyRequired");
        return null;
    };

    // AI generation overwrites name/subject/body. Warn first if there's content to lose.
    const requestAiGenerate = () => {
        if (!aiPurpose.trim()) return;
        if (name.trim() || subject.trim() || body.trim()) {
            setIsOverwriteConfirmOpen(true);
            return;
        }
        handleAiGenerate();
    };

    const handleAiGenerate = async () => {
        if (!aiPurpose.trim()) return;
        setIsGenerating(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/communication/generate-template`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    purpose: aiPurpose,
                    tone: aiTone
                })
            });

            const data = await res.json();

            if (res.ok) {
                let parsed;
                if (data.content) {
                    let cleanedContent = data.content;
                    if (cleanedContent.includes("```")) {
                        cleanedContent = cleanedContent.replaceAll("```json", "").replaceAll("```", "");
                    }
                    try {
                        parsed = JSON.parse(cleanedContent);
                    } catch (e) {
                        parsed = { body: cleanedContent };
                    }
                } else {
                    parsed = data;
                }

                if (parsed) {
                    if (typeof parsed === 'string') {
                        try { parsed = JSON.parse(parsed); } catch (e) { parsed = { body: parsed }; }
                    } else if (parsed.content && typeof parsed.content === 'string') {
                        try { parsed = JSON.parse(parsed.content); } catch (e) { }
                    }

                    let bodyContent = parsed.body || "";
                    if (bodyContent.startsWith("```html")) {
                        bodyContent = bodyContent.replace("```html", "").replace("```", "");
                    }

                    setName(parsed.name || `Template: ${aiPurpose.substring(0, 20)}...`);
                    setSubject(parsed.subject || "");
                    setBody(bodyContent);
                    setIsAiMode(false);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDelete = async () => {
        if (!templateToDelete) return;

        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/communication/templates/${templateToDelete.id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsDeleteModalOpen(false);
            setTemplateToDelete(null);
        }
    };

    const handleSave = async () => {
        const problem = validateTemplate();
        if (problem) {
            setSaveError(problem);
            return;
        }
        setSaveError(null);
        setIsSaving(true);
        try {
            const url = editingTemplate
                ? `${BACKEND_URL}/api/v1/enterprise/communication/templates/${editingTemplate.id}`
                : `${BACKEND_URL}/api/v1/enterprise/communication/templates`;

            const method = editingTemplate ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name, subject, body, category, variables: [] })
            });

            if (res.ok) {
                fetchTemplates();
                setIsModalOpen(false);
            } else {
                setSaveError(tr("templatesMgmt.errCouldNotSave"));
            }
        } catch (e) {
            console.error(e);
            setSaveError(tr("templatesMgmt.errSaveGeneric"));
        } finally {
            setIsSaving(false);
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
        const matchesSearch = (t.name + t.subject).toLowerCase().includes(templateSearch.toLowerCase());
        const matchesCat = categoryFilter === "ALL" || t.category === categoryFilter;
        return matchesSearch && matchesCat;
    });

    return (
        <div className="px-4 sm:px-5 pb-20 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 relative">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => router.push("/enterprise/templates")}
                        title={tr("templatesMgmt.backToTemplateHub")}
                        aria-label={tr("templatesMgmt.backToTemplateHub")}
                        className="w-8 h-8 shrink-0 bg-white border border-[#E0E0E0] rounded-[4px] text-[#616161] hover:text-[#424242] hover:bg-[#F5F6F8] transition-all flex items-center justify-center shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight">{tr("templatesMgmt.emailTemplatesTitle")}</h1>
                            <PageHelp title={tr("templatesMgmt.emailTemplatesTitle")}>
                                <p>{tr("templatesMgmt.emailTemplatesHelp")}</p>
                            </PageHelp>
                        </div>
                        <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("templatesMgmt.emailTemplatesSubtitle")}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    {canAccess("communications:moderate") && (
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
                    { label: tr("templatesMgmt.totalTemplates"), value: templates.length, Icon: Mail, grad: "linear-gradient(135deg,#42A5F5,#1976D2)", glow: "rgba(25,118,210,0.25)" },
                    { label: tr("templatesMgmt.assessments"), value: templates.filter(t => t.category === 'ASSESSMENT').length, Icon: Zap, grad: "linear-gradient(135deg,#66BB6A,#2E7D32)", glow: "rgba(46,125,50,0.25)" },
                    { label: tr("templatesMgmt.interviews"), value: templates.filter(t => t.category === 'INTERVIEW').length, Icon: FileText, grad: "linear-gradient(135deg,#42A5F5,#1565C0)", glow: "rgba(21,101,192,0.25)" },
                    { label: tr("templatesMgmt.onboarding"), value: templates.filter(t => t.category === 'ONBOARDING').length, Icon: Layout, grad: "linear-gradient(135deg,#FFB300,#EF6C00)", glow: "rgba(239,108,0,0.25)" },
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
                        placeholder={tr("templatesMgmt.searchEmailPlaceholder")}
                        className="w-full h-10 pl-11 pr-4 bg-white border border-[#E0E0E0] rounded-[4px] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all text-[13.5px] text-[#212121] placeholder:text-[#9E9E9E]"
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 bg-white border border-[#E0E0E0] px-3 h-10 rounded-[4px] shadow-sm shrink-0 w-full sm:w-auto">
                    <i className="mdi mdi-filter-variant text-[#9E9E9E] text-[20px]" />
                    <select 
                        className="bg-transparent text-[12px] font-bold text-[#424242] outline-none pr-2 cursor-pointer flex-1 sm:flex-initial"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="ALL">{tr("templatesMgmt.allCategories")}</option>
                        <option value="GENERAL">{tr("templatesMgmt.categoryGeneral")}</option>
                        <option value="ASSESSMENT">{tr("templatesMgmt.assessments")}</option>
                        <option value="INTERVIEW">{tr("templatesMgmt.interviews")}</option>
                        <option value="ONBOARDING">{tr("templatesMgmt.onboarding")}</option>
                    </select>
                </div>
            </div>

            {/* Templates List Grid */}
            {filteredTemplates.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-[4px] border border-dashed border-[#E0E0E0] shadow-sm max-w-md mx-auto">
                    <div className="relative mb-5">
                        <div className="absolute -inset-3 rounded-full bg-[#1976D2]/10 blur-xl" />
                        <div className="relative w-14 h-14 rounded-[4px] flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#42A5F5,#1976D2)", boxShadow: "0 8px 24px rgba(25,118,210,0.3)" }}>
                            <Mail className="w-6 h-6" />
                        </div>
                    </div>
                    {templates.length === 0 ? (
                        <>
                            <h3 className="text-[16px] font-bold text-[#212121] mb-1">{tr("templatesMgmt.noTemplatesYet")}</h3>
                            <p className="text-[13px] text-[#757575] font-medium max-w-[280px] leading-relaxed mb-5">{tr("templatesMgmt.emailEmptyDesc")}</p>
                            {canAccess("communications:moderate") && (
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
                            <p className="text-[13px] text-[#757575] font-medium max-w-[280px] leading-relaxed mb-5">{tr("templatesMgmt.emailNoResultsDesc")}</p>
                            <button
                                onClick={() => { setTemplateSearch(""); setCategoryFilter("ALL"); }}
                                className="px-5 h-9 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-[4px] font-semibold text-[13px] shadow-[0_4px_12px_rgba(25,118,210,0.2)] transition-all"
                            >
                                {tr("templatesMgmt.resetFilters")}
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map((template) => (
                        <motion.div
                            layout
                            key={template.id}
                            className="group bg-white rounded-[4px] border border-[#E0E0E0] hover:border-[#1976D2]/40 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[170px]"
                            onClick={() => handleOpenModal(template)}
                        >
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="w-10 h-10 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center border border-[#BBDEFB]/60 group-hover:scale-105 transition-transform shrink-0">
                                        <FileText className="w-5 h-5 stroke-[1.5]" />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleOpenModal(template); }}
                                            className="w-8 h-8 flex items-center justify-center text-[#757575] hover:text-[#1976D2] hover:bg-[#E3F2FD] rounded-[4px] border border-transparent hover:border-[#BBDEFB]/60 transition-all"
                                        >
                                            <i className="mdi mdi-pencil text-[18px]" />
                                        </button>
                                        {canAccess("communications:delete") && (
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
                                        <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-[3px] border ${
                                            template.category === 'ASSESSMENT' ? 'bg-[#FEF3C7] text-[#EF6C00] border-[#FDE68A]/80' :
                                            template.category === 'INTERVIEW' ? 'bg-[#E3F2FD] text-[#1976D2] border-[#BBDEFB]/80' :
                                            template.category === 'ONBOARDING' ? 'bg-[#F3F9FE] text-[#42A5F5] border-[#EBE7FF]/80' :
                                            'bg-slate-100 text-[#616161] border-[#E0E0E0]'
                                        }`}>
                                            {template.category || tr("templatesMgmt.categoryGeneral")}
                                        </span>
                                    </div>
                                    <h3 className="text-[15px] font-bold text-[#212121] group-hover:text-[#1976D2] transition-colors truncate">{template.name}</h3>
                                    <p className={`text-[10px] text-[#757575] ${jetbrainsMono.className}`}>ID: {template.id.slice(0, 8)}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-3 border-t border-[#E0E0E0] mt-4">
                                <div className="flex items-center gap-1.5 text-[#757575] text-[10px] font-semibold uppercase tracking-wider">
                                    <History className="w-3.5 h-3.5" />
                                    <span>{formatDate(template.updated_at || template.created_at)}</span>
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
                        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-xl bg-white border-l border-[#E0E0E0] shadow-2xl h-full flex flex-col pointer-events-auto">
                            
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between px-8 py-5 border-b border-[#E0E0E0] shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center border border-[#BBDEFB]/60">
                                        <Layout className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-[16px] font-bold text-[#212121] tracking-tight leading-tight">{isAiMode ? tr("templatesMgmt.aiGeneration") : (editingTemplate ? tr("templatesMgmt.configureTemplate") : tr("templatesMgmt.newTemplate"))}</h2>
                                        <p className="text-[12px] text-[#757575] mt-0.5">{tr("templatesMgmt.commDesignConfig")}</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-[4px] bg-white border border-[#E0E0E0] text-[#616161] hover:bg-[#F5F6F8] hover:text-[#424242] transition-all flex items-center justify-center shadow-sm">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 custom-scrollbar">
                                
                                {!isAiMode && canAccess("communications:moderate") && (
                                    <div className="rounded-[4px] border border-[#BBDEFB]/60 bg-[#E3F2FD]/40 p-5 flex items-center justify-between gap-4">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-[#1976D2]" />
                                                <span className="text-[13px] font-bold text-[#212121]">{tr("templatesMgmt.autoGenerateAI")}</span>
                                            </div>
                                            <p className="text-[12px] text-[#616161] font-medium leading-relaxed">{tr("templatesMgmt.autoGenerateDesc")}</p>
                                        </div>
                                        <button
                                            onClick={() => setIsAiMode(true)}
                                            className="h-9 px-4 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-[4px] text-[12px] font-bold transition-all active:scale-95 shadow-sm"
                                        >
                                            {tr("templatesMgmt.generate")}
                                        </button>
                                    </div>
                                )}

                                {isAiMode ? (
                                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                        <div className="space-y-1.5">
                                            <label htmlFor="tpl-ai-purpose" className="text-[11.5px] font-bold text-[#757575] ml-0.5">{tr("templatesMgmt.templatePurpose")}</label>
                                            <textarea
                                                id="tpl-ai-purpose"
                                                value={aiPurpose}
                                                onChange={e => setAiPurpose(e.target.value)}
                                                className="w-full bg-white border border-[#E0E0E0] rounded-[4px] p-3 text-[13.5px] text-[#424242] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all resize-none min-h-[120px] leading-relaxed"
                                                placeholder={tr("templatesMgmt.purposePlaceholder")}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <button onClick={() => setIsAiMode(false)} className="h-10 rounded-[4px] border border-[#E0E0E0] text-[#757575] font-semibold text-[13px] hover:bg-[#F5F6F8] transition-all">{tr("common.cancel")}</button>
                                            <button
                                                onClick={requestAiGenerate}
                                                disabled={isGenerating || !aiPurpose.trim()}
                                                className="h-10 bg-[#1976D2] text-white rounded-[4px] font-semibold text-[13px] hover:bg-[#1565C0] transition-all active:scale-95 disabled:opacity-20 shadow-sm flex items-center justify-center gap-2"
                                            >
                                                {isGenerating ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-200" />}
                                                {tr("templatesMgmt.generate")}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <form id="template-form" onSubmit={e => { e.preventDefault(); handleSave(); }} className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5 group">
                                                <label htmlFor="tpl-name" className="text-[11.5px] font-bold text-[#757575] ml-0.5">{tr("templatesMgmt.templateName")}</label>
                                                <input
                                                    id="tpl-name"
                                                    type="text"
                                                    value={name}
                                                    onChange={e => setName(e.target.value)}
                                                    className="w-full h-10 bg-white border border-[#E0E0E0] rounded-[4px] px-3.5 text-[14px] text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all"
                                                    placeholder={tr("templatesMgmt.nameEmailPlaceholder")}
                                                    required
                                                    readOnly={!canAccess("communications:moderate")}
                                                />
                                            </div>

                                            <div className="space-y-1.5 group">
                                                <label htmlFor="tpl-category" className="text-[11.5px] font-bold text-[#757575] ml-0.5">{tr("templatesMgmt.category")}</label>
                                                <select
                                                    id="tpl-category"
                                                    value={category}
                                                    onChange={e => setCategory(e.target.value)}
                                                    className="w-full h-10 bg-white border border-[#E0E0E0] rounded-[4px] px-3 text-[13.5px] text-[#424242] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all cursor-pointer"
                                                    disabled={!canAccess("communications:moderate")}
                                                >
                                                    <option value="GENERAL">{tr("templatesMgmt.catGeneralComm")}</option>
                                                    <option value="ASSESSMENT">{tr("templatesMgmt.catAssessmentInv")}</option>
                                                    <option value="INTERVIEW">{tr("templatesMgmt.catInterviewInv")}</option>
                                                    <option value="ONBOARDING">{tr("templatesMgmt.catOnboardingInv")}</option>
                                                </select>
                                            </div>
                                        </div>
 
                                        <div className="space-y-1.5 group">
                                            <label htmlFor="tpl-subject" className="text-[11.5px] font-bold text-[#757575] ml-0.5">{tr("templatesMgmt.emailSubject")}</label>
                                            <input
                                                id="tpl-subject"
                                                type="text"
                                                value={subject}
                                                onChange={e => setSubject(e.target.value)}
                                                className="w-full h-10 bg-white border border-[#E0E0E0] rounded-[4px] px-3.5 text-[14px] text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all"
                                                placeholder={tr("templatesMgmt.subjectPlaceholder")}
                                                required
                                                readOnly={!canAccess("communications:moderate")}
                                            />
                                        </div>

                                        <div className="space-y-1.5 group flex flex-col">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1 pb-1">
                                                <label htmlFor="base-editor" className="text-[11.5px] font-bold text-[#757575]">{tr("templatesMgmt.emailBodyContent")}</label>
                                                <div className="relative shrink-0">
                                                    <select 
                                                        className="appearance-none bg-[#E3F2FD] border border-[#BBDEFB]/60 rounded-[4px] pl-3.5 pr-8 py-1.5 text-[11px] font-bold text-[#1976D2] outline-none cursor-pointer hover:bg-white transition-all shadow-sm"
                                                        onChange={(e) => {
                                                            if (!e.target.value) return;
                                                            const val = `{{${e.target.value}}}`;
                                                            const textarea = document.getElementById('base-editor') as HTMLTextAreaElement;
                                                            if (textarea) {
                                                                const start = textarea.selectionStart;
                                                                const end = textarea.selectionEnd;
                                                                const text = textarea.value;
                                                                const before = text.substring(0, start);
                                                                const after = text.substring(end, text.length);
                                                                setBody(before + val + after);
                                                                
                                                                setTimeout(() => {
                                                                    textarea.focus();
                                                                    textarea.setSelectionRange(start + val.length, start + val.length);
                                                                }, 0);
                                                            } else {
                                                                setBody(prev => prev + val);
                                                            }
                                                            e.target.value = "";
                                                        }}
                                                    >
                                                        <option value="">{tr("templatesMgmt.insertVariable")}</option>
                                                        <optgroup label={tr("templatesMgmt.categoryGeneral")}>
                                                            <option value="candidate_name">{tr("templatesMgmt.varCandidateName")}</option>
                                                            <option value="job_title">{tr("templatesMgmt.varJobTitle")}</option>
                                                            <option value="company_name">{tr("templatesMgmt.varCompanyName")}</option>
                                                            <option value="recruiter_name">{tr("templatesMgmt.varRecruiterName")}</option>
                                                        </optgroup>
                                                        {category === 'ASSESSMENT' && (
                                                            <optgroup label={tr("templatesMgmt.varGroupAssessment")}>
                                                                <option value="assessment_link">{tr("templatesMgmt.varAssessmentLink")}</option>
                                                                <option value="test_duration">{tr("templatesMgmt.varTestDuration")}</option>
                                                                <option value="test_topic">{tr("templatesMgmt.varTestTopic")}</option>
                                                            </optgroup>
                                                        )}
                                                        {category === 'INTERVIEW' && (
                                                            <optgroup label={tr("templatesMgmt.varGroupInterview")}>
                                                                <option value="interview_link">{tr("templatesMgmt.varInterviewLink")}</option>
                                                                <option value="interview_time">{tr("templatesMgmt.varInterviewTime")}</option>
                                                                <option value="interview_topic">{tr("templatesMgmt.varInterviewTopic")}</option>
                                                            </optgroup>
                                                        )}
                                                        {category === 'ONBOARDING' && (
                                                            <optgroup label={tr("templatesMgmt.varGroupOnboarding")}>
                                                                <option value="onboarding_link">{tr("templatesMgmt.varOnboardingLink")}</option>
                                                                <option value="onboarding_code">{tr("templatesMgmt.varOnboardingCode")}</option>
                                                            </optgroup>
                                                        )}
                                                    </select>
                                                    <ChevronDown className="w-3 h-3 text-[#1976D2] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                </div>
                                            </div>
                                            <textarea
                                                id="base-editor"
                                                value={body}
                                                onChange={e => setBody(e.target.value)}
                                                className="w-full bg-white border border-[#E0E0E0] rounded-[4px] p-4 text-[13.5px] text-[#424242] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all resize-none min-h-[350px] leading-relaxed"
                                                placeholder={tr("templatesMgmt.bodyPlaceholder")}
                                                required
                                                readOnly={!canAccess("communications:moderate")}
                                            />
                                            <p className="text-[11px] text-[#757575] leading-relaxed px-1 pt-0.5">
                                                <span className="font-semibold text-[#616161]">{tr("templatesMgmt.tipLabel")}</span> {tr("templatesMgmt.tipBodyBefore")} <code className="px-1 py-0.5 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] font-semibold">{`{{your_variable}}`}</code> {tr("templatesMgmt.tipBodyAfter")}
                                            </p>
                                        </div>
                                    </form>
                                )}
                            </div>

                            {/* Drawer Footer */}
                            {!isAiMode && canAccess("communications:moderate") && (
                                <div className="border-t border-[#E0E0E0] shrink-0">
                                    {saveError && (
                                        <div className="mx-8 mt-4 flex items-start gap-2.5 rounded-[4px] border border-amber-200 bg-amber-50 px-3.5 py-3">
                                            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                            <p className="text-[12px] font-semibold text-amber-800 leading-relaxed">{saveError}</p>
                                        </div>
                                    )}
                                    <div className="p-8 flex items-center justify-between gap-6">
                                        <p className="text-[11.5px] text-[#757575] leading-normal max-w-[280px]">{tr("templatesMgmt.emailFooterNote")}</p>
                                        <button
                                            type="submit"
                                            form="template-form"
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
                message={tr("templatesMgmt.deleteConfirmEmail", { name: templateToDelete?.name ?? "" })}
                confirmLabel={tr("templatesMgmt.deleteTemplate")}
                cancelLabel={tr("common.cancel")}
                isDestructive={true}
            />

            <ConfirmationModal
                isOpen={isOverwriteConfirmOpen}
                onClose={() => setIsOverwriteConfirmOpen(false)}
                onConfirm={() => { setIsOverwriteConfirmOpen(false); handleAiGenerate(); }}
                title={tr("templatesMgmt.replaceContentTitle")}
                message={tr("templatesMgmt.replaceContentMsg")}
                confirmLabel={tr("templatesMgmt.replaceGenerate")}
                cancelLabel={tr("templatesMgmt.keepCurrent")}
                isDestructive={true}
            />
        </div>
    );
}
