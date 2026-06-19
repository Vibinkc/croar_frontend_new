import React, { useState, useEffect, useCallback } from 'react';
import { useInterviewSession } from "@/hooks/useInterviewSession";
import InterviewLobby from "@/components/interview/InterviewLobby";
import InterviewRunner from "@/components/interview/InterviewRunner";
import InterviewFeedback from "@/components/interview/InterviewFeedback";
import AIGenerationOverlay from "@/components/ui/AIGenerationOverlay";
import { apiClient } from "@/utils/api";

interface InterviewData {
    id: number;
    title: string;
    topic: string;
    difficulty: string;
    duration: number;
    require_video: boolean;
    avatar_config?: {
        avatar?: string;
    };
}

interface EmbeddedInterviewWrapperProps {
    interviewId: number;
    onComplete: () => void;
}

export default function EmbeddedInterviewWrapper({ interviewId, onComplete }: EmbeddedInterviewWrapperProps) {
    const [interview, setInterview] = useState<InterviewData | null>(null);
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
    } = useInterviewSession({ interviewId: interviewId.toString() });

    const fetchInterviewDetails = useCallback(async () => {
        try {
            const response = await apiClient.get(`/api/v1/interviews/${interviewId}`);
            if (response.ok) {
                const data = await response.json();
                setInterview(data);
            }
        } catch (error) {
            console.error("Failed to fetch interview", error);
        }
    }, [interviewId]);

    useEffect(() => {
        if (interviewId) {
            setTimeout(() => fetchInterviewDetails(), 0);
        }
    }, [interviewId, fetchInterviewDetails]);

    const handleStartInterview = () => {
        setHasStarted(true);
        actions.joinSession();
    };

    // Ensure media is stopped when interview completes or starts saving
    useEffect(() => {
        const { stream, setStream } = mediaState;
        if ((status === 'completed' || isSaving) && stream) {
            console.log("Interview completed/saving - stopping media tracks");
            stream.getTracks().forEach(track => {
                track.stop();
            });
            setStream(null);
        }
    }, [status, isSaving, mediaState]);

    // Handle session end/completion
    useEffect(() => {
        if (status === 'completed' && backendResults) {
            // Optional: Auto-redirect or show a "Finish Assessment" button after some time?
        }
    }, [status, backendResults]);

    if (status === 'completed' || isSaving) {
        return (
            <div className="w-full h-full flex flex-col">
                <AIGenerationOverlay isOpen={isSaving || !backendResults} title="Synthesizing Interview Performance" />
                {!isSaving && backendResults && (
                    <div className="flex-1 overflow-auto p-6 bg-slate-50 dark:bg-slate-900">
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black  text-slate-800 dark:text-white">Interview Complete</h2>
                                <button
                                    onClick={onComplete}
                                    className="px-6 py-2 bg-slate-900 text-white text-sm font-bold   rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    Return to Results
                                </button>
                            </div>
                            <InterviewFeedback
                                transcript={transcript}
                                offTabCount={offTabCount}
                                isSaving={isSaving}
                                backendResults={backendResults}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (status === 'active') {
        return (
            <div className="fixed inset-0 z-50 bg-black">
                <InterviewRunner
                    interview={interview}
                    currentStep={currentStep}
                    transcript={transcript}
                    onEnd={actions.endSession}
                    onSendMessage={actions.sendMessage}
                    isAiSpeaking={isAiSpeaking}
                    mediaState={mediaState}
                />
            </div>
        );
    }

    if (hasStarted) {
        if (status === 'initializing') {
            return (
                <div className="flex flex-col h-full bg-slate-900 text-white items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="h-20 w-20 bg-slate-800 border border-slate-700 rounded-full mx-auto flex items-center justify-center animate-pulse">
                            <span className="material-symbols-rounded text-4xl text-slate-500">leak_add</span>
                        </div>
                        <h2 className="text-xl font-black  tracking-tight">Initializing Session...</h2>
                        <p className="text-[10px] text-slate-500 font-bold  ">Allocating AI resources.</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="fixed inset-0 z-50 bg-black">
                <InterviewLobby
                    onJoin={actions.joinSession}
                    mediaState={mediaState}
                />
            </div>
        );
    }

    if (!interview) return (
        <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    // Initial "Ready" Screen (Replica of the "Intro" but embedded)
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-2xl text-center space-y-8">
                <div className="w-24 h-24 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-icons-outlined text-5xl">videocam</span>
                </div>

                <div className="space-y-4">
                    <span className="inline-block px-3 py-1 bg-rose-100 text-rose-600 text-[10px] font-black   rounded-full">
                        Final Round
                    </span>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white  tracking-tight">
                        Ready for the Live Interview?
                    </h2>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-lg mx-auto">
                        You have completed the technical assessment. The final phase is a live video interview with our AI avatar to discuss your background and technical approach.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-xl mx-auto text-left">
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <span className="material-icons-outlined text-slate-400 mb-2">mic</span>
                        <h4 className="font-bold text-xs text-slate-700 dark:text-slate-200">Clear Audio</h4>
                        <p className="text-[10px] text-slate-500">Ensure quiet environment.</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <span className="material-icons-outlined text-slate-400 mb-2">videocam</span>
                        <h4 className="font-bold text-xs text-slate-700 dark:text-slate-200">Camera On</h4>
                        <p className="text-[10px] text-slate-500">Video feed required.</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <span className="material-icons-outlined text-slate-400 mb-2">timer</span>
                        <h4 className="font-bold text-xs text-slate-700 dark:text-slate-200">~30 Mins</h4>
                        <p className="text-[10px] text-slate-500">Estimated duration.</p>
                    </div>
                </div>

                <button
                    onClick={handleStartInterview}
                    className="px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs tracking-[0.2em]  rounded-xl transition-all shadow-lg hover:shadow-rose-500/30 flex items-center justify-center gap-3 mx-auto"
                >
                    Start Final Round
                    <span className="material-icons-outlined text-base">arrow_forward</span>
                </button>
            </div>
        </div>
    );
}
