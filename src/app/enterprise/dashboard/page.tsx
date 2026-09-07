"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { JetBrains_Mono } from "next/font/google";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { BACKEND_URL } from "@/utils/api";
import { useCachedFetch } from "@/hooks/useCachedFetch";
import { PageHelp } from "@/components/ds";
import ThemeToggle from "@/components/ThemeToggle";

// JetBrains Mono — the design system's numeric/data typeface for stats & counts.
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const DEFAULT_STATS: Stats = {
    active_jobs: 0,
    total_candidates: 0,
    total_applications: 0,
    interviews_scheduled: 0,
    agent_name: "COMMANDER",
    high_value_matches: 0,
};

interface Stats {
    active_jobs: number;
    total_candidates: number;
    total_applications: number;
    interviews_scheduled: number;
    agent_name: string;
    high_value_matches: number;
}

export default function EnterpriseDashboard() {
    const { user, token, role, canAccess, isLoading: isAuthLoading } = useAuth();
    const { t } = useI18n();
    const [greeting, setGreeting] = useState("");

    // Cached: revisiting the dashboard shows the last stats INSTANTLY, then refreshes
    // in the background instead of blocking on a fresh fetch every time.
    const { data: statsData, isLoading, error, mutate } = useCachedFetch<Stats>(
        token ? `${BACKEND_URL}/api/v1/enterprise/dashboard/stats` : null,
        { token },
    );
    const stats = statsData ?? DEFAULT_STATS;
    // Distinguish a genuine "brand-new org" (loaded, all zeros) from a failed fetch. On error
    // with no cached data we must NOT render the zero-state as if the data really is empty.
    const loadFailed = !!error && !statsData;

    useEffect(() => {
        const hour = new Date().getHours();
        const g = hour < 12 ? "dashboard.greetingMorning" : hour < 18 ? "dashboard.greetingAfternoon" : "dashboard.greetingEvening";
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setGreeting(g);
    }, []);

    const modules = [
        {
            title: t("dashboard.modManageJobs"),
            description: t("dashboard.modManageJobsDesc"),
            icon: "business_center",
            path: "/enterprise/jobs",
            badge: t("dashboard.badgeActive"),
            color: "purple",
            features: ["AI Job Description", "Job Boards", "Hiring Budget"],
            permission: "jobs:read"
        },
        {
            title: t("dashboard.candidates"),
            description: t("dashboard.modCandidatesDesc"),
            icon: "psychology",
            path: "/enterprise/candidates/kanban",
            badge: t("dashboard.badgeAiScreening"),
            color: "indigo",
            features: ["Auto-Sync", "Background Check", "Group Actions"],
            permission: "candidates:read"
        },
        {
            title: t("dashboard.mod360"),
            description: t("dashboard.mod360Desc"),
            icon: "360",
            path: "/enterprise/assessments-360",
            badge: t("dashboard.badgePerformance"),
            color: "emerald",
            features: ["Reports", "Reviews", "Comparisons"],
            permission: "assessments:read"
        },
        {
            title: t("dashboard.modSurveys"),
            description: t("dashboard.modSurveysDesc"),
            icon: "poll",
            path: "/enterprise/surveys",
            badge: t("dashboard.badgeInsights"),
            color: "rose",
            features: ["Engagement", "Culture", "Analytics"],
            permission: "surveys:read"
        }
    ];

    interface ColorClasses {
        border: string;
        bg: string;
        text: string;
        dot: string;
    }

    const getColorClasses = (color: string): ColorClasses => {
        const colors: Record<string, ColorClasses> = {
            indigo: { border: "border-[#BBDEFB]", bg: "bg-[#E3F2FD]", text: "text-[#1976D2]", dot: "bg-[#1976D2]" },
            purple: { border: "border-[#BBDEFB]", bg: "bg-[#E3F2FD]", text: "text-[#1976D2]", dot: "bg-[#1976D2]" },
            rose: { border: "border-[#FFCDD2]", bg: "bg-[#FFEBEE]", text: "text-[#E53935]", dot: "bg-[#E53935]" },
            emerald: { border: "border-[#C8E6C9]", bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]", dot: "bg-[#2E7D32]" },
        };
        return colors[color] || { border: "border-[#E0E0E0]", bg: "bg-[#F5F6F8]", text: "text-[#424242]", dot: "bg-[#757575]" };
    };

    // Pipeline composition for the donut chart (real, live values).
    const pipeline = [
        { name: t("dashboard.pipeCandidates"), value: stats.total_candidates, color: "#1976D2" },
        { name: t("dashboard.pipeApplications"), value: stats.total_applications, color: "#42A5F5" },
        { name: t("dashboard.pipeInterviews"), value: stats.interviews_scheduled, color: "#90CAF9" },
        { name: t("dashboard.pipeRecommended"), value: stats.high_value_matches, color: "#2E7D32" },
    ];
    const pipelineTotal = pipeline.reduce((sum, p) => sum + p.value, 0);

    const statCards = [
        { label: t("dashboard.activeJobs"), value: stats.active_jobs, icon: "work", grad: "linear-gradient(135deg,#42A5F5,#1976D2)", glow: "rgba(25,118,210,0.28)", perm: "jobs:read" },
        { label: t("dashboard.totalCandidates"), value: stats.total_candidates, icon: "groups", grad: "linear-gradient(135deg,#66BB6A,#2E7D32)", glow: "rgba(46,125,50,0.25)", perm: "candidates:read" },
        { label: t("dashboard.applications"), value: stats.total_applications, icon: "conversion_path", grad: "linear-gradient(135deg,#42A5F5,#1565C0)", glow: "rgba(21,101,192,0.25)", perm: "candidates:read" },
        { label: t("dashboard.interviews"), value: stats.interviews_scheduled, icon: "videocam", grad: "linear-gradient(135deg,#FFB74D,#EF6C00)", glow: "rgba(239,108,0,0.25)", perm: "candidates:read" },
    ].filter((s) => canAccess(s.perm));

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex items-center justify-between gap-4">
                {/* Left: title + live status */}
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight">{t("dashboard.title")}</h1>
                        <PageHelp title={t("dashboard.title")}>
                            <p>{t("dashboard.helpP1")}</p>
                            <p>{t("dashboard.helpP2")}</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#757575] mt-0.5">{t("dashboard.subtitle")}</p>
                </div>

                {/* Right: theme toggle. Search lives in the app bar now — two boxes
                    opening the same palette read as one of them being broken. */}
                <div className="flex items-center gap-2.5 shrink-0">
                    <ThemeToggle />
                </div>
            </header>

            {/* Load-failure banner — without this a failed /stats fetch silently falls back to
                all-zeros, making an established org look brand-new. Show it + offer a retry. */}
            {loadFailed && (
                <div className="flex items-center justify-between gap-4 rounded-[4px] border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="material-symbols-rounded text-[#E53935]">error</span>
                        <div className="min-w-0">
                            <p className="text-[13px] font-bold text-[#212121]">Couldn&apos;t load your dashboard stats</p>
                            <p className="text-[12px] text-[#757575] truncate">The numbers below may be unavailable. Check your connection and try again.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { void mutate(); }}
                        className="shrink-0 px-3 py-1.5 rounded-[4px] bg-[#E53935] text-white text-[12px] font-semibold hover:bg-[#DC2626] transition-colors"
                    >
                        {t("common.retry")}
                    </button>
                </div>
            )}

            {/* Hero band */}
            <section
                className="relative overflow-hidden rounded-[4px] p-7 md:p-9 bg-white border border-[#E0E0E0] shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]"
            >
                {/* Decorative rings */}
                <div className="pointer-events-none absolute -right-20 -top-24 w-80 h-80 rounded-full border border-[#E3F2FD]" />
                <div className="pointer-events-none absolute -right-2 -top-10 w-48 h-48 rounded-full border border-[#F1F8FE]" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-7">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[4px] bg-[#E8F5E9] text-[10px] font-medium text-[#2E7D32] mb-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#66BB6A] animate-pulse"></span>
                            {t("dashboard.liveOverview")}
                        </div>
                        <h1 className="text-[30px] md:text-[38px] font-medium tracking-[-0.5px] leading-[1.05] text-[#212121]">
                            {greeting ? t(greeting) : ""}, <span className="text-[#1976D2]">{isLoading ? 'there' : stats.agent_name}</span>
                        </h1>
                        <p className="text-[#616161] text-[14.5px] leading-relaxed mt-3 max-w-md">
                            {isLoading ? (
                                t("dashboard.loadingSnapshot")
                            ) : (
                                (() => {
                                    const n = stats.high_value_matches;
                                    const parts = t("dashboard.aiRecommended", { count: n }).split(String(n));
                                    return <>{parts[0]}<span className={`text-[#212121] font-medium ${jetbrainsMono.className}`}>{n}</span>{parts.slice(1).join(String(n))}</>;
                                })()
                            )}
                        </p>
                        <div className="flex flex-wrap gap-2.5 mt-6">
                            {canAccess("jobs:read") && (
                                <Link href="/enterprise/croar-pilot" className="h-[44px] px-5 bg-[#1976D2] text-white rounded-[4px] text-[14px] font-semibold hover:bg-[#1565C0] transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.20)] flex items-center gap-2">
                                    <span className="material-symbols-rounded text-[19px]">smart_toy</span>
                                    {t("dashboard.hireWithAI")}
                                </Link>
                            )}
                            {canAccess("jobs:create") && (
                                <Link href="/enterprise/jobs/create" className="h-[44px] px-5 bg-white border border-[#E0E0E0] text-[#1976D2] rounded-[4px] text-[14px] font-medium hover:bg-[#E3F2FD] transition-colors flex items-center gap-2">
                                    <span className="material-symbols-rounded text-[19px]">add_box</span>
                                    {t("dashboard.postNewJob")}
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Stat cards (inside the hero, right side) */}
                    <div className="relative z-10 w-full lg:w-[360px] shrink-0 grid grid-cols-2 gap-3">
                        {statCards.map((s) => (
                            <div key={s.label} className="rounded-[4px] bg-[#FAFAFA] border border-[#E0E0E0] p-4 hover:bg-[#F5F6F8] transition-colors">
                                <span
                                    className="w-9 h-9 rounded-[4px] flex items-center justify-center text-white mb-3"
                                    style={{ background: s.grad, boxShadow: `0 6px 14px ${s.glow}` }}
                                >
                                    <span className="material-symbols-rounded text-[19px]">{s.icon}</span>
                                </span>
                                <div className={`text-[26px] font-medium tracking-[-0.5px] text-[#212121] leading-none ${jetbrainsMono.className}`}>
                                    {isLoading ? '—' : s.value}
                                </div>
                                <span className="block text-[10.5px] font-medium uppercase tracking-[0.04em] text-[#757575] mt-1.5">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Getting Started checklist — guides a new user; hides once set up.
                Suppressed on load failure so we don't show it to an established org whose
                stats merely failed to fetch (which would otherwise read as all-zeros). */}
            {!isLoading && !loadFailed && !(stats.active_jobs > 0 && stats.total_candidates > 0) && (
                <section className="bg-white border border-[#E0E0E0] rounded-[4px] p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-rounded text-[#1976D2]">rocket_launch</span>
                        <h3 className="text-[15px] font-bold text-[#212121]">{t("dashboard.gettingStarted")}</h3>
                    </div>
                    <p className="text-[13px] text-[#757575] mb-5">{t("dashboard.gettingStartedDesc")}</p>
                    <div className="grid gap-3 md:grid-cols-3">
                        {[
                            {
                                done: stats.active_jobs > 0,
                                title: t("dashboard.step1Title"),
                                desc: t("dashboard.step1Desc"),
                                actions: [
                                    { label: t("dashboard.hireWithAI"), href: "/enterprise/croar-pilot", primary: true, perm: "jobs:read" },
                                    { label: t("dashboard.postManually"), href: "/enterprise/jobs/create", primary: false, perm: "jobs:create" },
                                ],
                            },
                            {
                                done: stats.total_candidates > 0,
                                title: t("dashboard.step2Title"),
                                desc: t("dashboard.step2Desc"),
                                actions: [
                                    { label: t("dashboard.sourceCandidates"), href: "/enterprise/sourcing/chat", primary: true, perm: "candidates:read" },
                                    { label: t("dashboard.viewJobs"), href: "/enterprise/jobs", primary: false, perm: "jobs:read" },
                                ],
                            },
                            {
                                done: stats.total_applications > 0,
                                title: t("dashboard.step3Title"),
                                desc: t("dashboard.step3Desc"),
                                actions: [
                                    { label: t("dashboard.openPipeline"), href: "/enterprise/candidates/kanban", primary: true, perm: "candidates:read" },
                                ],
                            },
                        ].map((step, i) => (
                            <div key={i} className={`rounded-[4px] border p-4 ${step.done ? "border-[#C8E6C9] bg-[#E8F5E9]/50" : "border-[#E0E0E0] bg-[#F5F6F8]/60"}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${step.done ? "bg-[#2E7D32] text-white" : "bg-[#E3F2FD] text-[#1976D2]"}`}>
                                        {step.done ? "✓" : i + 1}
                                    </span>
                                    <span className="text-[13px] font-bold text-[#212121]">{step.title}</span>
                                </div>
                                <p className="text-[12px] text-[#757575] mb-3 leading-relaxed">{step.desc}</p>
                                {!step.done && (
                                    <div className="flex flex-wrap gap-2">
                                        {step.actions.filter((a) => canAccess(a.perm)).map((a) => (
                                            <Link key={a.label} href={a.href} className={`px-3 py-1.5 rounded-[4px] text-[12px] font-semibold transition-colors ${a.primary ? "bg-[#1976D2] text-white hover:bg-[#1565C0]" : "bg-white border border-[#E0E0E0] text-[#424242] hover:bg-[#F5F6F8]"}`}>
                                                {a.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Insights row: hiring funnel + pipeline composition */}
            {canAccess("candidates:read") && (
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1 items-stretch">
                    {/* Hiring funnel — built from live stats */}
                    {(() => {
                        const rows = [
                            { label: t("dashboard.candidates"), value: stats.total_candidates, color: "#1976D2", light: "#42A5F5" },
                            { label: t("dashboard.applications"), value: stats.total_applications, color: "#6E63E6", light: "#90CAF9" },
                            { label: t("dashboard.interviews"), value: stats.interviews_scheduled, color: "#42A5F5", light: "#C4BFF2" },
                            { label: t("dashboard.recommended"), value: stats.high_value_matches, color: "#2E7D32", light: "#66BB6A" },
                        ];
                        const max = Math.max(...rows.map((r) => r.value), 1);
                        return (
                            <div className="lg:col-span-8 bg-white border border-[#E0E0E0] rounded-[4px] p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-[15px] font-bold text-[#212121]">{t("dashboard.pipelineOverview")}</h3>
                                        <p className="text-[12.5px] text-[#757575] mt-0.5">{t("dashboard.liveCounts")}</p>
                                    </div>
                                    <Link href="/enterprise/candidates/kanban" className="text-[12.5px] font-semibold text-[#1976D2] hover:underline">{t("dashboard.viewPipeline")}</Link>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {rows.map((r, idx) => {
                                        const widthPct = isLoading ? 0 : Math.max((r.value / max) * 100, r.value > 0 ? 8 : 2);
                                        const prev = rows[idx - 1];
                                        // Only show a step ratio when it's a genuine narrowing (value <= prev).
                                        // Candidates→Applications can grow (one candidate → many applications),
                                        // so a ">100% conversion" there is meaningless — omit it instead.
                                        const conv =
                                            idx > 0 && prev.value > 0 && r.value <= prev.value
                                                ? Math.round((r.value / prev.value) * 100)
                                                : null;
                                        return (
                                            <div key={r.label}>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: r.color }} />
                                                        <span className="text-[12.5px] font-semibold text-[#424242]">{r.label}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2.5">
                                                        {conv !== null && (
                                                            <span className="text-[10.5px] font-semibold text-[#757575] bg-[#EEEEEE] px-1.5 py-0.5 rounded-[3px]">{conv}%</span>
                                                        )}
                                                        <span className={`text-[13.5px] font-semibold text-[#212121] ${jetbrainsMono.className}`}>{isLoading ? '—' : r.value}</span>
                                                    </div>
                                                </div>
                                                <div className="h-[10px] bg-[#EEEEEE] rounded-[3px] overflow-hidden">
                                                    <div className="h-full rounded-[3px] transition-all duration-700" style={{ width: `${widthPct}%`, background: `linear-gradient(90deg, ${r.light}, ${r.color})` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-5 pt-4 border-t border-[#E0E0E0] grid grid-cols-3 gap-3">
                                    <div className="bg-[#FAFAFA] border border-[#E0E0E0]/60 rounded-[4px] p-2.5 text-center">
                                        <p className="text-[9.5px] uppercase tracking-wider font-bold text-[#757575]">{t("dashboard.activeJobs")}</p>
                                        <p className={`text-[17px] font-extrabold text-[#212121] mt-1.5 ${jetbrainsMono.className}`}>{isLoading ? '—' : stats.active_jobs}</p>
                                    </div>
                                    <div className="bg-[#FAFAFA] border border-[#E0E0E0]/60 rounded-[4px] p-2.5 text-center">
                                        <p className="text-[9.5px] uppercase tracking-wider font-bold text-[#757575]">{t("dashboard.aiMatches")}</p>
                                        <p className={`text-[17px] font-extrabold text-[#212121] mt-1.5 ${jetbrainsMono.className}`}>{isLoading ? '—' : stats.high_value_matches}</p>
                                    </div>
                                    <div className="bg-[#FAFAFA] border border-[#E0E0E0]/60 rounded-[4px] p-2.5 text-center">
                                        <p className="text-[9.5px] uppercase tracking-wider font-bold text-[#757575]">{t("dashboard.recommendedRate")}</p>
                                        <p className={`text-[17px] font-extrabold text-[#212121] mt-1.5 ${jetbrainsMono.className}`}>
                                            {/* Both scoped to applications (high_value_matches counts applications with
                                                ai_match_score >= 80), so this is a true rate and can't exceed 100%. */}
                                            {isLoading ? '—' : (stats.total_applications > 0 ? `${Math.min(100, Math.round((stats.high_value_matches / stats.total_applications) * 100))}%` : "0%")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Pipeline composition donut */}
                    <div className="lg:col-span-4 bg-white border border-[#E0E0E0] p-6 rounded-[4px]">
                            <h3 className="text-[15px] font-bold text-[#212121]">{t("dashboard.pipelineComposition")}</h3>
                            <p className="text-[12.5px] text-[#757575] mt-0.5 mb-3">{t("dashboard.distStages")}</p>
                            {pipelineTotal === 0 ? (
                                <div className="flex flex-col items-center justify-center text-center py-10">
                                    <div className="w-12 h-12 rounded-[4px] bg-[#F5F6F8] text-[#757575] flex items-center justify-center mb-3">
                                        <span className="material-symbols-rounded text-2xl">donut_large</span>
                                    </div>
                                    <p className="text-[13px] text-[#757575]">{t("dashboard.noPipelineData")}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="relative h-[176px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={pipeline} dataKey="value" nameKey="name" innerRadius={56} outerRadius={80} paddingAngle={2} stroke="none">
                                                    {pipeline.map((p) => <Cell key={p.name} fill={p.color} />)}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className={`text-[26px] font-semibold text-[#212121] leading-none ${jetbrainsMono.className}`}>{pipelineTotal}</span>
                                            <span className="text-[11px] text-[#757575] mt-1">{t("dashboard.pipeTotal")}</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        {pipeline.map((p) => (
                                            <div key={p.name} className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: p.color }} />
                                                <span className="text-[12.5px] text-[#424242] flex-1">{p.name}</span>
                                                <span className={`text-[12.5px] font-semibold text-[#212121] ${jetbrainsMono.className}`}>{p.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                </section>
            )}

            {/* Modules + needs-attention row */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Module quick-access */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {modules.filter(m => canAccess(m.permission)).map((module) => (
                        <Link href={module.path} key={module.title} className="group h-full">
                            <div className="relative bg-white border border-[#E0E0E0] p-5 rounded-[4px] hover:border-[#1976D2]/40 transition-colors duration-150 h-full overflow-hidden flex flex-col">
                                <div className={`w-11 h-11 rounded-[4px] ${getColorClasses(module.color).bg} ${getColorClasses(module.color).text} flex items-center justify-center mb-4`}>
                                    <span className="material-symbols-rounded text-xl">{module.icon}</span>
                                </div>
                                <h3 className="text-[15px] font-bold text-[#212121] tracking-[-0.2px] group-hover:text-[#1976D2] transition-colors">
                                    {module.title}
                                </h3>
                                <p className="text-[13px] text-[#757575] leading-relaxed mt-1 mb-4 flex-1">
                                    {module.description}
                                </p>
                                <div className="flex items-center gap-1 text-[12px] font-semibold text-[#1976D2]">
                                    {t("dashboard.open")}
                                    <span className="material-symbols-rounded text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Needs your attention — real, clickable items from your live stats */}
                <div className="lg:col-span-4 h-full bg-white border border-[#E0E0E0] p-6 rounded-[4px] flex flex-col">
                        <div className="flex items-center justify-between mb-5">
                            <span className="text-[15px] font-bold text-[#212121]">{t("dashboard.needsAttention")}</span>
                            <div className="w-2.5 h-2.5 rounded-full bg-[#66BB6A] border-4 border-[#E8F5E9]"></div>
                        </div>

                        {isLoading ? (
                            <div className="flex-1 flex items-center justify-center text-[#BDBDBD] text-sm py-10">{t("common.loading")}</div>
                        ) : (() => {
                            const items = [
                                { show: stats.high_value_matches > 0, count: stats.high_value_matches, label: t("dashboard.attnRecommended"), icon: "stars", color: "text-[#1976D2] bg-[#E3F2FD]" },
                                { show: stats.interviews_scheduled > 0, count: stats.interviews_scheduled, label: t("dashboard.attnInterviews"), icon: "videocam", color: "text-[#EF6C00] bg-[#FFF3E0]" },
                                { show: stats.total_applications > 0, count: stats.total_applications, label: t("dashboard.attnApplications"), icon: "conversion_path", color: "text-[#2E7D32] bg-[#E8F5E9]" },
                            ].filter((i) => i.show && canAccess("candidates:read"));

                            if (items.length === 0) {
                                return (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                                        <div className="w-12 h-12 rounded-[4px] bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center mb-3">
                                            <span className="material-symbols-rounded text-2xl">task_alt</span>
                                        </div>
                                        <p className="text-[14px] font-semibold text-[#212121]">You&apos;re all caught up</p>
                                        <p className="text-[12px] text-[#757575] mt-1">{t("dashboard.attentionEmpty")}</p>
                                    </div>
                                );
                            }
                            return (
                                <div className="space-y-2.5 flex-1">
                                    {items.map((i) => (
                                        <Link key={i.label} href="/enterprise/candidates/kanban" className="flex items-center gap-3 p-3 rounded-[4px] border border-[#E0E0E0] hover:border-[#1976D2]/40 hover:bg-[#F5F6F8]/60 transition-colors group">
                                            <div className={`w-10 h-10 rounded-[4px] flex items-center justify-center shrink-0 ${i.color}`}>
                                                <span className="material-symbols-rounded text-xl">{i.icon}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className={`text-[19px] font-semibold text-[#212121] leading-none ${jetbrainsMono.className}`}>{i.count}</span>
                                                <p className="text-[12px] text-[#757575] leading-tight mt-1">{i.label}</p>
                                            </div>
                                            <span className="material-symbols-rounded text-[#BDBDBD] group-hover:text-[#1976D2] group-hover:translate-x-0.5 transition-all">chevron_right</span>
                                        </Link>
                                    ))}
                                </div>
                            );
                        })()}

                        {/* Quick actions */}
                        <div className="mt-5 pt-4 border-t border-[#E0E0E0]">
                            <p className="text-[10px] font-bold text-[#757575] uppercase tracking-[0.08em] mb-2.5">{t("dashboard.quickActions")}</p>
                            <div className="flex flex-wrap gap-2">
                                {canAccess("jobs:read") && (
                                    <Link href="/enterprise/croar-pilot" className="px-3 py-2 rounded-[4px] bg-[#1976D2] text-white text-[12px] font-semibold hover:bg-[#1565C0] transition-colors flex items-center gap-1.5">
                                        <span className="material-symbols-rounded text-base">smart_toy</span> {t("dashboard.hireWithAI")}
                                    </Link>
                                )}
                                {canAccess("candidates:read") && (
                                    <Link href="/enterprise/sourcing/chat" className="px-3 py-2 rounded-[4px] bg-white border border-[#E0E0E0] text-[#424242] text-[12px] font-semibold hover:bg-[#F5F6F8] transition-colors flex items-center gap-1.5">
                                        <span className="material-symbols-rounded text-base">person_search</span> {t("dashboard.source")}
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
            </section>
        </div>
    );
}
