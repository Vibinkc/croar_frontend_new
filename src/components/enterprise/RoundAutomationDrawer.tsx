"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Save, X } from "@/components/icons";
import { useI18n } from "@/context/I18nContext";
import { Icon } from "@/components/ds";

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
    assessment: { chip: "bg-[#E3F2FD] border-[#BBDEFB]/60 text-[#1976D2]", icon: "quiz" },
    interview: { chip: "bg-[#E3F2FD] border-[#C9D5F5]/60 text-[#1565C0]", icon: "co_present" },
    email: { chip: "bg-[#E8F5E9] border-[#BFE3D8]/60 text-[#2E7D32]", icon: "forward_to_inbox" },
    onboarding: { chip: "bg-[#FFF3E0] border-[#FFE0B2]/60 text-[#E65100]", icon: "person_add" },
};

/** Field label in the Automation module's style: small, uppercase, optional required marker. */
export function DrawerLabel({ htmlFor, children, required }: { htmlFor?: string; children: React.ReactNode; required?: boolean }) {
    return (
        <label htmlFor={htmlFor} className="block text-[11px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-1">
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
                className="w-full bg-white border border-[#E0E0E0] rounded-[4px] h-11 px-4 pr-10 text-[13.5px] font-semibold text-[#424242] hover:border-[#BBDEFB] outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2] transition-all shadow-sm"
            >
                {children}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
        </div>
    );
}

/** Text/number input matching the same drawer style. */
export function DrawerInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    const { className = "", ...rest } = props;
    return (
        <input
            {...rest}
            className={`w-full bg-white border border-[#E0E0E0] rounded-[4px] h-11 px-4 text-[13.5px] font-semibold text-[#424242] hover:border-[#BBDEFB] outline-none focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2] transition-all shadow-sm ${className}`}
        />
    );
}

export function DrawerTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    const { className = "", ...rest } = props;
    return (
        <textarea
            {...rest}
            className={`w-full bg-white border border-[#E0E0E0] rounded-[4px] px-4 py-3 text-[13.5px] font-medium text-[#424242] hover:border-[#BBDEFB] outline-none focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2] transition-all shadow-sm resize-none ${className}`}
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
        <div className="flex items-center justify-between p-4 bg-[#FAFAFA]/50 border border-[#E0E0E0] rounded-[4px] transition-all hover:border-[#BBDEFB]">
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center border border-[#E0E0E0] shrink-0">
                    <Icon name={icon} className={`text-[18px] ${iconClass}`} />
                </div>
                <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[#212121] truncate">{title}</p>
                    <p className="text-[11px] text-[#9E9E9E] font-medium truncate">{hint}</p>
                </div>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={title}
                onClick={() => onChange(!checked)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer shrink-0 ${checked ? "bg-[#1976D2]" : "bg-[#E0E0E0]"}`}
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
                        className="absolute inset-0 bg-[#212121]/40 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="relative h-full w-full max-w-md bg-white shadow-2xl flex flex-col border-l border-[#E0E0E0]"
                    >
                        <div className="px-6 py-5 border-b border-[#E0E0E0] flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-10 h-10 rounded-[4px] flex items-center justify-center border shadow-sm shrink-0 ${tone.chip}`}>
                                    <Icon name={tone.icon} className="text-[20px]" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-[16px] font-extrabold text-[#212121] leading-tight truncate">
                                        {tr(`roundDrawer.title.${kind}`)}
                                    </h2>
                                    <p className="text-[12.5px] text-[#757575] font-medium mt-0.5 truncate">
                                        {tr("roundDrawer.forRound", { index: roundIndex, name: roundName })}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                aria-label={tr("common.cancel")}
                                className="p-1.5 hover:bg-[#F5F6F8] text-[#9E9E9E] hover:text-[#4F4F4F] rounded-lg transition-all shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">{children}</div>

                        <div className="px-6 py-4 border-t border-[#E0E0E0] shrink-0">
                            <button
                                onClick={onSave}
                                disabled={!canSave}
                                className="w-full flex items-center justify-center gap-2 h-12 bg-[#1976D2] text-white rounded-[4px] text-[13.5px] font-semibold hover:bg-[#1565C0] shadow-[0_6px_16px_rgba(25,118,210,0.28)] transition-all active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
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
