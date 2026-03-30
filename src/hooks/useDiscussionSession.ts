import { useState, useEffect, useCallback, useRef } from 'react';
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { BACKEND_URL } from "@/utils/api";

export interface DiscussionMessage {
    user_id: number | null;
    user_name: string;
    text: string;
    timestamp: string;
}

export interface Participant {
    id: number | null;
    name: string;
    is_ready: boolean;
    isSpeaking?: boolean;
}

export const useDiscussionSession = (sessionId: string) => {
    const [queue, setQueue] = useState<{ id: number, name: string }[]>([]);
    const [messages, setMessages] = useState<DiscussionMessage[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [status, setStatus] = useState<'waiting' | 'active' | 'completed'>('waiting');
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const ws = useRef<WebSocket | null>(null);

    // Speech & AI State
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const isAiSpeakingRef = useRef(false);
    const recognition = useRef<any>(null);
    const isSessionActiveRef = useRef(true); // Track session active state

    // Cleanup TTS on unmount
    useEffect(() => {
        return () => {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            isSessionActiveRef.current = false;
        };
    }, []);

    // Sync ref
    useEffect(() => {
        isAiSpeakingRef.current = isAiSpeaking;
    }, [isAiSpeaking]);

    // TTS Function
    const speak = useCallback((text: string) => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop previous
            if (!text) return;

            // Echo Cancellation: Stop listening if AI speaks
            if (recognition.current) {
                recognition.current.abort();
            }

            const utterance = new SpeechSynthesisUtterance(text);

            // Select voice
            const voices = window.speechSynthesis.getVoices();
            // Retry if voices not loaded yet (common in Chrome)
            if (voices.length === 0) {
                setTimeout(() => speak(text), 100);
                return;
            }

            const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha') || v.lang.startsWith('en-US')) || voices[0];
            if (preferredVoice) utterance.voice = preferredVoice;

            utterance.onstart = () => {
                setIsAiSpeaking(true);
                isAiSpeakingRef.current = true;
            };
            utterance.onend = () => {
                setIsAiSpeaking(false);
                isAiSpeakingRef.current = false;
                // Auto-resume listening handled by onend of recognition or manual restart if needed
                startListening();
            };
            utterance.onerror = () => {
                setIsAiSpeaking(false);
                isAiSpeakingRef.current = false;
                startListening();
            };

            window.speechSynthesis.speak(utterance);
        }
    }, []);

    const endSession = useCallback((onCleanup?: () => void) => {
        isSessionActiveRef.current = false;
        setStatus('completed');

        // 1. Stop AI Speech immediately
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        // 2. Stop Listening
        if (recognition.current) {
            try {
                recognition.current.onend = null;
                recognition.current.abort();
            } catch (e) { }
        }

        // 3. Execute custom cleanup (e.g., stop media tracks)
        if (onCleanup) {
            try {
                onCleanup();
            } catch (e) {
                console.error('[Discussion] Cleanup error:', e);
            }
        }

        // 4. Close WebSocket
        if (ws.current) {
            ws.current.close();
        }
    }, []);

    const connectingRef = useRef(false);

    useEffect(() => {
        if (!sessionId) return;

        // Prevent double connection in Strict Mode or rapid updates
        if (ws.current || connectingRef.current) return;

        connectingRef.current = true;

        const token = Cookies.get("auth_");


        const backendUrl = BACKEND_URL;
        let wsUrl;

        // Ensure token is passed mostly for auth, handled by middleware/backend
        // We use 'token' query param
        const params = new URLSearchParams();
        if (token) params.append('token', token);

        if (backendUrl && backendUrl.startsWith('http')) {
            // Remove trailing slash if present to avoid double slashes
            const base = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
            // If backend URL is set, derive WS URL from it (replaces http/https with ws/wss)
            const wsBase = base.replace(/^http(s)?/, 'ws$1'); // Handles http->ws, https->wss properly
            wsUrl = `${wsBase}/api/v1/discussion/ws/${sessionId}?${params.toString()}`;
        } else {
            // Fallback logic
            const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            // INTELLIGENT LOCALHOST FALLBACK
            let wsHost = window.location.host;
            // If running locally (localhost/127.0.0.1) force connection to 127.0.0.1:8000
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                wsHost = "127.0.0.1:8000";
            }
            wsUrl = `${wsProtocol}//${wsHost}/api/v1/discussion/ws/${sessionId}?${params.toString()}`;
        }

        console.log("[Discussion] WebSocket URL:", wsUrl);

        try {
            ws.current = new WebSocket(wsUrl);
        } catch (e) {
            console.error("[Discussion] Failed to construct WebSocket:", e);
            setError("Configuration Error: Invalid WebSocket URL");
            connectingRef.current = false;
            return;
        }

        if (ws.current) {
            ws.current.onopen = () => {
                console.log("[Discussion] WebSocket Connected!");
                setError(null);
            };
        }

        if (ws.current) {
            ws.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    // console.log("[Discussion] RX:", data.type); // Uncomment for verbose logs

                    if (data.type === 'message') {
                        setMessages((prev) => [...prev, {
                            user_id: data.user_id,
                            user_name: data.user_name,
                            text: data.text,
                            timestamp: data.timestamp
                        }]);
                        // Audible Communication: Speak other participants' messages
                        if (data.text) {
                            speak(`${data.user_name} says: ${data.text}`);
                        }
                    } else if (data.type === 'participants') {
                        console.log("[Discussion] Participants updated:", data.participants);
                        setParticipants(data.participants);
                    } else if (data.type === 'queue_update') {
                        setQueue(data.queue);
                    } else if (data.type === 'moderator_message') {
                        // AI Moderator speaks!
                        setMessages((prev) => [...prev, {
                            user_id: -1, // AI ID
                            user_name: "AI Moderator",
                            text: data.text,
                            timestamp: data.timestamp
                        }]);
                        speak(data.text);
                    } else if (data.type === 'info') {
                        // Ignored info message internally
                    } else if (data.type === 'error') {
                        setError(data.message);
                        setTimeout(() => setError(null), 5000);
                    } else if (data.type === 'session_update') {
                        if (data.status) setStatus(data.status);
                        if (data.started_at && data.duration_seconds) {
                            // Ensure we treat the server timestamp as valid UTC/ISO
                            const start = new Date(data.started_at).getTime();
                            // Use a simple local diff, assuming reasonably synced clocks.
                            // Ideally we'd compare against server_now but this is usually sufficient if both are UTC-aware.
                            // data.started_at from python .isoformat() is usually ISO 8601.
                            const now = Date.now();
                            const elapsed = Math.floor((now - start) / 1000);
                            // If elapsed is negative (client clock behind), treat as 0
                            const safeElapsed = Math.max(0, elapsed);
                            const remaining = Math.max(0, data.duration_seconds - safeElapsed);
                            setTimeRemaining(remaining);
                        }
                    } else if (data.type === 'session_timeout') {
                        setStatus('completed');
                        setTimeRemaining(0);
                    }
                } catch (err) {
                    console.error("[Discussion] Error parsing message:", err);
                }
            };
        }

        if (ws.current) {
            ws.current.onerror = (evt) => {
                console.error("[Discussion] WebSocket Error:", evt);
                setError("Connection Error. Please check your network or server status.");
            };

            ws.current.onclose = (event: CloseEvent) => {
                console.log("[Discussion] WebSocket Closed:", event.code, event.reason);
                if (event.code !== 1000) {
                    // Try to reconnect? For now just log.
                }
            };
        }

        return () => {
            connectingRef.current = false;
            if (ws.current) {
                // Remove listeners to prevent zombie callbacks
                ws.current.onopen = null;
                ws.current.onmessage = null;
                ws.current.onerror = null;
                ws.current.onclose = null;

                if (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING) {
                    ws.current.close();
                }
                ws.current = null;
            }
            if (recognition.current) {
                try {
                    recognition.current.onend = null;
                    recognition.current.abort();
                } catch (e) { }
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]); // Only re-connect if sessionId changes

    // Prevent early exit
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (status === 'active') {
                const message = "The Group Discussion is still active. Are you sure you want to leave?";
                e.preventDefault();
                e.returnValue = message;
                return message;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [status]);

    // Timer Interval
    useEffect(() => {
        let timer: any;
        if (status === 'active' && timeRemaining !== null && timeRemaining > 0) {
            timer = setInterval(() => {
                setTimeRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
            }, 1000);
        } else if (timeRemaining === 0 && status === 'active') {
            // Auto-complete status locally if not yet sent by server
            setStatus('completed');
        }
        return () => clearInterval(timer);
    }, [status, timeRemaining]);

    // Cleanup recognition on completion
    useEffect(() => {
        if (status === 'completed' && recognition.current) {
            recognition.current.stop();
        }
    }, [status]);

    const sendMessage = useCallback((text: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'message', text }));
        }
    }, []);

    const lowerHand = useCallback(() => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'hand_lower' }));
        }
    }, []);

    const enterRoom = useCallback(() => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'enter_room' }));
        }
    }, []);

    const raiseHand = useCallback(() => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'hand_raise' }));
        }
    }, []);

    const finishTurn = useCallback(() => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'finish_turn' }));
        }
    }, []);

    const startListening = useCallback(() => {
        // If AI is speaking, don't start listening yet (Cycle breaker)
        if (isAiSpeakingRef.current) return;

        if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            // Prevent multiple instances
            if (recognition.current) {
                try { recognition.current.abort(); } catch (e) { }
            }

            recognition.current = new SpeechRecognition();
            recognition.current.continuous = false;
            recognition.current.interimResults = false;
            recognition.current.lang = 'en-US';

            recognition.current.onresult = (event: any) => {
                // Echo Cancellation Check
                if (isAiSpeakingRef.current) {
                    return;
                }

                const transcript = event.results[0][0].transcript;
                if (transcript && transcript.trim().length > 0) {
                    sendMessage(transcript);
                }
            };

            recognition.current.onerror = (event: any) => {
                // Ignore speech recognition errors internally
            };

            recognition.current.onend = () => {
                // Auto-Restart if not speaking
                if (!isAiSpeakingRef.current) {
                    try {
                        recognition.current.start();
                    } catch (e) {
                        // ignore
                    }
                }
            };

            try {
                recognition.current.start();
            } catch (e) { /* ignore */ }
        }
    }, [sendMessage]);

    const stopListening = useCallback(() => {
        if (recognition.current) {
            recognition.current.stop();
        }
    }, []);

    return {
        messages,
        participants,
        queue,
        status,
        timeRemaining,
        error,
        isAiSpeaking,
        speak,
        sendMessage,
        startListening,
        stopListening,
        raiseHand,
        lowerHand,
        finishTurn,
        enterRoom,
        endSession
    };
};
