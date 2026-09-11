"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { apiClient } from "@/utils/api";
import {
    Search,
    Filter,
    ChevronDown,
    Plus,
    FileText,
    Calendar,
    CalendarClock,
    Send,
    BarChart3,
} from "@/components/icons";
import { StatGrid, StatCard, Badge, Button, EmptyState, PageHelp, jetbrainsMono } from "@/components/ds";

export default function SurveyDashboard() {
    const { token, canAccess } = useAuth();
    const { t: tr } = useI18n();
    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [instances, setInstances] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const filteredInstances = instances.filter(inst =>
        (statusFilter === "all" || inst.status === statusFilter) &&
        (inst.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [instRes, tplRes] = await Promise.all([
                    apiClient.get('/api/v1/enterprise/surveys/instances'),
                    apiClient.get('/api/v1/enterprise/surveys/templates')
                ]);
                if (instRes.ok) setInstances(await instRes.json());
                if (tplRes.ok) setTemplates(await tplRes.json());
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const selectCls =
        "appearance-none bg-white border border-[#E0E0E0] rounded-[4px] h-10 pl-9 pr-9 text-[13px] font-medium text-[#424242] outline-none cursor-pointer hover:bg-[#FAFAFA] focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all";

    const statusBadge = (status: string) =>
        status === 'ACTIVE' ? (
            <Badge tone="success" dot>{tr("surveysExt.statusActive")}</Badge>
        ) : status === 'CLOSED' ? (
            <Badge tone="neutral" dot>{tr("surveysExt.statusClosed")}</Badge>
        ) : (
            <Badge tone="warning" dot>{status}</Badge>
        );

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight">{tr("postOnboarding.surveysTitle")}</h1>
                        <PageHelp title={tr("postOnboarding.surveysTitle")}>
                            <p>{tr("postOnboarding.measureEngagement")}</p>
                            <p>{tr("surveysExt.helpCreatePre")} <strong>{tr("surveysExt.helpLaunchWord")}</strong> {tr("surveysExt.helpCreatePost")}</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("surveysExt.measureEngagementSubtitle")}</p>
                </div>
                {canAccess("surveys:create") && (
                    <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap sm:shrink-0">
                        <Link
                            href="/enterprise/surveys/templates"
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-[4px] bg-white border border-[#E0E0E0] text-[#424242] text-[13px] font-semibold hover:bg-[#F5F6F8] transition-colors shadow-sm"
                        >
                            <FileText className="w-3.5 h-3.5 text-[#1976D2]" /> {tr("postOnboarding.templates")}
                        </Link>
                        <Link
                            href="/enterprise/surveys/new"
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-[4px] bg-[#1976D2] text-white text-[13px] font-semibold hover:bg-[#1565C0] shadow-[0_4px_12px_rgba(25,118,210,0.28)] transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" /> {tr("postOnboarding.launchSurvey")}
                        </Link>
                    </div>
                )}
            </header>

            {/* Stat cards */}
            <StatGrid>
                <StatCard label={tr("surveysExt.activeCampaigns")} value={instances.filter(i => i.status === 'ACTIVE').length} icon="rocket_launch" gradient="linear-gradient(135deg,#42A5F5,#1976D2)" glow="rgba(25,118,210,0.25)" />
                <StatCard label={tr("surveysExt.inProgress")} value={instances.filter(i => i.status === 'DRAFT').length} icon="hourglass_empty" gradient="linear-gradient(135deg,#FFB74D,#EF6C00)" glow="rgba(239,108,0,0.25)" />
                <StatCard label={tr("surveysExt.totalCompleted")} value={instances.filter(i => i.status === 'CLOSED').length} icon="task_alt" gradient="linear-gradient(135deg,#66BB6A,#2E7D32)" glow="rgba(46,125,50,0.25)" />
                <StatCard label={tr("surveysExt.frameworks")} value={templates.length} icon="poll" gradient="linear-gradient(135deg,#42A5F5,#1565C0)" glow="rgba(21,101,192,0.25)" />
            </StatGrid>

            {/* Toolbar: search + filter */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9E9E9E]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={tr("surveysExt.searchSurveys")}
                        className="w-full h-10 bg-white border border-[#E0E0E0] rounded-[4px] pl-10 pr-4 text-[14px] text-[#212121] placeholder:text-[#9E9E9E] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all"
                    />
                </div>

                <div className="flex items-center gap-2.5">
                    <div className="relative flex-1 md:flex-none">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className={`${selectCls} w-full md:min-w-[170px]`}
                        >
                            <option value="all">{tr("postOnboarding.allCampaigns")}</option>
                            <option value="ACTIVE">{tr("postOnboarding.activeOnly")}</option>
                            <option value="DRAFT">{tr("postOnboarding.drafts")}</option>
                            <option value="CLOSED">{tr("postOnboarding.closed")}</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Survey campaigns list */}
            <div className="bg-white rounded-[4px] border border-[#E0E0E0] overflow-hidden min-h-[420px]">
                {loading ? (
                    <div className="p-4 space-y-2.5">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 bg-[#F5F6F8] rounded-[4px] animate-pulse" />
                        ))}
                    </div>
                ) : instances.length === 0 ? (
                    <EmptyState
                        tone="brand"
                        icon="poll"
                        title={tr("surveysExt.launchFirstSurvey")}
                        description={tr("surveysExt.launchFirstSurveyDesc")}
                        action={
                            canAccess("surveys:create") ? (
                                <Link href="/enterprise/surveys/new">
                                    <Button icon="rocket_launch">{tr("postOnboarding.launchSurvey")}</Button>
                                </Link>
                            ) : undefined
                        }
                        secondary={
                            canAccess("surveys:create") ? (
                                <Link href="/enterprise/surveys/templates">
                                    <Button variant="secondary" icon="description">{tr("postOnboarding.templates")}</Button>
                                </Link>
                            ) : undefined
                        }
                    />
                ) : filteredInstances.length === 0 ? (
                    <EmptyState
                        tone="muted"
                        icon="search_off"
                        title={tr("surveysExt.noSurveysMatch")}
                        description={tr("surveysExt.noSurveysMatchDesc")}
                        action={
                            <Button
                                variant="secondary"
                                icon="filter_alt_off"
                                onClick={() => {
                                    setSearchQuery("");
                                    setStatusFilter("all");
                                }}
                            >
                                {tr("payroll.clearFilters")}
                            </Button>
                        }
                    />
                ) : (
                    <>
                        {/* Column header (desktop) */}
                        <div className="hidden md:grid grid-cols-[2.4fr_1.2fr_1fr_140px] gap-4 px-5 py-3 bg-[#FAFAFA] border-b border-[#E0E0E0]">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("postOnboarding.campaignDetails")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("postOnboarding.timeline")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("postOnboarding.status")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575] text-right">{tr("postOnboarding.actions")}</span>
                        </div>

                        <div className="divide-y divide-[#EEEEEE]">
                            {filteredInstances.map((instance) => (
                                <div role="presentation"
                                    key={instance.id}
                                    onClick={() => router.push(`/enterprise/surveys/instances/${instance.id}`)}
                                    className="grid grid-cols-[1fr_auto] md:grid-cols-[2.4fr_1.2fr_1fr_140px] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors group cursor-pointer"
                                >
                                    {/* Campaign Details */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-9 h-9 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center shrink-0">
                                            <FileText className="w-[17px] h-[17px]" />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[14px] font-bold text-[#212121] group-hover:text-[#1976D2] transition-colors truncate">{instance.name}</p>
                                            <p className="text-[12px] text-[#757575] mt-0.5 truncate">{tr("surveysExt.targetLabel")} {instance.target_group}</p>
                                            {/* mobile-only timeline */}
                                            <div className="flex items-center gap-2.5 mt-1 text-[12px] text-[#757575] md:hidden">
                                                <span className={`inline-flex items-center gap-1 ${jetbrainsMono.className}`}>
                                                    <Calendar className="w-3.5 h-3.5" /> {new Date(instance.start_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline (desktop) */}
                                    <div className="hidden md:flex flex-col gap-1 min-w-0">
                                        <div className="flex items-center gap-1.5 text-[12.5px] text-[#424242]">
                                            <Calendar className="w-3.5 h-3.5 text-[#9E9E9E] shrink-0" />
                                            <span className={jetbrainsMono.className}>{new Date(instance.start_date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[12.5px] text-[#757575]">
                                            <CalendarClock className="w-3.5 h-3.5 text-[#9E9E9E] shrink-0" />
                                            <span className={jetbrainsMono.className}>{new Date(instance.end_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {/* Status (desktop) */}
                                    <div className="hidden md:flex items-center">{statusBadge(instance.status)}</div>

                                    {/* Status (mobile) + Actions */}
                                    <div className="flex items-center gap-1.5 justify-end">
                                        <div className="md:hidden mr-1">{statusBadge(instance.status)}</div>

                                        {instance.status === 'ACTIVE' && canAccess("surveys:moderate") && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    apiClient.post(`/api/v1/enterprise/surveys/instances/${instance.id}/notify`, {})
                                                        .then(() => alert(tr("surveysExt.reminderSent")))
                                                        .catch(() => alert(tr("surveysExt.reminderFailed")));
                                                }}
                                                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] text-[12.5px] font-semibold hover:bg-[#1976D2] hover:text-white transition-colors"
                                            >
                                                {tr("surveysExt.remind")} <Send className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/enterprise/surveys/instances/${instance.id}`);
                                            }}
                                            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[4px] bg-white border border-[#E0E0E0] text-[#424242] text-[12.5px] font-semibold hover:bg-[#212121] hover:text-white hover:border-[#212121] transition-colors"
                                        >
                                            {tr("postOnboarding.view")} <BarChart3 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
