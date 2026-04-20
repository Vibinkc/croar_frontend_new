"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Zap, 
    ArrowLeft, 
    BarChart3, 
    Plus, 
    Minus, 
    Play, 
    Edit3, 
    Trash2, 
    X, 
    Sparkles,
    Brain,
    DraftingCompass,
    RefreshCcw
} from "lucide-react";
import ConfirmationModal from "@/components/common/ConfirmationModal";

export default function ScenarioManagement() {
    const { token, canAccess, role } = useAuth();
    const router = useRouter();
    const [scenarios, setScenarios] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const filteredScenarios = scenarios.filter(sc => 
        (statusFilter === "all" || sc.difficulty === statusFilter) &&
        (sc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
         sc.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    
    // Deletion Consistency
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [scenarioToDelete, setScenarioToDelete] = useState<string | null>(null);

    // Assignment State
    const [isAssigningId, setIsAssigningId] = useState<string | null>(null);
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [assigning, setAssigning] = useState(false);

    const [form, setForm] = useState({
        title: "",
        description: "",
        category: "CONFLICT",
        character_name: "",
        character_role: "",
        system_prompt: "",
        initial_message: "",
        difficulty: "Intermediate"
    });

    useEffect(() => {
        if (token) {
            fetchScenarios();
            fetchEmployees();
        }
    }, [token]);

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchScenarios = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/simulations/scenarios`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setScenarios(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setTimeout(() => setLoading(false), 600);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/employees/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setEmployees(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) return;
        setIsAiGenerating(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/simulations/scenarios/ai-generate`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: aiPrompt })
            });
            const data = await res.json();
            if (res.ok) {
                setForm({
                    title: data.title,
                    description: data.description,
                    category: data.category,
                    character_name: data.character_name,
                    character_role: data.character_role,
                    system_prompt: data.system_prompt,
                    initial_message: data.initial_message,
                    difficulty: data.difficulty
                });
                setAiPrompt("");
                showToast("Scenario generated.");
            }
        } catch (error) {
            console.error("AI Generation Error:", error);
            showToast("Generation failed.", "error");
        } finally {
            setIsAiGenerating(false);
        }
    };

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const method = editingId ? 'PUT' : 'POST';
        const url = editingId 
            ? `${BACKEND_URL}/api/v1/enterprise/simulations/scenarios/${editingId}`
            : `${BACKEND_URL}/api/v1/enterprise/simulations/scenarios`;

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setIsCreating(false);
                setEditingId(null);
                fetchScenarios();
                showToast(editingId ? "Scenario updated." : "Scenario saved.");
            }
        } catch (error) {
            console.error(error);
            showToast("Server sync error.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!scenarioToDelete) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/simulations/scenarios/${scenarioToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                showToast("Scenario deleted.");
                fetchScenarios();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsDeleteModalOpen(false);
            setScenarioToDelete(null);
        }
    };

    const handleAssign = async () => {
        if (selectedEmployees.length === 0 || !isAssigningId) return;
        setAssigning(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/simulations/assignments`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    scenario_id: isAssigningId,
                    employee_ids: selectedEmployees
                })
            });
            if (res.ok) {
                setIsAssigningId(null);
                setSelectedEmployees([]);
                showToast("Assignment successful.");
            }
        } catch (error) {
            console.error(error);
            showToast("Assignment failed.", "error");
        } finally {
            setAssigning(false);
        }
    };

    const toggleEmployeeSelection = (id: string) => {
        setSelectedEmployees(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    if (loading) {
        return (
            <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
                <div className="h-32 bg-slate-900 rounded-2xl relative overflow-hidden flex items-center px-10 border-b-4 border-slate-800 shadow-2xl shadow-indigo-100/10">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/5 rounded-xl animate-pulse" />
                        <div className="space-y-2">
                            <div className="w-48 h-6 bg-white/10 rounded-xl animate-pulse" />
                            <div className="w-32 h-3 bg-white/5 rounded-xl animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white h-64 rounded-2xl border border-slate-100 animate-pulse shadow-sm" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-5 max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-700 relative">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`fixed top-10 right-10 z-[500] px-6 py-4 rounded-xl shadow-2xl font-black text-[10px]  tracking-[0.2em] flex items-center gap-3 ${toast.type === "success" ? "bg-slate-900 text-white" : "bg-rose-500 text-white"}`}>
                        <span className="material-symbols-rounded text-lg text-emerald-400">{toast.type === "success" ? "verified" : "error"}</span>
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl border border-slate-100 p-2 shadow-lg shadow-slate-200/20">
                <div className="flex items-center gap-3 px-2">
                    <button 
                        onClick={() => router.push('/enterprise/dashboard')} 
                        className="w-9 h-9 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="w-9 h-9 bg-violet-50 text-[#7C3AED] rounded-xl flex items-center justify-center">
                        <span className="material-symbols-rounded">architecture</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 tracking-tight">Scenario Configuration</h1>
                        <p className="text-slate-500 text-[10px] font-medium   ">Training Scenario Design</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => router.push('/enterprise/ai-training/results')}
                        className="px-4 py-2 text-slate-500 hover:text-slate-900 transition-all font-black text-[9px]   flex items-center gap-2"
                    >
                        <BarChart3 className="w-4 h-4" />
                        Intelligence
                    </button>
                    {(canAccess("scenarios:moderate") || role === "ADMIN") && (
                        <button 
                            onClick={() => {
                                setEditingId(null);
                                setForm({
                                    title: "", description: "", category: "CONFLICT", 
                                    character_name: "", character_role: "", 
                                    system_prompt: "", initial_message: "", 
                                    difficulty: "Intermediate"
                                });
                                setIsCreating(true);
                            }}
                            className="px-6 py-2.5 bg-[#7C3AED] text-white rounded-xl hover:bg-[#6D28D9] transition-all font-black text-[9px]   flex items-center gap-2 shadow-xl shadow-indigo-100"
                        >
                            <span className="material-symbols-rounded text-base">add</span>
                            New Scenario
                        </button>
                    )}
                    <button 
                        onClick={fetchScenarios}
                        className="w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-[#7C3AED] hover:bg-slate-50 hover:border-violet-100 transition-all flex items-center justify-center shadow-sm"
                    >
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 relative w-full group">
                    <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg transition-colors group-focus-within:text-[#7C3AED]">search</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search scenarios by title or category..."
                        className="w-full h-12 bg-white border border-slate-100 rounded-xl pl-12 pr-4 text-[13px] font-bold text-slate-700 placeholder:text-slate-400 focus:border-[#7C3AED] focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none shadow-sm"
                    />
                </div>
                
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm min-w-[200px]">
                    <span className="material-symbols-rounded text-slate-400 ml-2 text-lg">filter_list</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-transparent border-none text-[11px] font-black text-slate-700 focus:outline-none focus:ring-0 cursor-pointer uppercase tracking-wider"
                    >
                        <option value="all">All Difficulties</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                    </select>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredScenarios.length > 0 ? filteredScenarios.map((sc) => (
                    <motion.div 
                        layout
                        key={sc.id} 
                        className="bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm relative overflow-hidden"
                    >
                        <div className="p-8 pb-4 space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 bg-[#7C3AED] text-white rounded-xl flex items-center justify-center shadow-sm">
                                    <Brain className="w-6 h-6" />
                                </div>
                                <div className="flex items-center gap-1">
                                    {(canAccess("scenarios:moderate") || role === "ADMIN") && (
                                        <button 
                                            onClick={() => {
                                                setEditingId(sc.id);
                                                setForm({...sc});
                                                setIsCreating(true);
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                                        >
                                            <span className="material-symbols-rounded text-[20px]">edit</span>
                                        </button>
                                    )}
                                    {(canAccess("scenarios:delete") || role === "ADMIN") && (
                                        <button 
                                            onClick={() => { setScenarioToDelete(sc.id); setIsDeleteModalOpen(true); }}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                                        >
                                            <span className="material-symbols-rounded text-[20px]">delete</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-violet-50 border border-violet-100 rounded-lg">
                                        <span className="w-1 h-1 rounded-full bg-[#7C3AED]" />
                                        <span className="text-[8px] font-black text-[#7C3AED] uppercase tracking-widest">{sc.category}</span>
                                    </div>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{sc.difficulty}</span>
                                </div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight line-clamp-1">{sc.title}</h3>
                                <p className="text-[10px] font-medium text-slate-500 leading-relaxed tracking-tight line-clamp-2 h-10">
                                    {sc.description || "Experimental training framework for advanced skill acquisition."}
                                </p>
                            </div>
                        </div>
                        
                        {(canAccess("scenarios:moderate") || role === "ADMIN") && (
                            <div className="px-8 py-5 flex items-center gap-4 bg-slate-50/50 border-t border-slate-50 rounded-b-2xl">
                                <button 
                                    onClick={() => setIsAssigningId(sc.id)}
                                    className="flex-1 h-11 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 group/btn"
                                >
                                    <Play className="w-3.5 h-3.5" />
                                    Assign Scenario
                                </button>
                            </div>
                        )}
                    </motion.div>
                )) : (
                    <div className="col-span-full py-32 text-center bg-white rounded-2xl border border-dashed border-slate-100">
                        <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-rounded text-4xl text-slate-200">psychology</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">No Scenarios Detected</h3>
                        <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto mt-2">Initialize a new simulation framework or use the AI Neural Assistant to generate one.</p>
                    </div>
                )}
            </div>

            {/* Blueprint Drawer */}
            <AnimatePresence>
                {isCreating && (
                    <div className="fixed inset-0 z-[200] flex justify-end overflow-hidden">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => { setIsCreating(false); setEditingId(null); }} />
                        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col pointer-events-auto border-l border-slate-100">
                            
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between px-10 py-8 border-b border-slate-50 shrink-0">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-xl bg-slate-900 flex items-center justify-center shadow-2xl">
                                        <DraftingCompass className="w-8 h-8 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 tracking-tighter   leading-none">{editingId ? "Edit Scenario" : "New Scenario"}</h2>
                                        <p className="text-[10px] font-black text-slate-300   mt-2">Scenario Design System</p>
                                    </div>
                                </div>
                                <button onClick={() => { setIsCreating(false); setEditingId(null); }} className="w-12 h-12 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Drawer Body - Scrollable */}
                            <div className="flex-1 overflow-y-auto px-10 py-10 space-y-12 no-scrollbar">
                                
                                {/* Neural Assistant HUD */}
                                {!editingId && (canAccess("scenarios:moderate") || role === "ADMIN") && (
                                    <div className="bg-slate-950 rounded-2xl p-8 border border-white/5 relative overflow-hidden group/hud">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-50" />
                                        <div className="relative z-10 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                                                    <span className="text-[10px] font-black text-indigo-400  tracking-[0.3em]">AI Generation Interface</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-4">
                                                <textarea 
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-6 py-5 text-sm font-bold text-white outline-none focus:bg-white/10 focus:border-indigo-400/50 transition-all placeholder:text-white/20 min-h-[100px] shadow-inner"
                                                    placeholder="CONCEPT: e.g. Negotiating a high-stakes supply line under crisis..."
                                                    value={aiPrompt}
                                                    onChange={(e) => setAiPrompt(e.target.value)}
                                                />
                                                <button 
                                                    onClick={handleAiGenerate}
                                                    disabled={isAiGenerating || !aiPrompt.trim()}
                                                    className="w-28 bg-white hover:bg-indigo-400 hover:text-white text-slate-950 rounded-xl font-black text-[9px]   flex flex-col items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-20 shadow-2xl"
                                                >
                                                    {isAiGenerating ? (
                                                        <div className="w-6 h-6 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                                                    ) : (
                                                        <Zap className="w-6 h-6" />
                                                    )}
                                                    {isAiGenerating ? "Generating" : "Generate"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Main Form Inputs */}
                                <form id="architect-form" onSubmit={handleAction} className="space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3 group">
                                            <label className="text-[10px] font-black text-slate-400  tracking-[0.2em] ml-2 group-focus-within:text-slate-900 transition-colors">Scenario Title</label>
                                            <input 
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 text-sm font-black text-slate-800 outline-none focus:bg-white focus:border-slate-900 transition-all shadow-inner"
                                                placeholder="e.g. Crisis Negotiation Alpha"
                                                value={form.title}
                                                onChange={e => setForm({...form, title: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-3 group">
                                            <label className="text-[10px] font-black text-slate-400  tracking-[0.2em] ml-2 group-focus-within:text-slate-900 transition-colors">Difficulty Level</label>
                                            <select 
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 text-[10px] font-black text-slate-800   outline-none focus:bg-white focus:border-slate-900 transition-all shadow-inner"
                                                value={form.difficulty}
                                                onChange={e => setForm({...form, difficulty: e.target.value})}
                                            >
                                                <option value="Beginner">Level_01: Beginner</option>
                                                <option value="Intermediate">Level_02: Intermediate</option>
                                                <option value="Advanced">Level_03: Advanced</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-3 group">
                                        <label className="text-[10px] font-black text-slate-400  tracking-[0.2em] ml-2 group-focus-within:text-slate-900 transition-colors">Participant Role & Persona</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input 
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 text-sm font-black text-slate-800 outline-none focus:bg-white focus:border-slate-900 transition-all shadow-inner"
                                                placeholder="Name: Jordan X"
                                                value={form.character_name}
                                                onChange={e => setForm({...form, character_name: e.target.value})}
                                                required
                                            />
                                            <input 
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 text-sm font-black text-slate-800 outline-none focus:bg-white focus:border-slate-900 transition-all shadow-inner"
                                                placeholder="Role: Senior Operative"
                                                value={form.character_role}
                                                onChange={e => setForm({...form, character_role: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3 group">
                                        <label className="text-[10px] font-black text-slate-400  tracking-[0.2em] ml-2 group-focus-within:text-slate-900 transition-colors">System Prompt Instructions</label>
                                        <textarea 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-6 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-900 transition-all min-h-[150px] shadow-inner leading-relaxed"
                                            placeholder="Provide instructions for the AI character..."
                                            value={form.system_prompt}
                                            onChange={e => setForm({...form, system_prompt: e.target.value})}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-3 group">
                                        <label className="text-[10px] font-black text-slate-400  tracking-[0.2em] ml-2 group-focus-within:text-slate-900 transition-colors">Initial Message</label>
                                        <input 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 text-sm font-black text-slate-800 outline-none focus:bg-white focus:border-slate-900 transition-all shadow-inner "
                                            placeholder="'I don't think we have the capacity for this delay...'"
                                            value={form.initial_message}
                                            onChange={e => setForm({...form, initial_message: e.target.value})}
                                            required
                                        />
                                    </div>
                                </form>
                            </div>

                             {/* Drawer Footer */}
                             {(canAccess("scenarios:moderate") || role === "ADMIN") && (
                                <div className="p-10 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between gap-6 shrink-0">
                                    <p className="text-[9px] font-black text-slate-300   leading-none max-w-[200px]">Save this scenario to make it available for training.</p>
                                    <button 
                                        form="architect-form"
                                        type="submit"
                                        disabled={submitting}
                                        className="px-10 h-14 bg-[#7C3AED] text-white rounded-xl font-black text-[10px]  tracking-[0.3em] hover:bg-[#6D28D9] transition-all active:scale-95 shadow-2xl flex items-center gap-3"
                                    >
                                        {submitting && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                                        {submitting ? 'Saving' : editingId ? 'Update Scenario' : 'Save Scenario'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Deletion confirmation handled locally by standard modal pattern */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Scenario?"
                message="Are you sure you want to permanently delete this scenario? This action is irreversible."
                confirmLabel="Yes, Delete"
                cancelLabel="No"
                isDestructive={true}
            />

            {/* Deployment Overlay - To be standardized next */}
            <AnimatePresence>
                {isAssigningId && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 sm:p-12 overflow-hidden">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsAssigningId(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-2xl w-full max-w-2xl max-h-full overflow-hidden shadow-2xl flex flex-col border border-slate-100">
                             <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight   ">Assign Scenario</h2>
                                    <p className="text-[10px] font-black text-indigo-500   mt-1">Select participants</p>
                                </div>
                                <X className="w-8 h-8 text-slate-300 cursor-pointer hover:text-rose-500 transition-colors" onClick={() => setIsAssigningId(null)} />
                             </div>
                             <div className="flex-1 overflow-y-auto p-10 space-y-3 no-scrollbar">
                                {employees.map(emp => (
                                    <div 
                                        key={emp.id} 
                                        onClick={() => toggleEmployeeSelection(emp.id)}
                                        className={`group p-5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                            selectedEmployees.includes(emp.id) 
                                            ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-[1.02]' 
                                            : 'bg-white border-slate-100 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${
                                                selectedEmployees.includes(emp.id) ? 'bg-white/10' : 'bg-slate-50 text-indigo-600'
                                            }`}>
                                                {emp.first_name?.[0]}{emp.last_name?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black tracking-tighter  ">{emp.first_name} {emp.last_name}</p>
                                                <p className={`text-[8px] font-black   mt-1 ${selectedEmployees.includes(emp.id) ? 'text-slate-400' : 'text-slate-300'}`}>
                                                    {emp.designation} • {emp.id.slice(0,8)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${
                                            selectedEmployees.includes(emp.id) ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-200'
                                        }`}>
                                            {selectedEmployees.includes(emp.id) && <Plus className="w-4 h-4 rotate-45" />}
                                        </div>
                                    </div>
                                ))}
                             </div>
                             <div className="p-10 border-t border-slate-50 bg-slate-50/30">
                                <button 
                                    onClick={handleAssign}
                                    disabled={assigning || selectedEmployees.length === 0}
                                    className="w-full h-16 bg-[#7C3AED] text-white rounded-xl font-black text-[11px]  tracking-[0.3em] hover:bg-[#6D28D9] transition-all shadow-2xl disabled:opacity-30 active:scale-95 flex items-center justify-center gap-4"
                                >
                                    {assigning && <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                                    {assigning ? 'Assigning' : 'Assign Scenario'}
                                </button>
                             </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
