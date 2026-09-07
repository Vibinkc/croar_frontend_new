"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { apiClient } from "@/utils/api";
import { Button, StatCard, StatGrid, Badge, Card, Input, Select, PageHelp, jetbrainsMono } from "@/components/ds";

interface Cycle {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
}

export default function X360CyclesList() {
    const { token, canAccess } = useAuth();
    const { t: tr } = useI18n();
    const router = useRouter();
    const [cycles, setCycles] = useState<Cycle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        const fetchCycles = async () => {
            try {
                const res = await apiClient.get('/api/v1/enterprise/x360/cycles');
                if (res.ok) {
                    setCycles(await res.json());
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchCycles();
    }, []);

    const filteredCycles = cycles.filter(cycle =>
        (statusFilter === "all" || cycle.status === statusFilter) &&
        cycle.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: cycles.length,
        active: cycles.filter(c => c.status === "ACTIVE").length,
        drafts: cycles.filter(c => c.status === "DRAFT").length,
        closed: cycles.filter(c => c.status !== "ACTIVE" && c.status !== "DRAFT").length,
    };

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
            <header className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => router.back()}
                        className="w-9 h-9 rounded-[4px] bg-white border border-[#E0E0E0] text-[#757575] hover:text-[#1976D2] hover:border-[#E0E0E0] transition-colors flex items-center justify-center shrink-0 shadow-sm"
                        aria-label={tr("assess360.goBack")}
                    >
                        <i className="mdi mdi-arrow-left text-[19px]" />
                    </button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight truncate">{tr("postOnboarding.assessmentCycles")}</h1>
                            <PageHelp title={tr("postOnboarding.assessmentCycles")}>{tr("assess360.cyclesHelp")}</PageHelp>
                        </div>
                        <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("assess360.cyclesSubtitle")}</p>
                    </div>
                </div>
                {canAccess("assessments:moderate") && (
                    <Link
                        href="/enterprise/assessments-360/new"
                        className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-[4px] bg-[#1976D2] text-white text-[13px] font-semibold hover:bg-[#1565C0] shadow-[0_4px_12px_rgba(25,118,210,0.28)] transition-colors shrink-0"
                    >
                        <i className="mdi mdi-plus text-[17px]" />
                        {tr("postOnboarding.newCycle")}
                    </Link>
                )}
            </header>

            {/* Stat cards */}
            <StatGrid>
                <StatCard label={tr("assess360.totalCycles")} value={loading ? "—" : stats.total} icon="sync" gradient="linear-gradient(135deg,#42A5F5,#1976D2)" glow="rgba(25,118,210,0.28)" />
                <StatCard label={tr("general.active")} value={loading ? "—" : stats.active} icon="play_circle" gradient="linear-gradient(135deg,#66BB6A,#2E7D32)" glow="rgba(46,125,50,0.25)" />
                <StatCard label={tr("postOnboarding.drafts")} value={loading ? "—" : stats.drafts} icon="edit_note" gradient="linear-gradient(135deg,#FFB74D,#EF6C00)" glow="rgba(239,108,0,0.25)" />
                <StatCard label={tr("postOnboarding.closed")} value={loading ? "—" : stats.closed} icon="task_alt" gradient="linear-gradient(135deg,#42A5F5,#1565C0)" glow="rgba(21,101,192,0.25)" />
            </StatGrid>

            {/* Toolbar: search + filter */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <Input
                    icon="search"
                    type="text"
                    placeholder={tr("assess360.searchCycles")}
                    className="flex-1"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="relative flex-1 md:flex-none">
                    <i className="mdi mdi-filter-variant absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E] text-[19px] pointer-events-none" />
                    <Select
                        className="h-11 pl-10 pr-8 text-[13px] font-semibold text-[#424242] w-full md:w-auto md:min-w-[170px]"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">{tr("postOnboarding.allCycles")}</option>
                        <option value="ACTIVE">{tr("postOnboarding.activeOnly")}</option>
                        <option value="DRAFT">{tr("postOnboarding.drafts")}</option>
                        <option value="CLOSED">{tr("postOnboarding.closed")}</option>
                    </Select>
                </div>
            </div>

            {/* Cycles list */}
            <Card padding="none" className="overflow-hidden min-h-[420px]">
                {loading ? (
                    <div className="p-4 space-y-2.5">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 bg-[#F5F6F8] rounded-[4px] animate-pulse" />
                        ))}
                    </div>
                ) : filteredCycles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 md:p-20 text-center">
                        <div className="w-16 h-16 bg-[#F5F6F8] rounded-[4px] flex items-center justify-center mb-5 text-[#BDBDBD]">
                            <i className="mdi mdi-sync text-[32px]" />
                        </div>
                        <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#212121] mb-2">
                            {searchQuery || statusFilter !== "all" ? tr("payroll.noCyclesMatch") : tr("assess360.noCyclesYet")}
                        </h3>
                        <p className="text-[#757575] text-[14px] max-w-xs mx-auto mb-7">
                            {searchQuery || statusFilter !== "all"
                                ? tr("assess360.tryAdjusting")
                                : tr("assess360.createFirstCycle")}
                        </p>
                        {searchQuery || statusFilter !== "all" ? (
                            <Button size="sm" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}>
                                {tr("assess360.clearAllFilters")}
                            </Button>
                        ) : (
                            canAccess("assessments:moderate") && (
                                <Link href="/enterprise/assessments-360/new" className="inline-flex items-center gap-2 h-[42px] px-4 rounded-[4px] bg-[#1976D2] text-white text-[13.5px] font-semibold hover:bg-[#1565C0] shadow-[0_6px_16px_rgba(25,118,210,0.28)] transition-colors">
                                    <i className="mdi mdi-plus text-[19px]" /> {tr("postOnboarding.newCycle")}
                                </Link>
                            )
                        )}
                    </div>
                ) : (
                    <>
                        {/* Column header (desktop) */}
                        <div className="hidden md:grid grid-cols-[2.4fr_1.4fr_1fr_140px] gap-4 px-5 py-3 bg-[#FAFAFA] border-b border-[#E0E0E0]">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("assess360.cycleName")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("postOnboarding.timeline")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("postOnboarding.status")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575] text-right">{tr("postOnboarding.actions")}</span>
                        </div>

                        <div className="divide-y divide-[#EEEEEE]">
                            {filteredCycles.map((cycle) => (
                                <div
                                    key={cycle.id}
                                    className="grid grid-cols-[1fr_auto] md:grid-cols-[2.4fr_1.4fr_1fr_140px] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors cursor-pointer group"
                                    onClick={() => router.push(`/enterprise/assessments-360/cycles/${cycle.id}`)}
                                >
                                    {/* Cycle Name */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-9 h-9 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center shrink-0">
                                            <i className="mdi mdi-refresh text-[18px]" />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[14px] font-bold text-[#212121] group-hover:text-[#1976D2] transition-colors truncate">{cycle.name}</p>
                                            <p className="text-[12px] text-[#757575] truncate">{tr("assess360.assessment360")}</p>
                                            {/* mobile-only meta */}
                                            <div className="flex items-center gap-2.5 mt-1 md:hidden">
                                                {statusBadge(cycle.status)}
                                                <span className={`text-[11px] text-[#757575] ${jetbrainsMono.className}`}>
                                                    {new Date(cycle.start_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline (desktop) */}
                                    <div className="hidden md:flex items-center gap-1.5 text-[12.5px] text-[#424242] min-w-0">
                                        <i className="mdi mdi-calendar-month text-[15px] text-[#9E9E9E] shrink-0" />
                                        <span className={`truncate ${jetbrainsMono.className}`}>
                                            {new Date(cycle.start_date).toLocaleDateString()}
                                            <span className="mx-1.5 text-[#BDBDBD]">→</span>
                                            {new Date(cycle.end_date).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* Status (desktop) */}
                                    <div className="hidden md:flex items-center">{statusBadge(cycle.status)}</div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-end">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); router.push(`/enterprise/assessments-360/cycles/${cycle.id}`); }}
                                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[4px] bg-white border border-[#E0E0E0] text-[#424242] text-[12px] font-semibold hover:bg-[#212121] hover:text-white hover:border-[#212121] transition-colors"
                                        >
                                            {tr("assess360.trackProgress")}
                                            <i className="mdi mdi-trending-up text-[15px]" />
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
