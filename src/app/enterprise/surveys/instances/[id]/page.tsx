"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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
            <div className="h-16 bg-[#F4F5F7] rounded-[14px] animate-pulse" />
            <div className="h-44 bg-[#F4F5F7] rounded-[14px] animate-pulse" />
            <StatGrid>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-[104px] bg-[#F4F5F7] rounded-[14px] animate-pulse" />
                ))}
            </StatGrid>
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-44 bg-[#F4F5F7] rounded-[14px] animate-pulse" />
                ))}
            </div>
        </div>
    );

    if (!report) return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            <Card padding="lg" className="mt-6">
                <div className="flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 bg-[#F4F5F7] rounded-[16px] flex items-center justify-center mb-5">
                        <AlertTriangle className="w-8 h-8 text-[#C7CCD4]" />
                    </div>
                    <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#15171C] mb-2">Report data unavailable</h3>
                    <p className="text-[#8A929E] text-[14px] max-w-xs mx-auto">This report could not be loaded, or you are not authorized to view it.</p>
                </div>
            </Card>
        </div>
    );

    const completionRate = report.total_invites > 0 ? (report.completed_invites / report.total_invites) * 100 : 0;

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => router.push('/enterprise/surveys')}
                        aria-label="Back to surveys"
                        className="w-9 h-9 rounded-[10px] bg-white border border-[#E1E4E8] text-[#8A929E] hover:text-[#5B53E0] hover:bg-[#F4F5F7] transition-colors flex items-center justify-center shrink-0"
                    >
                        <ArrowLeft className="w-[18px] h-[18px]" />
                    </button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight truncate">{report.instance_name}</h1>
                            <PageHelp title="Campaign Results">This campaign&apos;s results — responses, completion and AI insights. Send reminders to anyone still pending.</PageHelp>
                        </div>
                        <p className="text-[12.5px] text-[#8A929E] mt-0.5">Aggregated sentiment analysis &amp; participation data</p>
                    </div>
                </div>
                {report.completed_invites < report.total_invites && (
                    <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap sm:shrink-0">
                        <button
                            onClick={() => {
                                apiClient.post(`/api/v1/enterprise/surveys/instances/${id}/notify`, {})
                                    .then(() => alert("Reminders sent to all pending participants!"))
                                    .catch(() => alert("Failed to send reminders."));
                            }}
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] bg-white border border-[#E1E4E8] text-[#374151] text-[13px] font-semibold hover:bg-[#F4F5F7] transition-colors shadow-sm"
                        >
                            <Megaphone className="w-3.5 h-3.5 text-[#5B53E0]" /> Remind Pending
                        </button>
                    </div>
                )}
            </header>

            {/* AI Strategic Intelligence Section */}
            <section className="relative overflow-hidden bg-[#0E1014] rounded-[20px] p-7 md:p-10 text-white">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-[#5B53E0]/15 to-transparent pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#5B53E0]/25 rounded-full blur-[80px] pointer-events-none" />

                {!aiAnalysis && !analyzing ? (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                        <div className="space-y-3 text-center md:text-left">
                            <h2 className="text-[22px] font-extrabold tracking-[-0.5px] leading-tight">Strategic AI Intelligence</h2>
                            <p className="text-white/55 text-[14px] font-medium max-w-xl leading-relaxed">Let AI evaluate the organizational pulse, detect hidden risks, and suggest actionable strategic improvements based on this feedback.</p>
                        </div>
                        <button
                            onClick={generateAIInsights}
                            className="inline-flex items-center gap-2 h-[46px] px-5 rounded-[10px] bg-[#5B53E0] text-white text-[14px] font-semibold hover:bg-[#4A43C9] shadow-[0_6px_16px_rgba(91,83,224,0.4)] transition-colors shrink-0"
                        >
                            <BrainCircuit className="w-[18px] h-[18px]" /> Generate Insights
                        </button>
                    </div>
                ) : analyzing ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-6 relative z-10">
                        <div className="w-14 h-14 border-4 border-[#5B53E0]/40 border-t-white rounded-full animate-spin" />
                        <div className="text-center space-y-1.5">
                            <h3 className="text-[16px] font-extrabold tracking-[-0.3px]">Analyzing Pulse…</h3>
                            <p className="text-white/45 text-[11px] font-semibold uppercase tracking-[0.04em]">Processing aggregated feedback</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-9 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <header className="flex flex-col md:flex-row items-start justify-between gap-6 pb-8 border-b border-white/10">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="inline-flex items-center gap-1.5 rounded-[20px] px-2.5 py-0.5 text-[12px] font-semibold bg-[#5B53E0] text-white">
                                        <Sparkles className="w-3 h-3" /> Strategic Insight
                                    </span>
                                    <span className="text-white/45 text-[11px] font-semibold uppercase tracking-[0.04em]">Generated by Croar AI</span>
                                </div>
                                <h2 className="text-[24px] md:text-[28px] font-extrabold tracking-[-0.7px] leading-tight">{report.instance_name} Summary</h2>
                                <p className="text-white/70 text-[14px] font-medium max-w-3xl leading-relaxed">&quot;{aiAnalysis?.summary}&quot;</p>
                            </div>
                            <div className="bg-white/[0.06] border border-white/10 p-6 rounded-[14px] text-center min-w-[200px] backdrop-blur-sm shrink-0">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8B7DFF] mb-1">Health Score</p>
                                <div className={`text-[48px] font-semibold tracking-[-1px] text-white leading-none ${jetbrainsMono.className}`}>{aiAnalysis?.performance_score}</div>
                                <div className="w-full h-1.5 bg-white/10 rounded-full mt-4 overflow-hidden">
                                    <div className="h-full bg-[#5B53E0] transition-all duration-1000" style={{ width: `${aiAnalysis?.performance_score}%` }} />
                                </div>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8B7DFF] px-1">Cultural Strengths</h4>
                                <ul className="space-y-2.5">
                                    {(aiAnalysis?.strengths ?? []).map((s: string, idx: number) => (
                                        <li key={idx} className="flex items-center gap-3 bg-white/[0.05] p-4 rounded-[12px] border border-white/[0.07]">
                                            <CheckCircle2 className="w-[18px] h-[18px] text-[#34D399] shrink-0" />
                                            <span className="text-[13.5px] font-semibold text-white/90">{s}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#FB7185] px-1">Detected Risks</h4>
                                <ul className="space-y-2.5">
                                    {(aiAnalysis?.weaknesses ?? []).map((w: string, idx: number) => (
                                        <li key={idx} className="flex items-center gap-3 bg-white/[0.05] p-4 rounded-[12px] border border-white/[0.07]">
                                            <AlertTriangle className="w-[18px] h-[18px] text-[#FB7185] shrink-0" />
                                            <span className="text-[13.5px] font-semibold text-white/90">{w}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/10 space-y-4">
                            <h4 className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8B7DFF] px-1">AI Strategic Recommendations</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(aiAnalysis?.recommendations ?? []).map((r: string, idx: number) => (
                                    <div key={idx} className="bg-[#5B53E0]/10 border border-[#5B53E0]/25 p-5 rounded-[14px] flex gap-4 items-start">
                                        <div className="w-9 h-9 bg-[#5B53E0] rounded-[10px] flex items-center justify-center shrink-0 shadow-[0_6px_14px_rgba(91,83,224,0.4)]">
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
                <StatCard label="Total Audience" value={report.total_invites} icon="groups" gradient="linear-gradient(135deg,#6E8BEA,#3559C7)" glow="rgba(53,89,199,0.25)" />
                <StatCard label="Total Returns" value={report.completed_invites} icon="task_alt" gradient="linear-gradient(135deg,#34D399,#0E8A6E)" glow="rgba(14,138,110,0.25)" />
                <Card padding="sm" className="flex flex-col justify-center">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Participation Rate</span>
                        <span className={`text-[24px] font-semibold tracking-[-1px] text-[#5B53E0] leading-none ${jetbrainsMono.className}`}>{completionRate.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-[#F4F5F7] rounded-full overflow-hidden border border-[#E8EAED]">
                        <div className="h-full bg-[#5B53E0] rounded-full transition-all duration-1000" style={{ width: `${completionRate}%` }} />
                    </div>
                </Card>
            </StatGrid>

            {/* Detailed findings */}
            <div className="space-y-4">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] px-1">Detailed Findings</h2>
                <div className="grid grid-cols-1 gap-4">
                    {report.questions.map((q: QuestionData) => (
                        <Card key={q.question_id} padding="lg" interactive className="space-y-7">
                            <div className="flex gap-3.5 items-start">
                                <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                                    <HelpCircle className="w-[18px] h-[18px]" />
                                </span>
                                <h3 className="text-[17px] font-bold text-[#15171C] tracking-[-0.3px] leading-snug pt-1">{q.question_text}</h3>
                            </div>

                            {q.question_type === 'RATING' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center px-1">
                                    <div>
                                        <div className="flex justify-between items-end mb-4">
                                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Score Distribution</span>
                                            <span className={`text-[14px] font-semibold text-[#15171C] ${jetbrainsMono.className}`}>AVG. {q.average_score?.toFixed(1) || '0.0'}</span>
                                        </div>
                                        <div className="space-y-3.5">
                                            {['5', '4', '3', '2', '1'].map(val => (
                                                <div key={val} className="flex items-center gap-3">
                                                    <span className={`text-[12px] font-semibold text-[#8A929E] w-2 text-right ${jetbrainsMono.className}`}>{val}</span>
                                                    <div className="flex-1 h-2 bg-[#F4F5F7] rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-[#5B53E0]/70 rounded-full transition-all duration-1000"
                                                            style={{ width: `${(q.distribution[val] || 0) / q.response_count * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-[12px] font-semibold text-[#8A929E] w-6 text-right ${jetbrainsMono.className}`}>{q.distribution[val] || 0}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center relative py-8">
                                        <div className="text-center space-y-2 relative z-10">
                                            <p className={`text-[64px] font-semibold text-[#15171C] tracking-[-2px] leading-none ${jetbrainsMono.className}`}>{q.average_score?.toFixed(1) || '0.0'}</p>
                                            <Badge tone="neutral">Organizational Pulse</Badge>
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] select-none pointer-events-none">
                                            <TrendingUp className="w-[160px] h-[160px] text-[#5B53E0]" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {q.question_type === 'TEXT' && (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                                    {q.text_responses.length > 0 ? q.text_responses.map((resp: string, idx: number) => (
                                        <div key={idx} className="flex gap-3 bg-[#F7F8FA] p-4 rounded-[12px] border border-[#E8EAED] border-l-[3px] border-l-[#5B53E0]/40 text-[13.5px] font-medium text-[#374151] leading-relaxed">
                                            <MessageSquareQuote className="w-4 h-4 text-[#9AA3AF] shrink-0 mt-0.5" />
                                            <span>&quot;{resp}&quot;</span>
                                        </div>
                                    )) : (
                                        <p className="text-[#8A929E] text-[13px] font-medium text-center py-8">No textual entries were submitted for this item</p>
                                    )}
                                </div>
                            )}

                            {q.question_type === 'MCQ' && (
                                <div className="space-y-3.5">
                                    {Object.entries(q.distribution).map(([opt, count]) => (
                                        <div key={opt} className="space-y-1.5">
                                            <div className="flex justify-between text-[13px] font-semibold">
                                                <span className="text-[#374151]">{opt}</span>
                                                <span className={`text-[#5B53E0] ${jetbrainsMono.className}`}>{count} Choices</span>
                                            </div>
                                            <div className="h-2 bg-[#F4F5F7] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#5B53E0]/70 rounded-full transition-all duration-1000"
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
