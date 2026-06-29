"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "./cn";

export interface PageHelpProps {
    /** Heading shown at the top of the popover. */
    title?: string;
    /** Popover body — a short "what is this page / what can I do here" explainer. */
    children: React.ReactNode;
    className?: string;
}

/**
 * A small "?" button that reveals a popover explaining the current page. Drop it
 * next to a page title (the ds `PageHeader` does this automatically via its `help`
 * prop). Closes on click-away or Esc.
 */
export function PageHelp({ title = "About this page", children, className }: PageHelpProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return (
        <div ref={ref} className={cn("relative inline-flex", className)}>
            <button
                type="button"
                data-tour="page-help"
                onClick={() => setOpen((o) => !o)}
                aria-label={title}
                aria-expanded={open}
                className={cn(
                    "inline-flex items-center justify-center shrink-0 -my-1 transition-colors",
                    open ? "text-[#5B53E0]" : "text-[#B5BCC6] hover:text-[#5B53E0]"
                )}
            >
                <span
                    className="material-symbols-rounded text-[19px] leading-none"
                    style={{ fontVariationSettings: `'FILL' ${open ? 1 : 0}, 'wght' 500, 'opsz' 20` }}
                >
                    info
                </span>
            </button>

            {open && (
                <div className="absolute left-0 top-7 z-50 w-[280px] bg-white rounded-[12px] border border-[#E8EAED] shadow-[0_16px_40px_rgba(15,23,42,0.18)] p-4 animate-in fade-in zoom-in-95 duration-150">
                    <h4 className="text-[13px] font-bold text-[#15171C] mb-1">{title}</h4>
                    <div className="text-[12.5px] leading-relaxed text-[#374151] [&_a]:text-[#5B53E0] [&_a]:font-semibold [&_strong]:text-[#15171C] space-y-1.5">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
}
