"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

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

    // Reset + focus when opened (in a microtask so it's not a synchronous setState-in-effect).
    useEffect(() => {
        if (!open) return;
        const t = setTimeout(() => {
            setQuery("");
            setActive(0);
            inputRef.current?.focus();
        }, 0);
        return () => clearTimeout(t);
    }, [open]);

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

    return (
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
        >
            <div
                className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 px-4 border-b border-slate-100">
                    <span className="material-symbols-rounded text-slate-400">search</span>
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setActive(0);
                        }}
                        onKeyDown={onKeyNav}
                        placeholder="Jump to… (type a page name)"
                        className="flex-1 py-4 text-sm outline-none bg-transparent"
                    />
                    <kbd className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">esc</kbd>
                </div>
                <div className="max-h-80 overflow-y-auto p-2 custom-scrollbar">
                    {filtered.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-8">No matches.</p>
                    ) : (
                        filtered.map((item, i) => (
                            <button
                                key={item.path}
                                onMouseEnter={() => setActive(i)}
                                onClick={() => go(item.path)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                                    i === active ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                <span className="material-symbols-rounded text-lg text-slate-400">{item.icon}</span>
                                <span className="flex-1 text-sm font-semibold">{item.label}</span>
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">{item.group}</span>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
