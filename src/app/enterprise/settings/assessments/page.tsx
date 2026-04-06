"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";

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
            setIsLoading(false);
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
            } else {
                alert("Failed to generate questions.");
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
                    question_count: questionCount,
                    test_duration: duration,
                    email_template_id: selectedEmailTemplateId || null,
                    generated_questions: generatedQuestions
                })
            });

            if (res.ok) {
                fetchTemplates();
                setIsModalOpen(false);
            } else {
                alert("Failed to save template");
            }
        } catch (e) {
            console.error(e);
            alert("Error saving template");
        }
    };

    const handleDelete = async (id: string, templateName: string) => {
        if (!confirm(`Are you sure you want to delete template "${templateName}"?`)) return;

        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment-templates/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                setTemplates(prev => prev.filter(t => t.id !== id));
            } else {
                alert("Failed to delete template");
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="bg-[#FDFDFF] min-h-screen p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-[#1E1B4B] tracking-tight">ASSESSMENT TEMPLATES</h1>
                        <p className="text-sm text-slate-500 font-medium mt-1">Manage reusable AI assessments for candidates</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-[#7C3AED]/20 flex items-center gap-2 transition-all"
                    >
                        <span className="material-icons-outlined text-sm">add</span>
                        NEW TEMPLATE
                    </button>
                </div>

                {/* List */}
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : templates.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
                        <span className="material-icons-outlined text-6xl text-slate-200 mb-4">quiz</span>
                        <h3 className="text-lg font-bold text-slate-800">No Templates Found</h3>
                        <p className="text-slate-400 text-sm mt-1">Create your first assessment template to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map(template => (
                            <motion.div
                                key={template.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group bg-white p-6 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-[#7C3AED]/5 transition-all cursor-pointer flex flex-col h-full"
                                onClick={() => handleOpenModal(template)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center">
                                        <span className="material-icons-outlined">
                                            {template.type === 'CODING' ? 'code' : (template.type === 'BOTH' ? 'psychology' : 'quiz')}
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(template.id, template.name);
                                        }}
                                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                    >
                                        <span className="material-icons-outlined text-lg">delete</span>
                                    </button>
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg mb-1 truncate">{template.name}</h3>
                                <p className="text-[10px] font-black text-[#7C3AED] uppercase tracking-widest mb-4 bg-[#7C3AED]/5 inline-block px-2 py-1 rounded">
                                    {template.type} • {template.topic}
                                </p>
                                <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-slate-50">
                                    <div className="text-center bg-slate-50 p-2 rounded-lg">
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Questions</div>
                                        <div className="text-xs font-black text-slate-700">{template.generated_questions?.length || template.question_count}</div>
                                    </div>
                                    <div className="text-center bg-slate-50 p-2 rounded-lg">
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Time</div>
                                        <div className="text-xs font-black text-slate-700">{template.test_duration}m</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <div 
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-[#7C3AED]/10 flex items-center justify-center">
                                        <span className="material-symbols-rounded text-[#7C3AED] text-2xl">quiz</span>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-900">
                                            {editingTemplate ? "Edit Template" : "New Template"}
                                        </h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configure Assessment Standard</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsModalOpen(false)} 
                                    className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all"
                                >
                                    <span className="material-symbols-rounded text-xl">close</span>
                                </button>
                            </div>

                            <div className="flex border-b border-slate-100 bg-white px-6">
                                <button 
                                    onClick={() => setActiveTab('config')} 
                                    className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'config' ? 'border-[#7C3AED] text-[#7C3AED]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                >
                                    1. Configuration
                                </button>
                                <button 
                                    onClick={() => setActiveTab('questions')} 
                                    className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'questions' ? 'border-[#7C3AED] text-[#7C3AED]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                >
                                    2. Questions {generatedQuestions.length > 0 ? `(${generatedQuestions.length})` : ''}
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
                                {activeTab === 'config' ? (
                                    <div className="p-8 space-y-6 max-w-xl mx-auto">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Template Name <span className="text-red-400">*</span></label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
                                                placeholder="e.g. Senior Frontend Assessment"
                                            />
                                        </div>

                                        <div className="bg-[#7C3AED]/5 rounded-2xl p-5 space-y-4 border border-[#7C3AED]/10">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-[#7C3AED] uppercase tracking-widest mb-1.5 ml-1">Type <span className="text-red-400">*</span></label>
                                                    <select
                                                        value={type}
                                                onChange={e => setType(e.target.value as "APTITUDE" | "CODING" | "BOTH")}
                                                        className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#7C3AED]/20 shadow-sm"
                                                    >
                                                        <option value="APTITUDE">APTITUDE</option>
                                                        <option value="CODING">CODING</option>
                                                        <option value="BOTH">BOTH</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-[#7C3AED] uppercase tracking-widest mb-1.5 ml-1">Topic <span className="text-red-400">*</span></label>
                                                    <input
                                                        type="text"
                                                        value={topic}
                                                        onChange={e => setTopic(e.target.value)}
                                                        className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#7C3AED]/20 shadow-sm"
                                                        placeholder="e.g. React, SQL, Python"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-[#7C3AED] uppercase tracking-widest mb-1.5 ml-1">No. of Questions</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={100}
                                                        value={questionCount}
                                                        onChange={e => setQuestionCount(parseInt(e.target.value))}
                                                        className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#7C3AED]/20 shadow-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-[#7C3AED] uppercase tracking-widest mb-1.5 ml-1">Duration (min)</label>
                                                    <input
                                                        type="number"
                                                        min={5}
                                                        max={300}
                                                        value={duration}
                                                        onChange={e => setDuration(parseInt(e.target.value))}
                                                        className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#7C3AED]/20 shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Template <span className="text-red-400">*</span></label>
                                            <select
                                                value={selectedEmailTemplateId}
                                                onChange={e => setSelectedEmailTemplateId(e.target.value)}
                                                className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 appearance-none cursor-pointer ${!selectedEmailTemplateId ? 'border-amber-200' : 'border-none'}`}
                                            >
                                                <option value="">Select Email Template...</option>
                                                {emailTemplates.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                ))}
                                            </select>
                                            <p className="text-[10px] text-slate-400 mt-1.5 ml-1 italic">This format will be used when sending the assessment link via automation.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 space-y-8 max-w-3xl mx-auto">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Question Bank</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Review and modify questions</p>
                                            </div>
                                            <button 
                                                onClick={handleAddQuestion}
                                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white transition-all shadow-sm"
                                            >
                                                <span className="material-symbols-rounded text-sm">add</span>
                                                Add Question
                                            </button>
                                        </div>

                                        {generatedQuestions.length > 0 ? (
                                            <div className="space-y-6">
                                                {generatedQuestions.map((q, idx: number) => (
                                                    <div key={q.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all relative group">
                                                        <div className="absolute -top-3 -left-3 w-8 h-8 bg-[#7C3AED] text-white rounded-xl flex items-center justify-center font-black italic shadow-lg">#{idx + 1}</div>
                                                        
                                                        <button 
                                                            onClick={() => handleDeleteQuestion(q.id)}
                                                            className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-red-500 hover:text-white"
                                                        >
                                                            <span className="material-symbols-rounded text-base">delete</span>
                                                        </button>

                                                        <div className="space-y-4">
                                                            {q.type === 'APTITUDE' ? (
                                                                <>
                                                                    <div>
                                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Question Text</label>
                                                                        <textarea 
                                                                            value={q.question} 
                                                                            onChange={(e) => handleUpdateQuestion(q.id, "question", e.target.value)}
                                                                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-[#7C3AED]/10 transition-all h-20 resize-none"
                                                                        />
                                                                    </div>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                        {(q.options || []).map((opt: string, oi: number) => (
                                                                            <div key={oi} className="relative">
                                                                                <input 
                                                                                    value={opt} 
                                                                                    onChange={(e) => {
                                                                                        const newOpts = [...q.options];
                                                                                        newOpts[oi] = e.target.value;
                                                                                        handleUpdateQuestion(q.id, "options", newOpts);
                                                                                    }}
                                                                                    className={`w-full bg-slate-50 border-2 rounded-2xl pl-12 pr-4 py-3 text-xs font-bold transition-all ${q.correct_answer === opt ? "border-[#7C3AED] bg-[#7C3AED]/5 text-[#7C3AED]" : "border-transparent text-slate-600"}`}
                                                                                />
                                                                                <button 
                                                                                    onClick={() => handleUpdateQuestion(q.id, "correct_answer", opt)}
                                                                                    className={`absolute left-3 top-3 w-6 h-6 rounded-lg flex items-center justify-center transition-all ${q.correct_answer === opt ? "bg-[#7C3AED] text-white" : "bg-slate-200 text-slate-400 hover:bg-slate-300"}`}
                                                                                >
                                                                                    <span className="material-symbols-rounded text-sm">{q.correct_answer === opt ? "check" : "circle"}</span>
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div>
                                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Problem Title</label>
                                                                        <input 
                                                                            type="text"
                                                                            value={q.title} 
                                                                            onChange={(e) => handleUpdateQuestion(q.id, "title", e.target.value)}
                                                                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-black text-slate-800 focus:ring-4 focus:ring-[#7C3AED]/10 transition-all"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Problem Description</label>
                                                                        <textarea 
                                                                            value={q.description || q.problem_statement} 
                                                                            onChange={(e) => handleUpdateQuestion(q.id, "description", e.target.value)}
                                                                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-[#7C3AED]/10 transition-all h-32 resize-none"
                                                                        />
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-60 mt-12">
                                                <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center mb-6 shadow-sm">
                                                    <span className="material-symbols-rounded text-slate-300 text-4xl">visibility_off</span>
                                                </div>
                                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">No Questions Found</h3>
                                                <p className="max-w-[240px] text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed mt-2">
                                                    Click &quot;Generate AI Questions&quot; below to populate with AI questions, or add a manual question.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="px-6 py-6 border-t border-slate-100 bg-white shrink-0 flex items-center justify-end gap-3">
                                {activeTab === 'config' && (
                                    <button
                                        onClick={handleGenerateQuestions}
                                        disabled={isGenerating || !name || !topic}
                                        className="flex-[2] flex items-center justify-center gap-2 px-6 py-3 bg-[#7C3AED] text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-[#6d28d9] shadow-lg shadow-[#7C3AED]/20 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {isGenerating ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-rounded text-base">auto_awesome</span>}
                                        Generate AI Questions
                                    </button>
                                )}
                                <button
                                    onClick={handleSave}
                                    disabled={!name || !topic}
                                    className={`px-6 py-3 text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-[#7C3AED]/20 active:scale-95 transition-all flex items-center gap-2 ${activeTab === 'questions' ? 'flex-[2] bg-[#7C3AED] hover:bg-[#6d28d9]' : 'flex-1 bg-slate-300 hover:bg-[#7C3AED]'}`}
                                >
                                    <span className="material-symbols-rounded text-base">save</span>
                                    Save Template
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
