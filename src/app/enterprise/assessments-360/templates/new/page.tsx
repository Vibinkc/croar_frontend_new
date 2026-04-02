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
                const aiQuestions = await genRes.json();
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

            <main className="max-w-5xl mx-auto p-8 lg:p-12 space-y-12 animate-in fade-in duration-700">
                {/* Meta Config */}
                <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Framework Title</label>
                            <input 
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold text-slate-700 placeholder:text-slate-300 transition-all h-[52px]"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                                placeholder="e.g. Annual Leadership Assessment"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Global Context</label>
                            <input 
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold text-slate-700 placeholder:text-slate-300 transition-all h-[52px]"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Strategic summary for management stakeholders..."
                            />
                        </div>
                    </div>
                </section>

                {/* Selection Pool */}
                <section className="space-y-6">
                    <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-3">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Competency Selection pool</h3>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md border border-indigo-100">
                                {formData.question_ids.length} Selected
                            </span>
                        </div>
                        <button 
                            type="button"
                            onClick={() => setIsAiWizardOpen(true)}
                            className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-indigo-600 px-5 py-2.5 rounded-xl transition-all shadow-md"
                        >
                            <span className="material-symbols-rounded text-lg">psychology</span>
                            AI Strategy Wizard
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {questions.map(q => (
                            <div 
                                key={q.id} 
                                onClick={() => toggleQuestion(q.id)}
                                className={`p-6 rounded-2xl cursor-pointer transition-all flex items-start gap-4 border-2 relative group animate-in slide-in-from-bottom-1 ${formData.question_ids.includes(q.id) ? 'border-indigo-600 bg-indigo-50/5' : 'border-slate-100 bg-white hover:border-indigo-100'}`}
                            >
                                <div className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${formData.question_ids.includes(q.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-100 text-transparent'}`}>
                                    <span className="material-symbols-rounded text-sm font-bold">check</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold leading-tight transition-colors mb-2 ${formData.question_ids.includes(q.id) ? 'text-indigo-900' : 'text-slate-700'}`}>{q.text}</p>
                                    <span className="text-[9px] uppercase font-bold text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded-md border border-indigo-100 tracking-wider transition-opacity">{q.category}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="pt-10 flex flex-col items-center border-t border-slate-100 pb-20">
                    <button 
                        onClick={handleSave}
                        disabled={submitting || formData.question_ids.length === 0}
                        className="px-20 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.01] transition-all disabled:opacity-30 disabled:shadow-none"
                    >
                        {submitting ? 'Finalizing...' : 'Deploy 360 Framework'}
                    </button>
                </div>
            </main>

            {/* AI Wizard Modal */}
            {isAiWizardOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200">
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
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Industry for Context</label>
                                <input 
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold text-slate-700 transition-all h-[52px]"
                                    value={industryNature}
                                    onChange={(e) => setIndustryNature(e.target.value)}
                                    placeholder="e.g. Fintech, Manufacturing..."
                                    autoFocus
                                />
                                <p className="text-[10px] text-slate-400 font-medium px-1 italic">Generated items will be calibrated for this segment.</p>
                            </div>
                            <button 
                                onClick={generateWithAi}
                                disabled={generatingAi || !industryNature}
                                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all disabled:opacity-30 shadow-md"
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
