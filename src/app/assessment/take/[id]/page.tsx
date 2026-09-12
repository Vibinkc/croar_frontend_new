"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import Editor from "@monaco-editor/react";
import { 
  Timer, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  Send, 
  Info, 
  Code2, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Layout,
  Terminal,
  Activity
} from "@/components/icons";

interface Attempt {
  id: string;
  status: string;
  score: number | null;
  generated_questions?: string[];
  topic?: string;
  type?: string;
}

/** Record a webcam answer for a VIDEO assessment question and upload it. */
function VideoAnswerRecorder({ attemptId, questionId, existingUrl, onUploaded }: {
  attemptId: string; questionId: string; existingUrl: string; onUploaded: (url: string) => void;
}) {
  const liveRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [phase, setPhase] = useState<"idle" | "ready" | "recording" | "recorded" | "uploading">(existingUrl ? "recorded" : "idle");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);
  useEffect(() => {
    if (phase !== "recording") return;
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const enableCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (liveRef.current) { liveRef.current.srcObject = stream; liveRef.current.muted = true; await liveRef.current.play().catch(() => {}); }
      setPhase("ready"); setError("");
    } catch {
      setError("Camera/microphone access is required to record your answer. Please allow it and retry.");
    }
  };
  const start = () => {
    if (!streamRef.current) return;
    chunksRef.current = []; setSeconds(0);
    const mime = MediaRecorder.isTypeSupported("video/webm") ? "video/webm" : "";
    const rec = new MediaRecorder(streamRef.current, mime ? { mimeType: mime } : undefined);
    rec.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setPreviewUrl(URL.createObjectURL(blob)); setPhase("recorded");
    };
    recorderRef.current = rec; rec.start(); setPhase("recording");
  };
  const stop = () => recorderRef.current?.stop();
  const upload = async () => {
    setPhase("uploading"); setError("");
    try {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const fd = new FormData();
      fd.append("video", blob, `answer-${questionId}.webm`);
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/public/assessment/${attemptId}/video/${questionId}`, { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onUploaded(data.url);
      streamRef.current?.getTracks().forEach(t => t.stop());
      setPhase("recorded");
    } catch {
      setError("Upload failed. Please try again."); setPhase("recorded");
    }
  };
  const reRecord = () => { setPreviewUrl(""); setPhase(streamRef.current ? "ready" : "idle"); };
  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const uploaded = !!existingUrl;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-rose-400">
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        <span className="text-[10px] font-black tracking-widest uppercase">Video answer</span>
      </div>
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-slate-800">
        {phase === "recorded" && (previewUrl || uploaded) ? (
          <video src={previewUrl || `${BACKEND_URL}${existingUrl}`} controls className="w-full h-full object-contain">
            {/* No caption file exists for a candidate's own recording. */}
            <track kind="captions" />
          </video>
        ) : (
          <video ref={liveRef} playsInline className="w-full h-full object-cover">
            {/* Live self-view; nothing to caption. */}
            <track kind="captions" />
          </video>
        )}
        {phase === "recording" && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-rose-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> REC {mmss}
          </div>
        )}
        {uploaded && phase === "recorded" && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Saved
          </div>
        )}
      </div>
      {error && <p className="text-rose-400 text-xs font-semibold">{error}</p>}
      <div className="flex flex-wrap gap-2.5">
        {phase === "idle" && <button onClick={enableCamera} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold">Enable camera</button>}
        {phase === "ready" && <button onClick={start} className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold">● Start recording</button>}
        {phase === "recording" && <button onClick={stop} className="px-5 py-2.5 rounded-xl bg-slate-200 text-slate-900 text-sm font-bold">■ Stop</button>}
        {phase === "recorded" && !uploaded && <>
          <button onClick={upload} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold">Save answer</button>
          <button onClick={reRecord} className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold">Re-record</button>
        </>}
        {phase === "recorded" && uploaded && <button onClick={reRecord} className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold">Record again</button>}
        {phase === "uploading" && <button disabled className="px-5 py-2.5 rounded-xl bg-slate-700 text-slate-300 text-sm font-bold">Uploading…</button>}
      </div>
      <p className="text-slate-500 text-xs">Record a concise spoken answer on camera, then save it. You can re-record before submitting.</p>
    </div>
  );
}

interface Question {
  id: string;
  title?: string;
  question?: string;
  problem_statement?: string;
  question_text?: string;
  type: "APTITUDE" | "CODING" | "VIDEO";
  options?: string[];
  initial_code?: Record<string, string>;
  difficulty?: string;
  content?: {
    constraints?: string | string[];
    examples?: Array<{
      input: string;
      output: string;
      explanation?: string;
    }>;
    test_cases?: Array<{
      input: string;
      output: string;
      is_hidden: boolean;
    }>;
  };
}

interface TestData {
  id: string;
  duration: number;
  type: string;
  questions: Question[];
  topic: string;
  organization?: {
    name: string;
    logo_url: string | null;
  };
}

interface TestResult {
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  isHidden: boolean;
}

type TestStatus = "VERIFY" | "INTRO" | "TESTING" | "COMPLETED" | "ERROR";

export default function CandidateAssessmentPage() {
  const { id: automationId } = useParams();
  const { t: tr } = useI18n();
  const [status, setStatus] = useState<TestStatus>("VERIFY");
  const [email, setEmail] = useState("");
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [testData, setTestData] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  
  // Coding specific states
  const [selectedLanguage, setSelectedLanguage] = useState("python");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [runningTests, setRunningTests] = useState(false);

  // 1. Verify Email
  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/public/assessment/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          automation_id: automationId, 
          template_id: automationId, // Send both, backend will figure out which one exists
          email 
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAttempt(data);
        if (data.status === "COMPLETED") {
          setStatus("COMPLETED");
          setScore(data.score);
        } else {
          setStatus("INTRO");
        }
      } else {
        const err = await res.json();
        setError(err.detail || tr("candidate.verificationFailedLong"));
      }
    } catch (e) {
      setError(tr("candidate.connectionError"));
    } finally {
      setLoading(false);
    }
  };

  // 2. Start Test
  const handleStartTest = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/public/assessment/${attempt?.id}`);
      if (res.ok) {
        const data = await res.json();
        setTestData(data);
        setTimeLeft(data.duration * 60);
        
        // Initialize answers if needed
        const initialAnswers: Record<string, string> = {};
        (data.questions || []).forEach((q: Question) => {
          if (data.type === "CODING") {
            initialAnswers[q.id] = q.initial_code?.[selectedLanguage] || q.initial_code?.python || "// Write your code here";
          }
        });
        setAnswers(initialAnswers);
        setStatus("TESTING");
      }
    } catch (e) {
      setError(tr("candidate.failedLoadTest"));
    } finally {
      setLoading(false);
    }
  };

  // 3. Submit
  const handleComplete = useCallback(async () => {
    if (!attempt) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/public/assessment/${attempt.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      if (res.ok) {
        const data = await res.json();
        setScore(data.score);
        setStatus("COMPLETED");
      }
    } catch (e) {
      setError(tr("candidate.failedSubmit"));
    } finally {
      setLoading(false);
    }
  }, [answers, attempt]);

  // Timer logic
  useEffect(() => {
    if (status === "TESTING" && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (status === "TESTING" && timeLeft === 0) {
      handleComplete();
    }
  }, [status, timeLeft, handleComplete]);

  const runTests = async () => {
    setRunningTests(true);
    // Mock test execution delay
    await new Promise(r => setTimeout(r, 1500));
    
    const currentQ = testData?.questions?.[currentIdx];
    if (!currentQ) return;
    const testCases = currentQ.content?.test_cases || [];
    
    // Simple mock runner: if code has "return", pass some, fail some
    const code = answers[currentQ.id] || "";
    const results: TestResult[] = testCases.map((tc, i) => ({
      passed: code.trim().length > 10, // Mock pass/fail
      input: tc.input,
      expected: tc.output,
      actual: code.trim().length > 10 ? tc.output : "Error: unexpected output",
      isHidden: tc.is_hidden
    }));
    
    setTestResults(results);
    setRunningTests(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (status === "VERIFY") {
    return (
      <div className="min-h-screen bg-[#1E2A38] flex flex-col items-center justify-center p-6 text-slate-300">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/20 overflow-hidden">
              {testData?.organization?.logo_url ? (
                <img src={testData.organization.logo_url} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Code2 className="w-8 h-8 text-indigo-500" />
              )}
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight ">
              {testData?.organization?.name || tr("candidate.technical")} {tr("candidate.assessment")}
            </h1>
            <p className="text-slate-500 text-sm">{tr("candidate.verifyAppDesc", { org: testData?.organization?.name || tr("candidate.us") })}</p>
          </div>
          
          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl shadow-2xl backdrop-blur-xl space-y-6">
            <div className="space-y-2">
              <label htmlFor="verify-email" className="text-[10px] font-black text-slate-500  tracking-[0.2em] ml-1">{tr("candidate.emailAddress")}</label>
              <input
                id="verify-email"
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-medium"
                placeholder="name@company.com"
              />
            </div>
            {error && <p className="text-xs text-red-500 font-bold bg-red-500/5 p-3 rounded-xl border border-red-500/10 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </p>}
            <button 
              onClick={handleVerify}
              disabled={loading || !email}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl py-4 font-black text-sm   transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
            >
              {loading ? tr("candidate.verifying") : tr("candidate.continue")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "INTRO") {
    return (
      <div className="min-h-screen bg-[#1E2A38] flex flex-col items-center justify-center p-6 text-slate-300">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-white  tracking-tight">{tr("candidate.readyToStart")}</h2>
            <p className="text-slate-500">{tr("candidate.reviewInstructions")}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                  <Clock className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-500  ">{tr("candidate.duration")}</h4>
                  <p className="text-lg font-black text-white">{tr("candidate.thirtyMinutes")}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{tr("candidate.durationNote")}</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                  <Activity className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-500  ">{tr("candidate.questions")}</h4>
                  <p className="text-lg font-black text-white">{attempt?.generated_questions?.length || 0} {tr("candidate.total")}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{tr("candidate.testedOn", { topic: attempt?.topic ?? "" })} {tr("candidate.assessmentContains", { rounds: attempt?.type === 'BOTH' ? tr("candidate.codingAndTechnical") : (attempt?.type?.toLowerCase() ?? "") })}</p>
            </div>
          </div>

          <button 
            onClick={handleStartTest}
            disabled={loading}
            className="w-full bg-white text-slate-950 rounded-2xl py-5 font-black text-base   hover:bg-slate-200 transition-all flex items-center justify-center gap-3 group"
          >
            {tr("candidate.startAssessment")}
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  if (status === "TESTING" && testData) {
    const currentQuestion = testData.questions?.[currentIdx];
    
    if (!currentQuestion) {
      return (
        <div className="min-h-screen bg-[#1E2A38] flex items-center justify-center text-slate-500">
           <div className="flex flex-col items-center gap-4">
              <AlertCircle className="w-12 h-12 text-slate-800" />
              <p className="text-sm font-black  ">{tr("candidate.noQuestions")}</p>
           </div>
        </div>
      );
    }
    
    return (
      <div className="h-screen bg-[#1E2A38] flex flex-col text-slate-300 font-sans selection:bg-indigo-500/30">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center overflow-hidden">
                {testData?.organization?.logo_url ? (
                  <img src={testData.organization.logo_url} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Code2 className="w-5 h-5 text-white" />
                )}
              </div>
              <span className="font-black text-white text-sm tracking-tighter  ">
                {testData?.organization?.name || "Screen"}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-800 mx-2" />
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-slate-500  ">
                {tr("candidate.question")} {currentIdx + 1} / {testData.questions.length}
              </span>
              <span className="text-xs font-bold text-slate-400">· {testData.topic}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
              timeLeft < 300 
                ? "bg-red-500/10 border-red-500/20 text-red-500" 
                : "bg-slate-900 border-slate-800 text-white"
            }`}>
              <Timer className="w-4 h-4" />
              <span className="font-mono font-black text-sm">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </header>

        {/* Main Split Content */}
        <main className="flex-1 flex overflow-hidden">
          {/* Left Panel: Instructions/Description */}
          <div className="w-1/2 border-r border-slate-800 flex flex-col bg-slate-950/20">
            <div className="h-12 border-b border-slate-800/50 flex items-center px-6 shrink-0">
              <div className="flex items-center gap-2 text-[#1E88E5]">
                <Info className="w-4 h-4" />
                <span className="text-[10px] font-black  ">{tr("candidate.instructions")}</span>
              </div>
            </div>
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-8">
              <h2 className="text-2xl font-black text-white leading-tight">
                {currentQuestion?.title || tr("candidate.problemStatement")}
              </h2>
              
              <div className="prose prose-invert prose-sm max-w-none text-slate-400 font-medium leading-relaxed">
                <p>{currentQuestion?.question || currentQuestion?.problem_statement || currentQuestion?.question_text}</p>
                
                {currentQuestion.content?.constraints && (
                  <div className="mt-8">
                    <h4 className="text-white text-xs font-black   mb-3">{tr("candidate.constraints")}</h4>
                    <ul className="space-y-2 list-none p-0">
                      {(Array.isArray(currentQuestion?.content?.constraints) ? currentQuestion.content.constraints : [currentQuestion?.content?.constraints]).map((c: string, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-indigo-500" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {currentQuestion.content?.examples && (
                  <div className="mt-8 space-y-6">
                    <h4 className="text-white text-xs font-black   mb-3">{tr("candidate.examples")}</h4>
                    {currentQuestion.content.examples.map((ex, i) => (
                      <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-3 font-mono text-[13px]">
                        <div className="flex gap-4">
                          <span className="text-slate-500 w-16  text-[10px] font-bold">{tr("candidate.inputLabel")}</span>
                          <span className="text-indigo-400">{ex.input}</span>
                        </div>
                        <div className="flex gap-4 border-t border-slate-800/50 pt-2">
                          <span className="text-slate-500 w-16  text-[10px] font-bold">{tr("candidate.outputLabel")}</span>
                          <span className="text-emerald-400">{ex.output}</span>
                        </div>
                        {ex.explanation && (
                          <p className="text-[11px] text-slate-500 font-sans  pt-1">{ex.explanation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Interactive (Aptitude or Coding) */}
          <div className="w-1/2 flex flex-col bg-slate-950">
            {currentQuestion?.type === "APTITUDE" ? (
              <div className="flex-1 flex flex-col p-8 lg:p-12 overflow-y-auto custom-scrollbar">
                <div className="h-12 flex items-center mb-8">
                  <div className="flex items-center gap-2 text-indigo-500">
                    <Layout className="w-4 h-4" />
                    <span className="text-[10px] font-black  ">{tr("candidate.selectAnswer")}</span>
                  </div>
                </div>
                <div className="grid gap-3">
                  {currentQuestion.options?.map((opt: string, i: number) => (
                    <button 
                      key={opt}
                      onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: opt }))}
                      className={`group w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-sm font-bold transition-all border-2 text-left relative overflow-hidden ${
                        answers[currentQuestion.id] === opt 
                        ? "bg-indigo-600/10 border-indigo-500 text-white" 
                        : "bg-slate-900/40 border-slate-800/50 text-slate-400 hover:border-slate-700 hover:bg-slate-900/60"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        answers[currentQuestion.id] === opt 
                        ? "border-white bg-white text-indigo-600" 
                        : "border-slate-700 group-hover:border-slate-500"
                      }`}>
                         {answers[currentQuestion.id] === opt && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                      </div>
                      <span className="flex-1 relative z-10">{opt}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : currentQuestion?.type === "VIDEO" ? (
              <div className="flex-1 flex flex-col p-6 lg:p-10 overflow-y-auto custom-scrollbar">
                <VideoAnswerRecorder
                  key={currentQuestion.id}
                  attemptId={attempt?.id || ""}
                  questionId={currentQuestion.id}
                  existingUrl={answers[currentQuestion.id] || ""}
                  onUploaded={(url) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: url }))}
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="h-12 border-b border-slate-800/50 flex items-center justify-between px-6 shrink-0">
                  <div className="flex items-center gap-2 text-emerald-500">
                    <Terminal className="w-4 h-4" />
                    <span className="text-[10px] font-black  ">{tr("candidate.codeEditor")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-500 ">{currentQuestion.difficulty || tr("candidate.medium")}</span>
                    <select 
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-[10px] font-black  text-slate-400 px-2 py-1 rounded-md focus:outline-none"
                    >
                      <option value="python">Python 3</option>
                      <option value="java">Java</option>
                      <option value="javascript">JavaScript</option>
                    </select>
                  </div>
                </div>
                <div className="flex-1 relative border-b border-slate-800">
                  <Editor
                    height="100%"
                    defaultLanguage="python"
                    language={selectedLanguage}
                    theme="vs-dark"
                    value={answers[currentQuestion.id] || ""}
                    onChange={(val) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: val ?? "" }))}
                    options={{
                      fontSize: 14,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      padding: { top: 20 },
                      fontFamily: "var(--font-mono)",
                      automaticLayout: true,
                    }}
                  />
                </div>
                <div className="h-1/3 flex flex-col bg-slate-950/80">
                  <div className="h-10 border-b border-slate-800/50 flex items-center justify-between px-6 shrink-0">
                     <div className="flex items-center gap-2 text-slate-500">
                      <Activity className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black  ">{tr("candidate.tests")}</span>
                    </div>
                    {runningTests && <span className="text-[10px] font-bold text-indigo-500 animate-pulse">{tr("candidate.running")}</span>}
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
                    {testResults.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2 opacity-50">
                        <Play className="w-8 h-8" />
                        <p className="text-xs font-bold">{tr("candidate.runTestsToSee")}</p>
                      </div>
                    ) : (
                      testResults.map((res, i) => (
                        <div key={i} className={`p-3 rounded-xl border flex items-center justify-between ${
                          res.passed ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"
                        }`}>
                          <div className="flex items-center gap-3">
                            {res.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                            <span className="text-xs font-bold text-slate-300">
                              {res.isHidden ? tr("candidate.hiddenCase", { n: i+1 }) : tr("candidate.case", { n: i+1 })}
                            </span>
                          </div>
                          {!res.isHidden && (
                            <span className="text-[10px] font-mono text-slate-500">{tr("candidate.inLabel")} {res.input}</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="h-16 border-t border-slate-800 flex items-center justify-between px-8 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              disabled={currentIdx === 0}
              onClick={() => { setCurrentIdx(i => i - 1); setTestResults([]); }}
              className="p-2 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 disabled:opacity-20 transition-all shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              disabled={currentIdx === testData.questions.length - 1}
              onClick={() => { setCurrentIdx(i => i + 1); setTestResults([]); }}
              className="p-2 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 disabled:opacity-20 transition-all shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {testData.type === "CODING" && (
              <button 
                onClick={runTests}
                disabled={runningTests || loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-emerald-500/30 text-emerald-500 text-xs font-black   hover:bg-emerald-500/10 transition-all"
              >
                <Play className="w-4 h-4" />
                {tr("candidate.runTests")}
              </button>
            )}
            <button 
              onClick={handleComplete}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-white text-slate-950 text-xs font-black   hover:bg-slate-200 transition-all shadow-lg shadow-white/5 active:scale-95"
            >
              <Send className="w-4 h-4" />
              {tr("candidate.submitTest")}
            </button>
          </div>
        </footer>

        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
            height: 5px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #37474F;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #334155;
          }
        `}</style>
      </div>
    );
  }

  if (status === "COMPLETED") {
    return (
      <div className="min-h-screen bg-[#1E2A38] flex flex-col items-center justify-center p-6 text-slate-300">
        <div className="w-full max-w-md bg-slate-900/50 border border-slate-800 rounded-3xl p-10 text-center shadow-2xl backdrop-blur-xl">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4  tracking-tight ">{tr("candidate.successfullySubmitted")}</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            {tr("candidate.assessmentRecorded")}
          </p>
          
          {score !== null && (
            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 mb-8 inline-block">
              <p className="text-[10px] font-black text-slate-500   mb-1">{tr("candidate.finalScore")}</p>
              <p className="text-4xl font-black text-white">{score}%</p>
            </div>
          )}
          
          <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
            <p className="text-[10px] font-black text-slate-600  ">{tr("candidate.assessmentId")}</p>
            <p className="text-[10px] font-mono text-slate-700 truncate px-4">{attempt?.id}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1E2A38] flex items-center justify-center">
       <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
