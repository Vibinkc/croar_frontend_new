"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Plus, 
    Trash2, 
    Edit3, 
    X, 
    Save, 
    Zap, 
    Sparkles, 
    Code, 
    Brain, 
    Clock, 
    ListChecks, 
    ChevronRight,
    ArrowRight,
    Search,
    BookOpen
} from "lucide-react";
import ConfirmationModal from "@/components/common/ConfirmationModal";

interface AssessmentTemplate {
    id: string;
    name: string;
    type: "APTITUDE" | "CODING" | "BOTH";
    topic: string;
    question_count: number;
    test_duration: number;
    generated_questions?: any[];
    email_template_id?: string;
    created_at?: string;
}

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
}

export default function AssessmentTemplatesPage() {
    const { token } = useAuth();
    const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<AssessmentTemplate | null>(null);
    const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
    
    // Deletion
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<{ id: string; name: string } | null>(null);

    // Form State
    const [name, setName] = useState("");
    const [type, setType] = useState<"APTITUDE" | "CODING" | "BOTH">("APTITUDE");
    const [topic, setTopic] = useState("");
    const [questionCount, setQuestionCount] = useState(10);
    const [duration, setDuration] = useState(30);
    const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState("");
    
    // Tab and Generation State
    const [activeTab, setActiveTab] = useState<'config' | 'questions'>('config');
    const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (token) {
            fetchTemplates();
            fetchEmailTemplates();
        }
    }, [token]);

    const fetchEmailTemplates = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/communication/templates`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEmailTemplates(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment-templates/`, {
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

    const handleOpenModal = (template?: AssessmentTemplate) => {
        if (template) {
            setEditingTemplate(template);
            setName(template.name);
            setType(template.type);
            setTopic(template.topic);
            setQuestionCount(template.question_count);
            setDuration(template.test_duration);
            setSelectedEmailTemplateId(template.email_template_id || "");
            setGeneratedQuestions(template.generated_questions || []);
        } else {
            setEditingTemplate(null);
            setName("");
            setType("APTITUDE");
            setTopic("");
            setQuestionCount(10);
            setDuration(30);
            setSelectedEmailTemplateId("");
            setGeneratedQuestions([]);
        }
        setActiveTab('config');
        setIsModalOpen(true);
    };

    const handleGenerateQuestions = async () => {
        if (!topic) return;
        setIsGenerating(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment/generate-preview?type=${type}&topic=${encodeURIComponent(topic)}&count=${questionCount}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const questions = await res.json();
                setGeneratedQuestions(questions);
                setActiveTab('questions');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleUpdateQuestion = (qId: string, field: string, value: any) => {
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
            }
        } catch (e) {
            console.error(e);
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
        } catch (e) {
            console.error(e);
        } finally {
            setIsDeleteModalOpen(false);
            setTemplateToDelete(null);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
                <div className="h-32 bg-slate-900 rounded-[2.5rem] relative overflow-hidden flex items-center px-10 border-b-4 border-slate-800 shadow-2xl shadow-indigo-100/10">
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
                        <Brain className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                            <span className="text-[8px] font-black uppercase tracking-[0.1em] text-indigo-400">Cognitive Assessment Matrix</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter leading-none italic uppercase">Assessment Templates</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-3 opacity-60">Standardized Skill Verification Protocols</p>
                    </div>
                </div>

                <div className="relative z-10">
                    <button 
                        onClick={() => handleOpenModal()}
                        className="px-8 h-14 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-400 hover:text-white transition-all active:scale-95 shadow-xl shadow-slate-900/50 flex items-center gap-3"
                    >
                        <Plus className="w-5 h-5" />
                        Deploy Matrix
                    </button>
                </div>

                {/* Tactical background elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -mr-64 -mt-64" />
            </motion.header>

            {/* List */}
            {templates.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Brain className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">No Matrices Found</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 max-w-[240px] mx-auto leading-relaxed">Initialize your first skill verification blueprint to begin cognitive mapping.</p>
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
                                        {template.type === 'CODING' ? <Code className="w-6 h-6" /> : (template.type === 'BOTH' ? <Brain className="w-6 h-6" /> : <ListChecks className="w-6 h-6" />)}
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

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-widest">{template.type}</span>
                                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic">{template.topic}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tighter leading-none italic uppercase group-hover:text-indigo-600 transition-colors truncate">{template.name}</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-slate-50">
                                    <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100/50 group-hover:bg-white transition-colors">
                                        <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Load Nodes</div>
                                        <div className="text-xs font-black text-slate-700 italic">{template.generated_questions?.length || template.question_count} Pkts</div>
                                    </div>
                                    <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100/50 group-hover:bg-white transition-colors">
                                        <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Time Lock</div>
                                        <div className="text-xs font-black text-slate-700 italic">{template.test_duration}m Limit</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="px-8 py-5 flex items-center justify-between bg-slate-50/50 border-t border-slate-50 rounded-b-[2.5rem]">
                                <div className="flex items-center gap-2 opacity-40">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-[9px] font-black uppercase tracking-widest truncate">{template.created_at ? new Date(template.created_at).toLocaleDateString() : 'N/A'}</span>
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
                        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-4xl bg-white shadow-2xl h-full flex flex-col pointer-events-auto border-l border-slate-100">
                            
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between px-10 py-8 border-b border-slate-50 shrink-0">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center shadow-2xl rotate-3">
                                        <Zap className="w-8 h-8 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 tracking-tighter italic uppercase leading-none">{editingTemplate ? "Refine Matrix" : "Initialize Matrix"}</h2>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2">Cognitive Verification Protocol</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex bg-slate-100 p-1 rounded-2xl shrink-0">
                                        <button onClick={() => setActiveTab('config')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'config' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>1. Config</button>
                                        <button onClick={() => setActiveTab('questions')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'questions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>2. Nodes</button>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-2xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 overflow-y-auto px-10 py-10 no-scrollbar bg-slate-50/20">
                                {activeTab === 'config' ? (
                                    <form id="matrix-form" onSubmit={e => { e.preventDefault(); handleSave(); }} className="max-w-xl mx-auto space-y-12">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Matrix Identity Label</label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-100 transition-all shadow-inner italic"
                                                placeholder="E.G. FRONTEND_CORE_ALPHA"
                                                required
                                            />
                                        </div>

                                        <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-50" />
                                            <div className="relative z-10 space-y-8">
                                                <div className="flex items-center gap-3">
                                                    <Settings2 className="w-4 h-4 text-indigo-400" />
                                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Operational Parameters</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-8">
                                                    <div className="space-y-3">
                                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Archetype</label>
                                                        <select
                                                            value={type}
                                                            onChange={e => setType(e.target.value as any)}
                                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-[10px] font-black text-white uppercase tracking-widest outline-none focus:bg-white/10 transition-all"
                                                        >
                                                            <option value="APTITUDE" className="bg-slate-900 text-white">Aptitude HUD</option>
                                                            <option value="CODING" className="bg-slate-900 text-white">Coding Terminal</option>
                                                            <option value="BOTH" className="bg-slate-900 text-white">Full Hybrid</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Research Topic</label>
                                                        <input
                                                            type="text"
                                                            value={topic}
                                                            onChange={e => setTopic(e.target.value)}
                                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-[10px] font-black text-white outline-none focus:bg-white/10 transition-all uppercase placeholder:text-white/20"
                                                            placeholder="E.G. REACT_NATIVE"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-8">
                                                    <div className="space-y-3">
                                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Node Count</label>
                                                        <input
                                                            type="number"
                                                            value={questionCount}
                                                            onChange={e => setQuestionCount(parseInt(e.target.value))}
                                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-[10px] font-black text-white outline-none focus:bg-white/10 transition-all tabular-nums"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Time Lock (MIN)</label>
                                                        <input
                                                            type="number"
                                                            value={duration}
                                                            onChange={e => setDuration(parseInt(e.target.value))}
                                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-[10px] font-black text-white outline-none focus:bg-white/10 transition-all tabular-nums"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Transmission Protocol</label>
                                                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">Linked Template</span>
                                            </div>
                                            <select
                                                value={selectedEmailTemplateId}
                                                onChange={e => setSelectedEmailTemplateId(e.target.value)}
                                                className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-4 text-[10px] font-black text-slate-800 uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-100 transition-all shadow-inner"
                                            >
                                                <option value="">Select Transport Protocol...</option>
                                                {emailTemplates.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-10 max-w-3xl mx-auto pb-20">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter italic leading-none mb-1">Knowledge Node Repository</h3>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Architecting Behavioral Artifacts</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <button 
                                                    onClick={handleGenerateQuestions}
                                                    disabled={isGenerating || !topic}
                                                    className="h-10 px-6 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-indigo-600 transition-all disabled:opacity-20 shadow-xl"
                                                >
                                                    {isGenerating ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4 text-indigo-400" />}
                                                    Neural Generation
                                                </button>
                                                <button 
                                                    onClick={handleAddQuestion}
                                                    className="h-10 px-6 bg-white border border-slate-100 text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-slate-50 transition-all shadow-sm"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Add Node
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            {generatedQuestions.map((q, idx) => (
                                                <motion.div 
                                                    layout
                                                    key={q.id} 
                                                    className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all relative group"
                                                >
                                                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black italic shadow-2xl border-2 border-white">#{idx + 1}</div>
                                                    
                                                    <button 
                                                        onClick={() => handleDeleteQuestion(q.id)}
                                                        className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-rose-50 text-rose-500 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-rose-500 hover:text-white shadow-sm"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>

                                                    <div className="space-y-6 pt-4">
                                                        {q.type === 'APTITUDE' ? (
                                                            <>
                                                                <div className="space-y-2">
                                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Neural Load (Question Text)</label>
                                                                    <textarea 
                                                                        value={q.question} 
                                                                        onChange={(e) => handleUpdateQuestion(q.id, "question", e.target.value)}
                                                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 transition-all h-24 resize-none shadow-inner uppercase italic"
                                                                    />
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    {(q.options || []).map((opt: string, oi: number) => (
                                                                        <div key={oi} className="relative group/opt">
                                                                            <input 
                                                                                value={opt} 
                                                                                onChange={(e) => {
                                                                                    const newOpts = [...q.options];
                                                                                    newOpts[oi] = e.target.value;
                                                                                    handleUpdateQuestion(q.id, "options", newOpts);
                                                                                }}
                                                                                className={`w-full bg-slate-50 border-2 rounded-2xl pl-16 pr-6 py-4 text-[10px] font-black uppercase tracking-tight transition-all tabular-nums ${q.correct_answer === opt ? "border-indigo-500 bg-indigo-50/30 text-indigo-700" : "border-transparent text-slate-500 focus:bg-white"}`}
                                                                            />
                                                                            <button 
                                                                                onClick={() => handleUpdateQuestion(q.id, "correct_answer", opt)}
                                                                                className={`absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-sm ${q.correct_answer === opt ? "bg-indigo-600 text-white" : "bg-white text-slate-300 hover:bg-slate-900 hover:text-white"}`}
                                                                            >
                                                                                <span className="material-symbols-rounded text-base italic">{q.correct_answer === opt ? "verified" : (oi === 0 ? "A" : oi === 1 ? "B" : oi === 2 ? "C" : "D")}</span>
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="space-y-2">
                                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Terminal Identity (Title)</label>
                                                                    <input 
                                                                        type="text"
                                                                        value={q.title} 
                                                                        onChange={(e) => handleUpdateQuestion(q.id, "title", e.target.value)}
                                                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-black text-slate-950 outline-none focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner uppercase italic"
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Neural Logic Specs (Description)</label>
                                                                    <textarea 
                                                                        value={q.description || q.problem_statement} 
                                                                        onChange={(e) => handleUpdateQuestion(q.id, "description", e.target.value)}
                                                                        className="w-full bg-slate-50 border-none rounded-[2rem] px-8 py-8 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 transition-all h-48 shadow-inner tabular-nums leading-relaxed italic uppercase"
                                                                    />
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                            {generatedQuestions.length === 0 && (
                                                <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-[3rem] border border-dashed border-slate-200 opacity-40">
                                                    <Search className="w-16 h-16 text-slate-200 mb-6" />
                                                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic">Repository Empty</h4>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-[240px] mt-2 leading-relaxed">Initiate neural generation or manually add behavioral nodes to this matrix.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Drawer Footer */}
                            <div className="p-10 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between gap-6 shrink-0">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none max-w-[200px]">By deploying, you synchronize this skill matrix across the organizational network.</p>
                                <button 
                                    onClick={handleSave}
                                    form="matrix-form"
                                    type="submit"
                                    className="px-12 h-14 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all active:scale-95 shadow-2xl flex items-center gap-4"
                                >
                                    <Save className="w-5 h-5 text-indigo-400" />
                                    Finalize Deployment
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Decommission Matrix?"
                message={`Are you sure you want to permanently wipe the blueprint "${templateToDelete?.name}"? All associated recruitment nodes will lose this cognitive reference.`}
                confirmLabel="Yes, Decommission"
                cancelLabel="No"
                isDestructive={true}
            />
        </div>
    );
}

import { Settings2 } from "lucide-react";
