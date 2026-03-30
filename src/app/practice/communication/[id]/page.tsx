"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/utils/api";

export default function CommunicationDetail() {
    const params = useParams();
    const searchParams = useSearchParams();
    const title = searchParams.get("title");
    const prompt = searchParams.get("prompt");

    const [isRecording, setIsRecording] = useState(false);
    const [audioURL, setAudioURL] = useState<string | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [feedback, setFeedback] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // Check for HTTPS/Secure Context
    useEffect(() => {
        if (typeof window !== 'undefined' && !window.isSecureContext) {
            setError("Microphone access requires HTTPS or localhost. Please enable SSL or use localhost.");
        }
    }, []);

    const startRecording = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError("Microphone not supported. Please use HTTPS or localhost.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            // Clear previous recording state
            setAudioURL(null);
            setAudioBlob(null);

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                const url = URL.createObjectURL(blob);
                setAudioURL(url);
                setAudioBlob(blob);

                // Stop all tracks to turn off the microphone hardware
                stream.getTracks().forEach((track) => {
                    track.stop();
                    console.log("Track stopped:", track.label);
                });
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setFeedback(null);
            setError(null);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setError("Microphone access denied or not available.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const submitRecording = async () => {
        // Safety check: Stop recording if it's still running
        if (isRecording) {
            stopRecording();
        }

        if (!audioBlob) return;

        setAnalyzing(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", audioBlob, "recording.webm");

        // Pass scenario_id from URL params if available (it comes from [id])
        if (params && params.id) {
            formData.append("scenario_id", params.id as string);
        }

        try {
            // apiClient handles FormData automatically
            const res = await apiClient.post(`/api/v1/coach/analyze`, formData);

            if (!res.ok) {
                throw new Error("Analysis failed");
            }

            const data = await res.json();
            setFeedback(data);

        } catch (err) {
            console.error(err);
            setError("Failed to analyze audio. Please try again.");
        } finally {
            setAnalyzing(false);
        }
    };

    const getScenarioIcon = (scenarioTitle: string | null) => {
        const t = (scenarioTitle || "").toLowerCase();
        if (t.includes('introduction') || t.includes('self')) return 'record_voice_over';
        if (t.includes('conflict')) return 'groups';
        if (t.includes('company')) return 'business';
        if (t.includes('weakness')) return 'psychology';
        if (t.includes('aspiration') || t.includes('future')) return 'rocket_launch';
        return 'campaign';
    };

    return (
        <div className="h-full w-full bg-[#F8FAFC] relative overflow-hidden text-slate-900 flex flex-col">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-slate-200/50 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[10%] right-[-5%] w-[25%] h-[25%] bg-slate-100/50 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="flex-1 flex flex-col max-w-[1800px] mx-auto w-full p-4 lg:p-6 relative z-10 h-full">
                {/* Minimal Top Header */}
                <div className="flex items-center justify-between opacity-50 mb-4 shrink-0 px-2">
                    <button
                        onClick={() => window.history.back()}
                        className="group flex items-center gap-1.5 text-slate-400 hover:text-slate-900 transition-all text-[9px] font-black tracking-[0.2em] uppercase"
                    >
                        <span className="material-icons-outlined text-[12px]">arrow_back</span>
                        Leave Studio
                    </button>
                    <div className="flex items-center gap-1.5 text-[8px] font-black tracking-[0.2em] uppercase text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                        Academik_OS // Node_Alpha
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 min-h-0">
                    {/* LEFT COLUMN: Briefing & Trigger */}
                    <div className="lg:col-span-4 flex flex-col gap-4 lg:gap-6 h-full min-h-0">

                        {/* 01. MISSION BRIEFING CARD */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative group flex-1 flex flex-col min-h-0 overflow-hidden">
                            <button className="absolute top-6 right-6 text-slate-200 hover:text-slate-400 transition-colors z-10">
                                <span className="material-icons-outlined text-lg">more_horiz</span>
                            </button>

                            <div className="flex items-center gap-3 mb-6 shrink-0">
                                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shadow-md shadow-slate-200 shrink-0">
                                    <span className="material-icons-outlined text-xl text-white">{getScenarioIcon(title)}</span>
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[8px] font-black text-slate-400 tracking-[0.3em] uppercase mb-0.5 block">Mission Briefing</span>
                                    <h1 className="text-base font-black tracking-tight text-slate-900 truncate pr-8">{title}</h1>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar bg-slate-50/80 rounded-2xl p-6">
                                <p className="text-[12px] text-slate-600 leading-relaxed italic font-medium">
                                    "{prompt}"
                                </p>
                            </div>
                        </div>

                        {/* 02. INITIATE RECORDING CARD */}
                        <div className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-4 shrink-0 relative transition-all duration-500 ${feedback ? 'hidden opacity-0 scale-95 pointer-events-none absolute' : 'flex opacity-100 scale-100'}`}>
                            <div className="relative">
                                {isRecording && (
                                    <div className="absolute inset-[-10px] border border-slate-300 rounded-full animate-ping opacity-30"></div>
                                )}

                                <button
                                    onClick={isRecording ? stopRecording : startRecording}
                                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl relative z-10 
                                        ${isRecording ? 'bg-slate-900 shadow-slate-200 animate-pulse' : 'bg-slate-800 hover:bg-slate-900 shadow-slate-200 hover:scale-105 active:scale-95'}`}
                                >
                                    <span className="material-icons-outlined text-3xl text-white">
                                        {isRecording ? 'stop' : 'mic'}
                                    </span>
                                </button>
                            </div>

                            <div className="text-center space-y-1">
                                <span className="text-[9px] font-black tracking-[0.3em] text-slate-400 uppercase">
                                    {isRecording ? 'Capturing Stream' : 'Initiate Recording'}
                                </span>
                            </div>

                            {/* Error Display */}
                            <div className="text-[9px] font-medium text-slate-400 mt-2 text-center">
                                Use English only for analysis.
                            </div>
                            {error && (
                                <div className="absolute bottom-4 left-0 right-0 px-4">
                                    <div className="bg-rose-50 text-rose-600 text-[10px] font-bold py-2 px-3 rounded-lg border border-rose-200 animate-in fade-in slide-in-from-bottom-2 text-center shadow-sm">
                                        <span className="material-icons-outlined text-xs align-middle mr-1">error_outline</span>
                                        {error}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: TELEMETRY SIGNAL PANEL */}
                    <div className={`lg:col-span-8 bg-white rounded-[2.5rem] flex flex-col overflow-hidden transition-all duration-700 h-full ${analyzing ? 'border-transparent shadow-none' : 'border border-slate-100 shadow-sm'}`}>

                        {/* SIGNAL PROCESSING AREA */}
                        <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-y-auto custom-scrollbar">
                            {analyzing ? (
                                <div className="flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in duration-1000 my-auto">
                                    <div className="relative">
                                        {/* Recursive Pulse Rings */}
                                        <div className="absolute inset-[-20px] border-2 border-slate-500/20 rounded-full animate-[ping_2s_linear_infinite]"></div>
                                        <div className="absolute inset-[-40px] border border-slate-400/10 rounded-full animate-[ping_2s_linear_infinite_0.5s]"></div>
                                        <div className="absolute inset-[-60px] border border-slate-300/5 rounded-full animate-[ping_2s_linear_infinite_1s]"></div>

                                        {/* Core Glowing Orb */}
                                        <div className="w-20 h-20 bg-gradient-to-tr from-slate-700 to-slate-900 rounded-full shadow-[0_0_50px_rgba(100,116,139,0.3)] flex items-center justify-center relative z-10 border border-white/20">
                                            <span className="material-symbols-rounded text-white text-3xl animate-pulse">auto_awesome</span>
                                        </div>
                                    </div>

                                    <div className="text-center space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black tracking-[0.6em] text-slate-600 uppercase animate-pulse">Synthesizing Signal</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Applying Neural Filters...</p>
                                        </div>
                                        {/* Precision Progress Bar */}
                                        <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-slate-500 to-slate-700 animate-[loading_1.5s_ease-in-out_infinite]"></div>
                                        </div>
                                    </div>
                                </div>
                            ) : feedback ? (
                                <div className="w-full max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 py-8">
                                    {/* Metrics Flow */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        {[
                                            { label: "Fluency", key: "fluency", icon: "graphic_eq", color: "text-emerald-500", bg: "bg-emerald-500" },
                                            { label: "Grammar", key: "grammar", icon: "spellcheck", color: "text-blue-500", bg: "bg-blue-500" },
                                            { label: "Confidence", key: "confidence", icon: "psychology", color: "text-violet-500", bg: "bg-violet-500" },
                                            { label: "Relevance", key: "relevance", icon: "target", color: "text-rose-500", bg: "bg-rose-500" }
                                        ].map((m) => {
                                            const val = feedback[m.key];
                                            return (
                                                <div key={m.key} className="bg-white/50 backdrop-blur-sm p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center group hover:shadow-md transition-all duration-300">
                                                    <div className={`w-10 h-10 rounded-full ${m.bg}/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                                        <span className={`material-icons-outlined ${m.color} text-xl`}>{m.icon}</span>
                                                    </div>
                                                    <span className="text-3xl font-black text-slate-900 mb-1 tracking-tighter">{val}</span>
                                                    <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">{m.label}</span>
                                                    {/* Mini progress bar */}
                                                    <div className="w-16 h-1 bg-slate-100 mt-3 rounded-full overflow-hidden">
                                                        <div className={`h-full ${m.bg}`} style={{ width: `${val * 10}%` }}></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* 1. What You Said (Transcription) */}
                                        <div className="p-8 bg-white border border-slate-200 rounded-[2rem] space-y-4 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
                                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                                                <span className="material-icons-outlined text-8xl">format_quote</span>
                                            </div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                                    <span className="material-icons-outlined text-sm">record_voice_over</span>
                                                </div>
                                                <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">What You Said</h3>
                                            </div>
                                            <p className="text-sm leading-relaxed text-slate-600 italic font-medium">
                                                "{feedback.transcription || "No transcription available."}"
                                            </p>
                                        </div>

                                        {/* 2. Analysis & Improvements (Refined) */}
                                        <div className="p-8 bg-white border border-slate-100 rounded-[2rem] space-y-4 relative overflow-hidden group shadow-xl shadow-slate-100/50">
                                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                                                <span className="material-icons-outlined text-8xl text-indigo-600">auto_fix_high</span>
                                            </div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                    <span className="material-icons-outlined text-sm">psychology</span>
                                                </div>
                                                <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-indigo-400">Analysis & Improvements</h3>
                                            </div>
                                            <p className="text-sm leading-relaxed text-slate-700 font-medium">
                                                {feedback.feedback}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : audioURL && !isRecording ? (
                                // AUDIO RECORDED - READY TO ANALYZE
                                <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500">
                                    <div className="relative group cursor-pointer" onClick={submitRecording}>
                                        <div className="absolute inset-0 bg-slate-200 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500 animate-pulse"></div>
                                        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl shadow-slate-200 border-4 border-white relative z-10 group-hover:scale-105 transition-transform duration-300">
                                            <span className="material-icons-outlined text-5xl text-slate-900">check_circle</span>
                                        </div>
                                        <div className="absolute -bottom-2 -nav-right-2 bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full border-2 border-white shadow-lg z-20">
                                            READY
                                        </div>
                                    </div>

                                    <div className="text-center space-y-2">
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Signal Locked</h2>
                                        <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
                                            Audio captured successfully. Ready for neural analysis.
                                        </p>
                                    </div>

                                    <button
                                        onClick={submitRecording}
                                        className="group relative inline-flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] tracking-[0.3em] uppercase shadow-lg shadow-slate-300 hover:bg-black hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            <span>Analyze Signal</span>
                                            <span className="material-icons-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setAudioURL(null);
                                            setAudioBlob(null);
                                        }}
                                        className="text-[9px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                                    >
                                        Discard & Retry
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center space-y-8 border-2 border-dashed border-slate-50 rounded-[2rem] m-4">
                                    {/* Visual Waveform Mockup */}
                                    <div className="flex items-center justify-center gap-1 h-20">
                                        {[20, 45, 30, 65, 90, 110, 80, 55, 40, 25, 40, 55, 80, 110, 90, 65, 30, 45, 20].map((h, i) => (
                                            <div
                                                key={i}
                                                className={`w-1 rounded-full transition-all duration-300 ${isRecording ? 'bg-slate-700 animate-[pulse_0.5s_ease-in-out_infinite]' : 'bg-slate-300'}`}
                                                style={{
                                                    height: isRecording ? `${h + Math.random() * 20}%` : `${h}px`,
                                                    animationDelay: `${i * 0.05}s`
                                                }}
                                            ></div>
                                        ))}
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="text-[9px] font-black tracking-[0.5em] text-slate-300 uppercase animate-pulse">
                                            {isRecording ? 'Decoding Live stream...' : 'Awaiting audio input stream...'}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-medium max-w-md mx-auto px-4">
                                            Speak clearly and at a moderate pace for best analysis results.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(150%); }
                    100% { transform: translateX(400%); }
                }
                .custom-scrollbar::-webkit-scrollbar {
                  width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: #cbd5e1;
                  border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #94a3b8;
                }
            `}</style>
        </div>
    );
}
