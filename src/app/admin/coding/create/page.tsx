"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/utils/api";
import { useDivision } from "@/context/DivisionContext";
import AIGenerationOverlay from "@/components/ui/AIGenerationOverlay";

export default function CreateCodingQuestionPage() {
    const { selectedBatch } = useDivision();
    const router = useRouter();
    const searchParams = useSearchParams();
    const departmentId = searchParams.get("department_id");
    const [activeTab, setActiveTab] = useState("MANUAL"); // MANUAL, BULK, AI

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab && ["MANUAL", "BULK", "AI"].includes(tab.toUpperCase())) {
            setActiveTab(tab.toUpperCase());
        }
    }, [searchParams]);
    const [availableTopics, setAvailableTopics] = useState<string[]>([]);



    // Manual State
    const [topic, setTopic] = useState("");
    const [customTopic, setCustomTopic] = useState("");
    const [difficulty, setDifficulty] = useState("EASY");
    const [questionText, setQuestionText] = useState("");
    const [initialCode, setInitialCode] = useState("def solution():\n    # Write your code here\n    pass");

    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        try {
            // Filter by CODING type
            const res = await apiClient.get(`/api/v1/content/questions/topics?type=CODING`);
            if (res.ok) {
                const topics = await res.json();
                setAvailableTopics(prev => {
                    const uniqueTopics = Array.from(new Set([...prev, ...topics]))
                        .filter(t => t.trim().toLowerCase() !== "other");
                    return uniqueTopics;
                });
            }
        } catch (e) {
            console.error("Failed to fetch topics", e);
        }
    };

    useEffect(() => {
        if (availableTopics.length > 0) {
            setTopic(availableTopics[0]);
        } else {
            setTopic("Other");
        }
    }, [availableTopics]);

    // Bulk State
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    // AI State
    const [aiCount, setAiCount] = useState(5);
    const [generating, setGenerating] = useState(false);
    const [aiDifficulties, setAiDifficulties] = useState<string[]>(["MEDIUM"]);
    const [draftQuestions, setDraftQuestions] = useState<any[]>([]);
    const [selectedDrafts, setSelectedDrafts] = useState<number[]>([]);
    const [isSavingBulk, setIsSavingBulk] = useState(false);
    const [manualTestCases, setManualTestCases] = useState<{ input: string, output: string }[]>([{ input: "", output: "" }]);

    const handleSaveDraft = async (draft: any) => {
        if (!draft.content?.question?.trim()) {
            return alert("Cannot save: Problem description is empty.");
        }
        if (!draft.content?.test_cases || draft.content.test_cases.length === 0 || draft.content.test_cases.some((tc: any) => !tc.input.trim() || !tc.output.trim())) {
            return alert("Cannot save: At least one valid test case (input/output) is required.");
        }
        try {
            const res = await apiClient.post(`/api/v1/content/questions`, {
                type: "CODING",
                topic: draft.topic,
                difficulty: draft.difficulty,
                content: {
                    question: draft.content.question,
                    initial_code: draft.content.initial_code,
                    test_cases: draft.content.test_cases || [],
                    allowed_languages: draft.content.allowed_languages || ["python", "java", "cpp", "javascript"],
                    constraints: draft.content.constraints || [],
                    examples: draft.content.examples || [],
                    time_limit: draft.content.time_limit || 2
                },
                correct_answer: {
                    answer: "N/A",
                    explanation: draft.correct_answer.explanation
                },
                department_id: departmentId ? parseInt(departmentId) : null,
                batch: selectedBatch
            });

            if (res.ok) {
                setDraftQuestions(prev => prev.filter(q => q.tempId !== draft.tempId));
                // Optional: validtion or notification
            } else {
                alert("Failed to save question");
            }
        } catch (e) {
            console.error(e);
            alert("Error saving question");
        }
    };

    const handleDiscardDraft = (tempId: number) => {
        setDraftQuestions(prev => prev.filter(q => q.tempId !== tempId));
    };

    const handleUpdateDraft = (tempId: number, field: string, value: any, nestedField?: string) => {
        setDraftQuestions(prev => prev.map(q => {
            if (q.tempId === tempId) {
                if (field === "content" && nestedField === "question") {
                    return { ...q, content: { ...q.content, question: value } };
                }
                if (field === "content" && nestedField === "allowed_languages") {
                    return { ...q, content: { ...q.content, allowed_languages: value } };
                }
                if (field === "content" && nestedField === "test_cases_full") {
                    return { ...q, content: { ...q.content, test_cases: value } };
                }
                if (field === "correct_answer" && nestedField === "explanation") {
                    return { ...q, correct_answer: { ...q.correct_answer, explanation: value } };
                }
                return q;
            }
            return q;
        }));
    };

    const handleUpdateTestCase = (tempId: number, index: number, field: 'input' | 'output', value: string) => {
        setDraftQuestions(prev => prev.map(q => {
            if (q.tempId === tempId) {
                const newTCs = [...(q.content.test_cases || [])];
                if (!newTCs[index]) newTCs[index] = { input: "", output: "" };
                newTCs[index][field] = value;
                return { ...q, content: { ...q.content, test_cases: newTCs } };
            }
            return q;
        }));
    };

    const handleUpdateCode = (tempId: number, code: string) => {
        setDraftQuestions(prev => prev.map(q => {
            if (q.tempId === tempId) {
                return {
                    ...q,
                    content: {
                        ...q.content,
                        initial_code: { ...q.content.initial_code, python: code }
                    }
                };
            }
            return q;
        }));
    };

    const handleUpdateConstraints = (tempId: number, index: number, value: string) => {
        setDraftQuestions(prev => prev.map(q => {
            if (q.tempId === tempId) {
                const newConstraints = [...(q.content.constraints || [])];
                newConstraints[index] = value;
                return { ...q, content: { ...q.content, constraints: newConstraints } };
            }
            return q;
        }));
    };

    const handleAddConstraint = (tempId: number) => {
        setDraftQuestions(prev => prev.map(q => {
            if (q.tempId === tempId) {
                return { ...q, content: { ...q.content, constraints: [...(q.content.constraints || []), ""] } };
            }
            return q;
        }));
    };

    const handleRemoveConstraint = (tempId: number, index: number) => {
        setDraftQuestions(prev => prev.map(q => {
            if (q.tempId === tempId) {
                return { ...q, content: { ...q.content, constraints: (q.content.constraints || []).filter((_: any, i: number) => i !== index) } };
            }
            return q;
        }));
    };

    const handleUpdateExamples = (tempId: number, index: number, field: 'input' | 'output' | 'explanation', value: string) => {
        setDraftQuestions(prev => prev.map(q => {
            if (q.tempId === tempId) {
                const newExamples = [...(q.content.examples || [])];
                if (!newExamples[index]) newExamples[index] = { input: "", output: "", explanation: "" };
                newExamples[index][field] = value;
                return { ...q, content: { ...q.content, examples: newExamples } };
            }
            return q;
        }));
    };

    const handleAddExample = (tempId: number) => {
        setDraftQuestions(prev => prev.map(q => {
            if (q.tempId === tempId) {
                return { ...q, content: { ...q.content, examples: [...(q.content.examples || []), { input: "", output: "", explanation: "" }] } };
            }
            return q;
        }));
    };

    const handleRemoveExample = (tempId: number, index: number) => {
        setDraftQuestions(prev => prev.map(q => {
            if (q.tempId === tempId) {
                return { ...q, content: { ...q.content, examples: (q.content.examples || []).filter((_: any, i: number) => i !== index) } };
            }
            return q;
        }));
    };

    const handleManualSubmit = async (e: React.FormEvent, addAnother: boolean = false) => {
        e.preventDefault();

        if (!questionText.trim()) {
            return alert("Please enter the problem description.");
        }
        if (topic === "Other" && !customTopic.trim()) {
            return alert("Please enter a custom topic.");
        }
        if (manualTestCases.length === 0 || manualTestCases.some(tc => !tc.input.trim() || !tc.output.trim())) {
            return alert("Please add at least one valid test case (input and output required).");
        }

        const finalTopic = topic === "Other" ? customTopic : topic;

        const payload = {
            type: "CODING",
            topic: finalTopic,
            difficulty,
            content: {
                question: questionText,
                initial_code: { python: initialCode },
                test_cases: manualTestCases
            },
            correct_answer: {
                answer: "N/A",
                explanation: "Coding Problem"
            },
            department_id: departmentId ? parseInt(departmentId) : null,
            batch: selectedBatch
        };

        const res = await apiClient.post(`/api/v1/content/questions`, payload);

        if (res.ok) {
            if (addAnother) {
                // Clear form content but keep topic/difficulty
                setQuestionText("");
                setInitialCode("def solution():\n    # Write your code here\n    pass");
                setManualTestCases([{ input: "", output: "" }]);
                alert("Coding question saved! You can add another one.");
            } else {
                const data = await res.json();
                router.push(`/admin/coding/edit/${data.id}`);
            }
        } else {
            alert("Failed to create coding question");
        }
    };

    const handleBulkUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return alert("Please select a file");

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("preview", "true"); // Always preview
        if (departmentId) formData.append("department_id", departmentId);
        if (selectedBatch) formData.append("batch", selectedBatch);

        try {
            const res = await apiClient.post(`/api/v1/content/questions/bulk-upload`, formData);

            if (res.ok) {
                const data = await res.json();
                if (data.questions) {
                    const drafts = data.questions.map((q: any, idx: number) => ({ ...q, tempId: Date.now() + idx }));
                    setDraftQuestions(drafts);
                } else {
                    alert(data.message);
                    router.push("/admin/coding");
                }
            } else {
                const err = await res.json();
                alert("Upload failed: " + err.detail);
            }
        } catch (e) {
            console.error(e);
            alert("Upload error");
        } finally {
            setUploading(false);
        }
    };

    const handleManualPreview = () => {
        if (!questionText.trim()) {
            return alert("Please enter the problem description before previewing.");
        }
        if (manualTestCases.length === 0 || manualTestCases.some(tc => !tc.input.trim() || !tc.output.trim())) {
            return alert("Please add at least one valid test case.");
        }
        const finalTopic = topic === "Other" ? customTopic : topic;

        const newDraft = {
            tempId: Date.now(),
            type: "CODING",
            topic: finalTopic,
            difficulty,
            content: {
                question: questionText,
                initial_code: { python: initialCode },
                test_cases: manualTestCases
            },
            correct_answer: {
                answer: "N/A",
                explanation: "Coding Problem"
            }
        };

        setDraftQuestions(prev => [...prev, newDraft]);

        // Reset form
        setQuestionText("");
        setInitialCode("def solution():\n    # Write your code here\n    pass");
        setManualTestCases([{ input: "", output: "" }]);
        alert("Coding question added to drafts. Review below.");
    };

    const handleAIGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setGenerating(true);

        const finalTopic = topic === "Other" ? customTopic : topic;

        try {
            const res = await apiClient.post(`/api/v1/content/questions/ai-generate`, {
                topic: finalTopic,
                difficulty: aiDifficulties, // Send array
                count: aiCount,
                type: "CODING",
                preview: true,
                department_id: departmentId ? parseInt(departmentId) : null,
                batch: selectedBatch
            });

            if (res.ok) {
                const data = await res.json();
                if (data.questions) {
                    const drafts = data.questions.map((q: any, idx: number) => ({ ...q, tempId: Date.now() + idx }));
                    setDraftQuestions(drafts);
                } else {
                    alert(data.message);
                    router.push("/admin/coding");
                }
            } else {
                alert("Generation failed");
            }
        } catch (e) {
            alert("Error generating questions");
        } finally {
            setGenerating(false);
        }
    };

    const toggleSelectDraft = (tempId: number) => {
        setSelectedDrafts(prev =>
            prev.includes(tempId)
                ? prev.filter(id => id !== tempId)
                : [...prev, tempId]
        );
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedDrafts(draftQuestions.map(d => d.tempId));
        } else {
            setSelectedDrafts([]);
        }
    };

    const handleBulkSave = async () => {
        if (selectedDrafts.length === 0) return;
        setIsSavingBulk(true);
        let successCount = 0;

        for (const tempId of selectedDrafts) {
            const draft = draftQuestions.find(d => d.tempId === tempId);
            if (!draft) continue;

            if (!draft.content?.question?.trim() || !draft.content?.test_cases || draft.content.test_cases.length === 0 || draft.content.test_cases.some((tc: any) => !tc.input.trim() || !tc.output.trim())) {
                console.warn(`Skipping draft ${tempId} due to incomplete content or missing test cases`);
                continue;
            }

            try {
                const res = await apiClient.post(`/api/v1/content/questions`, {
                    type: "CODING",
                    topic: draft.topic,
                    difficulty: draft.difficulty,
                    content: {
                        question: draft.content.question,
                        initial_code: draft.content.initial_code,
                        test_cases: draft.content.test_cases || [],
                        allowed_languages: draft.content.allowed_languages || ["python", "java", "cpp", "javascript"]
                    },
                    correct_answer: {
                        answer: "N/A",
                        explanation: draft.correct_answer.explanation
                    },
                    department_id: departmentId ? parseInt(departmentId) : null,
                    batch: selectedBatch
                });

                if (res.ok) {
                    successCount++;
                    setDraftQuestions(prev => prev.filter(q => q.tempId !== tempId));
                    setSelectedDrafts(prev => prev.filter(id => id !== tempId));
                }
            } catch (e) {
                console.error(`Failed to save draft ${tempId}`, e);
            }
        }

        setIsSavingBulk(false);
        alert(`Successfully saved ${successCount} questions.`);
    };

    const handleBulkDiscard = () => {
        if (selectedDrafts.length === 0) return;
        if (window.confirm(`Are you sure you want to discard ${selectedDrafts.length} selected drafts?`)) {
            setDraftQuestions(prev => prev.filter(q => !selectedDrafts.includes(q.tempId)));
            setSelectedDrafts([]);
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-32 px-6 pt-4">
            <AIGenerationOverlay isOpen={generating} title="Generating Coding Problems" />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-all hover:scale-105 active:scale-95"
                    >
                        <span className="material-icons-outlined text-xl">arrow_back</span>
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Knowledge Engine v2.0</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Init Protocol</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end text-right">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Sector</span>
                        <span className="text-xs font-bold text-slate-700">{activeTab === "MANUAL" ? "Manual Synthesis" : activeTab === "BULK" ? "Data Ingestion" : "Neural Generation"}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow-sm sm:rounded-2xl p-4 border border-slate-100">
                {/* Tabs */}
                <div className="flex space-x-4 border-b border-gray-100 mb-8">
                    {["MANUAL", "BULK", "AI"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                // Set proper URL on tab change without full reload
                                const params = new URLSearchParams(searchParams.toString());
                                params.set("tab", tab);
                                router.replace(`/admin/coding/create?${params.toString()}`);
                            }}
                            className={`pb-4 px-2 font-black text-[10px] uppercase tracking-widest outline-none transition-colors border-b-2 ${activeTab === tab
                                ? "border-slate-900 text-slate-900"
                                : "border-transparent text-gray-400 hover:text-gray-600"
                                }`}
                        >
                            {tab === "MANUAL" ? "Manual Creation" : tab === "BULK" ? "Bulk Upload" : "AI Generator"}
                        </button>
                    ))}
                </div>

                {activeTab === "MANUAL" && (
                    <form onSubmit={(e) => handleManualSubmit(e)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Topic Classification</label>
                                <div className="flex flex-col gap-3">
                                    <select
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all h-10"
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
                                            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all h-10"
                                            required
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Complexity Level</label>
                                <div className="grid grid-cols-3 gap-3 h-14">
                                    {["EASY", "MEDIUM", "HARD"].map((level) => (
                                        <button
                                            key={level}
                                            type="button"
                                            onClick={() => setDifficulty(level)}
                                            className={`rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border py-2 ${difficulty === level
                                                ? "bg-slate-900 text-white border-slate-900 shadow-lg scale-105"
                                                : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100"
                                                }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Problem Description</label>
                            <textarea
                                value={questionText}
                                onChange={(e) => setQuestionText(e.target.value)}
                                required
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all min-h-[80px]"
                                placeholder="Describe the coding problem. Include input/output examples, constraints, etc."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Initial Code (Python)</label>
                            <textarea
                                value={initialCode}
                                onChange={(e) => setInitialCode(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-mono font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all min-h-[160px]"
                                placeholder="def solution():\n    pass"
                            />
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Test Cases</h4>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Define input/output pairs</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setManualTestCases([...manualTestCases, { input: "", output: "" }])}
                                    className="px-3 py-2 bg-white border border-slate-200 text-[10px] font-black text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm uppercase tracking-widest"
                                >
                                    + Add Scenario
                                </button>
                            </div>
                            <div className="space-y-4">
                                {manualTestCases.map((tc, idx) => (
                                    <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-100 relative group shadow-sm transition-all hover:shadow-md">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Input Data</label>
                                            <textarea
                                                value={tc.input}
                                                onChange={(e) => {
                                                    const next = [...manualTestCases];
                                                    next[idx].input = e.target.value;
                                                    setManualTestCases(next);
                                                }}
                                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-mono font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/10 min-h-[60px]"
                                                placeholder="e.g. 5\n10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Expected Output</label>
                                            <textarea
                                                value={tc.output}
                                                onChange={(e) => {
                                                    const next = [...manualTestCases];
                                                    next[idx].output = e.target.value;
                                                    setManualTestCases(next);
                                                }}
                                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-mono font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/10 min-h-[60px]"
                                                placeholder="e.g. 15"
                                            />
                                        </div>
                                        {manualTestCases.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setManualTestCases(manualTestCases.filter((_, i) => i !== idx))}
                                                className="absolute -right-2 -top-2 w-8 h-8 bg-white text-slate-300 border border-slate-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-lg hover:text-rose-500 transition-all hover:scale-110"
                                            >
                                                <span className="material-icons-outlined text-sm">close</span>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-8 border-t border-slate-100 gap-4">
                            <button
                                type="button"
                                onClick={(e) => handleManualSubmit(e, true)}
                                className="px-8 py-3.5 bg-white text-slate-600 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                            >
                                Save & Inject Another
                            </button>
                            <button
                                type="button"
                                onClick={handleManualPreview}
                                className="px-8 py-3.5 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
                            >
                                Preview & Add to Staging
                            </button>
                            <button
                                type="submit"
                                className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                            >
                                Force Deploy Protocol
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === "BULK" && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="bg-slate-50 rounded-[2rem] p-12 border-2 border-dashed border-slate-200 text-center group hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer relative overflow-hidden">
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                accept=".xlsx, .xls, .csv"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                            <div className="relative z-10">
                                <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    <span className="material-icons-outlined text-3xl text-slate-400 group-hover:text-indigo-500">cloud_upload</span>
                                </div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Initialize Data Ingestion</h3>
                                <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto mb-6">Drag and drop your dataset here or click to browse files</p>
                                {file && (
                                    <div className="inline-flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-indigo-100 shadow-sm animate-in zoom-in duration-300">
                                        <span className="material-icons-outlined text-sm text-indigo-500">description</span>
                                        <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">{file.name}</span>
                                        <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-slate-300 hover:text-rose-500">
                                            <span className="material-icons-outlined text-xs">close</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6">Protocol Schema</h4>
                                <div className="space-y-3">
                                    {[
                                        { label: "type", val: "CODING", desc: "Constant protocol type" },
                                        { label: "topic", val: "Arrays, Strings", desc: "Module categorization" },
                                        { label: "difficulty", val: "EASY, MEDIUM, HARD", desc: "Complexity levels" },
                                        { label: "question", val: "Text content", desc: "Problem description" },
                                        { label: "initial_code", val: "Python skeleton", desc: "Starter code" }
                                    ].map((field) => (
                                        <div key={field.label} className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                            <div>
                                                <span className="text-[10px] font-black text-slate-700 bg-slate-50 px-2 py-1 rounded-md mr-3">{field.label}</span>
                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{field.desc}</span>
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-400 font-mono">{field.val}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-amber-50/50 rounded-[2rem] p-8 border border-amber-100 flex flex-col justify-center text-center">
                                <span className="material-icons-outlined text-4xl text-amber-500 mb-4">lightbulb</span>
                                <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-2">Ingestion Pro-Tip</h4>
                                <p className="text-[10px] text-amber-900/60 font-bold leading-relaxed">
                                    Ensure all headers match exactly. The system will auto-validate each entry and place them in the staging area for your final review.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-8 border-t border-slate-100">
                            <button
                                onClick={handleBulkUpload}
                                disabled={uploading || !file}
                                className="px-12 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                            >
                                {uploading ? "Ingesting Protocols..." : "Begin Neural Ingestion"}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === "AI" && (
                    <form onSubmit={handleAIGenerate} className="space-y-12 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural Complexity Synthesis</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {["EASY", "MEDIUM", "HARD"].map((level) => (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => {
                                                    if (aiDifficulties.includes(level)) {
                                                        setAiDifficulties(aiDifficulties.filter(d => d !== level));
                                                    } else {
                                                        setAiDifficulties([...aiDifficulties, level]);
                                                    }
                                                }}
                                                className={`h-24 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${aiDifficulties.includes(level)
                                                    ? "bg-slate-900 text-white border-slate-900 shadow-xl scale-105"
                                                    : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100"
                                                    }`}
                                            >
                                                <span className="material-icons-outlined text-xl">
                                                    {level === 'EASY' ? 'psychology_alt' : level === 'MEDIUM' ? 'psychology' : 'neurology'}
                                                </span>
                                                <span className="text-[10px] font-black uppercase tracking-widest">{level}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Module Quantity</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={20}
                                            value={aiCount}
                                            onChange={(e) => setAiCount(Number(e.target.value))}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all h-10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Topic Classification</label>
                                        <select
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all h-12"
                                        >
                                            {availableTopics.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                {topic === "Other" && (
                                    <input
                                        type="text"
                                        value={customTopic}
                                        onChange={(e) => setCustomTopic(e.target.value)}
                                        placeholder="Enter custom protocol topic"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all h-10 mt-[-2rem]"
                                        required
                                    />
                                )}
                            </div>

                            <div className="flex flex-col justify-center">
                                <div className="bg-indigo-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <span className="material-icons-outlined text-9xl">auto_awesome</span>
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                                                <span className="material-icons-outlined text-indigo-200 text-xl">memory</span>
                                            </div>
                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-100">Neural Engine Intelligence</h4>
                                        </div>
                                        <p className="text-sm font-bold text-indigo-50/70 leading-relaxed mb-8">
                                            Our AI architecture will synthesize high-fidelity coding problems specialized for the selected sector.
                                        </p>
                                        <div className="space-y-3">
                                            {["Procedural Generation", "Unit Test Synthesis", "Difficulty Leveling"].map((feat) => (
                                                <div key={feat} className="flex items-center gap-3">
                                                    <span className="material-icons-outlined text-indigo-400 text-sm">check_circle</span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100/60">{feat}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-8 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={generating || aiDifficulties.length === 0}
                                className="px-12 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                            >
                                {generating ? "Synthesizing Modules..." : "Execute Neural Synthesis"}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Draft Questions List (Staging Area) */}
            {draftQuestions.length > 0 && (
                <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center justify-between bg-slate-900 p-8 rounded-[2rem] shadow-2xl shadow-slate-200">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]"></div>
                                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Awaiting Verification</h3>
                            </div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight leading-none">Module Staging Area</h2>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
                                <input
                                    type="checkbox"
                                    id="select-all"
                                    className="w-4 h-4 bg-slate-900 border-slate-700 rounded text-indigo-500 focus:ring-0 cursor-pointer"
                                    checked={selectedDrafts.length === draftQuestions.length && draftQuestions.length > 0}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                />
                                <label htmlFor="select-all" className="ml-3 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer select-none">Select All Protocol Units</label>
                            </div>

                            {selectedDrafts.length > 0 && (
                                <div className="flex items-center gap-3 h-10 animate-in fade-in slide-in-from-right-4">
                                    <button
                                        onClick={handleBulkDiscard}
                                        disabled={isSavingBulk}
                                        className="h-full px-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                                    >
                                        Purge Selected
                                    </button>
                                    <button
                                        onClick={handleBulkSave}
                                        disabled={isSavingBulk}
                                        className="h-full px-6 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                                    >
                                        {isSavingBulk ? (
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <span className="material-icons-outlined text-sm">verified</span>
                                        )}
                                        {isSavingBulk ? "Processing..." : "Deploy Selective"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {draftQuestions.map((draft) => (
                            <div key={draft.tempId} className={`bg-white border rounded-[2rem] p-8 transition-all duration-500 group relative ${selectedDrafts.includes(draft.tempId) ? 'border-indigo-200 ring-2 ring-indigo-50 shadow-2xl shadow-indigo-100' : 'border-slate-100 hover:border-slate-200 hover:shadow-xl'}`}>
                                <div className="flex gap-6">
                                    <div className="pt-2">
                                        <button
                                            onClick={() => toggleSelectDraft(draft.tempId)}
                                            className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${selectedDrafts.includes(draft.tempId) ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 group-hover:border-slate-300'}`}
                                        >
                                            {selectedDrafts.includes(draft.tempId) && <span className="material-icons-outlined text-sm">check</span>}
                                        </button>
                                    </div>
                                    <div className="flex-1 space-y-8">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-wrap gap-3">
                                                <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500">
                                                    CODING
                                                </span>
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${draft.difficulty === 'HARD' ? 'bg-rose-50 text-rose-500' :
                                                    draft.difficulty === 'MEDIUM' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'
                                                    }`}>
                                                    {draft.difficulty}
                                                </span>
                                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                                                    {draft.topic}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleSaveDraft(draft)}
                                                    className="w-10 h-10 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all"
                                                    title="Quick Deploy"
                                                >
                                                    <span className="material-icons-outlined text-base">check</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDiscardDraft(draft.tempId)}
                                                    className="w-10 h-10 bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all"
                                                    title="Purge"
                                                >
                                                    <span className="material-icons-outlined text-base">close</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Problem Description</label>
                                                <textarea
                                                    value={draft.content.question}
                                                    onChange={(e) => handleUpdateDraft(draft.tempId, "content", e.target.value, "question")}
                                                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/10 min-h-[100px]"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Initial Code (Python)</label>
                                                <textarea
                                                    value={typeof draft.content.initial_code === 'string' ? draft.content.initial_code : draft.content.initial_code?.python || ""}
                                                    onChange={(e) => handleUpdateCode(draft.tempId, e.target.value)}
                                                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-xs font-mono font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/10 min-h-[140px]"
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block">Test Case Scenarios</label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {(draft.content.test_cases || []).map((tc: any, tcIdx: number) => (
                                                        <div key={tcIdx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-3 relative group/tc">
                                                            <div className="space-y-1">
                                                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Input</span>
                                                                <input
                                                                    type="text"
                                                                    value={tc.input}
                                                                    onChange={(e) => handleUpdateTestCase(draft.tempId, tcIdx, 'input', e.target.value)}
                                                                    className="w-full bg-white border-none rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/5"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Output</span>
                                                                <input
                                                                    type="text"
                                                                    value={tc.output}
                                                                    onChange={(e) => handleUpdateTestCase(draft.tempId, tcIdx, 'output', e.target.value)}
                                                                    className="w-full bg-white border-none rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/5"
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block">Constraints</label>
                                                    <button type="button" onClick={() => handleAddConstraint(draft.tempId)} className="text-[9px] font-bold text-indigo-500 hover:text-indigo-600 transition-colors">+ Add Constraint</button>
                                                </div>
                                                <div className="space-y-2">
                                                    {(draft.content.constraints || []).map((constraint: string, cIdx: number) => (
                                                        <div key={cIdx} className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={constraint}
                                                                onChange={(e) => handleUpdateConstraints(draft.tempId, cIdx, e.target.value)}
                                                                className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/5 placeholder:text-slate-300"
                                                                placeholder="e.g. 1 <= N <= 10^5"
                                                            />
                                                            <button type="button" onClick={() => handleRemoveConstraint(draft.tempId, cIdx)} className="text-slate-300 hover:text-rose-500"><span className="material-icons text-sm">close</span></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block">Examples</label>
                                                    <button type="button" onClick={() => handleAddExample(draft.tempId)} className="text-[9px] font-bold text-indigo-500 hover:text-indigo-600 transition-colors">+ Add Example</button>
                                                </div>
                                                <div className="space-y-4">
                                                    {(draft.content.examples || []).map((ex: any, exIdx: number) => (
                                                        <div key={exIdx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative group/ex">
                                                            <button type="button" onClick={() => handleRemoveExample(draft.tempId, exIdx)} className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover/ex:opacity-100 transition-opacity"><span className="material-icons text-sm">close</span></button>
                                                            <div className="space-y-3">
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div>
                                                                        <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest block mb-1">Input</label>
                                                                        <input type="text" value={ex.input} onChange={(e) => handleUpdateExamples(draft.tempId, exIdx, 'input', e.target.value)} className="w-full bg-white border-none rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/5" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest block mb-1">Output</label>
                                                                        <input type="text" value={ex.output} onChange={(e) => handleUpdateExamples(draft.tempId, exIdx, 'output', e.target.value)} className="w-full bg-white border-none rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/5" />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest block mb-1">Explanation</label>
                                                                    <input type="text" value={ex.explanation} onChange={(e) => handleUpdateExamples(draft.tempId, exIdx, 'explanation', e.target.value)} className="w-full bg-white border-none rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/5" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Time Limit (seconds)</label>
                                                <input
                                                    type="number"
                                                    value={draft.content.time_limit || 2}
                                                    onChange={(e) => handleUpdateDraft(draft.tempId, "content", parseInt(e.target.value), "time_limit")}
                                                    className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/5"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Allowed Protocol Languages</label>
                                                <div className="flex flex-wrap gap-4 items-center">
                                                    {["python", "java", "cpp", "javascript"].map((lang: string) => (
                                                        <label key={lang} className="flex items-center gap-3 cursor-pointer group">
                                                            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${draft.content.allowed_languages?.includes(lang) ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-300 group-hover:border-slate-300'}`}>
                                                                {draft.content.allowed_languages?.includes(lang) && <span className="material-icons text-sm">check</span>}
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-900 transition-colors">{lang}</span>
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={draft.content.allowed_languages?.includes(lang)}
                                                                onChange={(e) => {
                                                                    const current = draft.content.allowed_languages || ["python", "java", "cpp", "javascript"];
                                                                    const next = e.target.checked
                                                                        ? [...current, lang]
                                                                        : current.filter((l: string) => l !== lang);
                                                                    handleUpdateDraft(draft.tempId, "content", next, "allowed_languages");
                                                                }}
                                                            />
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
