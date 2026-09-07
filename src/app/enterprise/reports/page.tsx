"use client";

/**
 * Reports — recruitment analytics across every job.
 *
 * Croar already reported per job. This is the company view Manatal puts under Settings &
 * Analytics: how hiring is going overall, where candidates come from, and where the pipeline
 * leaks.
 *
 * The page is deliberate about its gaps. Time-to-hire, offer acceptance and cost-per-hire are
 * NOT shown, because nothing in the schema records an offer, a hire date or a cost — and a
 * plausible-looking number derived from none of those is worse than a blank, since it ends up
 * in a board deck. The API names them in `not_reported` and the page prints that list, so the
 * absence reads as a decision rather than an oversight.
 *
 * Charts are drawn with divs rather than a charting library: the shapes here are bars and a
 * sparkline, and a 90KB dependency to draw a bar is a dependency to keep patched forever.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Badge, Button, EmptyState, Icon, PageHeader, cn } from "@/components/ds";

interface Report {
    window_days: number;
    generated_at: string;
    totals: { jobs: number; open_jobs: number; candidates: number; applications: number };
    funnel: { stage: number; count: number }[];
    max_stage: number;
    sources: { source: string; applications: number; avg_match_score: number | null }[];
    quality: { band: string; min: number; max: number; count: number }[];
    scored_applications: number;
    trend: { week: string; count: number }[];
    jobs: {
        job_id: string; title: string; department?: string | null; status?: string | null;
        open: boolean; headcount: number; applications: number;
        avg_match_score: number | null; furthest_stage: number | null;
    }[];
    not_reported: string[];
}

const BAND_COLOR: Record<string, string> = {
    strong: "#2E7D32", good: "#1976D2", fair: "#EF6C00", weak: "#C62828",
};

function Panel({ title, hint, children, className }: {
    title: string; hint?: string; children: React.ReactNode; className?: string;
}) {
    return (
        <section className={cn("bg-white border border-[#E0E0E0] rounded-[4px] overflow-hidden", className)}>
            <header className="px-4 py-2.5 bg-[#F5F6F8] border-b border-[#E0E0E0] flex items-baseline justify-between gap-3">
                <h3 className="text-[13px] font-medium text-[#212121]">{title}</h3>
                {hint && <span className="text-[11.5px] text-[#757575]">{hint}</span>}
            </header>
            <div className="p-4">{children}</div>
        </section>
    );
}

function Bar({ label, value, max, color, note }: {
    label: string; value: number; max: number; color: string; note?: string;
}) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="flex items-center gap-3 py-1.5">
            <span className="w-[132px] shrink-0 text-[12.5px] text-[#424242] truncate" title={label}>{label}</span>
            <span className="flex-1 h-5 bg-[#F5F6F8] rounded-[3px] overflow-hidden min-w-0">
                <span className="block h-full rounded-[3px] transition-all" style={{ width: `${pct}%`, background: color }} />
            </span>
            <span className="w-16 shrink-0 text-right text-[12.5px] text-[#212121] tabular-nums">{value}</span>
            {note !== undefined && (
                <span className="w-16 shrink-0 text-right text-[11.5px] text-[#757575] tabular-nums">{note}</span>
            )}
        </div>
    );
}

const SELECT =
    "h-9 px-3 rounded-[4px] border border-[#E0E0E0] bg-white text-[13px] text-[#212121] outline-none focus:border-[#1976D2]";

export default function ReportsPage() {
    const { t: tr } = useI18n();
    const { token, isLoading: authLoading } = useAuth();

    const [days, setDays] = useState(90);
    const [data, setData] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/reports?days=${days}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const body = await res.json();
            if (!res.ok) {
                setError(typeof body.detail === "string" ? body.detail : tr("reports.loadFailed"));
                setData(null);
                return;
            }
            setData(body);
        } catch {
            setError(tr("reports.loadFailed"));
        } finally {
            setLoading(false);
        }
    }, [token, days, tr]);

    useEffect(() => {
        if (!authLoading && token) void load();
    }, [authLoading, token, load]);

    const maxTrend = Math.max(1, ...(data?.trend.map((t) => t.count) ?? [1]));
    const maxSource = Math.max(1, ...(data?.sources.map((s) => s.applications) ?? [1]));
    const maxStage = Math.max(1, ...(data?.funnel.map((f) => f.count) ?? [1]));

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-6">
                <PageHeader
                    title={tr("reports.title")}
                    subtitle={tr("reports.subtitle")}
                    icon="chart-box"
                    actions={
                        <div className="flex items-center gap-2">
                            <label className="text-[12.5px] text-[#616161] flex items-center gap-2">
                                {tr("reports.period")}
                                <select className={SELECT} value={days} onChange={(e) => setDays(Number(e.target.value))}>
                                    {[30, 90, 180, 365].map((d) => (
                                        <option key={d} value={d}>{tr("reports.lastNDays", { count: d })}</option>
                                    ))}
                                </select>
                            </label>
                            <Button size="sm" variant="secondary" icon="refresh" onClick={() => void load()} disabled={loading}>
                                {tr("reports.refresh")}
                            </Button>
                        </div>
                    }
                />
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                {error && (
                    <p className="mb-4 text-[12.5px] text-[#C62828] bg-[#FFEBEE] rounded-[4px] px-3 py-2">{error}</p>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-6 h-6 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                    </div>
                ) : !data ? (
                    <div className="bg-white border border-[#E0E0E0] rounded-[4px]">
                        <EmptyState icon="chart-box" tone="muted" title={tr("reports.emptyTitle")} description={tr("reports.emptyDesc")} />
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {/* headline counts */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {([
                                [tr("reports.openJobs"), data.totals.open_jobs, `${data.totals.jobs} ${tr("reports.totalJobs")}`, "briefcase"],
                                [tr("reports.candidates"), data.totals.candidates, "", "account-group"],
                                [tr("reports.applications"), data.totals.applications, tr("reports.inWindow"), "file-document-outline"],
                                [tr("reports.scored"), data.scored_applications, tr("reports.ofApplications", { count: data.totals.applications }), "star"],
                            ] as [string, number, string, string][]).map(([label, value, sub, icon]) => (
                                <div key={label} className="bg-white border border-[#E0E0E0] rounded-[4px] p-4 flex items-center gap-3">
                                    <span className="w-9 h-9 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center shrink-0">
                                        <Icon name={icon} className="text-[19px]" />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-[20px] font-medium text-[#212121] tabular-nums leading-none">{value}</span>
                                        <span className="block text-[11.5px] text-[#757575] mt-1 truncate">{label}{sub ? ` · ${sub}` : ""}</span>
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="grid lg:grid-cols-2 gap-4 items-start">
                            {/* applications over time */}
                            <Panel title={tr("reports.overTime")} hint={tr("reports.byWeek")}>
                                {data.trend.length === 0 ? (
                                    <p className="text-[12.5px] text-[#757575] py-6 text-center">{tr("reports.noneInPeriod")}</p>
                                ) : (
                                    <div className="flex items-end gap-1 h-[150px]">
                                        {data.trend.map((t) => (
                                            <div key={t.week} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0 group">
                                                <span className="text-[10.5px] text-[#757575] tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {t.count}
                                                </span>
                                                <span
                                                    className="w-full bg-[#1976D2] rounded-t-[2px] min-h-[2px] transition-all"
                                                    style={{ height: `${Math.round((t.count / maxTrend) * 118)}px` }}
                                                    title={`${t.week}: ${t.count}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Panel>

                            {/* pipeline funnel */}
                            <Panel title={tr("reports.funnel")} hint={tr("reports.funnelHint")}>
                                {data.funnel.length === 0 ? (
                                    <p className="text-[12.5px] text-[#757575] py-6 text-center">{tr("reports.noneInPeriod")}</p>
                                ) : (
                                    <div>
                                        {data.funnel.map((f) => (
                                            <Bar
                                                key={f.stage}
                                                label={tr("reports.stageN", { n: f.stage })}
                                                value={f.count}
                                                max={maxStage}
                                                color="#1976D2"
                                            />
                                        ))}
                                        {/* Stage names live per job, so a single shared label set would be a
                                            fiction. Numbering is the honest option and this says why. */}
                                        <p className="text-[11px] text-[#757575] mt-2 pt-2 border-t border-[#EEEEEE] leading-relaxed">
                                            {tr("reports.stagesNote")}
                                        </p>
                                    </div>
                                )}
                            </Panel>

                            {/* sources */}
                            <Panel title={tr("reports.sources")} hint={tr("reports.sourcesHint")}>
                                {data.sources.length === 0 ? (
                                    <p className="text-[12.5px] text-[#757575] py-6 text-center">{tr("reports.noneInPeriod")}</p>
                                ) : (
                                    <div>
                                        <div className="flex items-center gap-3 pb-1.5 mb-1 border-b border-[#EEEEEE] text-[10.5px] uppercase tracking-wide text-[#9E9E9E]">
                                            <span className="w-[132px] shrink-0">{tr("reports.source")}</span>
                                            <span className="flex-1" />
                                            <span className="w-16 text-right">{tr("reports.apps")}</span>
                                            <span className="w-16 text-right">{tr("reports.avgFit")}</span>
                                        </div>
                                        {data.sources.map((s) => (
                                            <Bar
                                                key={s.source}
                                                label={s.source}
                                                value={s.applications}
                                                max={maxSource}
                                                color="#42A5F5"
                                                // A source whose applicants were never scored shows a dash, not
                                                // a zero — zero would read as "this source sends bad people".
                                                note={s.avg_match_score === null ? "—" : `${s.avg_match_score}%`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </Panel>

                            {/* match quality */}
                            <Panel
                                title={tr("reports.quality")}
                                hint={tr("reports.qualityHint", { count: data.scored_applications })}
                            >
                                {data.scored_applications === 0 ? (
                                    <p className="text-[12.5px] text-[#757575] py-6 text-center">{tr("reports.noneScored")}</p>
                                ) : (
                                    data.quality.map((q) => (
                                        <Bar
                                            key={q.band}
                                            label={`${tr(`reports.band_${q.band}`)} (${q.min}–${q.max === 101 ? 100 : q.max})`}
                                            value={q.count}
                                            max={Math.max(1, ...data.quality.map((x) => x.count))}
                                            color={BAND_COLOR[q.band] || "#757575"}
                                        />
                                    ))
                                )}
                            </Panel>
                        </div>

                        {/* per-job table */}
                        <Panel title={tr("reports.byJob")} hint={tr("reports.allTime")}>
                            {data.jobs.length === 0 ? (
                                <p className="text-[12.5px] text-[#757575] py-6 text-center">{tr("reports.noJobs")}</p>
                            ) : (
                                <div className="overflow-x-auto -mx-4 px-4">
                                    <table className="w-full border-collapse min-w-[640px]">
                                        <thead>
                                            <tr className="text-[10.5px] uppercase tracking-wide text-[#9E9E9E] border-b border-[#E0E0E0]">
                                                <th className="text-left font-medium py-2">{tr("reports.job")}</th>
                                                <th className="text-left font-medium py-2">{tr("reports.department")}</th>
                                                <th className="text-left font-medium py-2">{tr("reports.status")}</th>
                                                <th className="text-right font-medium py-2">{tr("reports.headcount")}</th>
                                                <th className="text-right font-medium py-2">{tr("reports.apps")}</th>
                                                <th className="text-right font-medium py-2">{tr("reports.avgFit")}</th>
                                                <th className="text-right font-medium py-2">{tr("reports.furthest")}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#EEEEEE]">
                                            {data.jobs.map((j) => (
                                                <tr key={j.job_id} className="hover:bg-[#FAFAFA] transition-colors">
                                                    <td className="py-2.5 pr-3">
                                                        <Link href={`/enterprise/jobs/${j.job_id}`} className="text-[13px] text-[#1976D2] hover:underline">
                                                            {j.title}
                                                        </Link>
                                                    </td>
                                                    <td className="py-2.5 pr-3 text-[12.5px] text-[#616161]">{j.department || "—"}</td>
                                                    <td className="py-2.5 pr-3">
                                                        <Badge tone={j.open ? "success" : "neutral"}>{j.status || "—"}</Badge>
                                                    </td>
                                                    <td className="py-2.5 text-right text-[12.5px] text-[#424242] tabular-nums">{j.headcount}</td>
                                                    <td className="py-2.5 text-right text-[12.5px] text-[#212121] tabular-nums">{j.applications}</td>
                                                    <td className="py-2.5 text-right text-[12.5px] text-[#424242] tabular-nums">
                                                        {j.avg_match_score === null ? "—" : `${j.avg_match_score}%`}
                                                    </td>
                                                    <td className="py-2.5 text-right text-[12.5px] text-[#424242] tabular-nums">
                                                        {j.furthest_stage === null ? "—" : j.furthest_stage}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Panel>

                        {/* What is deliberately absent, and why. */}
                        <div className="bg-white border border-[#E0E0E0] rounded-[4px] px-4 py-3 flex items-start gap-2.5">
                            <Icon name="information" className="text-[18px] text-[#757575] shrink-0 mt-0.5" />
                            <p className="text-[12px] text-[#616161] leading-relaxed">
                                {tr("reports.notReported")}{" "}
                                <span className="text-[#424242]">
                                    {data.not_reported.map((k) => tr(`reports.metric_${k}`)).join(", ")}
                                </span>
                                . {tr("reports.notReportedWhy")}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
