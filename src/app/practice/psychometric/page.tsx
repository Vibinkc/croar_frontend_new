"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiClient } from "@/utils/api";

interface PsychometricTest {
    id: number;
    title: string;
    trait: string;
    description: string;
    test_type?: string;
    questions?: any[];
}

export default function StudentPsychometricListPage() {
    const [tests, setTests] = useState<PsychometricTest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAssessments();
    }, []);

    const fetchAssessments = async () => {
        try {
            // Reusing the same endpoint - in real app might segregate "published" vs "draft"
            const res = await apiClient.get(`/api/v1/psychometric/`);
            if (res.ok) {
                const data = await res.json();
                setTests(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getTraitColor = (trait: string) => {
        return { bar: 'bg-slate-500', iconText: 'text-slate-600', iconBg: 'bg-slate-50 text-slate-600', button: 'bg-slate-50 hover:bg-slate-100 text-slate-600', border: 'hover:border-slate-300' };
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-8 bg-white min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-[1.5rem] bg-emerald-600 p-6 text-white shadow-lg">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black  tracking-tight">Psychometric Lab</h2>
                        <p className="text-slate-100 text-xs max-w-sm font-medium leading-relaxed">
                            Unlock your behavioral DNA. Analyze your personality traits, strengths, and workplace compatibility.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20 min-w-[140px]">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white">
                            <span className="material-icons-outlined text-2xl">psychology_alt</span>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-200   mb-1">Lab_Status</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black">{tests.length}</span>
                                <span className="text-[9px] font-bold text-slate-200 ">Tests</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-48 h-48 bg-slate-500/10 rounded-full blur-2xl"></div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tests.map((test) => {
                    const colors = getTraitColor(test.trait);
                    return (
                        <div key={test.id} className={`group relative bg-emerald-50/50 border border-emerald-100 dark:border-slate-800 rounded-2xl p-4 transition-all duration-300 shadow-md hover:shadow-lg ${colors.border} flex flex-col h-full overflow-hidden`}>
                            <div className={`absolute top-0 left-0 w-full h-1 ${colors.bar}`}></div>

                            {/* Top Bar */}
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center ${colors.iconText} transition-transform group-hover:scale-105`}>
                                    <span className="material-icons-outlined text-xl">
                                        {test.test_type === 'SPOT_ON' ? 'extension' : test.test_type === 'FREE_TRANSPORT' ? 'sailing' : 'psychology_alt'}
                                    </span>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="px-2 py-0.5 rounded text-[8px] font-black   border border-slate-100 bg-slate-50 text-slate-500 shadow-sm">
                                        TRAIT_{test.id}
                                    </span>
                                    {test.test_type === 'SPOT_ON' && (
                                        <span className="px-2 py-0.5 rounded bg-slate-800 text-white text-[7px] font-black   shadow-lg shadow-slate-200">
                                            ATTENTION
                                        </span>
                                    )}
                                    {test.test_type === 'NUMERO' && (
                                        <span className="px-2 py-0.5 rounded bg-slate-800 text-white text-[7px] font-black   shadow-lg shadow-slate-200">
                                            NUMERICAL
                                        </span>
                                    )}
                                    {test.test_type === 'LABYRINTH' && (
                                        <span className="px-2 py-0.5 rounded bg-slate-800 text-white text-[7px] font-black   shadow-lg shadow-slate-200">
                                            SPATIAL
                                        </span>
                                    )}
                                    {test.test_type === 'EMOTIONAL_INTELLIGENCE' && (
                                        <span className="px-2 py-0.5 rounded bg-slate-800 text-white text-[7px] font-black   shadow-lg shadow-slate-200">
                                            EMOTIONAL
                                        </span>
                                    )}
                                    {test.test_type === 'PIPELINE' && (
                                        <span className="px-2 py-0.5 rounded bg-slate-800 text-white text-[7px] font-black   shadow-lg shadow-slate-200">
                                            PIPELINE
                                        </span>
                                    )}
                                    {test.test_type === 'FREE_TRANSPORT' && (
                                        <span className="px-2 py-0.5 rounded bg-slate-800 text-white text-[7px] font-black   shadow-lg shadow-slate-200">
                                            RISK
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 flex-grow">
                                <span className={`px-2 py-0.5 rounded-md ${colors.iconBg} text-[7px] font-black   inline-block mb-1`}>
                                    {test.trait}
                                </span>
                                <h3 className={`text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight  group-hover:${colors.iconText} transition-colors`}>{test.title}</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-[10px] leading-relaxed font-medium line-clamp-2">
                                    {test.description}
                                </p>
                            </div>

                            {/* Action */}
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                <Link href={`/practice/psychometric/${test.id}`}>
                                    <button className={`w-full ${colors.button} font-black text-[9px]   py-2.5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 active:scale-95`}>
                                        BEGIN ANALYSIS
                                        <span className="material-symbols-rounded text-base">arrow_forward</span>
                                    </button>
                                </Link>
                            </div>
                        </div>
                    );
                })}

                {tests.length === 0 && !loading && (
                    <div className="relative border-2 border-dashed border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2 group hover:border-slate-200 transition-colors duration-300 col-span-full h-48">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 group-hover:bg-slate-100 group-hover:text-slate-400 transition-all duration-300">
                            <span className="material-icons-outlined text-xl">science</span>
                        </div>
                        <div className="space-y-0.5">
                            <h4 className="text-[10px] font-black text-slate-300   group-hover:text-slate-400 transition-colors">Lab Empty</h4>
                            <p className="text-[8px] text-slate-300 font-black  ">No Tests Configured</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
