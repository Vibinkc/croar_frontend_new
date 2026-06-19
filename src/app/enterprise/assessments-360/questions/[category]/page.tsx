"use client";

import { useState, useEffect, use } from "react";
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

export default function CategoryDedicatedView({ params }: { params: Promise<{ category: string }> }) {
    const { category: categorySlug } = use(params);
    const category = categorySlug.toUpperCase().replaceAll('-', '_');
    const { token } = useAuth();
    const router = useRouter();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Manual Form State - Dedicated to this category
    const [newQuestion, setNewQuestion] = useState({
        text: "",
        type: "RATING",
        category: category
    });

    useEffect(() => {
        fetchQuestions();
    }, [category, token]);

    const fetchQuestions = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/x360/questions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                // Filter for this specific category
                setQuestions(data.filter(q => q.category === category));
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
                setNewQuestion({ ...newQuestion, text: "" });
                fetchQuestions();
            }
        } catch (error) {
            console.error(error);
        }
    };

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

    const icon = categoryIcons[category] || 'folder';

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50">
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 py-4 px-8 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/enterprise/assessments-360/questions')} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                        <span className="material-symbols-rounded">arrow_back</span>
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <span className="material-symbols-rounded text-xl">{icon}</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">{category.replaceAll('_', ' ')}</h1>
                            <p className="text-slate-500 text-[10px] font-black  tracking-[0.2em] mt-1">Dedicated Competency View</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-slate-400   bg-white border border-slate-100 px-4 py-2 rounded-full shadow-sm">
                        {questions.length} Items
                    </span>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto p-12 grid grid-cols-12 gap-10">
                {/* Sidebar - Category Specific Form */}
                <aside className="col-span-12 lg:col-span-4 space-y-8">
                    <section className="bg-white p-10 rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                    <span className="material-symbols-rounded text-2xl">add_circle</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Add Skill</h2>
                                    <p className="text-slate-400 text-[9px] font-bold   mt-0.5">Define new competency rules</p>
                                </div>
                            </div>
                            
                            <form onSubmit={handleAdd} className="space-y-8">
                                <div className="space-y-3">
                                    <label htmlFor="category-eval-metric" className="text-[10px] font-black text-slate-400  tracking-[0.2em] px-1">Evaluation Metric</label>
                                    <textarea
                                        id="category-eval-metric"
                                        className="w-full px-8 py-6 bg-slate-50 border-2 border-transparent rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300 transition-all min-h-[160px] leading-relaxed"
                                        value={newQuestion.text}
                                        onChange={(e) => setNewQuestion({...newQuestion, text: e.target.value})}
                                        required
                                        placeholder={`e.g. How effectively does the person demonstrate ${category.toLowerCase().replaceAll('_', ' ')}...`}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label htmlFor="category-metric-type" className="text-[10px] font-black text-slate-400  tracking-[0.2em] px-1">Metric Architecture</label>
                                    <div className="relative">
                                        <select
                                            id="category-metric-type"
                                            className="w-full px-8 py-4 bg-slate-50 border-2 border-transparent rounded-xl focus:border-indigo-500 focus:bg-white outline-none text-sm font-black text-slate-700 appearance-none cursor-pointer transition-all"
                                            value={newQuestion.type}
                                            onChange={(e) => setNewQuestion({...newQuestion, type: e.target.value})}
                                        >
                                            <option value="RATING">Rating Interface (1-5)</option>
                                            <option value="TEXT">Exploratory Text Only</option>
                                        </select>
                                        <span className="material-symbols-rounded absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                                    </div>
                                </div>
                                <button 
                                    type="submit"
                                    className="w-full h-16 bg-slate-900 text-white rounded-xl font-black text-[11px]  tracking-[0.25em] shadow-xl hover:bg-indigo-600 hover:shadow-indigo-100 transition-all hover:-translate-y-1 active:translate-y-0"
                                >
                                    Inject Competency
                                </button>
                            </form>
                        </div>
                    </section>
                </aside>

                {/* Main List */}
                <main className="col-span-12 lg:col-span-8">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
                        <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Competency Inventory</h2>
                                <p className="text-slate-400 text-[10px] font-bold  tracking-[0.2em] mt-1">Repository for {category.replaceAll('_', ' ')}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all">
                                    <span className="material-symbols-rounded text-xl">search</span>
                                </button>
                                <button className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all">
                                    <span className="material-symbols-rounded text-xl">filter_list</span>
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white">
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400  tracking-[0.25em] border-b border-slate-50">Content Archetype</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400  tracking-[0.25em] border-b border-slate-50">Metric</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400  tracking-[0.25em] border-b border-slate-50 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {questions.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-10 py-32 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200">
                                                        <span className="material-symbols-rounded text-4xl">folder_off</span>
                                                    </div>
                                                    <p className="text-slate-400 text-sm font-bold">This folder is currently empty.</p>
                                                    <p className="text-slate-300 text-[10px] font-black  mt-2">Add manual entries or use the AI Generator on the main page.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        questions.map((q) => (
                                            <tr key={q.id} className="group hover:bg-slate-50/50 transition-all">
                                                <td className="px-10 py-10">
                                                    <p className="text-sm font-bold text-slate-700 leading-relaxed max-w-xl">{q.text}</p>
                                                </td>
                                                <td className="px-10 py-10">
                                                    <span className="text-[10px] font-black  px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 ">
                                                        {q.type}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-10 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-md active:scale-95">
                                                            <span className="material-symbols-rounded text-xl">edit</span>
                                                        </button>
                                                        <button className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-md active:scale-95">
                                                            <span className="material-symbols-rounded text-xl">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </main>
        </div>
    );
}
