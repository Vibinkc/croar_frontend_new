"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";

export default function EditPsychometricPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [trait, setTrait] = useState("");
    const [questions, setQuestions] = useState<any[]>([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await apiClient.get(`/api/v1/psychometric/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setTrait(data.trait);
                    setTitle(data.title);
                    setDescription(data.description);
                    setQuestions(data.questions || []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleQuestionChange = (index: number, field: string, value: any) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };
        setQuestions(updated);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                title: title,
                description: description,
                trait: trait,
                questions: questions
            };

            const res = await apiClient.put(`/api/v1/psychometric/${id}`, payload);

            if (res.ok) {
                router.push("/admin/psychometric");
            } else {
                alert("Failed to update protocol");
            }
        } catch (e) {
            console.error(e);
            alert("Error updating protocol");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-20 text-center font-black   text-slate-400 animate-pulse">Loading Protocol Data...</div>;

    return (
        <div className="max-w-[1800px] mx-auto space-y-6 pb-20 px-6">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-all"
                >
                    <span className="material-icons-outlined text-lg">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight ">Edit Protocol</h1>
                    <p className="text-[10px] font-bold text-slate-400  ">Modify Psychometric Analysis</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Panel: Configuration */}
                <div className="space-y-5">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100 p-6 space-y-5">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400   mb-2">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[var(--color-primary-light)] focus:border-[var(--color-primary)] outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400   mb-2">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[var(--color-primary-light)] focus:border-[var(--color-primary)] outline-none min-h-[100px] resize-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400   mb-2">Target Trait</label>
                            <input
                                type="text"
                                value={trait}
                                onChange={(e) => setTrait(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[var(--color-primary-light)] focus:border-[var(--color-primary)] outline-none transition-all"
                            />
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full py-3 bg-[var(--color-primary)] text-white rounded-xl text-[11px] font-black  tracking-[0.2em] hover:bg-[var(--color-primary-dark)] transition-all shadow-xl shadow-indigo-100 hover:shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Syncing Configuration...
                                </>
                            ) : (
                                <>
                                    <span className="material-icons-outlined text-base">save</span>
                                    Commit Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Panel: Review & Edit */}
                <div className="space-y-5">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100 p-6">
                        <h2 className="text-base font-black text-slate-900 mb-5 flex items-center gap-2">
                            <span className="material-icons-outlined text-slate-500 text-lg">edit_note</span>
                            Modify Indicators
                        </h2>

                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {questions.map((q, idx) => (
                                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20 focus-within:border-[var(--color-primary)]/50 transition-all">
                                    <div className="flex gap-4">
                                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 text-xs font-black flex items-center justify-center shrink-0 mt-2">
                                            {idx + 1}
                                        </span>
                                        <div className="flex-1 space-y-3">
                                            <textarea
                                                value={q.text}
                                                onChange={(e) => handleQuestionChange(idx, "text", e.target.value)}
                                                rows={2}
                                                className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-700 focus:ring-0 resize-none placeholder:text-slate-300"
                                                placeholder="Indicator text..."
                                            />
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400   cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={`weight-${idx}`}
                                                        checked={q.weight === 1.0}
                                                        onChange={() => handleQuestionChange(idx, "weight", 1.0)}
                                                        className="text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                                    />
                                                    Positive
                                                </label>
                                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400   cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={`weight-${idx}`}
                                                        checked={q.weight === -1.0}
                                                        onChange={() => handleQuestionChange(idx, "weight", -1.0)}
                                                        className="text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                                    />
                                                    Negative
                                                </label>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newQs = questions.filter((_, i) => i !== idx);
                                                setQuestions(newQs);
                                            }}
                                            className="w-8 h-8 rounded-xl text-slate-300 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <span className="material-icons-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={() => setQuestions([...questions, { text: "", weight: 1.0 }])}
                                className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2 font-black   text-xs"
                            >
                                <span className="material-icons-outlined">add</span>
                                Add Manual Indicator
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
