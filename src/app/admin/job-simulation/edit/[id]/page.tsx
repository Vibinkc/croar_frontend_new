"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";
import AIGenerationOverlay from "@/components/ui/AIGenerationOverlay";

export default function EditJobSimulationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    // Config
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [rounds, setRounds] = useState<any[]>([]);
    const [activeRoundTab, setActiveRoundTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generatingQuestions, setGeneratingQuestions] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await apiClient.get(`/api/v1/job-simulation/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setTitle(data.title);
                    setDescription(data.description);
                    setRounds(data.rounds || []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

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
        if (!newRounds[roundIndex].questions) newRounds[roundIndex].questions = [];
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
                role: title, // Using Title as role context since role isn't distinct here
                round_title: round.round_title,
                round_type: round.round_type || "technical",
                count: count,
                difficulties: difficulties
            });

            if (res.ok) {
                const newQuestions = await res.json();
                const newRounds = [...rounds];
                if (!newRounds[roundIndex].questions) newRounds[roundIndex].questions = [];
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

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                title: title,
                description: description,
                rounds: rounds.map(r => ({
                    round_number: r.round_number,
                    round_title: r.round_title,
                    round_type: r.round_type,
                    questions: r.questions
                }))
            };

            const res = await apiClient.put(`/api/v1/job-simulation/${id}`, payload);

            if (res.ok) {
                router.push("/admin/job-simulation");
            } else {
                alert("Failed to update simulation");
            }
        } catch (e) {
            console.error(e);
            alert("Error updating simulation");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading simulation data...</div>;

    return (
        <div className="max-w-[1600px] mx-auto space-y-6 pb-20 px-6">
            <AIGenerationOverlay isOpen={Object.values(generatingQuestions).some(v => v)} title="Generating Questions" />
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-all"
                >
                    <span className="material-icons-outlined text-lg">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">Edit Job Simulation</h1>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Modify Process Structure</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Panel: Configuration */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100 p-5 space-y-4">
                        <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[var(--color-primary-light)] focus:border-[var(--color-primary)] outline-none transition-all h-10"
                            />
                        </div>

                        <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[var(--color-primary-light)] focus:border-[var(--color-primary)] outline-none min-h-[80px] transition-all"
                            />
                        </div>

                        {/* Company Name Removed */}

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full h-11 bg-[var(--color-primary)] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[var(--color-primary-dark)] transition-all shadow-xl shadow-indigo-100 hover:shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
                        >
                            {saving ? "Updating..." : "Save Changes"}
                        </button>
                    </div>
                </div>

                {/* Right Panel: Round Editor */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100 overflow-hidden flex flex-col h-[600px]">
                        {/* Tabs Header */}
                        <div className="flex border-b border-slate-100 overflow-x-auto">
                            {rounds.map((round, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveRoundTab(idx)}
                                    className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-b-2 ${activeRoundTab === idx
                                        ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-indigo-50/30"
                                        : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                        }`}
                                >
                                    <span className="mr-2 opacity-50">Round {round.round_number}</span>
                                    {round.round_title}
                                </button>
                            ))}
                        </div>

                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {rounds.length > 0 && (
                                <div className="max-w-3xl mx-auto space-y-5">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-base font-black text-slate-900">
                                            {rounds[activeRoundTab].round_title} Questions
                                        </h3>
                                        <span className="px-2.5 py-1 bg-slate-100 rounded-full text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                            {rounds[activeRoundTab].questions?.length || 0} Items
                                        </span>
                                    </div>

                                    {rounds[activeRoundTab].questions?.map((q: any, qIdx: number) => (
                                        <div key={qIdx} className="group relative pl-4 border-l-4 border-slate-200 hover:border-slate-500 transition-colors">
                                            <div className="mb-2">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-indigo-50 text-[var(--color-primary)] border border-indigo-100/50`}>
                                                    {q.type === 'mcq' ? 'Aptitude / MCQ' : q.type === 'code' ? 'Coding Challenge' : 'Text Response'}
                                                </span>
                                            </div>

                                            <textarea
                                                value={q.text}
                                                onChange={(e) => handleQuestionChange(activeRoundTab, qIdx, e.target.value)}
                                                rows={q.type === 'code' ? 4 : 2}
                                                className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-[var(--color-primary)]/10 outline-none resize-none transition-shadow mb-2"
                                            />

                                            <button
                                                onClick={() => removeQuestion(activeRoundTab, qIdx)}
                                                className="absolute top-2 right-2 p-2 text-slate-300 hover:text-slate-900 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <span className="material-icons-outlined text-sm">delete</span>
                                            </button>
                                        </div>
                                    ))}

                                    <div className="space-y-3">
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                                    <span className="material-icons-outlined text-sm">auto_awesome</span>
                                                    AI Generator Helper
                                                </h4>
                                            </div>
                                            <div className="flex gap-4 items-end">
                                                <div className="w-20">
                                                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block">Count</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={10}
                                                        defaultValue={3}
                                                        id={`gen-count-${activeRoundTab}`}
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-slate-500"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block">Difficulty Mix</label>
                                                    <div className="flex gap-3">
                                                        {["Easy", "Medium", "Hard"].map(d => (
                                                            <label key={d} className="flex items-center gap-1.5 cursor-pointer">
                                                                <input type="checkbox" defaultChecked={d === "Medium"} value={d} className="w-3 h-3 accent-slate-800 rounded" id={`gen-diff-${activeRoundTab}-${d}`} />
                                                                <span className="text-[10px] font-bold text-slate-600 uppercase">{d}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleAddAiQuestions(activeRoundTab)}
                                                    disabled={generatingQuestions[activeRoundTab]}
                                                    className="px-4 h-9 bg-[var(--color-primary)] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[var(--color-primary-dark)] shadow-md shadow-indigo-100 transition-all min-w-[100px] flex items-center justify-center gap-2 active:scale-95"
                                                >
                                                    Generate
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => addQuestion(activeRoundTab)}
                                            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:border-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                                        >
                                            <span className="material-icons-outlined text-sm">add_circle</span>
                                            Add Manual Question
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
