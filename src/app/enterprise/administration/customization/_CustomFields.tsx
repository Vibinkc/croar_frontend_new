"use client";

/**
 * The custom-field editor, shared by all five Customization screens.
 *
 * Manatal has one of these per record type and they are identical apart from the noun. Five
 * copies would mean fixing the same bug five times, so this is one component that takes the
 * entity as a prop — which is also how the backend models it.
 *
 * The list is drag-free on purpose: reordering is two small arrow buttons rather than a drag
 * library. Fields are reordered rarely and in ones, the keyboard reaches the buttons, and the
 * whole interaction is three lines of state instead of a dependency.
 */

import { useCallback, useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Badge, Button, EmptyState, Icon, cn } from "@/components/ds";
import { useAutoFocus } from "@/hooks/useAutoFocus";

export type Entity = "candidate" | "job" | "department" | "guest" | "match";

export interface FieldDef {
    id: string;
    key: string;
    label: string;
    field_type: string;
    options: string[];
    help_text: string | null;
    required: boolean;
    show_on_create: boolean;
    position: number;
}

const CONTROL =
    "h-9 px-3 rounded-[4px] border border-[#E0E0E0] bg-white text-[13px] text-[#212121] outline-none focus:border-[#1976D2]";

const TYPE_ICON: Record<string, string> = {
    text: "format-text",
    textarea: "text-long",
    number: "numeric",
    date: "calendar",
    select: "format-list-bulleted",
    multiselect: "format-list-checks",
    checkbox: "checkbox-marked-outline",
    url: "link-variant",
    email: "email-outline",
    phone: "phone-outline",
};

