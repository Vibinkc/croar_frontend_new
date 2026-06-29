"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import {
    ArrowLeft,
    Plus,
    Search,
    Filter,
    FileEdit,
    Trash2,
    FolderOpen,
    ListChecks,
} from "lucide-react";
import { Button, Card, Badge, Field, Textarea, Select, PageHelp, jetbrainsMono } from "@/components/ds";

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

    const categoryLabel = category.replaceAll('_', ' ');

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => router.push('/enterprise/assessments-360/questions')}
                        className="w-9 h-9 shrink-0 flex items-center justify-center rounded-[10px] bg-white border border-[#E1E4E8] text-[#374151] hover:bg-[#F4F5F7] transition-colors shadow-sm"
                        aria-label="Back to categories"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight capitalize truncate">
                                {categoryLabel.toLowerCase()}
                            </h1>
                            <PageHelp title="Competency Questions">Add or edit the questions in this competency. They become available when building frameworks.</PageHelp>
                        </div>
                        <p className="text-[12.5px] text-[#8A929E] mt-0.5">Dedicated competency view &middot; manage evaluation questions</p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    <Badge tone="neutral">
                        <span className={jetbrainsMono.className}>{questions.length}</span> items
                    </Badge>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-5">
                {/* Add form */}
                <aside className="col-span-12 lg:col-span-4 space-y-5">
                    <Card padding="lg">
                        <div className="flex items-center gap-3 mb-5">
                            <span className="w-10 h-10 rounded-[11px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                                <Plus className="w-[18px] h-[18px]" />
                            </span>
                            <div>
                                <h2 className="text-[15px] font-bold text-[#15171C]">Add Question</h2>
                                <p className="text-[12.5px] text-[#8A929E] mt-0.5">Define a new competency metric</p>
                            </div>
                        </div>

                        <form onSubmit={handleAdd} className="space-y-4">
                            <Field label="Evaluation metric" htmlFor="category-eval-metric">
                                <Textarea
                                    id="category-eval-metric"
                                    className="min-h-[150px] leading-relaxed"
                                    value={newQuestion.text}
                                    onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                                    required
                                    placeholder={`e.g. How effectively does the person demonstrate ${category.toLowerCase().replaceAll('_', ' ')}...`}
                                />
                            </Field>

                            <Field label="Metric type" htmlFor="category-metric-type">
                                <div className="relative">
                                    <Select
                                        id="category-metric-type"
                                        value={newQuestion.type}
                                        onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value })}
                                    >
                                        <option value="RATING">Rating interface (1-5)</option>
                                        <option value="TEXT">Exploratory text only</option>
                                    </Select>
                                    <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA3AF] text-[19px] pointer-events-none">expand_more</span>
                                </div>
                            </Field>

                            <Button type="submit" icon="add" fullWidth>
                                Add Question
                            </Button>
                        </form>
                    </Card>
                </aside>

                {/* Question list */}
                <main className="col-span-12 lg:col-span-8">
                    <div className="bg-white rounded-[14px] border border-[#E8EAED] overflow-hidden min-h-[420px]">
                        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#E8EAED] bg-[#F7F8FA]">
                            <div className="min-w-0">
                                <h2 className="text-[15px] font-bold text-[#15171C]">Competency inventory</h2>
                                <p className="text-[12.5px] text-[#8A929E] mt-0.5 capitalize">Repository for {categoryLabel.toLowerCase()}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-white border border-[#E1E4E8] text-[#9AA3AF] hover:text-[#5B53E0] hover:bg-[#F4F5F7] transition-colors" aria-label="Search">
                                    <Search className="w-4 h-4" />
                                </button>
                                <button className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-white border border-[#E1E4E8] text-[#9AA3AF] hover:text-[#5B53E0] hover:bg-[#F4F5F7] transition-colors" aria-label="Filter">
                                    <Filter className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="p-4 space-y-2.5">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="h-16 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
                                ))}
                            </div>
                        ) : questions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-16 md:p-20 text-center">
                                <div className="w-16 h-16 bg-[#F4F5F7] rounded-[16px] flex items-center justify-center mb-5">
                                    <FolderOpen className="w-8 h-8 text-[#C7CCD4]" />
                                </div>
                                <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#15171C] mb-2">No questions yet</h3>
                                <p className="text-[#8A929E] text-[14px] max-w-xs mx-auto">Add manual entries with the form, or use the AI Generator on the main questions page.</p>
                            </div>
                        ) : (
                            <>
                                {/* Column header (desktop) */}
                                <div className="hidden md:grid grid-cols-[2.6fr_0.9fr_120px] gap-4 px-5 py-3 bg-[#F7F8FA] border-b border-[#E8EAED]">
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Question</span>
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Metric</span>
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Actions</span>
                                </div>

                                <div className="divide-y divide-[#F0F0F1]">
                                    {questions.map((q) => (
                                        <div
                                            key={q.id}
                                            className="grid grid-cols-[1fr_auto] md:grid-cols-[2.6fr_0.9fr_120px] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#F7F7F8] transition-colors group"
                                        >
                                            {/* Question */}
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                                                    <ListChecks className="w-[17px] h-[17px]" />
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-[14px] font-bold text-[#15171C] leading-snug">{q.text}</p>
                                                    {/* mobile-only meta */}
                                                    <div className="mt-1 md:hidden">
                                                        <Badge tone="indigo">{q.type}</Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Metric (desktop) */}
                                            <div className="hidden md:flex items-center">
                                                <Badge tone="indigo">{q.type}</Badge>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 justify-end">
                                                <button className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#ECEBFB] hover:text-[#5B53E0] transition-colors md:opacity-0 md:group-hover:opacity-100" title="Edit">
                                                    <FileEdit className="w-4 h-4" />
                                                </button>
                                                <button className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#FDECEC] hover:text-[#C0383C] transition-colors md:opacity-0 md:group-hover:opacity-100" title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
