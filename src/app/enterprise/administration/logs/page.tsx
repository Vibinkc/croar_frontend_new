"use client";

/**
 * Logs — every action taken on your jobs and candidates, company-wide.
 *
 * The rows have existed since job activity logging was added: publishes, edits, candidate adds,
 * drops, notes. They were only ever readable inside a single job, which is a curiosity rather
 * than an audit trail — "who unpublished that role last Tuesday" had no screen that could
 * answer it.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Badge, Button, EmptyState, PageHeader, cn } from "@/components/ds";

interface LogRow {
    id: string;
    action: string;
    actor_name?: string | null;
    actor_id?: string | null;
    job_id?: string | null;
    job_title?: string | null;
    detail: Record<string, unknown>;
    created_at?: string | null;
}

/** Destructive actions read differently from routine ones, so they are toned apart. */
const ACTION_TONE: Record<string, "danger" | "success" | "info" | "neutral" | "warning"> = {
    candidate_dropped: "danger", deleted: "danger", unpublished: "warning",
    created: "success", published: "success", candidate_added: "success", candidate_restored: "success",
    updated: "info", note_added: "info", viewed: "neutral",
};

const CONTROL =
    "h-9 px-3 rounded-[4px] border border-[#E0E0E0] bg-white text-[13px] text-[#212121] outline-none focus:border-[#1976D2]";

