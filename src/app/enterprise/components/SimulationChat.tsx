"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";

interface Message {
    role: "user" | "assistant" | "system";
    content: string;
}

interface Report {
    communication_score?: number;
    empathy_score?: number;
    problem_solving_score?: number;
    strengths?: string[];
    areas_for_improvement?: string[];
}

interface Scenario {
    title: string;
    difficulty: string;
    character_name: string;
    character_role: string;
}

interface Session {
    status: string;
    report?: Report;
    feedback?: string;
    scenario: Scenario;
    conversation?: Message[];
}

interface SimulationChatProps {
    sessionId: string;
    onComplete?: (report: Report) => void;
    onClose?: () => void;
}

export default function SimulationChat({ sessionId, onComplete, onClose }: SimulationChatProps) {
    const { token } = useAuth();
    const [session, setSession] = useState<Session | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [completing, setCompleting] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchSession();
    }, [sessionId, token]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchSession = async () => {
        try {
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/simulations/sessions/${sessionId}`, {
                headers
            });
            const data = await res.json();
            setSession(data);
            setMessages(data.conversation?.filter((m: Message) => m.role !== "system") || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || sending) return;

        const userMsg = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setSending(true);

        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/simulations/sessions/${sessionId}/chat`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ message: userMsg })
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
        } catch (error) {
            console.error(error);
        } finally {
            setSending(false);
        }
    };

    const handleComplete = async () => {
        setCompleting(true);
        try {
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/simulations/sessions/${sessionId}/complete`, {
                method: 'POST',
                headers
            });
            const data = await res.json();
            if (onComplete) onComplete(data);
            // After completion, the UI will switch to the results screen handled below
            await fetchSession();
        } catch (error) {
            console.error(error);
        } finally {
            setCompleting(false);
        }
    };

    if (loading) return (
        <div className="h-screen w-screen bg-[#202123] flex flex-col items-center justify-center text-white/50">
            <div className="w-12 h-12 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
            <p className="text-[10px] font-black  tracking-[0.5em] animate-pulse">Initializing Behavioral Neural Link</p>
        </div>
    );

    if (session?.status === "COMPLETED") {
        return (
            <div className="h-screen w-screen bg-[#fafafa] flex flex-col items-center overflow-y-auto py-12 px-6 animate-in fade-in duration-700">
                <div className="max-w-[900px] w-full space-y-12">
                    <header className="flex flex-col items-center gap-6 text-center">
                        <div className="tracking-tighter py-4">
                            <span className="text-6xl font-black bg-gradient-to-r from-[#7C3AED] to-[#D946EF] bg-clip-text text-transparent  tracking-tighter">CROAR.AI</span>
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 ">Neural Audit Complete</h2>
                            <p className="text-slate-400 font-bold  tracking-[0.3em] text-[10px]">Strategic behavioral performance calibrated</p>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: 'Communication', score: session.report?.communication_score, icon: 'record_voice_over', color: 'indigo' },
                            { label: 'Empathy', score: session.report?.empathy_score, icon: 'favorite', color: 'rose' },
                            { label: 'Problem Solving', score: session.report?.problem_solving_score, icon: 'psychology', color: 'emerald' }
                        ].map((m, i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center gap-4 group hover:border-indigo-200 transition-all">
                                <span className={`material-symbols-rounded text-${m.color}-500 text-3xl group-hover:scale-125 transition-transform`}>{m.icon}</span>
                                <div className="text-3xl font-black text-slate-900 tracking-tighter">{m.score || 0}/10</div>
                                <span className="text-[10px] font-black text-slate-400  ">{m.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-indigo-600 p-12 rounded-2xl text-white space-y-6 shadow-2xl shadow-indigo-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
                        <h3 className="text-xs font-black  tracking-[0.4em] flex items-center gap-3 opacity-70">
                            <span className="material-symbols-rounded">neurology</span>
                            Executive Feedback
                        </h3>
                        <p className="text-2xl font-bold leading-tight ">&quot;{session.feedback}&quot;</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <section className="space-y-6">
                            <h4 className="text-[10px] font-black text-emerald-600  tracking-[0.5em] px-2 flex items-center gap-2">
                                <span className="material-symbols-rounded text-sm">stars</span> Behavioral Strengths
                            </h4>
                            <div className="space-y-3">
                                {session.report?.strengths?.map((s: string, i: number) => (
                                    <div key={i} className="bg-white p-5 rounded-xl border border-emerald-50 shadow-sm flex gap-4 items-center group hover:border-emerald-200 transition-all">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-rounded text-lg">check_circle</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">{s}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                        <section className="space-y-6">
                            <h4 className="text-[10px] font-black text-rose-600  tracking-[0.5em] px-2 flex items-center gap-2">
                                <span className="material-symbols-rounded text-sm">trending_up</span> Growth Vector
                            </h4>
                            <div className="space-y-3">
                                {session.report?.areas_for_improvement?.map((s: string, i: number) => (
                                    <div key={i} className="bg-white p-5 rounded-xl border border-rose-50 shadow-sm flex gap-4 items-center group hover:border-rose-200 transition-all">
                                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-rounded text-lg">bolt</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">{s}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="flex justify-center pb-20">
                        <button 
                            onClick={onClose}
                            className="px-16 py-6 bg-slate-900 text-white rounded-2xl font-black text-xs  tracking-[0.4em] hover:bg-indigo-600 transition-all shadow-2xl active:scale-95 group"
                        >
                            <span className="flex items-center gap-3">
                                Return to Hub
                                <span className="material-symbols-rounded group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-screen bg-white overflow-hidden text-slate-800 animate-in fade-in duration-1000">
            {/* Sidebar - ChatGPT Style */}
            <aside className="w-[280px] bg-[#202123] text-white flex flex-col p-4 shrink-0 transition-all">
                <div className="py-8 px-4 mb-4 tracking-tighter">
                    <span className="text-4xl font-black  bg-gradient-to-r from-[#7C3AED] to-[#D946EF] bg-clip-text text-transparent tracking-tighter">CROAR.AI</span>
                </div>
                
                <button 
                    onClick={onClose}
                    className="flex items-center gap-3 w-full p-4 mb-8 border border-white/20 rounded-xl hover:bg-white/5 transition-colors text-sm font-bold text-white/50"
                >
                    <span className="material-symbols-rounded">arrow_back</span>
                    Exit Simulation
                </button>

                <div className="flex-1 space-y-8 px-2">
                    <div>
                        <h3 className="text-[10px] font-black text-white/30  tracking-[0.3em] mb-4">Current Lab</h3>
                        <div className="p-4 bg-indigo-600/20 border border-indigo-500/30 rounded-xl">
                            <h4 className="text-sm font-black text-indigo-400 mb-1 leading-tight">{session.scenario.title}</h4>
                            <p className="text-[9px] font-bold text-white/40  ">{session.scenario.difficulty} LEVEL</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-[10px] font-black text-white/30  tracking-[0.3em] mb-4">Neural Persona</h3>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <span className="material-symbols-rounded">smart_toy</span>
                                </div>
                                <div>
                                    <div className="text-xs font-black text-white">{session.scenario.character_name}</div>
                                    <div className="text-[9px] font-bold text-white/40   leading-none mt-1">{session.scenario.character_role}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8">
                        <div className="p-6 border border-white/10 rounded-xl bg-white/5 text-[10px] font-bold text-white/60 leading-relaxed ">
                            &quot;A behavioral mirror designed for high-fidelity interactive role-play.&quot;
                        </div>
                    </div>
                </div>

                <div className="p-2 pt-6 border-t border-white/10">
                    <button 
                        onClick={handleComplete}
                        disabled={completing || messages.length < 2}
                        className="w-full py-5 bg-white text-slate-900 rounded-xl font-black text-[10px]  tracking-[0.2em] hover:bg-rose-500 hover:text-white transition-all disabled:opacity-20 flex items-center justify-center gap-2 group shadow-xl"
                    >
                        {completing ? 'Analyzing...' : (
                            <>
                                <span>Finalize Evaluation</span>
                                <span className="material-symbols-rounded text-sm group-hover:rotate-12 transition-transform">analytics</span>
                            </>
                        )}
                    </button>
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col relative h-full bg-white transition-all overflow-hidden">
                {/* Chat Flow */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto w-full scroll-smooth pt-20">
                    <div className="max-w-[800px] mx-auto px-6 space-y-0 py-10">
                        {messages.map((m, i) => (
                            <div 
                                key={i} 
                                className={`group py-12 border-b border-slate-50 flex gap-8 items-start animate-in slide-in-from-bottom-4 duration-500 ${m.role === 'assistant' ? 'bg-[#f7f7f8]/50 -mx-6 px-12 rounded-xl' : ''}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md grow-0 shrink-0 ${m.role === 'assistant' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>
                                    <span className="material-symbols-rounded text-xl">
                                        {m.role === 'assistant' ? 'smart_toy' : 'person'}
                                    </span>
                                </div>
                                <div className="flex-1 pt-1">
                                    <div className="text-xs font-black text-slate-400   mb-3 flex items-center gap-3">
                                        {m.role === 'assistant' ? session.scenario.character_name : 'You / Employee'}
                                        {m.role === 'assistant' && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[8px] rounded  font-black">AI Persona</span>}
                                    </div>
                                    <div className="text-base font-bold text-slate-700 leading-relaxed whitespace-pre-wrap selection:bg-indigo-100 ">
                                        {m.content}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {sending && (
                            <div className="py-12 flex gap-8 items-start animate-pulse">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                                    <span className="material-symbols-rounded text-xl">smart_toy</span>
                                </div>
                                <div className="flex gap-2 p-4">
                                    <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                </div>
                            </div>
                        )}
                        <div className="h-40"></div>
                    </div>
                </div>

                {/* Floating Input Area */}
                <div className="absolute bottom-0 w-full bg-gradient-to-t from-white via-white to-transparent pt-20 pb-10 flex justify-center">
                    <form 
                        onSubmit={handleSend}
                        className="max-w-[800px] w-[90%] bg-white border border-slate-200 rounded-2xl shadow-2xl flex items-end p-2 pr-4 pl-8 group focus-within:border-indigo-500/50 transition-all hover:shadow-indigo-100"
                    >
                        <textarea 
                            rows={1}
                            className="flex-1 py-4 bg-transparent outline-none text-sm font-bold text-slate-700 resize-none max-h-40 placeholder:text-slate-300"
                            placeholder="Shift-click or Type your strategic response..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    handleSend(e as unknown as React.FormEvent);
                                }
                            }}
                            disabled={sending}
                        />
                        <button 
                            type="submit"
                            disabled={!input.trim() || sending}
                            className={`w-12 h-12 mb-1 rounded-xl flex items-center justify-center transition-all ${!input.trim() || sending ? 'bg-slate-50 text-slate-300' : 'bg-indigo-600 text-white shadow-xl hover:rotate-6 active:scale-90 hover:bg-slate-900 shadow-indigo-100'}`}
                        >
                            <span className="material-symbols-rounded text-2xl font-black">arrow_upward</span>
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
