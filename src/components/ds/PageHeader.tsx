import React from "react";
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
    return (
        <header className={cn("sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
            <div className="flex items-center gap-3 min-w-0">
                {onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        aria-label="Back"
                        className="w-9 h-9 rounded-[10px] bg-white border border-[#E1E4E8] text-[#8A929E] hover:text-[#5B53E0] hover:border-[#D4D7DC] transition-all flex items-center justify-center shrink-0 shadow-sm"
                    >
                        <span className="material-symbols-rounded text-[20px]">arrow_back</span>
                    </button>
                )}
                {icon && (
                    <span className="hidden sm:flex w-10 h-10 rounded-[11px] bg-[#ECEBFB] text-[#5B53E0] items-center justify-center shrink-0">
                        <span className="material-symbols-rounded text-[22px]">{icon}</span>
                    </span>
                )}
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight truncate">{title}</h1>
                        {help && <PageHelp>{help}</PageHelp>}
                    </div>
                    {subtitle && <p className="text-[12.5px] text-[#8A929E] mt-0.5">{subtitle}</p>}
                </div>
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
        </header>
    );
}
