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
    DraftingCompass
} from "lucide-react";
import ConfirmationModal from "@/components/common/ConfirmationModal";

export default function ScenarioManagement() {
    const { token } = useAuth();
    const router = useRouter();
    const [scenarios, setScenarios] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
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
                showToast("Neural blueprint generated.");
            }
        } catch (error) {
            console.error("AI Generation Error:", error);
            showToast("Neural link failed.", "error");
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
                showToast(editingId ? "Blueprint synchronized." : "Scenario deployed.");
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
                showToast("Scenario decommissioned.");
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
                showToast("Mission broadcast successful.");
            }
        } catch (error) {
            console.error(error);
            showToast("Broadcast failure.", "error");
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
                <div className="h-32 bg-slate-900 rounded-[2.5rem] relative overflow-hidden flex items-center px-10 border-b-4 border-slate-800 shadow-2xl shadow-indigo-100/10">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl animate-pulse" />
                        <div className="space-y-2">
                            <div className="w-48 h-6 bg-white/10 rounded-lg animate-pulse" />
                            <div className="w-32 h-3 bg-white/5 rounded-lg animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white h-64 rounded-[2.5rem] border border-slate-100 animate-pulse shadow-sm" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-12 max-w-7xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700 relative">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`fixed top-10 right-10 z-[500] px-6 py-4 rounded-2xl shadow-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 ${toast.type === "success" ? "bg-slate-900 text-white" : "bg-rose-500 text-white"}`}>
                        <span className="material-symbols-rounded text-lg text-emerald-400">{toast.type === "success" ? "verified" : "error"}</span>
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tactical Command Header */}
            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl border-b-4 border-slate-800"
            >
                <div className="relative z-10 flex items-center gap-8">
                    <button 
                        onClick={() => router.push('/enterprise/dashboard')} 
                        className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl hover:bg-white/10 transition-all active:scale-95 group shadow-inner"
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-white group-hover:-translate-x-1 transition-all" />
                    </button>
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                            <span className="text-[8px] font-black uppercase tracking-[0.1em] text-indigo-400">Architect Node Live</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter leading-none italic uppercase">Scenario Architect</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-3 opacity-60">Strategic Behavioral Logic Lab</p>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-3">
                    <button 
                        onClick={() => router.push('/enterprise/ai-training/results')}
                        className="h-14 px-8 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 active:scale-95 shadow-inner"
                    >
                        <BarChart3 className="w-5 h-5 text-indigo-400" />
                        Intelligence
                    </button>
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
                        className="px-8 h-14 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-400 hover:text-white transition-all active:scale-95 shadow-xl shadow-slate-900/50 flex items-center gap-3"
                    >
                        <Plus className="w-5 h-5" />
                        Add Scenario
                    </button>
                </div>

                {/* Tactical background elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -mr-64 -mt-64" />
                <div className="absolute bottom-0 left-0 w-64 h-1 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
            </motion.header>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {scenarios.map((sc) => (
                    <motion.div 
                        layout
                        key={sc.id} 
                        className="group bg-white rounded-[2.5rem] border border-slate-100 p-1.5 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="p-8 pb-4 space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                    <Brain className="w-6 h-6" />
                                </div>
                                <div className="flex gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                    <button 
                                        onClick={() => {
                                            setEditingId(sc.id);
                                            setForm({...sc});
                                            setIsCreating(true);
                                        }}
                                        className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                                    >
                                        <Edit3 className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => { setScenarioToDelete(sc.id); setIsDeleteModalOpen(true); }}
                                        className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50/50 border border-indigo-100/50 rounded-md">
                                        <span className="w-1 h-1 rounded-full bg-indigo-400" />
                                        <span className="text-[7.5px] font-black text-indigo-500 uppercase tracking-widest">{sc.category}</span>
                                    </div>
                                    <span className="text-[7.5px] font-black text-slate-300 uppercase tracking-widest tabular-nums italic">{sc.difficulty}</span>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tighter leading-none italic uppercase group-hover:text-indigo-600 transition-colors truncate">{sc.title}</h3>
                                <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight line-clamp-2 h-10 opacity-70 italic">
                                    {sc.description || "Operational parameters not specified for this mission."}
                                </p>
                            </div>
                        </div>
                        
                        <div className="px-8 py-5 flex items-center gap-4 bg-slate-50/50 border-t border-slate-50 rounded-b-[2.5rem]">
                            <button 
                                onClick={() => setIsAssigningId(sc.id)}
                                className="flex-1 h-12 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 group/btn"
                            >
                                <Play className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                Deploy Simulation
                            </button>
                        </div>
                    </motion.div>
                ))}
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
                                    <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-2xl rotate-3">
                                        <DraftingCompass className="w-8 h-8 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 tracking-tighter italic uppercase leading-none">{editingId ? "Refine Blueprint" : "Initialize Architect"}</h2>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2">Neural Scenario Design System</p>
                                    </div>
                                </div>
                                <button onClick={() => { setIsCreating(false); setEditingId(null); }} className="w-12 h-12 rounded-2xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Drawer Body - Scrollable */}
                            <div className="flex-1 overflow-y-auto px-10 py-10 space-y-12 no-scrollbar">
                                
                                {/* Neural Assistant HUD */}
                                {!editingId && (
                                    <div className="bg-slate-950 rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group/hud">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-50" />
                                        <div className="relative z-10 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Neural Generation Interface</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-4">
                                                <textarea 
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold text-white outline-none focus:bg-white/10 focus:border-indigo-400/50 transition-all placeholder:text-white/20 min-h-[100px] shadow-inner"
                                                    placeholder="CONCEPTUAL PROTOCOL: e.g. Negotiating a high-stakes neural supply line under crisis..."
                                                    value={aiPrompt}
                                                    onChange={(e) => setAiPrompt(e.target.value)}
                                                />
                                                <button 
                                                    onClick={handleAiGenerate}
                                                    disabled={isAiGenerating || !aiPrompt.trim()}
                                                    className="w-28 bg-white hover:bg-indigo-400 hover:text-white text-slate-950 rounded-2xl font-black text-[9px] uppercase tracking-widest flex flex-col items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-20 shadow-2xl"
                                                >
                                                    {isAiGenerating ? (
                                                        <div className="w-6 h-6 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                                                    ) : (
                                                        <Zap className="w-6 h-6" />
                                                    )}
                                                    {isAiGenerating ? "Architecting" : "Generate"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Main Form Inputs */}
                                <form id="architect-form" onSubmit={handleAction} className="space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3 group">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 group-focus-within:text-slate-900 transition-colors">Scenario Narrative Tag</label>
                                            <input 
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-800 outline-none focus:bg-white focus:border-slate-900 transition-all shadow-inner"
                                                placeholder="E.G. CRISIS_NEGOTIATION_ALPHA"
                                                value={form.title}
                                                onChange={e => setForm({...form, title: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-3 group">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 group-focus-within:text-slate-900 transition-colors">Mission Difficulty Locking</label>
                                            <select 
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-[10px] font-black text-slate-800 uppercase tracking-widest outline-none focus:bg-white focus:border-slate-900 transition-all shadow-inner"
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
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 group-focus-within:text-slate-900 transition-colors">Participant Role & Persona Identification</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input 
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-800 outline-none focus:bg-white focus:border-slate-900 transition-all shadow-inner"
                                                placeholder="NAME: JORDAN_X"
                                                value={form.character_name}
                                                onChange={e => setForm({...form, character_name: e.target.value})}
                                                required
                                            />
                                            <input 
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-800 outline-none focus:bg-white focus:border-slate-900 transition-all shadow-inner"
                                                placeholder="ROLE: SENIOR_OPERATIVE"
                                                value={form.character_role}
                                                onChange={e => setForm({...form, character_role: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3 group">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 group-focus-within:text-slate-900 transition-colors">Neural Logic Processing Instructions</label>
                                        <textarea 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-6 py-6 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-900 transition-all min-h-[150px] shadow-inner leading-relaxed"
                                            placeholder="ESTABLISH CONTEXTUAL PROTOCOLS: Instruct the character to push participant boundaries in specific behavioral vectors..."
                                            value={form.system_prompt}
                                            onChange={e => setForm({...form, system_prompt: e.target.value})}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-3 group">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 group-focus-within:text-slate-900 transition-colors">Initial Protocol Line</label>
                                        <input 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-800 outline-none focus:bg-white focus:border-slate-900 transition-all shadow-inner italic"
                                            placeholder="'I don't think we have the neural capacity for this delay...'"
                                            value={form.initial_message}
                                            onChange={e => setForm({...form, initial_message: e.target.value})}
                                            required
                                        />
                                    </div>
                                </form>
                            </div>

                            {/* Drawer Footer */}
                            <div className="p-10 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between gap-6 shrink-0">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none max-w-[200px]">By deploying, you synchronize this blueprint across the neural lab.</p>
                                <button 
                                    form="architect-form"
                                    type="submit"
                                    disabled={submitting}
                                    className="px-10 h-14 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all active:scale-95 shadow-2xl flex items-center gap-3"
                                >
                                    {submitting && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                                    {submitting ? 'Transmitting' : editingId ? 'Update Node' : 'Deploy Deployment'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Deletion confirmation handled locally by standard modal pattern */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Decommission Scenario?"
                message="Are you sure you want to permanently wipe this neural scenario? This action is irreversible and all associated training artifacts will be archived."
                confirmLabel="Yes, Decommission"
                cancelLabel="No"
                isDestructive={true}
            />

            {/* Deployment Overlay - To be standardized next */}
            <AnimatePresence>
                {isAssigningId && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 sm:p-12 overflow-hidden">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsAssigningId(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-[4rem] w-full max-w-2xl max-h-full overflow-hidden shadow-2xl flex flex-col border border-slate-100">
                             <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase italic">Mission Deployment</h2>
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Strategic participant selection</p>
                                </div>
                                <X className="w-8 h-8 text-slate-300 cursor-pointer hover:text-rose-500 transition-colors" onClick={() => setIsAssigningId(null)} />
                             </div>
                             <div className="flex-1 overflow-y-auto p-10 space-y-3 no-scrollbar">
                                {employees.map(emp => (
                                    <div 
                                        key={emp.id} 
                                        onClick={() => toggleEmployeeSelection(emp.id)}
                                        className={`group p-5 rounded-[2rem] border transition-all cursor-pointer flex items-center justify-between ${
                                            selectedEmployees.includes(emp.id) 
                                            ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-[1.02]' 
                                            : 'bg-white border-slate-100 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
                                                selectedEmployees.includes(emp.id) ? 'bg-white/10' : 'bg-slate-50 text-indigo-600'
                                            }`}>
                                                {emp.first_name?.[0]}{emp.last_name?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black tracking-tighter uppercase italic">{emp.first_name} {emp.last_name}</p>
                                                <p className={`text-[8px] font-black uppercase tracking-widest mt-1 ${selectedEmployees.includes(emp.id) ? 'text-slate-400' : 'text-slate-300'}`}>
                                                    {emp.designation} • {emp.id.slice(0,8)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
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
                                    className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all shadow-2xl disabled:opacity-30 active:scale-95 flex items-center justify-center gap-4"
                                >
                                    {assigning && <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                                    {assigning ? 'Propagating Proto' : 'Broadcast Mission'}
                                </button>
                             </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
