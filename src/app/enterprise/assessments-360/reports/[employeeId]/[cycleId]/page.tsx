"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { apiClient } from "@/utils/api";
import { Card, Badge, StatCard, StatGrid, PageHelp, jetbrainsMono } from "@/components/ds";
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, Tooltip, Legend
} from 'recharts';

interface CategoryScore {
    category: string;
    self_score: number | null;
    manager_score: number | null;
    peer_score: number | null;
    overall_average: number;
}

interface TextResponse {
    category: string;
    relation: string;
    question: string;
    answer: string;
}

interface Report {
    template_name: string;
    completed_assignments: number;
    total_assignments: number;
    category_scores: CategoryScore[];
    text_responses: TextResponse[];
}

interface ChartDataItem {
    subject: string;
    Self: number;
    Manager: number;
    Peers: number;
    Average: number;
    fullMark: number;
}

export default function X360ReportPage() {
    const { token } = useAuth();
    const { t: tr } = useI18n();
    const router = useRouter();
    const params = useParams();
    const employeeId = params.employeeId as string;
    const cycleId = params.cycleId as string;

    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await apiClient.get(`/api/v1/enterprise/x360/reports/${employeeId}/${cycleId}`);
                if (res.ok) {
                    setReport(await res.json());
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [employeeId, cycleId]);

    if (loading) {
        return (
            <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
                <div className="h-14 bg-[#F4F5F7] rounded-[14px] animate-pulse" />
                <StatGrid>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-[110px] bg-[#F4F5F7] rounded-[14px] animate-pulse" />
                    ))}
                </StatGrid>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="h-[460px] bg-[#F4F5F7] rounded-[14px] animate-pulse" />
                    <div className="h-[460px] bg-[#F4F5F7] rounded-[14px] animate-pulse" />
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
                <Card className="flex flex-col items-center justify-center p-16 md:p-20 text-center mt-6">
                    <div className="w-16 h-16 bg-[#FDECEC] rounded-[16px] flex items-center justify-center mb-5 text-[#C0383C]">
                        <span className="material-symbols-rounded text-[32px]">error_outline</span>
                    </div>
                    <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#15171C] mb-2">{tr("assess360.reportNotFound")}</h3>
                    <p className="text-[#8A929E] text-[14px] max-w-xs mx-auto mb-7">
                        {tr("assess360.reportNotFoundHint")}
                    </p>
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 h-[42px] px-4 rounded-[10px] bg-[#5B53E0] text-white text-[13.5px] font-semibold hover:bg-[#4A43C9] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-colors"
                    >
                        <span className="material-symbols-rounded text-[19px]">arrow_back</span> {tr("assess360.goBack")}
                    </button>
                </Card>
            </div>
        );
    }

    const chartData: ChartDataItem[] = report.category_scores.map((cs) => ({
        subject: cs.category,
        Self: cs.self_score || 0,
        Manager: cs.manager_score || 0,
        Peers: cs.peer_score || 0,
        Average: cs.overall_average || 0,
        fullMark: 5
    }));

    const completionPct = Math.round((report.completed_assignments / report.total_assignments) * 100);

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#8A929E] hover:text-[#374151] transition-colors mb-1.5"
                    >
                        <span className="material-symbols-rounded text-[18px]">arrow_back</span>
                        {tr("common.back")}
                    </button>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight truncate">{tr("assess360.feedbackReport")}</h1>
                        <PageHelp title={tr("assess360.feedbackReport")}>{tr("assess360.feedbackReportHelp")}</PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#8A929E] mt-0.5">
                        {tr("assess360.cycleLabel")} <span className="text-[#374151] font-semibold">{report.template_name}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap sm:shrink-0">
                    <button
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] bg-white border border-[#E1E4E8] text-[#374151] text-[13px] font-semibold hover:bg-[#F4F5F7] transition-colors shadow-sm"
                    >
                        <span className="material-symbols-rounded text-[17px]">print</span>
                        {tr("assess360.print")}
                    </button>
                </div>
            </header>

            {/* Score summary */}
            <StatGrid>
                <StatCard label={tr("assess360.overallAvg")} value={
                    report.category_scores.length
                        ? (report.category_scores.reduce((a, c) => a + (c.overall_average || 0), 0) / report.category_scores.length).toFixed(1)
                        : "—"
                } icon="insights" gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)" glow="rgba(91,83,224,0.28)" />
                <StatCard label={tr("assess360.completion")} value={`${completionPct}%`} icon="task_alt" gradient="linear-gradient(135deg,#34D399,#0E8A6E)" glow="rgba(14,138,110,0.25)" />
                <StatCard label={tr("assess360.responses")} value={`${report.completed_assignments}/${report.total_assignments}`} icon="groups" gradient="linear-gradient(135deg,#6E8BEA,#3559C7)" glow="rgba(53,89,199,0.25)" />
                <StatCard label={tr("assess360.competencies")} value={report.category_scores.length} icon="category" gradient="linear-gradient(135deg,#F6B65C,#D97706)" glow="rgba(217,119,6,0.25)" />
            </StatGrid>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Radar Chart */}
                <Card padding="none" className="overflow-hidden h-[500px] flex flex-col">
                    <div className="flex items-center gap-2.5 px-5 py-3.5 bg-[#F7F8FA] border-b border-[#E8EAED]">
                        <span className="material-symbols-rounded text-[#5B53E0] text-[19px]">radar</span>
                        <h2 className="text-[13px] font-bold text-[#15171C] tracking-tight">{tr("assess360.competencyOverview")}</h2>
                    </div>
                    <div className="flex-1 w-full p-5">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 'bold' }} stroke="#64748b" />
                                <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="#94a3b8" />
                                <Radar name={tr("assess360.self")} dataKey="Self" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.4} />
                                <Radar name={tr("assess360.manager")} dataKey="Manager" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
                                <Radar name={tr("assess360.average")} dataKey="Average" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold' }} />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Score Summary Table */}
                <Card padding="none" className="overflow-hidden flex flex-col">
                    <div className="flex items-center gap-2.5 px-5 py-3.5 bg-[#F7F8FA] border-b border-[#E8EAED]">
                        <span className="material-symbols-rounded text-[#5B53E0] text-[19px]">table_chart</span>
                        <h2 className="text-[13px] font-bold text-[#15171C] tracking-tight">{tr("assess360.aggregateScores")}</h2>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] border-b border-[#E8EAED] bg-[#F7F8FA]">
                                    <th className="py-3 px-4">{tr("assess360.category")}</th>
                                    <th className="py-3 px-2 text-center">{tr("assess360.self")}</th>
                                    <th className="py-3 px-2 text-center">{tr("assess360.manager")}</th>
                                    <th className="py-3 px-2 text-center">{tr("assess360.peers")}</th>
                                    <th className="py-3 px-4 text-center">{tr("assess360.avg")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F0F0F1]">
                                {report.category_scores.map((cs) => (
                                    <tr key={cs.category} className="hover:bg-[#F7F7F8] transition-colors">
                                        <td className="py-4 px-4 text-[13px] font-bold text-[#15171C]">{cs.category}</td>
                                        <td className={`py-4 px-2 text-center text-[13px] font-semibold text-[#5B53E0] ${jetbrainsMono.className}`}>{cs.self_score?.toFixed(1) || '-'}</td>
                                        <td className={`py-4 px-2 text-center text-[13px] font-semibold text-[#D97706] ${jetbrainsMono.className}`}>{cs.manager_score?.toFixed(1) || '-'}</td>
                                        <td className={`py-4 px-2 text-center text-[13px] font-semibold text-[#374151] ${jetbrainsMono.className}`}>{cs.peer_score?.toFixed(1) || '-'}</td>
                                        <td className={`py-4 px-4 text-center text-[13px] font-bold text-[#0E8A6E] ${jetbrainsMono.className}`}>{cs.overall_average?.toFixed(1)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Competency breakdown bars */}
            <Card padding="none" className="overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-3.5 bg-[#F7F8FA] border-b border-[#E8EAED]">
                    <span className="material-symbols-rounded text-[#5B53E0] text-[19px]">bar_chart</span>
                    <h2 className="text-[13px] font-bold text-[#15171C] tracking-tight">{tr("assess360.competencyBreakdown")}</h2>
                </div>
                <div className="p-5 space-y-4">
                    {report.category_scores.map((cs) => (
                        <div key={cs.category} className="space-y-1.5">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-[13px] font-semibold text-[#374151] truncate">{cs.category}</span>
                                <span className={`text-[12.5px] font-bold text-[#15171C] shrink-0 ${jetbrainsMono.className}`}>{cs.overall_average?.toFixed(1)}<span className="text-[#8A929E] font-medium"> / 5</span></span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-[#ECEBFB] overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#8B7DFF] to-[#5B53E0]"
                                    style={{ width: `${Math.min(((cs.overall_average || 0) / 5) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Qualitative Feedback */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-[17px] font-extrabold tracking-[-0.3px] text-[#15171C]">{tr("assess360.qualitativeInsights")}</h2>
                    <Badge tone="neutral">{report.text_responses.length}</Badge>
                </div>
                {report.text_responses.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-14 h-14 bg-[#F4F5F7] rounded-[16px] flex items-center justify-center mb-4 text-[#C7CCD4]">
                            <span className="material-symbols-rounded text-[28px]">chat_bubble_outline</span>
                        </div>
                        <p className="text-[#8A929E] text-[14px] font-medium">{tr("assess360.noQualitative")}</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {report.text_responses.map((resp, idx) => (
                            <Card key={idx} interactive className="space-y-3">
                                <div className="flex justify-between items-start gap-2">
                                    <Badge tone="indigo">{resp.category}</Badge>
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{resp.relation}</span>
                                </div>
                                <p className="text-[12px] font-semibold text-[#8A929E]">{tr("assess360.qPrefix")} {resp.question}</p>
                                <p className="text-[13.5px] text-[#374151] leading-relaxed">&quot;{resp.answer}&quot;</p>
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
