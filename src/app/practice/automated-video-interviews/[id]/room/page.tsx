"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";

interface Interview {
    id: number;
    title: string;
    interview_plan: {
        modules: {
            title: string;
            questions: string[];
        }[];
    };
}

interface InterviewResult {
    question: string;
    answer: string;
}

// Web Speech API type handling handled via local casting to avoid global conflicts

export default function VideoInterviewRoom() {
    const { id } = useParams();
    const router = useRouter();
    // const { accessToken } = useAuth();
    const [interview, setInterview] = useState<Interview | null>(null);
    const [currentStep, setCurrentStep] = useState("INSTRUCTION"); // INSTRUCTION, RECORDING, COMPLETED
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [questions, setQuestions] = useState<string[]>([]);

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // Store results: { question: string, answer: string }
    const [results, setResults] = useState<InterviewResult[]>([]);

    useEffect(() => {
        if (id) {
            // eslint-disable-next-line react-hooks/immutability
            fetchInterview();
        }
    }, [id]);

    const fetchInterview = async () => {
        try {
            const response = await apiClient.get(`/api/v1/interviews/${id}`);
            if (response.ok) {
                const data = await response.json();
                setInterview(data);

                // Flatten questions
                const allQuestions: string[] = [];
                data.interview_plan.modules.forEach((m: { questions: string[] }) => {
                    m.questions.forEach((q: string) => allQuestions.push(q));
                });
                setQuestions(allQuestions);
            }
        } catch (error) {
            console.error("Failed to fetch interview", error);
        }
    };

    // Cleanup tracks on unmount
    useEffect(() => {
        return () => {
            const stream = streamRef.current;
            if (stream) {
                stream.getTracks().forEach(track => {
                    track.stop();
                    console.log(`Track stopped on unmount: ${track.kind}`);
                });
                streamRef.current = null;
            }
            if (speechRecognitionRef.current) {
                try {
                    speechRecognitionRef.current.stop();
                    speechRecognitionRef.current.abort();
                } catch (e) { }
            }
        };
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing media", err);
        }
    };

    const startRecording = () => {
        setTranscript("");
        setIsRecording(true);
        chunksRef.current = [];

        // 1. Start Media Recorder (Visuals)
        const stream = videoRef.current?.srcObject as MediaStream;
        if (stream) {
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };
            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
        }

        // 2. Start Speech Recognition (Transcript)
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event: SpeechRecognitionEvent) => {
                let finalTranscript = '';
                for (let i = 0; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setTranscript(prev => prev + " " + finalTranscript);
                }
            };

            recognition.start();
            speechRecognitionRef.current = recognition;
        } else {
            console.warn("Speech Recognition not supported in this browser.");
        }
    };

    const stopRecording = () => {
        setIsRecording(false);

        // Stop Media Recorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }

        // Stop Speech Recognition
        if (speechRecognitionRef.current) {
            speechRecognitionRef.current.stop();
        }
    };

    const handleNext = () => {
        // Save result
        setResults([...results, {
            question: questions[currentQuestionIndex],
            answer: transcript || "(No audio detected)"
        }]);

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setTranscript("");
        } else {
            // Stop camera immediately on completion
            const stream = streamRef.current;
            if (stream) {
                stream.getTracks().forEach(track => {
                    track.stop();
                    console.log(`Track stopped on completion: ${track.kind}`);
                });
                streamRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            setCurrentStep("COMPLETED");
        }
    };

    const handleSubmit = async () => {
        // Here we would effectively submit the list of Q&A to the backend for analysis
        // For now, we'll store it in localStorage or pass via router state to the result page
        // But since we navigate, let's just use localStorage for simplicity in this MVP

        const payload = [...results]; // Include the last one if logic allows, but handleNext usually adds it
        // Wait, handleNext adds it. If we are at COMPLETED step, results is full.

        localStorage.setItem(`interview_results_${id}`, JSON.stringify(results));
        router.push(`/practice/automated-video-interviews/${id}/result`);
    };

    if (!interview) return <div>Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center justify-center">
            {currentStep === "INSTRUCTION" && (
                <div className="max-w-2xl text-center space-y-8">
                    <h1 className="text-3xl font-black  tracking-tight">System Check</h1>
                    <p className="text-slate-400">
                        You are about to start an automated video interview based on <strong>{interview.title}</strong>.
                        <br />
                        There are <strong>{questions.length}</strong> questions.
                        <br />
                        Please ensure your camera and microphone are working.
                    </p>
                    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
                        <video ref={videoRef} autoPlay muted className="w-full h-64 bg-black rounded-lg object-cover mb-4" />
                        <button
                            onClick={() => {
                                startCamera();
                                // wait a bit to confirm access then allow start
                            }}
                            className="text-sm underline text-slate-400 mb-4 block"
                        >
                            Test Camera
                        </button>
                        <button
                            onClick={() => setCurrentStep("RECORDING")}
                            className="w-full py-4 bg-slate-100 hover:bg-white text-slate-900 rounded-xl font-black   transition-all"
                        >
                            Initialize Sequence
                        </button>
                    </div>
                </div>
            )}

            {currentStep === "RECORDING" && (
                <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left: Question */}
                    <div className="flex flex-col justify-center space-y-6">
                        <div>
                            <span className="text-slate-400 text-xs font-black  ">
                                Question {currentQuestionIndex + 1} of {questions.length}
                            </span>
                            <h2 className="text-2xl font-bold mt-2 leading-relaxed">
                                {questions[currentQuestionIndex]}
                            </h2>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 min-h-[100px]">
                            <p className="text-xs text-slate-500  font-bold mb-2">Live Transcript</p>
                            <p className="text-slate-300 ">{transcript || "Listening..."}</p>
                        </div>
                    </div>

                    {/* Right: Camera & Controls */}
                    <div className="flex flex-col gap-4">
                        <div className="relative rounded-2xl overflow-hidden border-2 border-slate-700 bg-black aspect-video shadow-2xl">
                            <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
                            {isRecording && (
                                <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full animate-pulse border border-slate-700">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                    <span className="text-[10px] font-black  text-white">REC</span>
                                </div>
                            )}
                        </div>

                        {!isRecording && !transcript && (
                            <button
                                onClick={startRecording}
                                className="w-full py-4 bg-slate-100 hover:bg-white text-slate-900 rounded-xl font-black   transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-icons">fiber_manual_record</span>
                                Start Answer
                            </button>
                        )}

                        {isRecording && (
                            <button
                                onClick={stopRecording}
                                className="w-full py-4 bg-slate-700 hover:bg-slate-600 rounded-xl font-black   transition-all border border-slate-600"
                            >
                                Stop Recording
                            </button>
                        )}

                        {!isRecording && transcript && (
                            <button
                                onClick={handleNext}
                                className="w-full py-4 bg-slate-100 hover:bg-white text-slate-900 rounded-xl font-black   transition-all flex items-center justify-center gap-2"
                            >
                                Confirm & Next
                                <span className="material-icons">arrow_forward</span>
                            </button>
                        )}
                        {!isRecording && transcript && (
                            <button
                                onClick={startRecording}
                                className="text-xs text-slate-500 hover:text-white   font-bold text-center"
                            >
                                Re-record
                            </button>
                        )}
                    </div>
                </div>
            )}

            {currentStep === "COMPLETED" && (
                <div className="max-w-md text-center space-y-6">
                    <div className="w-20 h-20 bg-slate-800 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                        <span className="material-icons text-4xl">check</span>
                    </div>
                    <h2 className="text-2xl font-black ">All Responses Captured</h2>
                    <p className="text-slate-400">System is ready to analyze your video and audio data.</p>
                    <button
                        onClick={handleSubmit}
                        className="w-full py-4 bg-slate-100 hover:bg-white text-slate-900 rounded-xl font-black   transition-all"
                    >
                        Generate Analysis Report
                    </button>
                </div>
            )}

            {/* Auto-start camera when entering recording step */}
            {currentStep === "RECORDING" && (
                <StartCameraEffect videoRef={videoRef} streamRef={streamRef} />
            )}
        </div>
    );
}

// Helper to start camera effects
function StartCameraEffect({ videoRef, streamRef }: { videoRef: React.RefObject<HTMLVideoElement | null>, streamRef: React.RefObject<MediaStream | null> }) {
    useEffect(() => {
        async function enable() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                streamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;
            } catch (e) {
                console.error(e);
            }
        }
        enable();
    }, [videoRef, streamRef]);
    return null;
}