export default function LogsPage() {
    const { t: tr } = useI18n();
    const { token, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [rows, setRows] = useState<LogRow[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [q, setQ] = useState("");
    const [action, setAction] = useState("");
    const [actor, setActor] = useState("");
    const [actions, setActions] = useState<{ action: string; count: number }[]>([]);
    const [actors, setActors] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError("");
        try {
            const p = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
            if (q.trim()) p.set("q", q.trim());
            if (action) p.set("action", action);
            if (actor) p.set("actor_id", actor);
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/administration/logs?${p}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const body = await res.json();
            if (!res.ok) { setError(typeof body.detail === "string" ? body.detail : tr("admin.logsFailed")); setRows([]); return; }
            setRows(body.results || []);
            setTotal(body.total || 0);
        } catch {
            setError(tr("admin.logsFailed"));
        } finally {
            setLoading(false);
        }
    }, [token, page, pageSize, q, action, actor, tr]);

    const loadFilters = useCallback(async () => {
        if (!token) return;
        const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/administration/logs/filters`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) { const d = await res.json(); setActions(d.actions || []); setActors(d.actors || []); }
    }, [token]);

    useEffect(() => { if (!authLoading && token) void load(); }, [authLoading, token, load]);
    useEffect(() => { if (!authLoading && token) void loadFilters(); }, [authLoading, token, loadFilters]);

    const lastPage = Math.max(1, Math.ceil(total / pageSize));
    const label = (a: string) => a.replace(/_/g, " ");

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-6">
                <PageHeader
                    title={tr("admin.logsTitle")}
                    subtitle={tr("admin.logsSubtitle")}
                    onBack={() => router.push("/enterprise/administration/data-management")}
                    actions={<Button size="sm" variant="secondary" icon="refresh" onClick={() => void load()} disabled={loading}>{tr("admin.refresh")}</Button>}
                />
            </div>

            <div className="flex-1 flex flex-col min-h-0 px-6 py-4">
                {error && <p className="mb-3 text-[12.5px] text-[#C62828] bg-[#FFEBEE] rounded-[4px] px-3 py-2">{error}</p>}

                <div className="mb-3 flex flex-wrap items-end gap-3">
                    <label className="flex flex-col gap-1">
                        <span className="text-[11.5px] text-[#757575]">{tr("admin.search")}</span>
                        <input className={cn(CONTROL, "w-[220px]")} value={q} placeholder={tr("admin.searchLogs")}
                               onChange={(e) => { setQ(e.target.value); setPage(1); }} />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[11.5px] text-[#757575]">{tr("admin.action")}</span>
                        <select className={cn(CONTROL, "w-[190px]")} value={action}
                                onChange={(e) => { setAction(e.target.value); setPage(1); }}>
                            <option value="">{tr("admin.anyAction")}</option>
                            {actions.map((a) => <option key={a.action} value={a.action}>{label(a.action)} ({a.count})</option>)}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[11.5px] text-[#757575]">{tr("admin.actor")}</span>
                        <select className={cn(CONTROL, "w-[180px]")} value={actor}
                                onChange={(e) => { setActor(e.target.value); setPage(1); }}>
                            <option value="">{tr("admin.anyone")}</option>
                            {actors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </label>
                    {(q || action || actor) && (
                        <Button size="sm" variant="ghost" onClick={() => { setQ(""); setAction(""); setActor(""); setPage(1); }}>
                            {tr("admin.clear")}
                        </Button>
                    )}
                </div>

                <div className="flex-1 min-h-0 bg-white border border-[#E0E0E0] rounded-[4px] flex flex-col overflow-hidden">
                    {loading ? (
                        <div className="flex-1 flex justify-center items-center py-20">
                            <div className="w-6 h-6 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                        </div>
                    ) : rows.length === 0 ? (
                        <EmptyState icon="text-box" tone="muted" title={tr("admin.noLogs")} description={tr("admin.noLogsDesc")} className="flex-1" />
                    ) : (
                        <>
                            <div className="flex-1 overflow-auto">
                                <table className="w-full border-collapse min-w-[720px]">
                                    <thead className="sticky top-0 bg-[#F5F6F8] border-b border-[#E0E0E0] z-10">
                                        <tr>
                                            {[tr("admin.when"), tr("admin.who"), tr("admin.action"), tr("admin.onJob"), tr("admin.detail")].map((h) => (
                                                <th key={h} className="py-2.5 px-3 text-left text-[11px] uppercase tracking-wide text-[#757575] font-medium">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#EEEEEE]">
                                        {rows.map((r) => (
                                            <tr key={r.id} className="hover:bg-[#FAFAFA] transition-colors">
                                                <td className="py-2.5 px-3 text-[12.5px] text-[#616161] tabular-nums whitespace-nowrap">
                                                    {r.created_at ? r.created_at.slice(0, 16).replace("T", " ") : "—"}
                                                </td>
                                                <td className="py-2.5 px-3 text-[12.5px] text-[#424242]">{r.actor_name || tr("admin.system")}</td>
                                                <td className="py-2.5 px-3">
                                                    <Badge tone={ACTION_TONE[r.action] || "neutral"}>{label(r.action)}</Badge>
                                                </td>
                                                <td className="py-2.5 px-3 text-[12.5px]">
                                                    {r.job_id && r.job_title ? (
                                                        <Link href={`/enterprise/jobs/${r.job_id}`} className="text-[#1976D2] hover:underline">{r.job_title}</Link>
                                                    ) : <span className="text-[#9E9E9E]">—</span>}
                                                </td>
                                                <td className="py-2.5 px-3 text-[12px] text-[#757575] max-w-[280px] truncate"
                                                    title={Object.keys(r.detail || {}).length ? JSON.stringify(r.detail) : ""}>
                                                    {Object.entries(r.detail || {}).map(([k, v]) => `${k}: ${String(v)}`).join(", ") || "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="border-t border-[#E0E0E0] px-4 py-2.5 flex items-center justify-end gap-4 flex-wrap">
                                <label className="text-[12.5px] text-[#616161] flex items-center gap-2">
                                    {tr("admin.perPage")}
                                    <select className={cn(CONTROL, "h-8")} value={pageSize}
                                            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                                        {[50, 100, 200].map((n) => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </label>
                                <span className="text-[12.5px] text-[#616161] tabular-nums">
                                    {tr("admin.range", { from: total ? (page - 1) * pageSize + 1 : 0, to: Math.min(page * pageSize, total), total })}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Button size="sm" variant="ghost" icon="chevron-left" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{""}</Button>
                                    <Button size="sm" variant="ghost" icon="chevron-right" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>{""}</Button>
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
