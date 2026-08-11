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
            indigo: { border: "border-[#DAD7F6]", bg: "bg-[#ECEBFB]", text: "text-[#5B53E0]", dot: "bg-[#5B53E0]" },
            purple: { border: "border-[#DAD7F6]", bg: "bg-[#ECEBFB]", text: "text-[#5B53E0]", dot: "bg-[#5B53E0]" },
            rose: { border: "border-[#FBD5D5]", bg: "bg-[#FDECEC]", text: "text-[#EF4444]", dot: "bg-[#EF4444]" },
            emerald: { border: "border-[#CDEAD7]", bg: "bg-[#E6F4EA]", text: "text-[#15803D]", dot: "bg-[#15803D]" },
        };
        return colors[color] || { border: "border-[#E8EAED]", bg: "bg-[#F4F5F7]", text: "text-[#374151]", dot: "bg-[#8A929E]" };
    };

    // Pipeline composition for the donut chart (real, live values).
    const pipeline = [
        { name: t("dashboard.pipeCandidates"), value: stats.total_candidates, color: "#5B53E0" },
        { name: t("dashboard.pipeApplications"), value: stats.total_applications, color: "#8B7DFF" },
        { name: t("dashboard.pipeInterviews"), value: stats.interviews_scheduled, color: "#A7A0EE" },
        { name: t("dashboard.pipeRecommended"), value: stats.high_value_matches, color: "#15803D" },
    ];
    const pipelineTotal = pipeline.reduce((sum, p) => sum + p.value, 0);

    const statCards = [
        { label: t("dashboard.activeJobs"), value: stats.active_jobs, icon: "work", grad: "linear-gradient(135deg,#8B7DFF,#5B53E0)", glow: "rgba(91,83,224,0.28)", perm: "jobs:read" },
        { label: t("dashboard.totalCandidates"), value: stats.total_candidates, icon: "groups", grad: "linear-gradient(135deg,#34D399,#0E8A6E)", glow: "rgba(14,138,110,0.25)", perm: "candidates:read" },
        { label: t("dashboard.applications"), value: stats.total_applications, icon: "conversion_path", grad: "linear-gradient(135deg,#6E8BEA,#3559C7)", glow: "rgba(53,89,199,0.25)", perm: "candidates:read" },
        { label: t("dashboard.interviews"), value: stats.interviews_scheduled, icon: "videocam", grad: "linear-gradient(135deg,#F6B65C,#D97706)", glow: "rgba(217,119,6,0.25)", perm: "candidates:read" },
    ].filter((s) => canAccess(s.perm));

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex items-center justify-between gap-4">
                {/* Left: title + live status */}
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">{t("dashboard.title")}</h1>
                        <PageHelp title={t("dashboard.title")}>
                            <p>{t("dashboard.helpP1")}</p>
                            <p>{t("dashboard.helpP2")}</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#8A929E] mt-0.5">{t("dashboard.subtitle")}</p>
                </div>

                {/* Right: search + theme toggle */}
                <div className="flex items-center gap-2.5 shrink-0">
                    <button
                        onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }))}
                        className="flex items-center gap-2.5 h-9 px-3.5 min-w-[180px] rounded-[10px] border border-[#E1E4E8] bg-white text-[#9CA3AF] hover:text-[#374151] hover:border-[#5B53E0]/40 hover:bg-[#F7F8FA] transition-all text-[13px] font-medium shadow-sm"
                    >
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                        </svg>
                        <span className="flex-1 text-left">{t("dashboard.searchPlaceholder")}</span>
                        <kbd className="inline-flex items-center text-[9.5px] font-bold bg-[#F4F5F7] border border-[#E1E4E8] rounded-[4px] px-1.5 h-5 text-[#9CA3AF]">⌘K</kbd>
                    </button>
                    <ThemeToggle />
                </div>
            </header>

            {/* Load-failure banner — without this a failed /stats fetch silently falls back to
                all-zeros, making an established org look brand-new. Show it + offer a retry. */}
            {loadFailed && (
                <div className="flex items-center justify-between gap-4 rounded-[12px] border border-[#FBD5D5] bg-[#FDECEC] px-4 py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="material-symbols-rounded text-[#EF4444]">error</span>
                        <div className="min-w-0">
                            <p className="text-[13px] font-bold text-[#15171C]">Couldn&apos;t load your dashboard stats</p>
                            <p className="text-[12px] text-[#8A929E] truncate">The numbers below may be unavailable. Check your connection and try again.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { void mutate(); }}
                        className="shrink-0 px-3 py-1.5 rounded-[9px] bg-[#EF4444] text-white text-[12px] font-semibold hover:bg-[#DC2626] transition-colors"
                    >
                        {t("common.retry")}
                    </button>
                </div>
            )}

            {/* Hero band */}
            <section
                className="relative overflow-hidden rounded-[18px] p-7 md:p-9 text-white"
                style={{
                    background: "#0E1014",
                    backgroundImage:
                        "radial-gradient(1000px 460px at 90% -45%,rgba(91,83,224,0.55),transparent 60%),radial-gradient(760px 420px at -5% 135%,rgba(139,125,255,0.28),transparent 60%)",
                }}
            >
                {/* Decorative rings */}
                <div className="pointer-events-none absolute -right-20 -top-24 w-80 h-80 rounded-full border border-white/[0.06]" />
                <div className="pointer-events-none absolute -right-2 -top-10 w-48 h-48 rounded-full border border-white/[0.05]" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-7">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[20px] bg-white/[0.08] border border-white/10 text-[10px] font-semibold text-[#C7CCD4] mb-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse"></span>
                            {t("dashboard.liveOverview")}
                        </div>
                        <h1 className="text-[30px] md:text-[38px] font-extrabold tracking-[-1px] leading-[1.05]">
                            {greeting ? t(greeting) : ""}, <span className="text-[#8B7DFF]">{isLoading ? 'there' : stats.agent_name}</span>
                        </h1>
                        <p className="text-[#A8AEB8] text-[14.5px] leading-relaxed mt-3 max-w-md">
                            {isLoading ? (
                                t("dashboard.loadingSnapshot")
                            ) : (
                                (() => {
                                    const n = stats.high_value_matches;
                                    const parts = t("dashboard.aiRecommended", { count: n }).split(String(n));
                                    return <>{parts[0]}<span className={`text-white font-semibold ${jetbrainsMono.className}`}>{n}</span>{parts.slice(1).join(String(n))}</>;
                                })()
                            )}
                        </p>
                        <div className="flex flex-wrap gap-2.5 mt-6">
                            {canAccess("jobs:read") && (
                                <Link href="/enterprise/croar-pilot" className="h-[44px] px-5 bg-[#5B53E0] text-white rounded-[10px] text-[14px] font-semibold hover:bg-[#4A43C9] transition-colors shadow-[0_8px_20px_rgba(91,83,224,0.4)] flex items-center gap-2">
                                    <span className="material-symbols-rounded text-[19px]">smart_toy</span>
                                    {t("dashboard.hireWithAI")}
                                </Link>
                            )}
                            {canAccess("jobs:create") && (
                                <Link href="/enterprise/jobs/create" className="h-[44px] px-5 bg-white/[0.08] border border-white/15 text-white rounded-[10px] text-[14px] font-semibold hover:bg-white/[0.14] transition-colors flex items-center gap-2">
                                    <span className="material-symbols-rounded text-[19px]">add_box</span>
                                    {t("dashboard.postNewJob")}
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Stat cards (inside the hero, right side) */}
                    <div className="relative z-10 w-full lg:w-[360px] shrink-0 grid grid-cols-2 gap-3">
                        {statCards.map((s) => (
                            <div key={s.label} className="rounded-[12px] bg-white/[0.06] border border-white/10 p-4 backdrop-blur-sm hover:bg-white/[0.09] transition-colors">
                                <span
                                    className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white mb-3"
                                    style={{ background: s.grad, boxShadow: `0 6px 14px ${s.glow}` }}
                                >
                                    <span className="material-symbols-rounded text-[19px]">{s.icon}</span>
                                </span>
                                <div className={`text-[26px] font-semibold tracking-[-1px] text-white leading-none ${jetbrainsMono.className}`}>
                                    {isLoading ? '—' : s.value}
                                </div>
                                <span className="block text-[10.5px] font-semibold uppercase tracking-[0.04em] text-white/45 mt-1.5">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Getting Started checklist — guides a new user; hides once set up.
                Suppressed on load failure so we don't show it to an established org whose
                stats merely failed to fetch (which would otherwise read as all-zeros). */}
            {!isLoading && !loadFailed && !(stats.active_jobs > 0 && stats.total_candidates > 0) && (
                <section className="bg-white border border-[#E8EAED] rounded-[14px] p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-rounded text-[#5B53E0]">rocket_launch</span>
                        <h3 className="text-[15px] font-bold text-[#15171C]">{t("dashboard.gettingStarted")}</h3>
                    </div>
                    <p className="text-[13px] text-[#8A929E] mb-5">{t("dashboard.gettingStartedDesc")}</p>
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
                            <div key={i} className={`rounded-[12px] border p-4 ${step.done ? "border-[#CDEAD7] bg-[#E6F4EA]/50" : "border-[#E8EAED] bg-[#F4F5F7]/60"}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${step.done ? "bg-[#15803D] text-white" : "bg-[#ECEBFB] text-[#5B53E0]"}`}>
                                        {step.done ? "✓" : i + 1}
                                    </span>
                                    <span className="text-[13px] font-bold text-[#15171C]">{step.title}</span>
                                </div>
                                <p className="text-[12px] text-[#8A929E] mb-3 leading-relaxed">{step.desc}</p>
                                {!step.done && (
                                    <div className="flex flex-wrap gap-2">
                                        {step.actions.filter((a) => canAccess(a.perm)).map((a) => (
                                            <Link key={a.label} href={a.href} className={`px-3 py-1.5 rounded-[9px] text-[12px] font-semibold transition-colors ${a.primary ? "bg-[#5B53E0] text-white hover:bg-[#4A43C9]" : "bg-white border border-[#E1E4E8] text-[#374151] hover:bg-[#F4F5F7]"}`}>
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
                            { label: t("dashboard.candidates"), value: stats.total_candidates, color: "#5B53E0", light: "#8B7DFF" },
                            { label: t("dashboard.applications"), value: stats.total_applications, color: "#6E63E6", light: "#A7A0EE" },
                            { label: t("dashboard.interviews"), value: stats.interviews_scheduled, color: "#8B7DFF", light: "#C4BFF2" },
                            { label: t("dashboard.recommended"), value: stats.high_value_matches, color: "#15803D", light: "#34D399" },
                        ];
                        const max = Math.max(...rows.map((r) => r.value), 1);
                        return (
                            <div className="lg:col-span-8 bg-white border border-[#E8EAED] rounded-[14px] p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-[15px] font-bold text-[#15171C]">{t("dashboard.pipelineOverview")}</h3>
                                        <p className="text-[12.5px] text-[#8A929E] mt-0.5">{t("dashboard.liveCounts")}</p>
                                    </div>
                                    <Link href="/enterprise/candidates/kanban" className="text-[12.5px] font-semibold text-[#5B53E0] hover:underline">{t("dashboard.viewPipeline")}</Link>
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
                                                        <span className="text-[12.5px] font-semibold text-[#374151]">{r.label}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2.5">
                                                        {conv !== null && (
                                                            <span className="text-[10.5px] font-semibold text-[#8A929E] bg-[#F1F2F5] px-1.5 py-0.5 rounded-[6px]">{conv}%</span>
                                                        )}
                                                        <span className={`text-[13.5px] font-semibold text-[#15171C] ${jetbrainsMono.className}`}>{isLoading ? '—' : r.value}</span>
                                                    </div>
                                                </div>
                                                <div className="h-[10px] bg-[#F1F2F5] rounded-[6px] overflow-hidden">
                                                    <div className="h-full rounded-[6px] transition-all duration-700" style={{ width: `${widthPct}%`, background: `linear-gradient(90deg, ${r.light}, ${r.color})` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-5 pt-4 border-t border-[#E8EAED] grid grid-cols-3 gap-3">
                                    <div className="bg-[#F8FAFC] border border-[#E8EAED]/60 rounded-[10px] p-2.5 text-center">
                                        <p className="text-[9.5px] uppercase tracking-wider font-bold text-[#8A929E]">{t("dashboard.activeJobs")}</p>
                                        <p className={`text-[17px] font-extrabold text-[#15171C] mt-1.5 ${jetbrainsMono.className}`}>{isLoading ? '—' : stats.active_jobs}</p>
                                    </div>
                                    <div className="bg-[#F8FAFC] border border-[#E8EAED]/60 rounded-[10px] p-2.5 text-center">
                                        <p className="text-[9.5px] uppercase tracking-wider font-bold text-[#8A929E]">{t("dashboard.aiMatches")}</p>
                                        <p className={`text-[17px] font-extrabold text-[#15171C] mt-1.5 ${jetbrainsMono.className}`}>{isLoading ? '—' : stats.high_value_matches}</p>
                                    </div>
                                    <div className="bg-[#F8FAFC] border border-[#E8EAED]/60 rounded-[10px] p-2.5 text-center">
                                        <p className="text-[9.5px] uppercase tracking-wider font-bold text-[#8A929E]">{t("dashboard.recommendedRate")}</p>
                                        <p className={`text-[17px] font-extrabold text-[#15171C] mt-1.5 ${jetbrainsMono.className}`}>
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
                    <div className="lg:col-span-4 bg-white border border-[#E8EAED] p-6 rounded-[14px]">
                            <h3 className="text-[15px] font-bold text-[#15171C]">{t("dashboard.pipelineComposition")}</h3>
                            <p className="text-[12.5px] text-[#8A929E] mt-0.5 mb-3">{t("dashboard.distStages")}</p>
                            {pipelineTotal === 0 ? (
                                <div className="flex flex-col items-center justify-center text-center py-10">
                                    <div className="w-12 h-12 rounded-[12px] bg-[#F4F5F7] text-[#8A929E] flex items-center justify-center mb-3">
                                        <span className="material-symbols-rounded text-2xl">donut_large</span>
                                    </div>
                                    <p className="text-[13px] text-[#8A929E]">{t("dashboard.noPipelineData")}</p>
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
                                            <span className={`text-[26px] font-semibold text-[#15171C] leading-none ${jetbrainsMono.className}`}>{pipelineTotal}</span>
                                            <span className="text-[11px] text-[#8A929E] mt-1">{t("dashboard.pipeTotal")}</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        {pipeline.map((p) => (
                                            <div key={p.name} className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: p.color }} />
                                                <span className="text-[12.5px] text-[#374151] flex-1">{p.name}</span>
                                                <span className={`text-[12.5px] font-semibold text-[#15171C] ${jetbrainsMono.className}`}>{p.value}</span>
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
                            <div className="relative bg-white border border-[#E8EAED] p-5 rounded-[14px] hover:border-[#5B53E0]/40 transition-colors duration-150 h-full overflow-hidden flex flex-col">
                                <div className={`w-11 h-11 rounded-[11px] ${getColorClasses(module.color).bg} ${getColorClasses(module.color).text} flex items-center justify-center mb-4`}>
                                    <span className="material-symbols-rounded text-xl">{module.icon}</span>
                                </div>
                                <h3 className="text-[15px] font-bold text-[#15171C] tracking-[-0.2px] group-hover:text-[#5B53E0] transition-colors">
                                    {module.title}
                                </h3>
                                <p className="text-[13px] text-[#8A929E] leading-relaxed mt-1 mb-4 flex-1">
                                    {module.description}
                                </p>
                                <div className="flex items-center gap-1 text-[12px] font-semibold text-[#5B53E0]">
                                    {t("dashboard.open")}
                                    <span className="material-symbols-rounded text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Needs your attention — real, clickable items from your live stats */}
                <div className="lg:col-span-4 h-full bg-white border border-[#E8EAED] p-6 rounded-[14px] flex flex-col">
                        <div className="flex items-center justify-between mb-5">
                            <span className="text-[15px] font-bold text-[#15171C]">{t("dashboard.needsAttention")}</span>
                            <div className="w-2.5 h-2.5 rounded-full bg-[#34D399] border-4 border-[#E6F4EA]"></div>
                        </div>

                        {isLoading ? (
                            <div className="flex-1 flex items-center justify-center text-[#C7CCD4] text-sm py-10">{t("common.loading")}</div>
                        ) : (() => {
                            const items = [
                                { show: stats.high_value_matches > 0, count: stats.high_value_matches, label: t("dashboard.attnRecommended"), icon: "stars", color: "text-[#5B53E0] bg-[#ECEBFB]" },
                                { show: stats.interviews_scheduled > 0, count: stats.interviews_scheduled, label: t("dashboard.attnInterviews"), icon: "videocam", color: "text-[#D97706] bg-[#FEF3E2]" },
                                { show: stats.total_applications > 0, count: stats.total_applications, label: t("dashboard.attnApplications"), icon: "conversion_path", color: "text-[#15803D] bg-[#E6F4EA]" },
                            ].filter((i) => i.show && canAccess("candidates:read"));

                            if (items.length === 0) {
                                return (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                                        <div className="w-12 h-12 rounded-[12px] bg-[#E6F4EA] text-[#15803D] flex items-center justify-center mb-3">
                                            <span className="material-symbols-rounded text-2xl">task_alt</span>
                                        </div>
                                        <p className="text-[14px] font-semibold text-[#15171C]">You&apos;re all caught up</p>
                                        <p className="text-[12px] text-[#8A929E] mt-1">{t("dashboard.attentionEmpty")}</p>
                                    </div>
                                );
                            }
                            return (
                                <div className="space-y-2.5 flex-1">
                                    {items.map((i) => (
                                        <Link key={i.label} href="/enterprise/candidates/kanban" className="flex items-center gap-3 p-3 rounded-[12px] border border-[#E8EAED] hover:border-[#5B53E0]/40 hover:bg-[#F4F5F7]/60 transition-colors group">
                                            <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${i.color}`}>
                                                <span className="material-symbols-rounded text-xl">{i.icon}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className={`text-[19px] font-semibold text-[#15171C] leading-none ${jetbrainsMono.className}`}>{i.count}</span>
                                                <p className="text-[12px] text-[#8A929E] leading-tight mt-1">{i.label}</p>
                                            </div>
                                            <span className="material-symbols-rounded text-[#C7CCD4] group-hover:text-[#5B53E0] group-hover:translate-x-0.5 transition-all">chevron_right</span>
                                        </Link>
                                    ))}
                                </div>
                            );
                        })()}

                        {/* Quick actions */}
                        <div className="mt-5 pt-4 border-t border-[#E8EAED]">
                            <p className="text-[10px] font-bold text-[#8A929E] uppercase tracking-[0.08em] mb-2.5">{t("dashboard.quickActions")}</p>
                            <div className="flex flex-wrap gap-2">
                                {canAccess("jobs:read") && (
                                    <Link href="/enterprise/croar-pilot" className="px-3 py-2 rounded-[9px] bg-[#5B53E0] text-white text-[12px] font-semibold hover:bg-[#4A43C9] transition-colors flex items-center gap-1.5">
                                        <span className="material-symbols-rounded text-base">smart_toy</span> {t("dashboard.hireWithAI")}
                                    </Link>
                                )}
                                {canAccess("candidates:read") && (
                                    <Link href="/enterprise/sourcing/chat" className="px-3 py-2 rounded-[9px] bg-white border border-[#E1E4E8] text-[#374151] text-[12px] font-semibold hover:bg-[#F4F5F7] transition-colors flex items-center gap-1.5">
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
