"use client";

/**
 * Offboarding — the exit process, and the checklist that runs it.
 *
 * The create form is Oorwin's, field for field, because their step one was walked in their live
 * product: employee, resignation or termination, resignation date, whether you would rehire,
 * reason with free text for "other", last working day, comments.
 *
 * The detail panel leads with what is BLOCKING rather than a progress bar. A bar says 7 of 11;
 * it does not say that the thing standing between you and finishing is a MacBook. The Complete
 * button stays disabled and names what is left, so the reason is never a mystery.
 *
 * Ticking an asset task asks for the condition first, because that tick is not a note — it
 * returns the asset for real, and the condition decides whether it goes back on the shelf or
 * into repair.
 */

import { useCallback, useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Badge, Button, EmptyState, Icon, PageHeader, cn } from "@/components/ds";

interface Task {
    id: string;
    title: string;
    detail: string | null;
    category: string;
    required: boolean;
    asset_id: string | null;
    due_on: string | null;
    done: boolean;
    done_at: string | null;
    note: string | null;
}
interface Offboarding {
    id: string;
    employee_id: string;
    employee_name: string | null;
    offboarding_type: string;
    resignation_date: string | null;
    last_working_day: string | null;
    reason: string;
    reason_other: string | null;
    rehire_eligible: boolean | null;
    comments: string | null;
    status: string;
    requested_at: string | null;
    decision_note: string | null;
    tasks: Task[];
    task_count: number;
    tasks_done: number;
    blocking: string[];
    can_complete: boolean;
}
interface Options { types: string[]; reasons: string[]; statuses: string[]; task_categories: string[] }
interface Employee { id: string; name: string }

const CONTROL =
    "h-9 px-3 rounded-[4px] border border-[#E0E0E0] bg-white text-[13px] text-[#212121] outline-none focus:border-[#1976D2]";

const STATUS_TONE: Record<string, "info" | "success" | "warning" | "danger" | "neutral"> = {
    requested: "warning", approved: "info", in_progress: "info",
    completed: "success", rejected: "danger", cancelled: "neutral",
};

const CAT_ICON: Record<string, string> = {
    assets: "laptop", access: "key-variant", finance: "cash", hr: "account-tie", knowledge: "book-open-variant",
};

