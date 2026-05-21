"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, 
    Globe, 
    Zap, 
    CheckCircle2, 
    AlertCircle,
    Search,
    Send,
    ExternalLink
} from "lucide-react";
import { BACKEND_URL } from "@/utils/api";

interface PublishJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobId: string;
    jobTitle: string;
    token: string | null;
}

const PLATFORMS = [
    { 
        id: "Google Jobs", 
        name: "Google Jobs", 
        icon: Search, 
        color: "text-blue-500", 
        bg: "bg-blue-50",
        description: "Free indexing on Google Search Results globally."
    },
    { 
        id: "LinkedIn", 
        name: "LinkedIn", 
        icon: Zap, 
        color: "text-indigo-500", 
        bg: "bg-indigo-50",
        description: "Post to your company feed and network (Organic)."
    },
    { 
        id: "Naukri", 
        name: "Naukri.com", 
        icon: Globe, 
        color: "text-orange-600", 
        bg: "bg-orange-50",
        description: "India's #1 Job Portal (Requires Subscription).",
        disabled: true 
    }
];

export default function PublishJobModal({ isOpen, onClose, jobId, jobTitle, token }: PublishJobModalProps) {
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Google Jobs"]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    const handlePublish = async () => {
        if (!token || selectedPlatforms.length === 0) return;
        setIsSubmitting(true);
        setStatus("idle");

        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${jobId}/publish`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ platforms: selectedPlatforms })
            });

            if (res.ok) {
                setStatus("success");
                setTimeout(() => {
                    onClose();
                    setStatus("idle");
                }, 2000);
            } else {
                setStatus("error");
            }
        } catch (error) {
            console.error("Error publishing job:", error);
            setStatus("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const togglePlatform = (id: string) => {
        if (PLATFORMS.find(p => p.id === id)?.disabled) return;
        setSelectedPlatforms(prev => 
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl relative z-10 border border-slate-100"
                    >
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                                    <Globe className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 leading-none">Publish Job</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Distribute to external portals</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-6">
                            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                                <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Target Position</p>
                                <p className="text-sm font-black text-slate-900">{jobTitle}</p>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Select Platforms</p>
                                {PLATFORMS.map((platform) => (
                                    <button
                                        key={platform.id}
                                        disabled={platform.disabled}
                                        onClick={() => togglePlatform(platform.id)}
                                        className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                                            platform.disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : 
                                            selectedPlatforms.includes(platform.id) ? "border-indigo-600 bg-indigo-50/30" : "border-slate-100 hover:border-indigo-200"
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${platform.bg} ${platform.color} group-hover:scale-110`}>
                                                <platform.icon className="w-6 h-6" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-black text-slate-900">{platform.name}</p>
                                                <p className="text-[10px] font-bold text-slate-500">{platform.description}</p>
                                            </div>
                                        </div>
                                        {!platform.disabled && (
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                                selectedPlatforms.includes(platform.id) ? "bg-indigo-600 border-indigo-600" : "border-slate-200"
                                            }`}>
                                                {selectedPlatforms.includes(platform.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                                            </div>
                                        )}
                                        {platform.disabled && (
                                            <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-lg uppercase tracking-wider">Coming Soon</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-[10px] font-bold text-slate-400 max-w-[200px]">
                                Your job will be shared according to each platform's indexing schedule.
                            </p>
                            
                            <button
                                onClick={handlePublish}
                                disabled={isSubmitting || selectedPlatforms.length === 0 || status === "success"}
                                className={`px-8 py-3.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 active:scale-95 shadow-xl ${
                                    status === "success" ? "bg-emerald-500 text-white shadow-emerald-200" :
                                    status === "error" ? "bg-rose-500 text-white shadow-rose-200" :
                                    "bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50"
                                }`}
                            >
                                {isSubmitting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : status === "success" ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                ) : status === "error" ? (
                                    <AlertCircle className="w-4 h-4" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                {isSubmitting ? "Publishing..." : status === "success" ? "Published!" : status === "error" ? "Failed" : "Confirm & Publish"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
