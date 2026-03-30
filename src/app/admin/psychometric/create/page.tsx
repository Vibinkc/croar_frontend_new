"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/utils/api";
import { useDivision } from "@/context/DivisionContext";
import AIGenerationOverlay from "@/components/ui/AIGenerationOverlay";

export default function CreatePsychometricPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const departmentId = searchParams.get("department_id");
    const { selectedBatch } = useDivision();

    // Configuration
    const [testType, setTestType] = useState<"SURVEY" | "SPOT_ON" | "FREE_TRANSPORT" | "NUMERO" | "LABYRINTH" | "EMOTIONAL_INTELLIGENCE" | "PIPELINE">("SURVEY");
    const [creationMode, setCreationMode] = useState<"AI" | "CUSTOM">("AI");
    const [trait, setTrait] = useState("");
    const [questionCount, setQuestionCount] = useState(10);
    const [generating, setGenerating] = useState(false);

    // Free Transport Config
    const [shipCount, setShipCount] = useState(5);
    const [minCapacity, setMinCapacity] = useState(20);
    const [maxCapacity, setMaxCapacity] = useState(80);

    // Review & Edit
    const [questions, setQuestions] = useState<any[]>([]);
    const [generatedTitle, setGeneratedTitle] = useState("");
    const [generatedDescription, setGeneratedDescription] = useState("");
    const [saving, setSaving] = useState(false);

    const handleGenerate = async () => {
        if (creationMode === "AI") {
            if (!trait && testType === 'SURVEY') return; // Trait needed for Survey
        }

        if (testType === 'FREE_TRANSPORT' && creationMode === 'CUSTOM') {
            // Generate tiered fleet based on specs
            const newShips = Array.from({ length: shipCount }).map((_, i) => {
                const rand = Math.random();
                let type: 'BROWN' | 'RED' | 'BLUE' = 'BROWN';
                let min = 4, max = 6;

                // Simple distribution: 40% Brown, 40% Red, 20% Blue
                // Or maybe strictly random? Let's do weighted for variety.
                if (rand > 0.7) {
                    type = 'BLUE';
                    min = 8; max = 12;
                } else if (rand > 0.3) {
                    type = 'RED';
                    min = 6; max = 9;
                }

                return {
                    id: i + 1,
                    text: `Ship ${i + 1}`,
                    file_type: type, // Using file_type to store ship color/type to allow simple schema compat
                    capacity: Math.floor(Math.random() * (max - min + 1)) + min,
                    risk_factor: 1.0
                };
            });
            setQuestions(newShips);
            setGeneratedTitle("Shipping Risk Assessment");
            setGeneratedDescription("Maximize cargo delivery without sinking ships.");
            return;
        }

        setGenerating(true);
        try {
            let url = "";
            if (testType === "SURVEY") {
                url = `/api/v1/psychometric/generate?trait=${trait}&count=${questionCount}`;
            } else if (testType === "NUMERO") {
                url = `/api/v1/psychometric/generate-numero?count=${questionCount}`;
            } else if (testType === "LABYRINTH") {
                url = `/api/v1/psychometric/generate-labyrinth?count=${questionCount}`;
            } else if (testType === "EMOTIONAL_INTELLIGENCE") {
                url = `/api/v1/psychometric/generate-eq?count=${questionCount}`;
            } else if (testType === "PIPELINE") {
                url = `/api/v1/psychometric/generate-pipeline?count=${questionCount}`;
            } else {
                url = `/api/v1/psychometric/generate-spot-on?count=${questionCount}`;
            }

            const res = await apiClient.post(url, {});

            if (!res.ok) throw new Error("Generation Failed");
            const data = await res.json();

            setGeneratedTitle(data.title);
            setGeneratedDescription(data.description);
            setQuestions(data.questions);

        } catch (e) {
            console.error(e);
            alert("Failed to generate protocol");
        } finally {
            setGenerating(false);
        }
    };

    const handleQuestionChange = (index: number, field: string, value: any) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };
        setQuestions(updated);
    };

    const handleSpotOnOptionChange = (qIndex: number, optIndex: number, field: string, value: any) => {
        const updated = [...questions];
        // Ensure options array exists
        if (!updated[qIndex].options) updated[qIndex].options = [{}, {}, {}, {}];

        updated[qIndex].options[optIndex] = { ...updated[qIndex].options[optIndex], [field]: value };
        setQuestions(updated);
    };

    const handleFileUpload = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await apiClient.post("/api/v1/common/upload", formData);
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        return data.url;
    };

    const handleImageUpload = async (file: File, qIndex: number, type: 'target' | 'option', optIndex?: number) => {
        try {
            const url = await handleFileUpload(file);

            if (type === 'target') {
                const updated = [...questions];
                updated[qIndex] = {
                    ...updated[qIndex],
                    target: {
                        ...(updated[qIndex].target || {}),
                        imageUrl: url
                    }
                };
                setQuestions(updated);
            } else if (type === 'option' && typeof optIndex === 'number') {
                const updated = [...questions];
                if (!updated[qIndex].options) updated[qIndex].options = [{}, {}, {}, {}];
                updated[qIndex].options[optIndex] = { imageUrl: url };
                setQuestions(updated);
            }
        } catch (e) {
            console.error(e);
            alert("Upload failed");
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                title: generatedTitle || (testType === 'SPOT_ON' ? "Custom Spot On" : testType === 'FREE_TRANSPORT' ? "Shipping Risk" : testType === "NUMERO" ? "Numero Challenge" : "Custom Survey"),
                description: generatedDescription || "Manually created assessment",
                trait: trait || (testType === 'SPOT_ON' ? "Visual Attention" : testType === 'FREE_TRANSPORT' ? "Risk Appetite" : testType === "NUMERO" ? "Numerical Reasoning" : "General"),
                test_type: testType,
                questions: questions,
                department_id: departmentId ? parseInt(departmentId) : null,
                batch: selectedBatch || null
            };

            const res = await apiClient.post(`/api/v1/psychometric/`, payload);

            if (res.ok) {
                router.push("/admin/psychometric");
            }
        } catch (e) {
            console.error(e);
            alert("Failed to save protocol");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 px-6 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <AIGenerationOverlay isOpen={generating} title="Designing Protocol" />

            {/* Premium Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        className="w-14 h-14 rounded-2xl bg-white border border-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all duration-500 shadow-sm hover:shadow-xl active:scale-95 group"
                    >
                        <span className="material-icons-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Knowledge Engine v2.0</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Psychometric_Construct</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Initialize Protocol</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">System_Ready</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Panel: Configuration */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.04)] overflow-hidden">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                <span className="material-icons-outlined text-indigo-500">tune</span>
                                Protocol Configuration
                            </h2>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Test Type Selection */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Assessment Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'SURVEY', label: 'Survey', icon: 'poll' },
                                        { id: 'SPOT_ON', label: 'Attention', icon: 'extension' },
                                        { id: 'FREE_TRANSPORT', label: 'Risk', icon: 'sailing' },
                                        { id: 'NUMERO', label: 'Numero', icon: 'calculate' },
                                        { id: 'LABYRINTH', label: 'Spatial', icon: 'explore' },
                                        { id: 'EMOTIONAL_INTELLIGENCE', label: 'Emotional', icon: 'psychology' },
                                        { id: 'PIPELINE', label: 'Pipeline', icon: 'route' }
                                    ].map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => {
                                                setTestType(type.id as any);
                                                if (type.id === 'LABYRINTH') {
                                                    setCreationMode('CUSTOM');
                                                    setQuestions([]);
                                                } else if (type.id === 'PIPELINE') {
                                                    setCreationMode('AI');
                                                    setQuestionCount(1);
                                                    setQuestions([]);
                                                }
                                            }}
                                            className={`group relative p-4 rounded-2xl border transition-all duration-300 text-left overflow-hidden ${testType === type.id
                                                ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200'
                                                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="relative z-10 flex flex-col gap-2">
                                                <span className={`material-icons-outlined text-xl ${testType === type.id ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                                    {type.icon}
                                                </span>
                                                <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Creation Mode Selection */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Creation Method</label>
                                <div className="flex gap-2 p-1.5 bg-slate-50 border border-slate-100 rounded-2xl">
                                    {[
                                        { id: 'AI', label: 'AI Architect' },
                                        { id: 'CUSTOM', label: 'Manual Design' }
                                    ].map((mode) => (
                                        <button
                                            key={mode.id}
                                            onClick={() => {
                                                setCreationMode(mode.id as any);
                                                if (mode.id === 'CUSTOM') {
                                                    setQuestions([]);
                                                    setGeneratedTitle("");
                                                    setGeneratedDescription("");
                                                }
                                            }}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${creationMode === mode.id
                                                ? 'bg-white text-slate-900 shadow-lg shadow-slate-100 ring-1 ring-black/5'
                                                : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                        >
                                            {mode.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {creationMode === 'AI' && (
                                <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
                                    {testType === 'SURVEY' && (
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Target Trait / Topic</label>
                                            <input
                                                type="text"
                                                value={trait}
                                                onChange={(e) => setTrait(e.target.value)}
                                                placeholder="e.g. Resilience, Leadership..."
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                                            />
                                        </div>
                                    )}

                                    {testType !== 'PIPELINE' && (
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
                                                {testType === 'LABYRINTH' ? 'Level Count' : testType === 'FREE_TRANSPORT' ? 'Ship Count' : 'Question Count'}
                                            </label>
                                            <input
                                                type="number"
                                                value={questionCount}
                                                onChange={(e) => setQuestionCount(Number(e.target.value))}
                                                min={1}
                                                max={20}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            />
                                        </div>
                                    )}

                                    <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100/50">
                                        <div className="flex items-start gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                                <span className="material-icons-outlined text-sm">auto_awesome</span>
                                            </div>
                                            <div>
                                                <h3 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1">AI Construction</h3>
                                                <p className="text-[10px] text-indigo-700/70 font-medium leading-relaxed">
                                                    {testType === 'SURVEY'
                                                        ? `Generates weighted indicators for ${trait || "..."}.`
                                                        : testType === 'NUMERO'
                                                            ? `Generates ${questionCount * 2} arithmetic and pattern problems.`
                                                            : testType === 'LABYRINTH'
                                                                ? `Generates ${questionCount} laser-solving maps.`
                                                                : testType === 'PIPELINE'
                                                                    ? `Generates ${questionCount} system restoration pipe puzzles.`
                                                                    : `Generates ${questionCount} psychometric scenarios.`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleGenerate}
                                        disabled={generating || (testType === 'SURVEY' && !trait)}
                                        className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-slate-200 hover:shadow-slate-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95"
                                    >
                                        <span className={`material-icons-outlined text-lg ${generating ? 'animate-spin' : ''}`}>
                                            {generating ? 'sync' : 'bolt'}
                                        </span>
                                        {generating ? 'Architecting...' : 'Generate Protocol'}
                                    </button>
                                </div>
                            )}

                            {creationMode === 'CUSTOM' && (
                                <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
                                    {testType === 'FREE_TRANSPORT' && (
                                        <div className="space-y-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Fleet Size</label>
                                                <input
                                                    type="number"
                                                    value={shipCount}
                                                    onChange={(e) => setShipCount(Number(e.target.value))}
                                                    className="w-full px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none"
                                                />
                                            </div>

                                            <button
                                                onClick={handleGenerate}
                                                className="w-full py-4 bg-white text-slate-900 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-sm"
                                            >
                                                Generate Fleet
                                            </button>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Protocol Title</label>
                                        <input
                                            type="text"
                                            value={generatedTitle}
                                            onChange={(e) => setGeneratedTitle(e.target.value)}
                                            placeholder="e.g. Leadership Assessment v1"
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>

                                    <button
                                        onClick={() => {
                                            if (testType === 'SPOT_ON') {
                                                setQuestions([...questions, {
                                                    id: Date.now(),
                                                    target: {},
                                                    options: [{}, {}, {}, {}],
                                                    correct_index: 0
                                                }]);
                                            } else if (testType === 'FREE_TRANSPORT') {
                                                setQuestions([...questions, {
                                                    id: Date.now(),
                                                    text: `Ship ${questions.length + 1}`,
                                                    capacity: 50,
                                                    file_type: 'BROWN',
                                                    risk_factor: 1.0
                                                }]);
                                            } else if (testType === 'EMOTIONAL_INTELLIGENCE') {
                                                setQuestions([...questions, {
                                                    id: Date.now(),
                                                    text: "",
                                                    target: {
                                                        emotion: "",
                                                        visual_cue: ""
                                                    },
                                                    options: [
                                                        { option: "", index: 0 },
                                                        { option: "", index: 1 },
                                                        { option: "", index: 2 },
                                                        { option: "", index: 3 }
                                                    ],
                                                    correct_index: 0
                                                }]);
                                            } else if (testType === 'PIPELINE') {
                                                setQuestions([...questions, {
                                                    id: Date.now(),
                                                    text: "Repair the conduit connection",
                                                    grid: Array.from({ length: 36 }).map((_, i) => ({
                                                        r: Math.floor(i / 6),
                                                        c: i % 6,
                                                        type: 'EMPTY',
                                                        rotation: 0,
                                                        isFixed: false,
                                                        nodeType: 'PIPE'
                                                    })),
                                                    rows: 6,
                                                    cols: 6
                                                }]);
                                            } else {
                                                setQuestions([...questions, { text: "", weight: 1.0 }]);
                                            }
                                        }}
                                        className="w-full py-4 bg-white text-slate-900 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3"
                                    >
                                        <span className="material-icons-outlined text-lg">add_circle_outline</span>
                                        Add Node
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Protocol Overview */}
                <div className="lg:col-span-8 space-y-6">
                    {questions.length > 0 ? (
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col min-h-[600px]">
                            <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center sticky top-0 z-10 backdrop-blur-xl">
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                    <span className="material-icons-outlined text-indigo-500">wysiwyg</span>
                                    {creationMode === 'AI' ? 'Construct Verification' : 'Protocol Assembler'}
                                </h2>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setQuestions([])}
                                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 space-y-6 flex-1 overflow-y-auto max-h-[800px] scrollbar-hide">
                                {questions.map((q, idx) => (
                                    <div key={idx} className="group relative p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-500">
                                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    const newQs = questions.filter((_, i) => i !== idx);
                                                    setQuestions(newQs);
                                                }}
                                                className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                            >
                                                <span className="material-icons-outlined text-sm">close</span>
                                            </button>
                                        </div>

                                        <div className="flex gap-6">
                                            <div className="flex flex-col items-center gap-2 pt-2">
                                                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center justify-center shadow-lg shadow-slate-200">
                                                    {String(idx + 1).padStart(2, '0')}
                                                </div>
                                                <div className="w-px h-full bg-slate-100 border-l border-dashed border-slate-200" />
                                            </div>

                                            <div className="flex-1 space-y-6">
                                                {testType === 'SURVEY' && (
                                                    <>
                                                        <textarea
                                                            value={q.text}
                                                            onChange={(e) => handleQuestionChange(idx, "text", e.target.value)}
                                                            rows={2}
                                                            className="w-full bg-transparent border-none p-0 text-lg font-bold text-slate-900 focus:ring-0 resize-none placeholder:text-slate-300 leading-relaxed"
                                                            placeholder="Enter psychometric inquiry..."
                                                        />
                                                        <div className="flex items-center gap-6 pt-2">
                                                            <label className={`flex items-center gap-3 px-4 py-2 rounded-xl border border-slate-100 cursor-pointer transition-all ${q.weight === 1.0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>
                                                                <input
                                                                    type="radio"
                                                                    name={`weight-${idx}`}
                                                                    checked={q.weight === 1.0}
                                                                    onChange={() => handleQuestionChange(idx, "weight", 1.0)}
                                                                    className="hidden"
                                                                />
                                                                <span className="w-2 h-2 rounded-full bg-current" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Positive Validator</span>
                                                            </label>
                                                            <label className={`flex items-center gap-3 px-4 py-2 rounded-xl border border-slate-100 cursor-pointer transition-all ${q.weight === -1.0 ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-slate-50 text-slate-400'}`}>
                                                                <input
                                                                    type="radio"
                                                                    name={`weight-${idx}`}
                                                                    checked={q.weight === -1.0}
                                                                    onChange={() => handleQuestionChange(idx, "weight", -1.0)}
                                                                    className="hidden"
                                                                />
                                                                <span className="w-2 h-2 rounded-full bg-current" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Negative Validator</span>
                                                            </label>
                                                        </div>
                                                    </>
                                                )}

                                                {testType === 'SPOT_ON' && (
                                                    <div className="space-y-8">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                            <div className="space-y-3">
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference Image</span>
                                                                {q.target?.imageUrl ? (
                                                                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 group/img">
                                                                        <img src={q.target.imageUrl} className="w-full h-full object-contain" alt="Target" />
                                                                        <button
                                                                            onClick={() => handleQuestionChange(idx, 'target', {})}
                                                                            className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 hover:bg-black transition-all"
                                                                        >
                                                                            <span className="material-icons-outlined text-[10px]">close</span>
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <label className="aspect-video rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-slate-50 transition-all flex flex-col items-center justify-center cursor-pointer group/upload">
                                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center mb-2 group-hover/upload:bg-indigo-50 group-hover/upload:text-indigo-500 transition-colors">
                                                                            <span className="material-icons-outlined">add_photo_alternate</span>
                                                                        </div>
                                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/upload:text-indigo-500">Upload Target</span>
                                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                                            if (e.target.files?.[0]) handleImageUpload(e.target.files[0], idx, 'target');
                                                                        }} />
                                                                    </label>
                                                                )}
                                                            </div>
                                                            <div className="space-y-3">
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Response Options</span>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    {(q.options || [{}, {}, {}, {}]).map((opt: any, optIdx: number) => (
                                                                        <div key={optIdx} className={`relative aspect-square rounded-xl border-2 transition-all overflow-hidden ${q.correct_index === optIdx ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-100 hover:border-slate-200'}`}>
                                                                            {opt.imageUrl ? (
                                                                                <>
                                                                                    <img src={opt.imageUrl} className="w-full h-full object-cover" alt="Option" />
                                                                                    <button
                                                                                        onClick={() => handleSpotOnOptionChange(idx, optIdx, 'imageUrl', null)}
                                                                                        className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black"
                                                                                    >
                                                                                        <span className="material-icons-outlined text-[10px]">close</span>
                                                                                    </button>
                                                                                </>
                                                                            ) : (
                                                                                <label className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-slate-50 text-slate-300 hover:text-slate-400">
                                                                                    <span className="material-icons-outlined text-lg">add</span>
                                                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                                                        if (e.target.files?.[0]) handleImageUpload(e.target.files[0], idx, "option", optIdx);
                                                                                    }} />
                                                                                </label>
                                                                            )}
                                                                            <button
                                                                                onClick={() => handleQuestionChange(idx, "correct_index", optIdx)}
                                                                                className={`absolute bottom-0 inset-x-0 py-1 text-[8px] font-black uppercase tracking-widest text-center ${q.correct_index === optIdx ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                                            >
                                                                                {q.correct_index === optIdx ? 'Correct Answer' : 'Mark Correct'}
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {testType === 'FREE_TRANSPORT' && (
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vessel ID</label>
                                                            <input
                                                                type="text"
                                                                value={q.text || ""}
                                                                onChange={(e) => handleQuestionChange(idx, "text", e.target.value)}
                                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 transition-colors"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Class</label>
                                                            <select
                                                                value={q.file_type || 'BROWN'}
                                                                onChange={(e) => handleQuestionChange(idx, "file_type", e.target.value)}
                                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 transition-colors"
                                                            >
                                                                <option value="BROWN">Brown (Low Cap)</option>
                                                                <option value="RED">Red (Med Cap)</option>
                                                                <option value="BLUE">Blue (High Cap)</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Load (Hidden)</label>
                                                            <input
                                                                type="number"
                                                                value={q.capacity}
                                                                onChange={(e) => handleQuestionChange(idx, "capacity", Number(e.target.value))}
                                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 transition-colors"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {testType === 'NUMERO' && (
                                                    <div className="space-y-6">
                                                        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl shadow-slate-200">
                                                            <input
                                                                type="text"
                                                                value={q.text}
                                                                onChange={(e) => handleQuestionChange(idx, "text", e.target.value)}
                                                                className="w-full bg-transparent border-none text-2xl font-mono font-bold text-center placeholder:text-slate-600 focus:ring-0"
                                                                placeholder="x + y = ?"
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-center gap-4">
                                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expected Solution:</div>
                                                            <input
                                                                type="number"
                                                                value={q.options?.[0]?.value || ''}
                                                                onChange={(e) => {
                                                                    const updated = [...questions];
                                                                    if (!updated[idx].options) updated[idx].options = [{}];
                                                                    updated[idx].options[0] = { value: Number(e.target.value) };
                                                                    setQuestions(updated);
                                                                }}
                                                                className="w-32 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-lg font-mono font-bold text-slate-900 text-center outline-none focus:border-indigo-500 transition-colors"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {testType === 'LABYRINTH' && (
                                                    <div className="space-y-6">
                                                        <input
                                                            type="text"
                                                            value={q.text || "Destroy all aliens"}
                                                            onChange={(e) => handleQuestionChange(idx, "text", e.target.value)}
                                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-center outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                                                        />

                                                        <div className="flex justify-center gap-8">
                                                            {['Reflectors', 'Splitters'].map((item) => (
                                                                <div key={item} className="bg-slate-50 px-6 py-3 rounded-xl border border-slate-100 flex items-center gap-4">
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item}</span>
                                                                    <input
                                                                        type="number"
                                                                        min={0}
                                                                        value={q.inventory?.[item.toLowerCase()] || 0}
                                                                        onChange={(e) => {
                                                                            const updated = [...questions];
                                                                            const key = item.toLowerCase();
                                                                            updated[idx].inventory = { ...updated[idx].inventory, [key]: Number(e.target.value) };
                                                                            setQuestions(updated);
                                                                        }}
                                                                        className="w-16 bg-white border border-slate-200 rounded-lg py-1 px-2 text-center font-bold text-indigo-600 outline-none"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="bg-slate-900 p-6 rounded-3xl shadow-2xl shadow-slate-200 relative overflow-hidden">
                                                            <div className="grid grid-cols-8 gap-2 max-w-[400px] mx-auto">
                                                                {Array.from({ length: 64 }).map((_, cellIdx) => {
                                                                    const grid = q.grid || [];
                                                                    const cell = grid[cellIdx] || { type: 'EMPTY' };
                                                                    const SPACE_WALLS = ['🚀', '🌌', '🛸', '🌙', '🪐'];

                                                                    const toggleCell = () => {
                                                                        const cycle = ['EMPTY', 'WALL', 'ALIEN', 'LASER_RIGHT', 'LASER_DOWN', 'LASER_LEFT', 'LASER_UP', 'REFLECTOR_FIXED', 'SPLITTER_FIXED'];
                                                                        const currentIdx = cycle.indexOf(cell.type) !== -1 ? cycle.indexOf(cell.type) : 0;
                                                                        const nextType = cycle[(currentIdx + 1) % cycle.length];
                                                                        const newGrid = [...(q.grid || Array(64).fill({ type: 'EMPTY' }))];
                                                                        newGrid[cellIdx] = { type: nextType };
                                                                        handleQuestionChange(idx, "grid", newGrid);
                                                                    };

                                                                    let bgColor = 'bg-slate-800';
                                                                    let content = null;

                                                                    if (cell.type === 'WALL') { content = <span className="text-sm">{SPACE_WALLS[cellIdx % 5]}</span>; }
                                                                    else if (cell.type === 'ALIEN') { bgColor = 'bg-rose-900/40 text-rose-500'; content = <span className="material-icons-outlined text-sm">smart_toy</span>; }
                                                                    else if (cell.type === 'LASER_RIGHT') { bgColor = 'bg-indigo-900/40 text-indigo-400'; content = <span className="material-icons-outlined text-sm rotate-0">flare</span>; }
                                                                    else if (cell.type === 'REFLECTOR_FIXED') { bgColor = 'bg-slate-700 text-slate-400'; content = <span className="material-icons-outlined text-sm">change_history</span>; }

                                                                    return (
                                                                        <button
                                                                            key={cellIdx}
                                                                            onClick={toggleCell}
                                                                            className={`aspect-square rounded-lg flex items-center justify-center transition-all hover:bg-slate-700 ${bgColor}`}
                                                                        >
                                                                            {content}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {testType === 'EMOTIONAL_INTELLIGENCE' && (
                                                    <div className="space-y-6">
                                                        <div className="flex gap-6">
                                                            <div className="w-1/3">
                                                                {q.target?.imageUrl ? (
                                                                    <div className="aspect-square rounded-2xl overflow-hidden bg-slate-900 relative group/img">
                                                                        <img src={q.target.imageUrl} className="w-full h-full object-cover opacity-80" alt="Emote" />
                                                                        <button
                                                                            onClick={() => {
                                                                                const updated = [...questions];
                                                                                updated[idx].target = { ...updated[idx].target, imageUrl: undefined };
                                                                                setQuestions(updated);
                                                                            }}
                                                                            className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 hover:bg-black"
                                                                        >
                                                                            <span className="material-icons-outlined text-[10px]">close</span>
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <label className="aspect-square rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-400 cursor-pointer transition-all">
                                                                        <span className="material-icons-outlined text-2xl mb-1">face</span>
                                                                        <span className="text-[9px] font-black uppercase tracking-widest">Upload Face</span>
                                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                                            if (e.target.files?.[0]) handleImageUpload(e.target.files[0], idx, 'target');
                                                                        }} />
                                                                    </label>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 space-y-4">
                                                                <textarea
                                                                    value={q.text}
                                                                    onChange={(e) => handleQuestionChange(idx, "text", e.target.value)}
                                                                    className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-medium text-slate-700 resize-none outline-none focus:ring-2 focus:ring-indigo-100"
                                                                    placeholder="Describe the situation or context..."
                                                                />
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Emotion</span>
                                                                        <input
                                                                            type="text"
                                                                            value={q.target?.emotion || ''}
                                                                            onChange={(e) => {
                                                                                const updated = [...questions];
                                                                                updated[idx].target = { ...updated[idx].target, emotion: e.target.value };
                                                                                setQuestions(updated);
                                                                            }}
                                                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Visual Cue</span>
                                                                        <input
                                                                            type="text"
                                                                            value={q.target?.visual_cue || ''}
                                                                            onChange={(e) => {
                                                                                const updated = [...questions];
                                                                                updated[idx].target = { ...updated[idx].target, visual_cue: e.target.value };
                                                                                setQuestions(updated);
                                                                            }}
                                                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {testType === 'PIPELINE' && (
                                                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-center">
                                                        <div className="inline-grid grid-cols-6 gap-1 p-2 bg-slate-800/50 rounded-xl">
                                                            {(q.grid || []).map((pipe: any, pIdx: number) => (
                                                                <div
                                                                    key={pIdx}
                                                                    onClick={() => {
                                                                        const updated = [...questions];
                                                                        const types = ['EMPTY', 'STRAIGHT', 'CURVE'];
                                                                        const nextType = types[(types.indexOf(pipe.type) + 1) % types.length];
                                                                        updated[idx].grid[pIdx] = { ...pipe, type: nextType };
                                                                        setQuestions(updated);
                                                                    }}
                                                                    className={`w-10 h-10 rounded-md flex items-center justify-center cursor-pointer transition-all hover:bg-white/10 ${pipe.nodeType !== 'PIPE' ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}
                                                                >
                                                                    {pipe.type === 'STRAIGHT' && <span className="material-icons text-sm rotate-90">maximize</span>}
                                                                    {pipe.type === 'CURVE' && <span className="material-icons text-sm">turn_right</span>}
                                                                    {pipe.nodeType !== 'PIPE' && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="mt-4 text-[10px] uppercase tracking-widest text-slate-500">Pipeline Diagnostic Grid</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center backdrop-blur-sm sticky bottom-0 z-10 transition-all">
                                <span className="text-xs font-bold text-slate-400">
                                    {questions.length} Node{questions.length !== 1 ? 's' : ''} Configured
                                </span>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => router.push('/admin/psychometric')}
                                        className="px-6 py-3 text-slate-400 hover:text-slate-600 text-xs font-black uppercase tracking-widest transition-all"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="group relative px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] overflow-hidden transition-all hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:scale-100"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 bg-[length:200%_auto] animate-gradient transition-opacity duration-500" />
                                        <span className="relative flex items-center gap-2">
                                            {saving ? (
                                                <>
                                                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                    Deploying...
                                                </>
                                            ) : (
                                                <>
                                                    Deploy Construct
                                                    <span className="material-icons-outlined text-sm">rocket_launch</span>
                                                </>
                                            )}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-[600px] flex flex-col items-center justify-center bg-slate-50 rounded-[2.5rem] border border-slate-100 border-dashed relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
                            <div className="relative z-10 w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-slate-100 group-hover:scale-110 transition-transform duration-500">
                                <span className="material-icons-outlined text-4xl text-indigo-500/50">
                                    {creationMode === 'AI' ? 'auto_awesome' : 'dashboard_customize'}
                                </span>
                            </div>
                            <h3 className="relative z-10 text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Protocol Buffer Empty</h3>
                            <p className="relative z-10 text-xs font-bold text-slate-400 uppercase tracking-widest max-w-xs text-center leading-relaxed">
                                {creationMode === 'AI'
                                    ? 'Initialize the Neural Architect to generate assessment nodes.'
                                    : 'Add calculation nodes or scenarios manually to begin.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
