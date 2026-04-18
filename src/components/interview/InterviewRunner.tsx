import { useRef, useEffect } from 'react';
import { InterviewStep } from "@/hooks/useInterviewSession";

interface InterviewRunnerProps {
    interview: any;
    currentStep: InterviewStep;
    transcript: { role: 'ai' | 'user'; text: string }[];
    onEnd: () => void;
    onSendMessage: (text: string) => void;
    isAiSpeaking: boolean;
    mediaState: {
        stream: MediaStream | null;
        isMicEnabled: boolean;
        setIsMicEnabled: (val: boolean) => void;
        isCameraEnabled: boolean;
        setIsCameraEnabled: (val: boolean) => void;
    }
}

export default function InterviewRunner({
    interview,
    currentStep,
    transcript,
    onEnd,
    onSendMessage,
    isAiSpeaking,
    mediaState
}: InterviewRunnerProps) {

    const userVideoRef = useRef<HTMLVideoElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Attach the active media stream to the video element
    useEffect(() => {
        if (userVideoRef.current && mediaState.stream) {
            userVideoRef.current.srcObject = mediaState.stream;
        }
    }, [mediaState.stream]);

    // Scroll to bottom of transcript
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [transcript]);

    // Get the latest message for the center display
    const latestMessage = transcript.length > 0
        ? transcript[transcript.length - 1]
        : { role: 'ai', text: "Initializing interview session..." };

    const avatarName = interview?.avatar_config?.avatar || "Dravid";
    const isSarah = avatarName.toLowerCase().includes("sarah");
    const avatarImg = isSarah ? "/avatars/sarah.png" : "/avatars/dravid.png";
    const displayName = isSarah ? "Sarah" : "Dravid";

    return (
        <div className="flex flex-col h-screen bg-black text-white overflow-hidden font-sans">

            {/* Main Content Area - 3 Pane Layout */}
            <main className="flex-1 flex flex-col md:flex-row items-center justify-center p-3 md:p-4 gap-4 w-full max-w-[1920px] mx-auto overflow-hidden">

                {/* 1. Left Pane: AI Avatar */}
                <div className="w-full md:w-1/4 h-[320px] md:h-full max-h-[480px] flex flex-col items-center justify-center relative bg-slate-900/50 rounded-3xl border border-white/5 overflow-hidden group">
                    <div className={`relative h-48 w-48 flex items-center justify-center transition-transform duration-700 ${isAiSpeaking ? 'scale-110' : 'scale-100'}`}>
                        {/* Avatar Glow */}
                        <div className={`absolute inset-0 bg-white/20 rounded-full blur-3xl transition-opacity duration-300 ${isAiSpeaking ? 'opacity-50' : 'opacity-10'}`}></div>

                        {/* Avatar Image/Representation */}
                        <div className="relative h-40 w-40 rounded-full overflow-hidden border-4 border-slate-800 z-10 bg-slate-900 shadow-2xl">
                            <img
                                src={avatarImg}
                                alt={displayName}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-white text-sm font-medium bg-black/50 px-3 py-0.5 rounded-full backdrop-blur-md border border-white/10">
                            {displayName}
                        </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="absolute top-4 right-4">
                        {isAiSpeaking ? (
                            <div className="flex gap-1 h-4 items-end">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="w-1 bg-slate-200 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}></div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-2 w-2 rounded-full bg-slate-400 animate-pulse"></div>
                        )}
                    </div>
                </div>

                {/* 2. Center Pane: Context / Current Question */}
                <div className="flex-1 h-full max-h-[480px] flex flex-col items-center justify-center p-6 bg-slate-900/80 rounded-3xl border border-white/5 relative overflow-hidden">
                    <div className="w-full max-w-2xl text-center space-y-6 z-10">
                        {/* Role Label */}
                        <div className={`inline-block px-3 py-1 rounded-full text-xs font-black  mb-4  ${latestMessage.role === 'ai' ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-white text-slate-900 border border-white'
                            }`}>
                            {latestMessage.role === 'ai' ? 'Interviewer' : 'You'}
                        </div>

                        {/* Main Text */}
                        <p className="text-xl md:text-2xl font-medium leading-relaxed text-slate-100 animate-[fadeIn_0.5s_ease-out]">
                            "{latestMessage.text}"
                        </p>
                    </div>

                    {/* Background decorations */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl"></div>
                    </div>
                </div>

                {/* 3. Right Pane: User Video */}
                <div className="w-full md:w-1/4 h-[320px] md:h-full max-h-[480px] relative bg-black rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
                    {!mediaState.isCameraEnabled && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-500 gap-2">
                            <span className="material-symbols-rounded text-4xl">videocam_off</span>
                            <span className="text-xs">Camera Off</span>
                        </div>
                    )}
                    <video
                        ref={userVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className={`w-full h-full object-cover transform scale-x-[-1] ${!mediaState.isCameraEnabled ? 'invisible' : ''}`}
                    />

                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] text-white font-black   border border-white/10 flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${mediaState.isMicEnabled ? 'bg-slate-200' : 'bg-slate-400'}`}></span>
                        Candidate_Feed
                    </div>
                    <div className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                        <span className={`material-symbols-rounded text-sm ${mediaState.isMicEnabled ? 'text-white' : 'text-red-400'}`}>
                            {mediaState.isMicEnabled ? 'mic' : 'mic_off'}
                        </span>
                    </div>
                </div>

            </main>

            {/* Footer / Controls */}
            <footer className="h-20 flex items-center justify-center gap-4 bg-black/50 backdrop-blur-md border-t border-white/10 pb-2">

                {/* Mic Toggle */}
                <button
                    onClick={() => mediaState.setIsMicEnabled(!mediaState.isMicEnabled)}
                    className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 ${mediaState.isMicEnabled
                        ? 'bg-slate-800 hover:bg-slate-700 text-white border border-white/10'
                        : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
                        }`}
                    title={mediaState.isMicEnabled ? "Mute Microphone" : "Unmute Microphone"}
                >
                    <span className="material-symbols-rounded text-2xl">{mediaState.isMicEnabled ? 'mic' : 'mic_off'}</span>
                </button>

                {/* Center Action (Passive Status Indicator) */}
                <div
                    className={`h-12 px-6 rounded-full flex items-center gap-3 transition-all duration-300 text-[10px] font-black   border ${currentStep === 'listening'
                        ? 'bg-white text-slate-900 border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                        : 'bg-slate-800 text-slate-400 border-white/5'
                        }`}
                >
                    {currentStep === 'listening' ? (
                        <>
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-300 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                            </span>
                            <span>Listening...</span>
                        </>
                    ) : (
                        <>
                            <span className="h-4 w-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></span>
                            <span>{currentStep === 'processing' ? 'Thinking...' : 'AI Speaking...'}</span>
                        </>
                    )}
                </div>

                {/* Camera Toggle */}
                <button
                    onClick={() => mediaState.setIsCameraEnabled(!mediaState.isCameraEnabled)}
                    className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 ${mediaState.isCameraEnabled
                        ? 'bg-slate-800 hover:bg-slate-700 text-white border border-white/10'
                        : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
                        }`}
                    title={mediaState.isCameraEnabled ? "Turn Off Camera" : "Turn On Camera"}
                >
                    <span className="material-symbols-rounded text-xl">{mediaState.isCameraEnabled ? 'videocam' : 'videocam_off'}</span>
                </button>

                {/* End Interview */}
                <button
                    onClick={onEnd}
                    className="h-12 w-12 rounded-full flex items-center justify-center bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-500 border border-white/10 hover:border-red-500/50 transition-all duration-300 ml-4"
                    title="End Interview"
                >
                    <span className="material-symbols-rounded text-xl">call_end</span>
                </button>
            </footer>
        </div>
    );
}
