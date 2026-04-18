"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";

export default function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const { id } = unwrappedParams;
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    const [type, setType] = useState("APTITUDE");
    const [topic, setTopic] = useState("Algebra");
    const [customTopic, setCustomTopic] = useState("");
    const [difficulty, setDifficulty] = useState("EASY");
    const [questionText, setQuestionText] = useState("");
    const [initialCode, setInitialCode] = useState("");
    const [optionA, setOptionA] = useState("");
    const [optionB, setOptionB] = useState("");
    const [optionC, setOptionC] = useState("");
    const [optionD, setOptionD] = useState("");
    const [correctOption, setCorrectOption] = useState("A");
    const [explanation, setExplanation] = useState("");

    const [availableTopics, setAvailableTopics] = useState<string[]>([]);

    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        try {
            const res = await apiClient.get(`/api/v1/content/questions/topics`);
            if (res.ok) {
                const data = await res.json();
                setAvailableTopics(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchQuestion();
    }, [id]);

    const fetchQuestion = async () => {
        try {
            const res = await apiClient.get(`/api/v1/content/questions/${id}`);
            if (res.ok) {
                const data = await res.json();

                // Populate form
                if (availableTopics.includes(data.topic)) {
                    setTopic(data.topic);
                    setCustomTopic("");
                } else {
                    setTopic("Other");
                    setCustomTopic(data.topic);
                }

                setDifficulty(data.difficulty);
                setType(data.type || "APTITUDE"); // Default if missing

                if (data.type === "CODING") {
                    setQuestionText(data.content.question || "");
                    if (data.content.initial_code && data.content.initial_code["python"]) {
                        setInitialCode(data.content.initial_code["python"]);
                    } else {
                        setInitialCode("");
                    }
                } else {
                    setQuestionText(data.content.question || "");
                    if (data.content.options) {
                        setOptionA(data.content.options.A || "");
                        setOptionB(data.content.options.B || "");
                        setOptionC(data.content.options.C || "");
                        setOptionD(data.content.options.D || "");
                    }
                    if (data.correct_answer) {
                        setCorrectOption(data.correct_answer.answer || "A");
                        setExplanation(data.correct_answer.explanation || "");
                    }
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const finalTopic = topic === "Other" ? customTopic : topic;

        let payload;
        if (type === "CODING") {
            payload = {
                type: "CODING",
                topic: finalTopic,
                difficulty,
                content: {
                    question: questionText,
                    initial_code: { python: initialCode },
                    test_cases: []
                },
                correct_answer: {
                    answer: "N/A",
                    explanation: "Coding Problem"
                }
            };
        } else {
            payload = {
                type: "APTITUDE",
                topic: finalTopic,
                difficulty,
                content: {
                    question: questionText,
                    options: {
                        A: optionA,
                        B: optionB,
                        C: optionC,
                        D: optionD
                    }
                },
                correct_answer: {
                    answer: correctOption,
                    explanation
                }
            };
        }

        const res = await apiClient.put(`/api/v1/content/questions/${id}`, payload);

        if (res.ok) {
            router.push("/admin/aptitude");
        } else {
            alert("Failed to update question");
        }
    };

    if (loading) return <div>Loading question...</div>;

    return (
        <div className="bg-white shadow-sm sm:rounded-3xl p-5 border border-slate-100">
            <h2 className="text-lg font-black mb-5 text-gray-800  tracking-tight">Edit Question</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400   mb-1.5">Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            disabled
                            className="mt-1 block w-full py-2 pl-3 pr-8 border border-gray-200 bg-gray-50 rounded-xl shadow-sm text-xs font-bold text-gray-500 cursor-not-allowed"
                        >
                            <option value="APTITUDE">Aptitude (MCQ)</option>
                            <option value="CODING">Coding</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400   mb-1.5">Topic</label>
                        <select
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="mt-1 block w-full py-2 pl-3 pr-8 border border-gray-200 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-xs font-bold text-black"
                        >
                            {availableTopics.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                            <option value="Other">Other</option>
                        </select>
                        {topic === "Other" && (
                            <input
                                type="text"
                                value={customTopic}
                                onChange={(e) => setCustomTopic(e.target.value)}
                                placeholder="Enter custom topic"
                                className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black"
                                required
                            />
                        )}
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400   mb-1.5">Difficulty</label>
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                            className="mt-1 block w-full py-2 pl-3 pr-8 border border-gray-200 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-xs font-bold text-black"
                        >
                            <option value="EASY">Easy</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HARD">Hard</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-gray-400   mb-1.5">
                        {type === "CODING" ? "Problem Description" : "Question Text"}
                    </label>
                    <textarea
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        required
                        className="mt-1 block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-xs font-medium text-black"
                        rows={3}
                    />
                </div>

                {type === "CODING" ? (
                    <div>
                        <label className="block text-[10px] font-black text-gray-400   mb-1.5">Initial Code (Python)</label>
                        <textarea
                            value={initialCode}
                            onChange={(e) => setInitialCode(e.target.value)}
                            className="mt-1 block w-full font-mono text-xs px-4 py-3 border border-gray-200 rounded-xl shadow-sm text-black focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                            rows={5}
                            placeholder="def solution():\n    pass"
                        />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400   mb-1.5">Option A</label>
                                <input type="text" value={optionA} onChange={(e) => setOptionA(e.target.value)} required className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-xl text-xs font-medium text-black focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400   mb-1.5">Option B</label>
                                <input type="text" value={optionB} onChange={(e) => setOptionB(e.target.value)} required className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-xl text-xs font-medium text-black focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400   mb-1.5">Option C</label>
                                <input type="text" value={optionC} onChange={(e) => setOptionC(e.target.value)} required className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-xl text-xs font-medium text-black focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400   mb-1.5">Option D</label>
                                <input type="text" value={optionD} onChange={(e) => setOptionD(e.target.value)} required className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-xl text-xs font-medium text-black focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400   mb-1.5">Correct Option</label>
                                <select
                                    value={correctOption}
                                    onChange={(e) => setCorrectOption(e.target.value)}
                                    className="mt-1 block w-full py-2 pl-3 pr-8 border border-gray-200 bg-white rounded-xl shadow-sm text-xs font-bold text-black focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                                >
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                    <option value="D">D</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400   mb-1.5">Explanation</label>
                                <input type="text" value={explanation} onChange={(e) => setExplanation(e.target.value)} className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-xl text-xs font-medium text-black focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]" />
                            </div>
                        </div>
                    </>
                )}

                <div className="flex justify-end gap-3">
                    <button type="submit" className="inline-flex justify-center py-2.5 px-5 border border-transparent shadow-sm text-[10px] font-black   rounded-xl text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] focus:outline-none transition-all">
                        Update Question
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="inline-flex justify-center py-2.5 px-5 border border-slate-200 shadow-sm text-[10px] font-black   rounded-xl text-slate-600 bg-white hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
