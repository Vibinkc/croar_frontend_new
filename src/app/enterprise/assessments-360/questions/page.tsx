"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface Question {
    id: string;
    text: string;
    type: string;
    category: string;
    active_flag: boolean;
}

export default function X360QuestionBank() {
    const { token } = useAuth();
    const router = useRouter();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Manual Form State
    const [newQuestion, setNewQuestion] = useState({
        text: "",
        type: "RATING",
        category: "PERFORMANCE"
    });

    // AI Generator State
    const [aiConfig, setAiConfig] = useState({
        categories: ["PERFORMANCE"] as string[],
        count: 5,
        context: "",
        customCategory: ""
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/enterprise/x360/questions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setQuestions(data);
            } else {
                setQuestions([]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/enterprise/x360/questions`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newQuestion)
            });
            if (res.ok) {
                setNewQuestion({ text: "", type: "RATING", category: "PERFORMANCE" });
                fetchQuestions();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleAIGenerate = async () => {
        if (aiConfig.categories.length === 0) return;
        setIsGenerating(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/enterprise/x360/questions/ai-generate`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    categories: aiConfig.categories,
                    count: aiConfig.count,
                    additional_context: aiConfig.context,
                    custom_category: aiConfig.customCategory
                })
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setGeneratedQuestions(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const saveGenerated = async () => {
        try {
            // Sequential save for simplicity, in production would be batch
            for (const q of generatedQuestions) {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/enterprise/x360/questions`, {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(q)
                });
            }
            setGeneratedQuestions([]);
            fetchQuestions();
        } catch (error) {
            console.error(error);
        }
    };

    const toggleAiCategory = (cat: string) => {
        setAiConfig(prev => ({
            ...prev,
            categories: prev.categories.includes(cat) 
                ? prev.categories.filter(c => c !== cat)
                : [...prev.categories, cat]
        }));
    };

    const categories = [
        { id: 'PERFORMANCE', label: 'Performance' },
        { id: 'ENGAGEMENT', label: 'Engagement' },
        { id: 'CORE_VALUES', label: 'Core Values' },
        { id: 'LEADERSHIP', label: 'Leadership' },
        { id: 'TECHNICAL_SKILLS', label: 'Technical Skills' },
        { id: 'SOFT_SKILLS', label: 'Soft Skills' },
        { id: 'COMMUNICATION', label: 'Communication' },
        { id: 'TEAMWORK', label: 'Teamwork' },
        { id: 'ADAPTABILITY', label: 'Adaptability' }
    ];

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            <header className="mb-10 flex items-center gap-4">
                <button onClick={() => router.push('/enterprise/assessments-360')} className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center">
                    <span className="material-symbols-rounded text-xl">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Question Bank</h1>
                    <p className="text-slate-500 mt-2 text-lg">Build and manage your 360-degree feedback framework with AI assistance.</p>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-10 items-start">
                {/* Sidebar */}
                <aside className="col-span-12 lg:col-span-4 space-y-8 sticky top-8">
                    {/* Manual Form */}
                    <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <span className="material-symbols-rounded">edit_note</span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">New Question</h2>
                        </div>
                        <form onSubmit={handleAdd} className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Question Content</label>
                                <textarea 
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[120px] text-sm text-slate-700 placeholder:text-slate-300 transition-all font-medium"
                                    value={newQuestion.text}
                                    onChange={(e) => setNewQuestion({...newQuestion, text: e.target.value})}
                                    required
                                    placeholder="e.g. Rate this person's ability to handle stress..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Response Type</label>
                                    <select 
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-600 appearance-none"
                                        value={newQuestion.type}
                                        onChange={(e) => setNewQuestion({...newQuestion, type: e.target.value})}
                                    >
                                        <option value="RATING">Rating (1-5)</option>
                                        <option value="TEXT">Open Text</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Core Category</label>
                                    <select 
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-600 appearance-none"
                                        value={newQuestion.category}
                                        onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
                                    >
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button 
                                type="submit"
                                className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-sm hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-200/50 mt-2 uppercase tracking-widest"
                            >
                                Save Question
                            </button>
                        </form>
                    </section>

                    {/* AI Generator */}
                    <section className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                                <span className="material-symbols-rounded text-white animate-pulse">auto_awesome</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">AI Generator</h2>
                                <p className="text-indigo-100 text-[10px] uppercase font-black tracking-widest">Powered by GPT-4</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-4">Target Categories</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => toggleAiCategory(cat.id)}
                                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all border ${aiConfig.categories.includes(cat.id) ? 'bg-white text-indigo-600 border-white' : 'bg-transparent text-indigo-50 border-white/20 hover:border-white/40'}`}
                                        >
                                            <span className="material-symbols-rounded text-base">
                                                {aiConfig.categories.includes(cat.id) ? 'check_circle' : 'circle'}
                                            </span>
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-2 px-1">Quantity</label>
                                    <input 
                                        type="number"
                                        min="1" max="20"
                                        className="w-full px-5 py-4 bg-white/10 border-none rounded-2xl focus:ring-2 focus:ring-white outline-none text-sm font-bold placeholder:text-indigo-200"
                                        value={aiConfig.count}
                                        onChange={(e) => setAiConfig({...aiConfig, count: parseInt(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-2 px-1">Context</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. Sales Team"
                                        className="w-full px-5 py-4 bg-white/10 border-none rounded-2xl focus:ring-2 focus:ring-white outline-none text-sm font-bold placeholder:text-indigo-200"
                                        value={aiConfig.context}
                                        onChange={(e) => setAiConfig({...aiConfig, context: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-2 px-1">Custom Category</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. EMOTIONAL_INTELLIGENCE"
                                        className="w-full px-5 py-4 bg-white/10 border-none rounded-2xl focus:ring-2 focus:ring-white outline-none text-sm font-bold placeholder:text-indigo-200"
                                        value={aiConfig.customCategory}
                                        onChange={(e) => setAiConfig({...aiConfig, customCategory: e.target.value})}
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handleAIGenerate}
                                disabled={isGenerating || aiConfig.categories.length === 0}
                                className="w-full py-5 bg-white text-indigo-600 rounded-3xl font-black text-sm hover:scale-[1.02] transition-all shadow-xl disabled:opacity-50 disabled:scale-100 uppercase tracking-widest mt-2 flex items-center justify-center gap-2"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-rounded text-lg">bolt</span>
                                        Generate with AI
                                    </>
                                )}
                            </button>
                        </div>
                    </section>
                </aside>

                {/* Main Area */}
                <main className="col-span-12 lg:col-span-8 space-y-8">
                    {/* AI Preview */}
                    {generatedQuestions.length > 0 && (
                        <section className="bg-amber-50 rounded-[2.5rem] p-8 border border-amber-100 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-amber-900">Review AI Suggestions</h3>
                                    <p className="text-amber-700 text-sm">Review these generated questions before adding them to your library.</p>
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setGeneratedQuestions([])}
                                        className="px-6 py-3 text-amber-700 font-bold text-sm hover:bg-amber-100 rounded-2xl transition-all"
                                    >
                                        Discard
                                    </button>
                                    <button 
                                        onClick={saveGenerated}
                                        className="px-6 py-3 bg-amber-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-amber-200 hover:bg-amber-700 transition-all uppercase tracking-widest"
                                    >
                                        Add to Library ({generatedQuestions.length})
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {generatedQuestions.map((q, i) => (
                                    <div key={i} className="bg-white p-5 rounded-2xl border border-amber-100 flex items-start gap-4 shadow-sm">
                                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-xs shrink-0">{i+1}</div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-800">{q.text}</p>
                                            <div className="flex gap-2 mt-2">
                                                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md border border-slate-100">{q.category}</span>
                                                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md border border-slate-100">{q.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Question List */}
                    <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/30 overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800">Master Library</h2>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">{questions.length} Active Questions</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/30">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Content</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Metrics</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {questions.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-8 py-20 text-center text-slate-300 italic">No questions in your bank yet. Start by generating some with AI or adding them manually.</td>
                                        </tr>
                                    ) : (
                                        questions.map((q) => (
                                            <tr key={q.id} className="group hover:bg-slate-50/50 transition-all">
                                                <td className="px-8 py-6">
                                                    <p className="text-sm font-bold text-slate-700 leading-relaxed max-w-md">{q.text}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[9px] font-black uppercase px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                                                            {q.category}
                                                        </span>
                                                        <span className="text-[9px] font-black uppercase px-3 py-1.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-200">
                                                            {q.type}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">
                                                        <span className="material-symbols-rounded text-xl">delete_outline</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
