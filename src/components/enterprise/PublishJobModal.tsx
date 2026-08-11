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
    Send
} from "lucide-react";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";

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
        descKey: "forms2.platformGoogleDesc"
    },
    { 
        id: "LinkedIn", 
        name: "LinkedIn", 
        icon: Zap, 
        color: "text-indigo-500", 
        bg: "bg-indigo-50",
        descKey: "forms2.platformLinkedinDesc"
    },
    { 
        id: "Naukri", 
        name: "Naukri.com", 
        icon: Globe, 
        color: "text-orange-600", 
        bg: "bg-orange-50",
        descKey: "forms2.platformNaukriDesc",
        disabled: true
    }
];

export default function PublishJobModal({ isOpen, onClose, jobId, jobTitle, token }: PublishJobModalProps) {
    const { t: tr } = useI18n();
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#15171C]/50 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.96, opacity: 0, y: 12 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.96, opacity: 0, y: 12 }}
                        className="bg-white w-full max-w-[420px] max-h-[88vh] overflow-y-auto rounded-[16px] shadow-[0_22px_60px_rgba(15,23,42,0.24)] relative z-10 border border-[#E8EAED]"
                    >
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-[#E8EAED] flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-[10px] bg-[#5B53E0] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(91,83,224,0.28)]">
                                    <Globe className="w-4.5 h-4.5" />
                                </div>
                                <div>
                                    <h3 className="text-[15px] font-bold text-[#15171C] leading-tight">{tr("forms2.publishJob")}</h3>
                                    <p className="text-[12px] text-[#8A929E] mt-0.5">{tr("forms2.distributePortals")}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-7 h-7 rounded-[8px] hover:bg-[#F4F5F7] text-[#8A929E] hover:text-[#374151] flex items-center justify-center transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-4">
                            <div className="p-3 bg-[#ECEBFB]/50 border border-[#DAD7F6]/60 rounded-[12px]">
                                <p className="text-[10.5px] font-bold text-[#5B53E0] uppercase tracking-wider mb-0.5">{tr("forms2.targetPosition")}</p>
                                <p className="text-[14px] font-bold text-[#15171C]">{jobTitle}</p>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10.5px] font-bold text-[#8A929E] uppercase tracking-wider ml-0.5">{tr("forms2.selectPlatforms")}</p>
                                {PLATFORMS.map((platform) => (
                                    <button
                                        key={platform.id}
                                        disabled={platform.disabled}
                                        onClick={() => togglePlatform(platform.id)}
                                        className={`w-full p-3 rounded-[12px] border transition-all flex items-center justify-between gap-3 group ${
                                            platform.disabled ? "opacity-50 cursor-not-allowed bg-[#F7F8FA]" :
                                            selectedPlatforms.includes(platform.id) ? "border-[#5B53E0] bg-[#ECEBFB]/30" : "border-[#E8EAED] hover:border-[#5B53E0]/40"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${platform.bg} ${platform.color}`}>
                                                <platform.icon className="w-4.5 h-4.5" />
                                            </div>
                                            <div className="text-left min-w-0">
                                                <p className="text-[13px] font-bold text-[#15171C]">{platform.name}</p>
                                                <p className="text-[11.5px] text-[#8A929E] leading-snug">{tr(platform.descKey)}</p>
                                            </div>
                                        </div>
                                        {!platform.disabled && (
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                                selectedPlatforms.includes(platform.id) ? "bg-[#5B53E0] border-[#5B53E0]" : "border-[#CBD0D8]"
                                            }`}>
                                                {selectedPlatforms.includes(platform.id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                        )}
                                        {platform.disabled && (
                                            <span className="text-[9px] font-bold text-[#8A929E] bg-[#F1F2F5] px-2 py-1 rounded-[6px] uppercase tracking-wider shrink-0">{tr("forms2.comingSoon")}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-4 bg-[#F7F8FA] border-t border-[#E8EAED] flex items-center justify-between gap-3">
                            <p className="text-[11px] text-[#8A929E] max-w-[190px] leading-snug">
                                {tr("forms2.indexingSchedule")}
                            </p>

                            <button
                                onClick={handlePublish}
                                disabled={isSubmitting || selectedPlatforms.length === 0 || status === "success"}
                                className={`h-10 px-5 rounded-[10px] font-semibold text-[13px] transition-colors flex items-center gap-2 shrink-0 ${
                                    status === "success" ? "bg-[#15803D] text-white" :
                                    status === "error" ? "bg-[#EF4444] text-white" :
                                    "bg-[#5B53E0] text-white shadow-[0_6px_16px_rgba(91,83,224,0.28)] hover:bg-[#4A43C9] disabled:opacity-50"
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
                                {isSubmitting ? tr("forms2.publishing") : status === "success" ? tr("forms2.published") : status === "error" ? tr("forms2.failed") : tr("forms2.confirmPublish")}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
