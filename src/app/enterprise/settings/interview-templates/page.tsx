"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Plus, 
    Trash2, 
    Settings2, 
    Mic2, 
    Video, 
    Clock, 
    Search, 
    RefreshCcw, 
    ChevronRight,
    MessagesSquare,
    Calendar,
    ArrowRight
} from "lucide-react";
import TemplateBuilder from "@/app/enterprise/automation/interview/TemplateBuilder";
import ConfirmationModal from "@/components/common/ConfirmationModal";

interface InterviewTemplate {
    id: string;
    title: string;
    topic: string;
    duration: number;
    difficulty: string;
    require_video: boolean;
    type: string;
    created_at: string;
    plan?: any;
}

function InterviewTemplatesContent() {
    const { token, canAccess } = useAuth();
    const [templates, setTemplates] = useState<InterviewTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showBuilder, setShowBuilder] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<InterviewTemplate | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<{ id: string; name: string } | null>(null);

    const fetchTemplates = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/interview-templates/`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                },
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
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchTemplates();
        }
    }, [token, fetchTemplates]);

    const handleDelete = async () => {
        if (!templateToDelete) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/interview-templates/${templateToDelete.id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
            });
            if (res.ok) {
                setTemplates((prev) => prev.filter((t) => t.id !== templateToDelete.id));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsDeleteModalOpen(false);
            setTemplateToDelete(null);
        }
    };

    if (isLoading && templates.length === 0) {
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
                        <span className="material-symbols-rounded">psychology</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 tracking-tight">Interview Templates</h1>
                        <p className="text-slate-500 text-[10px] font-medium   ">Design AI behavioral screening</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {canAccess("interviews:moderate") && (
                        <button 
                            onClick={() => {
                                setEditingTemplate(null);
                                setShowBuilder(true);
                            }}
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
                        <MessagesSquare className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">No Templates Found</h3>
                    <p className="text-sm text-slate-400 font-medium mt-2 max-w-[280px] mx-auto leading-relaxed">Create your first interview template to automate candidate screening.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {templates.map(template => (
                        <motion.div
                            layout
                            key={template.id}
                            className="group bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden cursor-pointer"
                            onClick={() => {
                                if (canAccess("interviews:moderate")) {
                                    setEditingTemplate(template);
                                    setShowBuilder(true);
                                }
                            }}
                        >
                            <div className="p-6 pb-2 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                        {template.require_video ? <Video className="w-6 h-6 stroke-[1.5]" /> : <Mic2 className="w-6 h-6 stroke-[1.5]" />}
                                    </div>
                                    {canAccess("interviews:delete") && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTemplateToDelete({ id: template.id, name: template.title });
                                                setIsDeleteModalOpen(true);
                                            }}
                                            className="p-2 bg-rose-50 text-rose-300 hover:bg-rose-500 hover:text-white transition-all rounded-xl opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full  ">{template.topic}</span>
                                        <span className="text-[10px] font-bold text-slate-400  ">{template.difficulty}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{template.title}</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200/50">
                                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/50 group-hover:bg-white group-hover:border-slate-200 transition-all">
                                      <p className="text-[9px] font-bold text-slate-400   mb-1">Duration</p>
                                      <p className="text-xs font-bold text-slate-700">{template.duration} mins</p>
                                   </div>
                                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/50 group-hover:bg-white group-hover:border-slate-200 transition-all">
                                      <p className="text-[9px] font-bold text-slate-400   mb-1">Interface</p>
                                      <p className="text-xs font-bold text-slate-700 truncate">{template.require_video ? "Video" : "Audio Only"}</p>
                                   </div>
                                </div>
                            </div>
                            
                            <div className="px-6 py-4 flex items-center justify-between bg-slate-50/50 border-t border-slate-200/50 rounded-b-3xl mt-auto">
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold  ">{new Date(template.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="text-slate-300 group-hover:text-indigo-600 transition-colors">
                                    {canAccess("interviews:moderate") ? (
                                        <Edit3 className="hidden" /> 
                                    ) : null}
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-bold  ">Edit</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {showBuilder && (
                    <TemplateBuilder
                        token={token || ""}
                        backendUrl={BACKEND_URL}
                        initialData={editingTemplate}
                        onClose={() => {
                            setShowBuilder(false);
                            setEditingTemplate(null);
                        }}
                        onSave={() => {
                            fetchTemplates();
                            setShowBuilder(false);
                            setEditingTemplate(null);
                        }}
                    />
                )}
            </AnimatePresence>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Template?"
                message={`Are you sure you want to delete "${templateToDelete?.name}"? This will remove all associated interview logic.`}
                confirmLabel="Delete Template"
                cancelLabel="Cancel"
                isDestructive={true}
            />
        </div>
    );
}

const Edit3 = ({ className }: { className: string }) => <Settings2 className={className} />;

export default function InterviewTemplatesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center animate-pulse shadow-xl">
                        <MessagesSquare className="w-8 h-8 text-indigo-400 animate-spin" />
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-bold   text-slate-900">Loading Interview Templates</p>
                    </div>
                </div>
            </div>
        }>
            <InterviewTemplatesContent />
        </Suspense>
    );
}
