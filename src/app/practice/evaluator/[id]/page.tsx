"use client";

import { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/utils/api";
import AIGenerationOverlay from "@/components/ui/AIGenerationOverlay";
import EvaluatorResult from "@/components/results/EvaluatorResult";

interface Question {
    id: number;
    type: string;
    topic: string;
    difficulty: string;
    content: {
        question: string;
        min_words?: number;
        max_words?: number;
    };
}

interface AnalysisResult {
    score: number;
    grammar_score: number;
    tone_score: number;
    structure_score: number;
    relevance_score: number;
    feedback: string;
    word_count: number;
}

interface Attempt {
    id: number;
    score: number;
    feedback: string;
    created_at: string;
}

export default function AIEvaluatorWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const searchParams = useSearchParams();
    const title = searchParams.get("title") || "Subjective Evaluation";

    const [response, setResponse] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [problem, setProblem] = useState<Question | null>(null);
    const [attempt, setAttempt] = useState<Attempt | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                // Fetch problem details
                const pRes = await apiClient.get(`/api/v1/content/questions/${id}`);
                if (pRes.ok) {
                    setProblem(await pRes.json());
                }

                // Check if this is a view-only mode for an existing attempt (optional)
                // For now just load the problem.
            } catch (e) {
                console.error(e);
                setError("Failed to load task protocol.");
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [id]);

    const handleSubmit = async () => {
        if (!response.trim()) {
            alert("Please provide your response before finalizing submission.");
            return;
        }
        setAnalyzing(true);
        setResult(null);
        setError(null);

        try {
            const res = await apiClient.post(`/api/v1/evaluator/submit`, {
                user_response: response,
                question_id: Number(id)
            });

            if (!res.ok) throw new Error("Neural analysis failed");

            const data = await res.json();
            setResult(data);
        } catch (err) {
            console.error(err);
            setError("Connectivity error or logic analysis failed.");
        } finally {
            setAnalyzing(false);
        }
    };

    const wordCount = response.trim() ? response.trim().split(/\s+/).length : 0;
    const minWords = problem?.content.min_words || 0;
    const maxWords = problem?.content.max_words || 500;
    const progressPercent = Math.min((wordCount / maxWords) * 100, 100);

    if (loading) return (
        <div className="h-screen bg-slate-900 flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-slate-700 border-t-slate-500 rounded-full animate-spin mx-auto"></div>
                <p className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">Booting_Neural_Workspace</p>
            </div>
        </div>
    );

    if (!problem) return <div className="p-20 text-center uppercase font-black text-slate-400">Task_Not_Found</div>;

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-8 py-3.5 flex justify-between items-center relative z-20 shadow-sm">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => window.history.back()}
                        className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all text-[10px] font-black tracking-[0.2em] uppercase"
                    >
                        <span className="material-icons-outlined text-sm">close</span>
                        Abort_Module
                    </button>
                    <div className="h-5 w-[1px] bg-slate-200"></div>
                    <div className="flex flex-col">
                        <span className="text-[7px] font-black text-slate-500 tracking-[0.3em] uppercase mb-0.5">Subjective_Analysis_v2.0</span>
                        <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase line-clamp-1">{title}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[7px] font-black text-slate-400 tracking-widest uppercase mb-1">Session_Status</span>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse"></div>
                            <span className="text-[9px] font-black text-slate-900 uppercase">Active_Link</span>
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={analyzing || wordCount < minWords}
                        className={`px-8 py-3 rounded-xl font-black text-[10px] tracking-[0.2em] uppercase transition-all duration-300 active:scale-95 flex items-center gap-2 shadow-xl
                        ${analyzing || wordCount < minWords
                                ? 'bg-slate-100 text-slate-400 scale-95 shadow-none cursor-not-allowed'
                                : 'bg-slate-900 text-white hover:bg-slate-800 hover:-translate-y-0.5 shadow-slate-200 hover:shadow-slate-100'}`}
                    >
                        {analyzing ? (
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                                <span>Analyzing...</span>
                            </div>
                        ) : (
                            <>
                                <span className="material-icons-outlined text-sm">send</span>
                                Finalize_Submission
                            </>
                        )}
                    </button>
                </div>
            </div>

            <AIGenerationOverlay isOpen={analyzing} title="Decoding Intent & Logic" />

            <div className="flex flex-1 overflow-hidden relative">
                {/* Side Info Panel */}
                <div className="w-[280px] bg-white border-r border-slate-100 flex flex-col z-10">
                    <div className="p-8 space-y-8 overflow-y-auto h-full scrollbar-none">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="px-2 py-0.5 rounded-md bg-slate-50 text-[7px] font-black text-slate-500 uppercase tracking-widest border border-slate-100">Task_Descriptor</div>
                            </div>
                            <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden group border border-slate-800 shadow-2xl">
                                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none transition-transform group-hover:scale-110">
                                    <span className="material-icons-outlined text-6xl">campaign</span>
                                </div>
                                <div className="relative z-10 space-y-4">
                                    <span className="text-[7px] font-black text-slate-400 tracking-[0.4em] uppercase block">Mission_Briefing</span>
                                    <p className="text-xs font-medium leading-relaxed italic text-slate-300">
                                        "{problem.content.question}"
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-1">Target_Length</span>
                                <span className="text-[10px] font-bold text-slate-900">{minWords} - {maxWords} Words</span>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-1">Priority_Scan</span>
                                <span className="text-[10px] font-bold text-slate-900">{problem.difficulty}</span>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <h3 className="text-[8px] font-black tracking-[0.2em] uppercase text-slate-400">Evaluation_Matrix</h3>
                            <ul className="space-y-3">
                                {[
                                    { label: "Grammar & Vocab", id: "grammar" },
                                    { label: "Tone & Style", id: "tone" },
                                    { label: "Structure & Flow", id: "structure" },
                                    { label: "Contextual Relevance", id: "relevance" }
                                ].map((item) => (
                                    <li key={item.id} className="flex items-center gap-3 text-slate-500">
                                        <div className="w-5 h-5 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                                            <span className="material-icons-outlined text-[12px]">done_all</span>
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-wider">{item.label}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Main Editor Section */}
                <div className="flex-1 bg-slate-50 p-8 flex flex-col gap-6 relative">
                    <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden relative">
                        {/* Editor Header Overlay */}
                        <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-white to-transparent pointer-events-none z-10"></div>

                        <textarea
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            className="flex-1 w-full p-12 pt-20 text-sm font-medium text-slate-700 leading-relaxed focus:outline-none resize-none placeholder:text-slate-200 placeholder:italic placeholder:font-black"
                            placeholder="INITIALIZE INPUT PROTOCOL... START TYPING YOUR RESPONSE HERE."
                        />

                        {/* Word Count Bar */}
                        <div className="px-12 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1 max-w-md">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${wordCount >= minWords ? 'bg-slate-500' : 'bg-slate-300'}`}
                                        style={{ width: `${progressPercent}%` }}
                                    ></div>
                                </div>
                                <span className={`text-[9px] font-black tracking-widest uppercase whitespace-nowrap ${wordCount < minWords ? 'text-slate-400' : 'text-slate-600'}`}>
                                    {wordCount} / {maxWords} WORDS {wordCount < minWords && `(Min ${minWords} Req)`}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                                <span className="material-icons-outlined text-sm">auto_awesome</span>
                                <span className="text-[8px] font-black uppercase tracking-widest">Real-Time_Word_Pulse</span>
                            </div>
                        </div>
                    </div>

                    {/* Results Overlay */}
                    {result && (
                        <div className="absolute inset-4 z-30 animate-in slide-in-from-bottom duration-700 flex justify-center items-center">
                            <EvaluatorResult result={result} problem={problem} onClose={() => setResult(null)} />
                        </div>
                    )}
                </div>
            </div>

            {/* Background Decorations */}
            <div className="fixed top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-slate-500/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-slate-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        </div>
    );
}
