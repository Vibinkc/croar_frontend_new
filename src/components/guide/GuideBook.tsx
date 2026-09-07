"use client";

/* eslint-disable react-hooks/set-state-in-effect --
   The only effect setState here is the SSR-safe portal mount guard (render null on
   the server, then mount into document.body) — the intended external-system sync. */
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useGuide } from "./GuideProvider";
import { GUIDE_TOPICS, type GuideTopic } from "./guideContent";
import { useI18n } from "@/context/I18nContext";
import { Icon } from "@/components/ds";

/** Flatten a topic to a single searchable string. */
function topicText(t: GuideTopic): string {
    const parts: string[] = [t.title, t.summary];
    for (const b of t.blocks) {
        if (b.heading) parts.push(b.heading);
        if (b.paragraphs) parts.push(...b.paragraphs);
        if (b.steps) parts.push(...b.steps);
        if (b.links) for (const l of b.links) parts.push(l.label, l.desc);
        if (b.example) parts.push(b.example.scenario, ...b.example.steps);
    }
    return parts.join(" ").toLowerCase();
}

/**
 * The detailed, browsable product guide. A full-screen overlay (portal) with a
 * topic list (one per module + workflows) and deep links into the real app.
 * Opened from the Help launcher; self-contained so it bypasses route guards.
 */
