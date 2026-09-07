"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/utils/api";
import AIGenerationOverlay from "@/components/ui/AIGenerationOverlay";
import { useAuth } from "@/context/AuthContext";
import { useDivision } from "@/context/DivisionContext";
import { useI18n } from "@/context/I18nContext";

interface TestCase {
    input: string;
    output: string;
}

interface Question {
    id?: string;
    type: string;
    topic: string;
    difficulty: string;
    content: {
        question?: string;
        scenario?: string;
        initial_code?: { python: string };
        test_cases?: TestCase[];
        options?: {
            A: string;
            B: string;
            C: string;
            D: string;
        };
        min_words?: number;
        max_words?: number;
    };
    correct_answer: {
        answer: string;
        explanation: string;
    };
    department_id?: number | null;
    batch?: string | null;
}

interface QuestionFormProps {
    onSuccess: (newQuestion: Question) => void;
    onCancel: () => void;
    initialType?: string;
    lockType?: boolean;
    initialData?: Question;
    departmentId?: number | null;
}

export default function QuestionForm({ onSuccess, onCancel, initialType = "APTITUDE", lockType = false, initialData, departmentId }: QuestionFormProps) {
    const { batch: creatorBatch } = useAuth();
    const { selectedBatch } = useDivision();
    const { t: tr } = useI18n();
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
    const [minWords, setMinWords] = useState(initialData?.content?.min_words || 0);
    const [maxWords, setMaxWords] = useState(initialData?.content?.max_words || 500);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [testCases, setTestCases] = useState<TestCase[]>(initialData?.content?.test_cases || []);
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
        if (!topic) return alert(tr("superAdmin.pleaseEnterTopic"));
        setGenerating(true);
        try {
            const res = await apiClient.post(`/api/v1/evaluator/generate`, { topic, difficulty });

            if (res.ok) {
                const data = await res.json();
                setQuestionText(data.question);
                setExplanation(data.model_answer);
            } else {
                alert(tr("superAdmin.failedGenerateQuestion"));
            }
        } catch (e) {
            console.error(e);
            alert(tr("superAdmin.errorGeneratingQuestion"));
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
            if (!questionText.trim()) return alert(tr("superAdmin.pleaseEnterProblemDescription"));
            if (testCases.length === 0) return alert(tr("superAdmin.pleaseAddTestCase"));
            if (testCases.some(tc => !tc.input.trim() || !tc.output.trim())) {
                return alert(tr("superAdmin.allTestCasesInputOutput"));
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
                    min_words: minWords,
                    max_words: maxWords,
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
                alert(initialData?.id ? tr("superAdmin.failedUpdateQuestion") : tr("superAdmin.failedCreateQuestion"));
            }
        } catch (e) {
            console.error(e);
            alert(tr("superAdmin.errorCreatingQuestion"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl p-0">
            <AIGenerationOverlay isOpen={generating} title={tr("superAdmin.synchronizingNeuralLink")} />
            <form onSubmit={handleSubmit} className="space-y-4">
                {!lockType && (
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900  tracking-tight">{tr("superAdmin.addCustomQuestion")}</h3>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <i className="mdi mdi-close" />
                        </button>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {!lockType && (
                        <div>
                            <label htmlFor="qf-category" className="block text-[10px] font-black text-gray-400   mb-1">{tr("superAdmin.category")}</label>
                            <select
                                id="qf-category"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none"
                            >
                                <option value="APTITUDE">{tr("superAdmin.aptitudeMcq")}</option>
                                <option value="CODING">{tr("superAdmin.coding")}</option>
                                <option value="COMMUNICATION">{tr("superAdmin.communication")}</option>
                                <option value="PERSONALITY">{tr("superAdmin.personalityTest")}</option>
                                <option value="BEHAVIORAL">{tr("superAdmin.behavioralEmotional")}</option>
                                <option value="SUBJECTIVE">{tr("superAdmin.subjectiveAiEvaluator")}</option>
                            </select>
                        </div>
                    )}
                    <div className={lockType ? "col-span-2" : ""}>
                        <label className="block text-[10px] font-black text-gray-400   mb-1">{type === "SUBJECTIVE" ? tr("superAdmin.domainTopic") : tr("superAdmin.topic")}</label>
                        <input
                            type="text"
                            list="topic-suggestions"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none placeholder:text-slate-300"
                            placeholder={type === "SUBJECTIVE" ? tr("superAdmin.egSystemDesign") : tr("superAdmin.egLeadershipStyle")}
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
                                <i className="mdi mdi-auto-fix text-sm" />{" "}
                                {tr("superAdmin.generateWithAi")}
                            </button>
                        )}
                    </div>
                    <div>
                        <label htmlFor="qf-difficulty" className="block text-[10px] font-black text-gray-400   mb-1">{tr("superAdmin.difficulty")}</label>
                        <select
                            id="qf-difficulty"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none"
                        >
                            <option value="EASY">{tr("superAdmin.easy")}</option>
                            <option value="MEDIUM">{tr("superAdmin.medium")}</option>
                            <option value="HARD">{tr("superAdmin.hard")}</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-gray-400   mb-1">
                        {type === "CODING" ? tr("superAdmin.problemDescription") : type === "COMMUNICATION" ? tr("superAdmin.scenarioPrompt") : type === "SUBJECTIVE" ? tr("superAdmin.scenarioTaskInstructions") : tr("superAdmin.questionText")}
                    </label>
                    <textarea
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-medium text-slate-700 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none placeholder:text-slate-300 min-h-[120px]"
                        rows={3}
                        placeholder={type === "SUBJECTIVE" ? tr("superAdmin.describeTaskPlaceholder") : tr("superAdmin.enterQuestionPlaceholder")}
                    />
                </div>

                {type === "SUBJECTIVE" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-700">
                        <div>
                            <label htmlFor="qf-min-words" className="block text-[10px] font-black text-gray-400   mb-1">{tr("superAdmin.minWordLimit")}</label>
                            <input id="qf-min-words" name="min_words" type="number" value={minWords} onChange={e => setMinWords(Number.parseInt(e.target.value, 10))} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-medium text-gray-900" />
                        </div>
                        <div>
                            <label htmlFor="qf-max-words" className="block text-[10px] font-black text-gray-400   mb-1">{tr("superAdmin.maxWordLimit")}</label>
                            <input id="qf-max-words" name="max_words" type="number" value={maxWords} onChange={e => setMaxWords(Number.parseInt(e.target.value, 10))} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-medium text-gray-900" />
                        </div>
                    </div>
                )}

                {(type === "APTITUDE" || type === "PERSONALITY" || type === "BEHAVIORAL") && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="qf-option-a" className="block text-[10px] font-black text-gray-400   mb-1">{tr("superAdmin.optionA")}</label>
                                <input id="qf-option-a" type="text" value={optionA} onChange={(e) => setOptionA(e.target.value)} required className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-medium text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="qf-option-b" className="block text-[10px] font-black text-gray-400   mb-1">{tr("superAdmin.optionB")}</label>
                                <input id="qf-option-b" type="text" value={optionB} onChange={(e) => setOptionB(e.target.value)} required className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-medium text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="qf-option-c" className="block text-[10px] font-black text-gray-400   mb-1">{tr("superAdmin.optionC")}</label>
                                <input id="qf-option-c" type="text" value={optionC} onChange={(e) => setOptionC(e.target.value)} required className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-medium text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="qf-option-d" className="block text-[10px] font-black text-gray-400   mb-1">{tr("superAdmin.optionD")}</label>
                                <input id="qf-option-d" type="text" value={optionD} onChange={(e) => setOptionD(e.target.value)} required className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-medium text-gray-900" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="qf-correct-option" className="block text-[10px] font-black text-gray-400   mb-1">{tr("superAdmin.correctAnswer")}</label>
                                <select id="qf-correct-option" value={correctOption} onChange={(e) => setCorrectOption(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-bold text-gray-900">
                                    <option value="A">{tr("superAdmin.optionA")}</option>
                                    <option value="B">{tr("superAdmin.optionB")}</option>
                                    <option value="C">{tr("superAdmin.optionC")}</option>
                                    <option value="D">{tr("superAdmin.optionD")}</option>
                                </select>
                            </div>
                        </div>
                    </>
                )}

                {type === "CODING" && (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="qf-initial-code" className="block text-[10px] font-black text-gray-400   mb-1">{tr("superAdmin.initialCodePython")}</label>
                            <textarea
                                id="qf-initial-code"
                                value={initialCode}
                                onChange={(e) => setInitialCode(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-50"
                                rows={4}
                                placeholder="def solution():\n    pass"
                            />
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="flex justify-between items-center mb-3">
                                <span className="block text-[10px] font-black text-gray-400  ">{tr("superAdmin.testCases")}</span>
                                <button
                                    type="button"
                                    onClick={() => setTestCases([...testCases, { input: "", output: "" }])}
                                    className="text-[10px] font-black   text-slate-800 hover:text-slate-600"
                                >
                                    {tr("superAdmin.addTestCase")}
                                </button>
                            </div>
                            <div className="space-y-3">
                                {testCases.map((tc, idx) => (
                                    <div key={idx} className="flex gap-2 items-start bg-white p-3 rounded-lg border border-gray-100 relative group">
                                        <div className="flex-1">
                                            <span className="text-[8px] font-black text-gray-400  block mb-1">{tr("superAdmin.input")}</span>
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
                                            <span className="text-[8px] font-black text-gray-400  block mb-1">{tr("superAdmin.output")}</span>
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
                                            <i className="mdi mdi-delete text-sm" />
                                        </button>
                                    </div>
                                ))}
                                {testCases.length === 0 && (
                                    <p className="text-[10px] text-gray-400  text-center py-2">{tr("superAdmin.noTestCases")}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {(type === "APTITUDE" || type === "PERSONALITY" || type === "BEHAVIORAL" || type === "SUBJECTIVE") && (
                    <div className={type === "SUBJECTIVE" && !explanation ? "hidden" : "animate-in slide-in-from-top-4 duration-700 delay-100"}>
                        <label className="block text-[10px] font-black text-gray-400   mb-1">{type === "SUBJECTIVE" ? tr("superAdmin.targetAnswerSample") : tr("superAdmin.explanation")}</label>
                        <textarea
                            value={explanation}
                            onChange={(e) => setExplanation(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-slate-500"
                            rows={3}
                            placeholder={type === "SUBJECTIVE" ? tr("superAdmin.idealResponsePlaceholder") : tr("superAdmin.explainAnswerPlaceholder")}
                        />
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 border border-slate-200 text-slate-400 text-[10px] font-black  tracking-[0.2em] rounded-xl hover:bg-slate-50 transition-all"
                    >
                        {tr("superAdmin.cancel")}
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-slate-900 text-white text-[10px] font-black  tracking-[0.2em] rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 disabled:opacity-50 active:scale-95"
                    >
                        {loading ? tr("superAdmin.processing") : tr("superAdmin.saveConfiguration")}
                    </button>
                </div>
            </form>
        </div >
    );
}
