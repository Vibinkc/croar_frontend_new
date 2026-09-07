"use client";

import React, { useMemo, useState } from "react";
import { useI18n } from "@/context/I18nContext";
import { Card, EmptyState, StatCard, StatGrid, cn, jetbrainsMono } from "@/components/ds";

interface Stage {
    id: number;
    name: string;
}

interface Application {
    id: string;
    current_stage: number;
    ai_match_score?: number;
    applied_at?: string;
}

/** Match-score bands. Ordered strongest first so the chart reads top-down as quality. */
const SCORE_BANDS: { key: string; min: number; max: number; bar: string }[] = [
    { key: "strong", min: 80, max: 101, bar: "from-[#5AC8A8] to-[#2E7D32]" },
    { key: "good", min: 60, max: 80, bar: "from-[#42A5F5] to-[#1976D2]" },
    { key: "fair", min: 40, max: 60, bar: "from-[#F0B357] to-[#EF6C00]" },
    { key: "weak", min: 0, max: 40, bar: "from-[#F08A8C] to-[#C62828]" },
];

/**
 * Per-job reporting, derived entirely from the applications the page already loaded — no extra
 * request. That keeps the tab instant, and keeps this file honest: it reports only what the
 * pipeline actually knows. (Notably there is no `source` field on an application, so there is
 * deliberately no "where did they come from" chart here — it would have to be invented.)
 */