export function GuideBook() {
    const { guideOpen, setGuideOpen } = useGuide();
    const { t: tr } = useI18n();
    const [mounted, setMounted] = useState(false);
    const [activeId, setActiveId] = useState(GUIDE_TOPICS[0].id);
    const [query, setQuery] = useState("");

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (!guideOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setGuideOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [guideOpen, setGuideOpen]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return GUIDE_TOPICS;
        return GUIDE_TOPICS.filter((t) => topicText(t).includes(q));
    }, [query]);

    if (!mounted || !guideOpen) return null;

    const active = (filtered.find((t) => t.id === activeId) ?? filtered[0] ?? GUIDE_TOPICS[0]) as GuideTopic;
    const close = () => setGuideOpen(false);

    return createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-5">
            <div className="absolute inset-0 bg-[#1E2A38]/55 backdrop-blur-sm" onClick={close} aria-hidden />

            <div className="relative w-full max-w-[960px] h-[min(86vh,720px)] bg-white rounded-[4px] border border-[#E0E0E0] shadow-[0_30px_80px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-5 py-4 bg-[#1E2A38] text-white relative shrink-0">
                    <div className="absolute inset-0 opacity-70" style={{ background: "radial-gradient(120% 140% at 100% 0%, rgba(25,118,210,0.5), transparent 55%)" }} />
                    <div className="relative flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-9 h-9 rounded-[4px] bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                                <i className="mdi mdi-book-open-page-variant text-[20px] text-[#42A5F5]" />
                            </span>
                            <div className="min-w-0">
                                <h2 className="text-[16px] font-bold leading-tight">{tr("sharedUi.croarGuide")}</h2>
                                <p className="text-[12px] text-white/55">{tr("sharedUi.everythingExplained")}</p>
                            </div>
                        </div>
                        <button onClick={close} aria-label={tr("sharedUi.closeGuide")} className="w-8 h-8 rounded-[4px] hover:bg-white/10 text-white/70 hover:text-white transition-colors flex items-center justify-center shrink-0">
                            <i className="mdi mdi-close text-[20px]" />
                        </button>
                    </div>
                    {/* Search */}
                    <div className="relative mt-3">
                        <i className="mdi mdi-magnify absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-[18px]" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={tr("sharedUi.searchGuide")}
                            className="w-full h-9 pl-9 pr-3 rounded-[4px] bg-white/[0.08] border border-white/15 text-[13px] text-white placeholder:text-white/40 outline-none focus:border-[#42A5F5] focus:bg-white/[0.12] transition-colors"
                        />
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col md:flex-row min-h-0">
                    {/* Topic nav */}
                    <nav className="flex md:flex-col gap-1 p-2.5 md:w-[208px] shrink-0 border-b md:border-b-0 md:border-r border-[#E0E0E0] overflow-x-auto md:overflow-y-auto bg-[#FAFAFB]">
                        {filtered.length === 0 && (
                            <p className="text-[12px] text-[#757575] px-2 py-1.5">{tr("sharedUi.noMatches")}</p>
                        )}
                        {filtered.map((t) => {
                            const on = t.id === active.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setActiveId(t.id)}
                                    className={`flex items-center gap-2.5 px-3 h-9 rounded-[4px] text-[13px] font-semibold whitespace-nowrap transition-colors shrink-0 ${on ? "bg-[#E3F2FD] text-[#1976D2]" : "text-[#616161] hover:bg-[#EEEEEE] hover:text-[#424242]"}`}
                                >
                                    <Icon name={t.icon} className={`text-[19px] ${on ? "text-[#1976D2]" : "text-[#9E9E9E]"}`} />
                                    {t.title}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
                        <div className="max-w-[620px]">
                            <h3 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#212121]">{active.title}</h3>
                            <p className="text-[13.5px] text-[#757575] mt-0.5 mb-5">{active.summary}</p>

                            <div className="space-y-6">
                                {active.blocks.map((b, i) => (
                                    <section key={i}>
                                        {b.heading && (
                                            <h4 className="text-[13px] font-bold uppercase tracking-[0.05em] text-[#757575] mb-2.5">{b.heading}</h4>
                                        )}

                                        {b.paragraphs?.map((p, j) => (
                                            <p key={j} className="text-[13.5px] leading-relaxed text-[#424242] mb-2">{p}</p>
                                        ))}

                                        {b.steps && (
                                            <ol className="space-y-2">
                                                {b.steps.map((s, j) => (
                                                    <li key={j} className="flex gap-3 text-[13.5px] leading-relaxed text-[#424242]">
                                                        <span className="w-5 h-5 rounded-full bg-[#E3F2FD] text-[#1976D2] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{j + 1}</span>
                                                        <span>{s}</span>
                                                    </li>
                                                ))}
                                            </ol>
                                        )}

                                        {b.links && (
                                            <div className="grid sm:grid-cols-2 gap-2">
                                                {b.links.map((l) => (
                                                    <Link
                                                        key={l.href + l.label}
                                                        href={l.href}
                                                        onClick={close}
                                                        className="group flex items-start gap-2.5 p-3 rounded-[4px] border border-[#E0E0E0] hover:border-[#1976D2]/40 hover:bg-[#FAFCFE] transition-all"
                                                    >
                                                        <i className="mdi mdi-arrow-right-circle text-[18px] text-[#1976D2] mt-0.5 shrink-0" />
                                                        <span className="min-w-0">
                                                            <span className="block text-[13px] font-bold text-[#212121] group-hover:text-[#1976D2] transition-colors">{l.label}</span>
                                                            <span className="block text-[12px] text-[#757575] leading-snug mt-0.5">{l.desc}</span>
                                                        </span>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}

                                        {b.example && (
                                            <div className="mt-2.5 rounded-[4px] border border-[#BBDEFB] bg-[#FAFCFE] overflow-hidden">
                                                <div className="flex items-center gap-1.5 px-4 pt-3">
                                                    <i className="mdi mdi-lightbulb text-[16px] text-[#1976D2]" />
                                                    <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#1976D2]">{tr("sharedUi.example")}</span>
                                                </div>
                                                <p className="px-4 pt-1.5 text-[13px] font-semibold text-[#212121]">{b.example.scenario}</p>
                                                <ol className="px-4 pb-4 pt-2.5 space-y-2">
                                                    {b.example.steps.map((s, j) => (
                                                        <li key={j} className="flex gap-3 text-[13px] leading-relaxed text-[#424242]">
                                                            <span className="w-5 h-5 rounded-full bg-white border border-[#BBDEFB] text-[#1976D2] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{j + 1}</span>
                                                            <span>{s}</span>
                                                        </li>
                                                    ))}
                                                </ol>
                                            </div>
                                        )}
                                    </section>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
