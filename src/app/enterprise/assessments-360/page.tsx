"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { apiClient } from "@/utils/api";
import { Search, Filter, ChevronDown } from "lucide-react";
import { Button, StatCard, StatGrid, Badge, Card, EmptyState, jetbrainsMono, PageHelp } from "@/components/ds";

interface Cycle {
    id: string;
    name: string;
    status: string;
    start_date: string;
    end_date: string;
}

export default function X360Dashboard() {
    const { canAccess } = useAuth();
    const { t: tr } = useI18n();
    const router = useRouter();
    const [stats, setStats] = useState({
        activeCycles: 0,
        pendingMyAssessments: 0,
        completedMyAssessments: 0,
        totalParticipants: 0
    });
    const [recentCycles, setRecentCycles] = useState<Cycle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const filteredCycles = recentCycles.filter(cycle =>
        (statusFilter === "all" || cycle.status === statusFilter) &&
        (cycle.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const selectCls =
        "appearance-none bg-white border border-[#E1E4E8] rounded-[10px] h-10 pl-9 pr-9 text-[13px] font-medium text-[#374151] outline-none cursor-pointer hover:bg-[#F7F7F8] focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all";

    const fetchDashboardData = useCallback(async () => {
        try {
            const [statsRes, cyclesRes] = await Promise.all([
                apiClient.get('/api/v1/enterprise/x360/stats'),
                apiClient.get('/api/v1/enterprise/x360/cycles')
            ]);

            if (statsRes.ok && cyclesRes.ok) {
                const statsData = await statsRes.json();
                const cycles = await cyclesRes.json();

                setStats({
                    activeCycles: statsData.active_cycles,
                    pendingMyAssessments: statsData.pending_my_assignments,
                    completedMyAssessments: statsData.completed_my_assignments,
                    totalParticipants: statsData.total_participants
                });
                setRecentCycles(cycles.slice(0, 3));
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const statusBadge = (status: string) =>
        status === "ACTIVE" ? (
            <Badge tone="success" dot>{status}</Badge>
        ) : status === "DRAFT" ? (
            <Badge tone="warning" dot>{status}</Badge>
        ) : (
            <Badge tone="neutral" dot>{status}</Badge>
        );

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">{tr("nav.assessments360")}</h1>
                        <PageHelp title={tr("nav.assessments360")}>
                            <p>{tr("postOnboarding.runMultiRater")}</p>
                            <p>{tr("assess360.helpP2a")}<strong>{tr("postOnboarding.templates")}</strong>{tr("assess360.helpP2b")}<strong>{tr("postOnboarding.newCycle")}</strong>{tr("assess360.helpP2c")}</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#8A929E] mt-0.5">{tr("postOnboarding.talentReviewHub")}</p>
                </div>
                {canAccess("assessments:moderate") && (
                    <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap sm:shrink-0">
                        <Link
                            href="/enterprise/assessments-360/questions"
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] bg-white border border-[#E1E4E8] text-[#374151] text-[13px] font-semibold hover:bg-[#F4F5F7] transition-colors shadow-sm"
                        >
                            <span className="material-symbols-rounded text-[17px]">quiz</span>
                            {tr("postOnboarding.questionBank")}
                        </Link>
                        <Link
                            href="/enterprise/assessments-360/templates"
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] bg-white border border-[#E1E4E8] text-[#374151] text-[13px] font-semibold hover:bg-[#F4F5F7] transition-colors shadow-sm"
                        >
                            <span className="material-symbols-rounded text-[17px]">description</span>
                            {tr("postOnboarding.templates")}
                        </Link>
                        <Link
                            href="/enterprise/assessments-360/new"
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-semibold hover:bg-[#4A43C9] shadow-[0_4px_12px_rgba(91,83,224,0.28)] transition-colors"
                        >
                            <span className="material-symbols-rounded text-[17px]">add</span>
                            {tr("postOnboarding.newCycle")}
                        </Link>
                    </div>
                )}
            </header>

            {/* Stat cards */}
            <StatGrid>
                <StatCard label={tr("assess360.activeCycles")} value={loading ? "—" : stats.activeCycles} icon="sync" gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)" glow="rgba(91,83,224,0.28)" />
                <StatCard label={tr("assess360.pendingAction")} value={loading ? "—" : stats.pendingMyAssessments} icon="pending_actions" gradient="linear-gradient(135deg,#F6B65C,#D97706)" glow="rgba(217,119,6,0.25)" />
                <StatCard label={tr("postOnboarding.completed")} value={loading ? "—" : stats.completedMyAssessments} icon="task_alt" gradient="linear-gradient(135deg,#34D399,#0E8A6E)" glow="rgba(14,138,110,0.25)" />
                <StatCard label={tr("assess360.participants")} value={loading ? "—" : stats.totalParticipants} icon="groups" gradient="linear-gradient(135deg,#6E8BEA,#3559C7)" glow="rgba(53,89,199,0.25)" />
            </StatGrid>

            {/* Toolbar: search + filter */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9AA3AF]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={tr("assess360.searchCycles")}
                        className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] pl-10 pr-4 text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                    />
                </div>

                <div className="flex items-center gap-2.5">
                    <div className="relative flex-1 md:flex-none">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className={`${selectCls} w-full md:min-w-[170px]`}
                        >
                            <option value="all">{tr("postOnboarding.allCycles")}</option>
                            <option value="ACTIVE">{tr("postOnboarding.activeOnly")}</option>
                            <option value="DRAFT">{tr("postOnboarding.drafts")}</option>
                            <option value="CLOSED">{tr("postOnboarding.closed")}</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Assessment Cycles list */}
            <Card padding="none" className="overflow-hidden min-h-[420px]">
                <div className="flex items-center justify-between px-5 py-3.5 bg-[#F7F8FA] border-b border-[#E8EAED]">
                    <div className="flex items-center gap-2.5">
                        <span className="material-symbols-rounded text-[#5B53E0] text-[19px]">dashboard_customize</span>
                        <h2 className="text-[13px] font-bold text-[#15171C] tracking-tight">{tr("postOnboarding.assessmentCycles")}</h2>
                    </div>
                    <Link href="/enterprise/assessments-360/cycles" className="text-[12.5px] font-semibold text-[#5B53E0] hover:text-[#4A43C9] transition-colors">
                        {tr("assess360.viewAllCycles")}
                    </Link>
                </div>

                {loading ? (
                    <div className="p-4 space-y-2.5">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
                        ))}
                    </div>
                ) : filteredCycles.length === 0 ? (
                    searchQuery || statusFilter !== "all" ? (
                        <EmptyState
                            icon="search_off"
                            tone="muted"
                            title={tr("payroll.noCyclesMatch")}
                            description={tr("assess360.tryAdjusting")}
                            action={
                                <Button size="sm" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}>
                                    {tr("assess360.clearAllFilters")}
                                </Button>
                            }
                        />
                    ) : (
                        <EmptyState
                            icon="360"
                            tone="brand"
                            title={tr("assess360.startFirstCycle")}
                            description={tr("assess360.startFirstCycleDesc")}
                            action={
                                canAccess("assessments:moderate") && (
                                    <Link href="/enterprise/assessments-360/new">
                                        <Button>{tr("postOnboarding.newCycle")}</Button>
                                    </Link>
                                )
                            }
                            secondary={
                                canAccess("assessments:moderate") && (
                                    <Link href="/enterprise/assessments-360/questions">
                                        <Button variant="secondary">{tr("postOnboarding.questionBank")}</Button>
                                    </Link>
                                )
                            }
                        />
                    )
                ) : (
                    <>
                        {/* Column header (desktop) */}
                        <div className="hidden md:grid grid-cols-[2.4fr_1.4fr_1fr_120px] gap-4 px-5 py-3 bg-[#F7F8FA] border-b border-[#E8EAED]">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{tr("postOnboarding.cycleDetails")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{tr("postOnboarding.timeline")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{tr("postOnboarding.status")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">{tr("postOnboarding.actions")}</span>
                        </div>

                        <div className="divide-y divide-[#F0F0F1]">
                            {filteredCycles.map((cycle) => (
                                <div
                                    key={cycle.id}
                                    className="grid grid-cols-[1fr_auto] md:grid-cols-[2.4fr_1.4fr_1fr_120px] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#F7F7F8] transition-colors cursor-pointer group"
                                    onClick={() => router.push(`/enterprise/assessments-360/cycles/${cycle.id}`)}
                                >
                                    {/* Cycle Details */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                                            <span className="material-symbols-rounded text-[18px]">sync</span>
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[14px] font-bold text-[#15171C] group-hover:text-[#5B53E0] transition-colors truncate">{cycle.name}</p>
                                            <p className="text-[12px] text-[#8A929E] truncate">{tr("assess360.enterpriseTalentReview")}</p>
                                            {/* mobile-only meta */}
                                            <div className="flex items-center gap-2.5 mt-1 md:hidden">
                                                {statusBadge(cycle.status)}
                                                <span className={`text-[11px] text-[#8A929E] ${jetbrainsMono.className}`}>
                                                    {new Date(cycle.start_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline (desktop) */}
                                    <div className="hidden md:flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5 text-[12.5px] text-[#374151]">
                                            <span className="material-symbols-rounded text-[15px] text-[#9AA3AF]">calendar_today</span>
                                            <span className={jetbrainsMono.className}>{new Date(cycle.start_date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[12.5px] text-[#374151]">
                                            <span className="material-symbols-rounded text-[15px] text-[#9AA3AF]">event</span>
                                            <span className={jetbrainsMono.className}>{new Date(cycle.end_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {/* Status (desktop) */}
                                    <div className="hidden md:flex items-center">{statusBadge(cycle.status)}</div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-end">
                                        <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] bg-white border border-[#E1E4E8] text-[#374151] text-[12px] font-semibold hover:bg-[#15171C] hover:text-white hover:border-[#15171C] transition-colors">
                                            {tr("payroll.manage")}
                                            <span className="material-symbols-rounded text-[15px]">trending_up</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
}