export default function OffboardingPage() {
    const { t } = useI18n();
    const { token, isLoading: authLoading } = useAuth();

    const [rows, setRows] = useState<Offboarding[]>([]);
    const [options, setOptions] = useState<Options | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("");
    const [creating, setCreating] = useState(false);
    const [openId, setOpenId] = useState<string | null>(null);
    const [toast, setToast] = useState("");

    const say = (m: string) => { setToast(m); window.setTimeout(() => setToast(""), 3400); };
    const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const h = { Authorization: `Bearer ${token}` };
            const p = status ? `?status=${status}` : "";
            const [l, o, e] = await Promise.all([
                fetch(`${BACKEND_URL}/api/v1/enterprise/offboarding${p}`, { headers: h }),
                fetch(`${BACKEND_URL}/api/v1/enterprise/offboarding/options`, { headers: h }),
                fetch(`${BACKEND_URL}/api/v1/enterprise/employees/?page_size=200`, { headers: h }),
            ]);
            if (l.ok) setRows((await l.json()).results || []);
            if (o.ok) setOptions(await o.json());
            if (e.ok) {
                const d = await e.json();
                setEmployees((d.items || d.results || []).map((x: Record<string, string>) => ({
                    id: x.id,
                    name: [x.first_name, x.last_name].filter(Boolean).join(" ") || x.email,
                })));
            }
        } finally {
            setLoading(false);
        }
    }, [token, status]);

    useEffect(() => { if (!authLoading && token) void load(); }, [authLoading, token, load]);

    const act = async (id: string, action: string, body: unknown = {}) => {
        const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/offboarding/${id}/${action}`, {
            method: "POST", headers: auth, body: JSON.stringify(body),
        });
        const d = await res.json().catch(() => null);
        if (!res.ok) { say(d?.detail || t("offb.actionFailed")); return null; }
        void load();
        return d as Offboarding;
    };

    const open = rows.find((r) => r.id === openId) || null;

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-6">
                <PageHeader
                    title={t("offb.title")}
                    subtitle={t("offb.subtitle")}
                    actions={<Button size="sm" icon="plus" onClick={() => setCreating(true)}>{t("offb.initiate")}</Button>}
                />
            </div>

            <div className="flex-1 flex flex-col min-h-0 px-6 py-4">
                <div className="mb-3 flex items-center gap-2.5 flex-wrap">
                    <select className={CONTROL} value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="">{t("offb.anyStatus")}</option>
                        {(options?.statuses || []).map((s) => (
                            <option key={s} value={s}>{t(`offb.st_${s}`)}</option>
                        ))}
                    </select>
                    <span className="ml-auto text-[12.5px] text-[#616161] tabular-nums">
                        {t("offb.count", { count: rows.length })}
                    </span>
                </div>

                <div className="flex-1 min-h-0 bg-white border border-[#E0E0E0] rounded-[4px] flex flex-col overflow-hidden">
                    {loading ? (
                        <div className="flex-1 flex justify-center items-center py-20">
                            <div className="w-6 h-6 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                        </div>
                    ) : rows.length === 0 ? (
                        <EmptyState
                            icon="logout"
                            title={t("offb.empty")}
                            description={t("offb.emptyDesc")}
                            action={<Button size="sm" icon="plus" onClick={() => setCreating(true)}>{t("offb.initiate")}</Button>}
                            className="flex-1"
                        />
                    ) : (
                        <div className="flex-1 overflow-auto">
                            <table className="w-full border-collapse min-w-[900px]">
                                <thead className="sticky top-0 bg-[#F5F6F8] border-b border-[#E0E0E0] z-10">
                                    <tr>
                                        {[t("offb.person"), t("offb.type"), t("offb.lastDay"), t("offb.status"), t("offb.progress"), ""].map((h, i) => (
                                            <th key={i} className="py-2.5 px-3 text-left text-[11px] uppercase tracking-wide text-[#757575] font-medium">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#EEEEEE]">
                                    {rows.map((r) => (
                                        <tr key={r.id} className="hover:bg-[#FAFAFA] transition-colors">
                                            <td className="py-2.5 px-3">
                                                <span className="block text-[13.5px] text-[#212121]">{r.employee_name}</span>
                                                <span className="block text-[12px] text-[#757575]">
                                                    {t(`offb.reason_${r.reason}`)}{r.reason_other ? ` — ${r.reason_other}` : ""}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-[12.5px] text-[#616161]">
                                                {t(`offb.type_${r.offboarding_type}`)}
                                            </td>
                                            <td className="py-2.5 px-3 text-[12.5px] text-[#616161] tabular-nums">
                                                {r.last_working_day ? r.last_working_day.slice(0, 10) : "—"}
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <Badge tone={STATUS_TONE[r.status] || "neutral"}>{t(`offb.st_${r.status}`)}</Badge>
                                            </td>
                                            <td className="py-2.5 px-3 text-[12.5px] text-[#616161] tabular-nums">
                                                {r.tasks_done} / {r.task_count}
                                                {r.blocking.length > 0 && (
                                                    <span className="text-[#EF6C00]"> · {t("offb.nBlocking", { count: r.blocking.length })}</span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-3 text-right">
                                                <Button size="sm" variant="secondary" onClick={() => setOpenId(r.id)}>
                                                    {t("offb.openChecklist")}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {creating && options && (
                <CreateDialog options={options} employees={employees} token={token || ""} t={t}
                              onClose={() => setCreating(false)}
                              onSaved={(n) => { setCreating(false); say(t("offb.created", { name: n })); void load(); }} />
            )}

            {open && (
                <Detail o={open} token={token || ""} t={t} onClose={() => setOpenId(null)}
                        onChanged={() => void load()} onAct={act} onToast={say} />
            )}

            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[220] px-4 py-2.5 rounded-[4px] bg-[#212121] text-white text-[12.5px] font-medium shadow-[0_8px_24px_rgba(0,0,0,0.18)] max-w-[min(90vw,640px)] text-center">
                    {toast}
                </div>
            )}
        </div>
    );
}

function CreateDialog({ options, employees, token, t, onClose, onSaved }: {
    options: Options; employees: Employee[]; token: string;
    t: (k: string, v?: Record<string, string | number>) => string;
    onClose: () => void; onSaved: (name: string) => void;
}) {
    const [employeeId, setEmployeeId] = useState("");
    const [type, setType] = useState("resignation");
    const [resignationDate, setResignationDate] = useState("");
    const [lastDay, setLastDay] = useState("");
    const [reason, setReason] = useState("");
    const [reasonOther, setReasonOther] = useState("");
    const [rehire, setRehire] = useState<"" | "yes" | "no">("");
    const [comments, setComments] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const save = async () => {
        setSaving(true); setError("");
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/offboarding`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    employee_id: employeeId,
                    offboarding_type: type,
                    resignation_date: type === "resignation" && resignationDate ? `${resignationDate}T00:00:00` : null,
                    last_working_day: lastDay ? `${lastDay}T00:00:00` : null,
                    reason,
                    reason_other: reason === "other" ? reasonOther.trim() || null : null,
                    // Left blank on purpose means nobody decided, which is not "no".
                    rehire_eligible: rehire === "" ? null : rehire === "yes",
                    comments: comments.trim() || null,
                }),
            });
            const body = await res.json().catch(() => null);
            if (!res.ok) { setError(body?.detail || t("offb.saveFailed")); return; }
            onSaved(body?.employee_name || "");
        } finally { setSaving(false); }
    };

    const ready = employeeId && reason && (reason !== "other" || reasonOther.trim());

    return (
        <div role="presentation" className="fixed inset-0 z-[210] flex items-center justify-center px-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/45" />
            <div role="presentation" className="relative w-full max-w-[560px] bg-white rounded-[4px] border border-[#E0E0E0] shadow-[0_8px_24px_rgba(0,0,0,0.18)] max-h-[88vh] flex flex-col"
                 onClick={(e) => e.stopPropagation()}>
                <div className="px-5 h-[52px] bg-[#1976D2] text-white flex items-center justify-between shrink-0">
                    <h3 className="text-[16px] font-medium">{t("offb.createTitle")}</h3>
                    <button type="button" onClick={onClose} aria-label={t("offb.cancel")}
                            className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center">
                        <Icon name="close" className="text-[20px]" />
                    </button>
                </div>
                <div className="p-5 flex flex-col gap-3 overflow-y-auto">
                    <p className="text-[12.5px] text-[#616161] leading-relaxed">{t("offb.createHint")}</p>

                    <Field label={t("offb.employee")}>
                        <select className={CONTROL} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                            <option value="">{t("offb.pickEmployee")}</option>
                            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label={t("offb.typeLabel")}>
                            <select className={CONTROL} value={type} onChange={(e) => setType(e.target.value)}>
                                {options.types.map((x) => <option key={x} value={x}>{t(`offb.type_${x}`)}</option>)}
                            </select>
                        </Field>
                        <Field label={t("offb.rehire")} hint={t("offb.rehireHint")}>
                            <select className={CONTROL} value={rehire} onChange={(e) => setRehire(e.target.value as "" | "yes" | "no")}>
                                <option value="">{t("offb.notDecided")}</option>
                                <option value="yes">{t("offb.yes")}</option>
                                <option value="no">{t("offb.no")}</option>
                            </select>
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {type === "resignation" && (
                            <Field label={t("offb.resignationDate")}>
                                <input className={CONTROL} type="date" value={resignationDate}
                                       onChange={(e) => setResignationDate(e.target.value)} />
                            </Field>
                        )}
                        <Field label={t("offb.lastDayLabel")} hint={t("offb.lastDayHint")}>
                            <input className={CONTROL} type="date" value={lastDay}
                                   onChange={(e) => setLastDay(e.target.value)} />
                        </Field>
                    </div>

                    <Field label={t("offb.reasonLabel")}>
                        <select className={CONTROL} value={reason} onChange={(e) => setReason(e.target.value)}>
                            <option value="">{t("offb.pickReason")}</option>
                            {options.reasons.map((r) => <option key={r} value={r}>{t(`offb.reason_${r}`)}</option>)}
                        </select>
                    </Field>
                    {reason === "other" && (
                        <Field label={t("offb.otherReason")}>
                            <input className={CONTROL} value={reasonOther} onChange={(e) => setReasonOther(e.target.value)} />
                        </Field>
                    )}

                    <Field label={t("offb.comments")}>
                        <textarea className={cn(CONTROL, "h-16 py-2 resize-none")} value={comments}
                                  onChange={(e) => setComments(e.target.value)} />
                    </Field>

                    <div className="bg-[#E3F2FD] border border-[#BBDEFB] rounded-[4px] px-3.5 py-3">
                        <p className="text-[12.5px] text-[#0D47A1] leading-relaxed">
                            <Icon name="information-outline" className="text-[15px] align-[-2px] mr-1" />
                            {t("offb.willSeed")}
                        </p>
                    </div>

                    {error && <p className="text-[12.5px] text-[#C62828]">{error}</p>}
                    <div className="flex justify-end gap-2 pt-1">
                        <Button size="sm" variant="ghost" onClick={onClose}>{t("offb.cancel")}</Button>
                        <Button size="sm" icon="check" disabled={saving || !ready} onClick={() => void save()}>
                            {saving ? t("offb.saving") : t("offb.request")}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Detail({ o, token, t, onClose, onChanged, onAct, onToast }: {
    o: Offboarding; token: string;
    t: (k: string, v?: Record<string, string | number>) => string;
    onClose: () => void; onChanged: () => void;
    onAct: (id: string, action: string, body?: unknown) => Promise<Offboarding | null>;
    onToast: (m: string) => void;
}) {
    const [assetTask, setAssetTask] = useState<Task | null>(null);

    const tick = async (task: Task, done: boolean, condition = "good") => {
        const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/offboarding/${o.id}/tasks/${task.id}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ done, return_condition: condition }),
        });
        const d = await res.json().catch(() => null);
        if (!res.ok) { onToast(d?.detail || t("offb.actionFailed")); return; }
        setAssetTask(null);
        onChanged();
    };

    const grouped = ["assets", "access", "finance", "hr", "knowledge"]
        .map((c) => ({ category: c, items: o.tasks.filter((x) => x.category === c) }))
        .filter((g) => g.items.length);

    return (
        <div role="presentation" className="fixed inset-0 z-[210] flex items-center justify-center px-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/45" />
            <div role="presentation" className="relative w-full max-w-[680px] bg-white rounded-[4px] border border-[#E0E0E0] shadow-[0_8px_24px_rgba(0,0,0,0.18)] max-h-[90vh] flex flex-col"
                 onClick={(e) => e.stopPropagation()}>
                <div className="px-5 h-[52px] bg-[#1976D2] text-white flex items-center justify-between shrink-0">
                    <h3 className="text-[16px] font-medium truncate">{o.employee_name}</h3>
                    <button type="button" onClick={onClose} aria-label={t("offb.close")}
                            className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center">
                        <Icon name="close" className="text-[20px]" />
                    </button>
                </div>

                <div className="px-5 py-3.5 border-b border-[#E0E0E0] flex items-center gap-3 flex-wrap shrink-0">
                    <Badge tone={STATUS_TONE[o.status] || "neutral"}>{t(`offb.st_${o.status}`)}</Badge>
                    <span className="text-[12.5px] text-[#616161]">
                        {t(`offb.type_${o.offboarding_type}`)} · {t(`offb.reason_${o.reason}`)}
                        {o.last_working_day ? ` · ${t("offb.lastDay")} ${o.last_working_day.slice(0, 10)}` : ""}
                    </span>
                    {o.rehire_eligible !== null && (
                        <Badge tone={o.rehire_eligible ? "success" : "danger"}>
                            {o.rehire_eligible ? t("offb.rehireYes") : t("offb.rehireNo")}
                        </Badge>
                    )}
                    <span className="ml-auto text-[12.5px] text-[#616161] tabular-nums">
                        {o.tasks_done} / {o.task_count}
                    </span>
                </div>

                {o.status === "requested" && (
                    <div className="px-5 py-3 bg-[#FFF3E0] border-b border-[#FFE0B2] flex items-center gap-2 flex-wrap shrink-0">
                        <span className="text-[12.5px] text-[#E65100] flex-1">{t("offb.awaitingDecision")}</span>
                        <Button size="sm" variant="ghost" onClick={() => void onAct(o.id, "reject")}>{t("offb.reject")}</Button>
                        <Button size="sm" onClick={() => void onAct(o.id, "approve")}>{t("offb.approve")}</Button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
                    {grouped.map((g) => (
                        <section key={g.category}>
                            <h4 className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-[#757575] font-medium mb-2">
                                <Icon name={CAT_ICON[g.category]} className="text-[15px]" />
                                {t(`offb.cat_${g.category}`)}
                            </h4>
                            <ul className="border border-[#E0E0E0] rounded-[4px] divide-y divide-[#EEEEEE] overflow-hidden">
                                {g.items.map((task) => (
                                    <li key={task.id} className={cn("flex items-start gap-3 px-4 py-3", task.done && "bg-[#FAFAFA]")}>
                                        <input
                                            type="checkbox"
                                            className="mt-0.5 accent-[#1976D2] shrink-0"
                                            checked={task.done}
                                            disabled={o.status === "completed" || o.status === "rejected" || o.status === "cancelled"}
                                            onChange={(e) => {
                                                // An asset tick is not a note — it returns the thing, and the
                                                // condition decides where it goes. So it asks first.
                                                if (e.target.checked && task.asset_id) setAssetTask(task);
                                                else void tick(task, e.target.checked);
                                            }}
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className={cn("block text-[13.5px]", task.done ? "text-[#9E9E9E] line-through" : "text-[#212121]")}>
                                                {task.title}
                                            </span>
                                            {task.detail && (
                                                <span className="block text-[12px] text-[#757575] mt-0.5 leading-relaxed">{task.detail}</span>
                                            )}
                                            {task.note && (
                                                <span className="block text-[12px] text-[#616161] mt-0.5 italic">{task.note}</span>
                                            )}
                                        </span>
                                        {task.required && !task.done && <Badge tone="warning">{t("offb.required")}</Badge>}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>

                <div className="px-5 py-3.5 border-t border-[#E0E0E0] flex items-center gap-3 shrink-0">
                    {o.blocking.length > 0 ? (
                        <p className="text-[12.5px] text-[#EF6C00] flex-1 leading-snug">
                            {t("offb.stillToDo")}: {o.blocking.join(", ")}
                        </p>
                    ) : (
                        <p className="text-[12.5px] text-[#2E7D32] flex-1">{t("offb.allRequiredDone")}</p>
                    )}
                    {["requested", "approved", "in_progress"].includes(o.status) && (
                        <Button size="sm" variant="ghost" onClick={() => void onAct(o.id, "cancel")}>
                            {t("offb.cancelExit")}
                        </Button>
                    )}
                    <Button size="sm" icon="check-all" disabled={!o.can_complete}
                            onClick={() => void onAct(o.id, "complete")}>
                        {t("offb.complete")}
                    </Button>
                </div>
            </div>

            {assetTask && (
                <ConditionDialog task={assetTask} t={t} onClose={() => setAssetTask(null)}
                                 onPick={(c) => void tick(assetTask, true, c)} />
            )}
        </div>
    );
}

function ConditionDialog({ task, t, onClose, onPick }: {
    task: Task; t: (k: string, v?: Record<string, string | number>) => string;
    onClose: () => void; onPick: (condition: string) => void;
}) {
    const [c, setC] = useState("good");
    return (
        <div role="presentation" className="fixed inset-0 z-[215] flex items-center justify-center px-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/45" />
            <div role="presentation" className="relative w-full max-w-[440px] bg-white rounded-[4px] border border-[#E0E0E0] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
                 onClick={(e) => e.stopPropagation()}>
                <h3 className="text-[15px] font-medium text-[#212121]">{task.title}</h3>
                <p className="text-[13px] text-[#616161] mt-1.5 leading-relaxed">{t("offb.conditionAsk")}</p>
                <div className="flex flex-col gap-2 mt-3">
                    {["good", "damaged", "unusable", "not_returned"].map((x) => (
                        <label key={x} aria-label={t(`assets.cond_${x}`)} className={cn(
                            "flex items-start gap-2.5 px-3 py-2 rounded-[4px] border cursor-pointer transition-colors",
                            c === x ? "border-[#1976D2] bg-[#E3F2FD]" : "border-[#E0E0E0] hover:border-[#1976D2]"
                        )}>
                            <input type="radio" className="mt-0.5 accent-[#1976D2]" checked={c === x} onChange={() => setC(x)} />
                            <span>
                                <span className="block text-[13.5px] text-[#212121]">{t(`assets.cond_${x}`)}</span>
                                <span className="block text-[12px] text-[#757575]">{t(`assets.condThen_${x}`)}</span>
                            </span>
                        </label>
                    ))}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <Button size="sm" variant="ghost" onClick={onClose}>{t("offb.cancel")}</Button>
                    <Button size="sm" icon="check" onClick={() => onPick(c)}>{t("offb.confirmReturn")}</Button>
                </div>
            </div>
        </div>
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
