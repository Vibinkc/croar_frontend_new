"use client";

/**
 * Matches — every candidate↔job pairing in the company, in one table.
 *
 * This is what Manatal means by a "match": the association record, not a recommendation. Their
 * screen is a flat, sortable, filterable list of Candidate Name / Position Name / Match Stage /
 * Dropped across every job, and it earns its place because a pipeline board only ever shows one
 * job at a time. "Where is everyone, right now" has nowhere else to live.
 *
 * Dropped pairings stay in the list rather than disappearing. A dropped candidate is still
 * someone you considered, and hiding them makes the record of who you looked at shrink quietly
 * over time.
 *
 * The recommendation engine that was briefly on this route now sits at /matches/recommendations
 * and is linked from the header — it answers "who SHOULD be on this job?", which is a different
 * question and was never what Manatal's Matches meant.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Badge, Button, EmptyState, Icon, PageHeader, cn } from "@/components/ds";

interface Row {
    application_id: string;
    candidate_id: string;
    candidate_name?: string | null;
    candidate_email?: string | null;
    job_id: string;
    job_title: string;
    department?: string | null;
    stage: number;
    status_id: number;
    status?: string | null;
    dropped: boolean;
    source?: string | null;
    match_score?: number | null;
    applied_at?: string | null;
}

type Sort = "candidate" | "job" | "stage" | "applied";

const TONES: [string, string][] = [
    ["#E3F2FD", "#1976D2"], ["#E8F5E9", "#2E7D32"], ["#FFF3E0", "#EF6C00"],
    ["#E3F2FD", "#1565C0"], ["#FFEBEE", "#C62828"], ["#EEEEEE", "#4F4F4F"],
];
function toneFor(seed: string): [string, string] {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return TONES[h % TONES.length];
}

function Avatar({ name }: { name: string }) {
    const [bg, fg] = toneFor(name);
    return (
        <span className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-[12px] font-medium"
              style={{ background: bg, color: fg }}>
            {name.trim().charAt(0).toUpperCase() || "?"}
        </span>
    );
}

/** Status pill. Terminal states read differently from in-flight ones, so they are toned apart. */
function StageBadge({ status, dropped }: { status?: string | null; dropped: boolean }) {
    if (dropped) return <Badge tone="danger">{status || "Rejected"}</Badge>;
    const tone =
        status === "Hired" ? "success" :
        status === "Offered" ? "teal" :
        status === "Withdrawn" ? "neutral" : "info";
    return <Badge tone={tone as "success" | "teal" | "neutral" | "info"}>{status || "—"}</Badge>;
}

const CONTROL =
    "h-9 px-3 rounded-[4px] border border-[#E0E0E0] bg-white text-[13px] text-[#212121] outline-none focus:border-[#1976D2]";

