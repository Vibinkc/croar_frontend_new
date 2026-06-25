import React from "react";
import { cn } from "./cn";

export interface PageHeaderProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    /** Optional Material Symbols glyph shown in an indigo chip beside the title. */
    icon?: string;
    /** Right-aligned actions (buttons). Stacks below the title on mobile. */
    actions?: React.ReactNode;
    className?: string;
}

/** Standard page header — responsive: stacks on mobile, row from `sm` up. */
export function PageHeader({ title, subtitle, icon, actions, className }: PageHeaderProps) {
    return (
        <header className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
            <div className="flex items-center gap-3 min-w-0">
                {icon && (
                    <span className="hidden sm:flex w-10 h-10 rounded-[11px] bg-[#ECEBFB] text-[#5B53E0] items-center justify-center shrink-0">
                        <span className="material-symbols-rounded text-[22px]">{icon}</span>
                    </span>
                )}
                <div className="min-w-0">
                    <h1 className="text-[22px] md:text-[26px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight truncate">{title}</h1>
                    {subtitle && <p className="text-[13.5px] md:text-[14px] text-[#8A929E] mt-0.5">{subtitle}</p>}
                </div>
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
        </header>
    );
}
