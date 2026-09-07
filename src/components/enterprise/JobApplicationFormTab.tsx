"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { BACKEND_URL } from "@/utils/api";
import { Button, Card, Input, Select, cn, Icon } from "@/components/ds";

export interface ApplicationField {
    id: string;
    label: string;
    type: "text" | "number" | "boolean" | "file" | "email";
    icon: string;
    is_required: boolean;
}

const FIELD_TYPES: ApplicationField["type"][] = ["text", "email", "number", "boolean", "file"];

const ICON_FOR: Record<ApplicationField["type"], string> = {
    text: "short_text",
    email: "alternate_email",
    number: "tag",
    boolean: "check_box",
    file: "attach_file",
};

/**
 * The application form a candidate actually fills in, edited on the job.
 *
 * The form was previously only reachable inside the create wizard, so once a job existed its
 * questions were effectively frozen — you had to re-enter the wizard to change what the form
 * asked. Since the form is what gets emailed out and what the public job page renders, it needs
 * to be editable from the job itself.
 *
 * Saves through PATCH /jobs/{id}, which already accepts application_fields.
 */
export default function JobApplicationFormTab({
    jobId,
    fields,
    onSaved,
}: {
    jobId: string;
    fields: ApplicationField[];
    /** Refresh the job after a save so the rest of the page sees the new form. */
    onSaved: () => void;
}) {
    const { token } = useAuth();
    const { t: tr } = useI18n();
    const [draft, setDraft] = useState<ApplicationField[]>(fields);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [savedAt, setSavedAt] = useState<number | null>(null);

    // Re-seed when the job reloads, but never while the user has unsaved edits in front of them.
    useEffect(() => {
        setDraft(fields);
    }, [fields]);

    const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(fields), [draft, fields]);

    const update = (id: string, patch: Partial<ApplicationField>) =>
        setDraft(prev =>
            prev.map(f => {
                if (f.id !== id) return f;
                const next = { ...f, ...patch };
                // Keep the icon in step with the type so the public form renders sensibly.
                if (patch.type) next.icon = ICON_FOR[patch.type];
                return next;
            })
        );

    const remove = (id: string) => setDraft(prev => prev.filter(f => f.id !== id));

    const move = (index: number, dir: -1 | 1) =>
        setDraft(prev => {
            const next = [...prev];
            const target = index + dir;
            if (target < 0 || target >= next.length) return prev;
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });

    const addField = () =>
        setDraft(prev => {
            const maxId = prev.reduce((m, f) => Math.max(m, Number.parseInt(f.id) || 0), 0);
            return [
                ...prev,
                {
                    id: String(maxId + 1),
                    label: tr("appForm.newField"),
                    type: "text",
                    icon: ICON_FOR.text,
                    is_required: false,
                },
            ];
        });

    const save = async () => {
        // An empty form would render a public apply page with nothing to fill in.
        if (draft.length === 0) {
            setError(tr("appForm.needOneField"));
            return;
        }
        if (draft.some(f => !f.label.trim())) {
            setError(tr("appForm.needLabels"));
            return;
        }
        setIsSaving(true);
        setError("");
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${jobId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ application_fields: draft }),
            });
            if (!res.ok) throw new Error(String(res.status));
            setSavedAt(Date.now());
            onSaved();
        } catch {
            setError(tr("appForm.saveFailed"));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-[15px] font-bold text-[#212121]">{tr("appForm.title")}</h3>
                    <p className="text-[12.5px] text-[#757575] mt-0.5 max-w-xl leading-relaxed">
                        {tr("appForm.subtitle")}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <a
                        href={`/jobs/${jobId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[4px] border border-[#E0E0E0] bg-white text-[12.5px] font-semibold text-[#424242] hover:border-[#1976D2]/50 hover:text-[#1976D2] transition-colors"
                    >
                        <i className="mdi mdi-eye text-[17px]" />
                        {tr("appForm.preview")}
                    </a>
                    <Button onClick={save} disabled={!isDirty || isSaving}>
                        {isSaving ? tr("appForm.saving") : tr("appForm.save")}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="rounded-[4px] border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3 text-[12.5px] text-[#C62828]">
                    {error}
                </div>
            )}
            {savedAt && !isDirty && !error && (
                <div className="rounded-[4px] border border-[#BFE3CC] bg-[#E8F5E9] px-4 py-3 text-[12.5px] text-[#2E7D32] flex items-center gap-2">
                    <i className="mdi mdi-check-circle text-[18px]" />
                    {tr("appForm.saved")}
                </div>
            )}

            <Card padding="none" className="overflow-hidden">
                <ul className="divide-y divide-[#EEEEEE]">
                    {draft.map((f, i) => (
                        <li key={f.id} className="p-4 sm:px-5">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <span className="w-9 h-9 shrink-0 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center">
                                    <Icon name={f.icon || ICON_FOR[f.type]} className="text-[19px]" />
                                </span>

                                <div className="flex-1 min-w-0">
                                    <Input
                                        value={f.label}
                                        onChange={e => update(f.id, { label: e.target.value })}
                                        placeholder={tr("appForm.labelPlaceholder")}
                                        aria-label={tr("appForm.labelPlaceholder")}
                                    />
                                </div>

                                <div className="w-full sm:w-[150px] shrink-0">
                                    <Select
                                        className="cursor-pointer"
                                        value={f.type}
                                        onChange={e => update(f.id, { type: e.target.value as ApplicationField["type"] })}
                                        aria-label={tr("appForm.typeLabel")}
                                    >
                                        {FIELD_TYPES.map(t => (
                                            <option key={t} value={t}>
                                                {tr(`appForm.type.${t}`)}
                                            </option>
                                        ))}
                                    </Select>
                                </div>

                                <label
                                    className={cn(
                                        "shrink-0 inline-flex items-center gap-1.5 h-11 px-3 rounded-[4px] border cursor-pointer transition-colors select-none",
                                        f.is_required
                                            ? "border-[#1976D2]/40 bg-[#E3F2FD] text-[#1976D2]"
                                            : "border-[#E0E0E0] bg-white text-[#757575] hover:text-[#424242]"
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={f.is_required}
                                        onChange={e => update(f.id, { is_required: e.target.checked })}
                                    />
                                    <Icon name={f.is_required ? "check_box" : "check_box_outline_blank"} className="text-[17px]" />
                                    <span className="text-[12.5px] font-semibold">{tr("appForm.required")}</span>
                                </label>

                                <div className="flex items-center gap-0.5 shrink-0">
                                    <button
                                        onClick={() => move(i, -1)}
                                        disabled={i === 0}
                                        title={tr("appForm.moveUp")}
                                        aria-label={tr("appForm.moveUp")}
                                        className="w-8 h-8 rounded-[4px] flex items-center justify-center text-[#757575] hover:text-[#212121] hover:bg-[#FAFAFA] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                    >
                                        <i className="mdi mdi-arrow-up text-[18px]" />
                                    </button>
                                    <button
                                        onClick={() => move(i, 1)}
                                        disabled={i === draft.length - 1}
                                        title={tr("appForm.moveDown")}
                                        aria-label={tr("appForm.moveDown")}
                                        className="w-8 h-8 rounded-[4px] flex items-center justify-center text-[#757575] hover:text-[#212121] hover:bg-[#FAFAFA] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                    >
                                        <i className="mdi mdi-arrow-down text-[18px]" />
                                    </button>
                                    <button
                                        onClick={() => remove(f.id)}
                                        title={tr("appForm.removeField")}
                                        aria-label={tr("appForm.removeField")}
                                        className="w-8 h-8 rounded-[4px] flex items-center justify-center text-[#757575] hover:text-[#C62828] hover:bg-[#FFEBEE] transition-colors"
                                    >
                                        <i className="mdi mdi-delete text-[18px]" />
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}

                    {draft.length === 0 && (
                        <li className="px-5 py-12 text-center">
                            <i className="mdi mdi-format-list-bulleted-square text-[30px] text-[#BDBDBD]" />
                            <p className="text-[13.5px] font-bold text-[#212121] mt-2">{tr("appForm.emptyTitle")}</p>
                            <p className="text-[12px] text-[#757575] mt-1">{tr("appForm.emptyDesc")}</p>
                        </li>
                    )}
                </ul>

                <div className="px-4 sm:px-5 py-3.5 border-t border-[#EEEEEE] bg-[#FAFAFA]">
                    <button
                        onClick={addField}
                        className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#1976D2] hover:text-[#1565C0] transition-colors"
                    >
                        <i className="mdi mdi-plus-circle text-[18px]" />
                        {tr("appForm.addField")}
                    </button>
                </div>
            </Card>

            <p className="text-[11.5px] text-[#757575] leading-relaxed">{tr("appForm.footnote")}</p>
        </div>
    );
}
