"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDiscussionSession } from "@/hooks/useDiscussionSession";
import { enterFullScreen } from "@/utils/fullscreen";
import Cookies from "js-cookie";

export default function GDWaitingRoom({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { participants: allParticipants, status } = useDiscussionSession(id);
    // Filter out bots (id < 0) for the lobby view
    const participants = allParticipants.filter(p => p.id !== null && p.id > 0);

    const [timeLeft, setTimeLeft] = useState(300);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasMedia, setHasMedia] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let mounted = true;
        let localStream: MediaStream | null = null;
        async function setupMedia() {
            try {
                localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (mounted && videoRef.current) {
                    videoRef.current.srcObject = localStream;
                    // Explicitly play the video
                    try {
                        const playPromise = videoRef.current.play();
                        if (playPromise !== undefined) {
                            await playPromise;
                        }
                        // Video playing successfully
                    } catch {
                        // Silent failure for video play (e.g. AbortError when play interrupted by load request)
                    }
                    setHasMedia(true);
                } else {
                    // Unmounted or ref gone, clean explicitly
                    if (localStream) {
                        localStream.getTracks().forEach(track => {
                            track.stop();
                            track.enabled = false;
                        });
                    }
                }
            } catch (err) {
                // Media access denied
            }
        }
        setupMedia();

        // Cleanup: stop media tracks when leaving
        return () => {
            mounted = false;
            // Stop the specific stream created
            if (localStream) {
                localStream.getTracks().forEach(track => {
                    track.stop();
                    track.enabled = false;
                });
            }
        };
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };


    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="w-full max-w-6xl bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
                    {/* Left Panel: Session & Media Check */}
                    <div className="lg:col-span-5 p-10 bg-slate-900 text-white space-y-8 flex flex-col justify-between">
                        <div>
                            <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black  ">Pre-Session Lobby</span>
                            <h1 className="text-4xl font-black mt-4  tracking-tighter leading-tight">Live Group Discussion</h1>

                            <div className="mt-8 bg-black/20 rounded-3xl overflow-hidden aspect-video relative border border-white/10">
                                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror" />
                                {!hasMedia && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                                        <div className="text-center">
                                            <span className="material-icons text-4xl mb-2">videocam_off</span>
                                            <p className="text-xs font-black  ">Allow Camera Access</p>
                                        </div>
                                    </div>
                                )}
                                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                                    <div className="px-3 py-1 bg-white/20 rounded-full text-[8px] font-black   flex items-center gap-1">
                                        <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                                        Media Ready
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white/10 rounded-2xl p-6 border border-white/10">
                                <p className="text-xs font-black   text-slate-400">Session Starts In</p>
                                <p className="text-5xl font-black tabular-nums mt-1">{formatTime(timeLeft)}</p>
                            </div>

                            <ul className="space-y-3">
                                {[
                                    "Speak clearly when called upon",
                                    "AI will analyze your logic and persuasion",
                                    "Cameras remain on for proctoring",
                                    "Provide data-backed arguments"
                                ].map((rule, i) => (
                                    <li key={i} className="flex gap-3 text-sm font-medium text-slate-300">
                                        <span className="text-slate-500">●</span>
                                        {rule}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Right Panel: Participants */}
                    <div className="lg:col-span-7 p-10 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black  tracking-tight text-slate-900 border-l-4 border-slate-900 pl-4">Participants Joined</h3>
                                <span className="text-sm font-black text-slate-900 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                                    {participants.length} / 10
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {participants.map((p, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-slate-300 transition-all">
                                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 font-black text-sm group-hover:bg-slate-900 group-hover:text-white transition-all">
                                            {p.name?.charAt(0) || 'S'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800  leading-none">{p.name || `Student ${idx + 1}`}</p>
                                            <p className="text-[10px] text-slate-400 font-bold   mt-1">Status: Ready</p>
                                        </div>
                                    </div>
                                ))}

                                {Array.from({ length: 10 - participants.length }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 border border-dashed border-slate-200 rounded-2xl opacity-40">
                                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                                            <span className="material-icons text-sm">person_add</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400  ">Waiting for student...</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-10 space-y-4">
                            <button
                                onClick={() => {
                                    enterFullScreen();
                                    router.push(`/practice/discussion/${id}/room`);
                                }}
                                className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black   shadow-xl shadow-slate-200 hover:bg-black transition-all flex items-center justify-center gap-3 group"
                            >
                                {"Enter Discussion Room"}
                                <span className="material-icons group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </button>
                            <p className="text-center text-[10px] font-black text-slate-400  ">Session will transition when the moderator gives the signal</p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .mirror { transform: rotateY(180deg); }
            `}</style>
        </div>
    );
}
