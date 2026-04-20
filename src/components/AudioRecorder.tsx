"use client";

import React, { useState, useRef } from "react";

interface Feedback {
    fluency: number;
    grammar: number;
    confidence: number;
    relevance: number;
    feedback: string;
    transcription?: string;
}

export default function AudioRecorder() {
    const [recording, setRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError("Microphone not supported. Please use HTTPS or localhost.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                setAudioBlob(blob);
                // Explicitly get tracks from the stream captured at start to ensure hardware release
                stream.getTracks().forEach((track) => {
                    track.stop();
                    console.log("AudioRecorder track stopped:", track.label);
                });
            };

            mediaRecorder.start();
            setRecording(true);
            setError(null);
            setFeedback(null);
            setAudioBlob(null); // Clear previous blob when starting new recording
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setError("Could not access microphone.");
        }
    };

    // Robust cleanup on unmount
    React.useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => {
                    track.stop();
                    console.log("AudioRecorder track stopped on unmount:", track.label);
                });
                streamRef.current = null;
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                try { mediaRecorderRef.current.stop(); } catch (e) { }
            }
        };
    }, []);

    const stopRecording = () => {
        if (mediaRecorderRef.current && recording) {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
    };

    const analyzeRecording = async () => {
        if (!audioBlob) return;
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", audioBlob, "recording.webm");

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/coach/analyze`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                throw new Error(`Server error: ${res.statusText}`);
            }

            const data: Feedback = await res.json();
            setFeedback(data);
        } catch (err) {
            console.error("Analysis failed:", err);
            setError("Analysis failed. Ensure backend is running.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 p-6 w-full max-w-2xl mx-auto">
            <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-8">

                {/* Recording Controls */}
                <div className="flex flex-col items-center justify-center gap-4 mb-8">
                    <div className={`relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 ${recording ? 'bg-red-100 dark:bg-red-900/30 animate-pulse' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                        <button
                            onClick={recording ? stopRecording : startRecording}
                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${recording
                                ? "bg-red-500 hover:bg-red-600 scale-90"
                                : "bg-blue-600 hover:bg-blue-700 hover:scale-105"
                                }`}
                        >
                            {recording ? (
                                <div className="w-6 h-6 bg-white rounded-sm" />
                            ) : (
                                <svg className="w-8 h-8 text-white ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        {recording ? "Listening..." : audioBlob ? "Recording ready" : "Tap to speak"}
                    </p>
                </div>

                {/* Action Buttons */}
                {audioBlob && !recording && !feedback && (
                    <button
                        onClick={analyzeRecording}
                        disabled={loading}
                        className="w-full py-3 px-6 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Analyzing Response...
                            </>
                        ) : (
                            "Analyze Answer"
                        )}
                    </button>
                )}

                {error && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900/50">
                        {error}
                    </div>
                )}
            </div>

            {/* Feedback Section */}
            {feedback && (
                <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-xl font-bold mb-6 text-zinc-900 dark:text-white">AI Coach Feedback</h3>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <ScoreCard label="Fluency" score={feedback.fluency} />
                        <ScoreCard label="Grammar" score={feedback.grammar} />
                        <ScoreCard label="Confidence" score={feedback.confidence} />
                        <ScoreCard label="Relevance" score={feedback.relevance} />
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                            <h4 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-2  tracking-wide">Transcript</h4>
                            <p className="text-zinc-700 dark:text-zinc-300 ">&quot;{feedback.transcription}&quot;</p>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                            <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2  tracking-wide">Coach&apos;s Tips</h4>
                            <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-line">{feedback.feedback}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ScoreCard({ label, score }: { label: string; score: number }) {
    const getColor = (s: number) => {
        if (s >= 8) return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
        if (s >= 5) return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
    };

    return (
        <div className={`flex flex-col items-center justify-center p-4 rounded-xl border ${getColor(score)}`}>
            <span className="text-3xl font-bold mb-1">{score}/10</span>
            <span className="text-sm font-medium opacity-80">{label}</span>
        </div>
    );
}
