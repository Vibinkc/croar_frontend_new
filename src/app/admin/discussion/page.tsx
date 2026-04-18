"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { apiClient } from "@/utils/api";
import { useDivision } from "@/context/DivisionContext";
import AIGenerationOverlay from "@/components/ui/AIGenerationOverlay";
import HierarchyDrilldown from "@/components/admin/HierarchyDrilldown";

interface Discussion {
    id: number;
    topic: string;
    description: string;
    status: string;
    duration: number; // seconds
    created_at: string;
}

export default function AdminDiscussionPage() {
    return (
        <HierarchyDrilldown
            title="GD Management"
            description="Monitor & orchestrate AI Group Discussion sessions and evaluation protocols."
            renderContent={(divisionId, departmentId) => (
                <DiscussionList divisionId={divisionId} departmentId={departmentId} />
            )}
        />
    );
}

function DiscussionList({ divisionId, departmentId }: { divisionId: number | null, departmentId: number | null }) {
    const { selectedBatch } = useDivision();
    const [discussions, setDiscussions] = useState<Discussion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newGD, setNewGD] = useState({ topic: "", description: "", duration: 5 });
    const [editGD, setEditGD] = useState<Discussion | null>(null);
    const [isGeneratingGD, setIsGeneratingGD] = useState(false);

    useEffect(() => {
        fetchDiscussions();
    }, [divisionId, departmentId]);

    const fetchDiscussions = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (divisionId) params.append("division_id", divisionId.toString());
            if (departmentId) params.append("department_id", departmentId.toString());

            const response = await apiClient.get(`/api/v1/discussion/active?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setDiscussions(data);
            }
        } catch (error) {
            console.error("Failed to fetch discussions", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateGD = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await apiClient.post(`/api/v1/discussion/create`, {
                ...newGD,
                department_id: departmentId, // Use currently selected department
                batch: selectedBatch || null
            });
            if (response.ok) {
                setShowCreateModal(false);
                fetchDiscussions();
                setNewGD({ topic: "", description: "", duration: 5 });
            } else {
                alert("Failed to create session. Please check your inputs.");
            }
        } catch (error) {
            console.error("Failed to create GD", error);
            alert("Error creating session.");
        }
    };

    const handleGenerateGD = async () => {
        setIsGeneratingGD(true);
        try {
            const response = await apiClient.post(`/api/v1/discussion/generate-topic`, {
                topic_hint: newGD.topic
            });
            if (response.ok) {
                const data = await response.json();
                setNewGD(prev => ({
                    ...prev,
                    topic: data.topic,
                    description: data.description
                }));
            } else {
                alert("Failed to generate topic");
            }
        } catch (error) {
            console.error("Error generating GD topic:", error);
        } finally {
            setIsGeneratingGD(false);
        }
    };

    const handleEditGD = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editGD) return;
        try {
            const response = await apiClient.put(`/api/v1/discussion/${editGD.id}`, {
                topic: editGD.topic,
                description: editGD.description,
                duration: editGD.duration / 60 // Backend expects minutes in put? Check backend... DiscussionCreate schema has duration: int = 5 (minutes). new_session stores duration * 60
            });
            if (response.ok) {
                setShowEditModal(false);
                fetchDiscussions();
                setEditGD(null);
            }
        } catch (error) {
            console.error("Failed to update GD", error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this discussion session?")) return;
        try {
            const response = await apiClient.delete(`/api/v1/discussion/${id}`);
            if (response.ok) {
                setDiscussions(prev => prev.filter(gd => gd.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete GD", error);
        }
    };

    return (
        <div className="space-y-8">
            <AIGenerationOverlay isOpen={isGeneratingGD} title="Orchestrating Discussion" />

            <div className="flex justify-end items-center">
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="group bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg translate-y-0 hover:-translate-y-0.5"
                >
                    <span className="material-icons-outlined text-base group-hover:rotate-90 transition-transform">add</span>
                    <span className="text-[10px] font-black  ">New Session</span>
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-20">
                    <div className="w-10 h-10 border-4 border-indigo-50 border-t-[var(--color-primary)] rounded-full animate-spin mb-4"></div>
                    <p className="text-[10px] font-black   text-slate-400 tracking-[0.3em]">Scanning_Nodes</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {discussions.map((gd) => (
                        <div key={gd.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 flex flex-col group hover:shadow-xl hover:border-slate-300 transition-all duration-300 overflow-hidden relative">
                            {/* Decorative Icon */}
                            <div className="absolute top-0 right-0 p-5 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                <span className="material-icons-outlined text-7xl">groups</span>
                            </div>

                            <div className="flex items-start justify-between mb-4 relative z-10">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all duration-300">
                                    <span className="material-icons-outlined text-xl">forum</span>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black   border bg-slate-50 text-slate-600 border-slate-100`}>
                                    {gd.status}
                                </span>
                            </div>

                            <div className="flex-1 mb-5 relative z-10">
                                <h3 className="text-sm font-black text-slate-900  tracking-tight mb-2 line-clamp-1">{gd.topic}</h3>
                                <p className="text-[10px] font-medium text-slate-400 line-clamp-3 leading-relaxed  mb-3">
                                    "{gd.description || "No session context provided."}"
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center text-[9px] font-black text-slate-400  ">
                                        <span className="material-icons-outlined text-xs mr-1 text-slate-500">timer</span>
                                        {gd.duration ? Math.round(gd.duration / 60) : "5"} MINS
                                    </div>
                                    <div className="flex items-center text-[9px] font-black text-slate-400  ">
                                        <span className="material-icons-outlined text-xs mr-1 text-slate-500">calendar_today</span>
                                        {gd.created_at ? format(new Date(gd.created_at), "MMM d, yyyy") : "N/A"}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-50 relative z-10">
                                <Link
                                    href={`/admin/discussion/${gd.id}`}
                                    className="flex-1 bg-slate-50 hover:bg-[var(--color-primary)] hover:text-white text-slate-500 py-2.5 rounded-xl text-[9px] font-black   flex items-center justify-center gap-2 transition-all duration-300 shadow-sm"
                                >
                                    <span className="material-icons-outlined text-sm">leaderboard</span>
                                    Leaderboard
                                </Link>
                                <button
                                    onClick={() => { setEditGD(gd); setShowEditModal(true); }}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-[var(--color-primary)] hover:text-white transition-all duration-300 shadow-sm"
                                    title="Edit Session"
                                >
                                    <span className="material-icons-outlined text-base">edit_note</span>
                                </button>
                                <button
                                    onClick={() => handleDelete(gd.id)}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-[var(--color-primary)] hover:text-white transition-all duration-300 shadow-sm"
                                    title="Purge Session"
                                >
                                    <span className="material-icons-outlined text-base">delete_sweep</span>
                                </button>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-slate-300 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-indigo-50/10 transition-all duration-300 group cursor-pointer min-h-[250px]"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 group-hover:bg-[var(--color-primary)] group-hover:text-white flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110">
                            <span className="material-icons-outlined text-2xl group-hover:rotate-90 transition-transform">add</span>
                        </div>
                        <span className="text-[10px] font-black  tracking-[0.2em]">Deploy_New_Session</span>
                    </button>
                </div>
            )}

            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 animate-in zoom-in-95 fade-in duration-200">
                        <h3 className="text-lg font-black text-slate-900  tracking-tight mb-5">Create GD Session</h3>
                        <form onSubmit={handleCreateGD} className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-[9px] font-black text-slate-400  ">Topic / Question</label>
                                    <button
                                        type="button"
                                        onClick={handleGenerateGD}
                                        disabled={isGeneratingGD}
                                        className="text-[9px] font-black  text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] flex items-center gap-1 disabled:opacity-50"
                                    >
                                        <span className={`material-symbols-rounded text-xs ${isGeneratingGD ? 'animate-spin' : ''}`}>
                                            {isGeneratingGD ? 'progress_activity' : 'auto_awesome'}
                                        </span>
                                        {isGeneratingGD ? 'Gen...' : 'AI Gen'}
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="w-full h-10 px-4 rounded-xl border border-slate-200 focus:border-[var(--color-primary)] focus:outline-none transition-all font-bold text-xs text-black"
                                    placeholder="e.g. AI in Education"
                                    value={newGD.topic}
                                    onChange={(e) => setNewGD({ ...newGD, topic: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-slate-400   mb-1.5">Description (Context)</label>
                                <textarea
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-[var(--color-primary)] focus:outline-none transition-all font-medium min-h-[80px] text-xs text-black"
                                    placeholder="Brief background for the discussion..."
                                    value={newGD.description}
                                    onChange={(e) => setNewGD({ ...newGD, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-slate-400   mb-1.5">Duration (minutes)</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max="60"
                                    className="w-full h-10 px-4 rounded-xl border border-slate-200 focus:border-[var(--color-primary)] focus:outline-none transition-all font-bold text-xs text-black"
                                    value={newGD.duration}
                                    onChange={(e) => setNewGD({ ...newGD, duration: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="flex gap-3 pt-3 border-t border-slate-50 mt-5">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 h-10 bg-slate-50 text-slate-400 rounded-xl font-black   text-[9px] hover:bg-slate-100 transition-all"
                                >
                                    Discard
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 h-10 bg-[var(--color-primary)] text-white rounded-xl font-black   text-[9px] hover:bg-[var(--color-primary-dark)] transition-all shadow-lg shadow-indigo-100"
                                >
                                    Initialize Session
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditModal && editGD && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 animate-in zoom-in-95 fade-in duration-200">
                        <h3 className="text-lg font-black text-slate-900  tracking-tight mb-5">Edit GD Session</h3>
                        <form onSubmit={handleEditGD} className="space-y-4">
                            <div>
                                <label className="block text-[9px] font-black text-slate-400   mb-1.5">Topic / Question</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full h-10 px-4 rounded-xl border border-slate-200 focus:border-[var(--color-primary)] focus:outline-none transition-all font-bold text-xs text-black"
                                    value={editGD.topic}
                                    onChange={(e) => setEditGD({ ...editGD, topic: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-slate-400   mb-1.5">Description (Context)</label>
                                <textarea
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-[var(--color-primary)] focus:outline-none transition-all font-medium min-h-[80px] text-xs text-black"
                                    value={editGD.description}
                                    onChange={(e) => setEditGD({ ...editGD, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-slate-400   mb-1.5">Duration (minutes)</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max="60"
                                    className="w-full h-10 px-4 rounded-xl border border-slate-200 focus:border-[var(--color-primary)] focus:outline-none transition-all font-bold text-xs text-black"
                                    value={editGD.duration ? Math.round(editGD.duration / 60) : 5}
                                    onChange={(e) => setEditGD({ ...editGD, duration: parseInt(e.target.value) * 60 })}
                                />
                            </div>
                            <div className="flex gap-3 pt-3 border-t border-slate-50 mt-5">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setEditGD(null); }}
                                    className="flex-1 h-10 bg-slate-50 text-slate-400 rounded-xl font-black   text-[9px] hover:bg-slate-100 transition-all"
                                >
                                    Discard
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 h-10 bg-[var(--color-primary)] text-white rounded-xl font-black   text-[9px] hover:bg-[var(--color-primary-dark)] transition-all shadow-lg shadow-indigo-100"
                                >
                                    Update Protocol
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
