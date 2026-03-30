"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

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

    const fetchScenarios = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/enterprise/simulations/scenarios`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setScenarios(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/enterprise/employees/`, {
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/enterprise/simulations/scenarios/ai-generate`, {
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
            }
        } catch (error) {
            console.error("AI Generation Error:", error);
        } finally {
            setIsAiGenerating(false);
        }
    };

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const method = editingId ? 'PUT' : 'POST';
        const url = editingId 
            ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/enterprise/simulations/scenarios/${editingId}`
            : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/enterprise/simulations/scenarios`;

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
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this scenario?")) return;
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/enterprise/simulations/scenarios/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchScenarios();
        } catch (error) {
            console.error(error);
        }
    };

    const handleAssign = async () => {
        if (selectedEmployees.length === 0 || !isAssigningId) return;
        setAssigning(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/enterprise/simulations/assignments`, {
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
                alert("Successful assignment to team members!");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setAssigning(false);
        }
    };

    const toggleEmployeeSelection = (id: string) => {
        setSelectedEmployees(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700">
            <header className="flex justify-between items-center pb-8 border-b border-slate-100 uppercase tracking-widest whitespace-nowrap overflow-x-auto no-scrollbar gap-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/enterprise/dashboard')} className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center font-black">
                        <span className="material-symbols-rounded text-xl">arrow_back</span>
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">Scenario Architect</h1>
                        <p className="text-slate-500 font-black uppercase tracking-widest text-[9px] flex items-center gap-2">
                            <span className="material-symbols-rounded text-sm text-indigo-500">neurology</span>
                            Designing behavioral archetypes for organizational pulse
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/enterprise/ai-training/results')}
                        className="px-6 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-3"
                    >
                        <span className="material-symbols-rounded text-xl">analytics</span>
                        Performance Results
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
                        className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 shadow-2xl shadow-indigo-100/50"
                    >
                        <span className="material-symbols-rounded text-xl">add</span>
                        New Scenario
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {scenarios.map((sc) => (
                    <div key={sc.id} className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 p-8 flex flex-col gap-6 transition-all hover:border-indigo-100">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 font-black flex items-center justify-center border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <span className="material-symbols-rounded text-xl">psychology</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => {
                                        setEditingId(sc.id);
                                        setForm({...sc});
                                        setIsCreating(true);
                                    }}
                                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                    <span className="material-symbols-rounded text-lg">edit</span>
                                </button>
                                <button 
                                    onClick={() => handleDelete(sc.id)}
                                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                    <span className="material-symbols-rounded text-lg">delete</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500">{sc.category}</span>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">{sc.difficulty}</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2 uppercase group-hover:text-indigo-600 transition-colors">{sc.title}</h3>
                            <p className="text-sm text-slate-500 font-medium italic line-clamp-2 leading-relaxed">{sc.description || "Architectural behavioral training unit."}</p>
                        </div>
                        <button 
                            onClick={() => setIsAssigningId(sc.id)}
                            className="w-full py-4 bg-slate-50 text-slate-900 border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-3 shadow-sm group-hover:shadow-lg"
                        >
                            <span className="material-symbols-rounded text-lg">send</span>
                            Deploy to Team
                        </button>
                    </div>
                ))}
            </div>

            {/* Creation/Edit Drawer/Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200 p-8 lg:p-12 space-y-12">
                        <header className="flex justify-between items-center pb-8 border-b border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                                    <span className="material-symbols-rounded text-2xl font-black">{editingId ? 'edit_note' : 'architecture'}</span>
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                                    {editingId ? 'Refine Blueprint' : 'Scenario Blueprint'}
                                </h2>
                            </div>
                            <button onClick={() => { setIsCreating(false); setEditingId(null); }} className="text-slate-400 hover:text-rose-500 transition-colors">
                                <span className="material-symbols-rounded text-2xl font-black">close</span>
                            </button>
                        </header>

                        {!editingId && (
                            <section className="bg-indigo-50/50 p-8 rounded-[2rem] border border-indigo-100/50 space-y-6">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-rounded text-indigo-600 font-black">neurology</span>
                                    <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest leading-none">AI Magic Assistant</h3>
                                </div>
                                <div className="flex gap-3">
                                    <textarea 
                                        className="flex-1 px-6 py-4 bg-white border border-indigo-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none text-sm font-bold text-slate-700 transition-all placeholder:text-slate-300 min-h-[80px]"
                                        placeholder="Describe the scenario (e.g., 'Conflict over project delay') and let AI architect the logic..."
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                    />
                                    <button 
                                        type="button"
                                        onClick={handleAiGenerate}
                                        disabled={isAiGenerating || !aiPrompt.trim()}
                                        className="px-6 bg-indigo-600 text-white rounded-2xl hover:bg-slate-900 transition-all font-black text-[10px] uppercase tracking-widest flex flex-col items-center justify-center gap-2 min-w-[120px]"
                                    >
                                        <span className={`material-symbols-rounded text-2xl ${isAiGenerating ? 'animate-spin' : ''}`}>
                                            {isAiGenerating ? 'sync' : 'auto_fix'}
                                        </span>
                                        {isAiGenerating ? 'Architecting...' : 'AI Generate'}
                                    </button>
                                </div>
                            </section>
                        )}

                        <form onSubmit={handleAction} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Scenario Narrative</label>
                                <input 
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-100 transition-all"
                                    placeholder="e.g. Handling an Angry Direct Report"
                                    value={form.title}
                                    onChange={e => setForm({...form, title: e.target.value})}
                                    required
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <select 
                                        className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white transition-all"
                                        value={form.category}
                                        onChange={e => setForm({...form, category: e.target.value})}
                                    >
                                        <option value="CONFLICT">Conflict</option>
                                        <option value="SALES">Strategic Sales</option>
                                        <option value="LEADERSHIP">Leadership</option>
                                        <option value="EXIT_INTERVIEW">Exit Interview</option>
                                        <option value="CUSTOMER_SERVICE">Customer Service</option>
                                    </select>
                                    <select 
                                        className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white transition-all"
                                        value={form.difficulty}
                                        onChange={e => setForm({...form, difficulty: e.target.value})}
                                    >
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 group-hover:text-indigo-600 transition-colors">Character Persona</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <input 
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold text-slate-700 focus:bg-white transition-all"
                                        placeholder="Name: e.g. Jordan"
                                        value={form.character_name}
                                        onChange={e => setForm({...form, character_name: e.target.value})}
                                        required
                                    />
                                    <input 
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold text-slate-700 focus:bg-white transition-all"
                                        placeholder="Role: e.g. Manager"
                                        value={form.character_role}
                                        onChange={e => setForm({...form, character_role: e.target.value})}
                                        required
                                    />
                                </div>
                                <textarea 
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold text-slate-700 focus:bg-white transition-all min-h-[80px]"
                                    placeholder="Brief Description of Context..."
                                    value={form.description || ""}
                                    onChange={e => setForm({...form, description: e.target.value})}
                                />
                            </div>

                            <div className="md:col-span-2 space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Neural Logic (Instructions for AI)</label>
                                <textarea 
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold text-slate-700 focus:bg-white transition-all min-h-[150px]"
                                    placeholder="Instructions for how the character should act and push the user..."
                                    value={form.system_prompt}
                                    onChange={e => setForm({...form, system_prompt: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="md:col-span-2 space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Initial Protocol (Character's First Line)</label>
                                <input 
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold text-slate-700 focus:bg-white transition-all"
                                    placeholder="e.g. 'I'm really not happy with how this project is moving...'"
                                    value={form.initial_message}
                                    onChange={e => setForm({...form, initial_message: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="md:col-span-2 pt-8 flex border-t border-slate-100 justify-center">
                                <button 
                                    type="submit"
                                    disabled={submitting}
                                    className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all shadow-xl"
                                >
                                    {submitting ? 'Transmitting Data...' : (editingId ? 'Update Blueprint' : 'Deploy Scenario')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assignment Dialog */}
            {isAssigningId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
                        <header className="p-8 lg:p-10 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">Deploy Simulation</h2>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Select behavioral participants for strategic lab training</p>
                            </div>
                            <button onClick={() => setIsAssigningId(null)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                <span className="material-symbols-rounded text-2xl font-black">close</span>
                            </button>
                        </header>
                        
                        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-2 no-scrollbar">
                            {employees.map(emp => (
                                <div 
                                    key={emp.id} 
                                    onClick={() => toggleEmployeeSelection(emp.id)}
                                    className={`group p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                        selectedEmployees.includes(emp.id) 
                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-100' 
                                        : 'bg-white border-slate-100 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                                            selectedEmployees.includes(emp.id) ? 'bg-white/20' : 'bg-slate-900 text-white'
                                        }`}>
                                            {emp.first_name?.[0]}{emp.last_name?.[0]}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-black tracking-tight ${selectedEmployees.includes(emp.id) ? 'text-white' : 'text-slate-800'}`}>
                                                {emp.first_name} {emp.last_name}
                                            </p>
                                            <p className={`text-[9px] font-bold uppercase tracking-widest ${selectedEmployees.includes(emp.id) ? 'text-indigo-100' : 'text-slate-400'}`}>
                                                {emp.designation} • {emp.employee_id}
                                            </p>
                                        </div>
                                    </div>
                                    {selectedEmployees.includes(emp.id) && (
                                        <span className="material-symbols-rounded text-2xl font-black">check_circle</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        <footer className="p-8 border-t border-slate-100 flex flex-col gap-4">
                            <div className="flex justify-between items-center px-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Recipients</span>
                                <span className="text-sm font-black text-indigo-600">{selectedEmployees.length} Members</span>
                            </div>
                            <button 
                                onClick={handleAssign}
                                disabled={assigning || selectedEmployees.length === 0}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all shadow-xl disabled:opacity-20"
                            >
                                {assigning ? 'Broadcasting Protocol...' : 'Finalize Deployment'}
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
}
