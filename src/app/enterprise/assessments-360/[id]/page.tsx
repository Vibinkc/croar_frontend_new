"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";

interface Question {
    id: string;
    text: string;
    type: "RATING" | "TEXT";
    category: string;
}

interface TemplateQuestion {
    question: Question;
    order: number;
}

interface Assignment {
    id: string;
    relation: string;
    status: string;
    ratee: {
        first_name: string;
        last_name: string;
    };
    cycle: {
        name: string;
    };
}

export default function X360FillAssessment() {
    const { token } = useAuth();
    const router = useRouter();
    const params = useParams();
    const assignmentId = params.id as string;

    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [responses, setResponses] = useState<Record<string, { answer_value?: number, answer_text?: string }>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [showSuccess, setShowSuccess] = useState(false);
    const [pendingTasks, setPendingTasks] = useState<Assignment[]>([]);

    const fetchPendingTasks = async (raterId: string) => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${baseUrl}/api/v1/enterprise/x360/portal/assignments-by-rater/${raterId}`);
            if (res.ok) {
                const data = await res.json();
                setPendingTasks(data.filter((t: any) => t.id !== assignmentId));
            }
        } catch (error) {
            console.error("Error fetching pending tasks:", error);
        }
    };

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                // Try standard endpoint first
                let res = await fetch(`${baseUrl}/api/v1/enterprise/x360/assessments/${assignmentId}`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });

                // If fails or no token, try portal endpoint
                if (!res.ok) {
                    res = await fetch(`${baseUrl}/api/v1/enterprise/x360/portal/assessments/${assignmentId}`);
                }

                if (res.ok) {
                    const data = await res.json();
                    setAssignment(data.assignment);
                    const sortedQuestions = data.template.questions
                        .sort((a: TemplateQuestion, b: TemplateQuestion) => a.order - b.order)
                        .map((tq: TemplateQuestion) => tq.question);
                    setQuestions(sortedQuestions);
                    
                    // Initialize responses
                    const initialRes: Record<string, { answer_value?: number, answer_text?: string }> = {};
                    sortedQuestions.forEach((q: Question) => {
                        initialRes[q.id] = q.type === 'RATING' ? { answer_value: 3 } : { answer_text: "" };
                    });
                    setResponses(initialRes);

                    // Fetch other pending tasks for this rater
                    if (data.assignment.rater_id) {
                        fetchPendingTasks(data.assignment.rater_id);
                    }
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [assignmentId, token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                responses: Object.entries(responses).map(([qId, val]) => ({
                    question_id: qId,
                    ...val
                }))
            };
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${baseUrl}/api/v1/enterprise/x360/assessments/${assignmentId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setShowSuccess(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                alert("Failed to submit assessment");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-8 text-center">
            <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-xl shadow-indigo-100"></div>
                <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xs">Authenticating Assignment...</p>
            </div>
        </div>
    );
    if (!assignment) return <div className="p-8 text-center text-rose-500 font-bold">Assessment not found.</div>;

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-[#fafafa] py-20 px-6 selection:bg-indigo-100">
                <div className="max-w-[1000px] mx-auto">
                    <div className="bg-white rounded-[4rem] shadow-2xl shadow-slate-200/50 p-12 md:p-20 border border-white text-center space-y-12 animate-in zoom-in-95 duration-700">
                        <div className="w-32 h-32 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <span className="material-symbols-rounded text-6xl">check_circle</span>
                        </div>
                        
                        <div className="space-y-4">
                            <h2 className="text-5xl font-black text-slate-900 tracking-tight">Feedback Transmitted</h2>
                            <p className="text-slate-500 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                                Thank you for providing your feedback for <span className="text-indigo-600 font-bold">{assignment.ratee.first_name}</span>. Your insights are essential for their professional development.
                            </p>
                        </div>

                        {pendingTasks.length > 0 ? (
                            <div className="space-y-8 pt-8 border-t border-slate-50">
                                <div className="bg-indigo-50 py-3 px-6 rounded-full inline-block border border-indigo-100">
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">Action Required</p>
                                </div>
                                <h3 className="text-xl font-black text-slate-900">You have {pendingTasks.length} other pending assessments</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                    {pendingTasks.map((task) => (
                                        <button
                                            key={task.id}
                                            onClick={() => {
                                                setShowSuccess(false);
                                                router.push(`/enterprise/assessments-360/${task.id}`);
                                            }}
                                            className="bg-slate-50 p-8 rounded-[2.5rem] border border-transparent hover:border-indigo-200 hover:bg-white transition-all group hover:shadow-xl hover:shadow-slate-100/50 text-left"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm border border-slate-100 transition-colors">
                                                    <span className="material-symbols-rounded">person</span>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{task.relation}</span>
                                            </div>
                                            <p className="text-lg font-black text-slate-900 mb-1">{task.ratee.first_name} {task.ratee.last_name}</p>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{task.cycle.name}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="pt-12 border-t border-slate-50 space-y-8">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                                    <span className="material-symbols-rounded text-emerald-500">verified</span>
                                    All assignments complete for this cycle
                                </p>
                                <button
                                    onClick={() => router.push('/enterprise/assessments-360/portal')}
                                    className="px-12 py-5 bg-slate-900 text-white rounded-3xl font-black text-sm uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all active:scale-95"
                                >
                                    Return to Portal
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] py-16 px-6 md:px-12 animate-in fade-in duration-700">
            <div className="max-w-[1400px] mx-auto space-y-12">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-slate-100">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center">
                                <span className="material-symbols-rounded">arrow_back</span>
                            </button>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100">
                                {assignment.relation} ASSESSMENT
                            </span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tight">
                            {assignment.ratee.first_name} {assignment.ratee.last_name}
                        </h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                            <span className="material-symbols-rounded text-base">event_repeat</span>
                            {assignment.cycle.name}
                        </p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</p>
                            <p className="text-lg font-black text-slate-900">{Math.round((Object.keys(responses).length / questions.length) * 100) || 0}% Complete</p>
                        </div>
                        <div className="w-16 h-16 rounded-full border-4 border-slate-50 border-t-indigo-600 rotate-45 flex items-center justify-center">
                            <span className="material-symbols-rounded text-indigo-600 -rotate-45">bolt</span>
                        </div>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-32">
                    {/* Left Column: Questions */}
                    <div className="lg:col-span-8 space-y-8">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100/20 group hover:border-indigo-100 transition-all duration-500 animate-in fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className="flex flex-col md:flex-row md:items-start gap-8">
                                    <div className="shrink-0 w-14 h-14 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center font-black text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 space-y-8">
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{q.category}</span>
                                            <h3 className="text-2xl font-bold text-slate-800 leading-tight">{q.text}</h3>
                                        </div>

                                        {q.type === 'RATING' ? (
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-5 gap-4">
                                                    {[1, 2, 3, 4, 5].map((val) => (
                                                        <button
                                                            key={val}
                                                            type="button"
                                                            onClick={() => setResponses({...responses, [q.id]: { answer_value: val }})}
                                                            className={`aspect-square rounded-[2rem] font-black transition-all flex flex-col items-center justify-center gap-1 border-4 ${
                                                                responses[q.id]?.answer_value === val 
                                                                ? 'bg-slate-900 border-indigo-600 text-white shadow-2xl shadow-indigo-200 -translate-y-2 scale-105' 
                                                                : 'bg-slate-50 border-transparent text-slate-300 hover:border-slate-200 hover:bg-white'
                                                            }`}
                                                        >
                                                            <span className="text-2xl">{val}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex justify-between px-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                    <span>Needs Improvement</span>
                                                    <span>Exceptional Performance</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <textarea
                                                className="w-full px-8 py-6 bg-slate-50 border-none rounded-[2rem] focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none transition-all font-medium min-h-[200px] text-slate-700 text-lg placeholder:text-slate-200"
                                                placeholder="Share your detailed observations..."
                                                value={responses[q.id]?.answer_text || ""}
                                                onChange={(e) => setResponses({...responses, [q.id]: { answer_text: e.target.value }})}
                                                required
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right Column: Dynamic Summary / Footer Sticky */}
                    <div className="lg:col-span-4 h-fit lg:sticky lg:top-8 space-y-6">
                        <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl shadow-slate-200">
                            <h4 className="text-xl font-black italic tracking-tight mb-8">Submission Summary</h4>
                            
                            <div className="space-y-6 mb-10">
                                <div className="flex justify-between items-center py-4 border-b border-white/10">
                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Questions Noted</span>
                                    <span className="text-lg font-black">{Object.keys(responses).length} / {questions.length}</span>
                                </div>
                                <p className="text-xs text-white/50 leading-relaxed font-medium italic">
                                    {assignment.relation === 'PEER' || assignment.relation === 'REPORT' ? 
                                        "🔒 Your responses are end-to-end encrypted and will be aggregated anonymously to help your colleague grow." : 
                                        "📢 Your feedback will be shared directly with the employee as part of their development plan."
                                    }
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || Object.keys(responses).length < questions.length}
                                className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-xl shadow-indigo-900/40 hover:bg-white hover:text-indigo-600 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
                            >
                                {submitting ? 'Transmitting...' : 'Confirm Submission'}
                            </button>
                        </div>
                        
                        <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100/50">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Support</p>
                            <p className="text-xs text-indigo-900/60 font-medium leading-relaxed">
                                Need help with the assessment? Contact the HR Business Partner team via the corporate internal helpdesk.
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
