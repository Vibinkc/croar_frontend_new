"use client";

import { useEffect, useState, use } from "react";
// import Cookies from "js-cookie";
import { apiClient } from "@/utils/api";

import { useRouter } from "next/navigation";

interface QuestionStatus {
    id: number;
    question: string;
    difficulty: string;
    sub_topic: string | null;
    is_completed: boolean;
    is_correct: boolean | null;
}

export default function TopicQuestionsPage({ params }: { params: Promise<{ topic: string }> }) {
    const unwrappedParams = use(params);
    const { topic } = unwrappedParams;
    const router = useRouter();
    const decodedTopic = decodeURIComponent(topic);

    // Handle acronyms (DSA, TCS) vs regular words (Algebra, Geometry)
    const capitalizedTopic = ['dsa', 'tcs'].includes(decodedTopic.toLowerCase())
        ? decodedTopic.toUpperCase()
        : decodedTopic.charAt(0).toUpperCase() + decodedTopic.slice(1);

    const [questions, setQuestions] = useState<QuestionStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState<'dark' | 'light'>('light');
    const isDark = theme === 'dark';

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                // const token = Cookies.get("auth_");
                const res = await apiClient.get(`/api/v1/progress/questions/${capitalizedTopic}?module_type=APTITUDE`);
                if (res.ok) {
                    const data = await res.json();
                    setQuestions(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchQuestions();
    }, [capitalizedTopic]);

    const completedCount = questions.filter(q => q.is_correct).length;

    if (loading) return (
        <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#111214]' : 'bg-slate-50'}`}>
            <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                <p className={`text-xs font-black   animate-pulse ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>Loading Module...</p>
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? 'bg-[#111214] text-[#8e9297]' : 'bg-[#fcfcfd] text-slate-600'}`}>
            {/* Header */}
            <header className={`border-b h-14 flex items-center justify-between px-6 sticky top-0 z-40 transition-colors duration-300 ${isDark ? 'bg-[#111214]/80 border-[#2d2e32] backdrop-blur-md' : 'bg-white/80 border-slate-200/50 shadow-sm backdrop-blur-md'}`}>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/practice/aptitude')}
                        className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${isDark ? 'hover:bg-[#2d2e31] text-[#8e9297]' : 'hover:bg-slate-100 text-slate-400'}`}
                    >
                        <span className="material-icons-outlined text-sm">arrow_back</span>
                    </button>
                    <div className={`w-px h-4 ${isDark ? 'bg-[#2d2e32]' : 'bg-slate-200/80'}`} />
                    <span className={`text-[13px] font-bold tracking-tight ${isDark ? 'text-[#e1e1e1]' : 'text-slate-900'}`}>
                        {capitalizedTopic} Hub
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
                </div>
            </header>

            <div className="max-w-5xl mx-auto space-y-8 p-6 md:p-8">
                {/* Banner */}
                <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 shadow-2xl shadow-indigo-500/10 text-white">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                                    <span className="material-icons-outlined text-xl text-indigo-300">dataset</span>
                                </div>
                                <span className="text-[10px] font-black  tracking-[0.2em] text-indigo-300">Data Cluster</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black  tracking-tight text-white mb-2">{capitalizedTopic}</h1>
                            <div className="flex items-center gap-2 text-slate-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                <span className="text-[10px] font-bold  ">Active Session</span>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 min-w-[200px]">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-[9px] font-black text-slate-300  ">Progress Resolution</span>
                                <span className="text-lg font-black text-white">{Math.round((completedCount / (questions.length || 1)) * 100)}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 transition-all duration-1000 ease-out"
                                    style={{ width: `${questions.length > 0 ? (completedCount / questions.length) * 100 : 0}%` }}
                                ></div>
                            </div>
                            <div className="mt-2 text-right">
                                <span className="text-[10px] font-medium text-slate-400">
                                    <strong className="text-white">{completedCount}</strong> / {questions.length} Questions Cleared
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Questions Grid */}
                <div className="grid grid-cols-1 gap-3">
                    {questions.map((q, index) => {
                        return (
                            <div
                                key={q.id}
                                className={`group relative border rounded-2xl p-4 transition-all duration-300 ${isDark
                                    ? 'bg-[#16181b] border-[#2d2e32] hover:border-indigo-500/30 hover:bg-[#1a1d21]'
                                    : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5'} cursor-pointer`}
                                onClick={() => router.push(`/practice/aptitude/${decodedTopic}/question/${q.id}`)}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-5 flex-1 p-1">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-colors ${q.is_correct
                                            ? 'bg-emerald-500/10 text-emerald-500'
                                            : q.is_completed && !q.is_correct
                                                ? 'bg-rose-500/10 text-rose-500'
                                                : isDark
                                                    ? 'bg-[#232529] text-[#8e9297] group-hover:bg-indigo-500/20 group-hover:text-indigo-400'
                                                    : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                                            }`}>
                                            {q.is_correct ? <span className="material-icons-outlined text-lg">check</span> :
                                                q.is_completed ? <span className="material-icons-outlined text-lg">close</span> :
                                                    String(index + 1).padStart(2, '0')}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black   border ${q.difficulty === 'Easy' ? (isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100') :
                                                    q.difficulty === 'Medium' ? (isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-100') :
                                                        (isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-100')
                                                    }`}>
                                                    {q.difficulty}
                                                </span>
                                                {q.sub_topic && (
                                                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black   border ${isDark ? 'bg-[#1e1f23] text-[#8e9297] border-[#2d2e32]' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                                                        {q.sub_topic}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className={`text-[15px] font-bold line-clamp-2 transition-colors ${isDark ? 'text-slate-200 group-hover:text-indigo-400' : 'text-slate-700 group-hover:text-indigo-700'}`}>
                                                {q.question || <span className="opacity-50  font-medium">Attempt Question {String(index + 1).padStart(2, '0')}: Click to reveal the problem statement.</span>}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="pr-2">
                                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${isDark
                                            ? 'border-[#2d2e32] text-[#8e9297] group-hover:border-indigo-500/30 group-hover:text-indigo-400 group-hover:bg-indigo-500/10'
                                            : 'border-slate-100 text-slate-300 group-hover:border-indigo-200 group-hover:text-indigo-600 group-hover:bg-indigo-50'
                                            }`}>
                                            <span className="material-icons-outlined text-sm">arrow_forward</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {questions.length === 0 && (
                    <div className="text-center py-16 bg-white dark:bg-slate-800/20 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <span className="material-icons-outlined text-3xl">inbox</span>
                        </div>
                        <p className="text-[10px] font-black   text-slate-400">No Questions Found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
