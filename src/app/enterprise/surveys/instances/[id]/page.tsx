"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { apiClient } from "@/utils/api";
import {
    ArrowLeft,
    Megaphone,
    Sparkles,
    BrainCircuit,
    CheckCircle2,
    AlertTriangle,
    Lightbulb,
    HelpCircle,
    TrendingUp,
    MessageSquareQuote,
} from "lucide-react";
import { Card, Badge, StatGrid, StatCard, PageHelp, jetbrainsMono } from "@/components/ds";

interface AIAnalysis {
    summary: string;
    performance_score: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
}

interface QuestionData {
    question_id: string;
    question_text: string;
    question_type: "RATING" | "TEXT" | "MCQ";
    average_score?: number;
    distribution: Record<string, number>;
    response_count: number;
    text_responses: string[];
}

interface Report {
    instance_name: string;
    total_invites: number;
    completed_invites: number;
    questions: QuestionData[];
}

export default function SurveyReport({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { token } = useAuth();
    const { t: tr } = useI18n();
    const router = useRouter();
    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await apiClient.get(`/api/v1/enterprise/surveys/report/${id}`);
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
    }, [id]);

    const generateAIInsights = async () => {
        setAnalyzing(true);
        try {
            const res = await apiClient.post(`/api/v1/enterprise/surveys/report/${id}/ai-analysis`, {});
            if (res.ok) {
                const data = await res.json();
                setAiAnalysis(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setAnalyzing(false);
        }
    };

    if (loading) return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            <div className="h-16 bg-[#F5F6F8] rounded-[4px] animate-pulse" />
            <div className="h-44 bg-[#F5F6F8] rounded-[4px] animate-pulse" />
            <StatGrid>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-[104px] bg-[#F5F6F8] rounded-[4px] animate-pulse" />
                ))}
            </StatGrid>
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-44 bg-[#F5F6F8] rounded-[4px] animate-pulse" />
                ))}
            </div>
        </div>
    );

    if (!report) return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            <Card padding="lg" className="mt-6">
                <div className="flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 bg-[#F5F6F8] rounded-[4px] flex items-center justify-center mb-5">
                        <AlertTriangle className="w-8 h-8 text-[#BDBDBD]" />
                    </div>
                    <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#212121] mb-2">{tr("surveysExt.reportUnavailable")}</h3>
                    <p className="text-[#757575] text-[14px] max-w-xs mx-auto">{tr("surveysExt.reportUnavailableDesc")}</p>
                </div>
            </Card>
        </div>
    );

    const completionRate = report.total_invites > 0 ? (report.completed_invites / report.total_invites) * 100 : 0;

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => router.push('/enterprise/surveys')}
                        aria-label={tr("surveysExt.backToSurveys")}
                        className="w-9 h-9 rounded-[4px] bg-white border border-[#E0E0E0] text-[#757575] hover:text-[#1976D2] hover:bg-[#F5F6F8] transition-colors flex items-center justify-center shrink-0"
                    >
                        <ArrowLeft className="w-[18px] h-[18px]" />
                    </button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight truncate">{report.instance_name}</h1>
                            <PageHelp title={tr("surveysExt.helpCampaignResults")}>{tr("surveysExt.helpCampaignResultsBody")}</PageHelp>
                        </div>
                        <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("surveysExt.aggregatedSubtitle")}</p>
                    </div>
                </div>
                {report.completed_invites < report.total_invites && (
                    <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap sm:shrink-0">
                        <button
                            onClick={() => {
                                apiClient.post(`/api/v1/enterprise/surveys/instances/${id}/notify`, {})
                                    .then(() => alert(tr("surveysExt.remindersSent")))
                                    .catch(() => alert(tr("surveysExt.remindersFailed")));
                            }}
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-[4px] bg-white border border-[#E0E0E0] text-[#424242] text-[13px] font-semibold hover:bg-[#F5F6F8] transition-colors shadow-sm"
                        >
                            <Megaphone className="w-3.5 h-3.5 text-[#1976D2]" /> {tr("surveysExt.remindPending")}
                        </button>
                    </div>
                )}
            </header>

            {/* AI Strategic Intelligence Section */}
            <section className="relative overflow-hidden bg-[#1E2A38] rounded-[4px] p-7 md:p-10 text-white">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-[#1976D2]/15 to-transparent pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#1976D2]/25 rounded-full blur-[80px] pointer-events-none" />

                {!aiAnalysis && !analyzing ? (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                        <div className="space-y-3 text-center md:text-left">
                            <h2 className="text-[22px] font-extrabold tracking-[-0.5px] leading-tight">{tr("surveysExt.strategicAiIntelligence")}</h2>
                            <p className="text-white/55 text-[14px] font-medium max-w-xl leading-relaxed">{tr("surveysExt.strategicAiDesc")}</p>
                        </div>
                        <button
                            onClick={generateAIInsights}
                            className="inline-flex items-center gap-2 h-[46px] px-5 rounded-[4px] bg-[#1976D2] text-white text-[14px] font-semibold hover:bg-[#1565C0] shadow-[0_6px_16px_rgba(25,118,210,0.4)] transition-colors shrink-0"
                        >
                            <BrainCircuit className="w-[18px] h-[18px]" /> {tr("surveysExt.generateInsights")}
                        </button>
                    </div>
                ) : analyzing ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-6 relative z-10">
                        <div className="w-14 h-14 border-4 border-[#1976D2]/40 border-t-white rounded-full animate-spin" />
                        <div className="text-center space-y-1.5">
                            <h3 className="text-[16px] font-extrabold tracking-[-0.3px]">{tr("surveysExt.analyzingPulse")}</h3>
                            <p className="text-white/45 text-[11px] font-semibold uppercase tracking-[0.04em]">{tr("surveysExt.processingFeedback")}</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-9 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <header className="flex flex-col md:flex-row items-start justify-between gap-6 pb-8 border-b border-white/10">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-0.5 text-[12px] font-semibold bg-[#1976D2] text-white">
                                        <Sparkles className="w-3 h-3" /> {tr("surveysExt.strategicInsight")}
                                    </span>
                                    <span className="text-white/45 text-[11px] font-semibold uppercase tracking-[0.04em]">{tr("surveysExt.generatedByCroarAi")}</span>
                                </div>
                                <h2 className="text-[24px] md:text-[28px] font-extrabold tracking-[-0.7px] leading-tight">{report.instance_name} {tr("surveysExt.summarySuffix")}</h2>
                                <p className="text-white/70 text-[14px] font-medium max-w-3xl leading-relaxed">&quot;{aiAnalysis?.summary}&quot;</p>
                            </div>
                            <div className="bg-white/[0.06] border border-white/10 p-6 rounded-[4px] text-center min-w-[200px] backdrop-blur-sm shrink-0">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#42A5F5] mb-1">{tr("surveysExt.healthScore")}</p>
                                <div className={`text-[48px] font-semibold tracking-[-1px] text-white leading-none ${jetbrainsMono.className}`}>{aiAnalysis?.performance_score}</div>
                                <div className="w-full h-1.5 bg-white/10 rounded-full mt-4 overflow-hidden">
                                    <div className="h-full bg-[#1976D2] transition-all duration-1000" style={{ width: `${aiAnalysis?.performance_score}%` }} />
                                </div>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#42A5F5] px-1">{tr("surveysExt.culturalStrengths")}</h4>
                                <ul className="space-y-2.5">
                                    {(aiAnalysis?.strengths ?? []).map((s: string, idx: number) => (
                                        <li key={idx} className="flex items-center gap-3 bg-white/[0.05] p-4 rounded-[4px] border border-white/[0.07]">
                                            <CheckCircle2 className="w-[18px] h-[18px] text-[#66BB6A] shrink-0" />
                                            <span className="text-[13.5px] font-semibold text-white/90">{s}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#FB7185] px-1">{tr("surveysExt.detectedRisks")}</h4>
                                <ul className="space-y-2.5">
                                    {(aiAnalysis?.weaknesses ?? []).map((w: string, idx: number) => (
                                        <li key={idx} className="flex items-center gap-3 bg-white/[0.05] p-4 rounded-[4px] border border-white/[0.07]">
                                            <AlertTriangle className="w-[18px] h-[18px] text-[#FB7185] shrink-0" />
                                            <span className="text-[13.5px] font-semibold text-white/90">{w}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/10 space-y-4">
                            <h4 className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#42A5F5] px-1">{tr("surveysExt.aiStrategicRecommendations")}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(aiAnalysis?.recommendations ?? []).map((r: string, idx: number) => (
                                    <div key={idx} className="bg-[#1976D2]/10 border border-[#1976D2]/25 p-5 rounded-[4px] flex gap-4 items-start">
                                        <div className="w-9 h-9 bg-[#1976D2] rounded-[4px] flex items-center justify-center shrink-0 shadow-[0_6px_14px_rgba(25,118,210,0.4)]">
                                            <Lightbulb className="w-[18px] h-[18px] text-white" />
                                        </div>
                                        <p className="text-[13.5px] font-semibold leading-relaxed text-white/90">{r}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Participation metrics */}
            <StatGrid className="lg:grid-cols-3">
                <StatCard label={tr("surveysExt.totalAudience")} value={report.total_invites} icon="groups" gradient="linear-gradient(135deg,#42A5F5,#1565C0)" glow="rgba(21,101,192,0.25)" />
                <StatCard label={tr("surveysExt.totalReturns")} value={report.completed_invites} icon="task_alt" gradient="linear-gradient(135deg,#66BB6A,#2E7D32)" glow="rgba(46,125,50,0.25)" />
                <Card padding="sm" className="flex flex-col justify-center">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("surveysExt.participationRate")}</span>
                        <span className={`text-[24px] font-semibold tracking-[-1px] text-[#1976D2] leading-none ${jetbrainsMono.className}`}>{completionRate.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-[#F5F6F8] rounded-full overflow-hidden border border-[#E0E0E0]">
                        <div className="h-full bg-[#1976D2] rounded-full transition-all duration-1000" style={{ width: `${completionRate}%` }} />
                    </div>
                </Card>
            </StatGrid>

            {/* Detailed findings */}
            <div className="space-y-4">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575] px-1">{tr("surveysExt.detailedFindings")}</h2>
                <div className="grid grid-cols-1 gap-4">
                    {report.questions.map((q: QuestionData) => (
                        <Card key={q.question_id} padding="lg" interactive className="space-y-7">
                            <div className="flex gap-3.5 items-start">
                                <span className="w-9 h-9 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center shrink-0">
                                    <HelpCircle className="w-[18px] h-[18px]" />
                                </span>
                                <h3 className="text-[17px] font-bold text-[#212121] tracking-[-0.3px] leading-snug pt-1">{q.question_text}</h3>
                            </div>

                            {q.question_type === 'RATING' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center px-1">
                                    <div>
                                        <div className="flex justify-between items-end mb-4">
                                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("surveysExt.scoreDistribution")}</span>
                                            <span className={`text-[14px] font-semibold text-[#212121] ${jetbrainsMono.className}`}>{tr("surveysExt.avg")} {q.average_score?.toFixed(1) || '0.0'}</span>
                                        </div>
                                        <div className="space-y-3.5">
                                            {['5', '4', '3', '2', '1'].map(val => (
                                                <div key={val} className="flex items-center gap-3">
                                                    <span className={`text-[12px] font-semibold text-[#757575] w-2 text-right ${jetbrainsMono.className}`}>{val}</span>
                                                    <div className="flex-1 h-2 bg-[#F5F6F8] rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-[#1976D2]/70 rounded-full transition-all duration-1000"
                                                            style={{ width: `${(q.distribution[val] || 0) / q.response_count * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-[12px] font-semibold text-[#757575] w-6 text-right ${jetbrainsMono.className}`}>{q.distribution[val] || 0}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center relative py-8">
                                        <div className="text-center space-y-2 relative z-10">
                                            <p className={`text-[64px] font-semibold text-[#212121] tracking-[-2px] leading-none ${jetbrainsMono.className}`}>{q.average_score?.toFixed(1) || '0.0'}</p>
                                            <Badge tone="neutral">{tr("surveysExt.organizationalPulse")}</Badge>
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] select-none pointer-events-none">
                                            <TrendingUp className="w-[160px] h-[160px] text-[#1976D2]" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {q.question_type === 'TEXT' && (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                                    {q.text_responses.length > 0 ? q.text_responses.map((resp: string, idx: number) => (
                                        <div key={idx} className="flex gap-3 bg-[#FAFAFA] p-4 rounded-[4px] border border-[#E0E0E0] border-l-[3px] border-l-[#1976D2]/40 text-[13.5px] font-medium text-[#424242] leading-relaxed">
                                            <MessageSquareQuote className="w-4 h-4 text-[#9E9E9E] shrink-0 mt-0.5" />
                                            <span>&quot;{resp}&quot;</span>
                                        </div>
                                    )) : (
                                        <p className="text-[#757575] text-[13px] font-medium text-center py-8">{tr("surveysExt.noTextEntries")}</p>
                                    )}
                                </div>
                            )}

                            {q.question_type === 'MCQ' && (
                                <div className="space-y-3.5">
                                    {Object.entries(q.distribution).map(([opt, count]) => (
                                        <div key={opt} className="space-y-1.5">
                                            <div className="flex justify-between text-[13px] font-semibold">
                                                <span className="text-[#424242]">{opt}</span>
                                                <span className={`text-[#1976D2] ${jetbrainsMono.className}`}>{count} {tr("surveysExt.choices")}</span>
                                            </div>
                                            <div className="h-2 bg-[#F5F6F8] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#1976D2]/70 rounded-full transition-all duration-1000"
                                                    style={{ width: `${(count / q.response_count) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
