import React from "react";
import { useI18n } from "@/context/I18nContext";
import { cn } from "./cn";
import { PageHelp } from "./PageHelp";

export interface PageHeaderProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    /** Optional Material Symbols glyph shown in an indigo chip beside the title. */
    icon?: string;
    /** When set, renders an icon-only back button to the LEFT of the title. */
    onBack?: () => void;
    /** When set, renders a "?" popover beside the title explaining the page. */
    help?: React.ReactNode;
    /** Right-aligned actions (buttons). Stacks below the title on mobile. */
    actions?: React.ReactNode;
    className?: string;
}

/**
 * Standard page header — matches the canonical Jobs header: a sticky bar with a
 * hairline bottom border, 22px extrabold title + muted subtitle, actions on the
 * right. Responsive: stacks on mobile, row from `sm` up.
 */
export function PageHeader({ title, subtitle, icon, onBack, help, actions, className }: PageHeaderProps) {
    const { t } = useI18n();
    return (
        <header className={cn("sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
            <div className="flex items-center gap-3 min-w-0">
                {onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        aria-label={t("common.back")}
                        className="w-9 h-9 rounded-[4px] bg-white border border-[#E0E0E0] text-[#757575] hover:text-[#1976D2] hover:border-[#E0E0E0] transition-all flex items-center justify-center shrink-0 shadow-sm"
                    >
                        <span className="material-symbols-rounded text-[20px]">arrow_back</span>
                    </button>
                )}
                {icon && (
                    <span className="hidden sm:flex w-10 h-10 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] items-center justify-center shrink-0">
                        <span className="material-symbols-rounded text-[22px]">{icon}</span>
                    </span>
                )}
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight truncate">{title}</h1>
                        {help && <PageHelp>{help}</PageHelp>}
                    </div>
                    {subtitle && <p className="text-[12.5px] text-[#757575] mt-0.5">{subtitle}</p>}
                </div>
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
        </header>
    );
}
