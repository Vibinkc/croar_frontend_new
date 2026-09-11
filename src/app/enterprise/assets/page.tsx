"use client";

/**
 * Assets — what the company owns and who is holding it.
 *
 * The tile that leads is "overdue back", because it is the only number on the page that implies
 * somebody has to do something today. The rest are counts.
 *
 * Assign and Return are separate actions rather than an editable "held by" field. Handing
 * something over and getting it back are events with a date and a condition, and an editable
 * field records neither — it just overwrites whoever had it last.
 */

import { useCallback, useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Badge, Button, EmptyState, Icon, PageHeader, cn } from "@/components/ds";
import { useAutoFocus } from "@/hooks/useAutoFocus";

interface HeldBy {
    assignment_id: string;
    employee_id: string;
    employee_name: string | null;
    assigned_at: string | null;
    due_back_on: string | null;
}
interface Asset {
    id: string;
    asset_tag: string;
    name: string;
    category: string;
    brand: string | null;
    model: string | null;
    serial_number: string | null;
    has_licence_key: boolean;
    ownership: string;
    status: string;
    purchase_cost: number | null;
    notes: string | null;
    held_by: HeldBy | null;
    times_assigned: number;
}
interface Summary {
    by_status: Record<string, number>;
    total: number;
    overdue: number;
    categories: string[];
    ownership: string[];
    statuses: string[];
    return_conditions: string[];
}
interface Employee { id: string; name: string }

const CONTROL =
    "h-9 px-3 rounded-[4px] border border-[#E0E0E0] bg-white text-[13px] text-[#212121] outline-none focus:border-[#1976D2]";

const CATEGORY_ICON: Record<string, string> = {
    laptop: "laptop", desktop: "desktop-tower-monitor", monitor: "monitor", phone: "cellphone",
    tablet: "tablet", peripheral: "mouse", furniture: "desk", access_card: "card-account-details-outline",
    software_licence: "key-variant", vehicle: "car", other: "package-variant-closed",
};

const STATUS_TONE: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
    available: "success", assigned: "info", in_repair: "warning", retired: "neutral", lost: "danger",
};

