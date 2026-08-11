"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { apiClient } from "@/utils/api";
import { Badge, Card, StatGrid, StatCard, PageHelp, jetbrainsMono } from "@/components/ds";

interface ProgressBreakdown {
    rater_relation: string;
    status: string;
}

interface RateeProgress {
    ratee_id: string;
    ratee_name: string;
    total: number;
    completed: number;
    ai_score?: number;
    breakdown: ProgressBreakdown[];
}

export default function X360CycleProgress() {
    const { token } = useAuth();
    const { t: tr } = useI18n();
    const router = useRouter();
    const params = useParams();
    const cycleId = params.id as string;

    const [progress, setProgress] = useState<RateeProgress[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const res = await apiClient.get(`/api/v1/enterprise/x360/cycles/${cycleId}/progress`);
                if (res.ok) {
                    setProgress(await res.json());
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchProgress();
    }, [cycleId]);

    const getRelationIcon = (rel: string) => {
        switch(rel) {
            case 'SELF': return 'person';
            case 'MANAGER': return 'supervisor_account';
            case 'PEER': return 'groups';
            case 'REPORT': return 'assignment_ind';
            default: return 'help';
        }
    };

    // Presentation-only derived metrics (no logic / fetching changes)
    const totalRatees = progress.length;
    const completedRatees = progress.filter(r => r.total > 0 && r.completed >= r.total).length;
    const totalResponses = progress.reduce((acc, r) => acc + r.total, 0);
    const completedResponses = progress.reduce((acc, r) => acc + r.completed, 0);
    const overallPct = totalResponses > 0 ? Math.round((completedResponses / totalResponses) * 100) : 0;

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => router.back()}
                        className="w-9 h-9 rounded-[10px] bg-white border border-[#E1E4E8] text-[#8A929E] hover:text-[#5B53E0] hover:border-[#D4D7DC] transition-colors flex items-center justify-center shrink-0 shadow-sm"
                        aria-label={tr("assess360.goBack")}
                    >
                        <span className="material-symbols-rounded text-[19px]">arrow_back</span>
                    </button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">{tr("assess360.cycleProgressTracker")}</h1>
                            <PageHelp title={tr("assess360.cycleProgressTracker")}>{tr("assess360.cycleProgressHelp")}</PageHelp>
                        </div>
                        <p className="text-[12.5px] text-[#8A929E] mt-0.5">{tr("assess360.detailedBreakdown")}</p>
                    </div>
                </div>
            </header>

            {/* Stat cards */}
            <StatGrid>
                <StatCard label={tr("assess360.projectRatees")} value={loading ? "—" : totalRatees} icon="groups" gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)" glow="rgba(91,83,224,0.28)" />
                <StatCard label={tr("assess360.fullyReviewed")} value={loading ? "—" : completedRatees} icon="task_alt" gradient="linear-gradient(135deg,#34D399,#0E8A6E)" glow="rgba(14,138,110,0.25)" />
                <StatCard label={tr("assess360.responsesIn")} value={loading ? "—" : `${completedResponses}/${totalResponses}`} icon="fact_check" gradient="linear-gradient(135deg,#6E8BEA,#3559C7)" glow="rgba(53,89,199,0.25)" />
                <StatCard label={tr("assess360.overallProgress")} value={loading ? "—" : `${overallPct}%`} icon="monitoring" gradient="linear-gradient(135deg,#F6B65C,#D97706)" glow="rgba(217,119,6,0.25)" />
            </StatGrid>

            {/* Ratee progress list */}
            <Card padding="none" className="overflow-hidden min-h-[420px]">
                <div className="flex items-center justify-between px-5 py-3.5 bg-[#F7F8FA] border-b border-[#E8EAED]">
                    <div className="flex items-center gap-2.5">
                        <span className="material-symbols-rounded text-[#5B53E0] text-[19px]">monitoring</span>
                        <h2 className="text-[13px] font-bold text-[#15171C] tracking-tight">{tr("assess360.progressByEmployee")}</h2>
                    </div>
                    {!loading && (
                        <span className={`text-[12px] text-[#8A929E] ${jetbrainsMono.className}`}>{totalRatees} {totalRatees === 1 ? tr("assess360.ratee") : tr("assess360.ratees")}</span>
                    )}
                </div>

                {loading ? (
                    <div className="p-4 space-y-2.5">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-24 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
                        ))}
                    </div>
                ) : progress.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 md:p-20 text-center">
                        <div className="w-16 h-16 bg-[#F4F5F7] rounded-[16px] flex items-center justify-center mb-5 text-[#C7CCD4]">
                            <span className="material-symbols-rounded text-[32px]">group_off</span>
                        </div>
                        <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#15171C] mb-2">{tr("assess360.noRatees")}</h3>
                        <p className="text-[#8A929E] text-[14px] max-w-xs mx-auto">
                            {tr("assess360.noRateesHint")}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-[#F0F0F1]">
                        {progress.map((ratee) => {
                            const pct = ratee.total > 0 ? Math.round((ratee.completed / ratee.total) * 100) : 0;
                            const isComplete = pct === 100;
                            const hasScore = ratee.ai_score !== null && ratee.ai_score !== undefined;
                            return (
                                <div
                                    key={ratee.ratee_id}
                                    className="px-4 md:px-5 py-4 hover:bg-[#F7F7F8] transition-colors group"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
                                        {/* Employee identity */}
                                        <div className="flex items-center gap-3 min-w-0 lg:w-[230px] shrink-0">
                                            <span className="w-10 h-10 rounded-[11px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                                                <span className="material-symbols-rounded text-[22px]">account_circle</span>
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-[14px] font-bold text-[#15171C] group-hover:text-[#5B53E0] transition-colors truncate">{ratee.ratee_name}</p>
                                                <p className="text-[12px] text-[#8A929E] truncate">{tr("assess360.projectRatee")}</p>
                                            </div>
                                        </div>

                                        {/* Rater breakdown chips */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap gap-2">
                                                {ratee.breakdown.map((b, bIdx) => {
                                                    const done = b.status === 'COMPLETED';
                                                    return (
                                                        <span
                                                            key={bIdx}
                                                            className={`inline-flex items-center gap-1.5 h-7 pl-2 pr-2.5 rounded-[9px] border text-[11px] font-semibold transition-colors ${
                                                                done
                                                                    ? 'bg-[#E6F4EA] border-[#CDEBD6] text-[#15803D]'
                                                                    : 'bg-[#F7F8FA] border-[#E8EAED] text-[#8A929E]'
                                                            }`}
                                                        >
                                                            <span className="material-symbols-rounded text-[15px] leading-none">{getRelationIcon(b.rater_relation)}</span>
                                                            <span className="truncate">{b.rater_relation}</span>
                                                            <span className="material-symbols-rounded text-[14px] leading-none">{done ? 'check_circle' : 'schedule'}</span>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Progress + stats */}
                                        <div className="lg:w-[280px] shrink-0 space-y-2">
                                            <div className="flex items-end justify-between gap-3">
                                                <div className="flex items-center gap-2.5">
                                                    <span className={`text-[18px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-none ${jetbrainsMono.className}`}>{pct}%</span>
                                                    {isComplete
                                                        ? <Badge tone="success" dot>{tr("assess360.complete")}</Badge>
                                                        : <Badge tone="warning" dot>{tr("assess360.inProgress")}</Badge>}
                                                    {hasScore && (
                                                        <Badge tone="indigo">
                                                            <span className="material-symbols-rounded text-[14px] leading-none">auto_awesome</span>
                                                            AI {ratee.ai_score}/10
                                                        </Badge>
                                                    )}
                                                </div>
                                                <span className={`text-[12px] text-[#8A929E] leading-none ${jetbrainsMono.className}`}>{ratee.completed}/{ratee.total}</span>
                                            </div>
                                            <div className="h-2 bg-[#EFF0F2] rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-700 ${isComplete ? 'bg-[#0E8A6E]' : 'bg-[#5B53E0]'}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            {isComplete && (
                                                <button
                                                    onClick={() => router.push(`/enterprise/assessments-360/reports/${ratee.ratee_id}/${cycleId}`)}
                                                    className="w-full inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-[10px] bg-white border border-[#E1E4E8] text-[#374151] text-[12.5px] font-semibold hover:bg-[#15171C] hover:text-white hover:border-[#15171C] transition-colors"
                                                >
                                                    <span className="material-symbols-rounded text-[16px]">analytics</span>
                                                    {tr("assess360.fullInsightReport")}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
        </div>
    );
}
