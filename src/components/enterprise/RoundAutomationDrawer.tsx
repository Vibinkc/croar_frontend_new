"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Save, X } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

export type AutomationKind = "assessment" | "interview" | "email" | "onboarding";

/**
 * The right-hand configuration drawer used when setting up what a hiring round does.
 *
 * Deliberately mirrors the Automation module's own slide-over — same spring, same 10px icon chip,
 * same uppercase field labels, same full-width action button — because these configure the very
 * same automations. Two different-looking forms for one concept is how people end up believing
 * they are two different features.
 */

const TONES: Record<AutomationKind, { chip: string; icon: string }> = {
    assessment: { chip: "bg-[#ECEBFB] border-[#DAD7F6]/60 text-[#5B53E0]", icon: "quiz" },
    interview: { chip: "bg-[#E7ECFB] border-[#C9D5F5]/60 text-[#3559C7]", icon: "co_present" },
    email: { chip: "bg-[#E3F4EF] border-[#BFE3D8]/60 text-[#0E8A6E]", icon: "forward_to_inbox" },
    onboarding: { chip: "bg-[#FEF3E2] border-[#F3DDBA]/60 text-[#B45309]", icon: "person_add" },
};

/** Field label in the Automation module's style: small, uppercase, optional required marker. */
export function DrawerLabel({ htmlFor, children, required }: { htmlFor?: string; children: React.ReactNode; required?: boolean }) {
    return (
        <label htmlFor={htmlFor} className="block text-[11px] font-bold text-[#8A929E] uppercase tracking-wider mb-2 ml-1">
            {children} {required && <span className="text-rose-500">*</span>}
        </label>
    );
}

/** Select styled to match the Automation module's, chevron included. */
export function DrawerSelect({
    id,
    value,
    onChange,
    children,
    ariaLabel,
}: {
    id?: string;
    value: string;
    onChange: (v: string) => void;
    children: React.ReactNode;
    ariaLabel?: string;
}) {
    return (
        <div className="relative">
            <select
                id={id}
                aria-label={ariaLabel}
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-white border border-[#E1E4E8] rounded-[12px] h-11 px-4 pr-10 text-[13.5px] font-semibold text-[#374151] hover:border-[#DAD7F6] outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all shadow-sm"
            >
                {children}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
        </div>
    );
}

/** Text/number input matching the same drawer style. */
export function DrawerInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    const { className = "", ...rest } = props;
    return (
        <input
            {...rest}
            className={`w-full bg-white border border-[#E1E4E8] rounded-[12px] h-11 px-4 text-[13.5px] font-semibold text-[#374151] hover:border-[#DAD7F6] outline-none focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all shadow-sm ${className}`}
        />
    );
}

export function DrawerTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    const { className = "", ...rest } = props;
    return (
        <textarea
            {...rest}
            className={`w-full bg-white border border-[#E1E4E8] rounded-[12px] px-4 py-3 text-[13.5px] font-medium text-[#374151] hover:border-[#DAD7F6] outline-none focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all shadow-sm resize-none ${className}`}
        />
    );
}

/** Toggle row copied from the Automation module: icon chip, two lines of text, switch. */
export function DrawerToggle({
    icon,
    iconClass = "text-emerald-500",
    title,
    hint,
    checked,
    onChange,
}: {
    icon: string;
    iconClass?: string;
    title: string;
    hint: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between p-4 bg-[#F7F8FA]/50 border border-[#E8EAED] rounded-[12px] transition-all hover:border-[#DAD7F6]">
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center border border-[#E8EAED] shrink-0">
                    <span className={`material-symbols-rounded text-[18px] ${iconClass}`}>{icon}</span>
                </div>
                <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[#15171C] truncate">{title}</p>
                    <p className="text-[11px] text-[#9AA3AF] font-medium truncate">{hint}</p>
                </div>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={title}
                onClick={() => onChange(!checked)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer shrink-0 ${checked ? "bg-[#5B53E0]" : "bg-[#E1E4E8]"}`}
            >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`} />
            </button>
        </div>
    );
}

export default function RoundAutomationDrawer({
    isOpen,
    kind,
    roundName,
    roundIndex,
    onClose,
    onSave,
    saveLabel,
    canSave = true,
    children,
}: {
    isOpen: boolean;
    kind: AutomationKind;
    roundName: string;
    roundIndex: number;
    onClose: () => void;
    onSave: () => void;
    saveLabel?: string;
    canSave?: boolean;
    children: React.ReactNode;
}) {
    const { t: tr } = useI18n();
    const tone = TONES[kind];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex justify-end">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[#15171C]/40 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="relative h-full w-full max-w-md bg-white shadow-2xl flex flex-col border-l border-[#E8EAED]"
                    >
                        <div className="px-6 py-5 border-b border-[#E8EAED] flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center border shadow-sm shrink-0 ${tone.chip}`}>
                                    <span className="material-symbols-rounded text-[20px]">{tone.icon}</span>
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-[16px] font-extrabold text-[#15171C] leading-tight truncate">
                                        {tr(`roundDrawer.title.${kind}`)}
                                    </h2>
                                    <p className="text-[12.5px] text-[#8A929E] font-medium mt-0.5 truncate">
                                        {tr("roundDrawer.forRound", { index: roundIndex, name: roundName })}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                aria-label={tr("common.cancel")}
                                className="p-1.5 hover:bg-[#F4F5F7] text-[#9AA3AF] hover:text-[#4B5563] rounded-lg transition-all shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">{children}</div>

                        <div className="px-6 py-4 border-t border-[#E8EAED] shrink-0">
                            <button
                                onClick={onSave}
                                disabled={!canSave}
                                className="w-full flex items-center justify-center gap-2 h-12 bg-[#5B53E0] text-white rounded-[10px] text-[13.5px] font-semibold hover:bg-[#4A43C9] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-all active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
                            >
                                <Save className="w-[18px] h-[18px]" />
                                {saveLabel || tr("roundDrawer.save")}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
