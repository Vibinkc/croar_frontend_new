"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";

interface Question {
    id: string;
    text: string;
    type: "RATING" | "TEXT" | "MCQ";
    scale_min: number;
    scale_max: number;
    options?: string;
}

interface Invite {
    instance: {
        name: string;
        template: {
            description: string;
            survey_type: {
                name: string;
            };
            questions: Question[];
        };
    };
}

interface Response {
    question_id: string;
    answer_value: number | null;
    answer_text: string;
}

export default function FillSurvey({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const router = useRouter();
    const [invite, setInvite] = useState<Invite | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [responses, setResponses] = useState<Response[]>([]);

    useEffect(() => {
        const fetchInvite = async () => {
            try {
                const res = await apiClient.get(`/api/v1/enterprise/surveys/invite/${token}`);
                if (res.ok) {
                    const data = await res.json();
                    setInvite(data);
                    // Initialize responses
                    setResponses(data.instance.template.questions.map((q: Question) => ({
                        question_id: q.id,
                        answer_value: q.type === 'RATING' ? 3 : null,
                        answer_text: ""
                    })));
                } else {
                    router.push('/404');
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchInvite();
    }, [token, router]);

    const updateResponse = (idx: number, field: keyof Response, value: string | number | null) => {
        setResponses(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [field]: value };
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await apiClient.post(`/api/v1/enterprise/surveys/submit/${token}`, { responses });
            if (res.ok) {
                setCompleted(true);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
            <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-black  tracking-[0.2em] text-[10px]">Loading Framework...</p>
            </div>
        </div>
    );

    if (completed) return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-white selection:bg-indigo-100">
            <div className="max-w-md w-full text-center space-y-8 animate-in zoom-in duration-700">
                <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl border border-emerald-100 mb-10">
                    <span className="material-symbols-rounded text-5xl">verified</span>
                </div>
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-4">Pulse Noted.</h1>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed">Your feedback has been successfully securely recorded. Thank you for helping us shape a better workplace culture.</p>
                </div>
                <div className="pt-8 border-t border-slate-50 space-y-6">
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 text-left space-y-4 animate-in slide-in-from-bottom-4 duration-1000 delay-300">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                                <span className="material-symbols-rounded text-xl">neurology</span>
                            </div>
                            <h3 className="text-sm font-black text-slate-900  ">Neural Coaching Lab</h3>
                        </div>
                        <p className="text-xs text-slate-500 font-bold leading-relaxed">Enhance your behavioral intelligence through interactive AI role-play simulations. Practice real-world scenarios in a safe, automated lab.</p>
                        <button 
                            onClick={() => router.push('/enterprise/ai-training/portal')}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px]   hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100"
                        >
                            <span className="material-symbols-rounded text-lg">play_circle</span>
                            Engage Simulation
                        </button>
                    </div>
                    <button 
                        onClick={() => window.close()}
                        className="text-slate-400 hover:text-slate-900 transition-colors font-black   text-[9px] flex items-center justify-center gap-2 mx-auto"
                    >
                        <span className="material-symbols-rounded text-lg">close</span>
                        Close Portal
                    </button>
                </div>
            </div>
        </div>
    );

    const questions = invite.instance.template.questions;

    return (
        <div className="min-h-screen bg-slate-50/50 py-12 px-6 lg:py-24">
            <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                <header className="bg-white p-10 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/20 space-y-4">
                    <div className="flex justify-between items-start">
                        <span className="bg-indigo-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full  ">
                            {invite.instance.template.survey_type.name}
                        </span>
                        <div className="text-right">
                            <p className="text-slate-300 text-[10px] font-black  ">Confidential Entry</p>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight shrink-0">{invite.instance.name}</h1>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed pr-8">{invite.instance.template.description || "Every voice matters. Please provide your honest feedback across the following points."}</p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {questions.map((q: Question, i: number) => (
                        <div key={q.id} className="bg-white p-10 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/10 space-y-8 group transition-all duration-500 hover:border-indigo-600">
                            <div className="flex gap-6 items-start">
                                <span className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 font-black text-xs flex items-center justify-center shrink-0 border border-slate-100 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    {i + 1}
                                </span>
                                <h2 className="text-xl font-black text-slate-800 tracking-tight leading-snug">{q.text}</h2>
                            </div>

                            {q.type === 'RATING' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end px-2">
                                        <span className="text-[10px] font-black text-slate-300  ">Least Agree</span>
                                        <div className="text-4xl font-black text-indigo-600">{responses[i]?.answer_value}</div>
                                        <span className="text-[10px] font-black text-slate-300  ">Fully Agree</span>
                                    </div>
                                    <div className="relative px-2">
                                        <input 
                                            type="range"
                                            min={q.scale_min}
                                            max={q.scale_max}
                                            step="1"
                                            className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600 outline-none"
                                            value={responses[i]?.answer_value || 3}
                                            onChange={(e) => updateResponse(i, "answer_value", parseInt(e.target.value))}
                                        />
                                        <div className="flex justify-between mt-4 px-1">
                                            {[...Array(q.scale_max - q.scale_min + 1)].map((_, idx) => (
                                                <div key={idx} className={`w-1 h-3 rounded-full transition-all ${responses[i]?.answer_value === idx + q.scale_min ? 'h-5 bg-indigo-600' : 'bg-slate-200'}`}></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {q.type === 'MCQ' && (
                                <div className="grid grid-cols-1 gap-3">
                                    {JSON.parse(q.options || '[]').map((opt: string, optIdx: number) => (
                                        <button 
                                            key={optIdx}
                                            type="button"
                                            onClick={() => updateResponse(i, "answer_value", optIdx)}
                                            className={`w-full p-5 rounded-xl text-left font-bold text-sm transition-all flex items-center justify-between border-2 ${responses[i]?.answer_value === optIdx ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' : 'border-slate-50 bg-slate-50/30 text-slate-500 hover:border-slate-200 shadow-sm'}`}
                                        >
                                            {opt}
                                            {responses[i]?.answer_value === optIdx && (
                                                <span className="material-symbols-rounded text-lg">check_circle</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {q.type === 'TEXT' && (
                                <textarea 
                                    className="w-full px-8 py-6 bg-slate-50/50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300 min-h-[140px] transition-all"
                                    value={responses[i]?.answer_text || ""}
                                    onChange={(e) => updateResponse(i, "answer_text", e.target.value)}
                                    placeholder="Share your thoughts in detail..."
                                />
                            )}
                        </div>
                    ))}

                    <div className="pt-10 flex flex-col items-center gap-6">
                        <button 
                            type="submit"
                            disabled={submitting}
                            className="px-24 py-5 bg-slate-900 text-white rounded-xl font-black text-sm  tracking-[0.3em] shadow-2xl shadow-indigo-200 hover:bg-indigo-600 hover:scale-[1.02] transition-all disabled:opacity-50 active:scale-[0.98]"
                        >
                            {submitting ? 'Transmitting Entry...' : 'Complete Entry'}
                        </button>
                        <p className="text-slate-300 font-black   text-[9px] flex items-center gap-2">
                            <span className="material-symbols-rounded text-sm">lock_outline</span>
                            End-to-End Encrypted Secure Submission
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
