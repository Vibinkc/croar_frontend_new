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
    History
} from "lucide-react";
import ConfirmationModal from "@/components/common/ConfirmationModal";

interface Template {
    id: string;
    name: string;
    subject: string;
    body: string;
    variables: string[];
    created_at?: string;
    updated_at?: string;
}

export default function EmailTemplatesPage() {
    const { token } = useAuth();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<{ id: string; name: string } | null>(null);

    // Form State
    const [name, setName] = useState("");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");

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

    const getErrorMessage = (data: any) => {
        if (typeof data.detail === 'string') return data.detail;
        if (Array.isArray(data.detail)) {
            return data.detail.map((e: any) => e.msg || e).join(", ");
        }
        return null;
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
        } else {
            setEditingTemplate(null);
            setName("");
            setSubject("");
            setBody("");
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
                body: JSON.stringify({ name, subject, body, variables: [] })
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
                        <div key={i} className="bg-white h-64 rounded-[2.5rem] border border-slate-100 animate-pulse shadow-sm" />
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
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-inner text-indigo-400">
                        <Mail className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                            <span className="text-[8px] font-black uppercase tracking-[0.1em] text-indigo-400">Template Logic Repository</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter leading-none italic uppercase">Email Templates</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-3 opacity-60">Standardized Organizational Responses</p>
                    </div>
                </div>

                <div className="relative z-10">
                    <button 
                        onClick={() => handleOpenModal()}
                        className="px-8 h-14 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-400 hover:text-white transition-all active:scale-95 shadow-xl shadow-slate-900/50 flex items-center gap-3"
                    >
                        <Plus className="w-5 h-5" />
                        Deploy Template
                    </button>
                </div>

                {/* Tactical background elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -mr-64 -mt-64" />
            </motion.header>

            {/* List */}
            {templates.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">No Protocols Found</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 max-w-[240px] mx-auto leading-relaxed">Initialize your first communication blueprint to standardize outreach.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {templates.map(template => (
                        <motion.div
                            layout
                            key={template.id}
                            className="group bg-white rounded-[2.5rem] border border-slate-100 p-1.5 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 relative overflow-hidden"
                            onClick={() => handleOpenModal(template)}
                        >
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="p-8 pb-4 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-inner">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setTemplateToDelete({ id: template.id, name: template.name });
                                            setIsDeleteModalOpen(true);
                                        }}
                                        className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tighter leading-none italic uppercase group-hover:text-indigo-600 transition-colors truncate">{template.name}</h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate opacity-60 italic">Subject: {template.subject}</p>
                                </div>

                                <div className="text-[11px] font-bold text-slate-500 line-clamp-3 h-14 bg-slate-50/50 p-4 rounded-2xl border border-slate-50 overflow-hidden group-hover:bg-white group-hover:border-slate-100 transition-all tabular-nums leading-relaxed uppercase opacity-80">
                                    {template.body.replace(/<[^>]*>?/gm, '')}
                                </div>
                            </div>
                            
                            <div className="px-8 py-5 flex items-center justify-between bg-slate-50/50 border-t border-slate-50 rounded-b-[2.5rem]">
                                <div className="flex items-center gap-2 opacity-40">
                                    <History className="w-4 h-4" />
                                    <span className="text-[9px] font-black uppercase tracking-widest truncate">{formatDate(template.updated_at || template.created_at)}</span>
                                </div>
                                <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                                    <Edit3 className="w-4 h-4" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Blueprint Drawer */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[200] flex justify-end overflow-hidden">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col pointer-events-auto border-l border-slate-100">
                            
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between px-10 py-8 border-b border-slate-50 shrink-0">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-2xl rotate-3">
                                        <Mail className="w-8 h-8 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 tracking-tighter italic uppercase leading-none">{isAiMode ? "Neural Generation" : (editingTemplate ? "Refine Protocol" : "Initialize Blueprint")}</h2>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2">Communication Design System</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-2xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 overflow-y-auto px-10 py-10 space-y-12 no-scrollbar">
                                
                                {/* AI HUD */}
                                {!isAiMode && (
                                    <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-50" />
                                        <div className="relative z-10 flex items-center justify-between gap-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <Sparkles className="w-5 h-5 text-indigo-400" />
                                                    <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Need help writing?</span>
                                                </div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">Neural intelligence can architect this protocol for you.</p>
                                            </div>
                                            <button
                                                onClick={() => setIsAiMode(true)}
                                                className="px-6 h-12 bg-white text-slate-950 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-400 hover:text-white transition-all active:scale-95 shadow-2xl"
                                            >
                                                Try Neural Generator
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {isAiMode ? (
                                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                                        <div className="space-y-3 group">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Protocol Objective</label>
                                            <textarea
                                                value={aiPurpose}
                                                onChange={e => setAiPurpose(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-slate-900 transition-all shadow-inner h-40 leading-relaxed uppercase placeholder:italic"
                                                placeholder="e.g. Reject candidate for backend role but offer future talent pool inclusion..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                            <button onClick={() => setIsAiMode(false)} className="h-14 rounded-2xl border border-slate-100 text-slate-400 font-black text-[9px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all">Abort</button>
                                            <button 
                                                onClick={handleAiGenerate}
                                                disabled={isGenerating || !aiPurpose.trim()}
                                                className="h-14 bg-slate-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-20 shadow-2xl flex items-center justify-center gap-3"
                                            >
                                                {isGenerating && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                                                Architect Protocol
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <form id="template-form" onSubmit={e => { e.preventDefault(); handleSave(); }} className="space-y-10">
                                        <div className="space-y-3 group">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Blueprint Identity</label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-800 outline-none focus:bg-white focus:border-slate-900 transition-all shadow-inner italic"
                                                placeholder="PROTOCOL_NAME_ALPHA"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-3 group">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Mission Subject Line</label>
                                            <input
                                                type="text"
                                                value={subject}
                                                onChange={e => setSubject(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-slate-900 transition-all shadow-inner"
                                                placeholder="Operational Subject..."
                                                required
                                            />
                                        </div>

                                        <div className="space-y-3 group">
                                            <div className="flex justify-between items-center px-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Protocol Logic Payload</label>
                                                <div className="flex gap-2">
                                                    <span className="text-[7px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded uppercase font-mono">{"{{candidate_name}}"}</span>
                                                    <span className="text-[7px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded uppercase font-mono">{"{{job_title}}"}</span>
                                                </div>
                                            </div>
                                            <textarea
                                                value={body}
                                                onChange={e => setBody(e.target.value)}
                                                className="w-full h-80 bg-slate-50 border border-slate-100 rounded-[2.5rem] px-8 py-8 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-900 transition-all shadow-inner leading-relaxed tabular-nums uppercase placeholder:italic"
                                                placeholder="INITIALIZE PAYLOAD..."
                                                required
                                            />
                                        </div>
                                    </form>
                                )}
                            </div>

                            {/* Drawer Footer */}
                            {!isAiMode && (
                                <div className="p-10 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between gap-6 shrink-0">
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none max-w-[200px]">By deploying, you synchronize this protocol across the organizational network.</p>
                                    <button 
                                        form="template-form"
                                        type="submit"
                                        className="px-10 h-14 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all active:scale-95 shadow-2xl flex items-center gap-3"
                                    >
                                        <Save className="w-4 h-4" />
                                        Finalize Deployment
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
                title="Decommission Protocol?"
                message={`Are you sure you want to permanently wipe the blueprint "${templateToDelete?.name}"? All associated automation nodes will lose this neural reference.`}
                confirmLabel="Yes, Decommission"
                cancelLabel="No"
                isDestructive={true}
            />
        </div>
    );
}
