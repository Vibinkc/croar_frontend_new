"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";
import SpotOnQuestionEditor from "@/components/admin/SpotOnQuestionEditor";

export default function CreateSpotOnPage() {
    const router = useRouter();

    const [questionCount, setQuestionCount] = useState(5);
    const [generating, setGenerating] = useState(false);
    const [questions, setQuestions] = useState<any[]>([]);
    const [title, setTitle] = useState("Spot On Visual Challenge");
    const [description, setDescription] = useState("Identify the exact geometric match among the options.");
    const [saving, setSaving] = useState(false);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await apiClient.post(`/api/v1/psychometric/generate-spot-on?count=${questionCount}`, {});

            if (!res.ok) throw new Error("Generation Failed");
            const data = await res.json();

            setQuestions(data.questions);
            setTitle(data.title);
            setDescription(data.description);

        } catch (e) {
            console.error(e);
            alert("Failed to generate Spot On questions");
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                title: title,
                description: description,
                trait: "Visual Attention",
                test_type: "SPOT_ON",
                questions: questions
            };

            const res = await apiClient.post(`/api/v1/psychometric/`, payload);

            if (res.ok) {
                router.push("/admin/psychometric");
            }
        } catch (e) {
            console.error(e);
            alert("Failed to save Spot On protocol");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto space-y-8 pb-20 px-8">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-all"
                >
                    <span className="material-icons-outlined">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Initialize Spot On</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gamified Visual Assessment</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100 p-8 space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Protocol Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Number of Puzzles</label>
                            <input
                                type="number"
                                value={questionCount}
                                onChange={(e) => setQuestionCount(Number(e.target.value))}
                                min={1}
                                max={20}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-500 outline-none"
                            />
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                            <div className="flex items-start gap-3">
                                <span className="material-icons-outlined text-slate-600 mt-1">auto_awesome</span>
                                <div>
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-1">AI Puzzle Design</h3>
                                    <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                                        Generates intricate geometric pattern matching puzzles instantly.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 hover:shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {generating ? "Calculating..." : "Generate AI Puzzles"}
                        </button>
                    </div>
                </div>

                {/* Main Content: Review */}
                <div className="lg:col-span-2 space-y-6">
                    {questions.length > 0 ? (
                        <>
                            <div className="space-y-6">
                                {questions.map((q, idx) => (
                                    <div key={idx} className="relative">
                                        <div className="absolute -left-3 top-6 w-8 h-8 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center z-10 text-[10px] font-black text-slate-400">
                                            {idx + 1}
                                        </div>
                                        <SpotOnQuestionEditor
                                            target={q.target}
                                            options={q.options}
                                            correctIndex={q.correct_index}
                                            onUpdate={(updatedQ) => {
                                                const newQs = [...questions];
                                                newQs[idx] = updatedQ;
                                                setQuestions(newQs);
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-12 py-4 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                                >
                                    {saving ? "Deploying..." : "Finalize Assessment"}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center min-h-[400px] border-2 border-dashed border-slate-100 rounded-[3rem] text-slate-300">
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                    <span className="material-icons-outlined text-4xl">travel_explore</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest">No Puzzles Generated</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Configure and generate to begin review</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
