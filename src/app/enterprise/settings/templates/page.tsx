"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Mail, 
    Plus, 
    Trash2, 
    Edit3, 
    Sparkles, 
    Zap, 
    X, 
    Save, 
    ArrowRight,
    FileText,
    History,
    ChevronDown,
    RefreshCcw,
    Layout
} from "lucide-react";
import ConfirmationModal from "@/components/common/ConfirmationModal";

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
            setTimeout(() => setIsLoading(false), 600);
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
                        cleanedContent = cleanedContent.replace(/```json/g, "").replace(/```/g, "");
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
        } catch (e: any) {
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
        } catch (e: any) {
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
        } catch (e: any) {
            console.error(e);
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
                        <div key={i} className="bg-white h-64 rounded-2xl border border-slate-100 animate-pulse shadow-sm" />
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
                        <span className="material-symbols-rounded">mail</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 tracking-tight">Email Templates</h1>
                        <p className="text-slate-500 text-[10px] font-medium   ">Standardize organizational outreach</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {canAccess("communications:moderate") && (
                        <button 
                            onClick={() => handleOpenModal()}
                            className="px-6 py-2.5 bg-[#7C3AED] text-white rounded-xl hover:bg-[#6D28D9] transition-all font-black text-[9px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-100"
                        >
                            <span className="material-symbols-rounded text-base">add</span>
                            New Template
                        </button>
                    )}
                    <button 
                        onClick={fetchTemplates}
                        className="w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-[#7C3AED] hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm"
                    >
                        <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between min-h-[140px]"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-[#7C3AED]">Total Templates</span>
                        <div className="w-12 h-12 rounded-xl bg-violet-50 text-[#7C3AED] flex items-center justify-center transition-all group-hover:scale-110">
                            <Mail className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="text-4xl font-black text-slate-900 mt-auto leading-none">
                        {templates.length}
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between min-h-[140px]"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-blue-500">Recruitment</span>
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center transition-all group-hover:scale-110">
                            <Zap className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="text-4xl font-black text-slate-900 mt-auto leading-none">
                        {templates.filter(t => t.category === 'INTERVIEW' || t.category === 'ASSESSMENT').length}
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between min-h-[140px]"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-emerald-500">Onboarding</span>
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center transition-all group-hover:scale-110">
                            <Layout className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="text-4xl font-black text-slate-900 mt-auto leading-none">
                        {templates.filter(t => t.category === 'ONBOARDING').length}
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between min-h-[140px]"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-amber-500">Dynamic Vars</span>
                        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center transition-all group-hover:scale-110">
                            <Sparkles className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="text-4xl font-black text-slate-900 mt-auto leading-none">
                        {templates.reduce((acc, t) => acc + (t.variables?.length || 0), 0)}
                    </div>
                </motion.div>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 group">
                    <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#7C3AED] transition-colors">search</span>
                    <input 
                        type="text"
                        placeholder="Search templates by name or subject..."
                        className="w-full h-12 pl-12 pr-6 bg-white border border-slate-200 rounded-xl outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-50 transition-all font-medium text-sm"
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm">
                    <span className="material-symbols-rounded text-slate-400 pl-2">filter_list</span>
                    <select 
                        className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none pr-4 cursor-pointer"
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

            {templates.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-2xl border border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-xl flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">No Templates Found</h3>
                    <p className="text-sm text-slate-400 font-medium mt-2 max-w-[280px] mx-auto leading-relaxed">Create your first email template to standardize candidate communication.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {templates.filter(t => {
                        const matchesSearch = (t.name + t.subject).toLowerCase().includes(templateSearch.toLowerCase());
                        const matchesCat = categoryFilter === "ALL" || t.category === categoryFilter;
                        return matchesSearch && matchesCat;
                    }).map((template) => (
                        <motion.div
                            layout
                            key={template.id}
                            className="group bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden cursor-pointer"
                            onClick={() => handleOpenModal(template)}
                        >
                            <div className="p-6 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                        <FileText className="w-6 h-6 stroke-[1.5]" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleOpenModal(template); }}
                                            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-[#7C3AED] hover:bg-violet-50 rounded-xl transition-all"
                                        >
                                            <span className="material-symbols-rounded text-lg">edit</span>
                                        </button>
                                        {canAccess("communications:delete") && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTemplateToDelete({ id: template.id, name: template.name });
                                                    setIsDeleteModalOpen(true);
                                                }}
                                                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                            >
                                                <span className="material-symbols-rounded text-lg">delete</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[10px] font-bold   px-3 py-1 rounded-lg ${
                                            template.category === 'ASSESSMENT' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                                            template.category === 'INTERVIEW' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                            template.category === 'ONBOARDING' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                            'bg-slate-100 text-slate-500'
                                        }`}>
                                            {template.category || 'General'}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{template.name}</h3>
                                    <p className="text-[10px] text-slate-400 font-medium tracking-tight">Template ID: {template.id.slice(0, 8)}</p>
                                </div>
                            </div>
                            
                            <div className="px-6 py-4 flex items-center justify-between bg-slate-50/50 border-t border-slate-200/50 rounded-b-3xl mt-auto">
                                <div className="flex items-center gap-2 text-slate-300">
                                    <History className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold  ">{formatDate(template.updated_at || template.created_at)}</span>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                                    <ArrowRight className="w-4 h-4" />
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
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/10 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-2xl bg-white shadow-3xl h-full flex flex-col pointer-events-auto">
                            
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between px-10 py-8 border-b border-slate-50 shrink-0">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xl">
                                        <Layout className="w-8 h-8 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{isAiMode ? "AI Generation" : (editingTemplate ? "Edit Template" : "New Template")}</h2>
                                        <p className="text-sm text-slate-400 font-medium mt-2">Communication design and configuration</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 overflow-y-auto px-10 py-10 space-y-12 no-scrollbar">
                                
                                {!isAiMode && canAccess("communications:moderate") && (
                                    <div className="bg-indigo-600 rounded-xl p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-100">
                                        <div className="relative z-10 flex items-center justify-between gap-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <Sparkles className="w-5 h-5 text-indigo-200" />
                                                    <span className="text-sm font-bold">Auto-generate with AI?</span>
                                                </div>
                                                <p className="text-xs text-indigo-100 font-medium">Let AI draft a professional template for you based on a few details.</p>
                                            </div>
                                            <button
                                                onClick={() => setIsAiMode(true)}
                                                className="px-6 h-12 bg-white text-indigo-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all active:scale-95 shadow-xl"
                                            >
                                                Try AI Generator
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {isAiMode ? (
                                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-slate-500 ml-1">Template Purpose</label>
                                            <textarea
                                                value={aiPurpose}
                                                onChange={e => setAiPurpose(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-6 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner h-40 leading-relaxed"
                                                placeholder="e.g. Reject candidate for backend role but offer future talent pool inclusion..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                            <button onClick={() => setIsAiMode(false)} className="h-14 rounded-xl border border-slate-100 text-slate-400 font-bold text-xs hover:bg-slate-50 transition-all">Cancel</button>
                                            <button 
                                                onClick={handleAiGenerate}
                                                disabled={isGenerating || !aiPurpose.trim()}
                                                className="h-14 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-20 shadow-2xl flex items-center justify-center gap-3"
                                            >
                                                {isGenerating ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-indigo-400" />}
                                                Generate Template
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                        <form id="template-form" onSubmit={e => { e.preventDefault(); handleSave(); }} className="space-y-10">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-2 group">
                                                    <label className="text-xs font-bold text-slate-500 ml-1 group-focus-within:text-indigo-600 transition-colors">Template Name</label>
                                                    <input
                                                        type="text"
                                                        value={name}
                                                        onChange={e => setName(e.target.value)}
                                                        className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"
                                                        placeholder="e.g. Assessment Invitation"
                                                        required
                                                        readOnly={!canAccess("communications:moderate")}
                                                    />
                                                </div>

                                                <div className="space-y-2 group">
                                                    <label className="text-xs font-bold text-slate-500 ml-1 group-focus-within:text-indigo-600 transition-colors">Category</label>
                                                    <select
                                                        value={category}
                                                        onChange={e => setCategory(e.target.value)}
                                                        className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner cursor-pointer"
                                                        disabled={!canAccess("communications:moderate")}
                                                    >
                                                        <option value="GENERAL">General Communication</option>
                                                        <option value="ASSESSMENT">Assessment Invitation</option>
                                                        <option value="INTERVIEW">Interview Invitation</option>
                                                        <option value="ONBOARDING">Onboarding Invitation</option>
                                                    </select>
                                                </div>
                                            </div>
 
                                            <div className="space-y-2 group">
                                                <label className="text-xs font-bold text-slate-500 ml-1 group-focus-within:text-indigo-600 transition-colors">Email Subject</label>
                                                <input
                                                    type="text"
                                                    value={subject}
                                                    onChange={e => setSubject(e.target.value)}
                                                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"
                                                    placeholder="Subject line of the email"
                                                    required
                                                    readOnly={!canAccess("communications:moderate")}
                                                />
                                            </div>

                                            <div className="space-y-2 group">
                                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1 pb-2">
                                                        <label className="text-xs font-bold text-slate-500 group-focus-within:text-indigo-600 transition-colors">Email Body Content</label>
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative group/insert">
                                                                <select 
                                                                    className="appearance-none bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-1.5 pr-8 text-[10px] font-bold text-indigo-600   outline-none cursor-pointer hover:bg-white transition-all shadow-sm"
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
                                                            <ChevronDown className="w-3 h-3 text-indigo-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <textarea
                                                    id="base-editor"
                                                    value={body}
                                                    onChange={e => setBody(e.target.value)}
                                                    className="w-full h-[400px] bg-slate-50 border border-slate-100 rounded-xl px-8 py-8 text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner leading-relaxed"
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
                                <div className="p-10 border-t border-slate-50 flex items-center justify-between gap-6 shrink-0">
                                    <p className="text-xs font-semibold text-slate-400 leading-relaxed max-w-[240px]">This template will be available for all automated campaigns and manual outreach.</p>
                                    <button 
                                        form="template-form"
                                        type="submit"
                                        className="px-10 h-14 bg-slate-900 text-white rounded-xl font-bold text-sm tracking-wide hover:bg-indigo-600 transition-all active:scale-[0.98] shadow-2xl flex items-center gap-3"
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
