"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BACKEND_URL } from "@/utils/api";

interface AssessmentTemplate {
    id: string;
    name: string;
    type: string;
    topic: string;
    question_count: number;
    email_template_id?: string;
    email_template_name?: string;
}

interface SendAssessmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    applicationIds: string[];
    token: string;
}

export default function SendAssessmentModal({ isOpen, onClose, applicationIds, token }: SendAssessmentModalProps) {
    const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (isOpen && token) {
            fetchTemplates();
        }
    }, [isOpen, token]);

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment-templates/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
                if (data.length > 0) {
                    setSelectedTemplateId(data[0].id);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        if (!selectedTemplateId) return;
        setIsSending(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment-templates/bulk-send`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    application_ids: applicationIds,
                    template_id: selectedTemplateId
                })
            });

            if (res.ok) {
                alert("Assessment sent successfully!");
                onClose();
            } else {
                alert("Failed to send assessment.");
            }
        } catch (e) {
            console.error(e);
            alert("Error sending assessment.");
        } finally {
            setIsSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <span className="material-icons text-indigo-600">psychology</span>
                        SEND ASSESSMENT
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-200/50 flex items-center justify-center text-slate-400">
                        <span className="material-icons-outlined">close</span>
                    </button>
                </div>

                <div className="p-6">
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-6">
                        <p className="text-xs font-bold text-indigo-900 leading-relaxed">
                            Sending assessment to <span className="text-indigo-600">{applicationIds.length} candidate(s)</span>. 
                            They will receive an email with the test link.
                        </p>
                    </div>

                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Select Assessment Template</label>
                    {isLoading ? (
                        <div className="py-4 flex justify-center">
                            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="py-4 text-center">
                            <p className="text-sm text-slate-400 font-medium">No templates found. Go to settings to create one.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {templates.map(template => (
                                <div
                                    key={template.id}
                                    onClick={() => setSelectedTemplateId(template.id)}
                                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                        selectedTemplateId === template.id
                                            ? "border-indigo-600 bg-indigo-50/50"
                                            : "border-slate-100 hover:border-slate-200"
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">{template.name}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                {template.type} • {template.topic}
                                            </p>
                                        </div>
                                        {selectedTemplateId === template.id && (
                                            <span className="material-icons text-indigo-600 text-sm">check_circle</span>
                                        )}
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-white border border-slate-100 px-2 py-0.5 rounded">
                                            <span className="material-icons text-[12px]">list</span>
                                            {template.question_count} Qs
                                        </div>
                                        {template.email_template_name && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-[#7C3AED] bg-[#7C3AED]/5 border border-[#7C3AED]/10 px-2 py-0.5 rounded">
                                                <span className="material-icons text-[12px]">email</span>
                                                {template.email_template_name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        CANCEL
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={isSending || !selectedTemplateId}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSending ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                SENDING...
                            </>
                        ) : (
                            <>
                                <span className="material-icons text-[14px]">send</span>
                                SEND NOW
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
