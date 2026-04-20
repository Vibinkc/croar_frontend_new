"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";

interface Question {
    id: string;
    text: string;
    type: string;
    category: string;
}

interface AIQuestion {
    text: string;
    type: string;
    category: string;
}

export default function CreateX360Template() {
    const { token } = useAuth();
    const router = useRouter();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // AI Wizard State
    const [isAiWizardOpen, setIsAiWizardOpen] = useState(false);
    const [industryNature, setIndustryNature] = useState("");
    const [generatingAi, setGeneratingAi] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        question_ids: [] as string[]
    });

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/x360/questions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setQuestions(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const generateWithAi = async () => {
        if (!industryNature) return;
        setGeneratingAi(true);
        try {
            const genRes = await fetch(`${BACKEND_URL}/api/v1/enterprise/x360/questions/ai-generate`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    categories: ["PERFORMANCE", "LEADERSHIP", "CULTURE"],
                    count: 5,
                    additional_context: industryNature
                })
            });
            
            if (genRes.ok) {
                const aiQuestions: AIQuestion[] = await genRes.json();
                const newQuestionIds: string[] = [];
                
                for (const q of aiQuestions) {
                    const saveRes = await fetch(`${BACKEND_URL}/api/v1/enterprise/x360/questions`, {
                        method: 'POST',
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            text: q.text,
                            type: q.type,
                            category: q.category
                        })
                    });
                    if (saveRes.ok) {
                        const savedQ = await saveRes.json();
                        newQuestionIds.push(savedQ.id);
                    }
                }
                
                setFormData(prev => ({
                    ...prev,
                    question_ids: [...new Set([...prev.question_ids, ...newQuestionIds])]
                }));
                fetchQuestions();
                setIsAiWizardOpen(false);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setGeneratingAi(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/x360/templates`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                router.push('/enterprise/assessments-360/templates');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const toggleQuestion = (id: string) => {
        setFormData(prev => {
            const ids = prev.question_ids.includes(id) 
                ? prev.question_ids.filter(q => q !== id)
                : [...prev.question_ids, id];
            return { ...prev, question_ids: ids };
        });
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50">
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 py-4 px-8 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/enterprise/assessments-360/templates')} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                        <span className="material-symbols-rounded">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none mb-1">Construct 360 Framework</h1>
                        <p className="text-slate-500 text-xs font-medium">Design professional competencies for organizational feedback</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => router.push('/enterprise/assessments-360/templates')}
                        className="px-5 py-2.5 text-slate-600 font-semibold text-xs hover:bg-slate-100 rounded-xl transition-all"
                    >
                        Discard
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={submitting || formData.question_ids.length === 0}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-xs hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 disabled:opacity-50 disabled:shadow-none"
                    >
                        {submitting ? 'Deploying...' : 'Deploy Framework'}
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-8 lg:p-12 space-y-12 animate-in fade-in duration-700">
                {/* Meta Config */}
                <section className="bg-white p-10 rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/50 space-y-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400  tracking-[0.2em] px-1">Framework Designation</label>
                            <input 
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300 transition-all h-[60px]"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                                placeholder="e.g. Executive Leadership Quarterly"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400  tracking-[0.2em] px-1">Strategic Objective</label>
                            <input 
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300 transition-all h-[60px]"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Define the core purpose of this assessment..."
                            />
                        </div>
                    </div>
                </section>

                {/* Selection Pool - Grouped by Category */}
                <section className="space-y-10">
                    <div className="flex justify-between items-center px-2">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl">
                                <span className="material-symbols-rounded">account_tree</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Competency Architecture</h3>
                                <p className="text-slate-500 text-[10px] font-bold   mt-0.5">Select questions by category for a balanced assessment</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-indigo-600   leading-none mb-1">Total Selected</span>
                                <span className="text-2xl font-black text-slate-900 leading-none">{formData.question_ids.length}</span>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setIsAiWizardOpen(true)}
                                className="h-14 bg-indigo-600 text-white text-[11px] font-black  tracking-[0.15em] flex items-center gap-3 hover:bg-slate-900 px-8 rounded-xl transition-all shadow-xl shadow-indigo-100 group"
                            >
                                <span className="material-symbols-rounded text-xl group-hover:rotate-12 transition-transform">psychology</span>
                                Strategy Wizard
                            </button>
                        </div>
                    </div>
                    
                    <div className="space-y-16">
                        {Array.from(new Set(questions.map(q => q.category))).sort().map(cat => {
                            const catQuestions = questions.filter(q => q.category === cat);
                            const selectedInCat = catQuestions.filter(q => formData.question_ids.includes(q.id)).length;
                            
                            return (
                                <div key={cat} className="space-y-6">
                                    <div className="sticky top-20 z-20 flex justify-between items-end pb-4 border-b-2 border-slate-100 bg-[#f8fafc]/80 backdrop-blur-sm -mx-4 px-4 pt-2">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all ${selectedInCat > 0 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-400'}`}>
                                                {selectedInCat}
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-slate-800 tracking-tight">{cat.replace(/_/g, ' ')}</h4>
                                                <p className="text-slate-400 text-[9px] font-bold  tracking-[0.2em]">{catQuestions.length} Total Options</p>
                                            </div>
                                        </div>
                                        {selectedInCat > 0 && (
                                            <span className="text-[10px] font-black text-indigo-600   animate-in fade-in slide-in-from-right-2">
                                                {selectedInCat} Competencies Chosen
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {catQuestions.map(q => (
                                            <div 
                                                key={q.id} 
                                                onClick={() => toggleQuestion(q.id)}
                                                className={`p-6 rounded-xl cursor-pointer transition-all flex flex-col gap-4 border-2 relative group animate-in slide-in-from-bottom-2 duration-500 overflow-hidden ${
                                                    formData.question_ids.includes(q.id) 
                                                    ? 'border-indigo-600 bg-white shadow-2xl shadow-indigo-100' 
                                                    : 'border-white bg-white shadow-sm hover:border-slate-200 hover:shadow-xl'
                                                }`}
                                            >
                                                {formData.question_ids.includes(q.id) && (
                                                    <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-600 flex items-center justify-center translate-x-8 -translate-y-8 rotate-45 shadow-lg">
                                                        <span className="material-symbols-rounded text-white -rotate-45 mt-6 mr-1 text-sm font-black">check</span>
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <p className={`text-sm font-bold leading-relaxed transition-colors ${formData.question_ids.includes(q.id) ? 'text-indigo-900' : 'text-slate-600'}`}>
                                                        {q.text}
                                                    </p>
                                                </div>
                                                <div className="flex justify-between items-center pt-2 border-t border-slate-50 mt-auto">
                                                    <span className="text-[9px] font-black  text-slate-400 ">{q.type}</span>
                                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${formData.question_ids.includes(q.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-100 text-transparent group-hover:border-slate-300'}`}>
                                                        <span className="material-symbols-rounded text-base font-black">check</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <div className="pt-20 flex flex-col items-center border-t border-slate-200 pb-32">
                    <div className="flex flex-col items-center mb-10 text-center max-w-sm">
                        <p className="text-[10px] font-black text-slate-400  tracking-[0.3em] mb-4">Framework Readiness</p>
                        <h4 className="text-2xl font-black text-slate-900 mb-2">{formData.question_ids.length} Questions Selected</h4>
                        <p className="text-slate-500 text-xs font-medium">Review your competency mix above before deploying to your organization.</p>
                    </div>
                    <button 
                        onClick={handleSave}
                        disabled={submitting || formData.question_ids.length === 0}
                        className="h-20 px-24 bg-indigo-600 text-white rounded-2xl font-black text-sm  tracking-[0.25em] shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:bg-slate-900 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:shadow-none flex items-center justify-center gap-4"
                    >
                        {submitting ? (
                            <>
                                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                Sequencing...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-rounded text-2xl">rocket_launch</span>
                                Deploy Assessment Framework
                            </>
                        )}
                    </button>
                </div>
            </main>

            {/* AI Wizard Modal */}
            {isAiWizardOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-rounded text-indigo-600">psychology</span>
                                <h2 className="text-lg font-bold text-slate-900">AI Strategy Wizard</h2>
                            </div>
                            <button onClick={() => setIsAiWizardOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400   px-1">Industry for Context</label>
                                <input 
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold text-slate-700 transition-all h-[52px]"
                                    value={industryNature}
                                    onChange={(e) => setIndustryNature(e.target.value)}
                                    placeholder="e.g. Fintech, Manufacturing..."
                                    autoFocus
                                />
                                <p className="text-[10px] text-slate-400 font-medium px-1 ">Generated items will be calibrated for this segment.</p>
                            </div>
                            <button 
                                onClick={generateWithAi}
                                disabled={generatingAi || !industryNature}
                                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-xs   flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all disabled:opacity-30 shadow-md"
                            >
                                {generatingAi ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-rounded text-lg">magic_button</span>
                                        Inject AI Insights
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
