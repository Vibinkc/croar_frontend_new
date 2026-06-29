import React from "react";
import { cn } from "./cn";

export interface EmptyStateProps {
    /** Material Symbols glyph. */
    icon: string;
    title: string;
    /** A short "what this is / what to do" line. */
    description?: React.ReactNode;
    /** Primary action — usually a `<Button>` (optionally wrapped in a `<Link>`). */
    action?: React.ReactNode;
    /** Optional secondary action / link (e.g. "See how it works"). */
    secondary?: React.ReactNode;
    /** "brand" = indigo gradient chip (first-run / create-your-first). "muted" = grey (no matches). */
    tone?: "brand" | "muted";
    className?: string;
}

/**
 * Instructive empty state — the design system's way of teaching a page in context.
 * Use the "brand" tone for a genuinely empty page (tell the user what it's for and
 * give one clear primary action); use "muted" for "no results match your filters".
 */
export function EmptyState({ icon, title, description, action, secondary, tone = "brand", className }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center text-center px-6 py-14 sm:py-16", className)}>
            <div className="relative mb-5">
                {tone === "brand" && <div className="absolute -inset-3 rounded-full bg-[#5B53E0]/10 blur-xl" />}
                <div
                    className={cn(
                        "relative w-14 h-14 rounded-[16px] flex items-center justify-center",
                        tone === "brand" ? "text-white" : "bg-[#F1F2F5] text-[#9AA3AF]"
                    )}
                    style={
                        tone === "brand"
                            ? { background: "linear-gradient(135deg,#8B7DFF,#5B53E0)", boxShadow: "0 8px 24px rgba(91,83,224,0.3)" }
                            : undefined
                    }
                >
                    <span className="material-symbols-rounded text-[28px]">{icon}</span>
                </div>
            </div>
            <h3 className="text-[17px] font-extrabold tracking-[-0.3px] text-[#15171C] mb-1.5">{title}</h3>
            {description && <p className="text-[13.5px] leading-relaxed text-[#8A929E] max-w-sm mx-auto">{description}</p>}
            {(action || secondary) && (
                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
                    {action}
                    {secondary}
                </div>
            )}
        </div>
    );
}
