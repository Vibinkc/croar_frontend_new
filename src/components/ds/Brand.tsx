import React from "react";
import { cn } from "./cn";
import { BRAND_GRADIENT } from "./tokens";

/** Croar lightning brand mark in the indigo gradient chip. */
export function CroarMark({ size = 36, className, glow = true }: { size?: number; className?: string; glow?: boolean }) {
    const inner = Math.round(size * 0.58);
    return (
        <div
            className={cn("flex items-center justify-center rounded-[10px] shrink-0", className)}
            style={{ width: size, height: size, background: BRAND_GRADIENT, boxShadow: glow ? "0 6px 18px rgba(91,83,224,0.45)" : undefined }}
        >
            <svg width={inner} height={inner} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L4.5 13H11l-1 9 8.5-11H12l1-9z" />
            </svg>
        </div>
    );
}

/** Full lockup: mark + "Croar / HR Cloud" wordmark. `dark` for dark surfaces. */
export function CroarLogo({ size = 34, showWordmark = true, dark = false, className }: { size?: number; showWordmark?: boolean; dark?: boolean; className?: string }) {
    return (
        <span className={cn("flex items-center gap-2.5", className)}>
            <CroarMark size={size} />
            {showWordmark && (
                <span className="flex flex-col leading-none">
                    <span className={cn("text-[18px] font-extrabold tracking-[-0.3px]", dark ? "text-white" : "text-[#15171C]")}>Croar</span>
                    <span className={cn("text-[10px] mt-0.5", dark ? "text-[#565E6B]" : "text-[#8A929E]")}>HR Cloud</span>
                </span>
            )}
        </span>
    );
}
