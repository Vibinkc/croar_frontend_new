"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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
} from "lucide-react";
import { StatGrid, StatCard, Badge, Button, EmptyState, PageHelp, jetbrainsMono } from "@/components/ds";

export default function SurveyDashboard() {
    const { token, canAccess } = useAuth();
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
        "appearance-none bg-white border border-[#E1E4E8] rounded-[10px] h-10 pl-9 pr-9 text-[13px] font-medium text-[#374151] outline-none cursor-pointer hover:bg-[#F7F7F8] focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all";

    const statusBadge = (status: string) =>
        status === 'ACTIVE' ? (
            <Badge tone="success" dot>ACTIVE</Badge>
        ) : status === 'CLOSED' ? (
            <Badge tone="neutral" dot>CLOSED</Badge>
        ) : (
            <Badge tone="warning" dot>{status}</Badge>
        );

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">HR Surveys</h1>
                        <PageHelp title="HR Surveys">
                            <p>Measure engagement and culture.</p>
                            <p>Create a template, <strong>Launch</strong> a campaign to your team, and read participation and results. Recipients respond via a secure link.</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#8A929E] mt-0.5">Measure engagement and culture</p>
                </div>
                {canAccess("surveys:create") && (
                    <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap sm:shrink-0">
                        <Link
                            href="/enterprise/surveys/templates"
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] bg-white border border-[#E1E4E8] text-[#374151] text-[13px] font-semibold hover:bg-[#F4F5F7] transition-colors shadow-sm"
                        >
                            <FileText className="w-3.5 h-3.5 text-[#5B53E0]" /> Templates
                        </Link>
                        <Link
                            href="/enterprise/surveys/new"
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-semibold hover:bg-[#4A43C9] shadow-[0_4px_12px_rgba(91,83,224,0.28)] transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" /> Launch Survey
                        </Link>
                    </div>
                )}
            </header>

            {/* Stat cards */}
            <StatGrid>
                <StatCard label="Active Campaigns" value={instances.filter(i => i.status === 'ACTIVE').length} icon="rocket_launch" gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)" glow="rgba(91,83,224,0.25)" />
                <StatCard label="In Progress" value={instances.filter(i => i.status === 'DRAFT').length} icon="hourglass_empty" gradient="linear-gradient(135deg,#F6B65C,#D97706)" glow="rgba(217,119,6,0.25)" />
                <StatCard label="Total Completed" value={instances.filter(i => i.status === 'CLOSED').length} icon="task_alt" gradient="linear-gradient(135deg,#34D399,#0E8A6E)" glow="rgba(14,138,110,0.25)" />
                <StatCard label="Frameworks" value={templates.length} icon="poll" gradient="linear-gradient(135deg,#6E8BEA,#3559C7)" glow="rgba(53,89,199,0.25)" />
            </StatGrid>

            {/* Toolbar: search + filter */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9AA3AF]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search surveys by name…"
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
                            <option value="all">All Campaigns</option>
                            <option value="ACTIVE">Active Only</option>
                            <option value="DRAFT">Drafts</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Survey campaigns list */}
            <div className="bg-white rounded-[14px] border border-[#E8EAED] overflow-hidden min-h-[420px]">
                {loading ? (
                    <div className="p-4 space-y-2.5">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
                        ))}
                    </div>
                ) : instances.length === 0 ? (
                    <EmptyState
                        tone="brand"
                        icon="poll"
                        title="Launch your first survey"
                        description="Measure engagement and culture. Create a template, then launch a campaign to your team."
                        action={
                            canAccess("surveys:create") ? (
                                <Link href="/enterprise/surveys/new">
                                    <Button icon="rocket_launch">Launch Survey</Button>
                                </Link>
                            ) : undefined
                        }
                        secondary={
                            canAccess("surveys:create") ? (
                                <Link href="/enterprise/surveys/templates">
                                    <Button variant="secondary" icon="description">Templates</Button>
                                </Link>
                            ) : undefined
                        }
                    />
                ) : filteredInstances.length === 0 ? (
                    <EmptyState
                        tone="muted"
                        icon="search_off"
                        title="No surveys match your filters"
                        description="Try a different search term or status, or clear your filters to see every campaign."
                        action={
                            <Button
                                variant="secondary"
                                icon="filter_alt_off"
                                onClick={() => {
                                    setSearchQuery("");
                                    setStatusFilter("all");
                                }}
                            >
                                Clear filters
                            </Button>
                        }
                    />
                ) : (
                    <>
                        {/* Column header (desktop) */}
                        <div className="hidden md:grid grid-cols-[2.4fr_1.2fr_1fr_140px] gap-4 px-5 py-3 bg-[#F7F8FA] border-b border-[#E8EAED]">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Campaign Details</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Timeline</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Status</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Actions</span>
                        </div>

                        <div className="divide-y divide-[#F0F0F1]">
                            {filteredInstances.map((instance) => (
                                <div
                                    key={instance.id}
                                    onClick={() => router.push(`/enterprise/surveys/instances/${instance.id}`)}
                                    className="grid grid-cols-[1fr_auto] md:grid-cols-[2.4fr_1.2fr_1fr_140px] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#F7F7F8] transition-colors group cursor-pointer"
                                >
                                    {/* Campaign Details */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                                            <FileText className="w-[17px] h-[17px]" />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[14px] font-bold text-[#15171C] group-hover:text-[#5B53E0] transition-colors truncate">{instance.name}</p>
                                            <p className="text-[12px] text-[#8A929E] mt-0.5 truncate">Target: {instance.target_group}</p>
                                            {/* mobile-only timeline */}
                                            <div className="flex items-center gap-2.5 mt-1 text-[12px] text-[#8A929E] md:hidden">
                                                <span className={`inline-flex items-center gap-1 ${jetbrainsMono.className}`}>
                                                    <Calendar className="w-3.5 h-3.5" /> {new Date(instance.start_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline (desktop) */}
                                    <div className="hidden md:flex flex-col gap-1 min-w-0">
                                        <div className="flex items-center gap-1.5 text-[12.5px] text-[#374151]">
                                            <Calendar className="w-3.5 h-3.5 text-[#9AA3AF] shrink-0" />
                                            <span className={jetbrainsMono.className}>{new Date(instance.start_date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[12.5px] text-[#8A929E]">
                                            <CalendarClock className="w-3.5 h-3.5 text-[#9AA3AF] shrink-0" />
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
                                                        .then(() => alert("Reminder sent successfully!"))
                                                        .catch(() => alert("Failed to send reminder."));
                                                }}
                                                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[9px] bg-[#ECEBFB] text-[#5B53E0] text-[12.5px] font-semibold hover:bg-[#5B53E0] hover:text-white transition-colors"
                                            >
                                                Remind <Send className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/enterprise/surveys/instances/${instance.id}`);
                                            }}
                                            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[9px] bg-white border border-[#E1E4E8] text-[#374151] text-[12.5px] font-semibold hover:bg-[#15171C] hover:text-white hover:border-[#15171C] transition-colors"
                                        >
                                            View <BarChart3 className="w-3.5 h-3.5" />
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
