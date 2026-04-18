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
    BookOpen,
    RefreshCcw,
    Settings2,
    Calendar,
    PenTool
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
    const { token, canAccess } = useAuth();
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
                        <span className="material-symbols-rounded">quiz</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 tracking-tight">Assessment Templates</h1>
                        <p className="text-slate-500 text-[10px] font-medium   ">Standardize technical and skill evaluations</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {canAccess("assessments:moderate") && (
                        <button 
                            onClick={() => handleOpenModal()}
                            className="px-6 py-2.5 bg-[#7C3AED] text-white rounded-xl hover:bg-[#6D28D9] transition-all font-black text-[9px]   flex items-center gap-2 shadow-xl shadow-indigo-100"
                        >
                            <span className="material-symbols-rounded text-base">add</span>
                            New Template
                        </button>
                    )}
                    <button 
                        onClick={fetchTemplates}
                        className="w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-[#7C3AED] hover:bg-slate-50 hover:border-violet-100 transition-all flex items-center justify-center shadow-sm"
                    >
                        <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {templates.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-2xl border border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-xl flex items-center justify-center mx-auto mb-6">
                        <ListChecks className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">No Templates Found</h3>
                    <p className="text-sm text-slate-400 font-medium mt-2 max-w-[280px] mx-auto leading-relaxed">Create your first skill assessment template to begin testing candidates.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {templates.map(template => (
                        <motion.div
                            layout
                            key={template.id}
                            className="group bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden cursor-pointer"
                            onClick={() => handleOpenModal(template)}
                        >
                            <div className="p-6 pb-2 space-y-6 text-center md:text-left">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner border border-slate-50 group-hover:border-indigo-600">
                                        {template.type === 'CODING' ? <Code className="w-6 h-6 stroke-[1.5]" /> : (template.type === 'BOTH' ? <Brain className="w-6 h-6 stroke-[1.5]" /> : <ListChecks className="w-6 h-6 stroke-[1.5]" />)}
                                    </div>
                                    {canAccess("assessments:delete") && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTemplateToDelete({ id: template.id, name: template.name });
                                                setIsDeleteModalOpen(true);
                                            }}
                                            className="p-2 bg-rose-50 text-rose-300 hover:bg-rose-500 hover:text-white transition-all rounded-xl opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-center md:justify-between">
                                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full  ">{template.type}</span>
                                        <span className="hidden md:inline text-[10px] font-bold text-slate-400   truncate max-w-[100px]">{template.topic}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{template.name}</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 group-hover:bg-white transition-colors">
                                        <p className="text-[9px] font-bold text-slate-400   mb-1">Questions</p>
                                        <p className="text-xs font-bold text-slate-700">{template.generated_questions?.length || template.question_count} items</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 group-hover:bg-white transition-colors">
                                        <p className="text-[9px] font-bold text-slate-400   mb-1">Duration</p>
                                        <p className="text-xs font-bold text-slate-700">{template.test_duration} mins</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="px-6 py-4 flex items-center justify-between bg-slate-50/50 border-t border-slate-200/50 rounded-b-3xl mt-auto">
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold  ">{template.created_at ? new Date(template.created_at).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div className="text-slate-300 group-hover:text-indigo-600 transition-colors">
                                    {canAccess("assessments:moderate") ? (
                                        <Edit3 className="w-4 h-4" />
                                    ) : (
                                        <ArrowRight className="w-4 h-4" />
                                    )}
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
                        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-2xl bg-white shadow-3xl h-full flex flex-col pointer-events-auto overflow-hidden">
                            
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 shrink-0">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xl">
                                        <Settings2 className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{editingTemplate ? "Edit Template" : "New Template"}</h2>
                                        <p className="text-sm text-slate-400 font-medium mt-2">Assessment design and skill configuration</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                                        <button onClick={() => setActiveTab('config')} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'config' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>1. Details</button>
                                        <button onClick={() => setActiveTab('questions')} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'questions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>2. Questions</button>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 overflow-y-auto px-10 py-10 no-scrollbar bg-slate-50/20">
                                {activeTab === 'config' ? (
                                    <form id="matrix-form" onSubmit={e => { e.preventDefault(); handleSave(); }} className="max-w-xl mx-auto space-y-12">
                                        <div className="space-y-2 group">
                                            <label className="text-xs font-bold text-slate-500 ml-1 group-focus-within:text-indigo-600 transition-colors">Template Name</label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                className="w-full h-14 bg-white border border-slate-100 rounded-xl px-6 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all shadow-inner"
                                                placeholder="e.g. Senior Backend Node.js Skills"
                                                required
                                                readOnly={!canAccess("assessments:moderate")}
                                            />
                                        </div>

                                        <div className="bg-slate-900 rounded-xl p-8 text-white relative shadow-xl shadow-indigo-100/5">
                                            <div className="relative z-10 space-y-10">
                                                <div className="flex items-center gap-3">
                                                    <Zap className="w-5 h-5 text-indigo-400" />
                                                    <span className="text-xs font-bold   text-indigo-200">Test Configuration</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-8">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-bold text-slate-500   ml-1">Type</label>
                                                        <select
                                                            value={type}
                                                            onChange={e => setType(e.target.value as any)}
                                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white outline-none focus:bg-white/10 transition-all"
                                                            disabled={!canAccess("assessments:moderate")}
                                                        >
                                                            <option value="APTITUDE" className="bg-slate-900">Aptitude Test</option>
                                                            <option value="CODING" className="bg-slate-900">Coding Challenge</option>
                                                            <option value="BOTH" className="bg-slate-900">Hybrid Assessment</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-bold text-slate-500   ml-1">Topic / Skills</label>
                                                        <input
                                                            type="text"
                                                            value={topic}
                                                            onChange={e => setTopic(e.target.value)}
                                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white outline-none focus:bg-white/10 transition-all"
                                                            placeholder="e.g. React, Python"
                                                            required
                                                            readOnly={!canAccess("assessments:moderate")}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-8">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-bold text-slate-500   ml-1">Question Count</label>
                                                        <input
                                                            type="number"
                                                            value={questionCount}
                                                            onChange={e => setQuestionCount(parseInt(e.target.value))}
                                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white outline-none focus:bg-white/10 transition-all"
                                                            required
                                                            readOnly={!canAccess("assessments:moderate")}
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-bold text-slate-500   ml-1">Duration (Mins)</label>
                                                        <input
                                                            type="number"
                                                            value={duration}
                                                            onChange={e => setDuration(parseInt(e.target.value))}
                                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white outline-none focus:bg-white/10 transition-all"
                                                            required
                                                            readOnly={!canAccess("assessments:moderate")}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 group">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-xs font-bold text-slate-500 group-focus-within:text-indigo-600 transition-colors">Invitation Email Template</label>
                                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full  ">Communication</span>
                                            </div>
                                            <select
                                                value={selectedEmailTemplateId}
                                                onChange={e => setSelectedEmailTemplateId(e.target.value)}
                                                className="w-full h-14 bg-white border border-slate-100 rounded-xl px-6 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all shadow-inner cursor-pointer"
                                                disabled={!canAccess("assessments:moderate")}
                                            >
                                                <option value="">Select email template...</option>
                                                {emailTemplates.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-10 max-w-xl mx-auto pb-20">
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 leading-tight">Assessment Questions</h3>
                                                <p className="text-xs text-slate-400 font-medium mt-1">Configure individual questions or generate with AI</p>
                                            </div>
                                            <div className="flex gap-3">
                                                {canAccess("assessments:moderate") && (
                                                    <button 
                                                        onClick={handleGenerateQuestions}
                                                        disabled={isGenerating || !topic}
                                                        className="h-10 px-6 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-3 hover:bg-slate-900 transition-all disabled:opacity-20 shadow-xl"
                                                    >
                                                        {isGenerating ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-indigo-400" />}
                                                        Generate with AI
                                                    </button>
                                                )}
                                                {canAccess("assessments:moderate") && (
                                                    <button 
                                                        onClick={handleAddQuestion}
                                                        className="h-10 px-6 bg-white border border-slate-100 text-slate-900 rounded-xl text-xs font-bold flex items-center gap-3 hover:bg-slate-50 transition-all shadow-sm"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        Add Manual
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            {generatedQuestions.map((q, idx) => (
                                                <motion.div 
                                                    layout
                                                    key={q.id} 
                                                    className="bg-white border border-slate-200/60 rounded-xl p-8 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 transition-all relative group"
                                                >
                                                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center font-bold text-sm shadow-xl border-2 border-white group-hover:bg-indigo-600 group-hover:text-white transition-all">{idx + 1}</div>
                                                    
                                                    {canAccess("assessments:moderate") && (
                                                        <button 
                                                            onClick={() => handleDeleteQuestion(q.id)}
                                                            className="absolute top-6 right-6 p-2 bg-rose-50 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    <div className="space-y-8 pt-4">
                                                        {q.type === 'APTITUDE' ? (
                                                            <>
                                                                <div className="space-y-2">
                                                                    <label className="text-xs font-bold text-slate-500 ml-1  group-focus-within:text-indigo-600 transition-colors">Question Text</label>
                                                                    <textarea 
                                                                        value={q.question} 
                                                                        onChange={(e) => handleUpdateQuestion(q.id, "question", e.target.value)}
                                                                        className="w-full h-28 bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all resize-none shadow-inner"
                                                                        readOnly={!canAccess("assessments:moderate")}
                                                                        placeholder="State the question clearly..."
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
                                                                                className={`w-full h-12 bg-slate-50 border-2 rounded-xl pl-12 pr-4 text-xs font-bold transition-all ${q.correct_answer === opt ? "border-indigo-600 bg-indigo-50/20 text-indigo-700" : "border-transparent text-slate-600 focus:bg-white"}`}
                                                                                readOnly={!canAccess("assessments:moderate")}
                                                                                placeholder={`Option ${oi + 1}`}
                                                                            />
                                                                            <button 
                                                                                onClick={() => handleUpdateQuestion(q.id, "correct_answer", opt)}
                                                                                disabled={!canAccess("assessments:moderate")}
                                                                                className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-xl flex items-center justify-center transition-all ${q.correct_answer === opt ? "bg-indigo-600 text-white" : "bg-white text-slate-300 hover:text-indigo-600 border border-slate-100"}`}
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
                                                                    <div className="space-y-2">
                                                                        <label className="text-xs font-bold text-slate-500 ml-1">Challenge Title</label>
                                                                        <input 
                                                                            type="text"
                                                                            value={q.title} 
                                                                            onChange={(e) => handleUpdateQuestion(q.id, "title", e.target.value)}
                                                                            className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"
                                                                            placeholder="e.g. Implement Reverse Linked List"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <label className="text-xs font-bold text-slate-500 ml-1">Problem Specification</label>
                                                                        <textarea 
                                                                            value={q.description || q.problem_statement} 
                                                                            onChange={(e) => handleUpdateQuestion(q.id, "description", e.target.value)}
                                                                            className="w-full h-64 bg-slate-50 border border-slate-100 rounded-xl px-8 py-6 text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner leading-relaxed"
                                                                            readOnly={!canAccess("assessments:moderate")}
                                                                            placeholder="Describe the challenge parameters, inputs, and expected outputs..."
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                            {generatedQuestions.length === 0 && (
                                                <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed border-slate-200">
                                                    <Search className="w-16 h-16 text-slate-100 mb-6" />
                                                    <h4 className="text-lg font-bold text-slate-900 leading-tight">No Questions Defined</h4>
                                                    <p className="text-sm text-slate-400 font-medium max-w-[260px] mt-2 leading-relaxed">Start adding questions manually or use AI to generate them based on your topic.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                             {/* Drawer Footer */}
                            {canAccess("assessments:moderate") && (
                                <div className="p-8 border-t border-slate-50 flex items-center justify-between gap-6 shrink-0">
                                    <p className="text-xs font-semibold text-slate-400 leading-relaxed max-w-[240px]">This assessment template will be available for all recruitment workflows and job postings.</p>
                                    <button 
                                        onClick={handleSave}
                                        form="matrix-form"
                                        type="submit"
                                        className="px-12 h-14 bg-slate-900 text-white rounded-xl font-bold text-sm tracking-wide hover:bg-indigo-600 transition-all active:scale-[0.98] shadow-2xl flex items-center gap-4"
                                    >
                                        <Save className="w-5 h-5" />
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
                message={`Are you sure you want to delete "${templateToDelete?.name}"? This will remove all associated assessment logic.`}
                confirmLabel="Delete Template"
                cancelLabel="Cancel"
                isDestructive={true}
            />
        </div>
    );
}
