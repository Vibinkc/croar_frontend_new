"use client";

/**
 * Reports — Manatal's catalogue, not a dashboard.
 *
 * Theirs is a hub of four categories (Candidates, Jobs, Hiring Performance, Leaderboard), each
 * listing individually named reports you pick from. That shape is the feature: a recruiter opens
 * Reports to answer one question, not to browse a wall of charts. The first version of this page
 * was a single dashboard, which is a different product.
 *
 * Three levels, with a breadcrumb like theirs: categories → the reports in one → one report.
 *
 * Reports Croar cannot produce are still listed, greyed, with the reason on the card. That is
 * deliberate: a catalogue containing only the possible reports looks complete, where one that
 * names its gaps tells you what adding a `referrer` column would actually buy.
 */

import { useCallback, useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { EmptyState, Icon, PageHeader, cn } from "@/components/ds";

interface ReportMeta {
    id: string;
    category: string;
    section: string;
    name: string;
    description?: string;
    unavailable?: string;
    available: boolean;
}
interface Category { id: string; name: string; description: string }

interface RunResult {
    id: string;
    name: string;
    kind: "series" | "bars" | "grouped" | "table" | "ratios" | "single";
    rows?: { label?: string; value?: number; period?: string; cells?: (string | number)[];
             from?: number; to?: number; percent?: number | null }[];
    columns?: string[];
    value?: number | null;
    unit?: string;
    sample?: number;
    approximate?: boolean;
    window_days: number;
}

const CATEGORY_ICON: Record<string, string> = {
    candidates: "account-group", jobs: "briefcase",
    hiring: "chart-timeline-variant", leaderboard: "podium",
};

const PALETTE = ["#1976D2", "#2E7D32", "#EF6C00", "#42A5F5", "#C62828", "#757575", "#0D47A1", "#66BB6A"];

const CONTROL =
    "h-9 px-3 rounded-[4px] border border-[#E0E0E0] bg-white text-[13px] text-[#212121] outline-none focus:border-[#1976D2]";

function Bar({ label, value, max, color, suffix }: {
    label: string; value: number; max: number; color: string; suffix?: string;
}) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="flex items-center gap-3 py-1.5">
            <span className="w-[190px] shrink-0 text-[12.5px] text-[#424242] truncate" title={label}>{label}</span>
            <span className="flex-1 h-5 bg-[#F5F6F8] rounded-[3px] overflow-hidden min-w-0">
                <span className="block h-full rounded-[3px]" style={{ width: `${pct}%`, background: color }} />
            </span>
            <span className="w-20 shrink-0 text-right text-[12.5px] text-[#212121] tabular-nums">
                {value}{suffix || ""}
            </span>
        </div>
    );
}

