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
import JobPostingPanel from "@/components/enterprise/JobPostingPanel";
import JobActivitiesTab from "@/components/enterprise/JobActivitiesTab";
import JobAttachmentsTab from "@/components/enterprise/JobAttachmentsTab";
import JobNotesTab from "@/components/enterprise/JobNotesTab";
import JobReportsTab from "@/components/enterprise/JobReportsTab";
import JobSourcingTab, { type SourcingDestination } from "@/components/enterprise/JobSourcingTab";
import JobPipelineBoard from "@/components/enterprise/JobPipelineBoard";
import AddCandidateModal from "@/components/enterprise/AddCandidateModal";
import JobApplicationFormTab, { type ApplicationField } from "@/components/enterprise/JobApplicationFormTab";
import JobRoundsTab from "@/components/enterprise/JobRoundsTab";

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
    // Whether the public job page is live. Server-computed from the status name — the
    // status_id map below is not reliable enough to decide this.
    accepting_applications?: boolean;
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
    postings?: { platform: string; status?: string | null; external_id?: string | null }[];
    application_fields?: { id: string; label: string; type: string; icon: string; is_required: boolean }[];
    owner?: Member | null;
    collaborators?: Member[];
    last_viewed_at?: string | null;
}

// Tabs before the job's own pipeline stages…
const STATIC_LEADING_TABS = [
    { id: "candidates", label: "Candidates", count: undefined },
    { id: "overview", label: "Overview", count: undefined },
    { id: "info", label: "Info", count: undefined },
];

// …and the workspace tabs after them. Split in two so the stage tabs — the ones a recruiter
// actually lives in — sit near the front instead of being pushed past nine other tabs.
const STATIC_TRAILING_TABS = [
    { id: "team", label: "Team", count: undefined },
    { id: "app_form", label: "Application form", count: undefined },
    { id: "rounds", label: "Rounds", count: undefined },
    { id: "candidate_bank", label: "AI Recommendations", count: undefined },
    { id: "sourcing", label: "Sourcing", count: undefined },
    { id: "activities", label: "Activities", count: undefined },
    { id: "notes", label: "Notes", count: undefined },
    { id: "attachments", label: "Attachments", count: undefined },
    { id: "reports", label: "Reports", count: undefined },
    { id: "onboarding_tab", label: "Onboarding", count: undefined },
];

