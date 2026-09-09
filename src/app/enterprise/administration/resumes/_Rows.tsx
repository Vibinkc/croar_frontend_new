"use client";

/**
 * The settings rows the three Resumes screens are built from: a labelled row with a toggle, a
 * text value, or a set of choices. Manatal's settings screens are made of exactly these three,
 * which is why they read as one product rather than three pages by three people.
 */

import { useEffect, useState } from "react";
import { Icon, cn } from "@/components/ds";

export function Panel({ title, description, children }: {
    title: string; description?: string; children: React.ReactNode;
}) {
    return (
        <section className="bg-white border border-[#E0E0E0] rounded-[4px] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E0E0E0]">
                <h2 className="text-[15px] font-medium text-[#212121]">{title}</h2>
                {description && <p className="text-[12.5px] text-[#757575] mt-0.5 leading-relaxed">{description}</p>}
            </div>
            <div className="divide-y divide-[#EEEEEE]">{children}</div>
        </section>
    );
}

export function ToggleRow({ label, hint, checked, disabled, onChange }: {
    label: string; hint?: string; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void;
}) {
    return (
        <div className={cn("flex items-center gap-4 px-5 py-3.5", disabled && "opacity-50")}>
            <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] text-[#212121]">{label}</span>
                {hint && <span className="block text-[12px] text-[#757575] mt-0.5 leading-relaxed">{hint}</span>}
            </span>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={label}
                disabled={disabled}
                onClick={() => onChange(!checked)}
                className={cn(
                    "w-10 h-6 rounded-full relative transition-colors shrink-0 disabled:pointer-events-none",
                    checked ? "bg-[#1976D2]" : "bg-[#BDBDBD]"
                )}
            >
                <span className={cn(
                    "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all",
                    checked ? "left-[18px]" : "left-0.5"
                )} />
            </button>
        </div>
    );
}

/** An inline-editable text row. Commits on blur or Enter, reverts on Escape. */
export function TextRow({ label, hint, value, placeholder, disabled, onSave }: {
    label: string; hint?: string; value: string | null; placeholder?: string;
    disabled?: boolean; onSave: (v: string | null) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value || "");

    useEffect(() => { setDraft(value || ""); }, [value]);

    const commit = () => {
        setEditing(false);
        const next = draft.trim() || null;
        if (next !== (value || null)) onSave(next);
    };

    return (
        <div className={cn("flex items-center gap-4 px-5 py-3.5", disabled && "opacity-50")}>
            <span className="min-w-0 w-[220px] shrink-0">
                <span className="block text-[13.5px] text-[#212121]">{label}</span>
                {hint && <span className="block text-[12px] text-[#757575] mt-0.5">{hint}</span>}
            </span>
            {editing ? (
                <input
                    autoFocus
                    className="flex-1 h-9 px-3 rounded-[4px] border border-[#1976D2] bg-white text-[13px] text-[#212121] outline-none"
                    value={draft}
                    placeholder={placeholder}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commit}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") commit();
                        if (e.key === "Escape") { setDraft(value || ""); setEditing(false); }
                    }}
                />
            ) : (
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setEditing(true)}
                    className="flex-1 flex items-center gap-2 text-left h-9 px-3 rounded-[4px] hover:bg-[#FAFAFA] transition-colors disabled:pointer-events-none"
                >
                    <span className={cn("flex-1 text-[13px] truncate", value ? "text-[#212121]" : "text-[#9E9E9E]")}>
                        {value || placeholder || "—"}
                    </span>
                    <Icon name="pencil" className="text-[16px] text-[#BDBDBD]" />
                </button>
            )}
        </div>
    );
}

export function ChoiceRow({ label, hint, value, choices, onChange }: {
    label: string; hint?: string; value: string;
    choices: { value: string; label: string; description?: string }[];
    onChange: (v: string) => void;
}) {
    return (
        <div className="px-5 py-3.5">
            <span className="block text-[13.5px] text-[#212121]">{label}</span>
            {hint && <span className="block text-[12px] text-[#757575] mt-0.5 leading-relaxed">{hint}</span>}
            <div className="mt-3 flex flex-col gap-2">
                {choices.map((c) => (
                    <label
                        key={c.value}
                        className={cn(
                            "flex items-start gap-2.5 px-3 py-2.5 rounded-[4px] border cursor-pointer transition-colors",
                            value === c.value ? "border-[#1976D2] bg-[#E3F2FD]" : "border-[#E0E0E0] hover:border-[#1976D2]"
                        )}
                    >
                        <input
                            type="radio"
                            className="mt-0.5 accent-[#1976D2]"
                            checked={value === c.value}
                            onChange={() => onChange(c.value)}
                        />
                        <span className="min-w-0">
                            <span className="block text-[13.5px] text-[#212121]">{c.label}</span>
                            {c.description && (
                                <span className="block text-[12px] text-[#757575] mt-0.5 leading-relaxed">{c.description}</span>
                            )}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
}

export function SaveNote({ saving, saved, error, savingLabel, savedLabel }: {
    saving: boolean; saved: boolean; error: string; savingLabel: string; savedLabel: string;
}) {
    if (error) {
        return (
            <p className="text-[12.5px] text-[#C62828] bg-[#FFEBEE] border border-[#FFCDD2] rounded-[4px] px-3 py-2">
                {error}
            </p>
        );
    }
    if (saving) return <p className="text-[12.5px] text-[#757575]">{savingLabel}</p>;
    if (saved) {
        return (
            <p className="text-[12.5px] text-[#2E7D32] flex items-center gap-1">
                <Icon name="check-circle" className="text-[15px]" />
                {savedLabel}
            </p>
        );
    }
    return null;
}
