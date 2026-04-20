"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SimulationChat from "@/app/enterprise/components/SimulationChat";
import { BACKEND_URL } from "@/utils/api";

interface Assessment {
    id: string;
    ratee_name: string;
    relation: string;
}

interface Survey {
    id: string;
    instance_name: string;
    template_title: string;
    token: string;
}

interface SimulationAssignment {
    id: string;
    scenario_id: string;
    title: string;
    description: string;
    character: string;
}

interface Employee {
    id: string;
    first_name: string;
}

export default function UnifiedEmployeePortal() {
    const router = useRouter();
    const [step, setStep] = useState<'login' | 'list'>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const [credentials, setCredentials] = useState({
        employee_id: "",
        email: ""
    });
    
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [simulationAssignments, setSimulationAssignments] = useState<SimulationAssignment[]>([]);
    const [employee, setEmployee] = useState<Employee | null>(null);

    // Simulation Session State
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError("");
        
        const trimmedId = credentials.employee_id.trim();
        const trimmedEmail = credentials.email.trim();
        
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/surveys/portal/login?employee_id=${trimmedId}&email=${trimmedEmail}`, {
                method: 'POST'
            });
            const data = await res.json();
            if (res.ok) {
                setEmployee(data.employee);
                setAssessments(data.x360_assignments || []);
                setSurveys(data.survey_invites || []);
                setSimulationAssignments(data.simulation_assignments || []);
                setStep('list');
            } else {
                setError(data.detail || "Invalid ID or Email. Please check and try again.");
            }
        } catch (err) {
            setError("Connection error. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const startSimulation = async (scenarioId: string, assignmentId: string) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/simulations/sessions`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    scenario_id: scenarioId,
                    employee_id: employee.id,
                    assignment_id: assignmentId
                })
            });
            const data = await res.json();
            if (res.ok) {
                setActiveSessionId(data.id);
                setActiveAssignmentId(assignmentId);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const totalTasks = assessments.length + surveys.length + simulationAssignments.length;

    if (activeSessionId) {
        return (
            <div className="fixed inset-0 bg-white z-[100] animate-in fade-in duration-500 overflow-hidden">
                <SimulationChat 
                    sessionId={activeSessionId} 
                    onClose={() => {
                        setActiveSessionId(null);
                        // Refresh data after completion
                        handleLogin();
                    }} 
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-start py-20 px-6 selection:bg-indigo-100 overflow-x-hidden">
            {/* Background Accents */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-50/50 rounded-full blur-[150px] opacity-40"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-50/50 rounded-full blur-[150px] opacity-40"></div>
            </div>

            <div className={`w-full z-10 transition-all duration-1000 ease-in-out ${step === 'login' ? 'max-w-[550px]' : 'max-w-[1400px]'}`}>
                {step === 'login' ? (
                    <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/50 p-10 md:p-14 border border-white animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <header className="text-center mb-12">
                            <div className="mb-6 tracking-tighter">
                                <span className="text-5xl font-black bg-gradient-to-r from-[#7C3AED] to-[#D946EF] bg-clip-text text-transparent ">CROAR.AI</span>
                            </div>
                            <h1 className="text-2xl font-black text-slate-400 tracking-[0.1em] mb-2 ">Employee Experience Hub</h1>
                            <p className="text-slate-300 font-bold  text-[10px] tracking-[0.3em]">Growth, Feedback & Behavioral Training</p>
                        </header>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400   ml-1">Employee UUID / ID</label>
                                <input 
                                    className="w-full px-7 py-5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 font-bold placeholder:text-slate-300 transition-all text-sm"
                                    placeholder="Enter your unique ID..."
                                    value={credentials.employee_id}
                                    onChange={(e) => setCredentials({...credentials, employee_id: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400   ml-1">Corporate Email</label>
                                <input 
                                    type="email"
                                    className="w-full px-7 py-5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 font-bold placeholder:text-slate-300 transition-all text-sm"
                                    placeholder="yourname@company.com"
                                    value={credentials.email}
                                    onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                                    required
                                />
                            </div>

                            {error && (
                                <div className="p-4 bg-rose-50 text-rose-500 rounded-xl text-xs font-bold text-center border border-rose-100 animate-shake">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-6 bg-slate-900 text-white rounded-xl font-black text-sm  tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-indigo-600 active:scale-95 transition-all disabled:opacity-50 mt-4 group"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Logging in...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <span>Enter Hub</span>
                                        <span className="material-symbols-rounded text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                    </div>
                                )}
                            </button>
                        </form>

                        <footer className="mt-12 text-center text-[10px] text-slate-400 font-medium ">
                            Secure entry point for employee growth.
                        </footer>
                    </div>
                ) : (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <header className="flex flex-col md:flex-row justify-between items-center gap-6 pb-10 border-b border-slate-100">
                            <div className="text-center md:text-left">
                                <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">Welcome Back, {employee?.first_name}!</h2>
                                <p className="text-slate-400 font-black  text-[10px] tracking-[0.4em] flex items-center justify-center md:justify-start gap-2">
                                    <span className="material-symbols-rounded text-sm text-indigo-500">verified</span>
                                    {totalTasks} ACTIVE TASKS IN YOUR PIPELINE
                                </p>
                            </div>
                            <button 
                                onClick={() => setStep('login')}
                                className="px-8 py-3 bg-white border border-slate-100 text-slate-400 rounded-xl font-black text-[9px]   hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm"
                            >
                                Close Session
                            </button>
                        </header>

                        {totalTasks === 0 ? (
                            <div className="bg-white py-32 rounded-2xl text-center border border-slate-100 shadow-xl shadow-slate-100/50">
                                <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-emerald-100">
                                    <span className="material-symbols-rounded text-5xl">task_alt</span>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">All Caught Up</h3>
                                <p className="text-slate-400 font-black  tracking-[0.2em] text-[10px]">You have no active tasks currently</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                {/* 360 Section */}
                                <section className="space-y-6">
                                    <h3 className="text-[10px] font-black text-indigo-600  tracking-[0.3em] flex items-center gap-3 px-2">
                                        <span className="material-symbols-rounded">group</span>
                                        360° Feedback
                                    </h3>
                                    <div className="space-y-4">
                                        {assessments.length > 0 ? assessments.map((ass) => (
                                            <div key={ass.id} className="bg-white p-6 rounded-2xl border border-slate-50 shadow-xl shadow-slate-200/20 group hover:border-indigo-200 transition-all duration-500 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-base shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                                        {ass.ratee_name?.[0]}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-900 leading-tight">Review {ass.ratee_name}</h4>
                                                        <p className="text-[9px] font-black text-indigo-400   mt-1">{ass.relation}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => router.push(`/enterprise/assessments-360/${ass.id}`)}
                                                    className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-indigo-600 transition-all shadow-lg active:scale-90"
                                                >
                                                    <span className="material-symbols-rounded text-lg">arrow_forward</span>
                                                </button>
                                            </div>
                                        )) : (
                                            <div className="py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-100 flex flex-col items-center justify-center gap-3 text-slate-300">
                                                <span className="material-symbols-rounded text-3xl opacity-20">history_edu</span>
                                                <p className="text-[9px] font-black    ">No pending reviews</p>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Surveys Section */}
                                <section className="space-y-6">
                                    <h3 className="text-[10px] font-black text-emerald-600  tracking-[0.3em] flex items-center gap-3 px-2">
                                        <span className="material-symbols-rounded">analytics</span>
                                        Culture Surveys
                                    </h3>
                                    <div className="space-y-4">
                                        {surveys.length > 0 ? surveys.map((srv) => (
                                            <div key={srv.id} className="bg-white p-6 rounded-2xl border border-slate-50 shadow-xl shadow-slate-200/20 group hover:border-emerald-200 transition-all duration-500 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
                                                        <span className="material-symbols-rounded text-lg">assignment</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-900 leading-tight">{srv.instance_name}</h4>
                                                        <p className="text-[9px] font-black text-emerald-400   mt-1">{srv.template_title}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => router.push(`/enterprise/surveys/fill/${srv.token}`)}
                                                    className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg active:scale-90"
                                                >
                                                    <span className="material-symbols-rounded text-lg">edit_note</span>
                                                </button>
                                            </div>
                                        )) : (
                                            <div className="py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-100 flex flex-col items-center justify-center gap-3 text-slate-300">
                                                <span className="material-symbols-rounded text-3xl opacity-20">poll</span>
                                                <p className="text-[9px] font-black   ">All pulse checks completed</p>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* AI Lab Section */}
                                <section className="space-y-6">
                                    <h3 className="text-[10px] font-black text-rose-600  tracking-[0.3em] flex items-center gap-3 px-2">
                                        <span className="material-symbols-rounded font-black">neurology</span>
                                        AI Practice Lab
                                    </h3>
                                    <div className="space-y-4">
                                        {simulationAssignments.length > 0 ? simulationAssignments.map((sim) => (
                                            <div key={sim.id} className="bg-white p-6 rounded-2xl border border-slate-50 shadow-xl shadow-slate-200/20 group hover:border-rose-200 transition-all duration-500 flex flex-col gap-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-black shadow-inner group-hover:bg-rose-600 group-hover:text-white transition-all duration-500">
                                                        <span className="material-symbols-rounded">psychology</span>
                                                    </div>
                                                    <span className="px-3 py-1 bg-slate-900 text-white text-[8px] font-black  rounded-xl tracking-[0.2em]">Practice</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-900 leading-tight  group-hover:text-rose-600 transition-colors">{sim.title}</h4>
                                                    <p className="text-[9px] font-bold text-slate-400  mt-1 leading-relaxed line-clamp-2">{sim.description}</p>
                                                </div>
                                                <div className="pt-2 border-t border-slate-50 mt-2 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="material-symbols-rounded text-rose-500 text-xs">record_voice_over</span>
                                                        <span className="text-[9px] font-black text-slate-400  ">{sim.character}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => startSimulation(sim.scenario_id, sim.id)}
                                                        className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[9px]   hover:bg-rose-600 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                                                    >
                                                        Start Practice
                                                        <span className="material-symbols-rounded text-sm">play_arrow</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-100 flex flex-col items-center justify-center gap-3 text-slate-300">
                                                <span className="material-symbols-rounded text-3xl opacity-20">lock_open</span>
                                                <p className="text-[9px] font-black   ">No lab sessions assigned</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Global Portal Footer */}
            <div className={`mt-12 text-[10px] font-black text-slate-300  tracking-[0.5em] transition-opacity duration-1000 ${step === 'login' ? 'opacity-0' : 'opacity-100'}`}>
                Employee Portal
            </div>
        </div>
    );
}