export default function MatchesPage() {
    const { t: tr } = useI18n();
    const { token, isLoading: authLoading } = useAuth();

    const [rows, setRows] = useState<Row[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [sort, setSort] = useState<Sort>("applied");
    const [direction, setDirection] = useState<"asc" | "desc">("desc");
    const [q, setQ] = useState("");
    const [jobId, setJobId] = useState("");
    const [statusId, setStatusId] = useState("");
    const [dropped, setDropped] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
    const [statuses, setStatuses] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError("");
        try {
            const p = new URLSearchParams({
                sort, direction, page: String(page), page_size: String(pageSize),
            });
            if (q.trim()) p.set("q", q.trim());
            if (jobId) p.set("job_id", jobId);
            if (statusId) p.set("status_id", statusId);
            if (dropped) p.set("dropped", dropped);
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/matches?${p}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const body = await res.json();
            if (!res.ok) {
                setError(typeof body.detail === "string" ? body.detail : tr("matches.loadFailed"));
                setRows([]);
                return;
            }
            setRows(body.results || []);
            setTotal(body.total || 0);
        } catch {
            setError(tr("matches.loadFailed"));
        } finally {
            setLoading(false);
        }
    }, [token, sort, direction, page, pageSize, q, jobId, statusId, dropped, tr]);

    const loadFilters = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/matches/filters`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const d = await res.json();
                setJobs(d.jobs || []);
                setStatuses(d.statuses || []);
            }
        } catch {
            /* the filter panel falls back to its "any" options */
        }
    }, [token]);

    useEffect(() => {
        if (!authLoading && token) void load();
    }, [authLoading, token, load]);
    useEffect(() => {
        if (!authLoading && token) void loadFilters();
    }, [authLoading, token, loadFilters]);

    const sortBy = (col: Sort) => {
        if (sort === col) setDirection((d) => (d === "asc" ? "desc" : "asc"));
        else {
            setSort(col);
            setDirection("asc");
        }
        setPage(1);
    };

    const Th = ({ col, children, align = "left" }: { col?: Sort; children: React.ReactNode; align?: "left" | "right" }) => (
        <th className={cn("py-2.5 px-3 text-[11px] uppercase tracking-wide text-[#757575] font-medium",
                          align === "right" ? "text-right" : "text-left")}>
            {col ? (
                <button type="button" onClick={() => sortBy(col)} className="inline-flex items-center gap-1 hover:text-[#1976D2]">
                    {children}
                    <Icon name={sort === col ? (direction === "asc" ? "chevron-up" : "chevron-down") : "unfold-more-horizontal"}
                          className={cn("text-[15px]", sort === col ? "text-[#1976D2]" : "text-[#BDBDBD]")} />
                </button>
            ) : children}
        </th>
    );

    const lastPage = Math.max(1, Math.ceil(total / pageSize));
    const from = total ? (page - 1) * pageSize + 1 : 0;
    const to = Math.min(page * pageSize, total);
    const filtersOn = !!(q || jobId || statusId || dropped);

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-6">
                <PageHeader
                    title={tr("matches.title")}
                    subtitle={tr("matches.subtitle")}
                    icon="how_to_reg"
                    actions={
                        <div className="flex items-center gap-2">
                            <Link href="/enterprise/matches/recommendations">
                                <Button size="sm" variant="secondary" icon="auto-fix">{tr("matches.recommendations")}</Button>
                            </Link>
                            <Button size="sm" variant={showFilters || filtersOn ? "primary" : "secondary"}
                                    icon="filter-variant" onClick={() => setShowFilters((v) => !v)}>
                                {tr("matches.filters")}
                            </Button>
                            <Button size="sm" variant="secondary" icon="refresh" onClick={() => void load()} disabled={loading}>
                                {tr("matches.refresh")}
                            </Button>
                        </div>
                    }
                />
            </div>

            <div className="flex-1 flex flex-col min-h-0 px-6 py-4">
                {error && (
                    <p className="mb-3 text-[12.5px] text-[#C62828] bg-[#FFEBEE] rounded-[4px] px-3 py-2">{error}</p>
                )}

                {showFilters && (
                    <div className="mb-3 bg-white border border-[#E0E0E0] rounded-[4px] p-3 flex flex-wrap items-end gap-3">
                        <label className="flex flex-col gap-1">
                            <span className="text-[11.5px] text-[#757575]">{tr("matches.search")}</span>
                            <input className={cn(CONTROL, "w-[220px]")} value={q} placeholder={tr("matches.searchPlaceholder")}
                                   onChange={(e) => { setQ(e.target.value); setPage(1); }} />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-[11.5px] text-[#757575]">{tr("matches.job")}</span>
                            <select className={cn(CONTROL, "w-[200px]")} value={jobId}
                                    onChange={(e) => { setJobId(e.target.value); setPage(1); }}>
                                <option value="">{tr("matches.anyJob")}</option>
                                {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-[11.5px] text-[#757575]">{tr("matches.stage")}</span>
                            <select className={cn(CONTROL, "w-[160px]")} value={statusId}
                                    onChange={(e) => { setStatusId(e.target.value); setPage(1); }}>
                                <option value="">{tr("matches.anyStage")}</option>
                                {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-[11.5px] text-[#757575]">{tr("matches.dropped")}</span>
                            <select className={cn(CONTROL, "w-[130px]")} value={dropped}
                                    onChange={(e) => { setDropped(e.target.value); setPage(1); }}>
                                <option value="">{tr("matches.all")}</option>
                                <option value="false">{tr("matches.notDropped")}</option>
                                <option value="true">{tr("matches.onlyDropped")}</option>
                            </select>
                        </label>
                        {filtersOn && (
                            <Button size="sm" variant="ghost"
                                    onClick={() => { setQ(""); setJobId(""); setStatusId(""); setDropped(""); setPage(1); }}>
                                {tr("matches.clear")}
                            </Button>
                        )}
                    </div>
                )}

                <div className="flex-1 min-h-0 bg-white border border-[#E0E0E0] rounded-[4px] flex flex-col overflow-hidden">
                    {loading ? (
                        <div className="flex-1 flex justify-center items-center py-20">
                            <div className="w-6 h-6 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                        </div>
                    ) : rows.length === 0 ? (
                        <EmptyState icon="how_to_reg" tone="muted"
                                    title={filtersOn ? tr("matches.noneMatchFilters") : tr("matches.emptyTitle")}
                                    description={filtersOn ? tr("matches.noneMatchFiltersDesc") : tr("matches.emptyDesc")}
                                    className="flex-1" />
                    ) : (
                        <>
                            <div className="flex-1 overflow-auto">
                                <table className="w-full border-collapse min-w-[760px]">
                                    <thead className="sticky top-0 bg-[#F5F6F8] border-b border-[#E0E0E0] z-10">
                                        <tr>
                                            <Th col="candidate">{tr("matches.candidateName")}</Th>
                                            <Th col="job">{tr("matches.positionName")}</Th>
                                            <Th col="stage">{tr("matches.matchStage")}</Th>
                                            <Th>{tr("matches.droppedCol")}</Th>
                                            <Th>{tr("matches.source")}</Th>
                                            <Th col="applied" align="right">{tr("matches.applied")}</Th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#EEEEEE]">
                                        {rows.map((r) => (
                                            <tr key={r.application_id} className="hover:bg-[#FAFAFA] transition-colors">
                                                <td className="py-2.5 px-3">
                                                    <span className="flex items-center gap-2.5 min-w-0">
                                                        <Avatar name={r.candidate_name || "?"} />
                                                        <span className="min-w-0">
                                                            <Link href={`/enterprise/candidates?candidate=${r.candidate_id}`}
                                                                  className="block text-[13.5px] text-[#1976D2] hover:underline truncate">
                                                                {r.candidate_name || tr("matches.unnamed")}
                                                            </Link>
                                                            {r.candidate_email && (
                                                                <span className="block text-[11.5px] text-[#757575] truncate">{r.candidate_email}</span>
                                                            )}
                                                        </span>
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <Link href={`/enterprise/jobs/${r.job_id}`} className="text-[13px] text-[#1976D2] hover:underline">
                                                        {r.job_title}
                                                    </Link>
                                                    {r.department && <span className="block text-[11.5px] text-[#757575]">{r.department}</span>}
                                                </td>
                                                <td className="py-2.5 px-3"><StageBadge status={r.status} dropped={r.dropped} /></td>
                                                <td className="py-2.5 px-3 text-[13px] text-[#424242]">
                                                    {r.dropped ? tr("matches.yes") : tr("matches.no")}
                                                </td>
                                                <td className="py-2.5 px-3 text-[12.5px] text-[#616161]">{r.source || "—"}</td>
                                                <td className="py-2.5 px-3 text-right text-[12.5px] text-[#616161] tabular-nums">
                                                    {r.applied_at ? r.applied_at.slice(0, 10) : "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="border-t border-[#E0E0E0] px-4 py-2.5 flex items-center justify-end gap-4 flex-wrap">
                                <label className="text-[12.5px] text-[#616161] flex items-center gap-2">
                                    {tr("matches.perPage")}
                                    <select className={cn(CONTROL, "h-8")} value={pageSize}
                                            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                                        {[20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </label>
                                <span className="text-[12.5px] text-[#616161] tabular-nums">
                                    {tr("matches.range", { from, to, total })}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Button size="sm" variant="ghost" icon="chevron-left" aria-label={tr("matches.prev")}
                                            disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{""}</Button>
                                    <Button size="sm" variant="ghost" icon="chevron-right" aria-label={tr("matches.next")}
                                            disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>{""}</Button>
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
