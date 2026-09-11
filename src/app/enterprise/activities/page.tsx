"use client";

/**
 * Activities — Manatal's screen: scheduled calls, meetings and interviews.
 *
 * Worth stating plainly, because I got it wrong first: this is NOT an audit feed. Croar already
 * has one of those (`job_activities`, shown per job). Manatal's Activities is a diary — things
 * a recruiter plans to do, with a type, a time, a duration and people assigned.
 *
 * Their toolbar carries DAY / WEEK / MONTH / LIST, and it opens on "Upcoming" with a filter
 * badge showing the default is narrow. Both are kept: a calendar that opens on everything ever
 * scheduled is a worse default than one that opens on what is about to happen.
 *
 * The one addition to their layout is the overdue count on the "Past" tab. A past activity
 * nobody ticked off either never happened or was forgotten, and both need a person to look —
 * so the number is on the tab rather than waiting to be discovered.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Badge, Button, EmptyState, Icon, PageHeader, cn } from "@/components/ds";
import { useAutoFocus } from "@/hooks/useAutoFocus";

type View = "upcoming" | "past" | "completed" | "all";
type Mode = "list" | "day" | "week" | "month";

interface Assignee { id: string; name: string; email: string }
interface Activity {
    id: string;
    title: string;
    activity_type: string;
    notes?: string | null;
    starts_at: string;
    duration_minutes: number;
    related_label: string;
    related_type: "candidate" | "job" | "other";
    related_id?: string | null;
    completed_at?: string | null;
    assignees: Assignee[];
}
interface Options {
    types: string[];
    users: { id: string; name: string; email: string }[];
    jobs: { id: string; title: string }[];
    candidates: { id: string; name: string }[];
}
interface Summary { upcoming: number; past: number; completed: number; all: number; today: number }

const TYPE_ICON: Record<string, string> = {
    call: "phone", meeting: "account-group", interview: "account-voice",
    email: "email", task: "check-circle-outline", other: "calendar",
};
const TYPE_TONE: Record<string, string> = {
    call: "#1976D2", meeting: "#2E7D32", interview: "#6A1B9A",
    email: "#EF6C00", task: "#0277BD", other: "#757575",
};

const CONTROL =
    "h-9 px-3 rounded-[4px] border border-[#E0E0E0] bg-white text-[13px] text-[#212121] outline-none focus:border-[#1976D2]";

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hhmm = (iso: string) => { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

function Avatars({ people }: { people: Assignee[] }) {
    if (!people.length) return <span className="text-[12.5px] text-[#9E9E9E]">—</span>;
    return (
        <span className="flex items-center gap-1.5 min-w-0">
            <span className="w-7 h-7 rounded-full bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center text-[11px] font-medium shrink-0">
                {people[0].name.trim().charAt(0).toUpperCase()}
            </span>
            <span className="text-[12.5px] text-[#424242] truncate">{people[0].name}</span>
            {people.length > 1 && <span className="text-[11.5px] text-[#757575] shrink-0">+{people.length - 1}</span>}
        </span>
    );
}

export default function ActivitiesPage() {
    const { t: tr } = useI18n();
    const { token, isLoading: authLoading } = useAuth();

    const [view, setView] = useState<View>("upcoming");
    const [mode, setMode] = useState<Mode>("list");
    const [rows, setRows] = useState<Activity[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [sort, setSort] = useState<"title" | "type" | "date">("date");
    const [direction, setDirection] = useState<"asc" | "desc">("asc");
    const [summary, setSummary] = useState<Summary | null>(null);
    const [options, setOptions] = useState<Options | null>(null);
    const [anchor, setAnchor] = useState(() => new Date());

    const [q, setQ] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [assigneeFilter, setAssigneeFilter] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editing, setEditing] = useState<Activity | null>(null);
    const [creating, setCreating] = useState(false);
    const [toast, setToast] = useState("");

    const say = (m: string) => { setToast(m); window.setTimeout(() => setToast(""), 3200); };
    const auth = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

    /* The window the calendar modes ask for. List mode ignores it entirely. */
    const range = useMemo(() => {
        const d = new Date(anchor);
        if (mode === "day") {
            const s = new Date(d); s.setHours(0, 0, 0, 0);
            const e = new Date(d); e.setHours(23, 59, 59, 999);
            return { start: s, end: e };
        }
        if (mode === "week") {
            const s = new Date(d); s.setDate(d.getDate() - d.getDay()); s.setHours(0, 0, 0, 0);
            const e = new Date(s); e.setDate(s.getDate() + 6); e.setHours(23, 59, 59, 999);
            return { start: s, end: e };
        }
        const s = new Date(d.getFullYear(), d.getMonth(), 1);
        const e = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        return { start: s, end: e };
    }, [anchor, mode]);

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError("");
        try {
            let url: string;
            if (mode === "list") {
                const p = new URLSearchParams({ view, sort, direction, page: String(page), page_size: String(pageSize) });
                if (q.trim()) p.set("q", q.trim());
                if (typeFilter) p.set("activity_type", typeFilter);
                if (assigneeFilter) p.set("assignee_id", assigneeFilter);
                url = `${BACKEND_URL}/api/v1/enterprise/activities?${p}`;
            } else {
                const p = new URLSearchParams({ start: range.start.toISOString(), end: range.end.toISOString() });
                if (typeFilter) p.set("activity_type", typeFilter);
                if (assigneeFilter) p.set("assignee_id", assigneeFilter);
                url = `${BACKEND_URL}/api/v1/enterprise/activities/calendar?${p}`;
            }
            const res = await fetch(url, { headers: auth });
            const body = await res.json();
            if (!res.ok) {
                setError(typeof body.detail === "string" ? body.detail : tr("activities.loadFailed"));
                setRows([]);
                return;
            }
            setRows(body.results || []);
            setTotal(body.total ?? (body.results || []).length);
        } catch {
            setError(tr("activities.loadFailed"));
        } finally {
            setLoading(false);
        }
    }, [token, auth, mode, view, sort, direction, page, pageSize, q, typeFilter, assigneeFilter, range, tr]);

    const loadMeta = useCallback(async () => {
        if (!token) return;
        try {
            const [s, o] = await Promise.all([
                fetch(`${BACKEND_URL}/api/v1/enterprise/activities/summary`, { headers: auth }),
                fetch(`${BACKEND_URL}/api/v1/enterprise/activities/options`, { headers: auth }),
            ]);
            if (s.ok) setSummary(await s.json());
            if (o.ok) setOptions(await o.json());
        } catch {
            /* tabs fall back to no counts; the form falls back to empty selects */
        }
    }, [token, auth]);

    useEffect(() => { if (!authLoading && token) void load(); }, [authLoading, token, load]);
    useEffect(() => { if (!authLoading && token) void loadMeta(); }, [authLoading, token, loadMeta]);

    const toggleDone = async (a: Activity) => {
        const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/activities/${a.id}`, {
            method: "PATCH",
            headers: { ...auth, "Content-Type": "application/json" },
            body: JSON.stringify({ completed: !a.completed_at }),
        });
        if (res.ok) { say(a.completed_at ? tr("activities.reopened") : tr("activities.completed")); void load(); void loadMeta(); }
    };

    const remove = async (a: Activity) => {
        const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/activities/${a.id}`, { method: "DELETE", headers: auth });
        if (res.ok) { say(tr("activities.deleted")); void load(); void loadMeta(); }
    };

    const sortBy = (col: "title" | "type" | "date") => {
        if (sort === col) setDirection((d) => (d === "asc" ? "desc" : "asc"));
        else { setSort(col); setDirection("asc"); }
        setPage(1);
    };

    const VIEWS: { key: View; label: string; count?: number }[] = [
        { key: "upcoming", label: tr("activities.upcoming"), count: summary?.upcoming },
        { key: "past", label: tr("activities.overdue"), count: summary?.past },
        { key: "completed", label: tr("activities.done"), count: summary?.completed },
        { key: "all", label: tr("activities.all"), count: summary?.all },
    ];

    const lastPage = Math.max(1, Math.ceil(total / pageSize));
    const shiftAnchor = (dir: -1 | 1) => {
        const d = new Date(anchor);
        if (mode === "day") d.setDate(d.getDate() + dir);
        else if (mode === "week") d.setDate(d.getDate() + 7 * dir);
        else d.setMonth(d.getMonth() + dir);
        setAnchor(d);
    };

    /* ── calendar cells ──────────────────────────────────────────────────── */
    const byDay = useMemo(() => {
        const m: Record<string, Activity[]> = {};
        for (const a of rows) (m[ymd(new Date(a.starts_at))] ||= []).push(a);
        return m;
    }, [rows]);

    const monthCells = useMemo(() => {
        const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
        const start = new Date(first);
        start.setDate(first.getDate() - first.getDay());
        return Array.from({ length: 42 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
    }, [anchor]);

    const weekCells = useMemo(() => {
        const s = new Date(range.start);
        return Array.from({ length: 7 }, (_, i) => { const d = new Date(s); d.setDate(s.getDate() + i); return d; });
    }, [range.start]);

    const Pill = ({ a }: { a: Activity }) => (
        <button
            type="button"
            onClick={() => setEditing(a)}
            className={cn(
                "w-full text-left px-1.5 py-1 rounded-[3px] text-[11px] leading-tight truncate transition-colors",
                a.completed_at ? "line-through opacity-60" : ""
            )}
            style={{ background: `${TYPE_TONE[a.activity_type] || "#757575"}18`, color: TYPE_TONE[a.activity_type] || "#757575" }}
            title={`${hhmm(a.starts_at)} · ${a.title} · ${a.related_label}`}
        >
            {hhmm(a.starts_at)} {a.title}
        </button>
    );

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-6">
                <PageHeader
                    title={tr("activities.title")}
                    subtitle={tr("activities.subtitle")}
                    icon="calendar_today"
                    actions={
                        <div className="flex items-center gap-2">
                            <span className="hidden md:flex rounded-[4px] border border-[#E0E0E0] overflow-hidden">
                                {(["day", "week", "month", "list"] as Mode[]).map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => { setMode(m); setPage(1); }}
                                        className={cn(
                                            "h-9 px-3 text-[12.5px] font-medium transition-colors capitalize",
                                            mode === m ? "bg-[#1976D2] text-white" : "bg-white text-[#616161] hover:bg-[#F5F6F8]"
                                        )}
                                    >
                                        {tr(`activities.mode_${m}`)}
                                    </button>
                                ))}
                            </span>
                            <Button size="sm" variant={showFilters || typeFilter || assigneeFilter ? "primary" : "secondary"}
                                    icon="filter-variant" onClick={() => setShowFilters((v) => !v)}>
                                {tr("activities.filters")}
                            </Button>
                            <Button size="sm" icon="plus" onClick={() => setCreating(true)}>
                                {tr("activities.create")}
                            </Button>
                        </div>
                    }
                />
            </div>

            <div className="flex-1 flex flex-col min-h-0 px-6 py-4">
                {error && <p className="mb-3 text-[12.5px] text-[#C62828] bg-[#FFEBEE] rounded-[4px] px-3 py-2">{error}</p>}

                {/* view tabs (list mode) or the date pager (calendar modes) */}
                <div className="mb-3 flex items-center gap-2 flex-wrap">
                    {mode === "list" ? (
                        VIEWS.map((v) => (
                            <button
                                key={v.key}
                                type="button"
                                onClick={() => { setView(v.key); setPage(1); }}
                                className={cn(
                                    "h-8 px-3 rounded-[4px] text-[12.5px] font-medium transition-colors inline-flex items-center gap-1.5",
                                    view === v.key ? "bg-[#E3F2FD] text-[#1976D2]" : "text-[#616161] hover:bg-[#F5F6F8]"
                                )}
                            >
                                {v.label}
                                {v.count !== undefined && (
                                    <span className={cn(
                                        "text-[11px] tabular-nums px-1.5 rounded-[3px]",
                                        // Overdue is the count worth colouring: it is the one that means
                                        // something needs doing rather than merely existing.
                                        v.key === "past" && v.count > 0 ? "bg-[#FFEBEE] text-[#C62828]" : "bg-[#EEEEEE] text-[#616161]"
                                    )}>
                                        {v.count}
                                    </span>
                                )}
                            </button>
                        ))
                    ) : (
                        <>
                            <Button size="sm" variant="secondary" icon="chevron-left" onClick={() => shiftAnchor(-1)}>{""}</Button>
                            <Button size="sm" variant="secondary" onClick={() => setAnchor(new Date())}>{tr("activities.today")}</Button>
                            <Button size="sm" variant="secondary" icon="chevron-right" onClick={() => shiftAnchor(1)}>{""}</Button>
                            <span className="text-[13.5px] font-medium text-[#212121] ml-1">
                                {mode === "month"
                                    ? anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" })
                                    : `${range.start.toLocaleDateString()} – ${range.end.toLocaleDateString()}`}
                            </span>
                            <span className="text-[12.5px] text-[#757575] ml-auto tabular-nums">
                                {tr("activities.nScheduled", { count: rows.length })}
                            </span>
                        </>
                    )}
                </div>

                {showFilters && (
                    <div className="mb-3 bg-white border border-[#E0E0E0] rounded-[4px] p-3 flex flex-wrap items-end gap-3">
                        {mode === "list" && (
                            <label className="flex flex-col gap-1">
                                <span className="text-[11.5px] text-[#757575]">{tr("activities.search")}</span>
                                <input className={cn(CONTROL, "w-[200px]")} value={q} placeholder={tr("activities.searchPlaceholder")}
                                       onChange={(e) => { setQ(e.target.value); setPage(1); }} />
                            </label>
                        )}
                        <label className="flex flex-col gap-1">
                            <span className="text-[11.5px] text-[#757575]">{tr("activities.type")}</span>
                            <select className={cn(CONTROL, "w-[150px]")} value={typeFilter}
                                    onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
                                <option value="">{tr("activities.anyType")}</option>
                                {(options?.types || []).map((t) => (
                                    <option key={t} value={t}>{tr(`activities.type_${t}`)}</option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-[11.5px] text-[#757575]">{tr("activities.assignee")}</span>
                            <select className={cn(CONTROL, "w-[180px]")} value={assigneeFilter}
                                    onChange={(e) => { setAssigneeFilter(e.target.value); setPage(1); }}>
                                <option value="">{tr("activities.anyone")}</option>
                                {(options?.users || []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </label>
                        {(q || typeFilter || assigneeFilter) && (
                            <Button size="sm" variant="ghost" onClick={() => { setQ(""); setTypeFilter(""); setAssigneeFilter(""); setPage(1); }}>
                                {tr("activities.clear")}
                            </Button>
                        )}
                    </div>
                )}

                <div className="flex-1 min-h-0 bg-white border border-[#E0E0E0] rounded-[4px] flex flex-col overflow-hidden">
                    {loading ? (
                        <div className="flex-1 flex justify-center items-center py-20">
                            <div className="w-6 h-6 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                        </div>
                    ) : mode === "list" ? (
                        rows.length === 0 ? (
                            <EmptyState icon="calendar" tone="muted"
                                        title={tr(`activities.empty_${view}`)}
                                        description={tr("activities.emptyDesc")}
                                        action={<Button size="sm" icon="plus" onClick={() => setCreating(true)}>{tr("activities.create")}</Button>}
                                        className="flex-1" />
                        ) : (
                            <>
                                <div className="flex-1 overflow-auto">
                                    <table className="w-full border-collapse min-w-[860px]">
                                        <thead className="sticky top-0 bg-[#F5F6F8] border-b border-[#E0E0E0] z-10">
                                            <tr>
                                                {([["title", tr("activities.colTitle")], ["type", tr("activities.colType")]] as const).map(([c, l]) => (
                                                    <th key={c} className="py-2.5 px-3 text-left text-[11px] uppercase tracking-wide text-[#757575] font-medium">
                                                        <button type="button" onClick={() => sortBy(c)} className="inline-flex items-center gap-1 hover:text-[#1976D2]">
                                                            {l}
                                                            <Icon name={sort === c ? (direction === "asc" ? "chevron-up" : "chevron-down") : "unfold-more-horizontal"}
                                                                  className={cn("text-[15px]", sort === c ? "text-[#1976D2]" : "text-[#BDBDBD]")} />
                                                        </button>
                                                    </th>
                                                ))}
                                                <th className="py-2.5 px-3 text-left text-[11px] uppercase tracking-wide text-[#757575] font-medium">{tr("activities.colRelated")}</th>
                                                <th className="py-2.5 px-3 text-left text-[11px] uppercase tracking-wide text-[#757575] font-medium">
                                                    <button type="button" onClick={() => sortBy("date")} className="inline-flex items-center gap-1 hover:text-[#1976D2]">
                                                        {tr("activities.colDate")}
                                                        <Icon name={sort === "date" ? (direction === "asc" ? "chevron-up" : "chevron-down") : "unfold-more-horizontal"}
                                                              className={cn("text-[15px]", sort === "date" ? "text-[#1976D2]" : "text-[#BDBDBD]")} />
                                                    </button>
                                                </th>
                                                <th className="py-2.5 px-3 text-left text-[11px] uppercase tracking-wide text-[#757575] font-medium">{tr("activities.colTime")}</th>
                                                <th className="py-2.5 px-3 text-left text-[11px] uppercase tracking-wide text-[#757575] font-medium">{tr("activities.colDuration")}</th>
                                                <th className="py-2.5 px-3 text-left text-[11px] uppercase tracking-wide text-[#757575] font-medium">{tr("activities.colAssignees")}</th>
                                                <th className="py-2.5 px-3" />
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#EEEEEE]">
                                            {rows.map((a) => {
                                                const overdue = !a.completed_at && new Date(a.starts_at) < new Date();
                                                return (
                                                    <tr key={a.id} className="hover:bg-[#FAFAFA] transition-colors">
                                                        <td className="py-2.5 px-3">
                                                            <button type="button" onClick={() => setEditing(a)}
                                                                    className={cn("text-[13.5px] text-left hover:underline",
                                                                                  a.completed_at ? "text-[#9E9E9E] line-through" : "text-[#1976D2]")}>
                                                                {a.title}
                                                            </button>
                                                        </td>
                                                        <td className="py-2.5 px-3">
                                                            <span className="inline-flex items-center gap-1.5 text-[12.5px]" style={{ color: TYPE_TONE[a.activity_type] }}>
                                                                <Icon name={TYPE_ICON[a.activity_type] || "calendar"} className="text-[16px]" />
                                                                {tr(`activities.type_${a.activity_type}`)}
                                                            </span>
                                                        </td>
                                                        <td className="py-2.5 px-3 text-[12.5px]">
                                                            {a.related_type === "candidate" && a.related_id ? (
                                                                <Link href={`/enterprise/candidates?candidate=${a.related_id}`} className="text-[#1976D2] hover:underline">{a.related_label}</Link>
                                                            ) : a.related_type === "job" && a.related_id ? (
                                                                <Link href={`/enterprise/jobs/${a.related_id}`} className="text-[#1976D2] hover:underline">{a.related_label}</Link>
                                                            ) : <span className="text-[#757575]">{a.related_label}</span>}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-[12.5px] text-[#424242] tabular-nums">
                                                            {a.starts_at.slice(0, 10)}
                                                            {overdue && <Badge tone="danger" className="ml-2">{tr("activities.overdueTag")}</Badge>}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-[12.5px] text-[#424242] tabular-nums">{hhmm(a.starts_at)}</td>
                                                        <td className="py-2.5 px-3 text-[12.5px] text-[#616161] tabular-nums">
                                                            {tr("activities.nMinutes", { count: a.duration_minutes })}
                                                        </td>
                                                        <td className="py-2.5 px-3"><Avatars people={a.assignees} /></td>
                                                        <td className="py-2.5 px-3">
                                                            <span className="flex items-center gap-0.5 justify-end">
                                                                <button type="button" title={a.completed_at ? tr("activities.reopen") : tr("activities.markDone")}
                                                                        onClick={() => void toggleDone(a)}
                                                                        className="w-8 h-8 rounded-[4px] flex items-center justify-center text-[#9E9E9E] hover:text-[#2E7D32] hover:bg-[#E8F5E9]">
                                                                    <Icon name={a.completed_at ? "backup-restore" : "check-circle-outline"} className="text-[19px]" />
                                                                </button>
                                                                <button type="button" title={tr("activities.delete")} onClick={() => void remove(a)}
                                                                        className="w-8 h-8 rounded-[4px] flex items-center justify-center text-[#9E9E9E] hover:text-[#C62828] hover:bg-[#FFEBEE]">
                                                                    <Icon name="delete" className="text-[19px]" />
                                                                </button>
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="border-t border-[#E0E0E0] px-4 py-2.5 flex items-center justify-end gap-4 flex-wrap">
                                    <label className="text-[12.5px] text-[#616161] flex items-center gap-2">
                                        {tr("activities.perPage")}
                                        <select className={cn(CONTROL, "h-8")} value={pageSize}
                                                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                                            {[20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                    </label>
                                    <span className="text-[12.5px] text-[#616161] tabular-nums">
                                        {tr("activities.range", { from: total ? (page - 1) * pageSize + 1 : 0, to: Math.min(page * pageSize, total), total })}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Button size="sm" variant="ghost" icon="chevron-left" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{""}</Button>
                                        <Button size="sm" variant="ghost" icon="chevron-right" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>{""}</Button>
                                    </span>
                                </div>
                            </>
                        )
                    ) : mode === "month" ? (
                        <div className="flex-1 overflow-auto p-3">
                            <div className="grid grid-cols-7 gap-px bg-[#E0E0E0] border border-[#E0E0E0] rounded-[4px] overflow-hidden">
                                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="bg-[#F5F6F8] py-2 text-center text-[11px] uppercase tracking-wide text-[#757575] font-medium">
                                        {new Date(2024, 0, 7 + i).toLocaleDateString(undefined, { weekday: "short" })}
                                    </div>
                                ))}
                                {monthCells.map((d) => {
                                    const key = ymd(d);
                                    const outside = d.getMonth() !== anchor.getMonth();
                                    const isToday = key === ymd(new Date());
                                    const items = byDay[key] || [];
                                    return (
                                        <div key={key} className={cn("bg-white min-h-[104px] p-1.5 flex flex-col gap-1", outside && "bg-[#FAFAFA]")}>
                                            <span className={cn(
                                                "text-[11.5px] tabular-nums w-6 h-6 flex items-center justify-center rounded-full shrink-0",
                                                isToday ? "bg-[#1976D2] text-white font-medium" : outside ? "text-[#BDBDBD]" : "text-[#616161]"
                                            )}>
                                                {d.getDate()}
                                            </span>
                                            {items.slice(0, 3).map((a) => <Pill key={a.id} a={a} />)}
                                            {items.length > 3 && (
                                                <span className="text-[10.5px] text-[#757575] px-1.5">+{items.length - 3}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* day and week share a column layout — a week is seven of a day */
                        <div className="flex-1 overflow-auto p-3">
                            <div className={cn("grid gap-px bg-[#E0E0E0] border border-[#E0E0E0] rounded-[4px] overflow-hidden",
                                               mode === "week" ? "grid-cols-7" : "grid-cols-1")}>
                                {(mode === "week" ? weekCells : [anchor]).map((d) => {
                                    const key = ymd(d);
                                    const items = byDay[key] || [];
                                    const isToday = key === ymd(new Date());
                                    return (
                                        <div key={key} className="bg-white min-h-[320px] flex flex-col">
                                            <div className={cn("py-2 px-2 border-b border-[#E0E0E0] text-center", isToday ? "bg-[#E3F2FD]" : "bg-[#F5F6F8]")}>
                                                <span className="block text-[11px] uppercase tracking-wide text-[#757575]">
                                                    {d.toLocaleDateString(undefined, { weekday: "short" })}
                                                </span>
                                                <span className={cn("block text-[15px] tabular-nums", isToday ? "text-[#1976D2] font-medium" : "text-[#212121]")}>
                                                    {d.getDate()}
                                                </span>
                                            </div>
                                            <div className="p-1.5 flex flex-col gap-1">
                                                {items.length === 0 ? (
                                                    <span className="text-[11.5px] text-[#BDBDBD] text-center py-4">—</span>
                                                ) : items.map((a) => <Pill key={a.id} a={a} />)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {(creating || editing) && options && (
                <ActivityForm
                    activity={editing}
                    options={options}
                    onClose={() => { setCreating(false); setEditing(null); }}
                    onSaved={(msg) => { setCreating(false); setEditing(null); say(msg); void load(); void loadMeta(); }}
                    token={token || ""}
                    tr={tr}
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

/* ── create / edit ───────────────────────────────────────────────────────── */

function ActivityForm({ activity, options, onClose, onSaved, token, tr }: {
    activity: Activity | null;
    options: Options;
    onClose: () => void;
    onSaved: (msg: string) => void;
    token: string;
    tr: (k: string, v?: Record<string, string | number>) => string;
}) {
    const editingExisting = !!activity;
    const initial = activity ? new Date(activity.starts_at) : new Date(Date.now() + 60 * 60 * 1000);

    const [title, setTitle] = useState(activity?.title || "");
    const [type, setType] = useState(activity?.activity_type || "call");
    const [date, setDate] = useState(ymd(initial));
    const [time, setTime] = useState(`${pad(initial.getHours())}:${pad(initial.getMinutes())}`);
    const [duration, setDuration] = useState(activity?.duration_minutes ?? 30);
    // One "Related To" control, because the row shows one value. Encoded as "kind:id" so the
    // two foreign keys stay mutually exclusive by construction rather than by validation.
    const [related, setRelated] = useState(
        activity?.related_type === "candidate" ? `candidate:${activity.related_id}`
        : activity?.related_type === "job" ? `job:${activity.related_id}` : ""
    );
    const [assignees, setAssignees] = useState<string[]>(activity?.assignees.map((a) => a.id) || []);
    const [notes, setNotes] = useState(activity?.notes || "");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");
    const titleRef = useAutoFocus<HTMLInputElement>();

    const save = async () => {
        if (!title.trim()) { setErr(tr("activities.titleRequired")); return; }
        setSaving(true);
        setErr("");
        try {
            const [kind, id] = related ? related.split(":") : ["", ""];
            const body = {
                title: title.trim(),
                activity_type: type,
                notes: notes.trim() || null,
                // Built from the local date+time fields, so what the user typed is what is stored.
                starts_at: new Date(`${date}T${time}`).toISOString(),
                duration_minutes: Number(duration),
                candidate_id: kind === "candidate" ? id : null,
                job_requirement_id: kind === "job" ? id : null,
                assignee_ids: assignees,
            };
            const res = await fetch(
                `${BACKEND_URL}/api/v1/enterprise/activities${editingExisting ? `/${activity!.id}` : ""}`,
                {
                    method: editingExisting ? "PATCH" : "POST",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                }
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok) { setErr(typeof data.detail === "string" ? data.detail : tr("activities.saveFailed")); return; }
            onSaved(editingExisting ? tr("activities.updated") : tr("activities.created"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div role="presentation" className="fixed inset-0 z-[210] flex items-center justify-center px-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/45" />
            <div role="presentation" className="relative w-full max-w-[560px] max-h-[90vh] overflow-y-auto bg-white rounded-[4px] border border-[#E0E0E0] shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
                 onClick={(e) => e.stopPropagation()}>
                <div className="px-5 h-[52px] bg-[#1976D2] text-white flex items-center justify-between shrink-0">
                    <h3 className="text-[16px] font-medium">
                        {editingExisting ? tr("activities.editTitle") : tr("activities.create")}
                    </h3>
                    <button type="button" onClick={onClose} aria-label={tr("activities.close")}
                            className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center">
                        <Icon name="close" className="text-[20px]" />
                    </button>
                </div>

                <div className="p-5 flex flex-col gap-3">
                    {err && <p className="text-[12.5px] text-[#C62828] bg-[#FFEBEE] rounded-[4px] px-3 py-2">{err}</p>}

                    <label className="flex flex-col gap-1">
                        <span className="text-[12px] text-[#616161]">{tr("activities.colTitle")}</span>
                        <input ref={titleRef} className={CONTROL} value={title} placeholder={tr("activities.titlePlaceholder")}
                               onChange={(e) => setTitle(e.target.value)} />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1">
                            <span className="text-[12px] text-[#616161]">{tr("activities.colType")}</span>
                            <select className={CONTROL} value={type} onChange={(e) => setType(e.target.value)}>
                                {options.types.map((t) => <option key={t} value={t}>{tr(`activities.type_${t}`)}</option>)}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-[12px] text-[#616161]">{tr("activities.colDuration")}</span>
                            <select className={CONTROL} value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                                {[15, 30, 45, 60, 90, 120].map((n) => (
                                    <option key={n} value={n}>{tr("activities.nMinutes", { count: n })}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1">
                            <span className="text-[12px] text-[#616161]">{tr("activities.colDate")}</span>
                            <input type="date" className={CONTROL} value={date} onChange={(e) => setDate(e.target.value)} />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-[12px] text-[#616161]">{tr("activities.colTime")}</span>
                            <input type="time" className={CONTROL} value={time} onChange={(e) => setTime(e.target.value)} />
                        </label>
                    </div>

                    <label className="flex flex-col gap-1">
                        <span className="text-[12px] text-[#616161]">{tr("activities.colRelated")}</span>
                        <select className={CONTROL} value={related} onChange={(e) => setRelated(e.target.value)}>
                            <option value="">{tr("activities.relatedOther")}</option>
                            <optgroup label={tr("activities.candidates")}>
                                {options.candidates.map((c) => <option key={c.id} value={`candidate:${c.id}`}>{c.name}</option>)}
                            </optgroup>
                            <optgroup label={tr("activities.jobs")}>
                                {options.jobs.map((j) => <option key={j.id} value={`job:${j.id}`}>{j.title}</option>)}
                            </optgroup>
                        </select>
                    </label>

                    <div className="flex flex-col gap-1">
                        <span className="text-[12px] text-[#616161]">{tr("activities.colAssignees")}</span>
                        <div className="flex flex-wrap gap-1.5">
                            {options.users.map((u) => {
                                const on = assignees.includes(u.id);
                                return (
                                    <button
                                        key={u.id}
                                        type="button"
                                        onClick={() => setAssignees((a) => (on ? a.filter((x) => x !== u.id) : [...a, u.id]))}
                                        className={cn(
                                            "px-2.5 h-8 rounded-[4px] text-[12.5px] border transition-colors",
                                            on ? "bg-[#E3F2FD] border-[#1976D2] text-[#1976D2]" : "bg-white border-[#E0E0E0] text-[#616161] hover:bg-[#F5F6F8]"
                                        )}
                                    >
                                        {u.name}
                                    </button>
                                );
                            })}
                            {options.users.length === 0 && (
                                <span className="text-[12.5px] text-[#9E9E9E]">{tr("activities.noTeam")}</span>
                            )}
                        </div>
                    </div>

                    <label className="flex flex-col gap-1">
                        <span className="text-[12px] text-[#616161]">{tr("activities.notes")}</span>
                        <textarea className={cn(CONTROL, "h-20 py-2 resize-none")} value={notes}
                                  placeholder={tr("activities.notesPlaceholder")} onChange={(e) => setNotes(e.target.value)} />
                    </label>

                    <div className="flex items-center justify-end gap-2 pt-1">
                        <Button size="sm" variant="ghost" onClick={onClose}>{tr("activities.cancel")}</Button>
                        <Button size="sm" icon="check" disabled={saving || !title.trim()} onClick={() => void save()}>
                            {saving ? tr("activities.saving") : editingExisting ? tr("activities.save") : tr("activities.create")}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
