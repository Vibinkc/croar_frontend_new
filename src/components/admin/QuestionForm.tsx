"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/utils/api";
import AIGenerationOverlay from "@/components/ui/AIGenerationOverlay";
import { useAuth } from "@/context/AuthContext";
import { useDivision } from "@/context/DivisionContext";

interface QuestionFormProps {
    onSuccess: (newQuestion: any) => void;
    onCancel: () => void;
    initialType?: string;
    lockType?: boolean;
    initialData?: any;
    departmentId?: number | null;
}

export default function QuestionForm({ onSuccess, onCancel, initialType = "APTITUDE", lockType = false, initialData, departmentId }: QuestionFormProps) {
    const { batch: creatorBatch } = useAuth();
    const { selectedBatch } = useDivision();
    const [type, setType] = useState(initialData?.type || initialType);
    const [topic, setTopic] = useState(initialData?.topic || "");
    const [customTopic, setCustomTopic] = useState("");
    const [difficulty, setDifficulty] = useState(initialData?.difficulty || "EASY");
    const [questionText, setQuestionText] = useState(initialData?.content?.question || "");
    const [initialCode, setInitialCode] = useState(initialData?.content?.initial_code?.python || "");
    const [optionA, setOptionA] = useState(initialData?.content?.options?.A || "");
    const [optionB, setOptionB] = useState(initialData?.content?.options?.B || "");
    const [optionC, setOptionC] = useState(initialData?.content?.options?.C || "");
    const [optionD, setOptionD] = useState(initialData?.content?.options?.D || "");
    const [correctOption, setCorrectOption] = useState(initialData?.correct_answer?.answer || "A");
    const [explanation, setExplanation] = useState(initialData?.correct_answer?.explanation || initialData?.correct_answer?.answer || "");
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [testCases, setTestCases] = useState<any[]>(initialData?.content?.test_cases || []);
    const [availableTopics, setAvailableTopics] = useState<string[]>([]);
    // If we have initialData.batch, we use it, otherwise we use the globally selected batch or the creator's batch
    const [batch, setBatch] = useState(initialData?.batch || selectedBatch || creatorBatch || "");

    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const res = await apiClient.get(`/api/v1/content/questions/topics?type=${type}`);
                if (res.ok) {
                    const data = await res.json();
                    setAvailableTopics(data);
                }
            } catch (e) {
                console.error("Failed to fetch topics", e);
            }
        };
        fetchTopics();
    }, [type]);

    const handleGenerateAI = async () => {
        if (!topic) return alert("Please enter a topic first");
        setGenerating(true);
        try {
            const res = await apiClient.post(`/api/v1/evaluator/generate`, { topic, difficulty });

            if (res.ok) {
                const data = await res.json();
                setQuestionText(data.question);
                setExplanation(data.model_answer);
            } else {
                alert("Failed to generate question");
            }
        } catch (e) {
            console.error(e);
            alert("Error generating question");
        } finally {
            setGenerating(false);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const finalTopic = topic;

        let payload;
        if (type === "CODING") {
            if (!questionText.trim()) return alert("Please enter a problem description");
            if (testCases.length === 0) return alert("Please add at least one test case");
            if (testCases.some(tc => !tc.input.trim() || !tc.output.trim())) {
                return alert("All test cases must have both input and output");
            }
            payload = {
                type: "CODING",
                topic: finalTopic,
                difficulty,
                content: {
                    question: questionText,
                    initial_code: { python: initialCode },
                    test_cases: testCases
                },
                correct_answer: {
                    answer: "N/A",
                    explanation: explanation || "Coding Problem"
                },
                department_id: departmentId,
                batch: batch || null
            };
        } else if (type === "COMMUNICATION") {
            payload = {
                type: "COMMUNICATION",
                topic: finalTopic,
                difficulty,
                content: {
                    question: questionText,
                    scenario: questionText
                },
                correct_answer: {
                    answer: "ORAL_RESPONSE",
                    explanation: "AI Evaluated"
                },
                department_id: departmentId,
                batch: batch || null
            };
        } else if (type === "SUBJECTIVE") {
            payload = {
                type: "SUBJECTIVE",
                topic: finalTopic,
                difficulty,
                content: {
                    question: questionText,
                    min_words: Number((e.target as any).min_words?.value || 0),
                    max_words: Number((e.target as any).max_words?.value || 500),
                },
                correct_answer: {
                    answer: explanation, // Store sample/target answer here
                    explanation: "AI Evaluated Subjective Task"
                },
                department_id: departmentId,
                batch: batch || null
            };
        } else if (type === "PERSONALITY" || type === "BEHAVIORAL") {
            payload = {
                type: type,
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
                },
                department_id: departmentId,
                batch: batch || null
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
                },
                department_id: departmentId,
                batch: batch || null
            };
        }

        try {
            const url = initialData?.id
                ? `/api/v1/content/questions/${initialData.id}`
                : `/api/v1/content/questions`;

            const res = initialData?.id
                ? await apiClient.put(url, payload)
                : await apiClient.post(url, payload);

            if (res.ok) {
                const newQ = await res.json();
                onSuccess(newQ);
            } else {
                alert(`Failed to ${initialData?.id ? 'update' : 'create'} question`);
            }
        } catch (e) {
            console.error(e);
            alert("Error creating question");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl p-0">
            <AIGenerationOverlay isOpen={generating} title="Synchronizing Neural Link" />
            {!lockType && (
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900  tracking-tight">Add Custom Question</h3>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <span className="material-icons-outlined">close</span>
                    </button>
                </div>
            )}

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {!lockType && (
                        <div>
                            <label className="block text-[10px] font-black text-gray-400   mb-1">Category</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none"
                            >
                                <option value="APTITUDE">Aptitude (MCQ)</option>
                                <option value="CODING">Coding</option>
                                <option value="COMMUNICATION">Communication</option>
                                <option value="PERSONALITY">Personality Test</option>
                                <option value="BEHAVIORAL">Behavioral & Emotional</option>
                                <option value="SUBJECTIVE">Subjective (AI Evaluator)</option>
                            </select>
                        </div>
                    )}
                    <div className={lockType ? "col-span-2" : ""}>
                        <label className="block text-[10px] font-black text-gray-400   mb-1">{type === "SUBJECTIVE" ? "Domain / Topic" : "Topic"}</label>
                        <input
                            type="text"
                            list="topic-suggestions"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none placeholder:text-slate-300"
                            placeholder={type === "SUBJECTIVE" ? "e.g., System Design" : "e.g., Leadership style"}
                        />
                        <datalist id="topic-suggestions">
                            {availableTopics.map(t => (
                                <option key={t} value={t} />
                            ))}
                        </datalist>
                        {type === "SUBJECTIVE" && (
                            <button
                                type="button"
                                onClick={handleGenerateAI}
                                disabled={generating || !topic}
                                className="mt-2 text-[10px] font-black   text-slate-600 hover:text-slate-700 flex items-center gap-1 disabled:opacity-50"
                            >
                                <span className="material-icons-outlined text-sm">auto_awesome</span>
                                Generate with AI
                            </button>
                        )}
                        <datalist id="topic-suggestions">
                            {availableTopics.map(t => (
                                <option key={t} value={t} />
                            ))}
                        </datalist>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400   mb-1">Difficulty</label>
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none"
                        >
                            <option value="EASY">Easy</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HARD">Hard</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-gray-400   mb-1">
                        {type === "CODING" ? "Problem Description" : type === "COMMUNICATION" ? "Scenario Prompt" : type === "SUBJECTIVE" ? "Scenario / Task Instructions" : "Question Text"}
                    </label>
                    <textarea
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-medium text-slate-700 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none placeholder:text-slate-300 min-h-[120px]"
                        rows={3}
                        placeholder={type === "SUBJECTIVE" ? "Describe the task or scenario for the candidate..." : "Enter your question here..."}
                    />
                </div>

                {type === "SUBJECTIVE" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-700">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400   mb-1">Min Word Limit</label>
                            <input name="min_words" type="number" defaultValue={0} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-medium text-gray-900" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400   mb-1">Max Word Limit</label>
                            <input name="max_words" type="number" defaultValue={500} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-medium text-gray-900" />
                        </div>
                    </div>
                )}

                {(type === "APTITUDE" || type === "PERSONALITY" || type === "BEHAVIORAL") && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400   mb-1">Option A</label>
                                <input type="text" value={optionA} onChange={(e) => setOptionA(e.target.value)} required className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-medium text-gray-900" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400   mb-1">Option B</label>
                                <input type="text" value={optionB} onChange={(e) => setOptionB(e.target.value)} required className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-medium text-gray-900" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400   mb-1">Option C</label>
                                <input type="text" value={optionC} onChange={(e) => setOptionC(e.target.value)} required className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-medium text-gray-900" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400   mb-1">Option D</label>
                                <input type="text" value={optionD} onChange={(e) => setOptionD(e.target.value)} required className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-medium text-gray-900" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400   mb-1">Correct Answer</label>
                                <select value={correctOption} onChange={(e) => setCorrectOption(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-bold text-gray-900">
                                    <option value="A">Option A</option>
                                    <option value="B">Option B</option>
                                    <option value="C">Option C</option>
                                    <option value="D">Option D</option>
                                </select>
                            </div>
                        </div>
                    </>
                )}

                {type === "CODING" && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400   mb-1">Initial Code (Python)</label>
                            <textarea
                                value={initialCode}
                                onChange={(e) => setInitialCode(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-50"
                                rows={4}
                                placeholder="def solution():\n    pass"
                            />
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-[10px] font-black text-gray-400  ">Test Cases</label>
                                <button
                                    type="button"
                                    onClick={() => setTestCases([...testCases, { input: "", output: "" }])}
                                    className="text-[10px] font-black   text-slate-800 hover:text-slate-600"
                                >
                                    + Add Test Case
                                </button>
                            </div>
                            <div className="space-y-3">
                                {testCases.map((tc, idx) => (
                                    <div key={idx} className="flex gap-2 items-start bg-white p-3 rounded-lg border border-gray-100 relative group">
                                        <div className="flex-1">
                                            <span className="text-[8px] font-black text-gray-400  block mb-1">Input</span>
                                            <textarea
                                                value={tc.input}
                                                onChange={(e) => {
                                                    const next = [...testCases];
                                                    next[idx].input = e.target.value;
                                                    setTestCases(next);
                                                }}
                                                className="w-full bg-slate-50 border-0 rounded text-[10px] font-mono p-2 focus:ring-1 focus:ring-slate-500"
                                                rows={2}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-[8px] font-black text-gray-400  block mb-1">Output</span>
                                            <textarea
                                                value={tc.output}
                                                onChange={(e) => {
                                                    const next = [...testCases];
                                                    next[idx].output = e.target.value;
                                                    setTestCases(next);
                                                }}
                                                className="w-full bg-slate-50 border-0 rounded text-[10px] font-mono p-2 focus:ring-1 focus:ring-slate-500"
                                                rows={2}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setTestCases(testCases.filter((_, i) => i !== idx))}
                                            className="p-1 text-gray-300 hover:text-slate-900 transition-colors"
                                        >
                                            <span className="material-icons-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                ))}
                                {testCases.length === 0 && (
                                    <p className="text-[10px] text-gray-400  text-center py-2">No test cases added yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {(type === "APTITUDE" || type === "PERSONALITY" || type === "BEHAVIORAL" || type === "SUBJECTIVE") && (
                    <div className={type === "SUBJECTIVE" && !explanation ? "hidden" : "animate-in slide-in-from-top-4 duration-700 delay-100"}>
                        <label className="block text-[10px] font-black text-gray-400   mb-1">{type === "SUBJECTIVE" ? "Target Answer (Sample Response for AI Reference)" : "Explanation"}</label>
                        <textarea
                            value={explanation}
                            onChange={(e) => setExplanation(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-slate-500"
                            rows={3}
                            placeholder={type === "SUBJECTIVE" ? "Enter the ideal response that AI should look for..." : "Explain why the answer is correct..."}
                        />
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 border border-slate-200 text-slate-400 text-[10px] font-black  tracking-[0.2em] rounded-xl hover:bg-slate-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit as any}
                        disabled={loading}
                        className="px-8 py-3 bg-slate-900 text-white text-[10px] font-black  tracking-[0.2em] rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 disabled:opacity-50 active:scale-95"
                    >
                        {loading ? 'Processing...' : 'Save Configuration'}
                    </button>
                </div>
            </div>
        </div >
    );
}
