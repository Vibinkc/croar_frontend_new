import React from "react";
import { cn } from "./cn";

/**
 * Responsive page wrapper — consistent padding + max width + vertical rhythm.
 * Mobile-first: tighter padding on phones, roomier from `md` up.
 */
export function PageShell({ children, className, width = "default" }: { children: React.ReactNode; className?: string; width?: "default" | "wide" | "narrow" }) {
    const max = width === "wide" ? "max-w-[1480px]" : width === "narrow" ? "max-w-[880px]" : "max-w-[1320px]";
    return <div className={cn("p-4 sm:p-5 md:p-7 space-y-5 md:space-y-6 w-full mx-auto", max, className)}>{children}</div>;
}

/** Dark hero band (canvas + indigo radial glow) used at the top of key pages. */
export function HeroBand({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <section
            className={cn("relative overflow-hidden rounded-[4px] p-6 sm:p-7 md:p-9 text-white", className)}
            style={{
                background: "#1E2A38",
                backgroundImage:
                    "radial-gradient(1000px 460px at 90% -45%,rgba(25,118,210,0.55),transparent 60%),radial-gradient(760px 420px at -5% 135%,rgba(66,165,245,0.28),transparent 60%)",
            }}
        >
            <div className="pointer-events-none absolute -right-20 -top-24 w-80 h-80 rounded-full border border-white/[0.06]" />
            <div className="pointer-events-none absolute -right-2 -top-10 w-48 h-48 rounded-full border border-white/[0.05]" />
            <div className="relative z-10">{children}</div>
        </section>
    );
}
