"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, X } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import JobPostingPanel from "@/components/enterprise/JobPostingPanel";

interface PublishJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobId: string;
    jobTitle: string;
    token: string | null;
}

/**
 * Quick publish from a jobs-list row.
 *
 * Posting is page-shaped work, so the whole flow lives in JobPostingPanel and the job's own
 * Sourcing tab renders it as a page. This is only the dialog chrome for the list, where opening
 * a job just to post it would be a detour — the publishing rules are not duplicated here.
 */
export default function PublishJobModal({ isOpen, onClose, jobId, jobTitle, token }: PublishJobModalProps) {
    const { t: tr } = useI18n();

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[#0E1014]/50 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ scale: 0.96, opacity: 0, y: 12 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.96, opacity: 0, y: 12 }}
                        className="bg-white w-full max-w-[460px] max-h-[88vh] overflow-y-auto rounded-[16px] shadow-[0_22px_60px_rgba(15,23,42,0.24)] relative z-10 border border-[#E8EAED]"
                    >
                        <div className="px-5 py-4 border-b border-[#E8EAED] flex items-center justify-between sticky top-0 bg-white z-10">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-[10px] bg-[#5B53E0] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(91,83,224,0.28)]">
                                    <Globe className="w-4.5 h-4.5" />
                                </div>
                                <div>
                                    <h3 className="text-[15px] font-bold text-[#15171C] leading-tight">{tr("forms2.publishJob")}</h3>
                                    <p className="text-[12px] text-[#8A929E] mt-0.5">{tr("forms2.distributePortals")}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                aria-label={tr("common.cancel")}
                                className="w-7 h-7 rounded-[8px] hover:bg-[#F4F5F7] text-[#8A929E] hover:text-[#374151] flex items-center justify-center transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5">
                            <JobPostingPanel jobId={jobId} jobTitle={jobTitle} token={token} />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
