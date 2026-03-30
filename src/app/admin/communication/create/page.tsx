"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/utils/api";
import { useDivision } from "@/context/DivisionContext";
import AIGenerationOverlay from "@/components/ui/AIGenerationOverlay";

export default function CreateScenarioPage() {
    const { selectedBatch } = useDivision();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [title, setTitle] = useState("");
    const [prompt, setPrompt] = useState("");
    const [difficulty, setDifficulty] = useState("EASY");
    const [isGenerating, setIsGenerating] = useState(false);

    const departmentId = searchParams.get("department_id");
    const isAiTabByQuery = searchParams.get("ai") === "true";

    const handleGenerate = async () => {
        if (!title) {
            alert("Please provide a protocol title to initialize neural scripting.");
            return;
        }

        setIsGenerating(true);
        try {
            const res = await apiClient.post("/api/v1/coach/generate-scenario", {
                title,
                difficulty
            });

            if (res.ok) {
                const data = await res.json();
                const generatedContent = `${data.prompt}\n\nInstructions:\n${data.instructions}`;
                setPrompt(generatedContent);
            } else {
                alert("Neural synthesis failed. Please retry the ingestion.");
            }
        } catch (e) {
            console.error(e);
            alert("Critical error during neural scripting.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            title,
            prompt,
            difficulty,
            department_id: departmentId ? parseInt(departmentId) : null,
            batch: selectedBatch
        };

        try {
            const res = await apiClient.post(`/api/v1/content/scenarios`, payload);

            if (res.ok) {
                router.push(`/admin/communication${departmentId ? `?department_id=${departmentId}` : ''}`);
            } else {
                alert("Failed to commit scenario to vault.");
            }
        } catch (e) {
            console.error(e);
            alert("Error finalizing simulation protocol.");
        }
    };

    return (
        <div className="max-w-[1000px] mx-auto space-y-12 px-6 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <AIGenerationOverlay isOpen={isGenerating} title="Neural Scripting Engine" />

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
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Simulation_Construct</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Initialize Scenario</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">System_Ready</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.04)] overflow-hidden">
                        <div className="p-10 border-b border-slate-50 bg-slate-50/30">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                <span className="material-icons-outlined text-indigo-500">settings_input_component</span>
                                Scenario Configuration
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Protocol Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                        placeholder="e.g. Executive Presentation"
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Difficulty Complexity</label>
                                    <select
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer appearance-none"
                                    >
                                        <option value="EASY">LEVEL: EASY</option>
                                        <option value="MEDIUM">LEVEL: MEDIUM</option>
                                        <option value="HARD">LEVEL: HARD</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Prompt / Reality Matrix</label>
                                    <button
                                        type="button"
                                        onClick={handleGenerate}
                                        disabled={isGenerating || !title}
                                        className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isGenerating || !title
                                            ? 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100'
                                            : 'bg-slate-900 text-white hover:bg-black shadow-lg shadow-slate-200 active:scale-95'
                                            }`}
                                    >
                                        <span className={`material-icons-outlined text-sm ${isGenerating ? 'animate-spin' : ''}`}>
                                            {isGenerating ? 'sync' : 'auto_awesome'}
                                        </span>
                                        {isGenerating ? 'Synthesizing...' : 'Neural Scripting'}
                                    </button>
                                </div>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    required
                                    placeholder="Define the simulation environment and student objectives..."
                                    className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 min-h-[200px] leading-relaxed"
                                />
                            </div>

                            <div className="flex justify-end gap-4 pt-6 border-t border-slate-50">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="px-8 py-4 border border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Abort
                                </button>
                                <button
                                    type="submit"
                                    className="px-10 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-100 active:scale-95"
                                >
                                    Initialize Protocol
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    {/* Guidance Card */}
                    <div className="bg-[var(--color-primary)] rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-100 relative overflow-hidden group">
                        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                        <h3 className="text-lg font-black uppercase tracking-tight mb-6 relative z-10">Simulation Engineering</h3>
                        <div className="space-y-6 relative z-10">
                            {[
                                { icon: 'psychology', text: 'Define clear vocal objectives' },
                                { icon: 'settings_voice', text: 'Specify persona requirements' },
                                { icon: 'model_training', text: 'Set complexity parameters' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                                        <span className="material-icons-outlined text-lg">{item.icon}</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Diagnostic Card */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Neural Diagnostics</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol Type</span>
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">VOICE_SIM</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Latency Status</span>
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">MINIMAL</span>
                            </div>
                            <div className="flex justify-between items-center py-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sector Ingestion</span>
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{departmentId ? 'SPECIFIC' : 'GLOBAL'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
