"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { BACKEND_URL } from "@/utils/api";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    AreaChart,
    Area
} from 'recharts';
import { jetbrainsMono, Button, Card, Badge, StatCard, StatGrid, Input, PageHelp } from "@/components/ds";
import JobOwnershipPanel, { type Member } from "@/components/enterprise/JobOwnershipPanel";

interface JobStage {
    id: number;
    name: string;
    count: number;
}

interface JobMetrics {
    pipeline: number;
    submitted: number;
    end_client: number;
    interviews: number;
    confirmations: number;
    rejected: number;
    onboarded: number;
}

interface Application {
    id: string;
    candidate: {
        id: string;
        full_name: string;
        email: string;
        skills: string[];
    };
    current_stage: number;
    ai_match_score?: number;
    applied_at: string;
}

interface Job {
    id: string;
    title: string;
    description: string;
    location: string;
    created_at: string;
    status_id: number;
    salary_min?: number;
    salary_max?: number;
    salary_currency?: string;
    salary_frequency?: string;
    experience_min?: number;
    experience_max?: number;
    job_type?: string;
    work_mode?: string;
    department?: string;
    required_skills?: string[];
    client_job_id?: string;
    customer_type?: string;
    customer?: string;
    metrics?: JobMetrics;
    stages?: JobStage[];
    owner?: Member | null;
    collaborators?: Member[];
    last_viewed_at?: string | null;
}

const STATIC_LEADING_TABS = [
    { id: "overview", label: "Overview", count: undefined },
    { id: "info", label: "Info", count: undefined },
    { id: "sourcing", label: "Profile Sourcing", count: undefined },
    { id: "onboarding_tab", label: "Onboarding", count: undefined },
];

