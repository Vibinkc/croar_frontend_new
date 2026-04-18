"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";

export default function EditScenarioPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [prompt, setPrompt] = useState("");
    const [difficulty, setDifficulty] = useState("EASY");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchScenario = async () => {
            try {
                const res = await apiClient.get(`/api/v1/content/scenarios/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setTitle(data.title);
                    setPrompt(data.prompt);
                    setDifficulty(data.difficulty);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchScenario();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const payload = {
            title,
            prompt,
            difficulty
        };

        try {
            const res = await apiClient.put(`/api/v1/content/scenarios/${id}`, payload);

            if (res.ok) {
                router.push("/admin/communication");
            } else {
                alert("Failed to update scenario");
            }
        } catch (e) {
            console.error(e);
            alert("Error updating scenario");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-32 animate-in fade-in duration-700">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-indigo-50 rounded-full animate-pulse"></div>
                </div>
            </div>
            <p className="text-[10px] font-black  tracking-[0.4em] text-slate-400 mt-8 animate-pulse">Loading_Configuration</p>
        </div>
    );

    return (
        <div className="max-w-[1000px] mx-auto space-y-12 px-6 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-1000">

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
                            <span className="text-[9px] font-black text-slate-400  ">Knowledge Engine v2.0</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-[9px] font-black text-orange-500  ">Protocol_Calibration</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight  leading-none">Edit Scenario</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-900  ">Calibration_Active</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.04)] overflow-hidden">
                        <div className="p-10 border-b border-slate-50 bg-slate-50/30">
                            <h2 className="text-sm font-black text-slate-900   flex items-center gap-3">
                                <span className="material-icons-outlined text-orange-500">tune</span>
                                Calibration Settings
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400  tracking-[0.2em] ml-1">Protocol Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-slate-300"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400  tracking-[0.2em] ml-1">Complexity Level</label>
                                    <select
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all cursor-pointer appearance-none"
                                    >
                                        <option value="EASY">LEVEL: EASY</option>
                                        <option value="MEDIUM">LEVEL: MEDIUM</option>
                                        <option value="HARD">LEVEL: HARD</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400  tracking-[0.2em] ml-1">Prompt / Reality Matrix</label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    required
                                    className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-slate-300 min-h-[200px] leading-relaxed"
                                />
                            </div>

                            <div className="flex justify-end gap-4 pt-6 border-t border-slate-50">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="px-8 py-4 border border-slate-200 text-slate-400 text-[10px] font-black  tracking-[0.2em] rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-10 py-4 bg-slate-900 text-white text-[10px] font-black  tracking-[0.2em] rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? "Calibrating..." : "Save Calibration"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    {/* Guidance Card */}
                    <div className="bg-orange-500 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-orange-100 relative overflow-hidden group">
                        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                        <h3 className="text-lg font-black  tracking-tight mb-6 relative z-10">Protocol maintenance</h3>
                        <div className="space-y-6 relative z-10">
                            {[
                                { icon: 'update', text: 'Regularly update prompts' },
                                { icon: 'verified', text: 'Verify difficulty alignment' },
                                { icon: 'history', text: 'Review usage metrics' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                                        <span className="material-icons-outlined text-lg">{item.icon}</span>
                                    </div>
                                    <span className="text-[10px] font-black  ">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Diagnostic Card */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm">
                        <h3 className="text-[10px] font-black text-slate-400   mb-6">Protocol Diagnostics</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                <span className="text-[10px] font-bold text-slate-400  ">Protocol ID</span>
                                <span className="text-[10px] font-black text-slate-900  ">SIM_{id as string}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                <span className="text-[10px] font-bold text-slate-400  ">Last Modified</span>
                                <span className="text-[10px] font-black text-slate-900  ">Just Now</span>
                            </div>
                            <div className="flex justify-between items-center py-3">
                                <span className="text-[10px] font-bold text-slate-400  ">Status</span>
                                <span className="text-[10px] font-black text-emerald-500  ">ACTIVE</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