export function CustomFields({ entity }: { entity: Entity }) {
    const { t } = useI18n();
    const { token, isLoading: authLoading } = useAuth();

    const [fields, setFields] = useState<FieldDef[]>([]);
    const [types, setTypes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<FieldDef | null>(null);
    const [creating, setCreating] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<FieldDef | null>(null);
    const [toast, setToast] = useState("");

    const say = (m: string) => { setToast(m); window.setTimeout(() => setToast(""), 3000); };
    const auth = { Authorization: `Bearer ${token}` };

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/customization/fields?entity=${entity}`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const d = await res.json();
                setFields(d.fields[entity] || []);
                setTypes(d.types || []);
            }
        } finally {
            setLoading(false);
        }
    }, [token, entity]);

    useEffect(() => { if (!authLoading && token) void load(); }, [authLoading, token, load]);

    const move = async (index: number, delta: number) => {
        const next = [...fields];
        const target = index + delta;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        setFields(next);
        await fetch(`${BACKEND_URL}/api/v1/enterprise/customization/fields/reorder?entity=${entity}`, {
            method: "PUT",
            headers: { ...auth, "Content-Type": "application/json" },
            body: JSON.stringify({ field_ids: next.map((f) => f.id) }),
        });
    };

    const remove = async (f: FieldDef) => {
        const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/customization/fields/${f.id}`, {
            method: "DELETE", headers: auth,
        });
        setConfirmDelete(null);
        if (res.ok) { say(t("custom.deleted", { label: f.label })); void load(); }
    };

    return (
        <section className="bg-white border border-[#E0E0E0] rounded-[4px] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E0E0E0] flex items-start gap-3">
                <div className="min-w-0 flex-1">
                    <h2 className="text-[15px] font-medium text-[#212121]">{t("custom.fieldsTitle")}</h2>
                    <p className="text-[12.5px] text-[#757575] mt-0.5 leading-relaxed">
                        {t(`custom.fieldsHint_${entity}`)}
                    </p>
                </div>
                <Button size="sm" icon="plus" onClick={() => setCreating(true)}>{t("custom.addField")}</Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                </div>
            ) : fields.length === 0 ? (
                <EmptyState
                    icon="playlist-plus"
                    tone="muted"
                    title={t("custom.noFields")}
                    description={t("custom.noFieldsDesc")}
                    action={<Button size="sm" icon="plus" onClick={() => setCreating(true)}>{t("custom.addField")}</Button>}
                />
            ) : (
                <ul className="divide-y divide-[#EEEEEE]">
                    {fields.map((f, i) => (
                        <li key={f.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#FAFAFA] transition-colors">
                            <span className="w-9 h-9 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center shrink-0">
                                <Icon name={TYPE_ICON[f.field_type] || "format-text"} className="text-[19px]" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[13.5px] text-[#212121]">{f.label}</span>
                                    {f.required && <Badge tone="warning">{t("custom.required")}</Badge>}
                                    {!f.show_on_create && <Badge tone="neutral">{t("custom.notOnCreate")}</Badge>}
                                </span>
                                <span className="block text-[12px] text-[#757575] mt-0.5">
                                    {t(`custom.type_${f.field_type}`)}
                                    {f.options.length > 0 && ` · ${f.options.slice(0, 4).join(", ")}${f.options.length > 4 ? "…" : ""}`}
                                    {" · "}
                                    <code className="text-[11.5px]">{f.key}</code>
                                </span>
                            </span>
                            <span className="flex items-center gap-0.5 shrink-0">
                                <IconBtn icon="arrow-up" label={t("custom.moveUp")} disabled={i === 0} onClick={() => void move(i, -1)} />
                                <IconBtn icon="arrow-down" label={t("custom.moveDown")} disabled={i === fields.length - 1} onClick={() => void move(i, 1)} />
                                <IconBtn icon="pencil" label={t("custom.edit")} onClick={() => setEditing(f)} />
                                <IconBtn icon="delete" label={t("custom.delete")} danger onClick={() => setConfirmDelete(f)} />
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            {(creating || editing) && (
                <FieldDialog
                    field={editing}
                    entity={entity}
                    types={types}
                    token={token || ""}
                    t={t}
                    onClose={() => { setCreating(false); setEditing(null); }}
                    onSaved={(label) => {
                        setCreating(false); setEditing(null);
                        say(t("custom.saved", { label })); void load();
                    }}
                />
            )}

            {confirmDelete && (
                <div role="presentation" className="fixed inset-0 z-[215] flex items-center justify-center px-4" onClick={() => setConfirmDelete(null)}>
                    <div className="absolute inset-0 bg-black/45" />
                    <div role="presentation" className="relative w-full max-w-[400px] bg-white rounded-[4px] border border-[#E0E0E0] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
                         onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-[15px] font-medium text-[#212121]">
                            {t("custom.deleteTitle", { label: confirmDelete.label })}
                        </h3>
                        <p className="text-[13px] text-[#616161] mt-1.5 leading-relaxed">{t("custom.deleteBody")}</p>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(null)}>{t("custom.cancel")}</Button>
                            <Button size="sm" variant="danger" onClick={() => void remove(confirmDelete)}>{t("custom.delete")}</Button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[220] px-4 py-2.5 rounded-[4px] bg-[#212121] text-white text-[12.5px] font-medium shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                    {toast}
                </div>
            )}
        </section>
    );
}

function IconBtn({ icon, label, onClick, danger, disabled }: {
    icon: string; label: string; onClick: () => void; danger?: boolean; disabled?: boolean;
}) {
    return (
        <button
            type="button" onClick={onClick} aria-label={label} title={label} disabled={disabled}
            className={cn(
                "w-8 h-8 rounded-[4px] flex items-center justify-center transition-colors disabled:opacity-30 disabled:pointer-events-none",
                danger ? "text-[#9E9E9E] hover:text-[#C62828] hover:bg-[#FFEBEE]" : "text-[#9E9E9E] hover:text-[#1976D2] hover:bg-[#E3F2FD]"
            )}
        >
            <Icon name={icon} className="text-[18px]" />
        </button>
    );
}

function FieldDialog({ field, entity, types, token, t, onClose, onSaved }: {
    field: FieldDef | null; entity: Entity; types: string[]; token: string;
    t: (k: string, v?: Record<string, string | number>) => string;
    onClose: () => void; onSaved: (label: string) => void;
}) {
    const [label, setLabel] = useState(field?.label || "");
    const [fieldType, setFieldType] = useState(field?.field_type || "text");
    const [options, setOptions] = useState((field?.options || []).join("\n"));
    const [helpText, setHelpText] = useState(field?.help_text || "");
    const [required, setRequired] = useState(field?.required ?? false);
    const [showOnCreate, setShowOnCreate] = useState(field?.show_on_create ?? true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const labelRef = useAutoFocus<HTMLInputElement>();

    const needsOptions = fieldType === "select" || fieldType === "multiselect";

    const save = async () => {
        setSaving(true); setError("");
        try {
            const res = await fetch(
                field
                    ? `${BACKEND_URL}/api/v1/enterprise/customization/fields/${field.id}`
                    : `${BACKEND_URL}/api/v1/enterprise/customization/fields?entity=${entity}`,
                {
                    method: field ? "PATCH" : "POST",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({
                        label: label.trim(),
                        field_type: fieldType,
                        options: needsOptions ? options.split("\n").map((o) => o.trim()).filter(Boolean) : [],
                        help_text: helpText.trim() || null,
                        required,
                        show_on_create: showOnCreate,
                    }),
                }
            );
            const body = await res.json().catch(() => null);
            if (!res.ok) { setError(body?.detail || t("custom.saveFailed")); return; }
            onSaved(label.trim());
        } finally { setSaving(false); }
    };

    return (
        <div role="presentation" className="fixed inset-0 z-[210] flex items-center justify-center px-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/45" />
            <div role="presentation" className="relative w-full max-w-[480px] bg-white rounded-[4px] border border-[#E0E0E0] shadow-[0_8px_24px_rgba(0,0,0,0.18)] max-h-[86vh] flex flex-col"
                 onClick={(e) => e.stopPropagation()}>
                <div className="px-5 h-[52px] bg-[#1976D2] text-white flex items-center justify-between shrink-0">
                    <h3 className="text-[16px] font-medium">{field ? t("custom.editTitle") : t("custom.newTitle")}</h3>
                    <button type="button" onClick={onClose} aria-label={t("custom.cancel")}
                            className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center">
                        <Icon name="close" className="text-[20px]" />
                    </button>
                </div>
                <div className="p-5 flex flex-col gap-3 overflow-y-auto">
                    <label className="flex flex-col gap-1">
                        <span className="text-[12px] text-[#616161]">{t("custom.label")}</span>
                        <input className={CONTROL} value={label} maxLength={120} ref={labelRef}
                               placeholder={t("custom.labelPlaceholder")} onChange={(e) => setLabel(e.target.value)} />
                        {field && (
                            <span className="text-[11.5px] text-[#9E9E9E]">
                                {t("custom.keyFixed", { key: field.key })}
                            </span>
                        )}
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="text-[12px] text-[#616161]">{t("custom.type")}</span>
                        <select className={CONTROL} value={fieldType} onChange={(e) => setFieldType(e.target.value)}>
                            {types.map((ty) => <option key={ty} value={ty}>{t(`custom.type_${ty}`)}</option>)}
                        </select>
                    </label>

                    {needsOptions && (
                        <label className="flex flex-col gap-1">
                            <span className="text-[12px] text-[#616161]">{t("custom.options")}</span>
                            <textarea className={cn(CONTROL, "h-24 py-2 resize-none font-mono text-[12.5px]")}
                                      value={options} placeholder={t("custom.optionsPlaceholder")}
                                      onChange={(e) => setOptions(e.target.value)} />
                            <span className="text-[11.5px] text-[#9E9E9E]">{t("custom.optionsHint")}</span>
                        </label>
                    )}

                    <label className="flex flex-col gap-1">
                        <span className="text-[12px] text-[#616161]">{t("custom.helpText")}</span>
                        <input className={CONTROL} value={helpText} onChange={(e) => setHelpText(e.target.value)}
                               placeholder={t("custom.helpPlaceholder")} />
                    </label>

                    <label aria-label={t("custom.requiredLabel")} className="flex items-start gap-2.5 cursor-pointer">
                        <input type="checkbox" className="mt-0.5 accent-[#1976D2]" checked={required}
                               onChange={(e) => setRequired(e.target.checked)} />
                        <span>
                            <span className="block text-[13.5px] text-[#212121]">{t("custom.requiredLabel")}</span>
                            <span className="block text-[12px] text-[#757575]">{t("custom.requiredHint")}</span>
                        </span>
                    </label>
                    <label aria-label={t("custom.onCreateLabel")} className="flex items-start gap-2.5 cursor-pointer">
                        <input type="checkbox" className="mt-0.5 accent-[#1976D2]" checked={showOnCreate}
                               onChange={(e) => setShowOnCreate(e.target.checked)} />
                        <span>
                            <span className="block text-[13.5px] text-[#212121]">{t("custom.onCreateLabel")}</span>
                            <span className="block text-[12px] text-[#757575]">{t("custom.onCreateHint")}</span>
                        </span>
                    </label>

                    {error && <p className="text-[12.5px] text-[#C62828]">{error}</p>}

                    <div className="flex justify-end gap-2 pt-1">
                        <Button size="sm" variant="ghost" onClick={onClose}>{t("custom.cancel")}</Button>
                        <Button size="sm" icon="check" disabled={saving || !label.trim()} onClick={() => void save()}>
                            {saving ? t("custom.saving") : t("custom.save")}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
