"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface PsychometricResultData {
    trait_score?: number;
    profile_summary?: string;
}

interface PsychometricTest {
    trait?: string;
}

interface PsychometricResultProps {
    result: PsychometricResultData;
    test: PsychometricTest;
    onClose?: () => void;
    isModal?: boolean;
}

export default function PsychometricResult({ result, test, onClose, isModal = false }: PsychometricResultProps) {
    const router = useRouter();
    const resultRef = useRef<HTMLDivElement>(null);

    // Auto-fullscreen on result (Only if not in modal)
    useEffect(() => {
        if (!isModal && result && resultRef.current) {
            const enterFullScreen = async () => {
                const element = resultRef.current as (HTMLElement & {
                    webkitRequestFullscreen?: () => Promise<void>;
                    msRequestFullscreen?: () => Promise<void>;
                });
                if (!element) return;
                try {
                    if (element.requestFullscreen) {
                        await element.requestFullscreen();
                    } else if (element.webkitRequestFullscreen) {
                        await element.webkitRequestFullscreen();
                    } else if (element.msRequestFullscreen) {
                        await element.msRequestFullscreen();
                    }
                } catch (err) {
                    console.error("Error attempting to enable full-screen mode:", err);
                }
            };
            setTimeout(enterFullScreen, 100);
        }
    }, [result, isModal]);

    return (
        <div ref={resultRef} className={`${isModal ? "p-0 bg-transparent" : "min-h-screen bg-[#050510] flex items-center justify-center p-6"} text-white font-sans w-full h-full overflow-hidden relative`}>
            {!isModal && (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e1b4b_0%,#050510_100%)] z-0" />
            )}

            <motion.div
                initial={isModal ? { opacity: 1 } : { opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative z-10 w-full ${isModal ? "" : "max-w-2xl bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-2xl p-12"} text-center space-y-10`}
            >
                {isModal && onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-0 right-0 z-50 w-8 h-8 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center transition-colors border border-white/10"
                    >
                        <span className="material-icons-outlined text-white text-sm">close</span>
                    </button>
                )}

                <div className="space-y-4">
                    <span className="inline-block px-4 py-1 bottom-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-black  tracking-[0.4em]">
                        Mission_Complete
                    </span>
                    <h1 className="text-5xl font-black  tracking-tighter">Profile_Analyzed</h1>
                </div>

                <div className="relative py-12 px-8 bg-slate-900 rounded-[2.5rem] border border-white/5 overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <span className="material-icons-outlined text-8xl">verified</span>
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div>
                            <span className="text-[10px] font-black text-slate-500  tracking-[0.4em] block mb-4">{test?.trait || "Trait"} Index</span>
                            <div className="flex items-center justify-center gap-3">
                                <span className="text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
                                    {(result.trait_score || 0).toFixed(1)}
                                </span>
                                <span className="text-2xl font-black text-slate-700">/10</span>
                            </div>
                        </div>

                        {/* Accuracy Display */}
                        <div className="flex flex-col items-center justify-center gap-2">
                            <span className="text-[10px] font-black text-slate-400  tracking-[0.4em]">Accuracy_Rating</span>
                            <div className="text-4xl font-black text-white tracking-tight flex items-center gap-2">
                                {((result.trait_score || 0) * 10).toFixed(0)}%
                                <span className="text-[10px] text-slate-500 font-bold tracking-[0.2em] bg-white/10 px-2 py-1 rounded">PRECISION</span>
                            </div>
                        </div>

                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(result.trait_score || 0) * 10}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-slate-500"
                            />
                        </div>

                        <div className="text-left bg-black/20 p-6 rounded-2xl border border-white/5">
                            <p className="text-sm text-slate-400  leading-relaxed font-medium">
                                &quot;{result.profile_summary}&quot;
                            </p>
                        </div>
                    </div>
                </div>

                {!isModal && (
                    <button
                        onClick={() => router.push("/practice/psychometric")}
                        className="w-full py-5 bg-white text-[#050510] rounded-2xl text-[10px] font-black  tracking-[0.3em] hover:bg-slate-200 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        {"Return_to_Psychometric"}
                        <span className="material-icons-outlined text-sm">logout</span>
                    </button>
                )}
            </motion.div>
        </div>
    );
}
