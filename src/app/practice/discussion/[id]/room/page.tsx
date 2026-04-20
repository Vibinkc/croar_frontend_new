"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDiscussionSession } from "@/hooks/useDiscussionSession";
import { useGazeTracker } from "@/hooks/useGazeTracker";
import { enterFullScreen } from "@/utils/fullscreen";
import { apiClient } from "@/utils/api";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

interface CurrentUser {
    id: string | number;
    name: string;
}

import { Participant } from "@/hooks/useDiscussionSession";

export default function GDDiscussionRoom({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const {
        messages,
        participants,
        queue,
        isAiSpeaking,
        speak,
        sendMessage,
        startListening,
        stopListening,
        raiseHand,
        lowerHand,
        finishTurn,
        status,
        timeRemaining,
        error,
        enterRoom,
        endSession: hookEndSession // Rename to avoid conflict
    } = useDiscussionSession(id);

    const [isMicOn, setIsMicOn] = useState(false);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    // Remove individual videoRef, use participant row
    const [stream, setStream] = useState<MediaStream | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const gazeStatus = useGazeTracker(stream);
    const lastWarningTime = useRef<number>(0);

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Sync ref with state
    useEffect(() => {
        streamRef.current = stream;
    }, [stream]);

    // Reliable Media Cleanup Function
    const stopLocalMedia = useCallback(() => {
        const currentStream = streamRef.current;
        if (currentStream) {
            console.log("Stopping all media tracks...");
            currentStream.getTracks().forEach(track => {
                track.stop();
                track.enabled = false;
                console.log(`Stopped track: ${track.kind}`);
            });
            // Important: Clear the ref and state
            streamRef.current = null;
        }
    }, []);

    // Initialize User & Media
    useEffect(() => {
        // 1. Identify User
        const token = Cookies.get("auth_");
        if (token) {
            try {
                const decoded = jwtDecode(token) as { user_id?: string | number, sub?: string | number, name?: string };
                // decoded.user_id is now provided by backend
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setCurrentUser({
                    id: decoded.user_id || decoded.sub,
                    name: decoded.name || "Me"
                });
            } catch (e) {
                console.error("Token decode failed:", e);
            }
        }

        // 2. Get Camera Stream
        async function enableStream() {
            try {
                const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setStream(s);
                setIsMicOn(true); // Default mic on
            } catch (err) {
                console.error("Camera access denied:", err);
            }
        }
        enableStream();

        return () => {
            // Cleanup on unmount
            stopLocalMedia();
        };
    }, [stopLocalMedia]);

    // Cleanup media when component is navigated away from (redundancy)
    useEffect(() => {
        return () => {
            stopLocalMedia();
        };
    }, [stopLocalMedia]);

    // Head movement detection warning
    useEffect(() => {
        if (!gazeStatus.isLookingAtCamera && gazeStatus.lookingAwayDuration > 3000) {
            const now = Date.now();
            // 15 second cooldown for warnings
            if (now - lastWarningTime.current > 15000) {
                // Try to get the name from the participants list first (most accurate display name)
                const participantName = participants.find(p => String(p.id) === String(currentUser?.id))?.name;

                // Comprehensive fallback chain for user name
                const nameToUse = participantName ||
                    currentUser?.name ||
                    currentUser?.full_name ||
                    currentUser?.first_name ||
                    currentUser?.username ||
                    "";

                // If we have a name, use it. Otherwise use "Attention" to avoid "Student/Candidate" ambiguity.
                const prefix = nameToUse ? `${nameToUse}, ` : "Attention, ";
                const warningText = `${prefix}please keep your head steady and stay focused on the discussion. Do not move your head away from the camera.`;

                speak(warningText);
                lastWarningTime.current = now;
            }
        }
    }, [gazeStatus, currentUser, speak, participants]);

    const lastSpokenMessageRef = useRef<string>("");

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });

        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.user_name === 'AI Moderator' && lastMsg.text !== lastSpokenMessageRef.current) {
            // speak(lastMsg.text); // Handled by hook now on WS event
            lastSpokenMessageRef.current = lastMsg.text;
        }
    }, [messages, speak]);

    const toggleMic = () => {
        if (isMicOn) {
            stopListening();
        } else {
            startListening();
        }
        setIsMicOn(!isMicOn);
    };

    // Explicitly start session when entering the room
    useEffect(() => {
        // We wait a bit or check if connected, but the hook handles readyState check
        // A small timeout helps ensuring ws is open if pure React effect fires too fast
        const timer = setTimeout(() => {
            enterRoom();
        }, 1000);
        return () => clearTimeout(timer);
    }, [enterRoom]);

    const [isEnding, setIsEnding] = useState(false);
    const handleEndSession = async () => {
        if (confirm("Are you sure you want to leave the discussion? Your ranking will be generated based on your contributions so far.")) {
            setIsEnding(true);

            // 1. Stop Local Media IMMEDIATELY before async calls
            stopLocalMedia();
            setStream(null);

            // 2. Cleanup Hook Logic (TTS, WS, Recognition) + Pass media cleanup
            hookEndSession(stopLocalMedia);

            // 3. Finalize on Server
            try {
                await apiClient.post(`/api/v1/discussion/${id}/finalize`, {});
            } catch (error) {
                console.error("Failed to finalize session:", error);
            }

            // 4. Redirect
            router.push(`/practice/discussion/${id}/results`);
        }
    };



    // Auto-finalize when timer hits 0
    useEffect(() => {
        if (timeRemaining === 0 && status === 'active') {
            setTimeout(() => {
                handleEndSession();
            }, 0);
        }
    }, [timeRemaining, status]);

    const formatTime = (seconds: number | null) => {
        if (seconds === null) return "--:--";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="h-screen bg-[#0f172a] text-slate-100 flex flex-col font-sans overflow-hidden">
            {/* Slim Header */}
            <header className="h-16 bg-slate-900/40 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                        <span className="material-icons text-xl text-slate-900">psychology</span>
                    </div>
                    <div>
                        <h1 className="text-[8px] font-black   text-slate-400 leading-none">Moderated GD</h1>
                        <p className="text-sm font-black text-white leading-none mt-1 tracking-tight  ">{id.split('-')[0]}: High Fidelity Voice</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Countdown Timer */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-500 ${timeRemaining !== null && timeRemaining < 60 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                        <span className={`material-icons text-lg ${timeRemaining !== null && timeRemaining < 60 ? 'animate-pulse' : ''}`}>
                            timer
                        </span>
                        <span className="text-sm font-black tabular-nums tracking-tighter">{formatTime(timeRemaining)}</span>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black   text-emerald-500">Live</span>
                    </div>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Error Banner Container */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-4 flex flex-col gap-2 pointer-events-none">
                    {error && (
                        <div className="bg-slate-900/90 backdrop-blur-md text-white py-3 px-6 rounded-2xl border border-white/10 flex items-center justify-between animate-in slide-in-from-top duration-300 pointer-events-auto shadow-2xl">
                            <div className="flex items-center gap-3">
                                <span className="material-icons text-red-400">error</span>
                                <p className="font-bold text-xs  ">{error}</p>
                            </div>
                        </div>
                    )}
                    {!gazeStatus.isLookingAtCamera && (
                        <div className="bg-amber-500 text-slate-950 py-2 px-6 rounded-2xl flex items-center justify-between animate-in slide-in-from-top duration-300 pointer-events-auto shadow-2xl">
                            <div className="flex items-center gap-3">
                                <span className="material-icons">warning</span>
                                <p className="font-black   text-[10px]">Head Movement Detected! Please stay focused</p>
                            </div>
                        </div>
                    )}
                    {queue.find(q => String(q.id) === String(currentUser?.id)) && (
                        <div className="bg-blue-600 text-white py-3 px-6 rounded-2xl flex items-center justify-between animate-in slide-in-from-top duration-500 pointer-events-auto shadow-2xl">
                            <div className="flex items-center gap-3">
                                <span className="material-icons animate-bounce">pan_tool</span>
                                <div>
                                    <p className="font-black   text-[10px]">Hand Raised</p>
                                    <p className="text-[8px] font-bold opacity-80 ">Position: #{queue.findIndex(q => String(q.id) === String(currentUser?.id)) + 1}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Video Grid (Google Meet Style) */}
                <main className={`flex-1 p-6 transition-all duration-500 overflow-y-auto flex flex-col items-center gap-6 ${isSidebarOpen ? 'mr-0' : ''}`}>
                    {/* Top Row for Consolidated AI Bots (Analytical Alex, Strategic Sam, Creative Casey) */}
                    {participants.some(p => String(p.id).startsWith('-') && p.id !== -1) && (
                        <div className="flex items-center gap-4 py-2 px-6 bg-slate-900/40 rounded-full border border-white/5 backdrop-blur-md shrink-0">
                            <span className="text-[10px] font-black  tracking-[0.2em] text-slate-500 mr-2 border-r border-white/10 pr-4">Virtual Peers</span>
                            <div className="flex -space-x-3">
                                {participants.filter(p => String(p.id).startsWith('-') && p.id !== -1).slice(0, 3).map((bot, idx) => {
                                    const botNameKey = bot.name.toLowerCase().replace(' ', '-');
                                    const botAvatar = `/avatars/${botNameKey}.png`;
                                    return (
                                        <div key={idx} className="relative group first:ml-2">
                                            <div className={`w-12 h-12 rounded-full border-2 transition-all duration-300 relative z-0 ${bot.isSpeaking ? 'border-amber-400 scale-110 z-10 shadow-lg shadow-amber-400/20' : 'border-slate-800'}`}>
                                                    <img src={botAvatar} alt={bot.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + bot.name; }} />
                                                {bot.isSpeaking && (
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
                                                        <span className="material-icons text-[10px] text-slate-950 font-black">volume_up</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-black text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[100] shadow-2xl scale-90 group-hover:scale-100  ">
                                                {bot.name}
                                            </div>
                                        </div>
                                    );
                                })}
                                {participants.filter(p => String(p.id).startsWith('-') && p.id !== -1).length > 3 && (
                                    <div className="w-12 h-12 rounded-full border-2 border-slate-800 bg-slate-900 flex items-center justify-center relative -left-3">
                                        <span className="text-white text-[10px] font-black">+{participants.filter(p => String(p.id).startsWith('-') && p.id !== -1).length - 3}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className={`grid gap-4 w-full max-w-7xl grow ${(() => {
                        const studentCount = participants.filter(p => !String(p.id).startsWith('-')).length + 1; // +1 for Moderator
                        if (studentCount === 1) return 'grid-cols-1';
                        if (studentCount <= 2) return 'grid-cols-1 md:grid-cols-2';
                        if (studentCount <= 4) return 'grid-cols-2';
                        if (studentCount <= 6) return 'grid-cols-2 lg:grid-cols-3';
                        return 'grid-cols-3 xl:grid-cols-4';
                    })()
                        }`}>
                        {/* Always show AI Moderator if it's speaking or just as a participant */}
                        <AIModeratorCard isSpeaking={isAiSpeaking} lastMessage={messages.filter(m => m.user_name === 'AI Moderator').slice(-1)[0]?.text} />

                        {participants.filter(p => !String(p.id).startsWith('-')).map((p, idx) => (
                            <ParticipantCard
                                key={idx}
                                participant={p}
                                currentUser={currentUser}
                                stream={stream}
                                isMicOn={isMicOn}
                                isSpeaking={p.isSpeaking}
                                queueIndex={queue.findIndex(q => String(q.id) === String(p.id))}
                            />
                        ))}
                    </div>
                </main>

                {/* Collapsible Sidebar (Transcript) */}
                <aside className={`w-[400px] border-l border-white/5 bg-slate-900/30 backdrop-blur-3xl flex flex-col transition-all duration-500 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full absolute right-0 top-0 h-full'}`}>
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-xs font-black  tracking-[0.2em] text-slate-400">Live Transcript</h3>
                        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-white/5 rounded-lg">
                            <span className="material-icons">close</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
                                <span className="material-icons text-6xl">forum</span>
                                <p className="text-[10px] font-black   text-center">Waiting for discussion to start...</p>
                            </div>
                        ) : (
                            messages.map((m, i) => (
                                <div key={i} className={`flex flex-col gap-1 ${m.user_id === currentUser?.id ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[8px] font-black text-slate-500  ">
                                            {m.user_name === 'AI Moderator' ? 'Moderator' : (m.user_id === currentUser?.id ? 'You' : m.user_name)}
                                        </span>
                                        <span className="text-[6px] text-slate-600">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className={`px-4 py-2.5 rounded-2xl text-xs font-medium leading-relaxed max-w-[90%] ${m.user_name === 'AI Moderator' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200' :
                                        (m.user_id === currentUser?.id ? 'bg-blue-600 text-white' : 'bg-white/5 border border-white/10 text-slate-300')
                                        }`}>
                                        {m.text}
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={transcriptEndRef} />
                    </div>

                    <div className="p-4 bg-slate-900/50 border-t border-white/5">
                        <p className="text-[8px] font-black text-slate-600   text-center">Voice interaction only • Transcript auto-updates</p>
                    </div>
                </aside>
            </div>

            {/* Bottom Control Bar (Google Meet Style) */}
            <footer className="h-24 px-8 border-t border-white/5 bg-slate-950/80 backdrop-blur-2xl flex items-center justify-between shrink-0 z-50">
                <div className="flex items-center gap-4 w-1/3">
                    <div className="hidden sm:flex flex-col">
                        <span className="text-[8px] font-black text-slate-500   leading-tight">Meeting Details</span>
                        <span className="text-sm font-bold text-white truncate max-w-[150px]">{id}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4 lg:gap-8 grow justify-center">
                    <button
                        onClick={toggleMic}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg ${isMicOn ? 'bg-white/10 border border-white/20 hover:bg-white/20' : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                        title={isMicOn ? 'Mute' : 'Unmute'}
                    >
                        <span className="material-icons">{isMicOn ? 'mic' : 'mic_off'}</span>
                    </button>

                    <button
                        onClick={() => {
                            const isHandRaised = queue.some(q => String(q.id) === String(currentUser?.id));
                            if (isHandRaised) {
                                lowerHand();
                            } else {
                                raiseHand();
                            }
                        }}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg border relative ${queue.some(q => String(q.id) === String(currentUser?.id))
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                            }`}
                        title={queue.some(q => String(q.id) === String(currentUser?.id)) ? 'Lower Hand' : 'Raise Hand'}
                    >
                        <span className="material-icons">{queue.some(q => String(q.id) === String(currentUser?.id)) ? 'back_hand' : 'pan_tool'}</span>
                        {queue.some(q => String(q.id) === String(currentUser?.id)) && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center border-2 border-slate-950">
                                <span className="text-[10px] font-black text-slate-950">{queue.findIndex(q => String(q.id) === String(currentUser?.id)) + 1}</span>
                            </div>
                        )}
                    </button>

                    {queue.some(q => String(q.id) === String(currentUser?.id)) && (
                        <button
                            onClick={finishTurn}
                            className="h-14 px-8 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-2xl font-black   text-[10px] hover:bg-amber-500 hover:text-black transition-all active:scale-95 animate-in slide-in-from-bottom-4 shadow-xl shadow-amber-500/5"
                        >
                            Finish Turn
                        </button>
                    )}

                    <button
                        onClick={handleEndSession}
                        className="h-14 px-8 bg-red-600/10 border border-red-500/30 text-red-500 rounded-2xl font-black   text-[10px] hover:bg-red-500 hover:text-white transition-all active:scale-95"
                    >
                        {isEnding ? 'Leaving...' : 'End Session'}
                    </button>
                </div>

                <div className="flex items-center justify-end gap-4 w-1/3">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:bg-white/5 ${isSidebarOpen ? 'text-blue-400 bg-blue-400/10' : 'text-slate-400'}`}
                        title="Toggle Transcript"
                    >
                        <span className="material-icons">forum</span>
                    </button>
                </div>
            </footer>

            <style jsx>{`
                .mirror { transform: rotateY(180deg); }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}

// Sub-component for AI Moderator Card
function AIModeratorCard({ isSpeaking, lastMessage }: { isSpeaking: boolean, lastMessage: string | undefined }) {
    return (
        <div className={`relative rounded-3xl overflow-hidden border transition-all duration-700 aspect-video flex items-center justify-center bg-slate-900/40 ${isSpeaking ? 'border-amber-500 ring-4 ring-amber-500/20 scale-[1.02] shadow-2xl shadow-amber-500/20' : 'border-white/5'
            }`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 bg-amber-500 text-black text-[8px] font-black rounded  ">Moderator</div>
                    <span className="text-xs font-black text-white  tracking-tighter">AI Mentor</span>
                </div>
            </div>

            <div className={`relative h-24 w-24 flex items-center justify-center transition-transform duration-700 ${isSpeaking ? 'scale-110' : 'scale-100'}`}>
                {isSpeaking && <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-2xl animate-pulse"></div>}
                <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-slate-700 z-10 bg-gradient-to-br from-slate-800 to-black shadow-2xl flex items-center justify-center">
                    <img src="/avatars/ai-mentor.png" alt="AI Moderator" className="w-full h-full object-cover" />
                </div>
            </div>

            {isSpeaking && (
                <div className="absolute top-6 left-6 right-6">
                    <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 animate-in fade-in slide-in-from-top-2">
                        <p className="text-white text-[10px] font-medium leading-tight  line-clamp-2">&quot;{lastMessage || "Listening..."}&quot;</p>
                    </div>
                </div>
            )}
        </div>
    )
}

// Refactored ParticipantCard
function ParticipantCard({ participant, currentUser, stream, isMicOn, isSpeaking, queueIndex }: { participant: Participant, currentUser: CurrentUser | null, stream: MediaStream | null, isMicOn: boolean, isSpeaking?: boolean, queueIndex: number }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const isLocal = String(participant.id) === String(currentUser?.id);
    const isHandRaised = queueIndex !== -1;

    useEffect(() => {
        if (isLocal && videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => { });
        }
    }, [isLocal, stream]);

    return (
        <div className={`relative rounded-3xl overflow-hidden border transition-all duration-500 aspect-video group ${isSpeaking ? 'border-blue-500 ring-4 ring-blue-500/20 scale-[1.02]' : 'border-white/5 bg-slate-900/40'
            } ${isHandRaised ? 'shadow-2xl shadow-blue-500/10' : ''}`}>

            {/* Video Background */}
            <div className="absolute inset-0 flex items-center justify-center">
                {isLocal ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover mirror"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 text-2xl font-black text-slate-500 group-hover:bg-slate-700 transition-colors">
                            {participant.name.charAt(0)}
                        </div>
                    </div>
                )}
            </div>

            {/* Name/Status Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-white  tracking-tighter truncate max-w-[150px]">
                            {isLocal ? 'You' : participant.name}
                        </span>
                        {isLocal && isMicOn && (
                            <div className="flex gap-0.5 items-end h-3">
                                {/* eslint-disable-next-line react-hooks/purity */}
                                {[1, 2, 3].map(i => {
                                    // eslint-disable-next-line react-hooks/purity
                                    return <div key={i} className="w-0.5 bg-blue-400 rounded-full animate-pulse" style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.1}s` }} />;
                                })}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {!isMicOn && isLocal && (
                            <div className="w-6 h-6 rounded-lg bg-red-500 flex items-center justify-center">
                                <span className="material-icons text-[14px]">mic_off</span>
                            </div>
                        )}
                        {isHandRaised && (
                            <div className="px-3 py-1 bg-blue-600 text-white text-[8px] font-black rounded-full   flex items-center gap-1 shadow-lg animate-in zoom-in-90">
                                <span className="material-icons text-[10px]">pan_tool</span>
                                #{queueIndex + 1}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Speaking Indicator Border Glow (handled by top div classes) */}
        </div>
    );
}

// Removed ParticipantRow as it is replaced by ParticipantCard
