import React from "react";
import { cn } from "./cn";

type Tone = "indigo" | "neutral" | "success" | "info" | "warning" | "danger" | "teal";

const tones: Record<Tone, string> = {
    indigo: "bg-[#ECEBFB] text-[#5B53E0]",
    neutral: "bg-[#F1F2F5] text-[#4B5563]",
    success: "bg-[#E6F4EA] text-[#15803D]",
    teal: "bg-[#E3F4EF] text-[#0E8A6E]",
    info: "bg-[#E7ECFB] text-[#3559C7]",
    warning: "bg-[#FEF3E2] text-[#D97706]",
    danger: "bg-[#FDECEC] text-[#C0383C]",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    tone?: Tone;
    /** Show a leading status dot in the tone colour. */
    dot?: boolean;
}

/** Pill badge for statuses (fully rounded per the design system). */
export function Badge({ className = "", tone = "neutral", dot = false, children, ...props }: BadgeProps) {
    return (
        <span
            className={cn("inline-flex items-center gap-1.5 rounded-[20px] px-2.5 py-0.5 text-[12px] font-semibold", tones[tone], className)}
            {...props}
        >
            {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
            {children}
        </span>
    );
}
