"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";

interface Question {
    id: string;
    text: string;
    type: string;
    category: string;
    active_flag: boolean;
}

interface GeneratedQuestion {
    text: string;
    type: string;
    category: string;
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
    const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (generatedQuestions.length > 0 && suggestionsRef.current) {
            suggestionsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [generatedQuestions]);

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
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/x360/questions`, {
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
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/x360/questions/ai-generate`, {
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
            for (const q of generatedQuestions) {
                await fetch(`${BACKEND_URL}/api/v1/enterprise/x360/questions`, {
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
        <div className="p-4 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <header className="mb-5 flex items-center gap-3">
                <button onClick={() => router.push('/enterprise/assessments-360')} className="w-7 h-7 rounded-xl bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-[#7C3AED] transition-all flex items-center justify-center">
                    <span className="material-symbols-rounded text-base">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">Question Bank</h1>
                    <p className="text-slate-500 mt-1 text-[10px] font-black uppercase tracking-widest opacity-70">Build and manage your feedback framework with AI assistance.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {/* AI Generator - Now Full Width */}
                <section className="bg-gradient-to-br from-[#7C3AED] to-indigo-700 p-6 rounded-xl text-white shadow-2xl shadow-indigo-100 overflow-hidden relative">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-10 -mt-20"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl -ml-20 -mb-10"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-xl">
                                    <span className="material-symbols-rounded text-white text-xl animate-pulse">auto_awesome</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-black leading-none tracking-tight">Scenario Architect</h2>
                                    <p className="text-violet-100 text-[9px]  font-black tracking-[0.2em] mt-1.5 opacity-80 ">GPT-4 Organizational AI</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => router.push('/enterprise/assessments-360/questions/new')}
                                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-[9px] font-black   transition-all flex items-center gap-2 group"
                            >
                                <span className="material-symbols-rounded text-base group-hover:rotate-90 transition-transform">add</span>{"Create Manual"}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                            {/* Categories Selection - More Space */}
                            <div className="xl:col-span-7">
                                <label htmlFor="ai-target-categories" className="block text-[10px] font-black text-violet-100   mb-4 px-1 opacity-70">Target Competencies & Categories</label>
                                <div id="ai-target-categories" className="flex flex-wrap gap-2">
                                    {/* Standard Categories */}
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => toggleAiCategory(cat.id)}
                                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[10px] font-bold transition-all border whitespace-nowrap shadow-sm ${
                                                aiConfig.categories.includes(cat.id) 
                                                ? 'bg-white text-[#7C3AED] border-white scale-105 shadow-violet-500/20' 
                                                : 'bg-white/5 text-violet-50 border-white/10 hover:border-white/30 hover:bg-white/10'
                                            }`}
                                        >
                                            <span className="material-symbols-rounded text-base shrink-0">
                                                {aiConfig.categories.includes(cat.id) ? 'check_circle' : 'circle'}
                                            </span>
                                            {cat.label}
                                        </button>
                                    ))}
                                    
                                    {/* Custom Categories already added */}
                                    {aiConfig.categories.filter(c => !categories.find(base => base.id === c)).map(cat => (
                                            <button
                                            key={cat}
                                            onClick={() => toggleAiCategory(cat)}
                                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[10px] font-bold transition-all border whitespace-nowrap shadow-sm bg-white text-[#7C3AED] border-white scale-105"
                                        >
                                            <span className="material-symbols-rounded text-base shrink-0 text-amber-500">new_releases</span>
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Configuration & Action */}
                            <div className="xl:col-span-5 flex flex-col justify-between gap-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="ai-quantity" className="block text-[9px] font-black text-violet-100   mb-2 px-1 opacity-70">Quantity</label>
                                        <div className="relative">
                                            <input
                                                id="ai-quantity"
                                                type="number"
                                                min="1" max="20"
                                                className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl focus:ring-2 focus:ring-white outline-none text-xs font-bold placeholder:text-violet-200 transition-all hover:bg-white/15"
                                                value={aiConfig.count}
                                                onChange={(e) => setAiConfig({...aiConfig, count: Number.parseInt(e.target.value)})}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-violet-200 ">Items</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="ai-business-context" className="block text-[9px] font-black text-violet-100   mb-2 px-1 opacity-70">Business Context</label>
                                        <input
                                            id="ai-business-context"
                                            type="text"
                                            placeholder="e.g. Sales, Health..."
                                            className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl focus:ring-2 focus:ring-white outline-none text-xs font-bold placeholder:text-violet-200 transition-all hover:bg-white/15"
                                            value={aiConfig.context}
                                            onChange={(e) => setAiConfig({...aiConfig, context: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="ai-new-category" className="block text-[9px] font-black text-violet-100   mb-2 px-1 opacity-70">Add New Category</label>
                                        <div className="flex gap-2">
                                            <input
                                                id="ai-new-category"
                                                type="text"
                                                placeholder="Type and hit + to add..."
                                                className="flex-1 px-4 py-3 bg-white/10 border border-white/10 rounded-xl focus:ring-2 focus:ring-white outline-none text-xs font-bold placeholder:text-violet-200 transition-all hover:bg-white/15"
                                                value={aiConfig.customCategory}
                                                onChange={(e) => setAiConfig({...aiConfig, customCategory: e.target.value})}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && aiConfig.customCategory) {
                                                        e.preventDefault();
                                                        toggleAiCategory(aiConfig.customCategory.toUpperCase().replace(/\s+/g, '_'));
                                                        setAiConfig(prev => ({ ...prev, customCategory: "" }));
                                                    }
                                                }}
                                            />
                                            <button 
                                                onClick={() => {
                                                    if (aiConfig.customCategory) {
                                                        toggleAiCategory(aiConfig.customCategory.toUpperCase().replace(/\s+/g, '_'));
                                                        setAiConfig(prev => ({ ...prev, customCategory: "" }));
                                                    }
                                                }}
                                                className="w-14 h-[52px] bg-white text-[#7C3AED] rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
                                            >
                                                <span className="material-symbols-rounded font-black">add</span>
                                            </button>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleAIGenerate}
                                        disabled={isGenerating || aiConfig.categories.length === 0}
                                        className="w-full py-4 bg-white text-[#7C3AED] rounded-xl font-black text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-indigo-900/40 disabled:opacity-50 disabled:scale-100  tracking-[0.2em] flex items-center justify-center gap-3 group"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
                                                <span>Synthesizing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-rounded text-lg group-hover:rotate-12 transition-transform">bolt</span>
                                                <span>Generate Questions</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-12 gap-8 items-start">
                    {/* Sidebar */}
                    <aside className="col-span-12 lg:col-span-4 space-y-8 sticky top-8">
                        {/* Manual Form */}
                        <section className="bg-white p-6 rounded-xl border border-slate-100 shadow-xl shadow-slate-200/50">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-[#7C3AED]">
                                    <span className="material-symbols-rounded text-xl">edit_note</span>
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 tracking-tight">New Question</h2>
                            </div>
                            <form onSubmit={handleAdd} className="space-y-5">
                                <div>
                                    <label htmlFor="manual-question-content" className="block text-[9px] font-black text-slate-400   mb-2 px-1 opacity-70">Question Content</label>
                                    <textarea
                                        id="manual-question-content"
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-xl focus:border-[#7C3AED] focus:bg-white focus:ring-4 focus:ring-violet-500/10 outline-none min-h-[120px] text-xs text-slate-700 placeholder:text-slate-300 transition-all font-medium leading-relaxed"
                                        value={newQuestion.text}
                                        onChange={(e) => setNewQuestion({...newQuestion, text: e.target.value})}
                                        required
                                        placeholder="e.g. Handle stress..."
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="manual-response-type" className="block text-[10px] font-black text-slate-400   mb-2.5 px-1 opacity-70">Response Type</label>
                                        <div className="relative">
                                            <select
                                                id="manual-response-type"
                                                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-xl focus:border-[#7C3AED] focus:bg-white outline-none text-sm font-bold text-slate-600 appearance-none transition-all cursor-pointer"
                                                value={newQuestion.type}
                                                onChange={(e) => setNewQuestion({...newQuestion, type: e.target.value})}
                                            >
                                                <option value="RATING">Rating (1-5)</option>
                                                <option value="TEXT">Open Text</option>
                                            </select>
                                            <span className="material-symbols-rounded absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">unfold_more</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="manual-core-category" className="block text-[10px] font-black text-slate-400   mb-2.5 px-1 opacity-70">Core Category</label>
                                        <div className="relative">
                                            <select
                                                id="manual-core-category"
                                                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-xl focus:border-[#7C3AED] focus:bg-white outline-none text-sm font-bold text-slate-600 appearance-none transition-all cursor-pointer"
                                                value={newQuestion.category}
                                                onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
                                            >
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                            </select>
                                            <span className="material-symbols-rounded absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">unfold_more</span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    type="submit"
                                    className="w-full py-4 bg-[#7C3AED] text-white rounded-xl font-black text-[10px] hover:bg-slate-900 hover:shadow-2xl hover:shadow-violet-200 hover:-translate-y-0.5 transition-all active:translate-y-0  tracking-[0.2em] mt-2 block shadow-lg"
                                >
                                    Save to Bank
                                </button>
                            </form>
                        </section>
                    </aside>

                    {/* Main Area */}
                    <main className="col-span-12 lg:col-span-8 space-y-8">
                    {/* AI Preview */}
                    {generatedQuestions.length > 0 && (
                        <section ref={suggestionsRef} className="bg-amber-50/50 rounded-2xl p-8 border-2 border-amber-200 animate-in fade-in slide-in-from-top-4 duration-500 shadow-2xl shadow-amber-100/50">
                            <div className="flex justify-between items-center mb-8 bg-white/50 p-6 rounded-xl border border-amber-100/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shadow-inner border border-amber-200/50">
                                        <span className="material-symbols-rounded text-3xl animate-bounce">auto_awesome</span>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-amber-900 tracking-tight">AI Suggestions Ready</h3>
                                        <p className="text-amber-700/70 text-sm font-medium">Review, refine, and add these AI-curated questions.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setGeneratedQuestions([])}
                                        className="px-6 py-3 text-amber-700 font-black text-[10px]   hover:bg-amber-100 rounded-xl transition-all border border-amber-200"
                                    >
                                        Discard All
                                    </button>
                                    <button 
                                        onClick={saveGenerated}
                                        className="px-8 py-3 bg-amber-600 text-white font-black text-[10px] rounded-xl shadow-xl shadow-amber-200 hover:bg-amber-700 transition-all  tracking-[0.2em] flex items-center gap-2"
                                    >
                                        <span className="material-symbols-rounded text-lg">library_add</span>
                                        Add to Library ({generatedQuestions.length})
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {generatedQuestions.map((q, i) => (
                                    <div key={i} className="bg-white p-5 rounded-xl border border-amber-100 flex items-start gap-4 shadow-sm">
                                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-xs shrink-0">{i+1}</div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-800">{q.text}</p>
                                            <div className="flex gap-2 mt-2">
                                                <span className="text-[9px] font-black  px-2 py-0.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100">{q.category}</span>
                                                <span className="text-[9px] font-black  px-2 py-0.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100">{q.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Question List Grouped by Category - Directory View */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {/* Manual Create Card - THE "CREA" BUTTON */}
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => router.push('/enterprise/assessments-360/questions/new')}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    router.push('/enterprise/assessments-360/questions/new');
                                }
                            }}
                            className="bg-violet-50/30 p-5 rounded-xl border-2 border-dashed border-violet-200 hover:border-violet-400 hover:bg-violet-50 transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
                        >
                            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-[#7C3AED] shadow-xl group-hover:scale-110 transition-transform mb-4 border border-violet-100">
                                <span className="material-symbols-rounded text-2xl">add_circle</span>
                            </div>
                            <h3 className="text-base font-black text-violet-900 tracking-tight mb-1">Create Competency</h3>
                            <p className="text-violet-400 text-[8px] font-black  ">Manual Entry</p>
                        </div>

                        {Array.from(new Set([
                            ...categories.map(c => c.id),
                            ...questions.map(q => q.category)
                        ])).sort((a, b) => String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0).map(cat => {
                            const catQuestions = questions.filter(q => q.category === cat);
                            const categoryIcons: Record<string, string> = {
                                'PERFORMANCE': 'trending_up',
                                'ENGAGEMENT': 'favorite',
                                'CORE_VALUES': 'verified_user',
                                'LEADERSHIP': 'shield_person',
                                'TECHNICAL_SKILLS': 'code_blocks',
                                'SOFT_SKILLS': 'psychology',
                                'COMMUNICATION': 'forum',
                                'TEAMWORK': 'groups',
                                'ADAPTABILITY': 'published_with_changes'
                            };
                            const icon = categoryIcons[cat] || 'folder';
                            const label = categories.find(c => c.id === cat)?.label || cat.replaceAll('_', ' ');

                            return (
                                <div
                                    key={cat}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => router.push(`/enterprise/assessments-360/questions/${cat.toLowerCase().replaceAll('_', '-')}`)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            router.push(`/enterprise/assessments-360/questions/${cat.toLowerCase().replaceAll('_', '-')}`);
                                        }
                                    }}
                                    className="group bg-white p-5 rounded-xl border border-slate-100 shadow-lg shadow-slate-200/20 hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden flex flex-col items-center text-center animate-in zoom-in duration-500"
                                >
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50/50 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-indigo-100 transition-colors"></div>
                                    
                                    <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform mb-4">
                                        <span className="material-symbols-rounded text-2xl">{icon}</span>
                                    </div>
                                    
                                    <h3 className="text-base font-black text-slate-800 tracking-tight mb-1">{label}</h3>
                                    <p className="text-slate-400 text-[8px] font-black   mb-4">Competencies</p>
                                    
                                    <div className="flex items-center gap-2">
                                        <div className="px-5 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black text-slate-600 transition-all group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600">
                                            {catQuestions.length} Items
                                        </div>
                                    </div>
                                    
                                    <div className="absolute bottom-4 right-6 opacity-0 group-hover:opacity-100 transition-all translate-x-3 group-hover:translate-x-0">
                                        <span className="material-symbols-rounded text-indigo-600 text-xl font-black">arrow_right_alt</span>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Blank Slate for Library */}
                        {questions.length === 0 && (
                            <div className="col-span-full bg-white rounded-2xl p-24 text-center border-2 border-dashed border-slate-100 shadow-inner">
                                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                    <span className="material-symbols-rounded text-slate-300 text-5xl">inventory_2</span>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Vast Knowledge Base Initializing</h3>
                                <p className="text-slate-400 text-sm font-medium mb-12 max-w-sm mx-auto leading-relaxed">Your professional framework library is currently dormant. Use the AI generator above to populate it with high-fidelity questions.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    </div>
);
}
