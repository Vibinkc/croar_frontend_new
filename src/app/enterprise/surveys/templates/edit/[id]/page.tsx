"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";

interface SurveyType {
    id: string;
    name: string;
    description: string;
}

interface Question {
    text: string;
    type: "RATING" | "TEXT" | "MCQ";
    scale_min: number;
    scale_max: number;
    options?: string; // stringified JSON array
}

export default function EditTemplate({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { token } = useAuth();
    const router = useRouter();
    const [types, setTypes] = useState<SurveyType[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // AI Wizard State
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [industryNature, setIndustryNature] = useState("");
    const [generatingAi, setGeneratingAi] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        survey_type_id: "",
        title: "",
        description: "",
        questions: [] as Question[]
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [typesRes, tplRes] = await Promise.all([
                    apiClient.get('/api/v1/enterprise/surveys/types'),
                    apiClient.get(`/api/v1/enterprise/surveys/templates/${id}`)
                ]);
                
                if (typesRes.ok) setTypes(await typesRes.json());
                if (tplRes.ok) {
                    const tpl = await tplRes.json();
                    setFormData({
                        survey_type_id: tpl.survey_type_id,
                        title: tpl.title,
                        description: tpl.description || "",
                        questions: tpl.questions.map((q: any) => ({
                            text: q.text,
                            type: q.type,
                            scale_min: q.scale_min || 1,
                            scale_max: q.scale_max || 5,
                            options: q.options || JSON.stringify(["Option 1", "Option 2"])
                        }))
                    });
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const addQuestion = () => {
        setFormData(prev => ({
            ...prev,
            questions: [...prev.questions, { text: "", type: "RATING", scale_min: 1, scale_max: 5, options: JSON.stringify(["Option 1", "Option 2"]) }]
        }));
    };

    const removeQuestion = (idx: number) => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== idx)
        }));
    };

    const updateQuestion = (idx: number, field: keyof Question, value: any) => {
        setFormData(prev => {
            const qs = [...prev.questions];
            qs[idx] = { ...qs[idx], [field]: value };
            return { ...prev, questions: qs };
        });
    };

    const handleOptionChange = (qIdx: number, optIdx: number, val: string) => {
        const q = formData.questions[qIdx];
        const opts = JSON.parse(q.options || "[]");
        opts[optIdx] = val;
        updateQuestion(qIdx, "options", JSON.stringify(opts));
    };

    const addOption = (qIdx: number) => {
        const q = formData.questions[qIdx];
        const opts = JSON.parse(q.options || "[]");
        opts.push(`Option ${opts.length + 1}`);
        updateQuestion(qIdx, "options", JSON.stringify(opts));
    };

    const removeOption = (qIdx: number, optIdx: number) => {
        const q = formData.questions[qIdx];
        const opts = JSON.parse(q.options || "[]").filter((_: any, i: number) => i !== optIdx);
        updateQuestion(qIdx, "options", JSON.stringify(opts));
    };

    const generateWithAi = async () => {
        if (!formData.survey_type_id || !industryNature) return;
        setGeneratingAi(true);
        try {
            const res = await apiClient.post('/api/v1/enterprise/surveys/ai-generate-questions', {
                survey_type_id: formData.survey_type_id,
                industry_nature: industryNature,
                count: 5
            });
            if (res.ok) {
                const aiQuestions = await res.json();
                const formatted = aiQuestions.map((q: any) => ({
                    text: q.text,
                    type: q.type,
                    scale_min: 1,
                    scale_max: 5,
                    options: q.options ? JSON.stringify(q.options) : JSON.stringify(["Option 1", "Option 2"])
                }));
                setFormData(prev => ({
                    ...prev,
                    questions: [...prev.questions, ...formatted]
                }));
                setIsAiModalOpen(false);
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
            const res = await apiClient.put(`/api/v1/enterprise/surveys/templates/${id}`, formData);
            if (res.ok) {
                alert("Framework updated successfully!");
                router.push('/enterprise/surveys/templates');
            } else {
                alert("Failed to update framework.");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred while saving.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Cleaner Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 py-4 px-8 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/enterprise/surveys/templates')} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                        <span className="material-symbols-rounded">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none mb-1">Edit Framework</h1>
                        <p className="text-slate-500 text-xs font-medium">Refine your systematic question stacks</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button 
                        type="button"
                        onClick={() => router.push('/enterprise/surveys/templates')}
                        className="px-5 py-2.5 text-slate-600 font-semibold text-xs hover:bg-slate-100 rounded-xl transition-all"
                    >
                        Discard
                    </button>
                    <button 
                        form="template-form"
                        type="submit"
                        disabled={submitting || !formData.survey_type_id || !formData.title || formData.questions.length === 0 || formData.questions.some(q => !q.text.trim())}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-xs hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 disabled:opacity-50 disabled:shadow-none"
                    >
                        {submitting ? 'Saving Changes...' : 'Save Framework'}
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-8 lg:p-12 space-y-12 animate-in fade-in duration-700">
                <form id="template-form" onSubmit={handleSave} className="space-y-12">
                    {/* Simplified Strategy Block */}
                    <section className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-8">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <span className="material-symbols-rounded text-indigo-500">settings</span>
                            <h3 className="text-sm font-bold text-slate-900  ">Framework Configuration</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400   px-1">Survey Category</label>
                                <div className="relative">
                                    <select 
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold text-slate-700 appearance-none transition-all"
                                        value={formData.survey_type_id}
                                        onChange={(e) => setFormData({...formData, survey_type_id: e.target.value})}
                                        required
                                    >
                                        <option value="">Select Target Type</option>
                                        {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                    <span className="material-symbols-rounded absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">expand_more</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400   px-1">Framework Title</label>
                                <input 
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold text-slate-700 placeholder:text-slate-300 transition-all"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    placeholder="e.g. Employee Engagement Q4"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-bold text-slate-400   px-1">Executive Instructions</label>
                                <textarea 
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold text-slate-700 placeholder:text-slate-300 min-h-[100px] transition-all leading-relaxed"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Summary or instructions for employees..."
                                />
                            </div>
                        </div>
                    </section>

                    {/* Structured Question Pool */}
                    <section className="space-y-6">
                        <div className="flex justify-between items-center px-1">
                            <div className="flex items-center gap-3">
                                <h3 className="text-sm font-bold text-slate-900  ">Question Stack</h3>
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-xl border border-indigo-100">
                                    {formData.questions.length} Items
                                </span>
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsAiModalOpen(true)}
                                    disabled={!formData.survey_type_id}
                                    className="bg-slate-900 text-white text-[10px] font-bold   flex items-center gap-2 hover:bg-indigo-600 px-5 py-2.5 rounded-xl transition-all disabled:opacity-30"
                                >
                                    <span className="material-symbols-rounded text-lg">psychology</span>
                                    AI Wizard
                                </button>
                                <button 
                                    type="button" 
                                    onClick={addQuestion}
                                    className="bg-white border border-slate-200 text-slate-900 text-[10px] font-bold   flex items-center gap-2 hover:bg-slate-50 px-5 py-2.5 rounded-xl transition-all"
                                >
                                    <span className="material-symbols-rounded text-lg">add</span>
                                    Add Question
                                </button>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            {formData.questions.map((q, i) => (
                                <div key={i} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-8 transition-all relative group animate-in slide-in-from-bottom-2 duration-300">
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            type="button" 
                                            onClick={() => removeQuestion(i)}
                                            className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-xl transition-all"
                                        >
                                            <span className="material-symbols-rounded text-xl">delete</span>
                                        </button>
                                    </div>
                                    
                                    <div className="flex gap-6 items-start">
                                        <div className="w-10 h-10 bg-slate-100 text-slate-400 font-bold rounded-xl flex items-center justify-center shrink-0 border border-slate-200">{i+1}</div>
                                        <div className="flex-1 space-y-6">
                                            <input 
                                                className="w-full bg-transparent border-none focus:ring-0 text-slate-900 font-bold text-xl placeholder:text-slate-100 p-0"
                                                value={q.text}
                                                onChange={(e) => updateQuestion(i, "text", e.target.value)}
                                                placeholder="Enter question text..."
                                                required
                                            />
                                            <div className="flex flex-wrap gap-2">
                                                {(["RATING", "TEXT", "MCQ"] as const).map(type => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => updateQuestion(i, "type", type)}
                                                        className={`px-6 py-2 rounded-xl text-[10px] font-bold   transition-all border ${q.type === type ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                                    >
                                                        {type === 'RATING' ? 'Rating' : type === 'TEXT' ? 'Descriptive' : 'Multi-Choice'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {q.type === 'MCQ' && (
                                        <div className="ml-16 space-y-4 animate-in fade-in duration-400">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {JSON.parse(q.options || "[]").map((opt: string, optIdx: number) => (
                                                    <div key={optIdx} className="flex gap-2 items-center group/opt">
                                                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-300 group-hover/opt:bg-indigo-50 transition-colors shrink-0">{String.fromCharCode(65 + optIdx)}</div>
                                                        <input 
                                                            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                            value={opt}
                                                            onChange={(e) => handleOptionChange(i, optIdx, e.target.value)}
                                                            required
                                                        />
                                                        <button 
                                                            type="button"
                                                            onClick={() => removeOption(i, optIdx)}
                                                            className="p-1 px-2 text-slate-300 hover:text-rose-500 transition-colors"
                                                        >
                                                            <span className="material-symbols-rounded text-lg">close</span>
                                                        </button>
                                                    </div>
                                                ))}
                                                <button 
                                                    type="button" 
                                                    onClick={() => addOption(i)}
                                                    className="px-6 py-2.5 border border-dashed border-slate-200 rounded-xl text-[10px] font-bold text-slate-400   hover:border-indigo-200 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 bg-slate-50/20"
                                                >
                                                    <span className="material-symbols-rounded text-lg">add_circle</span>
                                                    Add Choice
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="pt-8 flex flex-col items-center border-t border-slate-100 pb-20">
                        <button 
                            type="submit"
                            disabled={submitting || !formData.survey_type_id || !formData.title || formData.questions.length === 0 || formData.questions.some(q => !q.text.trim())}
                            className="px-16 py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm   shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.01] transition-all disabled:opacity-30 disabled:shadow-none"
                        >
                            {submitting ? 'Saving Changes...' : 'Save Framework'}
                        </button>
                    </div>
                </form>
            </main>

            {/* Simplified AI Wizard Modal */}
            {isAiModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-rounded text-indigo-600">psychology</span>
                                <h2 className="text-lg font-bold text-slate-900">AI Strategy Wizard</h2>
                            </div>
                            <button onClick={() => setIsAiModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400   px-1">Describe Your Industry</label>
                                <input 
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold text-slate-700 transition-all"
                                    value={industryNature}
                                    onChange={(e) => setIndustryNature(e.target.value)}
                                    placeholder="e.g. Fintech, Healthcare..."
                                    autoFocus
                                />
                                <p className="text-[10px] text-slate-400 font-medium px-1 ">Generated questions will reflect industry nuances.</p>
                            </div>
                            <button 
                                onClick={generateWithAi}
                                disabled={generatingAi || !industryNature}
                                className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-xs   flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all disabled:opacity-30"
                            >
                                {generatingAi ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-rounded text-lg">magic_button</span>
                                        Generate Strategy
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
