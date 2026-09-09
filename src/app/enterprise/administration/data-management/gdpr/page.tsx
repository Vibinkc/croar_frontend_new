"use client";

/**
 * GDPR Tracking — consent state for every candidate.
 *
 * Consent is four facts, not a checkbox: what was decided, when, how it was obtained, and when
 * the lawful basis lapses. A regulator asks all four. The tiles across the top lead with the two
 * that mean somebody has to act — expired, and expiring inside 30 days — because those are the
 * only states where doing nothing has a consequence.
 *
 * "Never asked" is its own state and is deliberately not shown as a failure. Every candidate
 * sourced from the web starts there; it is a queue to work through, not a violation.
 */

import { useCallback, useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Badge, Button, EmptyState, Icon, PageHeader, cn } from "@/components/ds";

type Filter = "" | "granted" | "refused" | "withdrawn" | "never_asked" | "expired" | "expiring";

interface Row {
    id: string;
    full_name?: string | null;
    email?: string | null;
    source_platform?: string | null;
    consent_status?: string | null;
    consent_at?: string | null;
    consent_source?: string | null;
    consent_expires_at?: string | null;
    consent_note?: string | null;
    expired: boolean;
}
interface Summary {
    granted: number; refused: number; withdrawn: number;
    never_asked: number; expired: number; expiring: number; total: number;
}

const CONTROL =
    "h-9 px-3 rounded-[4px] border border-[#E0E0E0] bg-white text-[13px] text-[#212121] outline-none focus:border-[#1976D2]";

function StatusBadge({ row }: { row: Row }) {
    const { t } = useI18n();
    if (!row.consent_status) return <Badge tone="neutral">{t("gdpr.never_asked")}</Badge>;
    if (row.consent_status === "granted") {
        return row.expired
            ? <Badge tone="danger">{t("gdpr.expiredTag")}</Badge>
            : <Badge tone="success">{t("gdpr.granted")}</Badge>;
    }
    return <Badge tone={row.consent_status === "refused" ? "danger" : "warning"}>{t(`gdpr.${row.consent_status}`)}</Badge>;
}

