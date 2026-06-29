"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
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
    FileText,
    History,
    ChevronDown,
    RefreshCcw,
    Layout,
    Lock
} from "lucide-react";
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
    const { token, canAccess } = useAuth();
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

    useEffect(() => {
        if (token) {
            fetchTemplates();
        }
    }, [token]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return "Never";
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

    const handleOpenModal = (template?: Template) => {
        setIsAiMode(false);
        setAiPurpose("");
        if (template) {
            setEditingTemplate(template);
            setName(template.name);
            setSubject(template.subject);
            setBody(template.body);
            setCategory(template.category || "GENERAL");
        } else {
            setEditingTemplate(null);
            setName("");
            setSubject("");
            setBody("");
            setCategory("GENERAL");
        }
        setIsModalOpen(true);
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
            }
        } catch (e) {
            console.error(e);
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

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = (t.name + t.subject).toLowerCase().includes(templateSearch.toLowerCase());
        const matchesCat = categoryFilter === "ALL" || t.category === categoryFilter;
        return matchesSearch && matchesCat;
    });

    return (
        <div className="px-4 sm:px-5 pb-20 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 relative">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">Email Templates</h1>
                        <PageHelp title="Email Templates">
                            <p>Reusable email templates for candidate communication.</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#8A929E] mt-0.5">Manage and standardize organizational outreach communication.</p>
                </div>

                <div className="flex items-center gap-2.5">
                    {canAccess("communications:moderate") && (
                        <button 
                            onClick={() => handleOpenModal()}
                            className="h-8 px-4 bg-[#5B53E0] hover:bg-[#4A43C9] text-white rounded-[10px] text-[13px] font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            New Template
                        </button>
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
                    { label: "Total Templates", value: templates.length, Icon: Mail, grad: "linear-gradient(135deg,#8B7DFF,#5B53E0)", glow: "rgba(91,83,224,0.25)" },
                    { label: "Recruitment", value: templates.filter(t => t.category === 'INTERVIEW' || t.category === 'ASSESSMENT').length, Icon: Zap, grad: "linear-gradient(135deg,#34D399,#0E8A6E)", glow: "rgba(14,138,110,0.25)" },
                    { label: "Onboarding", value: templates.filter(t => t.category === 'ONBOARDING').length, Icon: Layout, grad: "linear-gradient(135deg,#6E8BEA,#3559C7)", glow: "rgba(53,89,199,0.25)" },
                    { label: "Dynamic Vars", value: templates.reduce((acc, t) => acc + (t.variables?.length || 0), 0), Icon: Sparkles, grad: "linear-gradient(135deg,#FBBF24,#D97706)", glow: "rgba(217,119,6,0.25)" },
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

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 relative group w-full">
                    <span className="material-symbols-rounded absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA3AF] group-focus-within:text-[#5B53E0] transition-colors text-[20px]">search</span>
                    <input 
                        type="text"
                        placeholder="Search templates by name or subject..."
                        className="w-full h-10 pl-11 pr-4 bg-white border border-[#E1E4E8] rounded-[10px] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15 transition-all text-[13.5px] text-[#15171C] placeholder:text-[#9AA3AF]"
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 bg-white border border-[#E1E4E8] px-3 h-10 rounded-[10px] shadow-sm shrink-0 w-full sm:w-auto">
                    <span className="material-symbols-rounded text-[#9AA3AF] text-[20px]">filter_list</span>
                    <select 
                        className="bg-transparent text-[12px] font-bold text-[#374151] outline-none pr-2 cursor-pointer flex-1 sm:flex-initial"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="ALL">All Categories</option>
                        <option value="GENERAL">General</option>
                        <option value="ASSESSMENT">Assessments</option>
                        <option value="INTERVIEW">Interviews</option>
                        <option value="ONBOARDING">Onboarding</option>
                    </select>
                </div>
            </div>

            {/* Templates List Grid */}
            {filteredTemplates.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-[14px] border border-dashed border-[#E8EAED] shadow-sm max-w-md mx-auto">
                    <div className="relative mb-5">
                        <div className="absolute -inset-3 rounded-full bg-[#5B53E0]/10 blur-xl" />
                        <div className="relative w-14 h-14 rounded-[16px] flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#8B7DFF,#5B53E0)", boxShadow: "0 8px 24px rgba(91,83,224,0.3)" }}>
                            <Mail className="w-6 h-6" />
                        </div>
                    </div>
                    <h3 className="text-[16px] font-bold text-[#15171C] mb-1">No Templates Found</h3>
                    <p className="text-[13px] text-[#8A929E] font-medium max-w-[280px] leading-relaxed mb-5">Create your first email template to standardize candidate communication.</p>
                    <button 
                        onClick={() => { setTemplateSearch(""); setCategoryFilter("ALL"); }} 
                        className="px-5 h-9 bg-[#5B53E0] hover:bg-[#4A43C9] text-white rounded-[10px] font-semibold text-[13px] shadow-[0_4px_12px_rgba(91,83,224,0.2)] transition-all"
                    >
                        Reset Filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map((template) => (
                        <motion.div
                            layout
                            key={template.id}
                            className="group bg-white rounded-[14px] border border-[#E8EAED] hover:border-[#5B53E0]/40 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[170px]"
                            onClick={() => handleOpenModal(template)}
                        >
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="w-10 h-10 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center border border-[#DAD7F6]/60 group-hover:scale-105 transition-transform shrink-0">
                                        <FileText className="w-5 h-5 stroke-[1.5]" />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleOpenModal(template); }}
                                            className="w-8 h-8 flex items-center justify-center text-[#8A929E] hover:text-[#5B53E0] hover:bg-[#ECEBFB] rounded-[8px] border border-transparent hover:border-[#DAD7F6]/60 transition-all"
                                        >
                                            <span className="material-symbols-rounded text-[18px]">edit</span>
                                        </button>
                                        {canAccess("communications:delete") && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTemplateToDelete({ id: template.id, name: template.name });
                                                    setIsDeleteModalOpen(true);
                                                }}
                                                className="w-8 h-8 flex items-center justify-center text-[#8A929E] hover:text-rose-500 hover:bg-rose-50 rounded-[8px] border border-transparent hover:border-rose-100 transition-all"
                                            >
                                                <span className="material-symbols-rounded text-[18px]">delete</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-[6px] border ${
                                            template.category === 'ASSESSMENT' ? 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]/80' :
                                            template.category === 'INTERVIEW' ? 'bg-[#ECEBFB] text-[#5B53E0] border-[#DAD7F6]/80' :
                                            template.category === 'ONBOARDING' ? 'bg-[#F5F3FF] text-[#8B5CF6] border-[#EBE7FF]/80' :
                                            'bg-slate-100 text-[#6B6F76] border-[#E8EAED]'
                                        }`}>
                                            {template.category || 'General'}
                                        </span>
                                    </div>
                                    <h3 className="text-[15px] font-bold text-[#15171C] group-hover:text-[#5B53E0] transition-colors truncate">{template.name}</h3>
                                    <p className={`text-[10px] text-[#8A929E] ${jetbrainsMono.className}`}>ID: {template.id.slice(0, 8)}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-3 border-t border-[#E8EAED] mt-4">
                                <div className="flex items-center gap-1.5 text-[#8A929E] text-[10px] font-semibold uppercase tracking-wider">
                                    <History className="w-3.5 h-3.5" />
                                    <span>{formatDate(template.updated_at || template.created_at)}</span>
                                </div>
                                <div className="text-[#8A929E] group-hover:text-[#5B53E0] transition-colors">
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
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#15171C]/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-xl bg-white border-l border-[#E8EAED] shadow-2xl h-full flex flex-col pointer-events-auto">
                            
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between px-8 py-5 border-b border-[#E8EAED] shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center border border-[#DAD7F6]/60">
                                        <Layout className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-[16px] font-bold text-[#15171C] tracking-tight leading-tight">{isAiMode ? "AI Generation" : (editingTemplate ? "Configure Template" : "New Template")}</h2>
                                        <p className="text-[12px] text-[#8A929E] mt-0.5">Communication design and configuration</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-[8px] bg-white border border-[#E1E4E8] text-[#6B6F76] hover:bg-[#F4F5F7] hover:text-[#374151] transition-all flex items-center justify-center shadow-sm">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 custom-scrollbar">
                                
                                {!isAiMode && canAccess("communications:moderate") && (
                                    <div className="rounded-[14px] border border-[#DAD7F6]/60 bg-[#ECEBFB]/40 p-5 flex items-center justify-between gap-4">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-[#5B53E0]" />
                                                <span className="text-[13px] font-bold text-[#15171C]">Auto-generate with AI?</span>
                                            </div>
                                            <p className="text-[12px] text-[#6B6F76] font-medium leading-relaxed">Draft a professional template in seconds using smart generative templates.</p>
                                        </div>
                                        <button
                                            onClick={() => setIsAiMode(true)}
                                            className="h-9 px-4 bg-[#5B53E0] hover:bg-[#4A43C9] text-white rounded-[10px] text-[12px] font-bold transition-all active:scale-95 shadow-sm"
                                        >
                                            Generate
                                        </button>
                                    </div>
                                )}

                                {isAiMode ? (
                                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                        <div className="space-y-1.5">
                                            <label htmlFor="tpl-ai-purpose" className="text-[11.5px] font-bold text-[#8A929E] ml-0.5">Template Purpose</label>
                                            <textarea
                                                id="tpl-ai-purpose"
                                                value={aiPurpose}
                                                onChange={e => setAiPurpose(e.target.value)}
                                                className="w-full bg-white border border-[#E1E4E8] rounded-[10px] p-3 text-[13.5px] text-[#374151] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15 transition-all resize-none min-h-[120px] leading-relaxed"
                                                placeholder="e.g. Reject candidate for backend role but offer future talent pool inclusion..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <button onClick={() => setIsAiMode(false)} className="h-10 rounded-[10px] border border-[#E1E4E8] text-[#8A929E] font-semibold text-[13px] hover:bg-[#F4F5F7] transition-all">Cancel</button>
                                            <button 
                                                onClick={handleAiGenerate}
                                                disabled={isGenerating || !aiPurpose.trim()}
                                                className="h-10 bg-[#5B53E0] text-white rounded-[10px] font-semibold text-[13px] hover:bg-[#4A43C9] transition-all active:scale-95 disabled:opacity-20 shadow-sm flex items-center justify-center gap-2"
                                            >
                                                {isGenerating ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-200" />}
                                                Generate
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <form id="template-form" onSubmit={e => { e.preventDefault(); handleSave(); }} className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5 group">
                                                <label htmlFor="tpl-name" className="text-[11.5px] font-bold text-[#8A929E] ml-0.5">Template Name</label>
                                                <input
                                                    id="tpl-name"
                                                    type="text"
                                                    value={name}
                                                    onChange={e => setName(e.target.value)}
                                                    className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] px-3.5 text-[14px] text-[#15171C] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15 transition-all"
                                                    placeholder="e.g. Assessment Invitation"
                                                    required
                                                    readOnly={!canAccess("communications:moderate")}
                                                />
                                            </div>

                                            <div className="space-y-1.5 group">
                                                <label htmlFor="tpl-category" className="text-[11.5px] font-bold text-[#8A929E] ml-0.5">Category</label>
                                                <select
                                                    id="tpl-category"
                                                    value={category}
                                                    onChange={e => setCategory(e.target.value)}
                                                    className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] px-3 text-[13.5px] text-[#374151] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15 transition-all cursor-pointer"
                                                    disabled={!canAccess("communications:moderate")}
                                                >
                                                    <option value="GENERAL">General Communication</option>
                                                    <option value="ASSESSMENT">Assessment Invitation</option>
                                                    <option value="INTERVIEW">Interview Invitation</option>
                                                    <option value="ONBOARDING">Onboarding Invitation</option>
                                                </select>
                                            </div>
                                        </div>
 
                                        <div className="space-y-1.5 group">
                                            <label htmlFor="tpl-subject" className="text-[11.5px] font-bold text-[#8A929E] ml-0.5">Email Subject</label>
                                            <input
                                                id="tpl-subject"
                                                type="text"
                                                value={subject}
                                                onChange={e => setSubject(e.target.value)}
                                                className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] px-3.5 text-[14px] text-[#15171C] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15 transition-all"
                                                placeholder="Subject line of the email"
                                                required
                                                readOnly={!canAccess("communications:moderate")}
                                            />
                                        </div>

                                        <div className="space-y-1.5 group flex flex-col">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1 pb-1">
                                                <label htmlFor="base-editor" className="text-[11.5px] font-bold text-[#8A929E]">Email Body Content</label>
                                                <div className="relative shrink-0">
                                                    <select 
                                                        className="appearance-none bg-[#ECEBFB] border border-[#DAD7F6]/60 rounded-[8px] pl-3.5 pr-8 py-1.5 text-[11px] font-bold text-[#5B53E0] outline-none cursor-pointer hover:bg-white transition-all shadow-sm"
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
                                                        <option value="">Quick Insert Link/Var</option>
                                                        <optgroup label="General">
                                                            <option value="candidate_name">Candidate Name</option>
                                                            <option value="job_title">Job Title</option>
                                                            <option value="company_name">Company Name</option>
                                                            <option value="recruiter_name">Recruiter Name</option>
                                                        </optgroup>
                                                        {category === 'ASSESSMENT' && (
                                                            <optgroup label="Assessment">
                                                                <option value="assessment_link">Assessment Link</option>
                                                                <option value="test_duration">Test Duration</option>
                                                                <option value="test_topic">Test Topic</option>
                                                            </optgroup>
                                                        )}
                                                        {category === 'INTERVIEW' && (
                                                            <optgroup label="Interview">
                                                                <option value="interview_link">Interview Link</option>
                                                                <option value="interview_time">Interview Time</option>
                                                                <option value="interview_topic">Interview Topic</option>
                                                            </optgroup>
                                                        )}
                                                        {category === 'ONBOARDING' && (
                                                            <optgroup label="Onboarding">
                                                                <option value="onboarding_link">Onboarding Link</option>
                                                                <option value="onboarding_code">Onboarding Code</option>
                                                            </optgroup>
                                                        )}
                                                    </select>
                                                    <ChevronDown className="w-3 h-3 text-[#5B53E0] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                </div>
                                            </div>
                                            <textarea
                                                id="base-editor"
                                                value={body}
                                                onChange={e => setBody(e.target.value)}
                                                className="w-full bg-white border border-[#E1E4E8] rounded-[10px] p-4 text-[13.5px] text-[#374151] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15 transition-all resize-none min-h-[350px] leading-relaxed"
                                                placeholder="Write your email content here. Use {{variable_name}} for dynamic data."
                                                required
                                                readOnly={!canAccess("communications:moderate")}
                                            />
                                        </div>
                                    </form>
                                )}
                            </div>

                            {/* Drawer Footer */}
                            {!isAiMode && canAccess("communications:moderate") && (
                                <div className="p-8 border-t border-[#E8EAED] flex items-center justify-between gap-6 shrink-0">
                                    <p className="text-[11.5px] text-[#8A929E] leading-normal max-w-[280px]">This template will be available for all automated campaigns and manual outreach.</p>
                                    <button 
                                        form="template-form"
                                        type="submit"
                                        className="h-10 px-6 bg-[#5B53E0] hover:bg-[#4A43C9] text-white rounded-[10px] font-semibold text-[13.5px] shadow-[0_4px_12px_rgba(91,83,224,0.2)] transition-all flex items-center gap-1.5 shrink-0"
                                    >
                                        <Save className="w-4 h-4" />
                                        Save Template
                                    </button>
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
                title="Delete Template?"
                message={`Are you sure you want to delete "${templateToDelete?.name}"? This action cannot be undone.`}
                confirmLabel="Delete Template"
                cancelLabel="Cancel"
                isDestructive={true}
            />
        </div>
    );
}
