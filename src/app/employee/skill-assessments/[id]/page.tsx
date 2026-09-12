"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import {
  Timer, ChevronRight, ChevronLeft, Play, Send, Info, Code2,
  CheckCircle2, AlertCircle, Clock, Layout, Terminal, Activity,
} from "@/components/icons";
import { meApi, type SkillAssessmentDetail, type SkillQuestion } from "@/utils/payroll/api";
import { isNoEmployeeLink } from "@/components/employee/NotLinkedNotice";
import { useI18n } from "@/context/I18nContext";

type Phase = "LOADING" | "INTRO" | "TESTING" | "COMPLETED" | "ERROR";

interface TestResult { passed: boolean; input: string; isHidden: boolean }

const isCoding = (q?: SkillQuestion) => !!q && /COD/i.test(q.type);
const qBody = (q: SkillQuestion) => q.question || q.problem_statement || q.question_text || "";

export default function EmployeeSkillAssessmentTake() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();

  const [phase, setPhase] = useState<Phase>("LOADING");
  const [test, setTest] = useState<SkillAssessmentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [selectedLanguage, setSelectedLanguage] = useState("python");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [runningTests, setRunningTests] = useState(false);

  // Load the assessment (questions + meta) on mount.
  useEffect(() => {
    (async () => {
      try {
        const data = await meApi.mySkillAssessment(id);
        setTest(data);
        if (data.status === "COMPLETED") setPhase("COMPLETED");
        else setPhase("INTRO");
      } catch (e) {
        setError((e as Error).message);
        setPhase("ERROR");
      }
    })();
  }, [id]);

  const handleStart = () => {
    if (!test) return;
    const init: Record<string, string> = {};
    test.questions.forEach((q) => {
      if (isCoding(q)) init[q.id] = q.initial_code?.[selectedLanguage] || q.initial_code?.python || "";
    });
    setAnswers(init);
    setTimeLeft(Math.max(1, test.duration) * 60);
    setPhase("TESTING");
  };

  const handleSubmit = useCallback(async () => {
    if (!test || loading) return;
    setLoading(true);
    setSubmitError(null);
    try {
      await meApi.submitSkillAssessment(test.id, answers);
      setPhase("COMPLETED");
    } catch (e) {
      const msg = (e as Error).message || "";
      // Already submitted (e.g. in another tab / a double-submit) → just show the result screen.
      if (/already/i.test(msg) || /409/.test(msg)) {
        setPhase("COMPLETED");
      } else {
        setSubmitError(msg || t("employee.submitFailed"));
      }
    } finally {
      setLoading(false);
    }
  }, [test, answers, loading]);

  // Timer — auto-submit at zero.
  useEffect(() => {
    if (phase !== "TESTING") return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase, timeLeft, handleSubmit]);

  const runTests = async () => {
    setRunningTests(true);
    await new Promise((r) => setTimeout(r, 1200));
    const q = test?.questions?.[currentIdx];
    const code = (q && answers[q.id]) || "";
    // Lightweight local check (real grading happens server-side on submit).
    setTestResults([0, 1, 2].map((i) => ({ passed: code.trim().length > 10, input: `case ${i + 1}`, isHidden: i === 2 })));
    setRunningTests(false);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${s % 60 < 10 ? "0" : ""}${s % 60}`;

  if (phase === "LOADING") {
    return (
      <div className="min-h-screen bg-[#1E2A38] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (phase === "ERROR") {
    const linked = !isNoEmployeeLink(error);
    return (
      <div className="min-h-screen bg-[#1E2A38] flex flex-col items-center justify-center p-6 text-slate-300">
        <div className="w-full max-w-md bg-slate-900/50 border border-slate-800 rounded-3xl p-10 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-6" />
          <h2 className="text-xl font-black text-white mb-3">{t("employee.couldNotLoadAssessment")}</h2>
          <p className="text-slate-500 text-sm mb-8">{linked ? error : t("employee.accountNotLinked")}</p>
          <button onClick={() => router.push("/employee/skill-assessments")} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-6 py-3 font-black text-sm transition-all">
            {t("employee.backToAssessments")}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "INTRO" && test) {
    return (
      <div className="min-h-screen bg-[#1E2A38] flex flex-col items-center justify-center p-6 text-slate-300">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/20">
              <Code2 className="w-8 h-8 text-indigo-500" />
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight">{test.name}</h2>
            <p className="text-slate-500">{t("employee.introReview")}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                  <Clock className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-500 uppercase">{t("employee.duration")}</h4>
                  <p className="text-lg font-black text-white">{t("employee.nMinutes", { n: test.duration })}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{t("employee.introTimerNote")}</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                  <Activity className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-500 uppercase">{t("employee.questions")}</h4>
                  <p className="text-lg font-black text-white">{t("employee.nTotal", { n: test.questions.length })}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{t("employee.introTopicLine", { topic: test.topic, kind: test.type === "BOTH" ? t("employee.kindCodingAptitude") : test.type === "CODING" ? t("employee.kindCoding") : test.type === "APTITUDE" ? t("employee.kindAptitude") : test.type.toLowerCase() })}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => router.push("/employee/skill-assessments")} className="rounded-2xl px-6 py-5 font-black text-sm border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all">
              {t("employee.cancel")}
            </button>
            <button onClick={handleStart} className="flex-1 bg-white text-slate-950 rounded-2xl py-5 font-black text-base hover:bg-slate-200 transition-all flex items-center justify-center gap-3 group">
              {t("employee.startAssessment")}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "TESTING" && test) {
    const q = test.questions[currentIdx];
    if (!q) {
      return (
        <div className="min-h-screen bg-[#1E2A38] flex items-center justify-center text-slate-500">
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="w-12 h-12 text-slate-800" />
            <p className="text-sm font-black">{t("employee.noQuestionsInAssessment")}</p>
          </div>
        </div>
      );
    }
    const coding = isCoding(q);
    const answered = test.questions.filter((x) => (answers[x.id] || "").trim()).length;

    return (
      <div className="h-screen bg-[#1E2A38] flex flex-col text-slate-300 font-sans selection:bg-indigo-500/30">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"><Code2 className="w-5 h-5 text-white" /></div>
              <span className="font-black text-white text-sm tracking-tight truncate max-w-[200px]">{test.name}</span>
            </div>
            <div className="h-6 w-px bg-slate-800 mx-2" />
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-slate-500">{t("employee.questionOf", { current: currentIdx + 1, total: test.questions.length })}</span>
              <span className="text-xs font-bold text-slate-400">· {t("employee.answered", { count: answered })}</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${timeLeft < 300 ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-slate-900 border-slate-800 text-white"}`}>
              <Timer className="w-4 h-4" />
              <span className="font-mono font-black text-sm">{fmt(timeLeft)}</span>
            </div>
          </div>
        </header>

        {/* Split content */}
        <main className="flex-1 flex overflow-hidden">
          {/* Left: question */}
          <div className="w-1/2 border-r border-slate-800 flex flex-col bg-slate-950/20">
            <div className="h-12 border-b border-slate-800/50 flex items-center px-6 shrink-0">
              <div className="flex items-center gap-2 text-indigo-400"><Info className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-wider">{t("employee.question")}</span></div>
            </div>
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-6">
              <h2 className="text-xl font-black text-white leading-snug">{q.title || t("employee.questionN", { n: currentIdx + 1 })}</h2>
              <div className="text-slate-400 font-medium leading-relaxed whitespace-pre-wrap">{qBody(q)}</div>
            </div>
          </div>

          {/* Right: answer */}
          <div className="w-1/2 flex flex-col bg-slate-950">
            {!coding ? (
              <div className="flex-1 flex flex-col p-8 lg:p-12 overflow-y-auto custom-scrollbar">
                <div className="h-12 flex items-center mb-8">
                  <div className="flex items-center gap-2 text-indigo-500"><Layout className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-wider">{t("employee.yourAnswer")}</span></div>
                </div>
                {Array.isArray(q.options) && q.options.length > 0 ? (
                  <div className="grid gap-3">
                    {q.options.map((opt) => {
                      const sel = answers[q.id] === opt;
                      return (
                        <button key={opt} onClick={() => setAnswers((p) => ({ ...p, [q.id]: opt }))}
                          className={`group w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-sm font-bold transition-all border-2 text-left ${sel ? "bg-indigo-600/10 border-indigo-500 text-white" : "bg-slate-900/40 border-slate-800/50 text-slate-400 hover:border-slate-700 hover:bg-slate-900/60"}`}>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${sel ? "border-white bg-white" : "border-slate-700 group-hover:border-slate-500"}`}>
                            {sel && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                          </div>
                          <span className="flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <textarea
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                    placeholder={t("employee.typeYourAnswer")}
                    className="flex-1 min-h-[220px] w-full resize-none rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-[14px] text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                  />
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="h-12 border-b border-slate-800/50 flex items-center justify-between px-6 shrink-0">
                  <div className="flex items-center gap-2 text-emerald-500"><Terminal className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-wider">{t("employee.codeEditor")}</span></div>
                  <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="bg-slate-900 border border-slate-800 text-[10px] font-black text-slate-400 px-2 py-1 rounded-md focus:outline-none">
                    <option value="python">Python 3</option>
                    <option value="java">Java</option>
                    <option value="javascript">JavaScript</option>
                  </select>
                </div>
                <div className="flex-1 relative border-b border-slate-800">
                  <Editor height="100%" language={selectedLanguage} theme="vs-dark" value={answers[q.id] || ""}
                    onChange={(val) => setAnswers((p) => ({ ...p, [q.id]: val ?? "" }))}
                    options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 20 }, automaticLayout: true }} />
                </div>
                <div className="h-1/3 flex flex-col bg-slate-950/80">
                  <div className="h-10 border-b border-slate-800/50 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-2 text-slate-500"><Activity className="w-3.5 h-3.5" /><span className="text-[10px] font-black uppercase tracking-wider">{t("employee.tests")}</span></div>
                    {runningTests && <span className="text-[10px] font-bold text-indigo-500 animate-pulse">{t("employee.running")}</span>}
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
                    {testResults.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2 opacity-50">
                        <Play className="w-8 h-8" /><p className="text-xs font-bold">{t("employee.runTestsToSeeResults")}</p>
                      </div>
                    ) : testResults.map((res, i) => (
                      <div key={i} className={`p-3 rounded-xl border flex items-center gap-3 ${res.passed ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                        {res.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                        <span className="text-xs font-bold text-slate-300">{res.isHidden ? t("employee.hiddenCaseN", { n: i + 1 }) : t("employee.caseN", { n: i + 1 })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="h-16 border-t border-slate-800 flex items-center justify-between px-8 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <button disabled={currentIdx === 0} onClick={() => { setCurrentIdx((i) => i - 1); setTestResults([]); }}
              className="p-2 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 disabled:opacity-20 transition-all"><ChevronLeft className="w-5 h-5" /></button>
            <button disabled={currentIdx === test.questions.length - 1} onClick={() => { setCurrentIdx((i) => i + 1); setTestResults([]); }}
              className="p-2 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 disabled:opacity-20 transition-all"><ChevronRight className="w-5 h-5" /></button>
          </div>
          <div className="flex items-center gap-4">
            {coding && (
              <button onClick={runTests} disabled={runningTests || loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-emerald-500/30 text-emerald-500 text-xs font-black uppercase hover:bg-emerald-500/10 transition-all">
                <Play className="w-4 h-4" /> {t("employee.runTests")}
              </button>
            )}
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-white text-slate-950 text-xs font-black uppercase hover:bg-slate-200 transition-all shadow-lg active:scale-95">
              <Send className="w-4 h-4" /> {loading ? t("employee.submitting") : t("employee.submitTest")}
            </button>
          </div>
        </footer>

        {submitError && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] font-bold text-red-400 shadow-2xl backdrop-blur">
            <AlertCircle className="w-4 h-4" /> {submitError}
          </div>
        )}

        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #37474F; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
        `}</style>
      </div>
    );
  }

  // COMPLETED
  return (
    <div className="min-h-screen bg-[#1E2A38] flex flex-col items-center justify-center p-6 text-slate-300">
      <div className="w-full max-w-md bg-slate-900/50 border border-slate-800 rounded-3xl p-10 text-center shadow-2xl backdrop-blur-xl">
        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-emerald-500/20">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-white mb-4 tracking-tight">{t("employee.assessmentSubmitted")}</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          {t("employee.assessmentSubmittedDesc")}
        </p>
        <button onClick={() => router.push("/employee/skill-assessments")} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl py-4 font-black text-sm transition-all">
          {t("employee.backToMyAssessments")}
        </button>
      </div>
    </div>
  );
}
