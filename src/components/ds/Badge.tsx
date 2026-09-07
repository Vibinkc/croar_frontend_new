import React from "react";
import { cn } from "./cn";

type Tone = "indigo" | "neutral" | "success" | "info" | "warning" | "danger" | "teal";

const tones: Record<Tone, string> = {
    indigo: "bg-[#E3F2FD] text-[#1976D2]",
    neutral: "bg-[#EEEEEE] text-[#4F4F4F]",
    success: "bg-[#E8F5E9] text-[#2E7D32]",
    teal: "bg-[#E8F5E9] text-[#2E7D32]",
    info: "bg-[#E3F2FD] text-[#1565C0]",
    warning: "bg-[#FFF3E0] text-[#EF6C00]",
    danger: "bg-[#FFEBEE] text-[#C62828]",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    tone?: Tone;
    /** Show a leading status dot in the tone colour. */
    dot?: boolean;
}

/** Status chip. Manatal sets these as small uppercase rounded rects, not pills. */
export function Badge({ className = "", tone = "neutral", dot = false, children, ...props }: BadgeProps) {
    return (
        <span
            className={cn("inline-flex items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-[11.5px] font-medium uppercase tracking-[0.3px]", tones[tone], className)}
            {...props}
        >
            {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
            {children}
        </span>
    );
}
