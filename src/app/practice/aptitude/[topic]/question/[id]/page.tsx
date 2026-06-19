"use client";

import { useEffect, useState, use, useRef } from "react";
// import Cookies from "js-cookie";
import { apiClient } from "@/utils/api";
import { useRouter } from "next/navigation";
import McqQuestion from "@/components/assessment/McqQuestion";

interface Question {
    id: number;
    content: {
        question: string;
        options: { [key: string]: string };
    };
    correct_answer: {
        answer: string;
        explanation: string;
    };
    difficulty: string;
    sub_topic: string | null;
}

export default function QuestionPage({ params }: { params: Promise<{ topic: string; id: string }> }) {
    const unwrappedParams = use(params);
    const { topic, id } = unwrappedParams;
    const router = useRouter();
    const decodedTopic = decodeURIComponent(topic);

    // Handle acronyms (DSA, TCS) vs regular words (Algebra, Geometry)
    const capitalizedTopic = ['dsa', 'tcs'].includes(decodedTopic.toLowerCase())
        ? decodedTopic.toUpperCase()
        : decodedTopic.charAt(0).toUpperCase() + decodedTopic.slice(1);

    const [question, setQuestion] = useState<Question | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedOptionFull, setSelectedOptionFull] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [result, setResult] = useState<any>(null);

    // Layout & Theme State
    const [leftPaneWidth, setLeftPaneWidth] = useState(50);
    const splitPaneRef = useRef<HTMLDivElement>(null);
    const [theme, setTheme] = useState<'dark' | 'light'>('light');
    const isDark = theme === 'dark';

    useEffect(() => {
        const fetchQuestion = async () => {
            try {
                // const token = Cookies.get("auth_");
                const res = await apiClient.get(`/api/v1/content/questions/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setQuestion(data);
                    setSelectedOptionFull(null);
                    setSubmitted(false);
                    setResult(null);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchQuestion();
    }, [id]);

    const handleSubmit = async () => {
        if (!selectedOptionFull || !question) return;

        // Extract key (A, B, C, D) from "A. Option Text"
        const selectedKey = selectedOptionFull.split('.')[0];

        try {
            // const token = Cookies.get("auth_");
            const res = await apiClient.post(`/api/v1/progress/submit-answer`, {
                question_id: Number.parseInt(id),
                selected_answer: selectedKey,
                topic: capitalizedTopic,
                module_type: "APTITUDE"
            });

            if (res.ok) {
                const data = await res.json();
                setResult(data);
                setSubmitted(true);
            } else {
                const error = await res.json();
                alert(error.detail || "Failed to submit answer");
            }
        } catch (e) {
            console.error(e);
            alert("Failed to submit answer");
        }
    };

    const handleBackToList = () => {
        router.push(`/practice/aptitude/${decodedTopic}`);
    };

    // Resizer Logic
    const handleMouseDown = (e: React.MouseEvent | React.KeyboardEvent) => {
        if (!('clientX' in e)) return;
        const startX = e.clientX;
        const startWidth = leftPaneWidth;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const newWidth = startWidth + (deltaX / (splitPaneRef.current?.offsetWidth || 1)) * 100;
            if (newWidth > 20 && newWidth < 80) {
                setLeftPaneWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-black text-indigo-600   animate-pulse">Loading Asset...</p>
            </div>
        </div>
    );

    if (!question) return <div className="text-center py-12">Question not found</div>;

    // Prepare data for McqQuestion
    const formattedOptions = Object.entries(question.content.options).map(([key, value]) => `${key}. ${value}`);

    // Determine correct answer string for McqQuestion (only if submitted and result is available)
    let correctOptionFull = undefined;
    if (submitted && result?.correct_answer) {
        const correctKey = result.correct_answer;
        const correctValue = question.content.options[correctKey];
        if (correctValue) {
            correctOptionFull = `${correctKey}. ${correctValue}`;
        }
    }

    return (
        <div className={`h-screen overflow-hidden flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-[#111214] text-[#8e9297]' : 'bg-[#fcfcfd] text-slate-600'}`}>

            {/* 1. HEADER */}
            <header className={`border-b h-14 flex items-center justify-between px-6 z-40 transition-colors duration-300 ${isDark ? 'bg-[#111214] border-[#2d2e32]' : 'bg-white border-slate-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'}`}>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBackToList}
                        className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${isDark ? 'hover:bg-[#2d2e31] text-[#8e9297]' : 'hover:bg-slate-100 text-slate-400'}`}
                    >
                        <span className="material-icons-outlined text-sm">arrow_back</span>
                    </button>
                    <div className={`w-px h-4 ${isDark ? 'bg-[#2d2e32]' : 'bg-slate-200/80'}`} />
                    <span className={`text-[13px] font-bold tracking-tight ${isDark ? 'text-[#e1e1e1]' : 'text-slate-900'}`}>
                        {capitalizedTopic} Aptitude
                    </span>
                    <div className={`w-px h-4 ${isDark ? 'bg-[#2d2e32]' : 'bg-slate-200/80'}`} />
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black   border ${question.difficulty === 'Easy' ? (isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100') :
                        question.difficulty === 'Medium' ? (isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-100') :
                            (isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-100')
                        }`}>
                        {question.difficulty}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Theme Switcher */}
                    <button
                        onClick={() => setTheme(isDark ? 'light' : 'dark')}
                        className={`group flex items-center h-9 px-2 rounded-full border transition-all duration-300 hover:px-3 ${isDark
                            ? 'bg-[#1e1f23] border-[#2d2e32] text-[#8e9297] hover:bg-[#2b2d31] hover:text-white'
                            : 'bg-slate-100/80 border-slate-200 text-slate-500 hover:bg-white hover:text-indigo-600 hover:border-indigo-100 hover:shadow-sm'
                            }`}
                    >
                        <span className="material-icons-outlined text-[18px]">
                            {isDark ? 'light_mode' : 'dark_mode'}
                        </span>
                        <div className="overflow-hidden max-w-0 opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-500 ease-in-out whitespace-nowrap">
                            <span className="text-[11px] font-black  ">
                                {isDark ? 'Light' : 'Dark'}
                            </span>
                        </div>
                    </button>

                    <div className={`w-px h-4 mx-2 ${isDark ? 'bg-[#2d2e32]' : 'bg-slate-200/80'}`} />

                    <button className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${isDark ? 'hover:bg-[#2d2e31] text-[#8e9297]' : 'hover:bg-slate-100 text-slate-400'}`}>
                        <span className="material-icons-outlined text-lg">help_outline</span>
                    </button>
                </div>
            </header>

            {/* 2. MAIN AREA WITH RESIZABLE SPLIT PANE */}
            <main
                ref={splitPaneRef}
                className="flex-1 flex overflow-hidden relative"
            >
                {/* LEFT PANE - Question & Context */}
                <div
                    style={{ width: `${leftPaneWidth}%` }}
                    className={`flex flex-col border-r transition-colors duration-300 ${isDark ? 'border-[#2d2e32] bg-[#111214]' : 'border-slate-200 bg-white'}`}
                >
                    <div className="p-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isDark
                            ? 'bg-[#2b2d31] border-[#3f4147] text-white'
                            : 'bg-white border-slate-200 text-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                            }`}>
                            <span className={`material-icons-outlined text-sm ${isDark ? 'text-white' : 'text-slate-400'}`}>description</span>
                            <span className="text-[12px] font-bold tracking-tight">Question</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 pt-4 transition-all duration-300 no-scrollbar">
                        <div className="max-w-2xl">
                            <h2 className={`text-lg md:text-xl font-semibold leading-relaxed ${isDark ? 'text-[#cfd0d2]' : 'text-slate-900'}`}>
                                {question.content.question}
                            </h2>
                            {question.sub_topic && (
                                <div className="mt-6 pt-6 border-t border-dashed border-slate-200 dark:border-slate-800">
                                    <span className="text-[10px] font-black  tracking-[0.2em] text-slate-400 block mb-2">Topic</span>
                                    <span className={`inline-block px-2 py-1 rounded text-[11px] font-bold ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                        {question.sub_topic}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* VERTICAL DRAG HANDLE */}
                <div
                    role="button"
                    tabIndex={0}
                    onMouseDown={handleMouseDown}
                    onKeyDown={handleMouseDown}
                    className="absolute top-0 bottom-0 w-1 cursor-col-resize z-50 transition-colors group flex items-center justify-center hover:bg-indigo-500/20"
                    style={{ left: `calc(${leftPaneWidth}% - 1px)` }}
                >
                    <div className={`w-[1px] h-full ${isDark ? 'bg-[#2d2e32]' : 'bg-slate-200'} group-hover:bg-indigo-500/50 transition-colors`} />
                </div>

                {/* RIGHT PANE - Options (McqQuestion) */}
                <div
                    style={{ width: `${100 - leftPaneWidth}%` }}
                    className={`flex flex-col overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#0d0f11]' : 'bg-[#f8fafc]'}`}
                >
                    <div className="p-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isDark
                            ? 'bg-[#2b2d31] border-[#3f4147] text-white'
                            : 'bg-white border-slate-200 text-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                            }`}>
                            <span className={`material-icons-outlined text-sm ${isDark ? 'text-white' : 'text-slate-400'}`}>edit_note</span>
                            <span className="text-[12px] font-bold tracking-tight">Answer</span>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden p-8 pt-4 transition-all duration-300 no-scrollbar">
                        <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col">
                            <McqQuestion
                                questionId={question.id}
                                options={formattedOptions}
                                selectedOption={selectedOptionFull || undefined}
                                onAnswer={setSelectedOptionFull}
                                readOnly={submitted}
                                correctAnswer={correctOptionFull}
                                feedback={submitted ? result?.explanation : undefined}
                                isDark={isDark}
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* 3. FOOTER */}
            <footer className={`border-t h-16 flex items-center px-6 z-50 transition-colors duration-300 ${isDark ? 'bg-[#111214] border-[#2d2e32]' : 'bg-white border-slate-200/50 shadow-[0_-8px_20px_rgba(0,0,0,0.01)]'}`}>
                <div className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* Optional Footer content */}
                    </div>

                    <div className="flex items-center gap-4">
                        {!submitted ? (
                            <button
                                onClick={handleSubmit}
                                disabled={!selectedOptionFull}
                                className={`px-8 h-10 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all shadow-sm ${!selectedOptionFull
                                    ? isDark ? 'bg-[#2b2d31] text-[#4f5053] cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/25 active:scale-95'
                                    }`}
                            >
                                Submit Answer
                            </button>
                        ) : (
                            <button
                                onClick={handleBackToList}
                                className={`px-8 h-10 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all shadow-sm ${isDark ? 'bg-white text-black hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'
                                    }`}
                            >
                                Continue Learning
                            </button>
                        )}
                    </div>
                </div>
            </footer>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
