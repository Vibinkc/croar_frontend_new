"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/utils/api";
import { useDivision } from "@/context/DivisionContext";
import AIGenerationOverlay from "@/components/ui/AIGenerationOverlay";

interface Question {
    id: number;
    type: string;
    topic: string;
    difficulty: string;
    content: {
        question: string;
    };
}

export default function CreateQuestionPage() {
    const { selectedBatch } = useDivision();
    const router = useRouter();
    const searchParams = useSearchParams();
    const departmentId = searchParams.get("department_id");
    const [activeTab, setActiveTab] = useState("MANUAL"); // MANUAL, BULK, AI

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab && ["MANUAL", "BULK", "AI"].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);
    const [availableTopics, setAvailableTopics] = useState<string[]>([]);

    // Recent Questions State
    const [questions, setQuestions] = useState<Question[]>([]);

    // Manual State
    const [type, setType] = useState("APTITUDE");
    const [topic, setTopic] = useState("");
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

    // Bulk State
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    // AI State
    const [aiCount, setAiCount] = useState(5);
    const [generating, setGenerating] = useState(false);

    // Draft State
    const [draftQuestions, setDraftQuestions] = useState<any[]>([]);

    const [aiDifficulties, setAiDifficulties] = useState<string[]>(["MEDIUM"]);
    const [selectedDrafts, setSelectedDrafts] = useState<number[]>([]);
    const [isSavingBulk, setIsSavingBulk] = useState(false);

    const handleManualPreview = () => {
        if (!questionText.trim() || !optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
            return alert("Please fill in the question and all four options before previewing.");
        }
        const finalTopic = topic === "Other" ? customTopic : topic;

        const newDraft = {
            tempId: Date.now(),
            type: "APTITUDE",
            topic: finalTopic,
            difficulty,
            content: {
                question: questionText,
                options: { A: optionA, B: optionB, C: optionC, D: optionD }
            },
            correct_answer: {
                answer: correctOption,
                explanation: explanation
            }
        };

        setDraftQuestions(prev => [...prev, newDraft]);

        // Reset form
        setQuestionText("");
        setOptionA("");
        setOptionB("");
        setOptionC("");
        setOptionD("");
        setExplanation("");
        alert("Question added to drafts. Review below.");
    };


    useEffect(() => {
        fetchTopics();
        fetchRecentQuestions();
    }, []);

    const fetchTopics = async () => {
        try {
            // Filter by APTITUDE type
            const res = await apiClient.get(`/api/v1/content/questions/topics?type=APTITUDE`);
            if (res.ok) {
                const topics = await res.json();
                // Merge with defaults and remove duplicates, filtering out "Other" to avoid conflicts
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

    // Existing fetchRecentQuestions...
    const fetchRecentQuestions = async () => {
        try {
            // Fetch APTITUDE questions specifically, or generic if mixed. 
            // User context is Aptitude section, so let's try to stick to that or general.
            // Since AI can create CODING too, let's fetch all then filter/sort client side for "Recent" across all types 
            // OR just Aptitude? The endpoint has type filter. 
            // Let's fetch ALL types to show what was just created regardless of type (since AI can do both).
            const res = await apiClient.get(`/api/v1/content/questions`);
            if (res.ok) {
                const data = await res.json();
                // Sort by ID desc (simulating recent first) and take top 5
                const sorted = data.sort((a: Question, b: Question) => b.id - a.id).slice(0, 5);
                setQuestions(sorted);
            }
        } catch (e) {
            console.error("Failed to fetch recent questions", e);
        }
    };

    // ... (rest of code)

    const handleManualSubmit = async (e: React.FormEvent, addAnother: boolean = false) => {
        e.preventDefault();

        // Basic Validation
        if (!questionText.trim() || !optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
            return alert("Please fill in the question and all four options.");
        }
        if (topic === "Other" && !customTopic.trim()) {
            return alert("Please enter a custom topic.");
        }

        const finalTopic = topic === "Other" ? customTopic : topic;

        // Force APTITUDE type since we removed the selector
        const payload = {
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
            department_id: departmentId ? parseInt(departmentId) : null,
            batch: selectedBatch
        };

        const res = await apiClient.post(`/api/v1/content/questions`, payload);

        if (res.ok) {
            if (addAnother) {
                // Clear form but keep topic/difficulty
                setQuestionText("");
                setOptionA("");
                setOptionB("");
                setOptionC("");
                setOptionD("");
                setCorrectOption("A");
                setExplanation("");
                alert("Question saved! You can add another one.");
                fetchRecentQuestions();
            } else {
                router.push("/admin/aptitude");
            }
        } else {
            alert("Failed to create question");
        }
    };

    const handleBulkUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return alert("Please select a file");

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("preview", "true"); // Always preview first
        if (departmentId) formData.append("department_id", departmentId);
        if (selectedBatch) formData.append("batch", selectedBatch);

        try {
            // Use apiClient which handles FormData and headers automatically
            const res = await apiClient.post(`/api/v1/content/questions/bulk-upload`, formData);

            if (res.ok) {
                const data = await res.json();
                if (data.questions) {
                    const drafts = data.questions.map((q: any, idx: number) => ({ ...q, tempId: Date.now() + idx }));
                    setDraftQuestions(drafts);
                } else {
                    alert(data.message);
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

    // ...

    const handleAIGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setGenerating(true);
        setDraftQuestions([]);
        setSelectedDrafts([]);

        const finalTopic = topic === "Other" ? customTopic : topic;

        try {
            const res = await apiClient.post(`/api/v1/content/questions/ai-generate`, {
                topic: finalTopic,
                difficulty: aiDifficulties,
                count: aiCount,
                type: type,
                preview: true, // Enable preview mode
                department_id: departmentId ? parseInt(departmentId) : null,
                batch: selectedBatch
            });

            if (res.ok) {
                const data = await res.json();
                if (data.questions) {
                    // Add temporary frontend IDs for list management
                    const drafts = data.questions.map((q: any, idx: number) => ({ ...q, tempId: Date.now() + idx }));
                    setDraftQuestions(drafts);
                    alert(`Generated ${drafts.length} draft questions. Please review and save them.`);
                } else {
                    alert("No questions returned.");
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

    const handleSaveDraft = async (draft: any) => {
        // Validation for Aptitude
        if (draft.type === "APTITUDE") {
            const { question, options } = draft.content;
            if (!question?.trim() || !options?.A?.trim() || !options?.B?.trim() || !options?.C?.trim() || !options?.D?.trim()) {
                return alert("Cannot save: Question or options are empty.");
            }
        }
        // Validation for Coding
        if (draft.type === "CODING") {
            if (!draft.content?.question?.trim()) {
                return alert("Cannot save: Problem description is empty.");
            }
        }

        try {
            const res = await apiClient.post(`/api/v1/content/questions`, {
                type: draft.type,
                topic: draft.topic,
                difficulty: draft.difficulty,
                content: draft.content,
                correct_answer: draft.correct_answer,
                department_id: departmentId ? parseInt(departmentId) : null,
                batch: selectedBatch
            });

            if (res.ok) {
                // Remove from drafts
                setDraftQuestions(prev => prev.filter(q => q.tempId !== draft.tempId));
                fetchRecentQuestions();
                // Optional: show toast/notification
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
                if (nestedField) {
                    return { ...q, [field]: { ...q[field], [nestedField]: value } };
                }
                return { ...q, [field]: value };
            }
            return q;
        }));
    };

    const toggleSelectDraft = (tempId: number) => {
        setSelectedDrafts(prev =>
            prev.includes(tempId) ? prev.filter(id => id !== tempId) : [...prev, tempId]
        );
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedDrafts(draftQuestions.map(q => q.tempId));
        } else {
            setSelectedDrafts([]);
        }
    };

    const handleBulkSave = async () => {
        if (selectedDrafts.length === 0) return;
        setIsSavingBulk(true);
        let successCount = 0;
        let failCount = 0;

        const draftsToSave = draftQuestions.filter(q => selectedDrafts.includes(q.tempId));

        for (const draft of draftsToSave) {
            // Validation
            if (draft.type === "APTITUDE") {
                const { question, options } = draft.content;
                if (!question?.trim() || !options?.A?.trim() || !options?.B?.trim() || !options?.C?.trim() || !options?.D?.trim()) {
                    failCount++;
                    continue;
                }
            }
            if (draft.type === "CODING") {
                if (!draft.content?.question?.trim()) {
                    failCount++;
                    continue;
                }
            }

            try {
                const res = await apiClient.post(`/api/v1/content/questions`, {
                    type: draft.type,
                    topic: draft.topic,
                    difficulty: draft.difficulty,
                    content: draft.content,
                    correct_answer: draft.correct_answer,
                    department_id: departmentId ? parseInt(departmentId) : null,
                    batch: selectedBatch
                });

                if (res.ok) {
                    successCount++;
                    setDraftQuestions(prev => prev.filter(q => q.tempId !== draft.tempId));
                    setSelectedDrafts(prev => prev.filter(id => id !== draft.tempId));
                } else {
                    failCount++;
                }
            } catch (e) {
                failCount++;
            }
        }

        fetchRecentQuestions();
        setIsSavingBulk(false);
        alert(`Bulk save complete: ${successCount} saved, ${failCount} failed.`);
    };

    const handleBulkDiscard = () => {
        if (selectedDrafts.length === 0) return;
        if (!confirm(`Discard ${selectedDrafts.length} selected drafts?`)) return;

        setDraftQuestions(prev => prev.filter(q => !selectedDrafts.includes(q.tempId)));
        setSelectedDrafts([]);
    };

    // Helper to update options specifically
    const handleUpdateOption = (tempId: number, key: string, value: string) => {
        setDraftQuestions(prev => prev.map(q => {
            if (q.tempId === tempId) {
                return {
                    ...q,
                    content: {
                        ...q.content,
                        options: { ...q.content.options, [key]: value }
                    }
                };
            }
            return q;
        }));
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-32 px-6 pt-4">
            <AIGenerationOverlay isOpen={generating} title="Generating Aptitude Drafts" />

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
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Inject Protocol</h1>
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
                                router.replace(`/admin/aptitude/create?${params.toString()}`);
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
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Protocol Question Content
                            </label>
                            <textarea
                                value={questionText}
                                onChange={(e) => setQuestionText(e.target.value)}
                                required
                                placeholder="Enter the question text here..."
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all min-h-[80px]"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {['A', 'B', 'C', 'D'].map((opt) => (
                                <div key={opt} className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Option {opt}</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={opt === 'A' ? optionA : opt === 'B' ? optionB : opt === 'C' ? optionC : optionD}
                                            onChange={(e) => {
                                                if (opt === 'A') setOptionA(e.target.value);
                                                else if (opt === 'B') setOptionB(e.target.value);
                                                else if (opt === 'C') setOptionC(e.target.value);
                                                else setOptionD(e.target.value);
                                            }}
                                            required
                                            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all h-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setCorrectOption(opt)}
                                            className={`absolute inset-y-2 right-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${correctOption === opt
                                                ? "bg-emerald-500 text-white shadow-lg"
                                                : "bg-white text-slate-300 hover:text-slate-500"
                                                }`}
                                        >
                                            {correctOption === opt ? "CORRECT" : "SET CORRECT"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Logic / Explanation</label>
                            <input
                                type="text"
                                value={explanation}
                                onChange={(e) => setExplanation(e.target.value)}
                                placeholder="Provide the reasoning behind the correct answer..."
                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all h-10"
                            />
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
                                Stage for Review
                            </button>
                            <button
                                type="submit"
                                className="px-10 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all flex items-center gap-3 active:scale-95"
                            >
                                <span className="material-icons-outlined text-sm">rocket_launch</span>
                                Deploy Protocol
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === "BULK" && (
                    <form onSubmit={handleBulkUpload} className="space-y-8">
                        <div className="group relative border-4 border-dashed border-slate-100 rounded-[2.5rem] p-16 text-center bg-slate-50/30 hover:bg-white hover:border-indigo-200 transition-all duration-500 overflow-hidden">
                            <div className="relative z-10 space-y-4">
                                <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                                    <span className="material-icons-outlined text-4xl text-slate-400">cloud_upload</span>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="file-upload" className="cursor-pointer">
                                        <p className="text-lg font-black text-slate-900 uppercase tracking-tight">Stream Data Pack</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Excel, CSV, or XLSM (Max 10MB)</p>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".xlsx, .xls, .csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                                    </label>
                                </div>
                                {file && (
                                    <div className="mt-6 flex items-center justify-center gap-3 bg-indigo-50 text-indigo-600 py-3 px-6 rounded-2xl border border-indigo-100 animate-in zoom-in-95">
                                        <span className="material-icons-outlined text-base">insert_drive_file</span>
                                        <span className="text-xs font-bold">{file.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end pt-8 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={uploading || !file}
                                className="px-10 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                            >
                                {uploading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        <span>Ingesting...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-icons-outlined text-sm">storage</span>
                                        <span>Initialize Data Stream</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="material-icons-outlined text-slate-400">info</span>
                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Protocol Mapping Standards</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[
                                    { k: "type", v: "APTITUDE | CODING" },
                                    { k: "topic", v: "Subject Classification" },
                                    { k: "difficulty", v: "EASY | MEDIUM | HARD" },
                                    { k: "question", v: "Core Protocol Content" },
                                    { k: "options", v: "A, B, C, D Fields" },
                                    { k: "correct", v: "A | B | C | D" }
                                ].map((guide) => (
                                    <div key={guide.k} className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{guide.k}</span>
                                        <span className="text-xs font-bold text-slate-700">{guide.v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </form>
                )}

                {activeTab === "AI" && (
                    <div className="space-y-12">
                        <form onSubmit={handleAIGenerate} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Domain</label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all h-14"
                                    >
                                        <option value="APTITUDE">Aptitude Synthesis (MCQ)</option>
                                        <option value="CODING">Logic Synthesis (Coding)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Count</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={aiCount}
                                        onChange={(e) => setAiCount(Number(e.target.value))}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all h-14"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Sector</label>
                                    <div className="flex flex-col gap-3">
                                        <select
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all h-14"
                                        >
                                            {availableTopics.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                            <option value="Other">Custom Sector</option>
                                        </select>
                                        {topic === "Other" && (
                                            <input
                                                type="text"
                                                value={customTopic}
                                                onChange={(e) => setCustomTopic(e.target.value)}
                                                placeholder="Enter sector name"
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all h-14"
                                                required
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Neural Complexity Synthesis</label>
                                <div className="flex justify-center gap-6">
                                    {["EASY", "MEDIUM", "HARD"].map((diff) => (
                                        <label key={diff} className="relative flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                value={diff}
                                                checked={aiDifficulties.includes(diff)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setAiDifficulties([...aiDifficulties, diff]);
                                                    else setAiDifficulties(aiDifficulties.filter((d) => d !== diff));
                                                }}
                                                className="sr-only"
                                            />
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border ${aiDifficulties.includes(diff) ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-300'}`}>
                                                <span className="material-icons-outlined text-xl">psychology</span>
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${aiDifficulties.includes(diff) ? 'text-slate-900' : 'text-slate-400'}`}>
                                                {diff}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-indigo-50/50 p-8 rounded-[2.5rem] border border-indigo-100 flex items-center gap-6">
                                <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center shrink-0">
                                    <span className="material-icons-outlined text-indigo-500 text-3xl">lightbulb</span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">Neural Engine Intelligence</h4>
                                    <p className="text-[11px] font-bold text-slate-500 leading-relaxed max-w-2xl">
                                        Advanced synthesis will generate unique protocol entries. Consumes system credits. Expected latency: 15-30s. All outputs are staged as drafts for review.
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-8 border-t border-slate-100">
                                <button
                                    type="submit"
                                    disabled={generating || aiDifficulties.length === 0}
                                    className="px-10 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                                >
                                    {generating ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            <span>Synthesizing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-icons-outlined text-sm">auto_awesome</span>
                                            <span>Initialize Synthesis</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Draft Questions List */}
            {draftQuestions.length > 0 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                                <span className="material-icons-outlined text-2xl">fact_check</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight uppercase">Staging Area</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Pending Review: {draftQuestions.length} Protocols</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBulkDiscard}
                                disabled={selectedDrafts.length === 0}
                                className="px-6 py-3.5 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all disabled:opacity-30 flex items-center gap-3"
                            >
                                <span className="material-icons-outlined text-base">delete_sweep</span>
                                Purge Staged ({selectedDrafts.length})
                            </button>

                            <button
                                onClick={handleBulkSave}
                                disabled={selectedDrafts.length === 0 || isSavingBulk}
                                className="px-8 py-3.5 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] hover:bg-emerald-600 shadow-xl shadow-emerald-100 transition-all disabled:opacity-50 flex items-center gap-3 active:scale-95"
                            >
                                {isSavingBulk ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Deploying...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-icons-outlined text-base">cloud_done</span>
                                        <span>Deploy Selected ({selectedDrafts.length})</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {draftQuestions.map((draft, index) => (
                            <div key={draft.tempId || index} className={`bg-white border rounded-[2rem] p-8 transition-all duration-500 group relative ${selectedDrafts.includes(draft.tempId) ? 'border-indigo-200 ring-2 ring-indigo-50 shadow-2xl shadow-indigo-100' : 'border-slate-100 hover:border-slate-200 hover:shadow-xl'}`}>
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
                                                    {draft.type}
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
                                                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Question Text</label>
                                                <textarea
                                                    value={draft.content.question}
                                                    onChange={(e) => handleUpdateDraft(draft.tempId, "content", e.target.value, "question")}
                                                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/10 min-h-[80px]"
                                                />
                                            </div>

                                            {draft.type === "APTITUDE" && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {['A', 'B', 'C', 'D'].map(opt => (
                                                        <div key={opt} className="relative group/opt">
                                                            <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${draft.correct_answer.answer === opt ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-50 group-hover/opt:border-slate-200'}`}>
                                                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${draft.correct_answer.answer === opt ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                                                                    {opt}
                                                                </span>
                                                                <input
                                                                    type="text"
                                                                    value={draft.content.options[opt]}
                                                                    onChange={(e) => handleUpdateOption(draft.tempId, opt, e.target.value)}
                                                                    className="flex-1 bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0"
                                                                />
                                                                <button
                                                                    onClick={() => handleUpdateDraft(draft.tempId, "correct_answer", opt, "answer")}
                                                                    className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${draft.correct_answer.answer === opt ? 'bg-emerald-500 text-white' : 'opacity-0 group-hover/opt:opacity-100 bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                                >
                                                                    Correct
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
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
