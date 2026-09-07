import React from "react";
import { cn } from "./cn";
import { jetbrainsMono } from "./fonts";

export interface StatCardProps {
    label: React.ReactNode;
    value: React.ReactNode;
    /** Material Symbols glyph name. */
    icon: string;
    /** CSS gradient for the icon chip + top accent (e.g. "linear-gradient(135deg,#42A5F5,#1976D2)"). */
    gradient?: string;
    /** Glow colour for the icon chip shadow. */
    glow?: string;
    /** Dark glass variant for use on dark hero surfaces. */
    dark?: boolean;
    className?: string;
}

const DEFAULT_GRADIENT = "linear-gradient(135deg,#42A5F5,#1976D2)";

/** Metric card with a gradient icon chip and a JetBrains Mono figure. */
export function StatCard({ label, value, icon, gradient = DEFAULT_GRADIENT, glow = "rgba(25,118,210,0.28)", dark = false, className }: StatCardProps) {
    if (dark) {
        return (
            <div className={cn("rounded-[4px] bg-white/[0.06] border border-white/10 p-4 backdrop-blur-sm hover:bg-white/[0.09] transition-colors", className)}>
                <span className="w-9 h-9 rounded-[4px] flex items-center justify-center text-white mb-3" style={{ background: gradient, boxShadow: `0 6px 14px ${glow}` }}>
                    <span className="material-symbols-rounded text-[19px]">{icon}</span>
                </span>
                <div className={cn("text-[26px] font-semibold tracking-[-1px] text-white leading-none", jetbrainsMono.className)}>{value}</div>
                <span className="block text-[10.5px] font-semibold uppercase tracking-[0.04em] text-white/45 mt-1.5">{label}</span>
            </div>
        );
    }
    return (
        <div className={cn("relative bg-white border border-[#E0E0E0] rounded-[4px] p-5 overflow-hidden transition-colors hover:border-[#E0E0E0]", className)}>
            <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: gradient }} />
            <div className="flex items-start justify-between">
                <div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{label}</span>
                    <div className={cn("text-[30px] font-semibold tracking-[-1px] text-[#212121] mt-2", jetbrainsMono.className)}>{value}</div>
                </div>
                <span className="w-10 h-10 rounded-[4px] flex items-center justify-center text-white shrink-0" style={{ background: gradient, boxShadow: `0 6px 14px ${glow}` }}>
                    <span className="material-symbols-rounded text-[20px]">{icon}</span>
                </span>
            </div>
        </div>
    );
}

/** Responsive grid wrapper for stat cards (2-up on mobile, 4-up on large). */
export function StatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4", className)}>{children}</div>;
}
