"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => router.back()}
                        className="w-9 h-9 rounded-[10px] bg-white border border-[#E1E4E8] text-[#8A929E] hover:text-[#5B53E0] hover:border-[#D4D7DC] transition-colors flex items-center justify-center shrink-0 shadow-sm"
                        aria-label="Go back"
                    >
                        <span className="material-symbols-rounded text-[19px]">arrow_back</span>
                    </button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight truncate">Assessment Cycles</h1>
                            <PageHelp title="Assessment Cycles">All your 360 review cycles. Start a New Cycle, then track each one&apos;s progress here.</PageHelp>
                        </div>
                        <p className="text-[12.5px] text-[#8A929E] mt-0.5">Manage performance reviews &amp; comprehensive feedback</p>
                    </div>
                </div>
                {canAccess("assessments:moderate") && (
                    <Link
                        href="/enterprise/assessments-360/new"
                        className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-semibold hover:bg-[#4A43C9] shadow-[0_4px_12px_rgba(91,83,224,0.28)] transition-colors shrink-0"
                    >
                        <span className="material-symbols-rounded text-[17px]">add</span>
                        New Cycle
                    </Link>
                )}
            </header>

            {/* Stat cards */}
            <StatGrid>
                <StatCard label="Total Cycles" value={loading ? "—" : stats.total} icon="sync" gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)" glow="rgba(91,83,224,0.28)" />
                <StatCard label="Active" value={loading ? "—" : stats.active} icon="play_circle" gradient="linear-gradient(135deg,#34D399,#0E8A6E)" glow="rgba(14,138,110,0.25)" />
                <StatCard label="Drafts" value={loading ? "—" : stats.drafts} icon="edit_note" gradient="linear-gradient(135deg,#F6B65C,#D97706)" glow="rgba(217,119,6,0.25)" />
                <StatCard label="Closed" value={loading ? "—" : stats.closed} icon="task_alt" gradient="linear-gradient(135deg,#6E8BEA,#3559C7)" glow="rgba(53,89,199,0.25)" />
            </StatGrid>

            {/* Toolbar: search + filter */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <Input
                    icon="search"
                    type="text"
                    placeholder="Search cycles by name…"
                    className="flex-1"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="relative flex-1 md:flex-none">
                    <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA3AF] text-[19px] pointer-events-none">filter_list</span>
                    <Select
                        className="h-11 pl-10 pr-8 text-[13px] font-semibold text-[#374151] w-full md:w-auto md:min-w-[170px]"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Cycles</option>
                        <option value="ACTIVE">Active Only</option>
                        <option value="DRAFT">Drafts</option>
                        <option value="CLOSED">Closed</option>
                    </Select>
                </div>
            </div>

            {/* Cycles list */}
            <Card padding="none" className="overflow-hidden min-h-[420px]">
                {loading ? (
                    <div className="p-4 space-y-2.5">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
                        ))}
                    </div>
                ) : filteredCycles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 md:p-20 text-center">
                        <div className="w-16 h-16 bg-[#F4F5F7] rounded-[16px] flex items-center justify-center mb-5 text-[#C7CCD4]">
                            <span className="material-symbols-rounded text-[32px]">sync</span>
                        </div>
                        <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#15171C] mb-2">
                            {searchQuery || statusFilter !== "all" ? "No cycles match your filters" : "No assessment cycles yet"}
                        </h3>
                        <p className="text-[#8A929E] text-[14px] max-w-xs mx-auto mb-7">
                            {searchQuery || statusFilter !== "all"
                                ? "Try adjusting your filters or search terms to find what you're looking for."
                                : "Create your first 360 review cycle to start gathering feedback."}
                        </p>
                        {searchQuery || statusFilter !== "all" ? (
                            <Button size="sm" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}>
                                Clear all filters
                            </Button>
                        ) : (
                            canAccess("assessments:moderate") && (
                                <Link href="/enterprise/assessments-360/new" className="inline-flex items-center gap-2 h-[42px] px-4 rounded-[10px] bg-[#5B53E0] text-white text-[13.5px] font-semibold hover:bg-[#4A43C9] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-colors">
                                    <span className="material-symbols-rounded text-[19px]">add</span> New Cycle
                                </Link>
                            )
                        )}
                    </div>
                ) : (
                    <>
                        {/* Column header (desktop) */}
                        <div className="hidden md:grid grid-cols-[2.4fr_1.4fr_1fr_140px] gap-4 px-5 py-3 bg-[#F7F8FA] border-b border-[#E8EAED]">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Cycle Name</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Timeline</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Status</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Actions</span>
                        </div>

                        <div className="divide-y divide-[#F0F0F1]">
                            {filteredCycles.map((cycle) => (
                                <div
                                    key={cycle.id}
                                    className="grid grid-cols-[1fr_auto] md:grid-cols-[2.4fr_1.4fr_1fr_140px] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#F7F7F8] transition-colors cursor-pointer group"
                                    onClick={() => router.push(`/enterprise/assessments-360/cycles/${cycle.id}`)}
                                >
                                    {/* Cycle Name */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                                            <span className="material-symbols-rounded text-[18px]">refresh</span>
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[14px] font-bold text-[#15171C] group-hover:text-[#5B53E0] transition-colors truncate">{cycle.name}</p>
                                            <p className="text-[12px] text-[#8A929E] truncate">360° Assessment</p>
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
                                    <div className="hidden md:flex items-center gap-1.5 text-[12.5px] text-[#374151] min-w-0">
                                        <span className="material-symbols-rounded text-[15px] text-[#9AA3AF] shrink-0">calendar_month</span>
                                        <span className={`truncate ${jetbrainsMono.className}`}>
                                            {new Date(cycle.start_date).toLocaleDateString()}
                                            <span className="mx-1.5 text-[#C7CCD4]">→</span>
                                            {new Date(cycle.end_date).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* Status (desktop) */}
                                    <div className="hidden md:flex items-center">{statusBadge(cycle.status)}</div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-end">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); router.push(`/enterprise/assessments-360/cycles/${cycle.id}`); }}
                                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] bg-white border border-[#E1E4E8] text-[#374151] text-[12px] font-semibold hover:bg-[#15171C] hover:text-white hover:border-[#15171C] transition-colors"
                                        >
                                            Track Progress
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