/** Every tab that is not derived from the job's stages — used to validate ?tab=<id> deep links. */
const STATIC_TAB_IDS = new Set([...STATIC_LEADING_TABS, ...STATIC_TRAILING_TABS].map(t => t.id));

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
        return t && STATIC_TAB_IDS.has(t) ? t : "overview";
    });
    // The tab strip scrolls horizontally: a job with several interview rounds pushes the later
    // tabs off-screen, and on a trackpad-less machine there was no way to reach them. These drive
    // the left/right arrows, which appear only on the side that actually has more tabs to show.
    // Counts shown on the Notes / Attachments tabs. The tab strip needs them before the tab is
    // ever opened, so the child components report their count up as they load.
    // The Sourcing tab opens on a hub of channels; "profile" is the Profile Sourcing panel the
    // hub links into. Kept here rather than in JobSourcingTab so the panel below stays put.
    const [sourcingView, setSourcingView] = useState<"hub" | "profile" | "posting">("hub");
    const [showAddCandidate, setShowAddCandidate] = useState(false);
    const [noteCount, setNoteCount] = useState<number | undefined>(undefined);
    const [attachmentCount, setAttachmentCount] = useState<number | undefined>(undefined);

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
            default: return "bg-[#FAFAFA] text-[#4F4F4F] border-[#E0E0E0]";
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
                <div className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0]">
                    <div className="h-7 w-48 bg-[#E0E0E0] rounded-[4px] animate-pulse" />
                    <div className="h-3.5 w-32 bg-[#EEEEEE] rounded-[3px] animate-pulse mt-2" />
                </div>
                <StatGrid className="lg:grid-cols-5">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-[104px] bg-white border border-[#E0E0E0] rounded-[4px] animate-pulse" />
                    ))}
                </StatGrid>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-[380px] bg-white border border-[#E0E0E0] rounded-[4px] animate-pulse" />
                    <div className="h-[380px] bg-white border border-[#E0E0E0] rounded-[4px] animate-pulse" />
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="px-4 sm:px-5 md:px-7 pb-20 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
                <Card className="flex flex-col items-center justify-center text-center py-20 mt-6">
                    <div className="w-16 h-16 bg-[#F5F6F8] rounded-[4px] flex items-center justify-center mb-5 text-[#BDBDBD]">
                        <span className="material-symbols-rounded text-3xl">work_off</span>
                    </div>
                    <h1 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#212121] mb-2">{tr("jobDetail.jobNotFound")}</h1>
                    <p className="text-[#757575] text-[14px] max-w-xs mx-auto mb-6">{tr("jobDetail.jobNotFoundDesc")}</p>
                    <Link href="/enterprise/jobs" className="inline-flex items-center gap-2 h-[42px] px-4 rounded-[4px] bg-[#1976D2] text-white text-[13.5px] font-semibold hover:bg-[#1565C0] shadow-[0_6px_16px_rgba(25,118,210,0.28)] transition-colors">
                        <span className="material-symbols-rounded text-[19px]">arrow_back</span>
                        {tr("jobDetail.backToJobs")}
                    </Link>
                </Card>
            </div>
        );
    }

    const { metrics } = job;

    // Owner + collaborators, shown as the Team tab's count. Undefined (not 0) when nobody is
    // assigned, so the strip shows a bare "Team" rather than a discouraging "Team (0)".
    const teamMembers = (job.owner ? 1 : 0) + (job.collaborators?.length || 0);
    const teamCount = teamMembers || undefined;

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
        { name: "Strong (80+)", value: applications.filter(a => (a.ai_match_score ?? 0) >= 80).length, color: "#2E7D32" },
        { name: "Good (60–79)", value: applications.filter(a => (a.ai_match_score ?? 0) >= 60 && (a.ai_match_score ?? 0) < 80).length, color: "#1976D2" },
        { name: "Low (<60)", value: applications.filter(a => (a.ai_match_score ?? 0) > 0 && (a.ai_match_score ?? 0) < 60).length, color: "#EF6C00" },
        { name: "Unscored", value: applications.filter(a => !a.ai_match_score).length, color: "#BDBDBD" },
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
            <header className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3.5 min-w-0">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 flex items-center justify-center rounded-[4px] border border-[#E0E0E0] bg-white text-[#4F4F4F] hover:bg-[#FAFAFA] transition-all shrink-0"
                        aria-label={tr("jobDetail.goBack")}
                    >
                        <span className="material-symbols-rounded text-xl">arrow_back</span>
                    </button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#9E9E9E] mb-0.5">
                            <Link href="/enterprise/jobs" className="hover:text-[#1976D2] transition-colors">{tr("jobDetail.jobsBreadcrumb")}</Link>
                            <span>/</span>
                            <span className={jetbrainsMono.className}>{job.id.slice(0, 8)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight flex flex-wrap items-center gap-x-2.5 gap-y-1">
                                <span className="truncate">{job.title}</span>
                                <Badge tone={statusMeta(job.status_id).tone} dot>{getStatusLabel(job.status_id)}</Badge>
                                {job.location && (
                                    <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[#757575]">
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
                    { label: tr("jobDetail.statPipeline"), value: metrics?.pipeline || 0, icon: "account_tree", grad: "linear-gradient(135deg,#42A5F5,#1976D2)", glow: "rgba(25,118,210,0.28)" },
                    { label: tr("jobDetail.statSubmitted"), value: metrics?.submitted || 0, icon: "assignment_ind", grad: "linear-gradient(135deg,#42A5F5,#1565C0)", glow: "rgba(21,101,192,0.25)" },
                    { label: tr("jobDetail.statInterviews"), value: metrics?.interviews || 0, icon: "groups", grad: "linear-gradient(135deg,#FFB74D,#EF6C00)", glow: "rgba(239,108,0,0.25)" },
                    { label: tr("jobDetail.statRejected"), value: metrics?.rejected || 0, icon: "block", grad: "linear-gradient(135deg,#F08C8C,#E5484D)", glow: "rgba(229,72,77,0.22)" },
                    { label: tr("jobDetail.statOnboarded"), value: metrics?.onboarded || 0, icon: "person_add", grad: "linear-gradient(135deg,#66BB6A,#2E7D32)", glow: "rgba(46,125,50,0.25)" },
                ].map((card, i) => (
                    <StatCard key={i} label={card.label} value={card.value} icon={card.icon} gradient={card.grad} glow={card.glow} />
                ))}
            </StatGrid>

            {/* Tabs & Content */}
            <div className="space-y-6">
                    {/* Tabs Navigation — scrolls horizontally, with arrows for the overflow. */}
                    <div className="relative border-b border-[#E0E0E0]">
                        {canScrollTabsLeft && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => scrollTabs(-1)}
                                    aria-label={tr("jobDetail.scrollTabsLeft")}
                                    className="absolute left-0 top-0 bottom-[4px] z-20 w-8 flex items-center justify-center bg-white text-[#616161] hover:text-[#1976D2] transition-colors"
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
                            ...STATIC_LEADING_TABS.map(t => ({
                                ...t,
                                count: t.id === "candidates" ? applications.length : undefined,
                            })),
                            ...(job.stages || []).map(s => {
                                const dynamicCount = applications.filter(app => app.current_stage === s.id).length;
                                return {
                                    id: s.name.toLowerCase().replace(/\s+/g, '_'),
                                    label: s.name,
                                    count: dynamicCount
                                };
                            }),
                            ...STATIC_TRAILING_TABS.map(t => ({
                                ...t,
                                // Counts the tab strip can show without opening the tab.
                                count:
                                    t.id === "notes" ? noteCount
                                    : t.id === "attachments" ? attachmentCount
                                    : t.id === "team" ? teamCount
                                    : undefined,
                            })),
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-4 px-1 text-sm font-bold whitespace-nowrap transition-all relative ${
                                    activeTab === tab.id ? "text-[#1976D2]" : "text-[#616161] hover:text-[#424242]"
                                }`}
                            >
                                {({
                                    candidates: tr("jobDetail.tabCandidates"),
                                    overview: tr("jobDetail.tabOverview"),
                                    info: tr("jobDetail.tabInfo"),
                                    team: tr("jobDetail.tabTeam"),
                                    app_form: tr("jobDetail.tabAppForm"),
                                    rounds: tr("jobDetail.tabRounds"),
                                    candidate_bank: tr("jobDetail.tabRecommendations"),
                                    sourcing: tr("jobDetail.tabSourcing"),
                                    activities: tr("jobDetail.tabActivities"),
                                    notes: tr("jobDetail.tabNotes"),
                                    attachments: tr("jobDetail.tabAttachments"),
                                    reports: tr("jobDetail.tabReports"),
                                    onboarding_tab: tr("jobDetail.tabOnboarding"),
                                } as Record<string, string>)[tab.id] ?? tab.label}
                                {tab.count !== undefined && <span className="ml-1 text-xs">({tab.count})</span>}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1976D2] rounded-full"></div>
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
                                    className="absolute right-0 top-0 bottom-[4px] z-20 w-8 flex items-center justify-center bg-white text-[#616161] hover:text-[#1976D2] transition-colors"
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
                                            <h3 className="text-sm font-bold text-[#212121]  tracking-tight">{tr("jobDetail.recruitmentPipeline")}</h3>
                                            <p className="text-[10px] font-bold text-[#9E9E9E]   mt-0.5">{tr("jobDetail.distRounds")}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FAFAFA] border border-[#E0E0E0] rounded-[4px]">
                                            <span className="w-2 h-2 rounded-full bg-[#1976D2]"></span>
                                            <span className="text-[10px] font-bold text-[#4F4F4F]  tracking-tight">{totalCandidates} {tr("jobDetail.total")}</span>
                                        </div>
                                    </div>

                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={pipelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                                                <XAxis 
                                                    dataKey="name" 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#757575' }} 
                                                    dy={10}
                                                />
                                                <YAxis 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#BDBDBD' }}
                                                />
                                                <RechartsTooltip 
                                                    cursor={{ fill: '#FAFAFA' }}
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div className="bg-[#212121] border border-[#263238] rounded-[4px] p-3 shadow-xl">
                                                                    <p className="text-[10px] font-bold text-[#9E9E9E]   leading-none mb-1">{payload[0].payload.name}</p>
                                                                    <p className="text-xs font-bold text-white">{tr("jobDetail.nCandidates", { count: payload[0].value as number })}</p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                                                    {pipelineData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#1976D2" : "#42A5F5"} fillOpacity={1 - (index * 0.1)} />
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
                                        <h3 className="text-[13px] font-bold text-[#212121] mb-4">{tr("jobDetail.stageEfficiency")}</h3>
                                        <div className="space-y-4">
                                            {pipelineData.map((stage, i) => (
                                                <div key={i} className="flex flex-col gap-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-[#616161]  tracking-tight">{stage.name}</span>
                                                        <span className="text-[10px] font-bold text-[#212121] ">{Math.round((stage.count / (totalCandidates || 1)) * 100)}%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-[#FAFAFA] rounded-full overflow-hidden border border-[#E0E0E0]">
                                                        <div 
                                                            className="h-full bg-[#1976D2] transition-all duration-1000"
                                                            style={{ width: `${(stage.count / (totalCandidates || 1)) * 100}%`, opacity: 1 - (i * 0.15) }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>

                                    <div className="rounded-[4px] p-6 shadow-[0_10px_24px_rgba(25,118,210,0.3)]" style={{ background: "linear-gradient(135deg,#6E63E6,#1565C0)" }}>
                                        <div className="w-10 h-10 rounded-[4px] bg-white/15 flex items-center justify-center text-white mb-4">
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
                                    <h3 className="text-[15px] font-bold text-[#212121]">{tr("jobDetail.matchScoreMix")}</h3>
                                    <p className="text-[12.5px] text-[#757575] mt-0.5 mb-3">{tr("jobDetail.aiFitPipeline")}</p>
                                    {scoreTotal === 0 ? (
                                        <div className="flex flex-col items-center justify-center text-center py-10">
                                            <div className="w-12 h-12 rounded-[4px] bg-[#F5F6F8] text-[#757575] flex items-center justify-center mb-3">
                                                <span className="material-symbols-rounded text-2xl">donut_large</span>
                                            </div>
                                            <p className="text-[13px] text-[#757575]">{tr("jobDetail.noScoredCandidates")}</p>
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
                                                    <span className={`text-[26px] font-semibold text-[#212121] leading-none ${jetbrainsMono.className}`}>{scoreTotal}</span>
                                                    <span className="text-[11px] text-[#757575] mt-1">{tr("jobDetail.candidatesLower")}</span>
                                                </div>
                                            </div>
                                            <div className="mt-4 space-y-2">
                                                {scoreBuckets.map((b) => (
                                                    <div key={b.name} className="flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: b.color }} />
                                                        <span className="text-[12.5px] text-[#424242] flex-1">{b.name}</span>
                                                        <span className={`text-[12.5px] font-semibold text-[#212121] ${jetbrainsMono.className}`}>{b.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </Card>

                                {/* Applications over time (area) */}
                                <Card className="lg:col-span-2">
                                    <h3 className="text-[15px] font-bold text-[#212121]">{tr("jobDetail.applicationsOverTime")}</h3>
                                    <p className="text-[12.5px] text-[#757575] mt-0.5 mb-3">{tr("jobDetail.last14Days")}</p>
                                    {!hasTimeData ? (
                                        <div className="flex flex-col items-center justify-center text-center py-14">
                                            <div className="w-12 h-12 rounded-[4px] bg-[#F5F6F8] text-[#757575] flex items-center justify-center mb-3">
                                                <span className="material-symbols-rounded text-2xl">show_chart</span>
                                            </div>
                                            <p className="text-[13px] text-[#757575]">{tr("jobDetail.noApplicationsWindow")}</p>
                                        </div>
                                    ) : (
                                        <div className="h-[200px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={appsByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="appsArea" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#1976D2" stopOpacity={0.28} />
                                                            <stop offset="100%" stopColor="#1976D2" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#757575' }} interval={1} dy={8} />
                                                    <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#BDBDBD' }} />
                                                    <RechartsTooltip
                                                        cursor={{ stroke: '#1976D2', strokeWidth: 1, strokeDasharray: '4 4' }}
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                return (
                                                                    <div className="bg-[#1E2A38] rounded-[4px] px-3 py-2 shadow-xl">
                                                                        <p className="text-[10px] font-semibold text-[#9E9E9E] leading-none mb-1">{payload[0].payload.label}</p>
                                                                        <p className="text-[12.5px] font-semibold text-white">{tr("jobDetail.nApplicants", { count: payload[0].value as number })}</p>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        }}
                                                    />
                                                    <Area type="monotone" dataKey="count" stroke="#1976D2" strokeWidth={2.5} fill="url(#appsArea)" dot={false} activeDot={{ r: 4, fill: '#1976D2' }} />
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
                            <div className="flex items-center gap-3 px-6 py-4 border-b border-[#EEEEEE]">
                                <span className="w-9 h-9 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center shrink-0">
                                    <span className="material-symbols-rounded text-[20px]">info</span>
                                </span>
                                <div>
                                    <h3 className="text-[15px] font-bold text-[#212121]">{tr("jobDetail.jobDetailsTitle")}</h3>
                                    <p className="text-[12px] text-[#757575]">{tr("jobDetail.requisitionInfo")}</p>
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
                                        <div key={d.label} className="flex items-start gap-3 p-4 rounded-[4px] bg-[#FAFAFA] border border-[#E0E0E0]">
                                            <span className="w-9 h-9 rounded-[4px] bg-white border border-[#E0E0E0] text-[#1976D2] flex items-center justify-center shrink-0">
                                                <span className="material-symbols-rounded text-[19px]">{d.icon}</span>
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9E9E9E]">{d.label}</p>
                                                <p className="text-[14px] font-semibold text-[#212121] mt-0.5 break-words">{d.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 pt-5 border-t border-[#EEEEEE]">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9E9E9E] mb-3">{tr("jobDetail.requiredSkills")}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {job.required_skills?.map((skill, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-[#E3F2FD] text-[#1976D2] text-[12px] font-medium rounded-[4px]">
                                                {skill.trim()}
                                            </span>
                                        ))}
                                        {(!job.required_skills || job.required_skills.length === 0) && (
                                            <span className="text-[13px] text-[#9E9E9E]">{tr("jobDetail.noSkills")}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Candidate Bank Tab Content — bank candidates whose skills fit THIS job. */}
                    {activeTab === "candidate_bank" && (
                        <Card padding="none" className="overflow-hidden min-h-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="px-6 py-4 border-b border-[#E0E0E0] flex items-center gap-2">
                                <h3 className="text-sm font-bold text-[#212121] tracking-tight">{tr("jobDetail.candidateBankMatches")}</h3>
                                <PageHelp title={tr("jobDetail.helpTitleCandidateBank")}><p>{tr("jobDetail.helpCandidateBank")}</p></PageHelp>
                            </div>
                            {isMatchingLoading ? (
                                <div className="p-10 text-center text-[13px] text-[#757575]">{tr("jobDetail.findingCandidates")}</div>
                            ) : matchingCands.length === 0 ? (
                                <div className="p-12 text-center">
                                    <p className="text-sm font-bold text-[#212121]">{tr("jobDetail.noBankMatches")}</p>
                                    <p className="text-xs text-[#616161] font-semibold mt-1 max-w-md mx-auto">{tr("jobDetail.noBankMatchesDesc")}</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-[11px] font-bold text-[#757575] uppercase tracking-[0.06em] border-b border-[#E0E0E0]">
                                                <th className="px-6 py-3">{tr("jobDetail.colCandidate")}</th>
                                                <th className="px-6 py-3">{tr("jobDetail.colSkillMatch")}</th>
                                                <th className="px-6 py-3">{tr("jobDetail.colMatchedSkills")}</th>
                                                <th className="px-6 py-3 text-right">{tr("jobDetail.colAction")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {matchingCands.map((c, idx: number) => (
                                                <tr key={idx} className="border-b border-[#EEEEEE] hover:bg-[#FAFAFA]/60 transition-colors">
                                                    <td className="px-6 py-3.5">
                                                        <div className="font-bold text-[13px] text-[#212121]">{c.full_name || tr("jobDetail.unknown")}</div>
                                                        {c.email && <div className="text-[11.5px] text-[#757575]">{c.email}</div>}
                                                    </td>
                                                    <td className="px-6 py-3.5">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#E3F2FD] text-[#1976D2] text-[11px] font-bold">{c.match_pct}% · {c.match_count} skills</span>
                                                    </td>
                                                    <td className="px-6 py-3.5">
                                                        <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                                                            {(c.matched_skills || []).slice(0, 4).map((s: string, i: number) => (
                                                                <span key={i} className="px-2 py-0.5 rounded-[4px] bg-white border border-[#E0E0E0] text-[11px] text-[#424242] font-semibold">{s}</span>
                                                            ))}
                                                            {(c.matched_skills || []).length > 4 && <span className="text-[11px] text-[#9E9E9E] font-semibold self-center">+{c.matched_skills.length - 4}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3.5 text-right">
                                                        {c.already_applied ? (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2E7D32]"><span className="material-icons-outlined text-[14px]">how_to_reg</span>{tr("jobDetail.applied")}</span>
                                                        ) : c.already_invited ? (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1976D2]"><span className="material-icons-outlined text-[14px]">mark_email_read</span>{tr("jobDetail.invited")}</span>
                                                        ) : (
                                                            <button
                                                                onClick={() => inviteFromBank(c.id)}
                                                                disabled={invitingCandId === c.id || !c.email}
                                                                title={!c.email ? tr("jobDetail.noEmailOnRecord") : tr("jobDetail.emailToApply")}
                                                                className="h-9 px-4 rounded-[4px] bg-[#1976D2] text-white text-[12px] font-semibold hover:bg-[#1565C0] disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
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

                    {/* Sourcing hub — the channel picker the Sourcing tab opens on. */}
                    {activeTab === "sourcing" && sourcingView === "hub" && (
                        <JobSourcingTab
                            isPublished={job.status_id === 2}
                            onNavigate={(destination: SourcingDestination) => {
                                if (destination === "sourcing_hub") setSourcingView("profile");
                                else if (destination === "job_boards") setSourcingView("posting");
                                else if (destination === "recommendations") setActiveTab("candidate_bank");
                                else window.open(`${window.location.origin}/jobs/${id}`, "_blank", "noopener");
                            }}
                        />
                    )}

                    {activeTab === "sourcing" && sourcingView === "posting" && (
                        <>
                            <button
                                onClick={() => setSourcingView("hub")}
                                className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#1976D2] hover:text-[#1565C0] transition-colors mb-4"
                            >
                                <span className="material-symbols-rounded text-[18px]">arrow_back</span>
                                {tr("jobSourcing.backToChannels")}
                            </button>
                            <JobPostingPanel
                                jobId={String(id)}
                                jobTitle={job.title}
                                token={token}
                                postings={job.postings || []}
                                accepting={job.accepting_applications !== false}
                                onPublished={fetchJobDetails}
                            />
                        </>
                    )}

                    {activeTab === "sourcing" && sourcingView === "profile" && (
                        <button
                            onClick={() => setSourcingView("hub")}
                            className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#1976D2] hover:text-[#1565C0] transition-colors mb-4"
                        >
                            <span className="material-symbols-rounded text-[18px]">arrow_back</span>
                            {tr("jobSourcing.backToChannels")}
                        </button>
                    )}

                    {/* Profile Sourcing Tab Content */}
                    {activeTab === "sourcing" && sourcingView === "profile" && (
                        <Card padding="none" className="overflow-hidden min-h-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="px-6 py-4 border-b border-[#E0E0E0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-[#212121] tracking-tight">{tr("jobDetail.profileSourcing")}</h3>
                                    <PageHelp title={tr("jobDetail.profileSourcing")}><p>{tr("jobDetail.helpProfileSourcing")}</p></PageHelp>
                                </div>
                                {sourced?.summary && (
                                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                                        <span className="px-2.5 py-1 rounded-full bg-[#E3F2FD] text-[#1976D2]">{tr("jobDetail.nSourced", { count: sourced.summary.invited ?? 0 })}</span>
                                        <span className="px-2.5 py-1 rounded-full bg-[#E3F2FD] text-[#1565C0]">{tr("jobDetail.nMailSent", { count: sourced.summary.mail_sent ?? 0 })}</span>
                                        <span className="px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32]">{tr("jobDetail.nApplied", { count: sourced.summary.applied ?? 0 })}</span>
                                        <span className="px-2.5 py-1 rounded-full bg-[#FFF3E0] text-[#EF6C00]">{tr("jobDetail.nAwaiting", { count: sourced.summary.awaiting ?? 0 })}</span>
                                    </div>
                                )}
                            </div>
                            {isSourcedLoading ? (
                                <div className="p-10 text-center text-[13px] text-[#757575]">{tr("jobDetail.loadingSourced")}</div>
                            ) : !sourced?.candidates?.length ? (
                                <div className="p-12 text-center">
                                    <p className="text-sm font-bold text-[#212121]">{tr("jobDetail.noSourced")}</p>
                                    <p className="text-xs text-[#616161] font-semibold mt-1 max-w-md mx-auto">{tr("jobDetail.noSourcedDesc")}</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-[11px] font-bold text-[#757575] uppercase tracking-[0.06em] border-b border-[#E0E0E0]">
                                                <th className="px-6 py-3">{tr("jobDetail.colCandidate")}</th>
                                                <th className="px-6 py-3">{tr("jobDetail.colSource")}</th>
                                                <th className="px-6 py-3">{tr("jobDetail.colInviteEmail")}</th>
                                                <th className="px-6 py-3">{tr("jobDetail.colResponse")}</th>
                                                <th className="px-6 py-3 text-right">{tr("jobDetail.colAction")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sourced.candidates.map((c, idx: number) => (
                                                <tr key={idx} className="border-b border-[#EEEEEE] hover:bg-[#FAFAFA]/60 transition-colors">
                                                    <td className="px-6 py-3.5">
                                                        <div className="font-bold text-[13px] text-[#212121]">{c.full_name || tr("jobDetail.unknown")}</div>
                                                        {c.email && <div className="text-[11.5px] text-[#757575]">{c.email}</div>}
                                                    </td>
                                                    <td className="px-6 py-3.5">
                                                        {c.profile_url ? (
                                                            <a href={c.profile_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1976D2] hover:underline">
                                                                {c.platform || tr("jobDetail.profile")} <span className="material-icons-outlined text-[14px]">open_in_new</span>
                                                            </a>
                                                        ) : (
                                                            <span className="text-[12px] font-semibold text-[#616161]">{c.platform || "—"}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3.5">
                                                        {c.invite_status === "sent" ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32] text-[11px] font-semibold"><span className="material-icons-outlined text-[14px]">mark_email_read</span>{tr("jobDetail.sent")}</span>
                                                        ) : c.invite_status === "failed" ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFEBEE] text-[#C62828] text-[11px] font-semibold"><span className="material-icons-outlined text-[14px]">error</span>{tr("jobDetail.failed")}</span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFF3E0] text-[#EF6C00] text-[11px] font-semibold"><span className="material-icons-outlined text-[14px]">drafts</span>{tr("jobDetail.notEmailed")}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3.5">
                                                        {c.applied ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E3F2FD] text-[#1976D2] text-[11px] font-semibold"><span className="material-icons-outlined text-[14px]">how_to_reg</span>{tr("jobDetail.appliedInPipeline")}</span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EEEEEE] text-[#616161] text-[11px] font-semibold"><span className="material-icons-outlined text-[14px]">hourglass_empty</span>{tr("jobDetail.awaiting")}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3.5 text-right">
                                                        {c.invite_status === "sent" ? (
                                                            <span className="text-[11.5px] font-semibold text-[#757575]">—</span>
                                                        ) : (
                                                            <button
                                                                onClick={() => sendSourcedInvite(c)}
                                                                disabled={sendingInviteKey === (c.email || c.profile_url || "").toLowerCase()}
                                                                title={c.email ? tr("jobDetail.sendInviteTo", { email: c.email }) : tr("jobDetail.noEmailTestInbox")}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#1976D2] text-white text-[11.5px] font-bold hover:bg-[#1565C0] transition-colors disabled:opacity-60"
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
                            <div className="px-6 py-4 border-b border-[#E0E0E0] flex items-center justify-between">
                                <h3 className="text-[13px] font-bold text-[#212121]">{tr("jobDetail.onboardingCandidates")}</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#FAFAFA] border-b border-[#E0E0E0]">
                                            <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("jobDetail.colCode")}</th>
                                            <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("jobDetail.colCandidate")}</th>
                                            <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575] text-center">{tr("jobDetail.colStatus")}</th>
                                            <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575] text-right">{tr("jobDetail.colActions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#EEEEEE]">
                                        {onboardings.map((ob) => (
                                            <tr key={ob.id} className="hover:bg-[#FAFAFA]/60 transition-colors group cursor-pointer" onClick={() => router.push(`/enterprise/onboarding/${ob.id}`)}>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[11px] font-semibold text-[#1976D2] bg-[#E3F2FD] px-2 py-1 rounded-[4px] ${jetbrainsMono.className}`}>
                                                        {ob.onboarding_code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-[4px] bg-[#E0E0E0] text-[#757575] flex items-center justify-center font-extrabold text-[12px] uppercase">
                                                            {ob.application?.candidate?.full_name?.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[13.5px] font-bold text-[#212121] leading-tight group-hover:text-[#1976D2] transition-colors">
                                                                {ob.application?.candidate?.full_name}
                                                            </p>
                                                            <p className="text-[12px] text-[#757575]">
                                                                {ob.application?.candidate?.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {ob.status && (
                                                        <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-[4px] border ${getOnboardingStatusColor(ob.status.name)}`}>
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
                                                        <div className="w-14 h-14 rounded-[4px] bg-[#F5F6F8] flex items-center justify-center text-[#BDBDBD]">
                                                            <span className="material-symbols-rounded text-2xl">person_add</span>
                                                        </div>
                                                        <p className="text-[14px] text-[#757575]">{tr("jobDetail.noOnboardingProcesses")}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}

                    {activeTab === "candidates" && (
                        <JobPipelineBoard
                            jobId={String(id)}
                            stages={job.stages || []}
                            applications={applications}
                            onAddCandidate={() => setShowAddCandidate(true)}
                            onSourceCandidates={() => { setSourcingView("profile"); setActiveTab("sourcing"); }}
                            onPostToBoards={() => { setSourcingView("posting"); setActiveTab("sourcing"); }}
                            onChanged={() => { fetchApplications(); fetchJobDetails(); }}
                        />
                    )}

                    {activeTab === "team" && job && (
                        <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <JobOwnershipPanel
                                jobId={job.id}
                                owner={job.owner}
                                collaborators={job.collaborators}
                                lastViewedAt={job.last_viewed_at}
                                onAssigned={fetchJobDetails}
                            />
                        </div>
                    )}

                    {activeTab === "app_form" && (
                        <JobApplicationFormTab
                            jobId={String(id)}
                            fields={(job.application_fields || []) as ApplicationField[]}
                            onSaved={fetchJobDetails}
                        />
                    )}

                    {activeTab === "rounds" && (
                        <JobRoundsTab jobId={String(id)} stages={job.stages || []} onChanged={fetchJobDetails} />
                    )}

                    {activeTab === "activities" && <JobActivitiesTab jobId={String(id)} />}

                    {activeTab === "notes" && (
                        <JobNotesTab jobId={String(id)} onCountChange={setNoteCount} />
                    )}

                    {activeTab === "attachments" && (
                        <JobAttachmentsTab jobId={String(id)} onCountChange={setAttachmentCount} />
                    )}

                    {activeTab === "reports" && (
                        <JobReportsTab stages={job.stages || []} applications={applications} />
                    )}

                    {/* Candidate List Content (for stage tabs).
                        Keyed off the FULL static tab set — checking only the leading tabs would
                        render this list underneath Notes, Reports and every other trailing tab. */}
                    {!STATIC_TAB_IDS.has(activeTab) && (
                        <Card padding="none" className="overflow-hidden min-h-[400px]">
                            <div className="px-6 py-4 border-b border-[#E0E0E0] flex items-center justify-between gap-3">
                                <h3 className="text-[13px] font-bold text-[#212121]">{tr("jobDetail.candidates")}</h3>
                                <Input icon="search" type="text" placeholder={tr("jobDetail.searchPlaceholder")} className="h-9 w-44 sm:w-56" />
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-[#FAFAFA] border-b border-[#E0E0E0]">
                                            <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("jobDetail.colCandidate")}</th>
                                            <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575] text-center">{tr("jobDetail.colMatchScore")}</th>
                                            <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("jobDetail.colStatus")}</th>
                                            <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("jobDetail.applied")}</th>
                                            <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#EEEEEE]">
                                        {applications
                                            .filter(app => {
                                                const stage = job.stages?.find(s => s.name.toLowerCase().replace(/\s+/g, '_') === activeTab);
                                                return stage ? app.current_stage === stage.id : false;
                                            })
                                            .map((app) => (
                                                <tr key={app.id} className="hover:bg-[#FAFAFA]/60 transition-colors group cursor-pointer">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center font-extrabold text-[12px] uppercase">
                                                                {app.candidate?.full_name?.charAt(0)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[13.5px] font-bold text-[#212121] group-hover:text-[#1976D2] transition-colors">{app.candidate?.full_name}</p>
                                                                <p className="text-[12px] text-[#757575]">{app.candidate?.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col items-center">
                                                            <div className={`text-[13px] font-bold ${jetbrainsMono.className} ${
                                                                (app.ai_match_score || 0) > 80 ? "text-[#2E7D32]" :
                                                                (app.ai_match_score || 0) > 60 ? "text-[#1976D2]" : "text-[#616161]"
                                                            }`}>
                                                                {app.ai_match_score ? `${Math.round(app.ai_match_score)}%` : "-"}
                                                            </div>
                                                            <div className="w-16 h-1 bg-[#E0E0E0] rounded-full mt-1 overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${
                                                                        (app.ai_match_score || 0) > 80 ? "bg-[#2E7D32]" :
                                                                        (app.ai_match_score || 0) > 60 ? "bg-[#1976D2]" : "bg-[#E0E0E0]"
                                                                    }`}
                                                                    style={{ width: `${app.ai_match_score || 0}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge tone="indigo">{tr("jobDetail.inProgress")}</Badge>
                                                    </td>
                                                    <td className={`px-6 py-4 text-[12.5px] text-[#616161] ${jetbrainsMono.className}`}>
                                                        {new Date(app.applied_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="text-[#E0E0E0] hover:text-[#1976D2] transition-colors">
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
                                                        <div className="w-14 h-14 rounded-[4px] bg-[#F5F6F8] flex items-center justify-center text-[#BDBDBD]">
                                                            <span className="material-symbols-rounded text-2xl">person_search</span>
                                                        </div>
                                                        <p className="text-[14px] text-[#757575]">{tr("jobDetail.noCandidatesStage")}</p>
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

            <AddCandidateModal
                isOpen={showAddCandidate}
                onClose={() => setShowAddCandidate(false)}
                jobId={String(id)}
                jobTitle={job.title}
                onAdded={() => { fetchApplications(); fetchJobDetails(); }}
            />

        </div>
    );
}
