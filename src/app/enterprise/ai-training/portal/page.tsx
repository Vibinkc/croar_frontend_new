"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SimulationChat from "@/app/enterprise/components/SimulationChat";
import { BACKEND_URL } from "@/utils/api";

interface Scenario {
    id: string;
    title: string;
    description: string;
    category: string;
}

interface Assignment {
    id: string;
    scenario: {
        id: string;
        title: string;
        description: string;
    };
}

function SimulationPortalContent() {
    const { token, userId } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [scRes, asRes] = await Promise.all([
                fetch(`${BACKEND_URL}/api/v1/enterprise/simulations/scenarios`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${BACKEND_URL}/api/v1/enterprise/simulations/assignments/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);
            
            const scData = await scRes.json();
            const asData = await asRes.json();
            
            setScenarios(Array.isArray(scData) ? scData : []);
            setAssignments(Array.isArray(asData) ? asData : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const startSession = async (scenarioId: string, assignmentId: string | null = null) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/simulations/sessions`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    scenario_id: scenarioId,
                    employee_id: userId,
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

    if (activeSessionId) {
        return (
            <div className="fixed inset-0 bg-white z-[100] animate-in fade-in duration-500 overflow-hidden">
                <SimulationChat 
                    sessionId={activeSessionId} 
                    onClose={() => {
                        setActiveSessionId(null);
                        fetchData();
                    }} 
                />
            </div>
        );
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-16 pb-32 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 pb-8 border-b border-slate-100">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/enterprise/dashboard')} className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center font-black">
                        <span className="material-symbols-rounded text-xl">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1 ">Neural Coaching Lab</h1>
                        <p className="text-slate-500 font-bold   text-[9px] flex items-center gap-2">
                            <span className="material-symbols-rounded text-sm text-indigo-500">neurology</span>
                            {"Active AI-Driven Practice Laboratory"}
                        </p>
                    </div>
                </div>
            </header>

            {/* ASSIGNED TRAINING */}
            {assignments.length > 0 && (
                <section className="space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight ">Assigned Protocols</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {assignments.map((as) => (
                            <div key={as.id} className="relative group bg-indigo-600 rounded-2xl p-8 flex flex-col gap-6 shadow-2xl shadow-indigo-200 transition-all hover:scale-[1.02]">
                                <div className="absolute top-6 right-8 px-3 py-1 bg-white/20 text-white rounded-xl text-[9px] font-black   backdrop-blur-md">
                                    Priority Assignment
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-white/20 text-white font-black flex items-center justify-center">
                                    <span className="material-symbols-rounded text-xl">verified_user</span>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <h3 className="text-xl font-black text-white tracking-tight  leading-tight">{as.scenario.title}</h3>
                                    <p className="text-indigo-100 text-xs font-medium  opacity-80 leading-relaxed">{as.scenario.description}</p>
                                </div>
                                <div className="pt-4 flex items-center gap-4">
                                     <button 
                                        onClick={() => startSession(as.scenario.id, as.id)}
                                        className="flex-1 py-4 bg-white text-indigo-600 rounded-xl font-black text-[10px]   hover:bg-slate-900 hover:text-white transition-all shadow-xl flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-rounded text-lg">play_arrow</span>
                                        {"Engage AI"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* PUBLIC LIBRARY */}
            <section className="space-y-8">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-slate-900 rounded-full"></div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight ">Practice Library</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {scenarios.map((sc) => (
                        <div key={sc.id} className="group bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/20 p-8 flex flex-col gap-6 transition-all hover:border-indigo-100">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 font-black flex items-center justify-center border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <span className="material-symbols-rounded text-xl">psychology</span>
                            </div>
                            <div className="flex-1">
                                <span className="text-[9px] font-black  tracking-[0.2em] text-indigo-500 mb-2 block">{sc.category}</span>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight  group-hover:text-indigo-600 transition-colors">{sc.title}</h3>
                                <p className="text-xs text-slate-500 font-medium  mt-2 opacity-60 leading-relaxed">{sc.description}</p>
                            </div>
                            <button 
                                onClick={() => startSession(sc.id)}
                                className="w-full py-4 bg-slate-50 text-slate-900 border border-slate-100 rounded-xl font-black text-[10px]   hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-rounded text-lg">forum</span>
                                {"Practice Chat"}
                            </button>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default function SimulationPortal() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <SimulationPortalContent />
        </Suspense>
    );
}
