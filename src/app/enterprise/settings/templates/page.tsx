"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";

interface Template {
    id: string;
    name: string;
    subject: string;
    body: string;
    variables: string[];
    created_at?: string;
}

export default function EmailTemplatesPage() {
    const { token } = useAuth();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

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
            setIsLoading(false);
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
                // Handle text/json mix
                if (data.content) {
                    let cleanedContent = data.content;
                    // Strip markdown code blocks if present (e.g. ```json ... ```)
                    if (cleanedContent.includes("```")) {
                        cleanedContent = cleanedContent.replace(/```json/g, "").replace(/```/g, "");
                    }

                    try {
                        parsed = JSON.parse(cleanedContent);
                    } catch (e) {
                        console.warn("AI returned malformed JSON, using raw.", e);
                        parsed = { body: cleanedContent };
                    }
                } else {
                    parsed = data;
                }

                if (parsed) {
                    // Check if AI returned a stringified JSON inside 'content' key
                    if (typeof parsed === 'string') {
                        try {
                            parsed = JSON.parse(parsed);
                        } catch (e) {
                            parsed = { body: parsed };
                        }
                    } else if (parsed.content && typeof parsed.content === 'string') {
                        try {
                            parsed = JSON.parse(parsed.content);
                        } catch (e) {
                            // It's already parsed
                        }
                    }

                    // Remove markdown from body if it snuck in
                    let bodyContent = parsed.body || "";
                    if (bodyContent.startsWith("```html")) {
                        bodyContent = bodyContent.replace("```html", "").replace("```", "");
                    }

                    setName(parsed.name || `Template: ${aiPurpose.substring(0, 20)}...`);
                    setSubject(parsed.subject || "");
                    setBody(bodyContent);
                    setIsAiMode(false); // Switch back to edit mode
                }
            } else {
                alert("Failed to generate template. Please try again.");
            }
        } catch (e) {
            console.error(e);
            alert("Error generating template.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete template "${name}"?`)) return;

        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/communication/templates/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (res.ok) {
                setTemplates(prev => prev.filter(t => t.id !== id));
            } else {
                alert("Failed to delete template");
            }
        } catch (e) {
            console.error(e);
            alert("Error deleting template");
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
            } else {
                alert("Failed to save template");
            }
        } catch (e) {
            console.error(e);
            alert("Error saving template");
        }
    };

    return (
        <div className="bg-[#FDFDFF] min-h-screen p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-[#1E1B4B] tracking-tight">EMAIL TEMPLATES</h1>
                        <p className="text-sm text-slate-500 font-medium mt-1">Manage standard responses and campaign templates</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all"
                    >
                        <span className="material-icons text-sm">add</span>
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
                        <span className="material-icons-outlined text-6xl text-slate-200 mb-4">mark_email_unread</span>
                        <h3 className="text-lg font-bold text-slate-800">No Templates Found</h3>
                        <p className="text-slate-400 text-sm mt-1">Create your first email template to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map(template => (
                            <motion.div
                                key={template.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group bg-white p-6 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer flex flex-col h-full"
                                onClick={() => handleOpenModal(template)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-[#7C3AED] flex items-center justify-center">
                                        <span className="material-icons-outlined">article</span>
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
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 truncate">Subject: {template.subject}</p>
                                <div className="text-sm text-slate-500 line-clamp-3 mb-4 h-20 bg-slate-50/50 p-3 rounded-lg border border-slate-50 overflow-hidden">
                                    {/* Strip HTML tags for preview roughly if needed, or just show raw */}
                                    {template.body.replace(/<[^>]*>?/gm, '')}
                                </div>
                                <div className="mt-auto flex justify-between items-center pt-4 border-t border-slate-50">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Last Edited
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500">
                                        Just now
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setIsModalOpen(false)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                                <h2 className="text-xl font-black text-slate-800 tracking-tight">
                                    {isAiMode ? "AI TEMPLATE GENERATOR" : (editingTemplate ? "EDIT TEMPLATE" : "NEW TEMPLATE")}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-200/50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                                    <span className="material-icons-outlined">close</span>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8">
                                {/* AI Toggle/Banner */}
                                {!isAiMode && (
                                    <div className="mb-8 bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                                                <span className="material-icons text-sm">auto_awesome</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-indigo-900 text-sm">Need help writing?</h4>
                                                <p className="text-xs text-indigo-700">Let AI generate a professional template for you.</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsAiMode(true)}
                                            className="px-4 py-2 bg-white text-indigo-600 text-xs font-bold rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors shadow-sm"
                                        >
                                            TRY AI GENERATOR
                                        </button>
                                    </div>
                                )}

                                {isAiMode ? (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">What is this email for?</label>
                                            <textarea
                                                value={aiPurpose}
                                                onChange={e => setAiPurpose(e.target.value)}
                                                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
                                                placeholder="e.g. Politely reject a candidate after the technical interview, encouraging them to apply for future roles."
                                            />
                                        </div>

                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Template Name</label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all placeholder:font-normal"
                                                placeholder="e.g. Interview Invitation"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Email Subject</label>
                                            <input
                                                type="text"
                                                value={subject}
                                                onChange={e => setSubject(e.target.value)}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all placeholder:font-normal"
                                                placeholder="e.g. Invitation to Interview at TechCorp"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-end mb-2">
                                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                                                    Email Body
                                                </label>
                                                <div className="flex gap-2">
                                                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">{"{{candidate_name}}"}</span>
                                                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">{"{{job_title}}"}</span>
                                                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">{"{{company_name}}"}</span>
                                                </div>
                                            </div>
                                            <textarea
                                                value={body}
                                                onChange={e => setBody(e.target.value)}
                                                className="w-full h-64 p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-slate-600 outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all resize-none leading-relaxed"
                                                placeholder="Dear {{candidate_name}}, ..."
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                                {isAiMode ? (
                                    <>
                                        <button
                                            onClick={() => setIsAiMode(false)}
                                            className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                                        >
                                            CANCEL
                                        </button>
                                        <button
                                            onClick={handleAiGenerate}
                                            disabled={isGenerating || !aiPurpose.trim()}
                                            className="px-8 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 hover:shadow-indigo-500/50 disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    GENERATING...
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-icons text-sm">auto_awesome</span>
                                                    GENERATE TEMPLATE
                                                </>
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setIsModalOpen(false)}
                                            className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                                        >
                                            CANCEL
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className="px-8 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2"
                                        >
                                            <span className="material-icons text-sm">save</span>
                                            SAVE TEMPLATE
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
