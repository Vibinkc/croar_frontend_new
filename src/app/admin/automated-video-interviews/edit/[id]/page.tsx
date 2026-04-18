"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";
import AIGenerationOverlay from "@/components/ui/AIGenerationOverlay";

export default function EditVideoInterviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [topic, setTopic] = useState("");
    const [questionCount, setQuestionCount] = useState<number | string>(5);
    const [customQuestionCount, setCustomQuestionCount] = useState(5);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [isGeneratingQuestion, setIsGeneratingQuestion] = useState<Record<number, boolean>>({});
    const [generatedQuestions, setGeneratedQuestions] = useState<any>(null);

    useEffect(() => {
        const fetchInterview = async () => {
            try {
                const response = await apiClient.get(`/api/v1/interviews/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setTopic(data.title);
                    setGeneratedQuestions(data.interview_plan);
                    setQuestionCount(data.interview_plan.modules.reduce((acc: number, m: any) => acc + m.questions.length, 0));
                }
            } catch (error) {
                console.error("Failed to fetch", error);
            } finally {
                setIsFetching(false);
            }
        };
        fetchInterview();
    }, [id]);

    const handleEditQuestion = (moduleIdx: number, qIdx: number, newValue: string) => {
        setGeneratedQuestions((prev: any) => {
            const newModules = [...prev.modules];
            newModules[moduleIdx].questions[qIdx] = newValue;
            return { ...prev, modules: newModules };
        });
    };

    const handleDeleteQuestion = (moduleIdx: number, qIdx: number) => {
        setGeneratedQuestions((prev: any) => {
            const newModules = [...prev.modules];
            newModules[moduleIdx].questions = newModules[moduleIdx].questions.filter((_: any, i: number) => i !== qIdx);
            return { ...prev, modules: newModules };
        });
    };

    const handleAddQuestion = (moduleIdx: number) => {
        setGeneratedQuestions((prev: any) => {
            const newModules = [...prev.modules];
            newModules[moduleIdx].questions.push("New Question");
            return { ...prev, modules: newModules };
        });
    };

    const handleAddAiQuestion = async (moduleIdx: number) => {
        if (!topic) return;
        setIsGeneratingQuestion(prev => ({ ...prev, [moduleIdx]: true }));
        try {
            const response = await apiClient.post(`/api/v1/interviews/generate-single-question`, {
                job_role: topic,
                job_description: generatedQuestions.modules[moduleIdx].title
            });

            if (response.ok) {
                const data = await response.json();
                setGeneratedQuestions((prev: any) => {
                    const newModules = [...prev.modules];
                    newModules[moduleIdx].questions.push(data.question);
                    return { ...prev, modules: newModules };
                });
            }
        } catch (error) {
            console.error("Failed to generate question", error);
        } finally {
            setIsGeneratingQuestion(prev => ({ ...prev, [moduleIdx]: false }));
        }
    };

    const handleGenerate = async () => {
        if (!topic) return;
        setIsGenerating(true);
        const finalCount = questionCount === "Other" ? customQuestionCount : Number(questionCount);
        try {
            const response = await apiClient.post(`/api/v1/interviews/generate-plan`, {
                job_role: topic,
                job_description: `Automated Video Interview for ${topic}. Please generate ${finalCount} questions.`,
                question_count: finalCount
            });

            if (response.ok) {
                const data = await response.json();
                setGeneratedQuestions(data);
            }
        } catch (error) {
            console.error("Failed to generate", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!generatedQuestions) return;

        try {
            const response = await apiClient.put(`/api/v1/interviews/${id}`, {
                title: topic,
                job_description: "Automated Video Interview Challenge",
                interview_plan: generatedQuestions,
                avatar_config: {},
                settings: {},
                is_active: true,
                type: "VIDEO"
            });

            if (response.ok) {
                router.push("/admin/automated-video-interviews");
            }
        } catch (error) {
            console.error("Failed to save", error);
        }
    };

    if (isFetching) return <div className="p-20 text-center animate-pulse text-slate-400 font-bold  ">Loading Interview Strategy...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <AIGenerationOverlay isOpen={isGenerating} title="Updating Interview Intelligence" />
            <AIGenerationOverlay isOpen={Object.values(isGeneratingQuestion).some(v => v)} title="Refining Question" />
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push('/admin/automated-video-interviews')}
                    className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-all hover:scale-105 active:scale-95"
                >
                    <span className="material-icons-outlined text-lg">arrow_back</span>
                </button>
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        <span className="text-[9px] font-black text-amber-500  ">Protocol Architect v2.0</span>
                    </div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight  leading-none">Calibrate Video Protocol</h1>
                </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
                <div>
                    <label className="block text-xs font-black text-slate-700   mb-1.5">Topic / Skill</label>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. React.js, Python Basics, Sales Pitch"
                        className="w-full px-4 h-10 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none text-sm font-bold shadow-sm"
                    />
                </div>

                <div>
                    <label className="block text-xs font-black text-slate-700   mb-1.5">Number of Questions (for Re-generation)</label>
                    <select
                        value={questionCount}
                        onChange={(e) => setQuestionCount(e.target.value === "Other" ? "Other" : Number(e.target.value))}
                        className="w-full px-4 h-10 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm font-bold shadow-sm"
                    >
                        <option value={3}>3 Questions</option>
                        <option value={5}>5 Questions</option>
                        <option value={10}>10 Questions</option>
                        <option value="Other">Other (Custom Count)</option>
                    </select>
                    {questionCount === "Other" && (
                        <input
                            type="number"
                            value={customQuestionCount}
                            onChange={(e) => setCustomQuestionCount(Number(e.target.value))}
                            min={1}
                            max={50}
                            placeholder="Enter question count"
                            className="mt-2 w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none animate-in slide-in-from-top-2"
                        />
                    )}
                </div>

                <div className="pt-2">
                    <button
                        onClick={handleGenerate}
                        disabled={!topic || isGenerating}
                        className="w-full h-11 bg-white text-slate-900 border border-slate-200 rounded-xl font-black text-xs   hover:bg-slate-50 disabled:opacity-50 transition flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                    >
                        {isGenerating ? "Analyzing..." : <><span className="material-icons-outlined text-sm">auto_awesome</span> Re-Generate questions with AI</>}
                    </button>
                </div>
            </div>

            {generatedQuestions && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5 animate-in fade-in slide-in-from-bottom-4">
                    <h2 className="text-base font-black text-slate-800  tracking-tight">Review Questions</h2>
                    <div className="space-y-4">
                        {generatedQuestions.modules.map((module: any, idx: number) => (
                            <div key={idx} className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-[10px] font-black text-slate-400  ">{module.title}</h3>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleAddAiQuestion(idx)}
                                            disabled={isGeneratingQuestion[idx]}
                                            className="text-[9px] font-black text-slate-500   flex items-center gap-1 hover:text-[var(--color-primary)] disabled:opacity-50 transition-colors"
                                        >
                                            <span className="material-icons text-sm">auto_awesome</span>
                                            {isGeneratingQuestion[idx] ? "Generating..." : "Generate with AI"}
                                        </button>
                                        <button
                                            onClick={() => handleAddQuestion(idx)}
                                            className="text-[9px] font-black text-[var(--color-primary)]   flex items-center gap-1 hover:text-[var(--color-primary-dark)] transition-colors"
                                        >
                                            <span className="material-icons-outlined text-sm">add_circle_outline</span>
                                            Add Question
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {module.questions.map((q: string, qIdx: number) => (
                                        <div key={qIdx} className="group relative flex items-start gap-3">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={q}
                                                    onChange={(e) => handleEditQuestion(idx, qIdx, e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all shadow-sm"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleDeleteQuestion(idx, qIdx)}
                                                className="p-1.5 text-slate-300 hover:text-red-500 transition-colors bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md"
                                                title="Delete"
                                            >
                                                <span className="material-icons-outlined text-sm">delete_outline</span>
                                            </button>
                                        </div>
                                    ))}
                                    {module.questions.length === 0 && (
                                        <p className="text-[10px] text-slate-400  py-2">No questions in this module.</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <button
                            onClick={() => router.push("/admin/automated-video-interviews")}
                            className="flex-1 h-11 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-black   text-[10px] transition active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 h-11 bg-[var(--color-primary)] text-white rounded-xl hover:bg-[var(--color-primary-dark)] font-black   text-[10px] shadow-lg shadow-indigo-100 transition active:scale-95"
                        >
                            Save Updates
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
