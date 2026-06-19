"use client";

import React from "react";
import { motion } from "framer-motion";

interface SendTemplateModalTemplate {
    id: string;
}

interface SendTemplateModalProps<T extends SendTemplateModalTemplate> {
    onClose: () => void;
    headerIcon: string;
    headerLabel: string;
    infoText: React.ReactNode;
    selectLabel: string;
    listId: string;
    isLoading: boolean;
    templates: T[];
    selectedTemplateId: string;
    onSelectTemplate: (id: string) => void;
    renderTemplateBody: (template: T) => React.ReactNode;
    isSending: boolean;
    onSend: () => void;
    sendingLabel: string;
    sendIcon: string;
    sendLabel: string;
}

export default function SendTemplateModal<T extends SendTemplateModalTemplate>({
    onClose,
    headerIcon,
    headerLabel,
    infoText,
    selectLabel,
    listId,
    isLoading,
    templates,
    selectedTemplateId,
    onSelectTemplate,
    renderTemplateBody,
    isSending,
    onSend,
    sendingLabel,
    sendIcon,
    sendLabel,
}: SendTemplateModalProps<T>) {
    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClose();
                }
            }}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <span className="material-icons text-indigo-600">{headerIcon}</span>
                        {headerLabel}
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-200/50 flex items-center justify-center text-slate-400">
                        <span className="material-icons-outlined">close</span>
                    </button>
                </div>

                <div className="p-6">
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-6">
                        <p className="text-xs font-bold text-indigo-900 leading-relaxed">
                            {infoText}
                        </p>
                    </div>

                    <label htmlFor={listId} className="block text-[10px] font-black   text-slate-500 mb-2">{selectLabel}</label>
                    {isLoading ? (
                        <div className="py-4 flex justify-center">
                            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="py-4 text-center">
                            <p className="text-sm text-slate-400 font-medium">No templates found. Go to settings to create one.</p>
                        </div>
                    ) : (
                        <div id={listId} className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {templates.map(template => (
                                <div
                                    key={template.id}
                                    onClick={() => onSelectTemplate(template.id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            onSelectTemplate(template.id);
                                        }
                                    }}
                                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                        selectedTemplateId === template.id
                                            ? "border-indigo-600 bg-indigo-50/50"
                                            : "border-slate-100 hover:border-slate-200"
                                    }`}
                                >
                                    {renderTemplateBody(template)}
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
                        onClick={onSend}
                        disabled={isSending || !selectedTemplateId}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black   rounded-lg shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSending ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                {sendingLabel}
                            </>
                        ) : (
                            <>
                                <span className="material-icons text-[14px]">{sendIcon}</span>
                                {sendLabel}
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
