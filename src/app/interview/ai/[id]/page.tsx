"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Settings, 
  MessageSquare, 
  XCircle,
  Send,
  Zap,
  Shield,
  Activity,
  Cpu,
  Monitor
} from "lucide-react";
import { BACKEND_URL } from "@/utils/api";

export default function AIInterviewPage() {
  const { id: applicationId } = useParams();
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [status, setStatus] = useState<"LOADING" | "READY" | "INTERVIEWING" | "SUBMITTING" | "FINISHED">("LOADING");
  const [messages, setMessages] = useState<{ role: "ai" | "user"; text: string }[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [currentInput, setCurrentInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [enteredEmail, setEnteredEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [organization, setOrganization] = useState<{ name: string; logo_url: string | null } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  // Cleanup on finish
  useEffect(() => {
    if (status === "FINISHED") {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsVideoOn(false);
      setIsMicOn(false);
    }
  }, [status]);

  // Initialize Speech Synthesis & Recognition
  const initInterview = useCallback(async (email?: string) => {
    try {
      if (email) setIsVerifying(true);
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/public/interview/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          application_id: applicationId,
          email: email || undefined 
        }),
      });
            if (!res.ok) {
          const errorData = await res.json();
          if (email) {
            setEmailError(errorData.detail || "Verification failed");
          } else {
            console.error("Initial check failed:", errorData.detail);
            setEmailError(errorData.detail || "Connection established, but verification failed.");
          }
          setIsVerifying(false);
          return;
        }
      
      const data = await res.json();
      setJobTitle(data.job_title);
      setCandidateName(data.candidate_name);
      setAttemptId(data.attempt_id);
      setOrganization(data.organization);
      
      if (data.status === "FINISHED") {
        setStatus("FINISHED");
      } else if (email) {
        // If we provided email and it worked, we can proceed
        setIsVerifying(false);
        setMessages([{ role: "ai", text: data.ai_response }]);
        setIsVideoOn(true);
        setStatus("INTERVIEWING");
      } else {
        setStatus("READY");
      }
    } catch (err) {
      console.error("Initialization error:", err);
    }
  }, [applicationId, setIsVerifying, setEmailError, setJobTitle, setCandidateName, setAttemptId, setStatus, setMessages, setIsVideoOn]);

  useEffect(() => {
    if (applicationId && status === "LOADING") {
      initInterview();
    }

    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
// ... (rest of the recognition logic remains similar)
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join("");
          setCurrentInput(transcript);
        };

        recognitionRef.current.onend = () => {
          if (isListening) recognitionRef.current.start();
        };
      }
    }

    // Load voices
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [applicationId]);

  const speak = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1;
      
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => v.name.includes("Female") || v.name.includes("Google UK English Female") || v.lang === "en-GB");
      if (femaleVoice) utterance.voice = femaleVoice;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (isVideoOn && status === "INTERVIEWING") {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(err => console.error("Error accessing camera:", err));
    }
  }, [isVideoOn, status]);

  // Speak new AI messages
  useEffect(() => {
    if (status === "INTERVIEWING" && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "ai") {
        speak(lastMessage.text);
      }
    }
  }, [messages, status]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsListening(!isListening);
  };

  const handleStart = () => {
    if (!enteredEmail) {
      setEmailError("Please enter your registered email");
      return;
    }
    initInterview(enteredEmail);
  };

  const handleSend = async () => {
    if (!currentInput.trim() || !attemptId || isLoading) return;
    
    const userText = currentInput;
    setMessages(prev => [...prev, { role: "user", text: userText }]);
    setCurrentInput("");
    setIsLoading(true);
    
    if (isListening) toggleListening();
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/public/interview/${attemptId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userText })
      });
      const data = await res.json();
      
      if (data.ai_response) {
        setMessages(prev => [...prev, { role: "ai", text: data.ai_response }]);
        speak(data.ai_response);
      }
      
      if (data.status === "FINISHED") {
        setStatus("FINISHED");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!attemptId) {
      setStatus("FINISHED");
      return;
    }
    try {
      await fetch(`${BACKEND_URL}/api/v1/enterprise/public/interview/${attemptId}/complete`, {
        method: 'POST'
      });
      setStatus("FINISHED");
    } catch (err) {
      console.error("Failed to complete interview:", err);
      setStatus("FINISHED");
    }
  };

  if (status === "FINISHED") {
    return (
      <div className="min-h-screen bg-[#020203] flex items-center justify-center p-6 selection:bg-indigo-500/30">
        <div className="max-w-xl w-full">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/40 border border-slate-800/50 rounded-[3rem] p-12 backdrop-blur-3xl text-center space-y-8 shadow-2xl shadow-indigo-500/10"
          >
            <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center border border-emerald-500/20 mx-auto shadow-inner">
               <Shield className="w-10 h-10 text-emerald-500" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-4xl font-black text-white tracking-tight">Interview Completed</h1>
              <p className="text-slate-500 font-medium leading-relaxed">
                Thank you, <span className="text-white">{candidateName}</span>. Your technical screening for the <span className="text-indigo-400">{jobTitle}</span> position has been successfully recorded.
              </p>
            </div>

            <div className="p-6 bg-slate-950/50 rounded-3xl border border-slate-800/50 text-sm text-slate-400 leading-relaxed font-medium italic">
              "Your responses have been securely stored. Our hiring team will review the session and get back to you with the next steps soon."
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (status === "READY") {
    return (
      <div className="min-h-screen bg-[#020203] flex items-center justify-center p-6 selection:bg-indigo-500/30">
        <div className="max-w-4xl w-full">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 overflow-hidden">
                    {organization?.logo_url ? (
                      <img src={organization.logo_url} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Zap className="w-6 h-6 text-indigo-500" />
                    )}
                  </div>
                  <span className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em] truncate max-w-[200px]">
                    {organization?.name || "AI-Powered Screening"}
                  </span>
                </div>
                <h1 className="text-5xl font-black text-white leading-none tracking-tight">Ready for your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">AI Interview</span>?</h1>
                <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-md">
                  Experience a state-of-the-art interactive technical round at {organization?.name || "our company"} powered by advanced AI and real-time video feedback.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/40 border border-slate-800/50 p-5 rounded-3xl backdrop-blur-sm">
                   <div className="flex items-center gap-3 mb-3">
                     <Shield className="w-4 h-4 text-emerald-500" />
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security</span>
                   </div>
                   <p className="text-sm font-bold text-white">Identity Verified</p>
                </div>
                <div className="bg-slate-900/40 border border-slate-800/50 p-5 rounded-3xl backdrop-blur-sm">
                   <div className="flex items-center gap-3 mb-3">
                     <Monitor className="w-4 h-4 text-indigo-500" />
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Environment</span>
                   </div>
                   <p className="text-sm font-bold text-white">Video Required</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                     <Shield className="w-5 h-5 text-slate-500 group-focus-within/input:text-indigo-500 transition-colors" />
                  </div>
                  <input 
                    type="email"
                    value={enteredEmail}
                    onChange={(e) => {
                      setEnteredEmail(e.target.value);
                      setEmailError("");
                    }}
                    placeholder="Enter Registered Email"
                    className="w-full h-16 bg-slate-900/50 border border-slate-800 rounded-2xl pl-14 pr-6 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
                {emailError && (
                  <p className="text-pink-500 text-xs font-black uppercase tracking-widest pl-2">
                    {emailError}
                  </p>
                )}
                
                <button 
                  onClick={handleStart}
                  disabled={isVerifying}
                  className="w-full h-16 bg-white text-slate-950 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-slate-200 transition-all shadow-2xl shadow-white/5 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isVerifying ? "Verifying..." : "Verify & Enter Interview Room"}
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-[4rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-[#0A0A0B] border border-slate-800 rounded-[3rem] overflow-hidden aspect-[4/5] shadow-2xl flex flex-col items-center justify-center space-y-4">
                 <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center animate-pulse">
                   <Video className="w-10 h-10 text-slate-700" />
                 </div>
                 <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Camera Preview</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020203] flex flex-col overflow-hidden text-slate-300">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 h-20 border-b border-slate-800/50 flex items-center justify-between px-8 bg-slate-950/20 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 overflow-hidden">
               {organization?.logo_url ? (
                 <img src={organization.logo_url} alt="Logo" className="w-full h-full object-contain" />
               ) : (
                <Cpu className="w-6 h-6 text-white" />
               )}
             </div>
             <div>
                <h2 className="text-sm font-black text-white tracking-widest leading-none">
                  {organization?.name ? organization.name.toUpperCase() : "CROAR AI"} - {jobTitle || "Interview"}
                </h2>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1 inline-block">Session for {candidateName || "Candidate"}</span>
             </div>
           </div>
           <div className="h-4 w-px bg-slate-800" />
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recording Live</span>
           </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2">
             <Activity className="w-4 h-4 text-emerald-500" />
             <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Network Stable</span>
           </div>
           <button className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
             <Settings className="w-5 h-5" />
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex p-6 gap-6 overflow-hidden max-w-[1600px] mx-auto w-full">
        {/* Left: AI Avatar & Chat */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex-1 relative bg-slate-900/20 border border-slate-800/50 rounded-[2.5rem] overflow-hidden shadow-inner group">
            {/* Mock AI Avatar Visualizer */}
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 rounded-full border-2 border-indigo-500/10 flex items-center justify-center relative">
                   <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-ping opacity-20" />
                   <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/10 to-transparent flex items-center justify-center backdrop-blur-2xl border border-white/5">
                   <div className="flex gap-1.5 h-12 items-center">
                      {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                        <motion.div
                          key={i}
                          animate={isSpeaking ? { 
                            height: [12, 48 * (h / 5), 12],
                            backgroundColor: ["#6366f1", "#a855f7", "#6366f1"]
                          } : { 
                            height: 12,
                            backgroundColor: "#334155"
                          }}
                          transition={{ 
                            duration: 0.6, 
                            repeat: Infinity, 
                            delay: i * 0.05,
                            ease: "easeInOut"
                          }}
                          className="w-1.5 rounded-full min-h-[12px]"
                        />
                      ))}
                   </div>
                   </div>
                </div>
             </div>
             
             <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
               <div className="px-6 py-3 bg-slate-950/80 backdrop-blur-xl border border-slate-800/50 rounded-2xl">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">Current Question</p>
                  <p className="text-sm font-bold text-white tracking-wide">{messages.length > 0 ? messages[messages.length - 1].text : "Preparing..."}</p>
               </div>
             </div>
          </div>

          {/* Chat / Subtitles */}
          <div className="h-48 bg-slate-950/40 border border-slate-800/50 rounded-[2rem] p-6 overflow-y-auto custom-scrollbar">
             <div className="max-w-2xl mx-auto space-y-4">
                {messages.map((m, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : ''}`}
                  >
                    {m.role === 'ai' && (
                      <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <Cpu className="w-4 h-4 text-indigo-500" />
                      </div>
                    )}
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      m.role === 'ai' 
                      ? 'bg-slate-900/50 text-slate-300 rounded-tl-none border border-slate-800/50' 
                      : 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/20'
                    }`}>
                      {m.text}
                    </div>
                  </motion.div>
                ))}
             </div>
          </div>
        </div>

        {/* Right: User Video & Controls */}
        <div className="w-96 flex flex-col gap-6">
           {/* User Feed */}
           <div className="aspect-[3/4] bg-[#0A0A0B] border border-slate-800/50 rounded-[2.5rem] overflow-hidden relative group">
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                className="w-full h-full object-cover grayscale-[0.2]"
              />
              {!isVideoOn && (
                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3">
                  <VideoOff className="w-12 h-12 text-slate-800" />
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Camera Disabled</p>
                </div>
              )}
              
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
              
              <div className="absolute bottom-6 inset-x-6 flex items-center justify-between">
                 <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 backdrop-blur-md rounded-lg border border-white/5">
                    <span className="text-[9px] font-black text-white uppercase tracking-widest">Candidate Feed</span>
                 </div>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => setIsMicOn(!isMicOn)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isMicOn ? 'bg-slate-900/80 hover:bg-slate-800 text-white' : 'bg-red-500 text-white shadow-lg shadow-red-500/20'}`}
                    >
                      {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={() => setIsVideoOn(!isVideoOn)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isVideoOn ? 'bg-slate-900/80 hover:bg-slate-800 text-white' : 'bg-red-500 text-white shadow-lg shadow-red-500/20'}`}
                    >
                      {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                    </button>
                 </div>
              </div>
           </div>

           {/* Input Controls */}
              <div className="flex items-center gap-2 mb-2 justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Response Input</span>
                </div>
                {isListening && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 rounded-md border border-red-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Listening</span>
                  </div>
                )}
              </div>
              <div className="flex-1 relative flex flex-col gap-4">
                <textarea 
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder={isListening ? "Listening to your voice..." : "Speak or type your response..."}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-5 text-sm text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all resize-none font-medium custom-scrollbar"
                />
                <div className="absolute right-4 bottom-4 flex gap-2">
                  <button 
                    onClick={toggleListening}
                    className={`p-3 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                  >
                    {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={handleSend}
                    disabled={!currentInput.trim()}
                    className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-all shadow-xl shadow-indigo-600/20"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>

           <button 
             onClick={handleComplete}
             className="h-16 border border-red-500/20 hover:bg-red-500/5 text-red-500 rounded-[2rem] flex items-center justify-center gap-3 font-black text-xs uppercase tracking-[0.2em] transition-all"
           >
             <XCircle className="w-4 h-4" />
             End Interview Session
           </button>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