export default function JobReportsTab({
    stages,
    applications,
}: {
    stages: Stage[];
    applications: Application[];
}) {
    const { t: tr } = useI18n();

    // "Now" is captured ONCE, in a lazy state initializer, rather than read inside the memo.
    // Calling Date.now() during the memo would make the 30-day window shift on every re-render;
    // pinning it means the figure stays stable for as long as the tab is open.
    const [now] = useState(() => Date.now());

    const report = useMemo(() => {
        const total = applications.length;

        const byStage = stages.map(stage => ({
            id: stage.id,
            name: stage.name,
            count: applications.filter(a => a.current_stage === stage.id).length,
        }));

        // Applications whose current_stage matches no configured stage — usually brand new, or a
        // stage deleted from the pipeline after the fact. Called out rather than silently dropped
        // from the totals.
        const stageIds = new Set(stages.map(s => s.id));
        const unassigned = applications.filter(a => !stageIds.has(a.current_stage)).length;

        const scored = applications.filter(a => typeof a.ai_match_score === "number");
        const avgFit = scored.length
            ? Math.round(scored.reduce((sum, a) => sum + (a.ai_match_score || 0), 0) / scored.length)
            : null;

        const bands = SCORE_BANDS.map(band => ({
            ...band,
            count: scored.filter(a => {
                const s = a.ai_match_score as number;
                return s >= band.min && s < band.max;
            }).length,
        }));
        const unscored = total - scored.length;

        const recent = applications.filter(a => {
            if (!a.applied_at) return false;
            const t = new Date(a.applied_at).getTime();
            return !Number.isNaN(t) && now - t <= 30 * 24 * 3600 * 1000;
        }).length;

        // The deepest stage that still has anyone in it — a one-glance answer to "how far along
        // is this role?".
        const furthest = [...byStage].reverse().find(s => s.count > 0);

        return { total, byStage, unassigned, avgFit, bands, unscored, recent, furthest };
    }, [stages, applications, now]);

    if (report.total === 0) {
        return (
            <Card padding="none" className="animate-in fade-in duration-500">
                <EmptyState
                    icon="monitoring"
                    tone="muted"
                    title={tr("jobReports.emptyTitle")}
                    description={tr("jobReports.emptyDesc")}
                />
            </Card>
        );
    }

    const peak = Math.max(1, ...report.byStage.map(s => s.count));
    const scoredTotal = report.total - report.unscored;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StatGrid>
                <StatCard
                    label={tr("jobReports.totalApplicants")}
                    value={report.total}
                    icon="group"
                    gradient="linear-gradient(135deg,#42A5F5,#1976D2)"
                />
                <StatCard
                    label={tr("jobReports.last30Days")}
                    value={report.recent}
                    icon="trending_up"
                    gradient="linear-gradient(135deg,#5AC8A8,#2E7D32)"
                    glow="rgba(46,125,50,0.26)"
                />
                <StatCard
                    label={tr("jobReports.avgFit")}
                    value={report.avgFit === null ? "—" : `${report.avgFit}%`}
                    icon="target"
                    gradient="linear-gradient(135deg,#F0B357,#EF6C00)"
                    glow="rgba(239,108,0,0.26)"
                />
                <StatCard
                    label={tr("jobReports.furthestStage")}
                    value={report.furthest?.name || "—"}
                    icon="flag"
                    gradient="linear-gradient(135deg,#6E8BFF,#1565C0)"
                    glow="rgba(21,101,192,0.26)"
                />
            </StatGrid>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Funnel — one bar per stage, scaled against the busiest stage so the shape of the
                    drop-off stays readable even when the numbers are small. */}
                <Card className="lg:col-span-3">
                    <h3 className="text-[15px] font-bold text-[#212121]">{tr("jobReports.funnelTitle")}</h3>
                    <p className="text-[12.5px] text-[#757575] mt-0.5 mb-5">{tr("jobReports.funnelSubtitle")}</p>

                    <ul className="space-y-3.5">
                        {report.byStage.map(stage => {
                            const pct = Math.round((stage.count / report.total) * 100);
                            return (
                                <li key={stage.id}>
                                    <div className="flex items-baseline justify-between gap-3 mb-1.5">
                                        <span className="text-[12.5px] font-semibold text-[#424242] truncate">
                                            {stage.name}
                                        </span>
                                        <span className="text-[11.5px] text-[#757575] shrink-0 tabular-nums">
                                            <span
                                                className={cn(
                                                    "text-[13px] font-bold text-[#212121]",
                                                    jetbrainsMono.className
                                                )}
                                            >
                                                {stage.count}
                                            </span>{" "}
                                            · {pct}%
                                        </span>
                                    </div>
                                    <div className="h-2 rounded-full bg-[#EEEEEE] overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-[#42A5F5] to-[#1976D2] transition-[width] duration-500"
                                            style={{ width: `${Math.round((stage.count / peak) * 100)}%` }}
                                        />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    {report.unassigned > 0 && (
                        <p className="mt-5 pt-4 border-t border-[#EEEEEE] text-[11.5px] text-[#757575]">
                            {tr("jobReports.unassignedNote", { count: report.unassigned })}
                        </p>
                    )}
                </Card>

                <Card className="lg:col-span-2">
                    <h3 className="text-[15px] font-bold text-[#212121]">{tr("jobReports.qualityTitle")}</h3>
                    <p className="text-[12.5px] text-[#757575] mt-0.5 mb-5">{tr("jobReports.qualitySubtitle")}</p>

                    {scoredTotal === 0 ? (
                        <p className="py-6 text-center text-[12.5px] text-[#757575]">
                            {tr("jobReports.noScores")}
                        </p>
                    ) : (
                        <ul className="space-y-3.5">
                            {report.bands.map(band => {
                                const pct = Math.round((band.count / scoredTotal) * 100);
                                return (
                                    <li key={band.key}>
                                        <div className="flex items-baseline justify-between gap-3 mb-1.5">
                                            <span className="text-[12.5px] font-semibold text-[#424242]">
                                                {tr(`jobReports.band.${band.key}`)}
                                            </span>
                                            <span
                                                className={cn(
                                                    "text-[13px] font-bold text-[#212121] tabular-nums",
                                                    jetbrainsMono.className
                                                )}
                                            >
                                                {band.count}
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full bg-[#EEEEEE] overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full bg-gradient-to-r transition-[width] duration-500",
                                                    band.bar
                                                )}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {report.unscored > 0 && (
                        <p className="mt-5 pt-4 border-t border-[#EEEEEE] text-[11.5px] text-[#757575]">
                            {tr("jobReports.unscoredNote", { count: report.unscored })}
                        </p>
                    )}
                </Card>
            </div>
        </div>
    );
}
