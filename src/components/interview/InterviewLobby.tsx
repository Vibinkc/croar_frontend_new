import { useState, useEffect, useRef } from 'react';

interface InterviewLobbyProps {
    onJoin: () => void;
    mediaState: {
        stream: MediaStream | null;
        setStream: (stream: MediaStream | null) => void;
        isMicEnabled: boolean;
        setIsMicEnabled: (val: boolean) => void;
        isCameraEnabled: boolean;
        setIsCameraEnabled: (val: boolean) => void;
    };
}

export default function InterviewLobby({ onJoin, mediaState }: InterviewLobbyProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasPermissions, setHasPermissions] = useState<boolean>(false);
    const [micLevel, setMicLevel] = useState<number>(0);
    const [hasMicActivity, setHasMicActivity] = useState<boolean>(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        const initMedia = async () => {
            if (mediaState.stream) {
                setHasPermissions(true);
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                mediaState.setStream(stream);
                setHasPermissions(true);
            } catch (err) {
                console.error("Error accessing media devices:", err);
                setHasPermissions(false);
            }
        };

        const timer = setTimeout(() => {
            initMedia();
        }, 500);

        return () => clearTimeout(timer);
    }, [mediaState.stream]);

    useEffect(() => {
        if (videoRef.current && mediaState.stream) {
            videoRef.current.srcObject = mediaState.stream;
        }
    }, [mediaState.stream]);

    useEffect(() => {
        if (mediaState.stream) {
            mediaState.stream.getAudioTracks().forEach(track => {
                track.enabled = mediaState.isMicEnabled;
            });
            mediaState.stream.getVideoTracks().forEach(track => {
                track.enabled = mediaState.isCameraEnabled;
            });

            // Audio Visualization logic
            if (mediaState.isMicEnabled) {
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                }
                const audioContext = audioContextRef.current;
                const source = audioContext.createMediaStreamSource(mediaState.stream);
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);
                analyserRef.current = analyser;

                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);

                const updateLevel = () => {
                    if (!analyserRef.current) return;
                    analyserRef.current.getByteFrequencyData(dataArray);

                    let sum = 0;
                    for (let i = 0; i < bufferLength; i++) {
                        sum += dataArray[i];
                    }
                    const average = sum / bufferLength;
                    const level = Math.min(100, Math.round((average / 128) * 100));
                    setMicLevel(level);
                    if (level > 10) setHasMicActivity(true);

                    animationFrameRef.current = requestAnimationFrame(updateLevel);
                };

                updateLevel();
            } else {
                setTimeout(() => setMicLevel(0), 0);
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
            }
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        };
    }, [mediaState.isMicEnabled, mediaState.isCameraEnabled, mediaState.stream]);

    return (
        <div className="min-h-screen bg-black text-white py-8 px-4 flex items-center justify-center transition-colors duration-300">
            <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

                {/* Left Side: Video Preview */}
                <div className="space-y-4">
                    <div className="relative aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5">
                        {!mediaState.isCameraEnabled && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <span className="material-symbols-rounded text-3xl text-slate-500 font-bold">videocam_off</span>
                                    </div>
                                    <p className="text-slate-500 text-[10px] font-black  ">Camera_Disabled</p>
                                </div>
                            </div>
                        )}
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500 ${!mediaState.isCameraEnabled ? 'opacity-0' : 'opacity-100'}`}
                        />

                        {/* Control Overlays */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 z-20">
                            <button
                                onClick={() => mediaState.setIsMicEnabled(!mediaState.isMicEnabled)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${mediaState.isMicEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-slate-900'}`}
                            >
                                <span className="material-symbols-rounded text-xl">
                                    {mediaState.isMicEnabled ? 'mic' : 'mic_off'}
                                </span>
                            </button>
                            <button
                                onClick={() => mediaState.setIsCameraEnabled(!mediaState.isCameraEnabled)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${mediaState.isCameraEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-slate-900'}`}
                            >
                                <span className="material-symbols-rounded text-xl">
                                    {mediaState.isCameraEnabled ? 'videocam' : 'videocam_off'}
                                </span>
                            </button>
                        </div>

                        {/* Mic Level Indicator Overlay */}
                        {mediaState.isMicEnabled && (
                            <div className="absolute bottom-4 left-4 right-4 h-1 bg-white/10 rounded-full overflow-hidden z-20 pointer-events-none">
                                <div
                                    className="h-full bg-white transition-all duration-75"
                                    style={{ width: `${micLevel}%` }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <h1 className="text-3xl font-black text-white  tracking-tight leading-tight">
                            Check your <span className="text-slate-400 ">setup</span> before we begin
                        </h1>
                        <p className="text-slate-500 text-xs font-medium leading-relaxed">
                            Ensure your face is clearly visible and your microphone is picking up your voice clearly.
                        </p>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl space-y-4">
                        <div className={`flex items-center gap-4 text-[10px] font-black   p-4 rounded-2xl transition-all border ${!mediaState.isCameraEnabled ? 'bg-white/5 text-slate-400 border-white/10' :
                            !hasMicActivity ? 'bg-white/5 text-slate-400 border-white/10' :
                                'bg-white text-slate-900 border-white font-black'
                            }`}>
                            <span className="material-symbols-rounded text-xl">
                                {!mediaState.isCameraEnabled ? 'warning' : !hasMicActivity ? 'record_voice_over' : 'verified'}
                            </span>
                            {!mediaState.isCameraEnabled ? "Please turn on your camera" :
                                !hasMicActivity ? "Please say something to test mic" :
                                    "Hardware diagnostics passed"}
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={onJoin}
                                disabled={!hasPermissions || !mediaState.isCameraEnabled}
                                className="w-full py-4 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-black  text-[11px] tracking-[0.2em] flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:grayscale active:scale-95 shadow-lg group"
                            >
                                <span>Join Interview Session</span>
                                <span className="material-symbols-rounded text-base font-bold group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </button>

                            {!hasPermissions && (
                                <div className="p-3 bg-white/5 text-slate-400 rounded-xl text-center text-[9px] font-black   border border-white/10 animate-pulse">
                                    Hardware access required
                                </div>
                            )}
                            {hasPermissions && !mediaState.isCameraEnabled && (
                                <div className="text-center text-[11px] text-slate-500 font-medium">
                                    Video feed is mandatory for this session
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-6 text-[9px] text-slate-400 font-bold   ml-2">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                            Stable_Net
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            AI_Optimized
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
