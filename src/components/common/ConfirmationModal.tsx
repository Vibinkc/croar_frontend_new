"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Are you sure?",
    message = "This action cannot be undone.",
    confirmLabel = "Yes",
    cancelLabel = "No",
    isDestructive = false,
}: ConfirmationModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl border border-slate-100"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${
                                isDestructive ? "bg-rose-50 text-rose-500" : "bg-indigo-50 text-[#7C3AED]"
                            }`}>
                                <span className="material-symbols-rounded text-3xl">
                                    {isDestructive ? "delete_forever" : "help_outline"}
                                </span>
                            </div>
                            
                            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{title}</h3>
                            <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">
                                {message}
                            </p>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    {cancelLabel}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className={`flex-1 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 ${
                                        isDestructive 
                                        ? "bg-rose-500 hover:bg-rose-600 shadow-rose-100" 
                                        : "bg-[#7C3AED] hover:bg-[#6D28D9] shadow-indigo-100"
                                    }`}
                                >
                                    {confirmLabel}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
