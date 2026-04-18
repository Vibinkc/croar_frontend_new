"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiClient } from "@/utils/api";

export default function StudentJobSimulationList() {
    const [simulations, setSimulations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSimulations = async () => {
            try {
                // Uses the same API as admin for listing, but in real app might be separate
                const res = await apiClient.get('/api/v1/job-simulation/');
                if (res.ok) {
                    setSimulations(await res.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchSimulations();
    }, []);

    const getRoleColor = (role: string) => {
        // Uniform grayscale theme
        return {
            bar: 'bg-slate-400',
            iconText: 'text-slate-600',
            iconBg: 'bg-slate-50 text-slate-600',
            button: 'bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-900',
            border: 'hover:border-slate-300'
        };
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-8 bg-white min-h-screen">
            {/* Hero Section */}
            <section className="relative rounded-[2rem] bg-violet-600 overflow-hidden shadow-xl mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="relative z-10 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <span className="inline-block px-2 py-0.5 bg-white/20 rounded text-[9px] font-black   text-white/90">Simulation Active</span>
                            <h2 className="text-3xl font-black text-white  tracking-tight">Job Simulator</h2>
                        </div>
                        <p className="text-white/80 text-xs max-w-sm font-medium leading-relaxed">
                            Full-spectrum interview simulations. Experience realistic multi-round hiring processes for top tech roles.
                        </p>
                    </div>

                    <div className="flex items-center gap-5 bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/10 min-w-[160px]">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white">
                            <span className="material-icons-outlined text-2xl">work_outline</span>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-violet-100   mb-1.5">Market_Ops</p>
                            <div className="flex items-baseline gap-1.5 text-white">
                                <span className="text-2xl font-black">{simulations.length}</span>
                                <span className="text-[9px] font-bold ">Roles</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {simulations.map((sim) => {
                    const colors = getRoleColor(sim.title);
                    return (
                        <div key={sim.id} className={`group relative bg-violet-50/50 border border-violet-100 dark:border-slate-800 rounded-2xl p-4 transition-all duration-300 shadow-md hover:shadow-lg ${colors.border} flex flex-col h-full overflow-hidden`}>
                            <div className={`absolute top-0 left-0 w-full h-1 ${colors.bar}`}></div>

                            {/* Top Bar */}
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center ${colors.iconText} transition-transform group-hover:scale-105`}>
                                    <span className="material-icons-outlined text-xl">corporate_fare</span>
                                </div>
                                <span className="px-2 py-0.5 rounded text-[8px] font-black   border border-slate-100 bg-slate-50 text-slate-500 shadow-sm">
                                    {sim.company_name}
                                </span>
                            </div>

                            <div className="space-y-2 flex-grow">
                                <h3 className={`text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight  group-hover:text-slate-700 transition-colors`}>{sim.title}</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-[10px] leading-relaxed font-medium line-clamp-2">{sim.description}</p>

                                <div className="flex items-center gap-1 mt-3">
                                    {sim.rounds?.slice(0, 4).map((r: any, idx: number) => (
                                        <div key={idx} className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${colors.bar} opacity-50`}></div>
                                        </div>
                                    ))}
                                    <span className="text-[8px] font-bold text-slate-400   ml-1">
                                        {sim.rounds?.length} Rounds
                                    </span>
                                </div>
                            </div>

                            {/* Action */}
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                {sim.user_attempt ? (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[8px] font-black text-slate-900   flex items-center gap-1">
                                                <span className="material-icons-outlined text-[10px]">verified</span>
                                                Completed
                                            </span>
                                            <span className="text-[10px] font-black text-slate-900 ">Score: {sim.user_attempt.overall_score}%</span>
                                        </div>
                                        <Link href={`/practice/job-simulation/${sim.id}`}>
                                            <button className={`w-full bg-slate-900 text-white font-black text-[9px]   py-2.5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 active:scale-95`}>
                                                VIEW RESULTS
                                                <span className="material-symbols-rounded text-base">analytics</span>
                                            </button>
                                        </Link>
                                    </div>
                                ) : (
                                    <Link href={`/practice/job-simulation/${sim.id}`}>
                                        <button className={`w-full ${colors.button} font-black text-[9px]   py-2.5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 active:scale-95`}>
                                            START APPLICATION
                                            <span className="material-symbols-rounded text-base">arrow_forward</span>
                                        </button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
