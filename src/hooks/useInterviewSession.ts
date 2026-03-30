import { useState, useEffect, useCallback, useRef } from 'react';
import { useGazeTracker } from './useGazeTracker';
import { apiClient } from "@/utils/api";

export type InterviewStatus = 'initializing' | 'setting_up' | 'active' | 'completed' | 'error';
export type InterviewStep = 'introduction' | 'question' | 'listening' | 'processing' | 'closing';
type ConversationStage = 'intro' | 'background' | 'follow_up' | 'technical' | 'behavioral' | 'closing';

export interface UseInterviewSessionProps {
    interviewId: string;
}

// Polyfill types for Web Speech API
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onerror: ((this: SpeechRecognition, ev: any) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare global {
    interface Window {
        SpeechRecognition: {
            new(): SpeechRecognition;
        };
        webkitSpeechRecognition: {
            new(): SpeechRecognition;
        };
    }
}

export function useInterviewSession({ interviewId }: UseInterviewSessionProps) {
    const [status, setStatus] = useState<InterviewStatus>('initializing');
    const [currentStep, setCurrentStep] = useState<InterviewStep>('introduction');
    const [conversationStage, setConversationStage] = useState<ConversationStage>('intro');
    const [transcript, setTranscript] = useState<{ role: 'ai' | 'user'; text: string }[]>([]);
    const [isMicEnabled, setIsMicEnabled] = useState(true);
    const [isCameraEnabled, setIsCameraEnabled] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [offTabCount, setOffTabCount] = useState(0);
    const [lastFocusWarningTime, setLastFocusWarningTime] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [backendResults, setBackendResults] = useState<any | null>(null);

    // Track integrity (off-tab activity)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && status === 'active') {
                setOffTabCount(prev => prev + 1);
                console.warn("Integrity Alert: User switched tabs!");
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [status]);

    // Media Stream State (Lifted)
    const [mediaStream, _setMediaStream] = useState<MediaStream | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    const setMediaStream = useCallback((stream: MediaStream | null) => {
        _setMediaStream(stream);
        mediaStreamRef.current = stream;
    }, []);

    const [isAiSpeaking, setIsAiSpeaking] = useState(false);

    // Ref for immediate access in callbacks to avoid stale closures/race conditions
    const isAiSpeakingRef = useRef(false);

    // Sync ref with state
    useEffect(() => {
        isAiSpeakingRef.current = isAiSpeaking;
    }, [isAiSpeaking]);

    // Voice Recognition Ref
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    // Track active session state to prevent race conditions during hangup
    const isSessionActiveRef = useRef(false);

    // Connection Simulation
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (status === 'initializing') {
            timeout = setTimeout(() => {
                setStatus('setting_up');
            }, 1500);
        }
        return () => clearTimeout(timeout);
    }, [status]);

    // Handle Stream Tracks based on toggles
    useEffect(() => {
        if (mediaStream) {
            mediaStream.getAudioTracks().forEach(track => {
                track.enabled = isMicEnabled;
            });
            mediaStream.getVideoTracks().forEach(track => {
                track.enabled = isCameraEnabled;
            });
        }
    }, [isMicEnabled, isCameraEnabled, mediaStream]);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            recognitionRef.current = recognition;
        }
        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch (e) { }
            }
        };
    }, []);

    // Global cleanup for media stream on unmount
    useEffect(() => {
        return () => {
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(t => {
                    try { t.stop(); } catch (e) { }
                });
            }
        };
    }, []);

    // Load voices properly
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            const loadVoices = () => {
                const availableVoices = window.speechSynthesis.getVoices();
                if (availableVoices.length > 0) {
                    setVoices(availableVoices);
                }
            };
            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;
            return () => {
                window.speechSynthesis.onvoiceschanged = null;
            };
        }
    }, []);

    const speak = useCallback((text: string) => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();

            if (!text) return;

            // Stop listening while speaking to prevent echo
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }

            const utterance = new SpeechSynthesisUtterance(text);

            // Select a decent voice from our ready list
            const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha') || v.lang.startsWith('en-US')) || voices[0];
            if (preferredVoice) utterance.voice = preferredVoice;

            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            utterance.onstart = () => {
                setIsAiSpeaking(true);
                isAiSpeakingRef.current = true;
            };
            utterance.onend = () => {
                setIsAiSpeaking(false);
                isAiSpeakingRef.current = false;
                setCurrentStep('listening');
            };
            utterance.onerror = (e) => {
                // 'interrupted' or 'canceled' are common and often not fatal
                if (e.error !== 'interrupted' && e.error !== 'canceled') {
                    console.error("TTS Error:", e.error, e);
                }
                setIsAiSpeaking(false);
                isAiSpeakingRef.current = false;
                setCurrentStep('listening');
            };

            window.speechSynthesis.speak(utterance);
        } else {
            setIsAiSpeaking(true);
            isAiSpeakingRef.current = true;
            setTimeout(() => {
                setIsAiSpeaking(false);
                isAiSpeakingRef.current = false;
                setCurrentStep('listening');
            }, 3000);
        }
    }, [voices]);


    // Gaze Detection Monitoring
    const gazeStatus = useGazeTracker(mediaStream);

    useEffect(() => {
        if (status === 'active' && gazeStatus.lookingAwayDuration > 3000) {
            const now = Date.now();
            // Warn every 15 seconds
            if (now - lastFocusWarningTime > 15000) {
                const focusMessage = "Please keep your head steady and stay focused on the camera.";
                setTranscript((prev) => [...prev, { role: 'ai', text: focusMessage }]);
                speak(focusMessage);
                setLastFocusWarningTime(now);
            }
        }
    }, [gazeStatus.lookingAwayDuration, status, lastFocusWarningTime, speak]);

    const joinSession = async () => {
        setStatus('active');
        setConversationStage('intro');
        isSessionActiveRef.current = true;

        // Fetch interview details to get the custom plan
        let initialGreeting = "Hello! I'm your AI interviewer today. To get started, could you tell me a bit about yourself and what drives your interest in this role?";

        try {
            const response = await apiClient.get(`/api/v1/interviews/${interviewId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.interview_plan && data.interview_plan.modules) {
                    // Update greeting if it's a specialized role
                    if (data.title) {
                        initialGreeting = `Hello! I'm your AI technical interviewer. Today we'll be focusing on the ${data.title} role. To start, could you tell me a bit about your background and experience?`;
                    }
                }
            }
        } catch (err) {
            console.error("Error fetching interview plan:", err);
        }

        // Initialize media if not already set - USE REF to avoid stale closure
        if (!mediaStreamRef.current) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                setMediaStream(stream);
            } catch (err) {
                console.error("Error establishing media stream during direct start:", err);
            }
        }

        setTimeout(() => {
            setTranscript((prev) => [...prev, { role: 'ai', text: initialGreeting }]);
            speak(initialGreeting);
        }, 1000);
    };

    const endSession = useCallback(async () => {
        console.log("Ending session and submitting results...");
        isSessionActiveRef.current = false; // Block any pending AI responses
        setIsSaving(true);

        // 1. Force stop speech immediately
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        // 2. Stop recognition permanently
        if (recognitionRef.current) {
            try {
                recognitionRef.current.onend = null; // Prevent auto-restart loop
                recognitionRef.current.abort();
            } catch (e) { console.error("Error stopping recognition:", e); }
        }

        // 3. Update step to prevent any further logic
        setCurrentStep('closing');

        // 4. Kill all media tracks - USE REF to ensure we kill current stream
        const currentStream = mediaStreamRef.current;
        if (currentStream) {
            currentStream.getTracks().forEach(track => {
                try {
                    track.stop();
                    track.enabled = false;
                    console.log(`Stopped track: ${track.kind}`);
                } catch (e) { console.error("Error stopping track:", e); }
            });
            setMediaStream(null);
        }

        // 5. Submit results to backend for persistence
        if (transcript.length > 0) {
            try {
                // Pair Q&A for the backend evaluator
                const qaPairs: { question: string; answer: string }[] = [];
                let lastQuestion = "";

                transcript.forEach((msg) => {
                    if (msg.role === 'ai') {
                        // Ignore focus warnings
                        if (!msg.text.includes("steady") && !msg.text.includes("focused")) {
                            lastQuestion = msg.text;
                        }
                    } else if (msg.role === 'user') {
                        qaPairs.push({
                            question: lastQuestion || "General Introduction",
                            answer: msg.text
                        });
                    }
                });

                const response = await apiClient.post(`/api/v1/interviews/${interviewId}/analyze-async`, {
                    transcript: qaPairs
                });

                if (response.ok) {
                    const data = await response.json();
                    setBackendResults(data);
                    console.log("Interview results persisted successfully");
                }
            } catch (err) {
                console.error("Error submitting interview results:", err);
            }
        }

        setIsSaving(false);
        setStatus('completed');
    }, [interviewId, transcript, setMediaStream]);

    const generateResponse = async (userText: string): Promise<string> => {
        try {
            const response = await apiClient.post(`/api/v1/interviews/${interviewId}/chat`, {
                transcript: transcript, // Send history
                user_input: userText
            });

            if (response.ok) {
                const data = await response.json();
                return data.response;
            } else {
                console.error("Failed to fetch AI response");
                return "I apologize, I'm having trouble connecting to my service right now. Could you please repeat that?";
            }
        } catch (error) {
            console.error("Error calling AI chat:", error);
            return "I apologize, I'm having trouble connecting. Let's continue.";
        }
    };

    const sendMessage = useCallback((text: string) => {
        if (!isSessionActiveRef.current) return;

        setTranscript((prev) => [...prev, { role: 'user', text }]);
        setCurrentStep('processing');

        // Human-like pause before responding
        setTimeout(async () => {
            // Check again if session is still active before generating/speaking
            if (!isSessionActiveRef.current) return;

            const aiText = await generateResponse(text);

            if (!isSessionActiveRef.current) return; // Final check

            setTranscript((prev) => [...prev, { role: 'ai', text: aiText }]);
            speak(aiText);

            if (conversationStage === 'closing') {
                setTimeout(() => {
                    if (isSessionActiveRef.current) endSession();
                }, 8000);
            }

            // Note: Ideally backend should tell us if we are done, but keeping simple for now
            // We could parse the AI response to see if it says "Goodbye" or similar
        }, 1500);
    }, [conversationStage, speak, transcript, endSession]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && isMicEnabled) {
            try {
                recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
                    // Double check: if AI is speaking, ignore this result (echo cancellation)
                    if (isAiSpeakingRef.current) {
                        console.log("Ignored speech during AI output (Echo Cancellation)");
                        return;
                    }

                    const text = event.results[0][0].transcript;
                    if (text && text.trim().length > 0) {
                        console.log("Heard:", text);
                        sendMessage(text);
                    }
                };

                recognitionRef.current.onerror = (event: any) => {
                    if (event.error === 'no-speech' || event.error === 'aborted') {
                        return;
                    }
                    console.error("Speech recognition error", event.error);
                };

                recognitionRef.current.onend = () => {
                    if (currentStep === 'listening' && isMicEnabled && !isAiSpeakingRef.current) {
                        try {
                            if (recognitionRef.current) {
                                recognitionRef.current.onend = null;
                                recognitionRef.current.start();
                            }
                        } catch (e) {
                            // ignore
                        }
                    }
                };

                recognitionRef.current.start();
                console.log("Started listening...");

            } catch (e) {
                // ignore
            }
        }
    }, [isMicEnabled, sendMessage, currentStep, isAiSpeaking]);

    useEffect(() => {
        if (currentStep === 'listening' && isMicEnabled && !isAiSpeaking) {
            const timer = setTimeout(() => {
                startListening();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [currentStep, isMicEnabled, startListening, isAiSpeaking]);

    return {
        status,
        currentStep,
        transcript,
        error,
        isAiSpeaking,
        isSaving,
        backendResults,
        offTabCount,
        mediaState: {
            stream: mediaStream,
            setStream: setMediaStream,
            isMicEnabled,
            setIsMicEnabled,
            isCameraEnabled,
            setIsCameraEnabled
        },
        actions: {
            joinSession,
            endSession,
            sendMessage
        }
    };
}
