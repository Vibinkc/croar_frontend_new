"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";

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
        <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!report) return <div className="p-8 text-center text-slate-500 font-medium">Report data unavailable or unauthorized.</div>;

    const completionRate = report.total_invites > 0 ? (report.completed_invites / report.total_invites) * 100 : 0;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
            <header className="flex justify-between items-center pb-8 border-b border-slate-100">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/enterprise/surveys')} className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center">
                        <span className="material-symbols-rounded text-xl">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">{report.instance_name}</h1>
                        <p className="text-slate-400 font-black   text-[10px] flex items-center gap-2">
                            <span className="material-symbols-rounded text-sm text-indigo-500">analytics</span>
                            Aggregated Sentiment Analysis & Participation Data
                        </p>
                    </div>
                </div>
                <div className="flex gap-4">
                    {report.completed_invites < report.total_invites && (
                        <button 
                            onClick={() => {
                                apiClient.post(`/api/v1/enterprise/surveys/instances/${id}/notify`, {})
                                    .then(() => alert("Reminders sent to all pending participants!"))
                                    .catch(() => alert("Failed to send reminders."));
                            }}
                            className="px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl font-black text-[10px]  tracking-[0.2em] flex items-center gap-2 hover:bg-slate-50 transition-all"
                        >
                            <span className="material-symbols-rounded text-lg">campaign</span>
                            Remind Pending
                        </button>
                    )}
                </div>
            </header>

            {/* AI Strategic Intelligence Section */}
            <section className="relative overflow-hidden bg-slate-900 rounded-2xl p-10 md:p-14 text-white shadow-2xl shadow-indigo-200/20 group">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] group-hover:bg-indigo-500/30 transition-all duration-1000"></div>

                {!aiAnalysis && !analyzing ? (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                        <div className="space-y-4 text-center md:text-left">
                            <h2 className="text-3xl font-black tracking-tight leading-none">Strategic AI Intelligence</h2>
                            <p className="text-slate-400 text-lg font-medium max-w-xl leading-relaxed">Let AI evaluate the organizational pulse, detect hidden risks, and suggest actionable strategic improvements based on this feedback.</p>
                        </div>
                        <button 
                            onClick={generateAIInsights}
                            className="px-10 py-5 bg-indigo-600 text-white rounded-xl font-black text-xs  tracking-[0.3em] flex items-center gap-3 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/40 shrink-0"
                        >
                            <span className="material-symbols-rounded">psychology</span>
                            Generate Insights
                        </button>
                    </div>
                ) : analyzing ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-8 animate-pulse relative z-10">
                        <div className="w-16 h-16 border-4 border-indigo-400 border-t-white rounded-full animate-spin"></div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-black  ">Analyzing Pulse...</h3>
                            <p className="text-slate-400 font-black text-[10px] tracking-[0.3em]">PROCESSING AGGREGATED FEEDBACK VIA GPT-4o</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-12 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <header className="flex flex-col md:flex-row items-start justify-between gap-8 pb-10 border-b border-white/10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="bg-indigo-600 text-[10px] font-black px-4 py-1.5 rounded-full  ">Strategic Insight</span>
                                    <span className="text-slate-500 font-black text-[10px]  ">Generated by Croar AI</span>
                                </div>
                                <h2 className="text-4xl font-black tracking-tighter leading-none">{report.instance_name} Summary</h2>
                                <p className="text-slate-300 text-lg font-medium max-w-3xl leading-relaxed ">&quot;{aiAnalysis.summary}&quot;</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl text-center min-w-[220px] backdrop-blur-xl shrink-0">
                                <p className="text-[10px] font-black text-indigo-400   mb-1">Health Score</p>
                                <div className="text-6xl font-black tracking-tighter text-indigo-100">{aiAnalysis.performance_score}</div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full mt-4 overflow-hidden">
                                    <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${aiAnalysis.performance_score}%` }}></div>
                                </div>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-indigo-400  tracking-[0.3em] px-2">Cultural Strengths</h4>
                                <ul className="space-y-3">
                                    {aiAnalysis.strengths.map((s: string, idx: number) => (
                                        <li key={idx} className="flex items-center gap-4 bg-white/5 p-5 rounded-xl border border-white/5 group hover:border-emerald-500/50 transition-all">
                                            <span className="material-symbols-rounded text-emerald-500">task_alt</span>
                                            <span className="text-sm font-bold text-slate-100">{s}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-rose-400  tracking-[0.3em] px-2">Detected Risks</h4>
                                <ul className="space-y-3">
                                    {aiAnalysis.weaknesses.map((w: string, idx: number) => (
                                        <li key={idx} className="flex items-center gap-4 bg-white/5 p-5 rounded-xl border border-white/5 group hover:border-rose-500/50 transition-all">
                                            <span className="material-symbols-rounded text-rose-500">warning</span>
                                            <span className="text-sm font-bold text-slate-100">{w}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="pt-10 border-t border-white/10 space-y-6">
                            <h4 className="text-[10px] font-black text-indigo-400  tracking-[0.3em] px-2">AI Strategic Recommendations</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {aiAnalysis.recommendations.map((r: string, idx: number) => (
                                    <div key={idx} className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-2xl flex gap-5 group items-start hover:bg-indigo-600 transition-all duration-500">
                                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg group-hover:bg-white group-hover:text-indigo-600 transition-all">
                                            <span className="material-symbols-rounded text-lg">lightbulb</span>
                                        </div>
                                        <p className="text-sm font-bold leading-relaxed text-slate-100 group-hover:text-white">{r}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xl shadow-slate-100/30">
                    <p className="text-slate-400 text-[9px] font-black   mb-1">Total Audience</p>
                    <p className="text-3xl font-black text-slate-900">{report.total_invites}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xl shadow-slate-100/30">
                    <p className="text-slate-400 text-[9px] font-black   mb-1">Total Returns</p>
                    <p className="text-3xl font-black text-emerald-600">{report.completed_invites}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xl shadow-slate-100/30 md:col-span-2">
                    <div className="flex justify-between items-end mb-2">
                        <p className="text-slate-400 text-[9px] font-black   leading-none">Participation Rate</p>
                        <p className="text-2xl font-black text-indigo-600 tracking-tight leading-none">{completionRate.toFixed(1)}%</p>
                    </div>
                    <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 mt-2">
                        <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${completionRate}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-[10px] font-black text-slate-400  tracking-[0.2em] px-1">Detailed Findings</h2>
                <div className="grid grid-cols-1 gap-6">
                    {report.questions.map((q: QuestionData) => (
                        <div key={q.question_id} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-slate-100/20 space-y-8 group transition-all duration-500 hover:border-indigo-600">
                            <div className="flex gap-4 items-start">
                                <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 font-black text-xs flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                    <span className="material-symbols-rounded text-sm">question_mark</span>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug">{q.question_text}</h3>
                            </div>

                            {q.question_type === 'RATING' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center px-2">
                                    <div>
                                        <div className="flex justify-between items-end mb-4 pr-1">
                                            <p className="text-slate-400 text-[9px] font-black  ">Score Distribution</p>
                                            <p className="text-base font-black text-slate-900 font-mono ">AVG. {q.average_score?.toFixed(1) || '0.0'}</p>
                                        </div>
                                        <div className="space-y-4">
                                            {['5', '4', '3', '2', '1'].map(val => (
                                                <div key={val} className="flex items-center gap-4">
                                                    <span className="text-[10px] font-black text-slate-400 w-2 text-right">{val}</span>
                                                    <div className="flex-1 h-2 bg-slate-50 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-indigo-600/60 rounded-full transition-all duration-1000" 
                                                            style={{ width: `${(q.distribution[val] || 0) / q.response_count * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-[9px] font-bold text-slate-400 font-mono w-6 text-right">{q.distribution[val] || 0}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center relative py-10">
                                        <div className="text-center space-y-2 relative z-10">
                                            <p className="text-7xl font-black text-slate-900 tracking-tighter leading-none">{q.average_score?.toFixed(1) || '0.0'}</p>
                                            <p className="text-[9px] font-black text-slate-400   bg-slate-50 px-3 py-1.5 rounded-full inline-block">Organizational Pulse</p>
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
                                            <span className="material-symbols-rounded text-[180px]">trending_up</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {q.question_type === 'TEXT' && (
                                <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2 pt-2">
                                    {q.text_responses.length > 0 ? q.text_responses.map((resp: string, idx: number) => (
                                        <div key={idx} className="bg-slate-50/50 p-6 rounded-xl border border-slate-100 text-sm font-medium text-slate-600  leading-relaxed hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all border-l-4 border-l-indigo-600/30">
                                            &quot;{resp}&quot;
                                        </div>
                                    )) : (
                                        <p className="text-slate-300 font-black   text-[9px] text-center py-10 ">No textual entries were submitted for this item</p>
                                    )}
                                </div>
                            )}

                            {q.question_type === 'MCQ' && (
                                <div className="space-y-4">
                                    {Object.entries(q.distribution).map(([opt, count]) => (
                                        <div key={opt} className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-black  ">
                                                <span className="text-slate-600">{opt}</span>
                                                <span className="text-indigo-600">{count} Choices</span>
                                            </div>
                                            <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-indigo-600/60 rounded-full" 
                                                    style={{ width: `${(count / q.response_count) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