export default function ReportsPage() {
    const { t: tr } = useI18n();
    const { token, isLoading: authLoading } = useAuth();

    const [categories, setCategories] = useState<Category[]>([]);
    const [reports, setReports] = useState<ReportMeta[]>([]);
    const [category, setCategory] = useState<string | null>(null);
    const [report, setReport] = useState<ReportMeta | null>(null);
    const [result, setResult] = useState<RunResult | null>(null);
    const [days, setDays] = useState(180);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState("");

    const loadCatalogue = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/reports`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                setError(tr("reports.loadFailed"));
                return;
            }
            const d = await res.json();
            setCategories(d.categories || []);
            setReports(d.reports || []);
        } catch {
            setError(tr("reports.loadFailed"));
        } finally {
            setLoading(false);
        }
    }, [token, tr]);

    useEffect(() => {
        if (!authLoading && token) void loadCatalogue();
    }, [authLoading, token, loadCatalogue]);

    const run = useCallback(async (meta: ReportMeta, window = days) => {
        if (!token) return;
        setReport(meta);
        setResult(null);
        setError("");
        setRunning(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/reports/run/${meta.id}?days=${window}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const body = await res.json();
            if (!res.ok) {
                // 409 carries the schema reason; showing it beats a generic failure, because it
                // tells the reader what would have to change for the report to exist.
                setError(typeof body.detail === "string" ? body.detail : tr("reports.runFailed"));
                return;
            }
            setResult(body);
        } catch {
            setError(tr("reports.runFailed"));
        } finally {
            setRunning(false);
        }
    }, [token, days, tr]);

    const inCategory = reports.filter((r) => r.category === category);
    const sections = Array.from(new Set(inCategory.map((r) => r.section)));

    /* ── one report's output ─────────────────────────────────────────────── */
    const renderResult = () => {
        if (!result) return null;
        const rows = result.rows || [];

        if (result.kind === "single") {
            return (
                <div className="py-8 text-center">
                    <p className="text-[44px] font-medium text-[#212121] tabular-nums leading-none">
                        {result.value === null || result.value === undefined ? "—" : result.value}
                        {result.value !== null && result.value !== undefined && (
                            <span className="text-[18px] text-[#757575] ml-2">{result.unit}</span>
                        )}
                    </p>
                    <p className="text-[12.5px] text-[#757575] mt-3">
                        {tr("reports.basedOn", { count: result.sample ?? 0 })}
                    </p>
                    {result.approximate && (
                        // Said rather than implied: this is derived from when the row last
                        // changed, not from a recorded hire date.
                        <p className="text-[11.5px] text-[#EF6C00] mt-2">{tr("reports.approximate")}</p>
                    )}
                </div>
            );
        }

        if (result.kind === "table") {
            return rows.length === 0 ? (
                <p className="py-8 text-center text-[12.5px] text-[#757575]">{tr("reports.noData")}</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[560px]">
                        <thead>
                            <tr className="border-b border-[#E0E0E0]">
                                {(result.columns || []).map((c) => (
                                    <th key={c} className="text-left py-2 px-2 text-[11px] uppercase tracking-wide text-[#757575] font-medium">{c}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EEEEEE]">
                            {rows.map((r, i) => (
                                <tr key={i} className="hover:bg-[#FAFAFA]">
                                    {(r.cells || []).map((c, j) => (
                                        <td key={j} className="py-2 px-2 text-[12.5px] text-[#424242]">{c}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        if (result.kind === "ratios") {
            return rows.length === 0 ? (
                <p className="py-8 text-center text-[12.5px] text-[#757575]">{tr("reports.noData")}</p>
            ) : (
                <div>
                    {rows.map((r, i) => (
                        <div key={i} className="flex items-center gap-3 py-2 border-b border-[#EEEEEE] last:border-b-0">
                            <span className="w-[210px] shrink-0 text-[12.5px] text-[#424242]">{r.label}</span>
                            <span className="flex-1 h-5 bg-[#F5F6F8] rounded-[3px] overflow-hidden min-w-0">
                                <span className="block h-full rounded-[3px] bg-[#1976D2]"
                                      style={{ width: `${Math.min(100, r.percent ?? 0)}%` }} />
                            </span>
                            <span className="w-16 text-right text-[13px] text-[#212121] tabular-nums">
                                {r.percent === null || r.percent === undefined ? "—" : `${r.percent}%`}
                            </span>
                            <span className="w-24 text-right text-[11.5px] text-[#757575] tabular-nums">
                                {r.to} / {r.from}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }

        if (result.kind === "grouped") {
            // Two dimensions (job × status, source × status). Grouped by the first, so each
            // group reads as a small stacked breakdown rather than one undifferentiated bar.
            const groups = Array.from(new Set(rows.map((r) => r.period || "")));
            const labels = Array.from(new Set(rows.map((r) => r.label || "")));
            const colour = (l: string) => PALETTE[labels.indexOf(l) % PALETTE.length];
            const maxTotal = Math.max(1, ...groups.map((g) =>
                rows.filter((r) => r.period === g).reduce((a, r) => a + (r.value || 0), 0)));
            return groups.length === 0 ? (
                <p className="py-8 text-center text-[12.5px] text-[#757575]">{tr("reports.noData")}</p>
            ) : (
                <div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                        {labels.map((l) => (
                            <span key={l} className="inline-flex items-center gap-1.5 text-[11.5px] text-[#616161]">
                                <span className="w-2.5 h-2.5 rounded-[2px]" style={{ background: colour(l) }} />
                                {l}
                            </span>
                        ))}
                    </div>
                    {groups.map((g) => {
                        const mine = rows.filter((r) => r.period === g);
                        const total = mine.reduce((a, r) => a + (r.value || 0), 0);
                        return (
                            <div key={g} className="flex items-center gap-3 py-1.5">
                                <span className="w-[190px] shrink-0 text-[12.5px] text-[#424242] truncate" title={g}>{g}</span>
                                <span className="flex-1 h-5 bg-[#F5F6F8] rounded-[3px] overflow-hidden flex min-w-0"
                                      style={{ maxWidth: `${Math.round((total / maxTotal) * 100)}%` }}>
                                    {mine.map((r) => (
                                        <span key={r.label} title={`${r.label}: ${r.value}`}
                                              style={{ width: `${(r.value! / total) * 100}%`, background: colour(r.label || "") }} />
                                    ))}
                                </span>
                                <span className="w-16 shrink-0 text-right text-[12.5px] text-[#212121] tabular-nums">{total}</span>
                            </div>
                        );
                    })}
                </div>
            );
        }

        // series and bars
        const max = Math.max(1, ...rows.map((r) => r.value || 0));
        return rows.length === 0 ? (
            <p className="py-8 text-center text-[12.5px] text-[#757575]">{tr("reports.noData")}</p>
        ) : (
            <div>
                {rows.map((r, i) => (
                    <Bar key={`${r.label}-${i}`} label={r.label || "—"} value={r.value || 0} max={max}
                         color={result.kind === "series" ? "#1976D2" : PALETTE[i % PALETTE.length]} />
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-6">
                <PageHeader
                    title={tr("reports.title")}
                    subtitle={tr("reports.subtitle")}
                    icon="leaderboard"
                    actions={
                        report && (
                            <label className="text-[12.5px] text-[#616161] flex items-center gap-2">
                                {tr("reports.period")}
                                <select className={CONTROL} value={days}
                                        onChange={(e) => { const d = Number(e.target.value); setDays(d); if (report) void run(report, d); }}>
                                    {[30, 90, 180, 365, 730].map((d) => (
                                        <option key={d} value={d}>{tr("reports.lastNDays", { count: d })}</option>
                                    ))}
                                </select>
                            </label>
                        )
                    }
                />
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                {/* breadcrumb, like theirs */}
                {(category || report) && (
                    <nav className="flex items-center gap-1.5 mb-4 text-[12.5px]">
                        <button type="button" className="text-[#1976D2] hover:underline"
                                onClick={() => { setCategory(null); setReport(null); setResult(null); setError(""); }}>
                            {tr("reports.title")}
                        </button>
                        {category && (
                            <>
                                <Icon name="chevron-right" className="text-[15px] text-[#BDBDBD]" />
                                <button type="button" className={cn(report ? "text-[#1976D2] hover:underline" : "text-[#616161]")}
                                        onClick={() => { setReport(null); setResult(null); setError(""); }}>
                                    {categories.find((c) => c.id === category)?.name}
                                </button>
                            </>
                        )}
                        {report && (
                            <>
                                <Icon name="chevron-right" className="text-[15px] text-[#BDBDBD]" />
                                <span className="text-[#616161]">{report.name}</span>
                            </>
                        )}
                    </nav>
                )}

                {error && (
                    <div className="mb-4 flex items-start gap-2 bg-[#FFF3E0] border border-[#FFE0B2] rounded-[4px] px-3 py-2.5">
                        <Icon name="information" className="text-[18px] text-[#EF6C00] shrink-0" />
                        <p className="text-[12.5px] text-[#8A5A05] leading-relaxed">{error}</p>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-6 h-6 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                    </div>
                ) : report ? (
                    /* ── one report ─────────────────────────────────────────── */
                    <section className="bg-white border border-[#E0E0E0] rounded-[4px] overflow-hidden">
                        <header className="px-4 py-3 bg-[#F5F6F8] border-b border-[#E0E0E0]">
                            <h2 className="text-[14px] font-medium text-[#212121]">{report.name}</h2>
                            {report.description && <p className="text-[12px] text-[#757575] mt-0.5">{report.description}</p>}
                        </header>
                        <div className="p-4">
                            {running ? (
                                <div className="flex justify-center py-16">
                                    <div className="w-6 h-6 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                                </div>
                            ) : renderResult()}
                        </div>
                    </section>
                ) : category ? (
                    /* ── the reports in one category ────────────────────────── */
                    <div className="flex flex-col gap-5">
                        {sections.map((section) => (
                            <div key={section}>
                                <h2 className="text-[13px] font-medium text-[#212121] mb-2">{section}</h2>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {inCategory.filter((r) => r.section === section).map((r) => (
                                        <button
                                            key={r.id}
                                            type="button"
                                            disabled={!r.available}
                                            onClick={() => void run(r)}
                                            title={r.unavailable}
                                            className={cn(
                                                "text-left bg-white border rounded-[4px] p-4 transition-colors",
                                                r.available
                                                    ? "border-[#E0E0E0] hover:border-[#1976D2] hover:bg-[#FAFCFE] cursor-pointer"
                                                    : "border-[#EEEEEE] bg-[#FAFAFA] cursor-not-allowed"
                                            )}
                                        >
                                            <span className="flex items-start gap-2">
                                                <Icon name={r.available ? "chart-bar" : "lock"}
                                                      className={cn("text-[19px] shrink-0 mt-0.5", r.available ? "text-[#1976D2]" : "text-[#BDBDBD]")} />
                                                <span className="min-w-0">
                                                    <span className={cn("block text-[13.5px] font-medium", r.available ? "text-[#212121]" : "text-[#9E9E9E]")}>
                                                        {r.name}
                                                    </span>
                                                    <span className="block text-[12px] text-[#757575] mt-1 leading-relaxed">
                                                        {r.description || r.unavailable}
                                                    </span>
                                                </span>
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : categories.length === 0 ? (
                    <div className="bg-white border border-[#E0E0E0] rounded-[4px]">
                        <EmptyState icon="chart-box" tone="muted" title={tr("reports.emptyTitle")} description={tr("reports.emptyDesc")} />
                    </div>
                ) : (
                    /* ── the four categories ────────────────────────────────── */
                    <div className="grid sm:grid-cols-2 gap-4 max-w-[900px]">
                        {categories.map((c) => {
                            const all = reports.filter((r) => r.category === c.id);
                            const ok = all.filter((r) => r.available).length;
                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setCategory(c.id)}
                                    className="text-left bg-white border border-[#E0E0E0] rounded-[4px] p-5 flex items-center gap-4 hover:border-[#1976D2] hover:bg-[#FAFCFE] transition-colors"
                                >
                                    <span className="w-12 h-12 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center shrink-0">
                                        <Icon name={CATEGORY_ICON[c.id] || "chart-bar"} className="text-[26px]" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-[15px] font-medium text-[#212121]">{c.name}</span>
                                        <span className="block text-[12.5px] text-[#757575] mt-0.5">{c.description}</span>
                                        {/* Counts, so a category that is entirely unavailable is
                                            obvious before you click into it. */}
                                        <span className="block text-[11.5px] text-[#9E9E9E] mt-1.5 tabular-nums">
                                            {tr("reports.nOfM", { available: ok, total: all.length })}
                                        </span>
                                    </span>
                                    <Icon name="chevron-right" className="text-[20px] text-[#BDBDBD] shrink-0" />
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
