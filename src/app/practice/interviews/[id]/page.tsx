"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, usePathname, useSearchParams } from "next/navigation";
import { useInterviewSession } from "@/hooks/useInterviewSession";
import InterviewLobby from "@/components/interview/InterviewLobby";
import InterviewRunner from "@/components/interview/InterviewRunner";
import InterviewFeedback from "@/components/interview/InterviewFeedback";
import { apiClient } from "@/utils/api";
import AIGenerationOverlay from "@/components/ui/AIGenerationOverlay";

export default function InterviewSessionPage() {
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isFromAssessment = searchParams.get("source") === "assessment";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [interview, setInterview] = useState<any>(null);
    const [hasStarted, setHasStarted] = useState(false);

    const {
        status,
        currentStep,
        transcript,
        mediaState,
        isAiSpeaking,
        isSaving,
        backendResults,
        offTabCount,
        actions
    } = useInterviewSession({ interviewId: params.id as string });

    useEffect(() => {
        if (params.id) {
            // eslint-disable-next-line react-hooks/immutability
            fetchInterviewDetails();
        }
    }, [params.id]);

    const fetchInterviewDetails = async () => {
        try {
            const response = await apiClient.get(`/api/v1/interviews/${params.id}`);
            if (response.ok) {
                const data = await response.json();
                setInterview(data);
            }
        } catch (error) {
            console.error("Failed to fetch interview", error);
        }
    };

    const handleStartInterview = () => {
        setHasStarted(true);
        // enterFullScreen(); // Removed forced fullscreen
        actions.joinSession();
        router.push(`${pathname}`);
    };

    // Ensure media is stopped when interview completes or starts saving
    useEffect(() => {
        if ((status === 'completed' || isSaving) && mediaState.stream) {
            console.log("Interview completed/saving - stopping media tracks");
            mediaState.stream.getTracks().forEach(track => {
                track.stop();
                console.log(`Stopped ${track.kind} track`);
            });
            mediaState.setStream(null);
        }
    }, [status, isSaving]);

    if (status === 'completed' || isSaving) {
        return (
            <>
                <AIGenerationOverlay isOpen={isSaving || !backendResults} title="Synthesizing Interview Performance" />
                <InterviewFeedback
                    transcript={transcript}
                    offTabCount={offTabCount}
                    isSaving={isSaving}
                    backendResults={backendResults}
                />
            </>
        );
    }

    if (status === 'active') {
        return (
            <InterviewRunner
                interview={interview}
                currentStep={currentStep}
                transcript={transcript}
                onEnd={actions.endSession}
                onSendMessage={actions.sendMessage}
                isAiSpeaking={isAiSpeaking}
                mediaState={mediaState}
            />
        );
    }

    if (hasStarted) {
        if (status === 'initializing') {
            return (
                <div className="flex flex-col h-screen bg-black text-white items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="h-32 w-32 bg-slate-900 border border-slate-800 rounded-full mx-auto flex items-center justify-center animate-pulse">
                            <span className="material-symbols-rounded text-6xl text-slate-500">leak_add</span>
                        </div>
                        <h2 className="text-2xl font-black  tracking-tight">Initializing Session...</h2>
                        <p className="text-[10px] text-slate-500 font-bold  ">Allocating AI resources.</p>
                    </div>
                </div>
            );
        }

        return (
            <InterviewLobby
                onJoin={actions.joinSession}
                mediaState={mediaState}
            />
        );
    }

    if (!interview) return (
        <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Loading Interview Details...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-body transition-colors duration-300">
            <main className="max-w-5xl mx-auto px-6 py-8 lg:py-12 flex flex-col items-center">
                <section className="w-full mb-10 overflow-hidden rounded-[2.5rem] relative">
                    <div className="absolute inset-0 bg-slate-900"></div>
                    <div className="relative z-10 p-10 lg:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="max-w-lg space-y-4">
                            <span className="inline-block px-3 py-1 bg-white/10 text-white text-[10px] font-black   rounded-full border border-white/20 backdrop-blur-sm">
                                {isFromAssessment ? 'Phase 2: Technical Verification' : 'Conversational AI_v2.0'}
                            </span>
                            <h2 className="text-3xl font-black text-white  tracking-tight leading-tight">
                                {isFromAssessment ? 'Ready for Live Evaluation?' : 'Elevate your interview performance'}
                            </h2>
                            <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-sm">
                                {isFromAssessment
                                    ? "Code analysis complete. Proceeding to vocal technical defense. The AI has been briefed on your assessment context."
                                    : "The AI will ask technical questions based on your specialized JD and evaluate your responses in real-time."
                                }
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <div className="relative">
                                <div className="absolute -inset-4 bg-white/5 blur-2xl rounded-full"></div>
                                <span className="material-symbols-rounded text-6xl text-slate-500 relative">psychology</span>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="w-full max-w-4xl glass-card rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-none p-6 lg:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-3 space-y-8">
                            <div>
                                <div className="font-display text-lg font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
                                    <span className="w-1.5 h-6 bg-slate-500 rounded-full"></span>
                                    {"Interview Readiness"}
                                </div>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            <span className="material-symbols-rounded text-slate-500 text-lg">mic</span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Quiet Environment</h4>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Ensure you are in a room with minimal background noise.</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            <span className="material-symbols-rounded text-slate-500 text-lg">graphic_eq</span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Speak Naturally</h4>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Wait for the AI to finish speaking before responding.</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            <span className="material-symbols-rounded text-slate-500 text-lg">fiber_manual_record</span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Session Recorded</h4>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Your audio and transcript will be saved for evaluation.</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                                <div className="font-display text-lg font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
                                    <span className="w-1.5 h-6 bg-slate-500 rounded-full"></span>
                                    {"Target Job Description"}
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap ">
                                        {interview.job_description || "No job description provided for this session."}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-2 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700 pt-6 lg:pt-0 lg:pl-10">
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-center border border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500   mb-3">Estimated Duration</p>
                                <div className="flex items-baseline justify-center gap-1 mb-1">
                                    <span className="font-mono text-4xl font-bold text-slate-800 dark:text-white">{interview.settings?.duration || 30}</span>
                                    <span className="text-lg font-medium text-slate-500 dark:text-slate-400">MIN</span>
                                </div>
                                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-500 font-semibold">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-500 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500"></span>
                                    </span>
                                    <span>AI System Online</span>
                                </div>
                            </div>
                            <div className="mt-8 space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Difficulty</span>
                                    <span className="font-medium text-slate-800 dark:text-slate-200">Professional</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Questions</span>
                                    <span className="font-medium text-slate-800 dark:text-slate-200">12-15 items</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-slate-100">
                        <button
                            onClick={handleStartInterview}
                            className="w-full sm:w-auto px-10 py-4 bg-slate-900 hover:bg-black text-white font-black text-[11px] tracking-[0.2em]  rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3 group"
                        >
                            <span>{isFromAssessment ? 'Initiate Phase 2' : 'Start AI Interview'}</span>
                            <span className="material-symbols-rounded text-base font-bold">arrow_forward</span>
                        </button>
                        <button
                            onClick={() => {
                                setHasStarted(true);
                                router.push(`${pathname}?mode=fullscreen`);
                            }}
                            className="w-full sm:w-auto px-6 py-4 bg-white text-slate-400 font-bold text-[11px]   rounded-2xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-rounded text-base">settings</span>
                            <span>Hardware Test</span>
                        </button>
                    </div>
                </div>
                <footer className="mt-10 text-center">
                    <p className="text-slate-400 dark:text-slate-500 text-[11px] flex items-center justify-center gap-2">
                        <span className="material-symbols-rounded text-sm">verified_user</span>
                        <span>Secure & Private Interview Environment</span>
                    </p>
                </footer>
            </main>
        </div>
    );
}
