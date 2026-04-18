"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";
import SpotOn from "@/components/games/SpotOn";
import FreeTransport from "@/components/games/FreeTransport";
import Numero from "@/components/games/Numero";
import Labyrinth from "@/components/games/Labyrinth";
import EmpathyScanner from "@/components/games/EmpathyScanner";
import PipelinePuzzle from "@/components/games/PipelinePuzzle";
import PsychometricResult from "@/components/results/PsychometricResult";
import { motion, AnimatePresence } from "framer-motion";

export default function PsychometricTestSessionPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const { id } = unwrappedParams;
    const router = useRouter();

    const [test, setTest] = useState<any>(null);
    const [responses, setResponses] = useState<{ [key: string]: any }>({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [isStarted, setIsStarted] = useState(false);

    const resultRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchTest = async () => {
            const res = await apiClient.get(`/api/v1/psychometric/${id}`);
            if (res.ok) {
                setTest(await res.json());
            }
        };
        fetchTest();
    }, [id]);

    // Auto-fullscreen on result
    useEffect(() => {
        if (result && resultRef.current) {
            const enterFullScreen = async () => {
                const element = resultRef.current;
                if (!element) return;
                try {
                    if (element.requestFullscreen) {
                        await element.requestFullscreen();
                    } else if ((element as any).webkitRequestFullscreen) {
                        await (element as any).webkitRequestFullscreen();
                    } else if ((element as any).msRequestFullscreen) {
                        await (element as any).msRequestFullscreen();
                    }
                } catch (err) {
                    console.error("Error attempting to enable full-screen mode:", err);
                }
            };
            setTimeout(enterFullScreen, 100);
        }
    }, [result]);

    const handleAnswer = (questionId: string, value: number) => {
        setResponses(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleSubmit = async (finalResponses?: Record<string, any>, timeTaken?: number) => {
        setSubmitting(true);
        try {
            const res = await apiClient.post(`/api/v1/psychometric/submit`, {
                test_id: Number(id),
                responses: finalResponses || responses,
                time_taken: timeTaken
            });

            if (res.ok) {
                const data = await res.json();
                setResult(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    if (!test) return <div className="p-20 text-center font-bold text-slate-300">Loading Protocol...</div>;

    if (result) return <PsychometricResult result={result} test={test} />;

    if (!isStarted) {
        return (
            <div className="min-h-screen bg-[#050510] flex items-center justify-center p-6 text-white font-sans relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e1b4b_0%,#050510_100%)] z-0" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 w-full max-w-2xl bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-12 text-center space-y-10 shadow-2xl"
                >
                    <div className="w-24 h-24 bg-slate-800 text-slate-400 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-slate-700 transform -rotate-12 shadow-[0_0_30px_rgba(148,163,184,0.1)]">
                        <span className="material-icons-outlined text-5xl">
                            {test.test_type === 'SPOT_ON' ? 'extension' :
                                test.test_type === 'PIPELINE' ? 'rebase_edit' : 'psychology'}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-400  tracking-[0.4em] block">Initializing_Protocol</span>
                        <h1 className="text-4xl font-black text-white  tracking-tighter">{test.title}</h1>
                        <p className="text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">{test.description}</p>
                    </div>

                    <div className="bg-white/5 rounded-3xl p-8 text-left border border-white/5 space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400  tracking-[0.4em] mb-4">Briefing_Details</h3>
                        <ul className="space-y-4">
                            <li className="flex gap-4 items-center">
                                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-black text-slate-400 border border-white/10">01</div>
                                <p className="text-xs font-bold text-slate-300  tracking-wide">
                                    {test.test_type === 'SPOT_ON' ? 'Identify exact pattern matches under pressure' :
                                        test.test_type === 'PIPELINE' ? 'Connect the conduits to restore power' : 'Analyze behavioral statements honestly'}
                                </p>
                            </li>
                            <li className="flex gap-4 items-center">
                                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-black text-slate-400 border border-white/10">02</div>
                                <p className="text-xs font-bold text-slate-300  tracking-wide">
                                    {test.test_type === 'SPOT_ON' ? 'Synchronization speed determines your visual attention score' : 'Calibration results will be saved to your behavioral profile'}
                                </p>
                            </li>
                        </ul>
                    </div>

                    <button
                        onClick={() => setIsStarted(true)}
                        className="w-full py-6 bg-slate-100 text-slate-900 rounded-2xl text-[10px] font-black  tracking-[0.4em] shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:bg-white transition-all flex items-center justify-center gap-4 group active:scale-95"
                    >
                        Execute_Analysis
                        <span className="material-icons-outlined group-hover:translate-x-2 transition-transform">bolt</span>
                    </button>
                </motion.div>

                {/* Decorative Elements */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-slate-500/10 rounded-full blur-[100px] -z-1" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-500/10 rounded-full blur-[100px] -z-1" />
            </div>
        );
    }

    if (test.test_type === 'SPOT_ON') {
        return (
            <SpotOn
                questions={test.questions}
                onComplete={(res, time) => handleSubmit(res, time)}
            />
        );
    }

    if (test.test_type === 'FREE_TRANSPORT') {
        return (
            <FreeTransport
                questions={test.questions}
                onComplete={(score, answers) => handleSubmit({ score, answers }, 0)}
            />
        );
    }

    if (test.test_type === 'NUMERO') {
        return (
            <Numero
                questions={test.questions}
                onComplete={(score, answers) => handleSubmit({ trait_score: score / 10, answers }, 0)}
            />
        );
    }

    if (test.test_type === 'LABYRINTH') {
        return (
            <Labyrinth
                data={test.questions[0]}
                onComplete={(success, moves) => {
                    // For now, success = 10/10, fail = 0/10. Real logic can follow.
                    const score = success ? 10 : 0;
                    handleSubmit({ trait_score: score, moves_used: moves }, 0);
                }}
            />
        );
    }

    if (test.test_type === 'EMOTIONAL_INTELLIGENCE') {
        return (
            <EmpathyScanner
                data={test.questions}
                onComplete={(success, score) => {
                    handleSubmit({ trait_score: score / 10 }, 0);
                }}
            />
        );
    }

    if (test.test_type === 'PIPELINE') {
        return (
            <PipelinePuzzle
                level={test.questions[0]}
                onComplete={(score) => {
                    handleSubmit({ trait_score: score }, 0);
                }}
            />
        );
    }

    const progress = (Object.keys(responses).length / (test.questions?.length || 1)) * 100;

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20 px-4">
            {/* Header */}
            <div className="flex justify-between items-end pt-8">
                <div>
                    <span className="text-[10px] font-black text-slate-500   mb-1 block">Active Assessment</span>
                    <h1 className="text-2xl font-black text-slate-900  tracking-tight">{test.title}</h1>
                </div>
                <div className="text-right">
                    <span className="text-xs font-bold text-slate-400 block mb-1">Progress</span>
                    <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
                {test.questions?.map((q: any) => (
                    <div key={q.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                        <p className="text-lg font-bold text-slate-800 mb-8 leading-relaxed">
                            {q.text}
                        </p>

                        <div className="flex justify-between items-center gap-4">
                            <span className="text-[9px] font-black text-slate-400   hidden sm:block">Disagree</span>

                            <div className="flex-1 flex justify-between items-center max-w-lg mx-auto">
                                {[1, 2, 3, 4, 5].map((val) => (
                                    <button
                                        key={val}
                                        onClick={() => handleAnswer(String(q.id), val)}
                                        className={`
                                            relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-200
                                            ${responses[q.id] === val
                                                ? 'bg-slate-800 border-slate-800 text-white scale-110 shadow-lg shadow-slate-200'
                                                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'}
                                        `}
                                    >
                                        <span className="text-sm font-black">{val}</span>
                                        {responses[q.id] === val && (
                                            <span className="absolute -bottom-6 text-[8px] font-black text-slate-600   whitespace-nowrap">
                                                Selected
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <span className="text-[9px] font-black text-slate-400   hidden sm:block">Agree</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Submit Action */}
            <div className="fixed bottom-0 inset-x-0 p-6 bg-white/80 backdrop-blur-md border-t border-slate-100 flex justify-center z-20">
                <button
                    onClick={() => handleSubmit()}
                    disabled={Object.keys(responses).length < (test.questions?.length || 0) || submitting}
                    className="px-12 py-4 bg-slate-900 text-white rounded-xl text-xs font-black  tracking-[0.2em] hover:bg-slate-700 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    {submitting ? "Analyzing..." : "Complete Assessment"}
                </button>
            </div>
        </div>
    );
}

