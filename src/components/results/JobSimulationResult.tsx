"use client";

import { useRouter } from "next/navigation";
import McqQuestion from "@/components/assessment/McqQuestion";
import TextQuestion from "@/components/assessment/TextQuestion";
import CodeQuestion from "@/components/assessment/CodeQuestion";

interface JobSimulationResultProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attempt: any;
    onClose?: () => void; // Optional for modal usage
    isModal?: boolean;
}

export default function JobSimulationResult({ attempt, onClose, isModal = false }: JobSimulationResultProps) {
    const router = useRouter();

    return (
        <div className={`max-w-7xl mx-auto ${isModal ? "" : "py-8 px-4"} animate-in fade-in zoom-in duration-700`}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT COLUMN: Sticky Score Card & Summary */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="sticky top-6 space-y-4 max-h-[calc(100vh-3rem)] overflow-y-auto no-scrollbar">
                        <div className="bg-slate-900 rounded-2xl p-6 shadow-2xl shadow-slate-200/50 text-white relative overflow-hidden text-center">
                            <div className="absolute top-0 left-0 w-full h-2 bg-slate-400"></div>

                            {isModal && onClose && (
                                <button
                                    onClick={onClose}
                                    className="absolute top-6 right-6 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                                >
                                    <span className="material-icons-outlined text-white text-sm">close</span>
                                </button>
                            )}

                            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-icons-outlined text-2xl text-white">verified</span>
                            </div>
                            <h1 className="text-xl font-black  tracking-tight mb-1">Assessment Completed</h1>
                            <p className="text-slate-400 font-bold   text-[10px] mb-6">
                                Overall Performance: {attempt?.overall_score ?? 0}%
                            </p>

                            {/* Round Wise Scores - Stacked for sidebar */}
                            <div className="grid grid-cols-1 gap-2 mb-6 text-left">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {attempt?.round_scores && Object.entries(attempt.round_scores).map(([num, data]: [string, any]) => (
                                    <div key={num} className="bg-white/5 border border-white/10 p-3 rounded-xl backdrop-blur-sm">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[9px] font-black text-slate-400  ">Round {num}</span>
                                            <span className="text-xs font-black text-white">{data.score ?? 0}%</span>
                                        </div>
                                        <h3 className="text-xs font-bold text-white truncate mb-1.5">{data.title}</h3>
                                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-400" style={{ width: `${data.score ?? 0}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {!isModal && (
                                <button
                                    onClick={() => router.push("/practice/job-simulation")}
                                    className="w-full py-3 bg-white text-slate-900 rounded-xl text-xs font-black  tracking-[0.2em] hover:scale-105 transition-all shadow-lg"
                                >
                                    Return to Jobs
                                </button>
                            )}
                        </div>

                        {attempt?.feedback?.summary && (
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                <h3 className="text-[10px] font-black text-slate-900   mb-2 flex items-center gap-2">
                                    <span className="material-icons-outlined text-slate-400 text-xs">psychology</span>
                                    AI Analysis
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed font-medium ">
                                    &quot;{attempt.feedback.summary}&quot;
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Detailed Review */}
                <div className="lg:col-span-8">
                    {(attempt?.questions_snapshot && attempt?.questions_snapshot.length > 0) && (
                        <div className="space-y-4">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {attempt.questions_snapshot.map((q: any, idx: number) => {
                                const qId = String(q.id);
                                const feedbackData = attempt.feedback?.question_feedback?.[qId];
                                const userAnswer = attempt.answers?.[qId];

                                return (
                                    <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
                                        <div className="flex justify-between items-start gap-4 mb-4">
                                            <div className="flex gap-4">
                                                <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-black text-xs shrink-0">
                                                    {idx + 1}
                                                </span>
                                                <div>
                                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black   mb-2 ${q.type?.toLowerCase() === 'mcq' || q.type?.toLowerCase() === 'aptitude' ? 'bg-blue-50 text-blue-600' :
                                                        q.type?.toLowerCase() === 'code' ? 'bg-purple-50 text-purple-600' :
                                                            'bg-emerald-50 text-emerald-600'
                                                        }`}>
                                                        {q.type}
                                                    </span>
                                                    <p className="text-base font-bold text-slate-800 leading-snug">{q.text}</p>
                                                </div>
                                            </div>
                                            {feedbackData && (
                                                <div className={`px-3 py-1 rounded-lg text-xs font-black border shrink-0 ${feedbackData.score >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    feedbackData.score >= 40 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                        'bg-rose-50 text-rose-700 border-rose-100'
                                                    }`}>
                                                    {feedbackData.score}/100
                                                </div>
                                            )}
                                        </div>

                                        <div className="mb-2">
                                            <h4 className="text-[10px] font-black text-slate-400   mb-4">Your Answer & Feedback</h4>

                                            {q.type?.toLowerCase() === 'mcq' || q.type?.toLowerCase() === 'aptitude' ? (
                                                <McqQuestion
                                                    questionId={q.id}
                                                    options={q.options || []}
                                                    selectedOption={userAnswer}
                                                    readOnly={true}
                                                    correctAnswer={feedbackData?.correct_answer}
                                                    feedback={feedbackData?.feedback}
                                                    isDark={false}
                                                />
                                            ) : q.type?.toLowerCase() === 'code' ? (
                                                <div className="h-[500px] border rounded-2xl overflow-hidden">
                                                    <CodeQuestion
                                                        questionId={q.id}
                                                        code={userAnswer || ""}
                                                        onCodeChange={() => { }} // No-op
                                                        language={JSON.parse(localStorage.getItem('last_language') || '"python"')} // Fallback or could store used language in attempt
                                                        onLanguageChange={() => { }} // No-op
                                                        readOnly={true}
                                                        feedback={feedbackData?.feedback}
                                                        isDark={true} // Code editor looks better dark
                                                        rightPaneHeight={60}
                                                    />
                                                </div>
                                            ) : (
                                                <TextQuestion
                                                    value={userAnswer || ""}
                                                    readOnly={true}
                                                    feedback={feedbackData?.feedback}
                                                    isDark={false}
                                                />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
