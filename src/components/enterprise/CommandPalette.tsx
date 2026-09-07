"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/context/I18nContext";
import { Icon } from "@/components/ds";

export interface CommandItem {
    label: string;
    icon: string;
    path: string;
    group: string;
}

// A global quick-nav (⌘K / Ctrl+K) so users can jump to any page by typing,
// instead of hunting through the ~30-item sidebar.
export default function CommandPalette({
    open,
    onOpenChange,
    items,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    items: CommandItem[];
}) {
    const router = useRouter();
    const { t: tr } = useI18n();
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const activeRef = useRef<HTMLButtonElement>(null);

    // Global Cmd/Ctrl+K to toggle; Esc to close.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                onOpenChange(!open);
            } else if (e.key === "Escape" && open) {
                onOpenChange(false);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onOpenChange]);

    // Reset + focus when opened.
    useEffect(() => {
        if (!open) return;
        const t = setTimeout(() => {
            setQuery("");
            setActive(0);
            inputRef.current?.focus();
        }, 0);
        return () => clearTimeout(t);
    }, [open]);

    // Scroll active item into view on keyboard nav.
    useEffect(() => {
        activeRef.current?.scrollIntoView({ block: "nearest" });
    }, [active]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter((i) => `${i.label} ${i.group}`.toLowerCase().includes(q));
    }, [query, items]);

    if (!open) return null;

    const go = (path: string) => {
        onOpenChange(false);
        router.push(path);
    };

    const onKeyNav = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(filtered.length - 1, a + 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (filtered[active]) go(filtered[active].path);
        }
    };

    // Group items for rendering with section headers
    const grouped: { group: string; items: (CommandItem & { originalIndex: number })[] }[] = [];
    filtered.forEach((item, i) => {
        const last = grouped[grouped.length - 1];
        if (last && last.group === item.group) {
            last.items.push({ ...item, originalIndex: i });
        } else {
            grouped.push({ group: item.group, items: [{ ...item, originalIndex: i }] });
        }
    });

    return (
        <div
            role="button"
            tabIndex={0}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 bg-[#212121]/40 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpenChange(false);
                }
            }}
        >
            <div
                role="button"
                tabIndex={0}
                className="w-full max-w-[540px] bg-white rounded-[4px] shadow-[0_24px_60px_rgba(0,0,0,0.18)] border border-[#E0E0E0] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
            >
                {/* Search Input Row */}
                <div className="flex items-center gap-3 px-4 border-b border-[#F0F1F3]">
                    <svg className="w-4 h-4 text-[#9E9E9E] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                    </svg>
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setActive(0);
                        }}
                        onKeyDown={onKeyNav}
                        placeholder={tr("forms2.jumpToPlaceholder")}
                        className="flex-1 py-4 text-[13.5px] font-medium text-[#212121] placeholder-[#C0C5CE] outline-none bg-transparent"
                    />
                    <kbd className="text-[10px] font-bold text-[#9E9E9E] bg-[#F5F6F8] border border-[#E0E0E0] px-2 py-1 rounded-[3px] shrink-0">esc</kbd>
                </div>

                {/* Results List */}
                <div className="max-h-[380px] overflow-y-auto p-2 custom-scrollbar">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <i className="mdi mdi-magnify-close text-[32px] text-[#D1D5DB]" />
                            <p className="text-[13px] text-[#9E9E9E] font-medium">{tr("forms2.noMatches")}</p>
                        </div>
                    ) : (
                        grouped.map(({ group, items: gItems }) => (
                            <div key={group}>
                                {/* Group header */}
                                <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#C0C5CE]">{group}</span>
                                    <div className="flex-1 h-px bg-[#F0F1F3]" />
                                </div>

                                {/* Group items */}
                                {gItems.map((item) => {
                                    const isActive = item.originalIndex === active;
                                    return (
                                        <button
                                            key={item.path}
                                            ref={isActive ? activeRef : null}
                                            onMouseEnter={() => setActive(item.originalIndex)}
                                            onClick={() => go(item.path)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-left transition-all duration-100 ${
                                                isActive
                                                    ? "bg-[#1976D2]/8 border border-[#1976D2]/15"
                                                    : "border border-transparent hover:bg-[#FAFAFA]"
                                            }`}
                                        >
                                            <div className={`w-7 h-7 rounded-[4px] flex items-center justify-center shrink-0 transition-colors ${
                                                isActive ? "bg-[#E3F2FD]" : "bg-[#F5F6F8]"
                                            }`}>
                                                <Icon name={item.icon} className={`text-[16px] ${isActive ? "text-[#1976D2]" : "text-[#9E9E9E]"}`} />
                                            </div>
                                            <span className={`flex-1 text-[13px] font-semibold ${isActive ? "text-[#1976D2]" : "text-[#424242]"}`}>
                                                {item.label}
                                            </span>
                                            {isActive ? (
                                                <kbd className="text-[10px] font-bold text-[#1976D2]/60 bg-[#E3F2FD] border border-[#BBDEFB] px-1.5 py-0.5 rounded-[3px]">↵</kbd>
                                            ) : (
                                                <span className="text-[10px] font-semibold text-[#C0C5CE] uppercase tracking-wide">{item.group}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer hint */}
                <div className="flex items-center gap-4 px-4 py-2.5 border-t border-[#F0F1F3] bg-[#FAFAFA]">
                    <span className="flex items-center gap-1.5 text-[10.5px] text-[#9E9E9E] font-medium">
                        <kbd className="bg-white border border-[#E0E0E0] rounded-[4px] px-1.5 py-0.5 font-bold text-[9px] text-[#616161] shadow-sm">↑</kbd>
                        <kbd className="bg-white border border-[#E0E0E0] rounded-[4px] px-1.5 py-0.5 font-bold text-[9px] text-[#616161] shadow-sm">↓</kbd>
                        {tr("forms2.navigate")}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10.5px] text-[#9E9E9E] font-medium">
                        <kbd className="bg-white border border-[#E0E0E0] rounded-[4px] px-1.5 py-0.5 font-bold text-[9px] text-[#616161] shadow-sm">↵</kbd>
                        {tr("forms2.open")}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10.5px] text-[#9E9E9E] font-medium">
                        <kbd className="bg-white border border-[#E0E0E0] rounded-[4px] px-1.5 py-0.5 font-bold text-[9px] text-[#616161] shadow-sm">esc</kbd>
                        {tr("common.close")}
                    </span>
                </div>
            </div>
        </div>
    );
}
