"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { Button, Card, Textarea, Select, Field, Badge, PageHelp, jetbrainsMono } from "@/components/ds";

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

    const allCategoryIds = Array.from(new Set([
        ...categories.map(c => c.id),
        ...questions.map(q => q.category)
    ])).sort((a, b) => String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0);

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => router.push('/enterprise/assessments-360')}
                        aria-label="Back"
                        className="w-9 h-9 rounded-[10px] bg-white border border-[#E1E4E8] text-[#8A929E] hover:text-[#5B53E0] hover:border-[#D4D7DC] transition-all flex items-center justify-center shrink-0 shadow-sm"
                    >
                        <span className="material-symbols-rounded text-[20px]">arrow_back</span>
                    </button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">Question Bank</h1>
                            <PageHelp title="Question Bank">Manage the 360 question bank by competency. Add questions or generate them with AI — they feed your frameworks.</PageHelp>
                        </div>
                        <p className="text-[12.5px] text-[#8A929E] mt-0.5">Build and manage your feedback framework with AI assistance</p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    <Button
                        size="sm"
                        icon="add"
                        onClick={() => router.push('/enterprise/assessments-360/questions/new')}
                    >
                        Add Question
                    </Button>
                </div>
            </header>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[
                    { label: "Total Questions", value: questions.length, icon: "quiz", grad: "linear-gradient(135deg,#8B7DFF,#5B53E0)", glow: "rgba(91,83,224,0.28)" },
                    { label: "Categories", value: allCategoryIds.length, icon: "category", grad: "linear-gradient(135deg,#34D399,#0E8A6E)", glow: "rgba(14,138,110,0.25)" },
                    { label: "Rating Items", value: questions.filter(q => q.type === 'RATING').length, icon: "star_rate", grad: "linear-gradient(135deg,#F6B65C,#D97706)", glow: "rgba(217,119,6,0.25)" },
                    { label: "Open Text Items", value: questions.filter(q => q.type === 'TEXT').length, icon: "edit_note", grad: "linear-gradient(135deg,#6E8BEA,#3559C7)", glow: "rgba(53,89,199,0.25)" },
                ].map((s) => (
                    <div key={s.label} className="relative bg-white border border-[#E8EAED] rounded-[14px] p-5 overflow-hidden transition-colors hover:border-[#D4D7DC]">
                        <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: s.grad }} />
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{s.label}</span>
                                <div className={`text-[30px] font-semibold tracking-[-1px] text-[#15171C] mt-2 ${jetbrainsMono.className}`}>{s.value}</div>
                            </div>
                            <span className="w-10 h-10 rounded-[11px] flex items-center justify-center text-white shrink-0" style={{ background: s.grad, boxShadow: `0 6px 14px ${s.glow}` }}>
                                <span className="material-symbols-rounded text-[20px]">{s.icon}</span>
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* AI Generator panel */}
            <Card padding="lg" className="relative overflow-hidden text-white border-0" style={{ background: "linear-gradient(135deg,#5B53E0,#4A43C9)" }}>
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-10 -mt-20" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -ml-20 -mb-10" />

                <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-white/15 backdrop-blur-md rounded-[12px] flex items-center justify-center border border-white/25">
                                <span className="material-symbols-rounded text-white text-[22px]">auto_awesome</span>
                            </div>
                            <div>
                                <h2 className="text-[17px] font-extrabold tracking-[-0.3px] leading-tight">Scenario Architect</h2>
                                <p className="text-white/70 text-[12px] mt-0.5">AI-assisted question generation</p>
                            </div>
                        </div>
                        <Button
                            variant="dark"
                            size="sm"
                            icon="add"
                            onClick={() => router.push('/enterprise/assessments-360/questions/new')}
                        >
                            Create Manual
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-10">
                        {/* Categories Selection */}
                        <div className="xl:col-span-7">
                            <label htmlFor="ai-target-categories" className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-white/70 mb-3">Target Competencies &amp; Categories</label>
                            <div id="ai-target-categories" className="flex flex-wrap gap-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => toggleAiCategory(cat.id)}
                                        className={`flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-[12.5px] font-semibold transition-all border whitespace-nowrap ${
                                            aiConfig.categories.includes(cat.id)
                                            ? 'bg-white text-[#5B53E0] border-white shadow-sm'
                                            : 'bg-white/[0.08] text-white/90 border-white/15 hover:bg-white/[0.14]'
                                        }`}
                                    >
                                        <span className="material-symbols-rounded text-[18px] shrink-0">
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
                                        className="flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-[12.5px] font-semibold transition-all border whitespace-nowrap bg-white text-[#5B53E0] border-white shadow-sm"
                                    >
                                        <span className="material-symbols-rounded text-[18px] shrink-0 text-[#D97706]">new_releases</span>
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Configuration & Action */}
                        <div className="xl:col-span-5 flex flex-col justify-between gap-5">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="ai-quantity" className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-white/70 mb-2">Quantity</label>
                                    <div className="relative">
                                        <input
                                            id="ai-quantity"
                                            type="number"
                                            min="1" max="20"
                                            className="w-full h-11 px-3.5 bg-white/[0.1] border border-white/15 rounded-[10px] focus:ring-2 focus:ring-white/40 outline-none text-[14px] font-semibold text-white placeholder:text-white/50 transition-all hover:bg-white/[0.14]"
                                            value={aiConfig.count}
                                            onChange={(e) => setAiConfig({...aiConfig, count: Number.parseInt(e.target.value)})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="ai-business-context" className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-white/70 mb-2">Business Context</label>
                                    <input
                                        id="ai-business-context"
                                        type="text"
                                        placeholder="e.g. Sales, Health..."
                                        className="w-full h-11 px-3.5 bg-white/[0.1] border border-white/15 rounded-[10px] focus:ring-2 focus:ring-white/40 outline-none text-[14px] font-semibold text-white placeholder:text-white/50 transition-all hover:bg-white/[0.14]"
                                        value={aiConfig.context}
                                        onChange={(e) => setAiConfig({...aiConfig, context: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="ai-new-category" className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-white/70 mb-2">Add New Category</label>
                                    <div className="flex gap-2">
                                        <input
                                            id="ai-new-category"
                                            type="text"
                                            placeholder="Type and hit + to add..."
                                            className="flex-1 h-11 px-3.5 bg-white/[0.1] border border-white/15 rounded-[10px] focus:ring-2 focus:ring-white/40 outline-none text-[14px] font-semibold text-white placeholder:text-white/50 transition-all hover:bg-white/[0.14]"
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
                                            aria-label="Add category"
                                            className="w-11 h-11 shrink-0 bg-white text-[#5B53E0] rounded-[10px] flex items-center justify-center hover:bg-white/90 active:scale-95 transition-all shadow-sm"
                                        >
                                            <span className="material-symbols-rounded">add</span>
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={handleAIGenerate}
                                    disabled={isGenerating || aiConfig.categories.length === 0}
                                    className="w-full h-[46px] bg-white text-[#5B53E0] rounded-[10px] font-semibold text-[14px] hover:bg-white/90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2.5"
                                >
                                    {isGenerating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-[#5B53E0] border-t-transparent rounded-full animate-spin" />
                                            <span>Synthesizing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-rounded text-[20px]">bolt</span>
                                            <span>Generate Questions</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* AI Preview */}
            {generatedQuestions.length > 0 && (
                <Card ref={suggestionsRef} padding="lg" className="border-[#FBBF24]/40 bg-[#FEF9EF] animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 bg-[#FEF3E2] rounded-[12px] flex items-center justify-center text-[#D97706] border border-[#FBBF24]/40 shrink-0">
                                <span className="material-symbols-rounded text-[22px]">auto_awesome</span>
                            </div>
                            <div>
                                <h3 className="text-[16px] font-bold text-[#15171C] tracking-tight">AI Suggestions Ready</h3>
                                <p className="text-[12.5px] text-[#8A929E] mt-0.5">Review, refine, and add these AI-curated questions.</p>
                            </div>
                        </div>
                        <div className="flex gap-2.5 shrink-0">
                            <Button variant="secondary" size="sm" onClick={() => setGeneratedQuestions([])}>
                                Discard All
                            </Button>
                            <Button size="sm" icon="library_add" onClick={saveGenerated}>
                                Add to Library ({generatedQuestions.length})
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2.5">
                        {generatedQuestions.map((q, i) => (
                            <div key={i} className="bg-white p-4 rounded-[12px] border border-[#E8EAED] flex items-start gap-3.5">
                                <div className={`w-7 h-7 rounded-full bg-[#FEF3E2] flex items-center justify-center text-[#D97706] font-bold text-[12px] shrink-0 ${jetbrainsMono.className}`}>{i + 1}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13.5px] font-medium text-[#15171C] leading-relaxed">{q.text}</p>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        <Badge tone="indigo">{q.category}</Badge>
                                        <Badge tone="neutral">{q.type}</Badge>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Category directory */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-[16px] font-bold text-[#15171C] tracking-tight">Competency Categories</h2>
                    <Badge tone="neutral">{allCategoryIds.length} categories</Badge>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-44 bg-white rounded-[14px] border border-[#E8EAED] animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {/* Manual Create Card */}
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => router.push('/enterprise/assessments-360/questions/new')}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    router.push('/enterprise/assessments-360/questions/new');
                                }
                            }}
                            className="bg-[#FAFAFE] p-5 rounded-[14px] border-2 border-dashed border-[#DAD7F6] hover:border-[#5B53E0] hover:bg-[#F4F3FE] transition-all cursor-pointer flex flex-col items-center justify-center text-center group min-h-[176px]"
                        >
                            <div className="w-14 h-14 bg-white rounded-[14px] flex items-center justify-center text-[#5B53E0] shadow-sm border border-[#E8EAED] group-hover:scale-105 transition-transform mb-3">
                                <span className="material-symbols-rounded text-[26px]">add_circle</span>
                            </div>
                            <h3 className="text-[14px] font-bold text-[#15171C] tracking-tight mb-0.5">Create Competency</h3>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Manual Entry</p>
                        </div>

                        {allCategoryIds.map(cat => {
                            const catQuestions = questions.filter(q => q.category === cat);
                            const icon = categoryIcons[cat] || 'folder';
                            const label = categories.find(c => c.id === cat)?.label || cat.replaceAll('_', ' ');

                            return (
                                <Card
                                    key={cat}
                                    interactive
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => router.push(`/enterprise/assessments-360/questions/${cat.toLowerCase().replaceAll('_', '-')}`)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            router.push(`/enterprise/assessments-360/questions/${cat.toLowerCase().replaceAll('_', '-')}`);
                                        }
                                    }}
                                    className="group relative overflow-hidden flex flex-col items-center text-center cursor-pointer min-h-[176px] justify-center animate-in zoom-in duration-300"
                                >
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-[#ECEBFB]/60 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-[#ECEBFB] transition-colors" />

                                    <div className="w-14 h-14 bg-[#15171C] rounded-[14px] flex items-center justify-center text-white group-hover:scale-105 transition-transform mb-3">
                                        <span className="material-symbols-rounded text-[26px]">{icon}</span>
                                    </div>

                                    <h3 className="text-[14px] font-bold text-[#15171C] tracking-tight mb-0.5">{label}</h3>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] mb-3">Competencies</p>

                                    <div className={`px-4 py-1 bg-[#F1F2F5] border border-[#E8EAED] rounded-[20px] text-[12px] font-semibold text-[#4B5563] transition-all group-hover:bg-[#5B53E0] group-hover:text-white group-hover:border-[#5B53E0] ${jetbrainsMono.className}`}>
                                        {catQuestions.length} Items
                                    </div>

                                    <div className="absolute bottom-4 right-5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                        <span className="material-symbols-rounded text-[#5B53E0] text-[20px]">arrow_right_alt</span>
                                    </div>
                                </Card>
                            );
                        })}

                        {/* Blank Slate for Library */}
                        {questions.length === 0 && (
                            <div className="col-span-full bg-white rounded-[14px] p-16 md:p-20 text-center border border-dashed border-[#E8EAED]">
                                <div className="w-16 h-16 bg-[#F4F5F7] rounded-[16px] flex items-center justify-center mx-auto mb-5">
                                    <span className="material-symbols-rounded text-[#C7CCD4] text-[32px]">inventory_2</span>
                                </div>
                                <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#15171C] mb-2">Your knowledge base is empty</h3>
                                <p className="text-[#8A929E] text-[14px] max-w-sm mx-auto mb-7">Your professional framework library is currently dormant. Use the AI generator above to populate it with high-fidelity questions.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Quick manual add */}
            <Card padding="lg">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-[#ECEBFB] rounded-[11px] flex items-center justify-center text-[#5B53E0] shrink-0">
                        <span className="material-symbols-rounded text-[20px]">edit_note</span>
                    </div>
                    <div>
                        <h2 className="text-[16px] font-bold text-[#15171C] tracking-tight">New Question</h2>
                        <p className="text-[12.5px] text-[#8A929E] mt-0.5">Add a question directly to the bank</p>
                    </div>
                </div>
                <form onSubmit={handleAdd} className="space-y-4">
                    <Field label="Question Content" htmlFor="manual-question-content">
                        <Textarea
                            id="manual-question-content"
                            className="min-h-[110px] leading-relaxed"
                            value={newQuestion.text}
                            onChange={(e) => setNewQuestion({...newQuestion, text: e.target.value})}
                            required
                            placeholder="e.g. Handle stress..."
                        />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Response Type" htmlFor="manual-response-type">
                            <div className="relative">
                                <Select
                                    id="manual-response-type"
                                    value={newQuestion.type}
                                    onChange={(e) => setNewQuestion({...newQuestion, type: e.target.value})}
                                >
                                    <option value="RATING">Rating (1-5)</option>
                                    <option value="TEXT">Open Text</option>
                                </Select>
                                <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA3AF] pointer-events-none text-[20px]">unfold_more</span>
                            </div>
                        </Field>
                        <Field label="Core Category" htmlFor="manual-core-category">
                            <div className="relative">
                                <Select
                                    id="manual-core-category"
                                    value={newQuestion.category}
                                    onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
                                >
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </Select>
                                <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA3AF] pointer-events-none text-[20px]">unfold_more</span>
                            </div>
                        </Field>
                    </div>
                    <Button type="submit" block icon="save">
                        Save to Bank
                    </Button>
                </form>
            </Card>
        </div>
    );
}