export default function AssetsPage() {
    const { t } = useI18n();
    const { token, isLoading: authLoading } = useAuth();

    const [assets, setAssets] = useState<Asset[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [status, setStatus] = useState("");
    const [category, setCategory] = useState("");
    const [editing, setEditing] = useState<Asset | null>(null);
    const [creating, setCreating] = useState(false);
    const [assigning, setAssigning] = useState<Asset | null>(null);
    const [returning, setReturning] = useState<Asset | null>(null);
    const [toast, setToast] = useState("");

    const say = (m: string) => { setToast(m); window.setTimeout(() => setToast(""), 3200); };

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const p = new URLSearchParams();
            if (q.trim()) p.set("q", q.trim());
            if (status) p.set("status", status);
            if (category) p.set("category", category);
            const h = { Authorization: `Bearer ${token}` };
            const [a, s, e] = await Promise.all([
                fetch(`${BACKEND_URL}/api/v1/enterprise/assets?${p}`, { headers: h }),
                fetch(`${BACKEND_URL}/api/v1/enterprise/assets/summary`, { headers: h }),
                fetch(`${BACKEND_URL}/api/v1/enterprise/employees/?page_size=200`, { headers: h }),
            ]);
            if (a.ok) setAssets((await a.json()).results || []);
            if (s.ok) setSummary(await s.json());
            if (e.ok) {
                const d = await e.json();
                const rows = d.items || d.results || [];
                setEmployees(rows.map((x: Record<string, string>) => ({
                    id: x.id,
                    name: [x.first_name, x.last_name].filter(Boolean).join(" ") || x.email,
                })));
            }
        } finally {
            setLoading(false);
        }
    }, [token, q, status, category]);

    useEffect(() => { if (!authLoading && token) void load(); }, [authLoading, token, load]);

    const overdue = (a: Asset) =>
        !!a.held_by?.due_back_on && new Date(a.held_by.due_back_on) < new Date();

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-6">
                <PageHeader
                    title={t("assets.title")}
                    subtitle={t("assets.subtitle")}
                    actions={<Button size="sm" icon="plus" onClick={() => setCreating(true)}>{t("assets.add")}</Button>}
                />
            </div>

            <div className="flex-1 flex flex-col min-h-0 px-6 py-4">
                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5 mb-4">
                        <Tile label={t("assets.overdue")} value={summary.overdue} urgent
                              active={false} onClick={() => { setStatus("assigned"); }} />
                        <Tile label={t("assets.total")} value={summary.total} active={!status}
                              onClick={() => setStatus("")} />
                        {summary.statuses.map((s) => (
                            <Tile key={s} label={t(`assets.status_${s}`)} value={summary.by_status[s] || 0}
                                  active={status === s} onClick={() => setStatus(status === s ? "" : s)} />
                        ))}
                    </div>
                )}

                <div className="mb-3 flex items-center gap-2.5 flex-wrap">
                    <input className={cn(CONTROL, "w-[220px]")} value={q} placeholder={t("assets.search")}
                           onChange={(e) => setQ(e.target.value)} />
                    <select className={CONTROL} value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="">{t("assets.anyCategory")}</option>
                        {(summary?.categories || []).map((c) => (
                            <option key={c} value={c}>{t(`assets.cat_${c}`)}</option>
                        ))}
                    </select>
                    <span className="ml-auto text-[12.5px] text-[#616161] tabular-nums">
                        {t("assets.count", { count: assets.length })}
                    </span>
                </div>

                <div className="flex-1 min-h-0 bg-white border border-[#E0E0E0] rounded-[4px] flex flex-col overflow-hidden">
                    {loading ? (
                        <div className="flex-1 flex justify-center items-center py-20">
                            <div className="w-6 h-6 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                        </div>
                    ) : assets.length === 0 ? (
                        <EmptyState
                            icon="laptop"
                            title={t("assets.empty")}
                            description={t("assets.emptyDesc")}
                            action={<Button size="sm" icon="plus" onClick={() => setCreating(true)}>{t("assets.add")}</Button>}
                            className="flex-1"
                        />
                    ) : (
                        <div className="flex-1 overflow-auto">
                            <table className="w-full border-collapse min-w-[920px]">
                                <thead className="sticky top-0 bg-[#F5F6F8] border-b border-[#E0E0E0] z-10">
                                    <tr>
                                        {[t("assets.asset"), t("assets.status"), t("assets.heldBy"), t("assets.dueBack"), ""].map((h, i) => (
                                            <th key={i} className="py-2.5 px-3 text-left text-[11px] uppercase tracking-wide text-[#757575] font-medium">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#EEEEEE]">
                                    {assets.map((a) => (
                                        <tr key={a.id} className="hover:bg-[#FAFAFA] transition-colors">
                                            <td className="py-2.5 px-3">
                                                <span className="flex items-center gap-2.5">
                                                    <span className="w-9 h-9 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center shrink-0">
                                                        <Icon name={CATEGORY_ICON[a.category] || "package-variant-closed"} className="text-[19px]" />
                                                    </span>
                                                    <span className="min-w-0">
                                                        <span className="block text-[13.5px] text-[#212121]">{a.name}</span>
                                                        <span className="block text-[12px] text-[#757575]">
                                                            <code>{a.asset_tag}</code>
                                                            {a.brand ? ` · ${a.brand}` : ""}
                                                            {a.has_licence_key ? ` · ${t("assets.hasKey")}` : ""}
                                                        </span>
                                                    </span>
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <Badge tone={STATUS_TONE[a.status] || "neutral"}>{t(`assets.status_${a.status}`)}</Badge>
                                            </td>
                                            <td className="py-2.5 px-3 text-[13px] text-[#212121]">
                                                {a.held_by?.employee_name || <span className="text-[#9E9E9E]">—</span>}
                                            </td>
                                            <td className={cn("py-2.5 px-3 text-[12.5px] tabular-nums", overdue(a) ? "text-[#C62828]" : "text-[#616161]")}>
                                                {a.held_by?.due_back_on
                                                    ? a.held_by.due_back_on.slice(0, 10) + (overdue(a) ? ` · ${t("assets.overdueTag")}` : "")
                                                    : a.held_by ? t("assets.noDate") : "—"}
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <span className="flex items-center justify-end gap-1">
                                                    {a.held_by ? (
                                                        <Button size="sm" variant="secondary" onClick={() => setReturning(a)}>
                                                            {t("assets.takeBack")}
                                                        </Button>
                                                    ) : (
                                                        <Button size="sm" variant="secondary" disabled={a.status === "retired" || a.status === "lost"}
                                                                onClick={() => setAssigning(a)}>
                                                            {t("assets.assign")}
                                                        </Button>
                                                    )}
                                                    <button type="button" onClick={() => setEditing(a)} aria-label={t("assets.edit")}
                                                            className="w-8 h-8 rounded-[4px] flex items-center justify-center text-[#9E9E9E] hover:text-[#1976D2] hover:bg-[#E3F2FD]">
                                                        <Icon name="pencil" className="text-[18px]" />
                                                    </button>
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {(creating || editing) && summary && (
                <AssetDialog asset={editing} summary={summary} token={token || ""} t={t}
                             onClose={() => { setCreating(false); setEditing(null); }}
                             onSaved={(n) => { setCreating(false); setEditing(null); say(t("assets.saved", { name: n })); void load(); }} />
            )}

            {assigning && (
                <AssignDialog asset={assigning} employees={employees} token={token || ""} t={t}
                              onClose={() => setAssigning(null)}
                              onSaved={() => { setAssigning(null); say(t("assets.assigned")); void load(); }} />
            )}

            {returning && summary && (
                <ReturnDialog asset={returning} conditions={summary.return_conditions} token={token || ""} t={t}
                              onClose={() => setReturning(null)}
                              onSaved={() => { setReturning(null); say(t("assets.returned")); void load(); }} />
            )}

            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[220] px-4 py-2.5 rounded-[4px] bg-[#212121] text-white text-[12.5px] font-medium shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                    {toast}
                </div>
            )}
        </div>
    );
}

function Tile({ label, value, urgent, active, onClick }: {
    label: string; value: number; urgent?: boolean; active: boolean; onClick: () => void;
}) {
    return (
        <button type="button" onClick={onClick}
                className={cn("bg-white border rounded-[4px] p-3 text-left transition-colors",
                    active ? "border-[#1976D2] bg-[#E3F2FD]" : "border-[#E0E0E0] hover:border-[#1976D2]")}>
            <span className={cn("block text-[20px] font-medium tabular-nums leading-none",
                urgent && value > 0 ? "text-[#C62828]" : "text-[#212121]")}>{value}</span>
            <span className="block text-[11.5px] text-[#757575] mt-1">{label}</span>
        </button>
    );
}

function Shell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-[210] flex items-center justify-center px-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/45" />
            <div className="relative w-full max-w-[520px] bg-white rounded-[4px] border border-[#E0E0E0] shadow-[0_8px_24px_rgba(0,0,0,0.18)] max-h-[88vh] flex flex-col"
                 onClick={(e) => e.stopPropagation()}>
                <div className="px-5 h-[52px] bg-[#1976D2] text-white flex items-center justify-between shrink-0">
                    <h3 className="text-[16px] font-medium truncate">{title}</h3>
                    <button type="button" onClick={onClose} aria-label="Close"
                            className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center">
                        <Icon name="close" className="text-[20px]" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function AssetDialog({ asset, summary, token, t, onClose, onSaved }: {
    asset: Asset | null; summary: Summary; token: string;
    t: (k: string, v?: Record<string, string | number>) => string;
    onClose: () => void; onSaved: (name: string) => void;
}) {
    const [f, setF] = useState({
        asset_tag: asset?.asset_tag || "",
        name: asset?.name || "",
        category: asset?.category || "laptop",
        brand: asset?.brand || "",
        model: asset?.model || "",
        serial_number: asset?.serial_number || "",
        licence_key: "",
        ownership: asset?.ownership || "company",
        purchase_cost: asset?.purchase_cost?.toString() || "",
        notes: asset?.notes || "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const assetTagRef = useAutoFocus<HTMLInputElement>();
    const set = (k: string, v: string) => setF((x) => ({ ...x, [k]: v }));

    const save = async () => {
        setSaving(true); setError("");
        try {
            const res = await fetch(
                `${BACKEND_URL}/api/v1/enterprise/assets${asset ? `/${asset.id}` : ""}`,
                {
                    method: asset ? "PATCH" : "POST",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...f,
                        brand: f.brand || null, model: f.model || null,
                        serial_number: f.serial_number || null,
                        licence_key: f.licence_key || null,
                        notes: f.notes || null,
                        purchase_cost: f.purchase_cost ? Number(f.purchase_cost) : null,
                    }),
                }
            );
            const body = await res.json().catch(() => null);
            if (!res.ok) { setError(body?.detail || t("assets.saveFailed")); return; }
            onSaved(f.name);
        } finally { setSaving(false); }
    };

    return (
        <Shell title={asset ? t("assets.editTitle") : t("assets.addTitle")} onClose={onClose}>
            <div className="p-5 flex flex-col gap-3 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                    <Field label={t("assets.tag")}>
                        <input className={CONTROL} value={f.asset_tag} maxLength={60} ref={assetTagRef}
                               placeholder="IT-001" onChange={(e) => set("asset_tag", e.target.value)} />
                    </Field>
                    <Field label={t("assets.category")}>
                        <select className={CONTROL} value={f.category} onChange={(e) => set("category", e.target.value)}>
                            {summary.categories.map((c) => <option key={c} value={c}>{t(`assets.cat_${c}`)}</option>)}
                        </select>
                    </Field>
                </div>
                <Field label={t("assets.name")}>
                    <input className={CONTROL} value={f.name} maxLength={200}
                           placeholder="MacBook Pro 14" onChange={(e) => set("name", e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label={t("assets.brand")}>
                        <input className={CONTROL} value={f.brand} onChange={(e) => set("brand", e.target.value)} />
                    </Field>
                    <Field label={t("assets.model")}>
                        <input className={CONTROL} value={f.model} onChange={(e) => set("model", e.target.value)} />
                    </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Field label={t("assets.serial")}>
                        <input className={CONTROL} value={f.serial_number} onChange={(e) => set("serial_number", e.target.value)} />
                    </Field>
                    <Field label={t("assets.ownership")}>
                        <select className={CONTROL} value={f.ownership} onChange={(e) => set("ownership", e.target.value)}>
                            {summary.ownership.map((o) => <option key={o} value={o}>{t(`assets.own_${o}`)}</option>)}
                        </select>
                    </Field>
                </div>
                <Field label={t("assets.licenceKey")}
                       hint={asset?.has_licence_key ? t("assets.keyStored") : t("assets.keyHint")}>
                    <input className={CONTROL} type="password" value={f.licence_key}
                           placeholder={asset?.has_licence_key ? "••••••••" : ""}
                           onChange={(e) => set("licence_key", e.target.value)} />
                </Field>
                <Field label={t("assets.cost")}>
                    <input className={CONTROL} type="number" min={0} value={f.purchase_cost}
                           onChange={(e) => set("purchase_cost", e.target.value)} />
                </Field>
                <Field label={t("assets.notes")}>
                    <textarea className={cn(CONTROL, "h-16 py-2 resize-none")} value={f.notes}
                              onChange={(e) => set("notes", e.target.value)} />
                </Field>

                {error && <p className="text-[12.5px] text-[#C62828]">{error}</p>}
                <div className="flex justify-end gap-2 pt-1">
                    <Button size="sm" variant="ghost" onClick={onClose}>{t("assets.cancel")}</Button>
                    <Button size="sm" icon="check" disabled={saving || !f.asset_tag.trim() || !f.name.trim()}
                            onClick={() => void save()}>
                        {saving ? t("assets.saving") : t("assets.save")}
                    </Button>
                </div>
            </div>
        </Shell>
    );
}

function AssignDialog({ asset, employees, token, t, onClose, onSaved }: {
    asset: Asset; employees: Employee[]; token: string;
    t: (k: string, v?: Record<string, string | number>) => string;
    onClose: () => void; onSaved: () => void;
}) {
    const [employeeId, setEmployeeId] = useState("");
    const [dueBack, setDueBack] = useState("");
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const save = async () => {
        setSaving(true); setError("");
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assets/${asset.id}/assign`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    employee_id: employeeId,
                    due_back_on: dueBack ? `${dueBack}T00:00:00` : null,
                    note: note.trim() || null,
                }),
            });
            const body = await res.json().catch(() => null);
            if (!res.ok) { setError(body?.detail || t("assets.saveFailed")); return; }
            onSaved();
        } finally { setSaving(false); }
    };

    return (
        <Shell title={t("assets.assignTitle", { name: asset.name })} onClose={onClose}>
            <div className="p-5 flex flex-col gap-3">
                <Field label={t("assets.assignTo")}>
                    <select className={CONTROL} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                        <option value="">{t("assets.pickPerson")}</option>
                        {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                </Field>
                <Field label={t("assets.dueBackLabel")} hint={t("assets.dueBackHint")}>
                    <input className={CONTROL} type="date" value={dueBack} onChange={(e) => setDueBack(e.target.value)} />
                </Field>
                <Field label={t("assets.note")}>
                    <textarea className={cn(CONTROL, "h-16 py-2 resize-none")} value={note}
                              onChange={(e) => setNote(e.target.value)} />
                </Field>
                {error && <p className="text-[12.5px] text-[#C62828]">{error}</p>}
                <div className="flex justify-end gap-2 pt-1">
                    <Button size="sm" variant="ghost" onClick={onClose}>{t("assets.cancel")}</Button>
                    <Button size="sm" icon="check" disabled={saving || !employeeId} onClick={() => void save()}>
                        {saving ? t("assets.saving") : t("assets.assign")}
                    </Button>
                </div>
            </div>
        </Shell>
    );
}

function ReturnDialog({ asset, conditions, token, t, onClose, onSaved }: {
    asset: Asset; conditions: string[]; token: string;
    t: (k: string, v?: Record<string, string | number>) => string;
    onClose: () => void; onSaved: () => void;
}) {
    const [condition, setCondition] = useState("good");
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assets/${asset.id}/return`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ condition, note: note.trim() || null }),
            });
            if (res.ok) onSaved();
        } finally { setSaving(false); }
    };

    return (
        <Shell title={t("assets.returnTitle", { name: asset.name })} onClose={onClose}>
            <div className="p-5 flex flex-col gap-3">
                <p className="text-[13px] text-[#616161] leading-relaxed">
                    {t("assets.returnFrom", { name: asset.held_by?.employee_name || "—" })}
                </p>
                <Field label={t("assets.condition")} hint={t("assets.conditionHint")}>
                    <div className="flex flex-col gap-2">
                        {conditions.map((c) => (
                            <label key={c} className={cn(
                                "flex items-start gap-2.5 px-3 py-2 rounded-[4px] border cursor-pointer transition-colors",
                                condition === c ? "border-[#1976D2] bg-[#E3F2FD]" : "border-[#E0E0E0] hover:border-[#1976D2]"
                            )}>
                                <input type="radio" className="mt-0.5 accent-[#1976D2]" checked={condition === c}
                                       onChange={() => setCondition(c)} />
                                <span>
                                    <span className="block text-[13.5px] text-[#212121]">{t(`assets.cond_${c}`)}</span>
                                    <span className="block text-[12px] text-[#757575]">{t(`assets.condThen_${c}`)}</span>
                                </span>
                            </label>
                        ))}
                    </div>
                </Field>
                <Field label={t("assets.note")}>
                    <textarea className={cn(CONTROL, "h-16 py-2 resize-none")} value={note}
                              onChange={(e) => setNote(e.target.value)} />
                </Field>
                <div className="flex justify-end gap-2 pt-1">
                    <Button size="sm" variant="ghost" onClick={onClose}>{t("assets.cancel")}</Button>
                    <Button size="sm" icon="check" disabled={saving} onClick={() => void save()}>
                        {saving ? t("assets.saving") : t("assets.takeBack")}
                    </Button>
                </div>
            </div>
        </Shell>
    );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1">
            <span className="text-[12px] text-[#616161]">{label}</span>
            {children}
            {hint && <span className="text-[11.5px] text-[#9E9E9E]">{hint}</span>}
        </label>
    );
}