export default function GdprPage() {
    const { t: tr } = useI18n();
    const { token, isLoading: authLoading } = useAuth();

    const [rows, setRows] = useState<Row[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState<Filter>("");
    const [q, setQ] = useState("");
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Row | null>(null);
    const [toast, setToast] = useState("");
    const PAGE_SIZE = 25;

    const say = (m: string) => { setToast(m); window.setTimeout(() => setToast(""), 3200); };

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const p = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
            if (filter) p.set("status", filter);
            if (q.trim()) p.set("q", q.trim());
            const [r, s] = await Promise.all([
                fetch(`${BACKEND_URL}/api/v1/enterprise/data-management/consent?${p}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${BACKEND_URL}/api/v1/enterprise/data-management/consent/summary`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            if (r.ok) { const d = await r.json(); setRows(d.results || []); setTotal(d.total || 0); }
            if (s.ok) setSummary(await s.json());
        } finally {
            setLoading(false);
        }
    }, [token, page, filter, q]);

    useEffect(() => { if (!authLoading && token) void load(); }, [authLoading, token, load]);

    const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

    // Ordered so the two that need action come first, which is the whole point of the row.
    const TILES: { key: Filter; label: string; value: number; urgent?: boolean }[] = summary ? [
        { key: "expired", label: tr("gdpr.expired"), value: summary.expired, urgent: true },
        { key: "expiring", label: tr("gdpr.expiring"), value: summary.expiring, urgent: true },
        { key: "granted", label: tr("gdpr.granted"), value: summary.granted },
        { key: "never_asked", label: tr("gdpr.never_asked"), value: summary.never_asked },
        { key: "refused", label: tr("gdpr.refused"), value: summary.refused },
        { key: "withdrawn", label: tr("gdpr.withdrawn"), value: summary.withdrawn },
    ] : [];

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-6">
                <PageHeader title={tr("gdpr.title")} subtitle={tr("gdpr.subtitle")} />
            </div>

            <div className="flex-1 flex flex-col min-h-0 px-6 py-4">
                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5 mb-4">
                        {TILES.map((tile) => (
                            <button
                                key={tile.key}
                                type="button"
                                onClick={() => { setFilter(filter === tile.key ? "" : tile.key); setPage(1); }}
                                className={cn(
                                    "bg-white border rounded-[4px] p-3 text-left transition-colors",
                                    filter === tile.key ? "border-[#1976D2] bg-[#E3F2FD]" : "border-[#E0E0E0] hover:border-[#1976D2]"
                                )}
                            >
                                <span className={cn(
                                    "block text-[20px] font-medium tabular-nums leading-none",
                                    tile.urgent && tile.value > 0 ? "text-[#C62828]" : "text-[#212121]"
                                )}>
                                    {tile.value}
                                </span>
                                <span className="block text-[11.5px] text-[#757575] mt-1">{tile.label}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="mb-3 flex items-center gap-3 flex-wrap">
                    <input className={cn(CONTROL, "w-[240px]")} value={q} placeholder={tr("gdpr.search")}
                           onChange={(e) => { setQ(e.target.value); setPage(1); }} />
                    {(filter || q) && (
                        <Button size="sm" variant="ghost" onClick={() => { setFilter(""); setQ(""); setPage(1); }}>
                            {tr("gdpr.clear")}
                        </Button>
                    )}
                    <span className="ml-auto text-[12.5px] text-[#616161] tabular-nums">
                        {tr("gdpr.range", { from: total ? (page - 1) * PAGE_SIZE + 1 : 0, to: Math.min(page * PAGE_SIZE, total), total })}
                    </span>
                </div>

                <div className="flex-1 min-h-0 bg-white border border-[#E0E0E0] rounded-[4px] flex flex-col overflow-hidden">
                    {loading ? (
                        <div className="flex-1 flex justify-center items-center py-20">
                            <div className="w-6 h-6 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                        </div>
                    ) : rows.length === 0 ? (
                        <EmptyState icon="shield-check" tone="muted" title={tr("gdpr.empty")} description={tr("gdpr.emptyDesc")} className="flex-1" />
                    ) : (
                        <>
                            <div className="flex-1 overflow-auto">
                                <table className="w-full border-collapse min-w-[820px]">
                                    <thead className="sticky top-0 bg-[#F5F6F8] border-b border-[#E0E0E0] z-10">
                                        <tr>
                                            {[tr("gdpr.candidate"), tr("gdpr.status"), tr("gdpr.recorded"), tr("gdpr.how"), tr("gdpr.expires"), ""].map((h, i) => (
                                                <th key={i} className="py-2.5 px-3 text-left text-[11px] uppercase tracking-wide text-[#757575] font-medium">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#EEEEEE]">
                                        {rows.map((r) => (
                                            <tr key={r.id} className="hover:bg-[#FAFAFA] transition-colors">
                                                <td className="py-2.5 px-3">
                                                    <span className="block text-[13.5px] text-[#212121]">{r.full_name || tr("gdpr.unnamed")}</span>
                                                    <span className="block text-[12px] text-[#757575]">{r.email || tr("gdpr.noEmail")}</span>
                                                </td>
                                                <td className="py-2.5 px-3"><StatusBadge row={r} /></td>
                                                <td className="py-2.5 px-3 text-[12.5px] text-[#616161] tabular-nums">
                                                    {r.consent_at ? r.consent_at.slice(0, 10) : "—"}
                                                </td>
                                                <td className="py-2.5 px-3 text-[12.5px] text-[#616161]">
                                                    {r.consent_source ? tr(`gdpr.src_${r.consent_source}`) : "—"}
                                                </td>
                                                <td className={cn("py-2.5 px-3 text-[12.5px] tabular-nums", r.expired ? "text-[#C62828]" : "text-[#616161]")}>
                                                    {r.consent_expires_at ? r.consent_expires_at.slice(0, 10) : tr("gdpr.noExpiry")}
                                                </td>
                                                <td className="py-2.5 px-3 text-right">
                                                    <Button size="sm" variant="secondary" onClick={() => setEditing(r)}>{tr("gdpr.record")}</Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {lastPage > 1 && (
                                <div className="border-t border-[#E0E0E0] px-4 py-2.5 flex items-center justify-end gap-3">
                                    <span className="text-[12.5px] text-[#616161] tabular-nums">{page} / {lastPage}</span>
                                    <Button size="sm" variant="ghost" icon="chevron-left" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{tr("gdpr.prev")}</Button>
                                    <Button size="sm" variant="ghost" trailingIcon="chevron-right" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>{tr("gdpr.next")}</Button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <p className="text-[11.5px] text-[#757575] mt-3 leading-relaxed">{tr("gdpr.note")}</p>
            </div>

            {editing && (
                <ConsentDialog
                    row={editing}
                    token={token || ""}
                    tr={tr}
                    onClose={() => setEditing(null)}
                    onSaved={() => { setEditing(null); say(tr("gdpr.saved")); void load(); }}
                />
            )}

            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[220] px-4 py-2.5 rounded-[4px] bg-[#212121] text-white text-[12.5px] font-medium shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                    {toast}
                </div>
            )}
        </div>
    );
}

function ConsentDialog({ row, token, tr, onClose, onSaved }: {
    row: Row; token: string;
    tr: (k: string, v?: Record<string, string | number>) => string;
    onClose: () => void; onSaved: () => void;
}) {
    const [status, setStatus] = useState<"granted" | "refused" | "withdrawn">("granted");
    const [source, setSource] = useState("recorded_manually");
    const [expiry, setExpiry] = useState<string>("730");
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/data-management/consent/${row.id}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    status, source, note: note.trim() || null,
                    // Only granted consent can lapse; the API ignores it otherwise, and the form
                    // hides the control so the two never disagree.
                    expires_in_days: status === "granted" && expiry ? Number(expiry) : null,
                }),
            });
            if (res.ok) onSaved();
        } finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-[210] flex items-center justify-center px-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/45" />
            <div className="relative w-full max-w-[480px] bg-white rounded-[4px] border border-[#E0E0E0] shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
                 onClick={(e) => e.stopPropagation()}>
                <div className="px-5 h-[52px] bg-[#1976D2] text-white flex items-center justify-between">
                    <h3 className="text-[16px] font-medium truncate">{row.full_name || tr("gdpr.unnamed")}</h3>
                    <button type="button" onClick={onClose} aria-label={tr("gdpr.close")}
                            className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center">
                        <Icon name="close" className="text-[20px]" />
                    </button>
                </div>
                <div className="p-5 flex flex-col gap-3">
                    <label className="flex flex-col gap-1">
                        <span className="text-[12px] text-[#616161]">{tr("gdpr.status")}</span>
                        <select className={CONTROL} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                            <option value="granted">{tr("gdpr.granted")}</option>
                            <option value="refused">{tr("gdpr.refused")}</option>
                            <option value="withdrawn">{tr("gdpr.withdrawn")}</option>
                        </select>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[12px] text-[#616161]">{tr("gdpr.how")}</span>
                        <select className={CONTROL} value={source} onChange={(e) => setSource(e.target.value)}>
                            {["apply_form", "email_reply", "recorded_manually", "imported"].map((s) => (
                                <option key={s} value={s}>{tr(`gdpr.src_${s}`)}</option>
                            ))}
                        </select>
                    </label>
                    {status === "granted" && (
                        <label className="flex flex-col gap-1">
                            <span className="text-[12px] text-[#616161]">{tr("gdpr.retention")}</span>
                            <select className={CONTROL} value={expiry} onChange={(e) => setExpiry(e.target.value)}>
                                <option value="365">{tr("gdpr.months", { count: 12 })}</option>
                                <option value="730">{tr("gdpr.months", { count: 24 })}</option>
                                <option value="1095">{tr("gdpr.months", { count: 36 })}</option>
                                <option value="">{tr("gdpr.noExpirySet")}</option>
                            </select>
                        </label>
                    )}
                    <label className="flex flex-col gap-1">
                        <span className="text-[12px] text-[#616161]">{tr("gdpr.noteLabel")}</span>
                        <textarea className={cn(CONTROL, "h-16 py-2 resize-none")} value={note}
                                  placeholder={tr("gdpr.notePlaceholder")} onChange={(e) => setNote(e.target.value)} />
                    </label>
                    <div className="flex justify-end gap-2 pt-1">
                        <Button size="sm" variant="ghost" onClick={onClose}>{tr("gdpr.cancel")}</Button>
                        <Button size="sm" icon="check" disabled={saving} onClick={() => void save()}>
                            {saving ? tr("gdpr.saving") : tr("gdpr.save")}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
