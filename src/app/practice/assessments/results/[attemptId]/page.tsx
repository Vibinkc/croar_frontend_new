"use client";

import { useEffect, useState, use } from "react";
import { apiClient } from "@/utils/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import McqQuestion from "@/components/assessment/McqQuestion";
import TextQuestion from "@/components/assessment/TextQuestion";
import CodeQuestion from "@/components/assessment/CodeQuestion";
import MarkdownContent from "@/components/common/MarkdownContent";

interface QuestionResult {
    id: number;
    text: string;
    type: string;
    difficulty: string;
    is_correct: boolean;
    user_answer: string | null;
    correct_answer: string | null;
    explanation: string | null;
    options?: Record<string, string>;
}

interface AttemptResult {
    result: {
        score: number;
        total_questions: number;
        percentage: number;
        completed_at: string;
    };
    test: {
        title: string;
        description: string;
        time_limit: number;
        category: string;
    };
    questions: QuestionResult[];
    interview_id?: number;
}

export default function AssessmentResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
    const unwrappedParams = use(params);
    const { attemptId } = unwrappedParams;
    const router = useRouter();
    const [data, setData] = useState<AttemptResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResult();
    }, []);

    useEffect(() => {
        fetchResult();
    }, []);

    const fetchResult = async () => {
        try {
            const res = await apiClient.get(`/api/v1/activity/details/ASSESSMENT/${attemptId}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            } else {
                alert("Failed to load results.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
        </div>
    );

    if (!data) return <div>Result not found.</div>;

    const { result, test, questions } = data;
    const isPass = result.percentage >= 70;

    return (
        <div className="min-h-screen bg-[#fcfcfd] text-slate-600 py-8 px-4 lg:px-8 font-sans transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: Sticky Score Card & Summary */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="sticky top-8 space-y-6">

                            {/* Main Performance Card - Matching Job Simulation Exactly */}
                            <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden text-center transition-all duration-500 text-white">
                                <div className="absolute top-0 left-0 w-full h-2 bg-slate-400"></div>

                                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <span className="material-icons-outlined text-3xl text-white">verified</span>
                                </div>



                                <h1 className="text-2xl font-black  tracking-tighter mb-2 text-white">
                                    Assessment Completed
                                </h1>

                                <div className="space-y-1 mb-8">
                                    <p className="text-[10px] font-black text-slate-400  tracking-[0.2em]">Overall Performance</p>
                                    <div className={`text-5xl font-black ${isPass ? 'text-emerald-400' : 'text-rose-400'} tracking-tighter`}>
                                        {Math.round(result.percentage)}%
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-8 p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                    <div className="text-center">
                                        <span className="block text-[9px] font-black text-slate-400   mb-1">Correct</span>
                                        <span className="text-xl font-black text-white">{result.score}</span>
                                    </div>
                                    <div className="text-center border-l border-white/10">
                                        <span className="block text-[9px] font-black text-slate-400   mb-1">Questions</span>
                                        <span className="text-xl font-black text-white">{result.total_questions}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => router.push("/practice/ai-practice")}
                                    className="w-full py-4 bg-white text-slate-900 rounded-2xl text-[11px] font-black  tracking-[0.2em] transition-all duration-300 shadow-lg hover:scale-105 active:scale-95"
                                >
                                    Return to Command Center
                                </button>
                            </div>

                            {/* Summary Card - Matching Job Simulation */}
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all duration-300 space-y-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600">
                                            <span className="material-icons-outlined text-xl">psychology</span>
                                        </div>
                                        <h3 className="text-[11px] font-black   text-slate-900">AI Logic Summary</h3>
                                    </div>
                                    <p className="text-[13px] leading-relaxed font-bold  text-slate-600">
                                        &quot;{test.title} session analyzed. User demonstrated {isPass ? 'strong' : 'developing'} command of {test.category} protocols with a final efficiency rating of {Math.round(result.percentage)}%.&quot;
                                    </p>
                                </div>

                                {/* Mock Interview Link */}
                                {data.interview_id && (
                                    <div className="pt-4 border-t border-slate-100">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <h4 className="text-[10px] font-black   text-slate-900 mb-1">AI Interview Ready</h4>
                                                <p className="text-[10px] text-slate-500 font-medium">Continue your session with a video interview.</p>
                                            </div>
                                            <Link href={`/practice/interviews/${data.interview_id}`}>
                                                <button className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-500 text-white shadow-lg hover:bg-rose-600 hover:scale-110 transition-all">
                                                    <span className="material-icons-outlined text-lg">videocam</span>
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* RIGHT COLUMN: Detailed Review */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex items-center gap-4 px-4 mb-2">
                            <h2 className="text-[11px] font-black  tracking-[0.3em] text-slate-400">
                                Protocol_Detailed_Analysis
                            </h2>
                            <div className="h-px flex-grow bg-slate-100"></div>
                        </div>

                        {questions.map((q, idx) => (
                            <div key={q.id} className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 group overflow-hidden relative">
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${q.is_correct ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

                                <div className="flex justify-between items-start gap-6 mb-8">
                                    <div className="flex gap-5">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 transition-transform group-hover:scale-110 ${q.is_correct
                                            ? 'bg-emerald-50 text-emerald-600'
                                            : 'bg-rose-50 text-rose-500'
                                            }`}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black   ${q.type?.toLowerCase() === 'mcq' ? 'bg-blue-50 text-blue-600' :
                                                    q.type?.toLowerCase() === 'code' || q.type?.toLowerCase() === 'coding' ? 'bg-purple-50 text-purple-600' :
                                                        'bg-emerald-50 text-emerald-600'
                                                    }`}>
                                                    {q.type}
                                                </span>
                                                <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                                                <span className={`text-[9px] font-black   ${q.is_correct ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {q.is_correct ? 'VERIFIED_SUCCESS' : 'VERIFICATION_FAILED'}
                                                </span>
                                            </div>
                                            <div className="text-slate-900">
                                                <MarkdownContent content={q.text} isDark={false} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`px-4 py-2 rounded-xl text-[10px] font-black border   transition-all ${q.is_correct
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                        : 'bg-rose-50 text-rose-700 border-rose-100'
                                        }`}>
                                        {q.is_correct ? '100/100' : '0/100'}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-[9px] font-black  tracking-[0.2em] mb-4 text-slate-400">
                                        Response_Artifact_Feedback
                                    </h4>

                                    {q.type?.toLowerCase() === 'mcq' || q.type?.toLowerCase() === 'aptitude' ? (
                                        <McqQuestion
                                            questionId={q.id}
                                            options={q.options ? Object.values(q.options) : []}
                                            selectedOption={q.user_answer ?? undefined}
                                            readOnly={true}
                                            correctAnswer={q.correct_answer ?? undefined}
                                            feedback={q.explanation ?? undefined}
                                            isDark={false}
                                        />
                                    ) : (q.type?.toLowerCase() === 'code' || q.type?.toLowerCase() === 'coding') ? (
                                        <div className="h-[400px] rounded-3xl overflow-hidden border border-slate-200 shadow-inner">
                                            <CodeQuestion
                                                questionId={q.id}
                                                code={q.user_answer || ""}
                                                language="python"
                                                readOnly={true}
                                                feedback={q.explanation ?? undefined}
                                                isDark={true}
                                                rightPaneHeight={100}
                                            />
                                        </div>
                                    ) : (q.type?.toUpperCase() === 'SUBJECTIVE' || q.type?.toLowerCase() === 'text' || q.type?.toLowerCase() === 'short_answer') ? (
                                        <TextQuestion
                                            value={q.user_answer || ""}
                                            readOnly={true}
                                            feedback={q.explanation ?? undefined}
                                            isDark={false}
                                            placeholder="No response provided."
                                        />
                                    ) : (
                                        <div className="text-slate-400  text-sm">Unknown question type.</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
