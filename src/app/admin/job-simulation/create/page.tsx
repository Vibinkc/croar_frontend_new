"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/utils/api";
import { useDivision } from "@/context/DivisionContext";
import AIGenerationOverlay from "@/components/ui/AIGenerationOverlay";

export default function CreateJobSimulationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const departmentId = searchParams.get("department_id");

    // Config
    const [role, setRole] = useState("");
    const [roundsCount, setRoundsCount] = useState(3);
    const [customRounds, setCustomRounds] = useState<string[]>([]);
    const [generating, setGenerating] = useState(false);
    const [generatingQuestions, setGeneratingQuestions] = useState<Record<number, boolean>>({});

    // Generated Data
    const [rounds, setRounds] = useState<any[]>([]);
    const [activeRoundTab, setActiveRoundTab] = useState(0);
    const [generatedTitle, setGeneratedTitle] = useState("");

    // Saving
    const [saving, setSaving] = useState(false);

    const handleGenerate = async () => {
        if (!role) return;
        setGenerating(true);
        try {
            const payload = {
                role: role,
                rounds: customRounds.length > 0 ? customRounds.length : roundsCount,
                round_titles: customRounds.length > 0 ? customRounds : null
            };

            const queryParams = new URLSearchParams({
                role: role,
                rounds: (customRounds.length > 0 ? customRounds.length : roundsCount).toString()
            });

            // Use POST with JSON body for complex data like round_titles
            const res = await apiClient.post(`/api/v1/job-simulation/generate?${queryParams.toString()}`, customRounds.length > 0 ? customRounds : null);

            if (!res.ok) throw new Error("Generation Failed");
            const data = await res.json();

            setGeneratedTitle(data.title);
            setRounds(data.rounds);
            setActiveRoundTab(0);

        } catch (e) {
            console.error(e);
            alert("Failed to generate simulation");
        } finally {
            setGenerating(false);
        }
    };

    const handleQuestionChange = (roundIndex: number, questionIndex: number, text: string) => {
        const newRounds = [...rounds];
        newRounds[roundIndex].questions[questionIndex].text = text;
        setRounds(newRounds);
    };

    const removeQuestion = (roundIndex: number, questionIndex: number) => {
        const newRounds = [...rounds];
        newRounds[roundIndex].questions = newRounds[roundIndex].questions.filter((_: any, i: number) => i !== questionIndex);
        setRounds(newRounds);
    };

    const addQuestion = (roundIndex: number) => {
        const newRounds = [...rounds];
        newRounds[roundIndex].questions.push({
            id: Date.now(),
            text: "",
            type: "text"
        });
        setRounds(newRounds);
    };

    const handleAddAiQuestions = async (roundIndex: number) => {
        const countInput = document.getElementById(`gen-count-${roundIndex}`) as HTMLInputElement;
        const count = parseInt(countInput.value) || 3;

        const difficulties: string[] = [];
        ["Easy", "Medium", "Hard"].forEach(d => {
            const cb = document.getElementById(`gen-diff-${roundIndex}-${d}`) as HTMLInputElement;
            if (cb?.checked) difficulties.push(d);
        });

        if (difficulties.length === 0) {
            alert("Please select at least one difficulty");
            return;
        }

        setGeneratingQuestions(prev => ({ ...prev, [roundIndex]: true }));

        try {
            const round = rounds[roundIndex];

            const res = await apiClient.post("/api/v1/job-simulation/generate-questions", {
                role: role,
                round_title: round.round_title,
                round_type: round.round_type || "technical",
                count: count,
                difficulties: difficulties
            });

            if (res.ok) {
                const newQuestions = await res.json();
                const newRounds = [...rounds];
                newRounds[roundIndex].questions = [...newRounds[roundIndex].questions, ...newQuestions];
                setRounds(newRounds);
            } else {
                alert("Failed to generate questions");
            }

        } catch (e) {
            console.error(e);
            alert("Error generating questions");
        } finally {
            setGeneratingQuestions(prev => ({ ...prev, [roundIndex]: false }));
        }
    };

    const { selectedBatch } = useDivision();

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                title: generatedTitle,
                description: `Simulation for ${role}`,
                rounds: rounds,
                department_id: departmentId ? parseInt(departmentId) : null,
                batch: selectedBatch
            };

            const res = await apiClient.post("/api/v1/job-simulation/", payload);

            if (res.ok) {
                router.push("/admin/job-simulation");
                router.refresh();
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.detail || "Failed to deploy simulation");
            }
        } catch (e) {
            console.error(e);
            alert("Failed to deploy simulation");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-6 pb-20 px-6 pt-4">
            <AIGenerationOverlay isOpen={generating} title="Architecting Process" />
            <AIGenerationOverlay isOpen={Object.values(generatingQuestions).some(v => v)} title="Generating Questions" />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-all hover:scale-105 active:scale-95"
                    >
                        <span className="material-icons-outlined text-lg">arrow_back</span>
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Job Simulator Engine v2.0</span>
                        </div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Design Process</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end text-right">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                        <span className="text-[10px] font-bold text-slate-700">{rounds.length > 0 ? 'Ready to Deploy' : 'Planning Phase'}</span>
                    </div>
                    {rounds.length > 0 && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 hover:shadow-slate-300 disabled:opacity-50 active:scale-95 flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    <span>Deploying...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-icons-outlined text-sm">rocket_launch</span>
                                    <span>Create Simulation</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Panel: Configuration (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl shadow-slate-200/50 p-6 space-y-6 sticky top-6">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                            <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs">1</div>
                            <h2 className="text-xs font-black text-slate-900 uppercase tracking-tight">Configuration</h2>
                        </div>

                        <div className="space-y-5">
                            <div className="group">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 group-focus-within:text-indigo-500 transition-colors">Target Professional Role</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        placeholder="Enter the role name e.g. Frontend Developer"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-4 pr-4 py-3 text-[11px] font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all h-12"
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 group-focus-within:text-indigo-500 transition-colors">Interview Depth (Rounds)</label>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {[1, 2, 3, 4, 5].map((num) => (
                                        <button
                                            key={num}
                                            onClick={() => {
                                                setRoundsCount(num);
                                                setCustomRounds([]); // Reset custom rounds if manual count is picked
                                            }}
                                            className={`h-10 rounded-lg text-[10px] font-black transition-all ${roundsCount === num && customRounds.length === 0
                                                ? "bg-slate-900 text-white shadow-lg shadow-slate-200 scale-105"
                                                : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                                }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Rounds Selection */}
                            <div className="space-y-3 pt-3 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Custom Rounds (Optional)</label>
                                    <button
                                        onClick={() => setCustomRounds([...customRounds, ""])}
                                        className="text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700 transition-all flex items-center gap-1"
                                    >
                                        <span className="material-icons-outlined text-xs">add</span> Add
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {customRounds.map((r, idx) => (
                                        <div key={idx} className="flex gap-2 group/round">
                                            <input
                                                type="text"
                                                value={r}
                                                onChange={(e) => {
                                                    const updated = [...customRounds];
                                                    updated[idx] = e.target.value;
                                                    setCustomRounds(updated);
                                                }}
                                                placeholder={`Round ${idx + 1} Name`}
                                                className="flex-1 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-700 focus:border-indigo-500 outline-none transition-all h-9"
                                            />
                                            <button
                                                onClick={() => setCustomRounds(customRounds.filter((_, i) => i !== idx))}
                                                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover/round:opacity-100"
                                            >
                                                <span className="material-icons-outlined text-xs">close</span>
                                            </button>
                                        </div>
                                    ))}
                                    {customRounds.length === 0 && (
                                        <div className="py-6 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
                                            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">No custom rounds defined</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={handleGenerate}
                                    disabled={generating || !role}
                                    className="w-full group relative h-12 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 hover:shadow-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden active:scale-95"
                                >
                                    <div className="relative z-10 flex items-center justify-center gap-2">
                                        <span className="material-icons-outlined text-base">psychology</span>
                                        <span>Architect Experience</span>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                </button>
                                <p className="text-center text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-3 leading-relaxed">
                                    Powered by Advanced AI for <br />Role-Specific Simulation Modeling
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Round Editor (8 cols) */}
                <div className="lg:col-span-8">
                    {rounds.length > 0 ? (
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col min-h-[600px]">
                            {/* Tabs Header */}
                            <div className="flex bg-slate-50/50 border-b border-slate-100 p-1.5 gap-1 overflow-x-auto custom-scrollbar">
                                {rounds.map((round, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveRoundTab(idx)}
                                        className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeRoundTab === idx
                                            ? "bg-white text-indigo-600 shadow-sm border border-slate-100"
                                            : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                                            }`}
                                    >
                                        <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[7px] ${activeRoundTab === idx ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                            {round.round_number}
                                        </span>
                                        {round.round_title}
                                    </button>
                                ))}
                            </div>

                            {/* Scrollable Content Area */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                <div className="max-w-4xl mx-auto space-y-6">
                                    <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                                        <div>
                                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block mb-0.5">Round {rounds[activeRoundTab].round_number} Focus</span>
                                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                                {rounds[activeRoundTab].round_title}
                                            </h3>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Items in Round</span>
                                            <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black text-slate-900 tracking-tighter">
                                                {rounds[activeRoundTab].questions.length < 10 ? `0${rounds[activeRoundTab].questions.length}` : rounds[activeRoundTab].questions.length} / 12
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-4">
                                        {rounds[activeRoundTab].questions.map((q: any, qIdx: number) => (
                                            <div key={q.id || qIdx} className="group relative bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center font-black text-[9px] text-slate-400">
                                                            {qIdx + 1}
                                                        </div>
                                                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-lg border ${q.type === 'mcq' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                            q.type === 'code' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                'bg-indigo-50 text-indigo-600 border-indigo-100'
                                                            }`}>
                                                            {q.type === 'mcq' ? 'Assessment' : q.type === 'code' ? 'Algorithmic' : 'Subjective'}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => removeQuestion(activeRoundTab, qIdx)}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <span className="material-icons-outlined text-base">delete_outline</span>
                                                    </button>
                                                </div>

                                                <textarea
                                                    value={q.text}
                                                    onChange={(e) => handleQuestionChange(activeRoundTab, qIdx, e.target.value)}
                                                    rows={q.type === 'code' ? 5 : 3}
                                                    className="w-full bg-transparent border-none p-0 text-xs font-bold text-slate-700 placeholder:text-slate-300 focus:ring-0 outline-none resize-none leading-relaxed"
                                                    placeholder={q.type === 'code' ? "Define the technical challenge..." : "Enter question or scenario description..."}
                                                />

                                                {q.type === 'mcq' && q.options && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/50">
                                                        {q.options.map((opt: string, oIdx: number) => (
                                                            <div key={oIdx} className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-100 text-[11px] font-bold text-slate-500">
                                                                <div className="w-4 h-4 rounded-full border border-slate-100 flex-shrink-0 flex items-center justify-center text-[9px] font-black">
                                                                    {String.fromCharCode(65 + oIdx)}
                                                                </div>
                                                                <span className="truncate">{opt}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {q.type === 'code' && (
                                                    <div className="mt-3 pt-3 border-t border-slate-200/50">
                                                        <div className="bg-slate-900 rounded-xl p-4 font-mono text-[10px] text-slate-400 relative overflow-hidden group/code">
                                                            <div className="flex gap-1 mb-3 border-b border-slate-800 pb-2">
                                                                <div className="w-2 h-2 rounded-full bg-rose-500/50"></div>
                                                                <div className="w-2 h-2 rounded-full bg-amber-500/50"></div>
                                                                <div className="w-2 h-2 rounded-full bg-emerald-500/50"></div>
                                                            </div>
                                                            <p className="text-slate-500">// Integrated IDE Environment</p>
                                                            <p className="text-indigo-400 mt-1">function <span className="text-amber-400">solve</span>(input) &#123;</p>
                                                            <p className="pl-4 text-slate-600 italic">/* candidate implementation */</p>
                                                            <p className="text-indigo-400">&#125;</p>
                                                            <div className="absolute top-3 right-3 text-[8px] font-black uppercase text-slate-700 tracking-widest">Sandbox Only</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Control Panel */}
                                    <div className="space-y-3 pt-4">
                                        <div className="bg-indigo-50/50 rounded-[2rem] border border-indigo-100 p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                                                    <span className="material-icons-outlined text-lg">auto_awesome</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">AI Content Injector</h4>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Populate Round with Fresh Material</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                                <div className="w-full md:w-28">
                                                    <label className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block">Quantity</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={10}
                                                        defaultValue={3}
                                                        id={`gen-count-${activeRoundTab}`}
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                                    />
                                                </div>
                                                <div className="flex-1 w-full">
                                                    <label className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block">Complexity Matrix</label>
                                                    <div className="flex gap-3 p-2 bg-white rounded-xl border border-slate-200">
                                                        {["Easy", "Medium", "Hard"].map(d => (
                                                            <label key={d} className="flex items-center gap-1.5 cursor-pointer group/diff">
                                                                <input type="checkbox" defaultChecked={d === "Medium"} value={d} className="w-3.5 h-3.5 accent-indigo-600 rounded cursor-pointer" id={`gen-diff-${activeRoundTab}-${d}`} />
                                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">{d}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleAddAiQuestions(activeRoundTab)}
                                                    disabled={generatingQuestions[activeRoundTab]}
                                                    className="w-full md:w-auto px-6 h-10 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                                                >
                                                    {generatingQuestions[activeRoundTab] ? (
                                                        <>
                                                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                            <span>Injecting...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="material-icons-outlined text-base">add_task</span>
                                                            <span>Sync AI Content</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => addQuestion(activeRoundTab)}
                                            className="w-full h-12 border-2 border-dashed border-slate-200 rounded-[1.25rem] text-slate-400 font-black uppercase text-[9px] tracking-[0.2em] hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2 active:scale-[0.99] group/manual"
                                        >
                                            <span className="material-icons-outlined text-lg group-hover:rotate-90 transition-transform duration-300">add</span>
                                            Insert Manual Field
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center min-h-[600px] border-2 border-dashed border-slate-100 rounded-[3rem] text-slate-300 bg-white shadow-inner relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/0 via-slate-50/50 to-slate-50/0 group-hover:via-indigo-50/30 transition-colors duration-1000"></div>
                            <div className="text-center space-y-6 relative z-10 p-12">
                                <div className="relative">
                                    <div className="w-24 h-24 bg-slate-50 rounded-[2rem] shadow-sm flex items-center justify-center mx-auto mb-6 border border-white rotate-6 group-hover:rotate-0 transition-transform duration-500">
                                        <span className="material-icons-outlined text-5xl text-slate-200 group-hover:text-indigo-200 transition-colors duration-500">model_training</span>
                                    </div>
                                    <div className="absolute top-0 right-1/4 w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-200 blur-sm group-hover:blur-none transition-all">
                                        <span className="material-icons-outlined text-xl">auto_fix_high</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-400 group-hover:text-slate-600 transition-colors">Simulation Canvas</h3>
                                    <p className="text-[10px] text-slate-400 font-bold max-w-sm mx-auto uppercase tracking-widest leading-relaxed opacity-60">
                                        Configure your target professional role and round count on the left to initialize the simulation architect.
                                    </p>
                                </div>
                                <div className="flex items-center justify-center gap-6 pt-2">
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-100 border border-slate-200"></div>
                                        <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Structure</span>
                                    </div>
                                    <div className="w-8 h-[1px] bg-slate-100"></div>
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-100 border border-slate-200"></div>
                                        <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Dynamics</span>
                                    </div>
                                    <div className="w-8 h-[1px] bg-slate-100"></div>
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-100 border border-slate-200"></div>
                                        <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Logic</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
