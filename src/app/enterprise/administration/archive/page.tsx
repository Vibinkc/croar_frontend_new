"use client";

/**
 * Archive Data — restore or permanently delete archived jobs and candidates.
 *
 * Jobs and candidates soft-delete in Croar, and until now a soft-deleted row was simply
 * invisible with no way back. There were 48 archived jobs sitting in this state. Deleting
 * something should be reversible right up until someone decides it should not be, and this
 * screen is both halves of that.
 *
 * Permanent delete asks twice, inline, naming the record. It is the only irreversible action in
 * the admin area, and a modal you dismiss by habit is not a confirmation.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Button, EmptyState, Icon, PageHeader, cn } from "@/components/ds";

interface Row { id: string; label: string; sub?: string | null; archived_at?: string | null }
type Kind = "jobs" | "candidates";

export default function ArchivePage() {
    const { t: tr } = useI18n();
    const { token, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [kind, setKind] = useState<Kind>("jobs");
    const [rows, setRows] = useState<Row[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState("");
    const [confirming, setConfirming] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [toast, setToast] = useState("");
    const PAGE_SIZE = 25;

    const say = (m: string) => { setToast(m); window.setTimeout(() => setToast(""), 3200); };

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError("");
        try {
            const res = await fetch(
                `${BACKEND_URL}/api/v1/enterprise/administration/archive?kind=${kind}&page=${page}&page_size=${PAGE_SIZE}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const body = await res.json();
            if (!res.ok) { setError(typeof body.detail === "string" ? body.detail : tr("admin.archiveFailed")); setRows([]); return; }
            setRows(body.results || []);
            setTotal(body.total || 0);
        } catch {
            setError(tr("admin.archiveFailed"));
        } finally {
            setLoading(false);
        }
    }, [token, kind, page, tr]);

    useEffect(() => { if (!authLoading && token) void load(); }, [authLoading, token, load]);

    const restore = async (r: Row) => {
        setBusy(r.id);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/administration/archive/${kind}/${r.id}/restore`, {
                method: "POST", headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) { say(tr("admin.restored", { name: r.label })); void load(); }
            else say(tr("admin.restoreFailed"));
        } finally { setBusy(""); }
    };

    const purge = async (r: Row) => {
        setBusy(r.id);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/administration/archive/${kind}/${r.id}`, {
                method: "DELETE", headers: { Authorization: `Bearer ${token}` },
            });
            setConfirming(null);
            if (res.ok) { say(tr("admin.purged", { name: r.label })); void load(); }
            else say(tr("admin.purgeFailed"));
        } finally { setBusy(""); }
    };

    const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-6">
                <PageHeader
                    title={tr("admin.archiveTitle")}
                    subtitle={tr("admin.archiveSubtitle")}
                    onBack={() => router.push("/enterprise/administration/data-management")}
                />
            </div>

            <div className="flex-1 flex flex-col min-h-0 px-6 py-4">
                {error && <p className="mb-3 text-[12.5px] text-[#C62828] bg-[#FFEBEE] rounded-[4px] px-3 py-2">{error}</p>}

                <div className="mb-3 flex items-center gap-2">
                    {(["jobs", "candidates"] as Kind[]).map((k) => (
                        <button key={k} type="button" onClick={() => { setKind(k); setPage(1); setConfirming(null); }}
                                className={cn("h-8 px-3 rounded-[4px] text-[12.5px] font-medium transition-colors",
                                              kind === k ? "bg-[#E3F2FD] text-[#1976D2]" : "text-[#616161] hover:bg-[#F5F6F8]")}>
                            {tr(`admin.kind_${k}`)}
                        </button>
                    ))}
                </div>

                <div className="flex-1 min-h-0 bg-white border border-[#E0E0E0] rounded-[4px] flex flex-col overflow-hidden">
                    {loading ? (
                        <div className="flex-1 flex justify-center items-center py-20">
                            <div className="w-6 h-6 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                        </div>
                    ) : rows.length === 0 ? (
                        <EmptyState icon="archive" tone="muted" title={tr("admin.archiveEmpty")} description={tr("admin.archiveEmptyDesc")} className="flex-1" />
                    ) : (
                        <>
                            <div className="flex-1 overflow-auto divide-y divide-[#EEEEEE]">
                                {rows.map((r) => (
                                    <div key={r.id} className="px-4 py-3 flex items-center gap-3 hover:bg-[#FAFAFA] transition-colors">
                                        <Icon name={kind === "jobs" ? "briefcase-off" : "account-off"} className="text-[20px] text-[#9E9E9E] shrink-0" />
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-[13.5px] text-[#212121] truncate">{r.label}</span>
                                            <span className="block text-[12px] text-[#757575] truncate">
                                                {r.sub || "—"}
                                                {r.archived_at && ` · ${tr("admin.archivedOn", { date: r.archived_at.slice(0, 10) })}`}
                                            </span>
                                        </span>
                                        {confirming === r.id ? (
                                            <span className="flex items-center gap-2 shrink-0">
                                                <span className="text-[12px] text-[#C62828]">{tr("admin.purgeConfirm")}</span>
                                                <Button size="sm" variant="danger" disabled={busy === r.id} onClick={() => void purge(r)}>
                                                    {tr("admin.purgeYes")}
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>{tr("admin.cancel")}</Button>
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2 shrink-0">
                                                <Button size="sm" variant="secondary" icon="backup-restore" disabled={busy === r.id}
                                                        onClick={() => void restore(r)}>
                                                    {tr("admin.restore")}
                                                </Button>
                                                <button type="button" title={tr("admin.purge")} onClick={() => setConfirming(r.id)}
                                                        className="w-8 h-8 rounded-[4px] flex items-center justify-center text-[#9E9E9E] hover:text-[#C62828] hover:bg-[#FFEBEE]">
                                                    <Icon name="delete-forever" className="text-[19px]" />
                                                </button>
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {lastPage > 1 && (
                                <div className="border-t border-[#E0E0E0] px-4 py-2.5 flex items-center justify-end gap-3">
                                    <span className="text-[12.5px] text-[#616161] tabular-nums">{page} / {lastPage}</span>
                                    <Button size="sm" variant="ghost" icon="chevron-left" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{""}</Button>
                                    <Button size="sm" variant="ghost" icon="chevron-right" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>{""}</Button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <p className="text-[11.5px] text-[#757575] mt-3 leading-relaxed">{tr("admin.archiveNote")}</p>
            </div>

            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[220] px-4 py-2.5 rounded-[4px] bg-[#212121] text-white text-[12.5px] font-medium shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                    {toast}
                </div>
            )}
        </div>
    );
}