export default function JobDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { id } = params;
    const { token, canAccess } = useAuth();
    const { t: tr } = useI18n();

    const [job, setJob] = useState<Job | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // Allow deep-linking to a tab via ?tab=<id> (e.g. Croar Pilot links here with ?tab=sourcing
    // after sending invites, so the recruiter lands straight on the sourced candidates).
    const [activeTab, setActiveTab] = useState(() => {
        const t = searchParams?.get("tab");
        return STATIC_LEADING_TABS.some((x) => x.id === t) ? (t as string) : "overview";
    });
    // The tab strip scrolls horizontally: a job with several interview rounds pushes the later
    // tabs off-screen, and on a trackpad-less machine there was no way to reach them. These drive
    // the left/right arrows, which appear only on the side that actually has more tabs to show.
    const tabStripRef = useRef<HTMLDivElement>(null);
    const [canScrollTabsLeft, setCanScrollTabsLeft] = useState(false);
    const [canScrollTabsRight, setCanScrollTabsRight] = useState(false);

    const syncTabArrows = useCallback(() => {
        const el = tabStripRef.current;
        if (!el) return;
        // 1px of slack: sub-pixel widths otherwise leave the right arrow permanently enabled.
        const maxScroll = el.scrollWidth - el.clientWidth;
        setCanScrollTabsLeft(el.scrollLeft > 1);
        setCanScrollTabsRight(el.scrollLeft < maxScroll - 1);
    }, []);

    const scrollTabs = (direction: -1 | 1) => {
        const el = tabStripRef.current;
        if (!el) return;
        // Move by most of a screenful, keeping a sliver of the previous tab visible as an anchor.
        el.scrollBy({ left: direction * Math.max(160, el.clientWidth * 0.75), behavior: "smooth" });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [onboardings, setOnboardings] = useState<any[]>([]);
    const [isOnboardingLoading, setIsOnboardingLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [sourced, setSourced] = useState<{ candidates: any[]; summary: any } | null>(null);
    const [isSourcedLoading, setIsSourcedLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [matchingCands, setMatchingCands] = useState<any[]>([]);
    const [isMatchingLoading, setIsMatchingLoading] = useState(false);
    const [invitingCandId, setInvitingCandId] = useState<string | null>(null);
    const [sendingInviteKey, setSendingInviteKey] = useState<string | null>(null);

    useEffect(() => {
        if (id && token) {
            fetchJobDetails();
            fetchApplications();
            fetchOnboardings();
            fetchSourced();
            fetchMatchingCands();
        }
    }, [id, token]);

    const fetchMatchingCands = async () => {
        setIsMatchingLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${id}/matching-candidates`, {
                headers: { "Authorization": `Bearer ${token}` },
            });
            if (res.ok) { const d = await res.json(); setMatchingCands(d.candidates || []); }
        } catch (error) {
            console.error("Error fetching matching candidates:", error);
        } finally {
            setIsMatchingLoading(false);
        }
    };

    const inviteFromBank = async (candidateId: string) => {
        setInvitingCandId(candidateId);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${id}/invite-candidate`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ candidate_id: candidateId }),
            });
            const d = await res.json().catch(() => ({}));
            if (res.ok && d.sent) {
                // Mark invited locally + refresh the sourcing funnel so the Sourcing tab reflects it.
                setMatchingCands(prev => prev.map(c => c.id === candidateId ? { ...c, already_invited: true } : c));
                fetchSourced();
            } else {
                alert(d.detail || tr("jobDetail.inviteSendFailed"));
            }
        } catch {
            alert(tr("jobDetail.inviteNetworkError"));
        } finally {
            setInvitingCandId(null);
        }
    };

    // Send the apply-invite mail to a candidate that was shortlisted from Profile Sourcing (no mail
    // has gone out yet). While testing, the backend redirects it to the test inbox.
    const sendSourcedInvite = async (c: any) => {
        const key = (c.email || c.profile_url || "").toLowerCase();
        setSendingInviteKey(key);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${id}/send-sourced-invite`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ email: c.email, profile_url: c.profile_url, full_name: c.full_name }),
            });
            const d = await res.json().catch(() => ({}));
            if (res.ok && d.sent) {
                fetchSourced(); // refresh so the row flips to "Sent"
                if (d.test_mode && d.test_email) {
                    alert(tr("jobDetail.inviteSentTestMode", { email: d.test_email ?? "" }));
                }
            } else {
                alert(d.detail || tr("jobDetail.inviteSendFailed"));
            }
        } catch {
            alert(tr("jobDetail.inviteNetworkError"));
        } finally {
            setSendingInviteKey(null);
        }
    };

    const fetchSourced = async () => {
        setIsSourcedLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${id}/sourced-candidates`, {
                headers: { "Authorization": `Bearer ${token}` },
            });
            if (res.ok) setSourced(await res.json());
        } catch (error) {
            console.error("Error fetching sourced candidates:", error);
        } finally {
            setIsSourcedLoading(false);
        }
    };

    const fetchJobDetails = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${id}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setJob(data);
            }
        } catch (error) {
            console.error("Error fetching job:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchApplications = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/applications?job_id=${id}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setApplications(data);
            }
        } catch (error) {
            console.error("Error fetching applications:", error);
        }
    };

    const fetchOnboardings = async () => {
        setIsOnboardingLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/onboarding?job_id=${id}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setOnboardings(data);
            }
        } catch (error) {
            console.error("Error fetching onboardings:", error);
        } finally {
            setIsOnboardingLoading(false);
        }
    };

    const getOnboardingStatusColor = (status: string) => {
        switch (status) {
            case "In Progress": return "bg-blue-50 text-blue-600 border-blue-100";
            case "Awaiting Confirmation": return "bg-amber-50 text-amber-600 border-amber-100";
            case "Completed": return "bg-emerald-50 text-emerald-600 border-emerald-100";
            case "Discontinued": return "bg-rose-50 text-rose-600 border-rose-100";
            default: return "bg-[#F7F8FA] text-[#4B5563] border-[#E8EAED]";
        }
    };

    // Keep the tab arrows in step with the strip. A ResizeObserver covers both the window being
    // resized and the strip gaining tabs once the job's stages arrive; `job` in the deps re-runs
    // this on the render where the strip first exists (it is behind the isLoading early return).
    useEffect(() => {
        const el = tabStripRef.current;
        if (!el) return;
        syncTabArrows();
        const ro = new ResizeObserver(syncTabArrows);
        ro.observe(el);
        return () => ro.disconnect();
    }, [syncTabArrows, job]);

    if (isLoading) {
        return (
            <div className="px-4 sm:px-5 md:px-7 pb-20 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
                <div className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED]">
                    <div className="h-7 w-48 bg-[#E8EAED] rounded-[8px] animate-pulse" />
                    <div className="h-3.5 w-32 bg-[#F0F0F1] rounded-[6px] animate-pulse mt-2" />
                </div>
                <StatGrid className="lg:grid-cols-5">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-[104px] bg-white border border-[#E8EAED] rounded-[14px] animate-pulse" />
                    ))}
                </StatGrid>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-[380px] bg-white border border-[#E8EAED] rounded-[14px] animate-pulse" />
                    <div className="h-[380px] bg-white border border-[#E8EAED] rounded-[14px] animate-pulse" />
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="px-4 sm:px-5 md:px-7 pb-20 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
                <Card className="flex flex-col items-center justify-center text-center py-20 mt-6">
                    <div className="w-16 h-16 bg-[#F4F5F7] rounded-[16px] flex items-center justify-center mb-5 text-[#C7CCD4]">
                        <span className="material-symbols-rounded text-3xl">work_off</span>
                    </div>
                    <h1 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#15171C] mb-2">{tr("jobDetail.jobNotFound")}</h1>
                    <p className="text-[#8A929E] text-[14px] max-w-xs mx-auto mb-6">{tr("jobDetail.jobNotFoundDesc")}</p>
                    <Link href="/enterprise/jobs" className="inline-flex items-center gap-2 h-[42px] px-4 rounded-[10px] bg-[#5B53E0] text-white text-[13.5px] font-semibold hover:bg-[#4A43C9] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-colors">
                        <span className="material-symbols-rounded text-[19px]">arrow_back</span>
                        {tr("jobDetail.backToJobs")}
                    </Link>
                </Card>
            </div>
        );
    }

    const { metrics } = job;

    // job_statuses: 1 Draft · 2 Active · 3 On Hold · 4 Closed.
    const STATUS_META: Record<number, { label: string; tone: "neutral" | "success" | "warning" | "danger" }> = {
        1: { label: "Draft", tone: "neutral" },
        2: { label: "Active", tone: "success" },
        3: { label: "On Hold", tone: "warning" },
        4: { label: "Closed", tone: "danger" },
    };
    const statusMeta = (statusId: number) => STATUS_META[statusId] ?? { label: "Draft", tone: "neutral" as const };
    const STATUS_LABEL_KEYS: Record<number, string> = {
        1: "jobDetail.statusDraft",
        2: "jobDetail.statusActive",
        3: "jobDetail.statusOnHold",
        4: "jobDetail.statusClosed",
    };
    const getStatusLabel = (statusId: number) => tr(STATUS_LABEL_KEYS[statusId] ?? "jobDetail.statusDraft");

    // Prepare pipeline data for the chart
    const pipelineData = (job.stages || []).map(s => {
        return {
            name: s.name,
            count: applications.filter(app => app.current_stage === s.id).length
        };
    });

    const totalCandidates = applications.length;

    // Match-score distribution (donut)
    const scoreBuckets = [
        { name: "Strong (80+)", value: applications.filter(a => (a.ai_match_score ?? 0) >= 80).length, color: "#15803D" },
        { name: "Good (60–79)", value: applications.filter(a => (a.ai_match_score ?? 0) >= 60 && (a.ai_match_score ?? 0) < 80).length, color: "#5B53E0" },
        { name: "Low (<60)", value: applications.filter(a => (a.ai_match_score ?? 0) > 0 && (a.ai_match_score ?? 0) < 60).length, color: "#D97706" },
        { name: "Unscored", value: applications.filter(a => !a.ai_match_score).length, color: "#C7CCD4" },
    ].filter(b => b.value > 0);
    const scoreTotal = scoreBuckets.reduce((s, b) => s + b.value, 0);

    // Applications over the last 14 days (area)
    const appsByDay = (() => {
        const days: { key: string; label: string; count: number }[] = [];
        const today = new Date();
        for (let i = 13; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            days.push({ key: d.toISOString().slice(0, 10), label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), count: 0 });
        }
        const byKey: Record<string, { key: string; label: string; count: number }> = Object.fromEntries(days.map(d => [d.key, d]));
        applications.forEach(a => {
            if (!a.applied_at) return;
            const k = new Date(a.applied_at).toISOString().slice(0, 10);
            if (byKey[k]) byKey[k].count += 1;
        });
        return days;
    })();
    const hasTimeData = appsByDay.some(d => d.count > 0);

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-20 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3.5 min-w-0">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 flex items-center justify-center rounded-[10px] border border-[#E1E4E8] bg-white text-[#4B5563] hover:bg-[#F7F8FA] transition-all shrink-0"
                        aria-label={tr("jobDetail.goBack")}
                    >
                        <span className="material-symbols-rounded text-xl">arrow_back</span>
                    </button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#9AA3AF] mb-0.5">
                            <Link href="/enterprise/jobs" className="hover:text-[#5B53E0] transition-colors">{tr("jobDetail.jobsBreadcrumb")}</Link>
                            <span>/</span>
                            <span className={jetbrainsMono.className}>{job.id.slice(0, 8)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight flex flex-wrap items-center gap-x-2.5 gap-y-1">
                                <span className="truncate">{job.title}</span>
                                <Badge tone={statusMeta(job.status_id).tone} dot>{getStatusLabel(job.status_id)}</Badge>
                                {job.location && (
                                    <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[#8A929E]">
                                        <span className="material-symbols-rounded text-[15px]">location_on</span>
                                        {job.location}
                                    </span>
                                )}
                            </h1>
                            <PageHelp title={tr("jobDetail.helpTitleJobDetail")}>{tr("jobDetail.helpJobDetail")}</PageHelp>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                    <Button variant="secondary" aria-label={tr("jobDetail.share")} className="w-10 h-10 px-0">
                        <span className="material-symbols-rounded text-xl">share</span>
                    </Button>
                    {canAccess("jobs:update") && (
                        <Link href={`/enterprise/jobs/${id}/edit`}>
                            <Button size="sm" icon="edit">{tr("common.edit")}</Button>
                        </Link>
                    )}
                </div>
            </header>

            {/* Metric Cards */}
            <StatGrid className="lg:grid-cols-5">
                {[
                    { label: tr("jobDetail.statPipeline"), value: metrics?.pipeline || 0, icon: "account_tree", grad: "linear-gradient(135deg,#8B7DFF,#5B53E0)", glow: "rgba(91,83,224,0.28)" },
                    { label: tr("jobDetail.statSubmitted"), value: metrics?.submitted || 0, icon: "assignment_ind", grad: "linear-gradient(135deg,#6E8BEA,#3559C7)", glow: "rgba(53,89,199,0.25)" },
                    { label: tr("jobDetail.statInterviews"), value: metrics?.interviews || 0, icon: "groups", grad: "linear-gradient(135deg,#F6B65C,#D97706)", glow: "rgba(217,119,6,0.25)" },
                    { label: tr("jobDetail.statRejected"), value: metrics?.rejected || 0, icon: "block", grad: "linear-gradient(135deg,#F08C8C,#E5484D)", glow: "rgba(229,72,77,0.22)" },
                    { label: tr("jobDetail.statOnboarded"), value: metrics?.onboarded || 0, icon: "person_add", grad: "linear-gradient(135deg,#34D399,#0E8A6E)", glow: "rgba(14,138,110,0.25)" },
                ].map((card, i) => (
                    <StatCard key={i} label={card.label} value={card.value} icon={card.icon} gradient={card.grad} glow={card.glow} />
                ))}
            </StatGrid>

            {/* Tabs & Content */}
            <div className="space-y-6">
                    {/* Tabs Navigation — scrolls horizontally, with arrows for the overflow. */}
                    <div className="relative border-b border-[#E1E4E8]">
                        {canScrollTabsLeft && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => scrollTabs(-1)}
                                    aria-label={tr("jobDetail.scrollTabsLeft")}
                                    className="absolute left-0 top-0 bottom-[4px] z-20 w-8 flex items-center justify-center bg-white text-[#6B6F76] hover:text-[#5B53E0] transition-colors"
                                >
                                    <span className="material-symbols-rounded text-[22px]">chevron_left</span>
                                </button>
                                {/* Fade so a half-cut tab reads as "there is more", not as a clipped label. */}
                                <div className="absolute left-8 top-0 bottom-[4px] z-10 w-6 bg-gradient-to-r from-white to-transparent pointer-events-none" />
                            </>
                        )}

                        {/* Padding is keyed off "does it overflow at all", not off each arrow's own
                            flag — tying it to the flags would shift the tabs sideways the instant
                            you started scrolling. */}
                        <div ref={tabStripRef} onScroll={syncTabArrows} className={`flex gap-8 overflow-x-auto no-scrollbar ${canScrollTabsLeft || canScrollTabsRight ? "px-10" : ""}`}>
                        {[
                            ...STATIC_LEADING_TABS,
                            ...(job.stages || []).map(s => {
                                const dynamicCount = applications.filter(app => app.current_stage === s.id).length;
                                return { 
                                    id: s.name.toLowerCase().replace(/\s+/g, '_'), 
                                    label: s.name, 
                                    count: dynamicCount 
                                };
                            })
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-4 px-1 text-sm font-bold whitespace-nowrap transition-all relative ${
                                    activeTab === tab.id ? "text-[#5B53E0]" : "text-[#6B6F76] hover:text-[#374151]"
                                }`}
                            >
                                {({ overview: tr("jobDetail.tabOverview"), info: tr("jobDetail.tabInfo"), sourcing: tr("jobDetail.tabSourcing"), onboarding_tab: tr("jobDetail.tabOnboarding") } as Record<string, string>)[tab.id] ?? tab.label}
                                {tab.count !== undefined && <span className="ml-1 text-xs">({tab.count})</span>}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5B53E0] rounded-full"></div>
                                )}
                            </button>
                        ))}
                        </div>

                        {canScrollTabsRight && (
                            <>
                                <div className="absolute right-8 top-0 bottom-[4px] z-10 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none" />
                                <button
                                    type="button"
                                    onClick={() => scrollTabs(1)}
                                    aria-label={tr("jobDetail.scrollTabsRight")}
                                    className="absolute right-0 top-0 bottom-[4px] z-20 w-8 flex items-center justify-center bg-white text-[#6B6F76] hover:text-[#5B53E0] transition-colors"
                                >
                                    <span className="material-symbols-rounded text-[22px]">chevron_right</span>
                                </button>
                            </>
                        )}
                    </div>


                    {/* Active Tab Content (Overview) */}
                    {activeTab === "overview" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Pipeline Visualization */}
                                <Card className="lg:col-span-2 overflow-hidden">
                                     <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-sm font-bold text-[#15171C]  tracking-tight">{tr("jobDetail.recruitmentPipeline")}</h3>
                                            <p className="text-[10px] font-bold text-[#9AA3AF]   mt-0.5">{tr("jobDetail.distRounds")}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F7F8FA] border border-[#E8EAED] rounded-[10px]">
                                            <span className="w-2 h-2 rounded-full bg-[#5B53E0]"></span>
                                            <span className="text-[10px] font-bold text-[#4B5563]  tracking-tight">{totalCandidates} {tr("jobDetail.total")}</span>
                                        </div>
                                    </div>

                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={pipelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EAED" />
                                                <XAxis 
                                                    dataKey="name" 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#8A929E' }} 
                                                    dy={10}
                                                />
                                                <YAxis 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#C7CCD4' }}
                                                />
                                                <RechartsTooltip 
                                                    cursor={{ fill: '#F7F8FA' }}
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div className="bg-[#15171C] border border-[#1F2127] rounded-[10px] p-3 shadow-xl">
                                                                    <p className="text-[10px] font-bold text-[#9AA3AF]   leading-none mb-1">{payload[0].payload.name}</p>
                                                                    <p className="text-xs font-bold text-white">{tr("jobDetail.nCandidates", { count: payload[0].value as number })}</p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                                                    {pipelineData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#5B53E0" : "#8B7DFF"} fillOpacity={1 - (index * 0.1)} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>

                                {/* Summary Sidebar */}
                                <div className="space-y-6">
                                    {job && (
                                        <JobOwnershipPanel
                                            jobId={job.id}
                                            owner={job.owner}
                                            collaborators={job.collaborators}
                                            lastViewedAt={job.last_viewed_at}
                                            onAssigned={fetchJobDetails}
                                        />
                                    )}
                                    <Card>
                                        <h3 className="text-[13px] font-bold text-[#15171C] mb-4">{tr("jobDetail.stageEfficiency")}</h3>
                                        <div className="space-y-4">
                                            {pipelineData.map((stage, i) => (
                                                <div key={i} className="flex flex-col gap-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-[#6B6F76]  tracking-tight">{stage.name}</span>
                                                        <span className="text-[10px] font-bold text-[#15171C] ">{Math.round((stage.count / (totalCandidates || 1)) * 100)}%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-[#F7F8FA] rounded-full overflow-hidden border border-[#E8EAED]">
                                                        <div 
                                                            className="h-full bg-[#5B53E0] transition-all duration-1000"
                                                            style={{ width: `${(stage.count / (totalCandidates || 1)) * 100}%`, opacity: 1 - (i * 0.15) }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>

                                    <div className="rounded-[14px] p-6 shadow-[0_10px_24px_rgba(91,83,224,0.3)]" style={{ background: "linear-gradient(135deg,#6E63E6,#4A43C9)" }}>
                                        <div className="w-10 h-10 rounded-[11px] bg-white/15 flex items-center justify-center text-white mb-4">
                                            <span className="material-symbols-rounded text-white">trending_up</span>
                                        </div>
                                        <h4 className="text-[15px] font-bold text-white tracking-tight">{tr("jobDetail.quickInsight")}</h4>
                                        <p className="text-white/80 text-[11px] font-medium leading-relaxed mt-1">
                                            {tr("jobDetail.quickInsightPre")} <strong>{pipelineData.length > 0 ? pipelineData.reduce((prev, current) => (prev.count > current.count) ? prev : current).name : tr("jobDetail.initialStage")}</strong> {tr("jobDetail.quickInsightPost")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Extra insights: match-score mix + applications over time */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Match-score distribution donut */}
                                <Card>
                                    <h3 className="text-[15px] font-bold text-[#15171C]">{tr("jobDetail.matchScoreMix")}</h3>
                                    <p className="text-[12.5px] text-[#8A929E] mt-0.5 mb-3">{tr("jobDetail.aiFitPipeline")}</p>
                                    {scoreTotal === 0 ? (
                                        <div className="flex flex-col items-center justify-center text-center py-10">
                                            <div className="w-12 h-12 rounded-[12px] bg-[#F4F5F7] text-[#8A929E] flex items-center justify-center mb-3">
                                                <span className="material-symbols-rounded text-2xl">donut_large</span>
                                            </div>
                                            <p className="text-[13px] text-[#8A929E]">{tr("jobDetail.noScoredCandidates")}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="relative h-[170px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={scoreBuckets} dataKey="value" nameKey="name" innerRadius={54} outerRadius={78} paddingAngle={2} stroke="none">
                                                            {scoreBuckets.map((b) => <Cell key={b.name} fill={b.color} />)}
                                                        </Pie>
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                    <span className={`text-[26px] font-semibold text-[#15171C] leading-none ${jetbrainsMono.className}`}>{scoreTotal}</span>
                                                    <span className="text-[11px] text-[#8A929E] mt-1">{tr("jobDetail.candidatesLower")}</span>
                                                </div>
                                            </div>
                                            <div className="mt-4 space-y-2">
                                                {scoreBuckets.map((b) => (
                                                    <div key={b.name} className="flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: b.color }} />
                                                        <span className="text-[12.5px] text-[#374151] flex-1">{b.name}</span>
                                                        <span className={`text-[12.5px] font-semibold text-[#15171C] ${jetbrainsMono.className}`}>{b.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </Card>

                                {/* Applications over time (area) */}
                                <Card className="lg:col-span-2">
                                    <h3 className="text-[15px] font-bold text-[#15171C]">{tr("jobDetail.applicationsOverTime")}</h3>
                                    <p className="text-[12.5px] text-[#8A929E] mt-0.5 mb-3">{tr("jobDetail.last14Days")}</p>
                                    {!hasTimeData ? (
                                        <div className="flex flex-col items-center justify-center text-center py-14">
                                            <div className="w-12 h-12 rounded-[12px] bg-[#F4F5F7] text-[#8A929E] flex items-center justify-center mb-3">
                                                <span className="material-symbols-rounded text-2xl">show_chart</span>
                                            </div>
                                            <p className="text-[13px] text-[#8A929E]">{tr("jobDetail.noApplicationsWindow")}</p>
                                        </div>
                                    ) : (
                                        <div className="h-[200px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={appsByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="appsArea" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#5B53E0" stopOpacity={0.28} />
                                                            <stop offset="100%" stopColor="#5B53E0" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EAED" />
                                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#8A929E' }} interval={1} dy={8} />
                                                    <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#C7CCD4' }} />
                                                    <RechartsTooltip
                                                        cursor={{ stroke: '#5B53E0', strokeWidth: 1, strokeDasharray: '4 4' }}
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                return (
                                                                    <div className="bg-[#0E1014] rounded-[10px] px-3 py-2 shadow-xl">
                                                                        <p className="text-[10px] font-semibold text-[#9AA3AF] leading-none mb-1">{payload[0].payload.label}</p>
                                                                        <p className="text-[12.5px] font-semibold text-white">{tr("jobDetail.nApplicants", { count: payload[0].value as number })}</p>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        }}
                                                    />
                                                    <Area type="monotone" dataKey="count" stroke="#5B53E0" strokeWidth={2.5} fill="url(#appsArea)" dot={false} activeDot={{ r: 4, fill: '#5B53E0' }} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* Active Tab Content (Info) */}
                    {activeTab === "info" && (
                        <Card padding="none" className="overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-3 px-6 py-4 border-b border-[#F0F0F1]">
                                <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                                    <span className="material-symbols-rounded text-[20px]">info</span>
                                </span>
                                <div>
                                    <h3 className="text-[15px] font-bold text-[#15171C]">{tr("jobDetail.jobDetailsTitle")}</h3>
                                    <p className="text-[12px] text-[#8A929E]">{tr("jobDetail.requisitionInfo")}</p>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {[
                                        { label: tr("jobDetail.infoClientJobId"), value: job.client_job_id || "—", icon: "tag" },
                                        { label: tr("jobDetail.infoJobId"), value: `EXAIN-${job.id.slice(0, 8).toUpperCase()}`, icon: "fingerprint" },
                                        { label: tr("jobDetail.infoStatus"), value: getStatusLabel(job.status_id), icon: "flag" },
                                        { label: tr("jobDetail.infoJobTitle"), value: job.title, icon: "work" },
                                        { label: tr("jobDetail.infoCustomerType"), value: job.customer_type || tr("jobDetail.internal"), icon: "category" },
                                        { label: tr("jobDetail.infoCustomer"), value: job.customer || tr("jobDetail.internal"), icon: "corporate_fare" },
                                        {
                                            label: tr("jobDetail.infoExperience"),
                                            value: job.experience_min !== undefined && job.experience_max !== undefined
                                                ? `${job.experience_min} – ${job.experience_max} ${tr("jobDetail.years")}`
                                                : job.experience_min !== undefined ? `${job.experience_min}+ ${tr("jobDetail.years")}` : tr("jobDetail.notSpecified"),
                                            icon: "work_history"
                                        },
                                        {
                                            label: tr("jobDetail.infoSalaryRange"),
                                            value: job.salary_min && job.salary_max
                                                ? `${job.salary_currency || "INR"} ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()} / ${job.salary_frequency || "Yearly"}`
                                                : tr("jobDetail.notSpecified"),
                                            icon: "payments"
                                        },
                                        { label: tr("jobDetail.infoWorkMode"), value: job.work_mode || tr("jobDetail.onSite"), icon: "home_work" },
                                    ].map((d) => (
                                        <div key={d.label} className="flex items-start gap-3 p-4 rounded-[12px] bg-[#F7F8FA] border border-[#E8EAED]">
                                            <span className="w-9 h-9 rounded-[10px] bg-white border border-[#E8EAED] text-[#5B53E0] flex items-center justify-center shrink-0">
                                                <span className="material-symbols-rounded text-[19px]">{d.icon}</span>
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9AA3AF]">{d.label}</p>
                                                <p className="text-[14px] font-semibold text-[#15171C] mt-0.5 break-words">{d.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 pt-5 border-t border-[#F0F0F1]">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9AA3AF] mb-3">{tr("jobDetail.requiredSkills")}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {job.required_skills?.map((skill, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-[#ECEBFB] text-[#5B53E0] text-[12px] font-medium rounded-[8px]">
                                                {skill.trim()}
                                            </span>
                                        ))}
                                        {(!job.required_skills || job.required_skills.length === 0) && (
                                            <span className="text-[13px] text-[#9AA3AF]">{tr("jobDetail.noSkills")}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Candidate Bank Tab Content — bank candidates whose skills fit THIS job. */}
                    {activeTab === "candidate_bank" && (
                        <Card padding="none" className="overflow-hidden min-h-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="px-6 py-4 border-b border-[#E8EAED] flex items-center gap-2">
                                <h3 className="text-sm font-bold text-[#15171C] tracking-tight">{tr("jobDetail.candidateBankMatches")}</h3>
                                <PageHelp title={tr("jobDetail.helpTitleCandidateBank")}><p>{tr("jobDetail.helpCandidateBank")}</p></PageHelp>
                            </div>
                            {isMatchingLoading ? (
                                <div className="p-10 text-center text-[13px] text-[#8A929E]">{tr("jobDetail.findingCandidates")}</div>
                            ) : matchingCands.length === 0 ? (
                                <div className="p-12 text-center">
                                    <p className="text-sm font-bold text-[#15171C]">{tr("jobDetail.noBankMatches")}</p>
                                    <p className="text-xs text-[#6B6F76] font-semibold mt-1 max-w-md mx-auto">{tr("jobDetail.noBankMatchesDesc")}</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em] border-b border-[#E8EAED]">
                                                <th className="px-6 py-3">{tr("jobDetail.colCandidate")}</th>
                                                <th className="px-6 py-3">{tr("jobDetail.colSkillMatch")}</th>
                                                <th className="px-6 py-3">{tr("jobDetail.colMatchedSkills")}</th>
                                                <th className="px-6 py-3 text-right">{tr("jobDetail.colAction")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {matchingCands.map((c, idx: number) => (
                                                <tr key={idx} className="border-b border-[#F0F0F1] hover:bg-[#F7F8FA]/60 transition-colors">
                                                    <td className="px-6 py-3.5">
                                                        <div className="font-bold text-[13px] text-[#15171C]">{c.full_name || tr("jobDetail.unknown")}</div>
                                                        {c.email && <div className="text-[11.5px] text-[#8A929E]">{c.email}</div>}
                                                    </td>
                                                    <td className="px-6 py-3.5">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#ECEBFB] text-[#5B53E0] text-[11px] font-bold">{c.match_pct}% · {c.match_count} skills</span>
                                                    </td>
                                                    <td className="px-6 py-3.5">
                                                        <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                                                            {(c.matched_skills || []).slice(0, 4).map((s: string, i: number) => (
                                                                <span key={i} className="px-2 py-0.5 rounded-[7px] bg-white border border-[#E8EAED] text-[11px] text-[#374151] font-semibold">{s}</span>
                                                            ))}
                                                            {(c.matched_skills || []).length > 4 && <span className="text-[11px] text-[#9AA3AF] font-semibold self-center">+{c.matched_skills.length - 4}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3.5 text-right">
                                                        {c.already_applied ? (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#15803D]"><span className="material-icons-outlined text-[14px]">how_to_reg</span>{tr("jobDetail.applied")}</span>
                                                        ) : c.already_invited ? (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5B53E0]"><span className="material-icons-outlined text-[14px]">mark_email_read</span>{tr("jobDetail.invited")}</span>
                                                        ) : (
                                                            <button
                                                                onClick={() => inviteFromBank(c.id)}
                                                                disabled={invitingCandId === c.id || !c.email}
                                                                title={!c.email ? tr("jobDetail.noEmailOnRecord") : tr("jobDetail.emailToApply")}
                                                                className="h-9 px-4 rounded-[10px] bg-[#5B53E0] text-white text-[12px] font-semibold hover:bg-[#4A43C9] disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                                                            >
                                                                <span className="material-icons-outlined text-[15px]">mail</span>
                                                                {invitingCandId === c.id ? tr("jobDetail.sending") : tr("jobDetail.invite")}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Profile Sourcing Tab Content */}
                    {activeTab === "sourcing" && (
                        <Card padding="none" className="overflow-hidden min-h-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="px-6 py-4 border-b border-[#E8EAED] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-[#15171C] tracking-tight">{tr("jobDetail.profileSourcing")}</h3>
                                    <PageHelp title={tr("jobDetail.profileSourcing")}><p>{tr("jobDetail.helpProfileSourcing")}</p></PageHelp>
                                </div>
                                {sourced?.summary && (
                                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                                        <span className="px-2.5 py-1 rounded-full bg-[#ECEBFB] text-[#5B53E0]">{tr("jobDetail.nSourced", { count: sourced.summary.invited ?? 0 })}</span>
                                        <span className="px-2.5 py-1 rounded-full bg-[#E7ECFB] text-[#3559C7]">{tr("jobDetail.nMailSent", { count: sourced.summary.mail_sent ?? 0 })}</span>
                                        <span className="px-2.5 py-1 rounded-full bg-[#E6F4EA] text-[#15803D]">{tr("jobDetail.nApplied", { count: sourced.summary.applied ?? 0 })}</span>
                                        <span className="px-2.5 py-1 rounded-full bg-[#FEF3E2] text-[#D97706]">{tr("jobDetail.nAwaiting", { count: sourced.summary.awaiting ?? 0 })}</span>
                                    </div>
                                )}
                            </div>
                            {isSourcedLoading ? (
                                <div className="p-10 text-center text-[13px] text-[#8A929E]">{tr("jobDetail.loadingSourced")}</div>
                            ) : !sourced?.candidates?.length ? (
                                <div className="p-12 text-center">
                                    <p className="text-sm font-bold text-[#15171C]">{tr("jobDetail.noSourced")}</p>
                                    <p className="text-xs text-[#6B6F76] font-semibold mt-1 max-w-md mx-auto">{tr("jobDetail.noSourcedDesc")}</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em] border-b border-[#E8EAED]">
                                                <th className="px-6 py-3">{tr("jobDetail.colCandidate")}</th>
                                                <th className="px-6 py-3">{tr("jobDetail.colSource")}</th>
                                                <th className="px-6 py-3">{tr("jobDetail.colInviteEmail")}</th>
                                                <th className="px-6 py-3">{tr("jobDetail.colResponse")}</th>
                                                <th className="px-6 py-3 text-right">{tr("jobDetail.colAction")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sourced.candidates.map((c, idx: number) => (
                                                <tr key={idx} className="border-b border-[#F0F0F1] hover:bg-[#F7F8FA]/60 transition-colors">
                                                    <td className="px-6 py-3.5">
                                                        <div className="font-bold text-[13px] text-[#15171C]">{c.full_name || tr("jobDetail.unknown")}</div>
                                                        {c.email && <div className="text-[11.5px] text-[#8A929E]">{c.email}</div>}
                                                    </td>
                                                    <td className="px-6 py-3.5">
                                                        {c.profile_url ? (
                                                            <a href={c.profile_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#5B53E0] hover:underline">
                                                                {c.platform || tr("jobDetail.profile")} <span className="material-icons-outlined text-[14px]">open_in_new</span>
                                                            </a>
                                                        ) : (
                                                            <span className="text-[12px] font-semibold text-[#6B6F76]">{c.platform || "—"}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3.5">
                                                        {c.invite_status === "sent" ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E6F4EA] text-[#15803D] text-[11px] font-semibold"><span className="material-icons-outlined text-[14px]">mark_email_read</span>{tr("jobDetail.sent")}</span>
                                                        ) : c.invite_status === "failed" ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FDECEC] text-[#C0383C] text-[11px] font-semibold"><span className="material-icons-outlined text-[14px]">error</span>{tr("jobDetail.failed")}</span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FEF3E2] text-[#D97706] text-[11px] font-semibold"><span className="material-icons-outlined text-[14px]">drafts</span>{tr("jobDetail.notEmailed")}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3.5">
                                                        {c.applied ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ECEBFB] text-[#5B53E0] text-[11px] font-semibold"><span className="material-icons-outlined text-[14px]">how_to_reg</span>{tr("jobDetail.appliedInPipeline")}</span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F1F2F5] text-[#6B6F76] text-[11px] font-semibold"><span className="material-icons-outlined text-[14px]">hourglass_empty</span>{tr("jobDetail.awaiting")}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3.5 text-right">
                                                        {c.invite_status === "sent" ? (
                                                            <span className="text-[11.5px] font-semibold text-[#8A929E]">—</span>
                                                        ) : (
                                                            <button
                                                                onClick={() => sendSourcedInvite(c)}
                                                                disabled={sendingInviteKey === (c.email || c.profile_url || "").toLowerCase()}
                                                                title={c.email ? tr("jobDetail.sendInviteTo", { email: c.email }) : tr("jobDetail.noEmailTestInbox")}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#5B53E0] text-white text-[11.5px] font-bold hover:bg-[#4A43C9] transition-colors disabled:opacity-60"
                                                            >
                                                                <span className="material-icons-outlined text-[15px]">send</span>
                                                                {sendingInviteKey === (c.email || c.profile_url || "").toLowerCase()
                                                                    ? tr("jobDetail.sending")
                                                                    : c.invite_status === "failed" ? tr("jobDetail.retryMail") : tr("jobDetail.sendMail")}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Onboarding Tab Content */}
                    {activeTab === "onboarding_tab" && (
                        <Card padding="none" className="overflow-hidden min-h-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="px-6 py-4 border-b border-[#E8EAED] flex items-center justify-between">
                                <h3 className="text-[13px] font-bold text-[#15171C]">{tr("jobDetail.onboardingCandidates")}</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#F7F8FA] border-b border-[#E8EAED]">
                                            <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{tr("jobDetail.colCode")}</th>
                                            <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{tr("jobDetail.colCandidate")}</th>
                                            <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-center">{tr("jobDetail.colStatus")}</th>
                                            <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">{tr("jobDetail.colActions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F0F0F1]">
                                        {onboardings.map((ob) => (
                                            <tr key={ob.id} className="hover:bg-[#F7F8FA]/60 transition-colors group cursor-pointer" onClick={() => router.push(`/enterprise/onboarding/${ob.id}`)}>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[11px] font-semibold text-[#5B53E0] bg-[#ECEBFB] px-2 py-1 rounded-[8px] ${jetbrainsMono.className}`}>
                                                        {ob.onboarding_code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-[10px] bg-[#E8EAED] text-[#8A929E] flex items-center justify-center font-extrabold text-[12px] uppercase">
                                                            {ob.application?.candidate?.full_name?.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[13.5px] font-bold text-[#15171C] leading-tight group-hover:text-[#5B53E0] transition-colors">
                                                                {ob.application?.candidate?.full_name}
                                                            </p>
                                                            <p className="text-[12px] text-[#8A929E]">
                                                                {ob.application?.candidate?.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {ob.status && (
                                                        <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-[20px] border ${getOnboardingStatusColor(ob.status.name)}`}>
                                                            {ob.status.name}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="secondary" size="sm">{tr("jobDetail.track")}</Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {onboardings.length === 0 && !isOnboardingLoading && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="w-14 h-14 rounded-[16px] bg-[#F4F5F7] flex items-center justify-center text-[#C7CCD4]">
                                                            <span className="material-symbols-rounded text-2xl">person_add</span>
                                                        </div>
                                                        <p className="text-[14px] text-[#8A929E]">{tr("jobDetail.noOnboardingProcesses")}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}

                    {/* Candidate List Content (for stage tabs) */}
                    {!STATIC_LEADING_TABS.some(t => t.id === activeTab) && (
                        <Card padding="none" className="overflow-hidden min-h-[400px]">
                            <div className="px-6 py-4 border-b border-[#E8EAED] flex items-center justify-between gap-3">
                                <h3 className="text-[13px] font-bold text-[#15171C]">{tr("jobDetail.candidates")}</h3>
                                <Input icon="search" type="text" placeholder={tr("jobDetail.searchPlaceholder")} className="h-9 w-44 sm:w-56" />
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-[#F7F8FA] border-b border-[#E8EAED]">
                                            <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{tr("jobDetail.colCandidate")}</th>
                                            <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-center">{tr("jobDetail.colMatchScore")}</th>
                                            <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{tr("jobDetail.colStatus")}</th>
                                            <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{tr("jobDetail.applied")}</th>
                                            <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F0F0F1]">
                                        {applications
                                            .filter(app => {
                                                const stage = job.stages?.find(s => s.name.toLowerCase().replace(/\s+/g, '_') === activeTab);
                                                return stage ? app.current_stage === stage.id : false;
                                            })
                                            .map((app) => (
                                                <tr key={app.id} className="hover:bg-[#F7F8FA]/60 transition-colors group cursor-pointer">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center font-extrabold text-[12px] uppercase">
                                                                {app.candidate?.full_name?.charAt(0)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[13.5px] font-bold text-[#15171C] group-hover:text-[#5B53E0] transition-colors">{app.candidate?.full_name}</p>
                                                                <p className="text-[12px] text-[#8A929E]">{app.candidate?.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col items-center">
                                                            <div className={`text-[13px] font-bold ${jetbrainsMono.className} ${
                                                                (app.ai_match_score || 0) > 80 ? "text-[#15803D]" :
                                                                (app.ai_match_score || 0) > 60 ? "text-[#5B53E0]" : "text-[#6B6F76]"
                                                            }`}>
                                                                {app.ai_match_score ? `${Math.round(app.ai_match_score)}%` : "-"}
                                                            </div>
                                                            <div className="w-16 h-1 bg-[#E8EAED] rounded-full mt-1 overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${
                                                                        (app.ai_match_score || 0) > 80 ? "bg-[#15803D]" :
                                                                        (app.ai_match_score || 0) > 60 ? "bg-[#5B53E0]" : "bg-[#D4D7DC]"
                                                                    }`}
                                                                    style={{ width: `${app.ai_match_score || 0}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge tone="indigo">{tr("jobDetail.inProgress")}</Badge>
                                                    </td>
                                                    <td className={`px-6 py-4 text-[12.5px] text-[#6B6F76] ${jetbrainsMono.className}`}>
                                                        {new Date(app.applied_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="text-[#D4D7DC] hover:text-[#5B53E0] transition-colors">
                                                            <span className="material-symbols-rounded text-lg">arrow_forward</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        {applications.filter(app => {
                                            const stage = job.stages?.find(s => s.name.toLowerCase().replace(/\s+/g, '_') === activeTab);
                                            return stage ? app.current_stage === stage.id : false;
                                        }).length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="w-14 h-14 rounded-[16px] bg-[#F4F5F7] flex items-center justify-center text-[#C7CCD4]">
                                                            <span className="material-symbols-rounded text-2xl">person_search</span>
                                                        </div>
                                                        <p className="text-[14px] text-[#8A929E]">{tr("jobDetail.noCandidatesStage")}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </div>
        </div>
    );
}
