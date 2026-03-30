"use client";

import { use, useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import { apiClient } from "@/utils/api";
import AIGenerationOverlay from "@/components/ui/AIGenerationOverlay";
import JobSimulationResult from "@/components/results/JobSimulationResult";
import { LANGUAGE_CONFIG } from "@/utils/languages";
import McqQuestion from "@/components/assessment/McqQuestion";
import TextQuestion from "@/components/assessment/TextQuestion";
import CodeQuestion from "@/components/assessment/CodeQuestion";

export default function JobSimulationSessionPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const { id } = unwrappedParams;
    const router = useRouter();

    const [simulation, setSimulation] = useState<any>(null);
    const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionDirection, setTransitionDirection] = useState<'next' | 'prev'>('next');

    const questionRef = useRef<HTMLDivElement>(null);
    const [leftPaneWidth, setLeftPaneWidth] = useState(50);
    const [leftPaneHeight, setLeftPaneHeight] = useState(70);
    const [rightPaneHeight, setRightPaneHeight] = useState(60);
    const splitPaneRef = useRef<HTMLDivElement>(null);
    const [theme, setTheme] = useState<'dark' | 'light'>('light');
    const [selectedLanguage, setSelectedLanguage] = useState('python');

    // Test logic is kept here because it involves API calls and global state
    const [testResults, setTestResults] = useState<{ [key: string]: any }>({});
    const [executingTests, setExecutingTests] = useState<{ [key: string]: boolean }>({});
    const [showConsole, setShowConsole] = useState(false);
    const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
    const [customInput, setCustomInput] = useState("");
    const [customTestResult, setCustomTestResult] = useState<any>(null);
    const [executingCustomTest, setExecutingCustomTest] = useState(false);

    useEffect(() => {
        const fetchSim = async () => {
            const res = await apiClient.get(`/api/v1/job-simulation/${id}`);
            if (res.ok) {
                const data = await res.json();
                setSimulation(data);

                // Set initial boilerplate if no answer exists for the first question
                const firstQuestion = data.rounds[0]?.questions[0];
                if (firstQuestion && !answers[firstQuestion.id] && firstQuestion.type === 'code') {
                    const initialCode = LANGUAGE_CONFIG['python']?.boilerplate || "";
                    setAnswers(prev => ({
                        ...prev,
                        [firstQuestion.id]: initialCode
                    }));
                }
            }
        };
        fetchSim();
    }, [id]);

    const handleRunTest = async (testIndex: number) => {
        const currentRound = simulation.rounds[currentRoundIndex];
        const currentQuestion = currentRound.questions[currentQuestionIndex];
        const code = answers[currentQuestion.id];

        if (!code || !currentQuestion.test_cases?.[testIndex]) return;

        const testId = `${currentQuestion.id}_${testIndex}`;
        setExecutingTests(prev => ({ ...prev, [testId]: true }));
        setTestResults(prev => ({ ...prev, [testId]: { status: 'running' } }));
        setShowConsole(true);
        setConsoleOutput(prev => [...prev, `> Running test case ${testIndex + 1}...`]);

        try {
            const res = await apiClient.post(`/api/v1/assessments/ai/verify-code`, {
                code,
                language: selectedLanguage,
                problem_statement: currentQuestion.text,
                test_cases: [currentQuestion.test_cases[testIndex]]
            });

            if (res.ok) {
                const data = await res.json();
                const result = data.test_cases[0];
                setTestResults(prev => ({ ...prev, [testId]: result }));
                setConsoleOutput(prev => [
                    ...prev,
                    result.passed ? `✓ Test case ${testIndex + 1} passed!` : `✗ Test case ${testIndex + 1} failed.`,
                    `  Input: ${result.input}`,
                    `  Expected: ${result.expected}`,
                    `  Actual: ${result.actual}`,
                    data.output ? `  Output: ${data.output}` : ''
                ].filter(Boolean));
            }
        } catch (e) {
            console.error(e);
            setTestResults(prev => ({ ...prev, [testId]: { status: 'error' } }));
        } finally {
            setExecutingTests(prev => ({ ...prev, [testId]: false }));
        }
    };

    const handleRunAllTests = async () => {
        const currentRound = simulation.rounds[currentRoundIndex];
        const currentQuestion = currentRound.questions[currentQuestionIndex];
        const testCases = currentQuestion.test_cases || [];

        setConsoleOutput([]); // Clear console
        for (let i = 0; i < testCases.length; i++) {
            await handleRunTest(i);
        }
    };

    const handleRunCustomTest = async () => {
        const currentRound = simulation.rounds[currentRoundIndex];
        const currentQuestion = currentRound.questions[currentQuestionIndex];
        const code = answers[currentQuestion.id];

        if (!code || !customInput.trim()) return;

        setExecutingCustomTest(true);
        setCustomTestResult({ status: 'running' });
        setShowConsole(true);
        setConsoleOutput(prev => [...prev, `> Running custom test case...`, `  Input: ${customInput}`]);

        try {
            const res = await apiClient.post(`/api/v1/assessments/ai/verify-code`, {
                code,
                language: selectedLanguage,
                problem_statement: currentQuestion.text,
                test_cases: [{ input: customInput, expected: "" }] // No expected for custom
            });

            if (res.ok) {
                const data = await res.json();
                const result = data.test_cases[0];
                setCustomTestResult(result);
                setConsoleOutput(prev => [
                    ...prev,
                    `✓ Custom test completed.`,
                    `  Output: ${result.actual}`,
                    data.output ? `  Detailed Logs: ${data.output}` : ''
                ].filter(Boolean));
            }
        } catch (e) {
            console.error(e);
            setCustomTestResult({ status: 'error' });
        } finally {
            setExecutingCustomTest(false);
        }
    };

    const handleLanguageChange = (lang: string) => {
        setSelectedLanguage(lang);

        if (!simulation) return;
        const currentRound = simulation.rounds[currentRoundIndex];
        const currentQuestion = currentRound.questions[currentQuestionIndex];

        // Populate boilerplate if editor is empty, has generic boilerplate of another language,
        // or matches the initial_code (which might be in the wrong language)
        const currentAns = answers[currentQuestion.id] || "";
        const isDefault = Object.values(LANGUAGE_CONFIG).some(config => config.boilerplate.trim() === currentAns.trim())
            || currentAns.trim() === ""
            || (currentQuestion.initial_code && currentAns.trim() === currentQuestion.initial_code.trim());

        if (isDefault) {
            // Safe check because LANGUAGE_CONFIG might not have the key if type is loose
            const boiler = LANGUAGE_CONFIG[lang]?.boilerplate;
            if (boiler) {
                handleAnswer(String(currentQuestion.id), boiler);
            }
        }
    };

    const handleAnswer = (questionId: string, text: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: text
        }));
    };

    const handleNext = () => {
        if (!simulation) return;
        const currentRound = simulation.rounds[currentRoundIndex];

        // Transition animation
        setTransitionDirection('next');
        setIsTransitioning(true);
        setTimeout(() => {
            if (currentQuestionIndex < currentRound.questions.length - 1) {
                // Next Question in same round
                const nextQIdx = currentQuestionIndex + 1;
                const nextQ = currentRound.questions[nextQIdx];
                if (!answers[nextQ.id] && nextQ.type === 'code') {
                    const initialCode = LANGUAGE_CONFIG[selectedLanguage]?.boilerplate || "";
                    handleAnswer(String(nextQ.id), initialCode);
                }
                setCurrentQuestionIndex(nextQIdx);
            } else {
                // End of round
                if (currentRoundIndex < simulation.rounds.length - 1) {
                    // Next Round
                    const nextRIdx = currentRoundIndex + 1;
                    const nextR = simulation.rounds[nextRIdx];
                    const nextQ = nextR.questions[0];
                    if (nextQ && !answers[nextQ.id] && nextQ.type === 'code') {
                        const initialCode = LANGUAGE_CONFIG[selectedLanguage]?.boilerplate || "";
                        handleAnswer(String(nextQ.id), initialCode);
                    }
                    setCurrentRoundIndex(nextRIdx);
                    setCurrentQuestionIndex(0);
                } else {
                    // Finish Simulation
                    handleComplete();
                }
            }
            setIsTransitioning(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 300);
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setTransitionDirection('prev');
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentQuestionIndex(prev => prev - 1);
                setIsTransitioning(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 300);
        } else if (currentRoundIndex > 0) {
            // Go to previous round's last question
            setTransitionDirection('prev');
            setIsTransitioning(true);
            setTimeout(() => {
                const prevRoundIndex = currentRoundIndex - 1;
                const prevRound = simulation.rounds[prevRoundIndex];
                setCurrentRoundIndex(prevRoundIndex);
                setCurrentQuestionIndex(prevRound.questions.length - 1);
                setIsTransitioning(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 300);
        }
    };

    const handleComplete = async () => {
        setSubmitting(true);
        try {
            const res = await apiClient.post(`/api/v1/job-simulation/complete`, {
                job_profile_id: Number(id),
                answers: answers
            });

            if (res.ok) {
                const data = await res.json();
                setSimulation((prev: any) => ({ ...prev, user_attempt: data }));
                setCompleted(true);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    if (!simulation) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest animate-pulse">Initializing Hiring Protocol...</p>
            </div>
        </div>
    );

    if (completed || simulation.user_attempt) {
        return <JobSimulationResult attempt={simulation.user_attempt} />;
    }

    const currentRound = simulation.rounds[currentRoundIndex];
    if (!currentRound) return null;

    const currentQuestion = currentRound.questions[currentQuestionIndex];
    const totalQuestionsInRound = currentRound.questions.length;

    // Calculate overall progress across all rounds
    const totalRounds = simulation.rounds.length;
    const progressPerRound = 100 / totalRounds;
    const currentRoundBaseProgress = currentRoundIndex * progressPerRound;
    const questionProgress = ((currentQuestionIndex) / totalQuestionsInRound) * progressPerRound;
    const totalProgress = currentRoundBaseProgress + questionProgress;

    const isLastQuestion = currentQuestionIndex === totalQuestionsInRound - 1;
    const isLastRound = currentRoundIndex === totalRounds - 1;

    const handleMouseDown = (e: React.MouseEvent) => {
        const startX = e.clientX;
        const startWidth = leftPaneWidth;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const newWidth = startWidth + (deltaX / (splitPaneRef.current?.offsetWidth || 1)) * 100;
            if (newWidth > 20 && newWidth < 80) {
                setLeftPaneWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleLeftHorizontalMouseDown = (e: React.MouseEvent) => {
        const startY = e.clientY;
        const startHeight = leftPaneHeight;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaY = moveEvent.clientY - startY;
            const newHeight = startHeight + (deltaY / (splitPaneRef.current?.offsetHeight || 1)) * 100;
            if (newHeight > 20 && newHeight < 90) {
                setLeftPaneHeight(newHeight);
            }
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleRightHorizontalMouseDown = (e: React.MouseEvent) => {
        const startY = e.clientY;
        const startHeight = rightPaneHeight;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaY = moveEvent.clientY - startY;
            const newHeight = startHeight + (deltaY / (splitPaneRef.current?.offsetHeight || 1)) * 100;
            if (newHeight > 20 && newHeight < 90) {
                setRightPaneHeight(newHeight);
            }
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const isDark = theme === 'dark';

    return (
        <div className={`h-screen overflow-hidden flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-[#111214] text-[#8e9297]' : 'bg-[#fcfcfd] text-slate-600'}`}>
            <AIGenerationOverlay isOpen={submitting} title="Optimizing Hiring Protocol" />

            {/* 1. HEADER */}
            <header className={`border-b h-14 flex items-center justify-between px-6 z-40 transition-colors duration-300 ${isDark ? 'bg-[#111214] border-[#2d2e32]' : 'bg-white border-slate-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'}`}>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/practice/job-simulation')}
                        className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${isDark ? 'hover:bg-[#2d2e31] text-[#8e9297]' : 'hover:bg-slate-100 text-slate-400'}`}
                    >
                        <span className="material-icons-outlined text-sm">arrow_back</span>
                    </button>
                    <div className={`w-px h-4 ${isDark ? 'bg-[#2d2e32]' : 'bg-slate-200/80'}`} />
                    <span className={`text-[13px] font-bold tracking-tight ${isDark ? 'text-[#e1e1e1]' : 'text-slate-900'}`}>
                        Round {currentRoundIndex + 1} / {totalRounds}
                    </span>
                    <div className={`w-px h-4 ${isDark ? 'bg-[#2d2e32]' : 'bg-slate-200/80'}`} />
                    <span className={`text-[13px] font-bold tracking-tight ${isDark ? 'text-[#e1e1e1]' : 'text-slate-900'}`}>
                        Question {currentQuestionIndex + 1} / {totalQuestionsInRound} — {currentRound.round_title}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Theme Switcher */}
                    <button
                        onClick={() => setTheme(isDark ? 'light' : 'dark')}
                        className={`group flex items-center h-9 px-2 rounded-full border transition-all duration-300 hover:px-3 ${isDark
                            ? 'bg-[#1e1f23] border-[#2d2e32] text-[#8e9297] hover:bg-[#2b2d31] hover:text-white'
                            : 'bg-slate-100/80 border-slate-200 text-slate-500 hover:bg-white hover:text-indigo-600 hover:border-indigo-100 hover:shadow-sm'
                            }`}
                    >
                        <span className="material-icons-outlined text-[18px]">
                            {isDark ? 'light_mode' : 'dark_mode'}
                        </span>
                        <div className="overflow-hidden max-w-0 opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-500 ease-in-out whitespace-nowrap">
                            <span className="text-[11px] font-black tracking-widest uppercase">
                                {isDark ? 'Light' : 'Dark'}
                            </span>
                        </div>
                    </button>

                    <div className={`w-px h-4 mx-2 ${isDark ? 'bg-[#2d2e32]' : 'bg-slate-200/80'}`} />

                    <button className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${isDark ? 'hover:bg-[#2d2e31] text-[#8e9297]' : 'hover:bg-slate-100 text-slate-400'}`}>
                        <span className="material-icons-outlined text-lg">help_outline</span>
                    </button>
                </div>
            </header>

            {/* 2. MAIN AREA WITH RESIZABLE SPLIT PANE */}
            <main
                ref={splitPaneRef}
                className="flex-1 flex overflow-hidden relative"
            >
                {/* LEFT PANE */}
                <div
                    style={{ width: `${leftPaneWidth}%` }}
                    className={`flex flex-col border-r transition-colors duration-300 ${isDark ? 'border-[#2d2e32] bg-[#111214]' : 'border-slate-200 bg-white'}`}
                >
                    {currentQuestion.type === 'code' ? (
                        <>
                            {/* TOP: Instructions */}
                            <div style={{ height: showConsole ? `${leftPaneHeight}%` : '100%' }} className="flex flex-col overflow-hidden">
                                <div className={`h-14 flex items-center px-6 flex-shrink-0 transition-colors ${isDark ? 'bg-[#111214]' : 'bg-[#fafbfc]'}`}>
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isDark
                                        ? 'bg-[#1e1f23] border-[#2d2e32] text-white'
                                        : 'bg-white border-slate-200 text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                                        }`}>
                                        <span className={`material-icons-outlined text-[16px] ${isDark ? 'text-white' : 'text-slate-400'}`}>description</span>
                                        <span className="text-[11px] font-bold tracking-tight">Instructions</span>
                                    </div>
                                </div>
                                <div className={`flex-1 overflow-y-auto p-10 transition-all duration-300 no-scrollbar ${isTransitioning ? 'opacity-0' : 'opacity-100'}`} style={{
                                    transform: isTransitioning
                                        ? `translateX(${transitionDirection === 'next' ? '20px' : '-20px'})`
                                        : 'translateX(0)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}>
                                    <div className="max-w-2xl space-y-8">
                                        <div>
                                            <h2 className={`text-[15px] font-medium leading-relaxed ${isDark ? 'text-[#cfd0d2]' : 'text-slate-700'}`}>
                                                {currentQuestion.text}
                                            </h2>
                                        </div>

                                        {(currentQuestion.examples || currentQuestion.test_cases?.length > 0) && (
                                            <div className="space-y-6">
                                                {(currentQuestion.examples || currentQuestion.test_cases?.slice(0, 2)).map((ex: any, i: number) => (
                                                    <div key={i} className="space-y-3">
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8e9297]">Example {i + 1}</span>
                                                        <div className={`rounded-xl border p-4 font-mono text-[12px] space-y-2 ${isDark ? 'bg-[#1e1f23]/30 border-[#2d2e32]' : 'bg-slate-50 border-slate-100'}`}>
                                                            <div className="flex gap-4">
                                                                <span className="text-[#8e9297] w-12 shrink-0">Input:</span>
                                                                <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>{ex.input}</span>
                                                            </div>
                                                            <div className="flex gap-4">
                                                                <span className="text-[#8e9297] w-12 shrink-0">Output:</span>
                                                                <span className={isDark ? 'text-indigo-400' : 'text-indigo-600'}>{ex.expected || ex.output}</span>
                                                            </div>
                                                            {ex.explanation && (
                                                                <div className="flex gap-4 border-t border-[#8e9297]/10 pt-2 mt-2 italic">
                                                                    <span className="text-[#8e9297] w-12 shrink-0">Note:</span>
                                                                    <span className="text-[#8e9297]">{ex.explanation}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {currentQuestion.constraints && (
                                            <div className="space-y-3 pt-4">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8e9297]">Constraints</span>
                                                <ul className="space-y-2">
                                                    {currentQuestion.constraints.map((c: string, i: number) => (
                                                        <li key={i} className="flex items-start gap-3 text-[13px]">
                                                            <span className="text-indigo-500 mt-1.5 w-1 h-1 rounded-full bg-indigo-500 shrink-0"></span>
                                                            <span className={isDark ? 'text-[#8e9297]' : 'text-slate-600'}>{c}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* HORIZONTAL DRAG HANDLE (LEFT) */}
                            {showConsole && (
                                <div
                                    onMouseDown={handleLeftHorizontalMouseDown}
                                    className={`h-1 cursor-row-resize z-40 group flex items-center justify-center transition-colors hover:bg-indigo-500/20 ${isDark ? 'bg-[#2d2e32]' : 'bg-slate-100'}`}
                                >
                                    <div className={`h-[1px] w-full ${isDark ? 'bg-[#3f4147]' : 'bg-slate-200'} group-hover:bg-indigo-500/50`} />
                                </div>
                            )}

                            {/* BOTTOM: Console Output */}
                            {showConsole && (
                                <div style={{ height: `${100 - leftPaneHeight}%` }} className={`flex flex-col overflow-hidden ${isDark ? 'bg-[#0f1113]' : 'bg-slate-900'} text-[#8e9297] no-scrollbar border-t ${isDark ? 'border-indigo-500/20' : 'border-indigo-500/10'}`}>
                                    <div className={`p-3 flex items-center justify-between flex-shrink-0 border-b ${isDark ? 'border-[#2d2e32]/30' : 'border-black/10'}`}>
                                        <div className="flex items-center gap-2">
                                            <span className="material-icons-outlined text-[16px]">terminal</span>
                                            <span className="text-[10px] font-black uppercase tracking-[0.15em]">Console output</span>
                                        </div>
                                        <button
                                            onClick={() => setShowConsole(false)}
                                            className="px-2 py-1 rounded hover:bg-white/5 transition-colors text-[9px] font-black uppercase tracking-widest text-[#8e9297] hover:text-white"
                                        >
                                            Close
                                        </button>
                                    </div>
                                    <div className="flex-1 p-4 font-mono text-[11px] overflow-y-auto leading-relaxed no-scrollbar select-text bg-black/10">
                                        {consoleOutput.length === 0 ? (
                                            <div className="flex gap-3">
                                                <span className="text-emerald-500 opacity-60">➜</span>
                                                <span className="text-white/40 italic"># waiting for execution...</span>
                                            </div>
                                        ) : (
                                            consoleOutput.map((line, idx) => (
                                                <div key={idx} className={`mb-1 break-all ${line.startsWith('✓') ? 'text-emerald-400' :
                                                    line.startsWith('✗') ? 'text-rose-400' :
                                                        line.startsWith('>') ? 'text-indigo-400 font-bold border-l-2 border-indigo-500/30 pl-2 ml-[-12px]' :
                                                            'text-slate-300 ml-4'
                                                    }`}>
                                                    {line}
                                                </div>
                                            ))
                                        )}
                                        {Object.values(executingTests).some(v => v) && (
                                            <div className="flex gap-2 items-center text-indigo-400 animate-pulse mt-4 ml-4">
                                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                                                <span className="italic">AI Verification engine running...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="p-4">
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isDark
                                    ? 'bg-[#2b2d31] border-[#3f4147] text-white'
                                    : 'bg-white border-slate-200 text-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                                    }`}>
                                    <span className={`material-icons-outlined text-sm ${isDark ? 'text-white' : 'text-slate-400'}`}>description</span>
                                    <span className="text-[12px] font-bold tracking-tight">Instructions</span>
                                </div>
                            </div>
                            <div className={`flex-1 overflow-y-auto p-12 transition-all duration-300 no-scrollbar ${isTransitioning ? 'opacity-0' : 'opacity-100'}`} style={{
                                transform: isTransitioning
                                    ? `translateX(${transitionDirection === 'next' ? '20px' : '-20px'})`
                                    : 'translateX(0)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}>
                                <div className="max-w-2xl">
                                    <h2 className={`text-lg md:text-xl font-semibold leading-relaxed ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        {currentQuestion.text}
                                    </h2>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* VERTICAL DRAG HANDLE */}
                <div
                    onMouseDown={handleMouseDown}
                    className="absolute top-0 bottom-0 w-1 cursor-col-resize z-50 transition-colors group flex items-center justify-center hover:bg-indigo-500/20"
                    style={{ left: `calc(${leftPaneWidth}% - 1px)` }}
                >
                    <div className={`w-[1px] h-full ${isDark ? 'bg-[#2d2e32]' : 'bg-slate-200'} group-hover:bg-indigo-500/50 transition-colors`} />
                </div>

                {/* RIGHT PANE */}
                <div
                    style={{ width: `${100 - leftPaneWidth}%` }}
                    className={`flex flex-col overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#0d0f11]' : 'bg-[#f8fafc]'}`}
                >
                    {currentQuestion.type === 'code' ? (
                        <CodeQuestion
                            questionId={currentQuestion.id}
                            code={answers[currentQuestion.id] || ""}
                            onCodeChange={(val) => handleAnswer(String(currentQuestion.id), val)}
                            language={selectedLanguage}
                            onLanguageChange={handleLanguageChange}
                            isDark={isDark}
                            testCases={currentQuestion.test_cases}
                            testResults={testResults}
                            executingTests={executingTests}
                            onRunTest={handleRunTest}
                            customInput={customInput}
                            onCustomInputChange={setCustomInput}
                            onRunCustomTest={handleRunCustomTest}
                            executingCustomTest={executingCustomTest}
                            customTestResult={customTestResult}
                            rightPaneHeight={rightPaneHeight}
                            onResizeRightPane={handleRightHorizontalMouseDown}
                            isTransitioning={isTransitioning}
                            transitionDirection={transitionDirection}
                        />
                    ) : (
                        <>
                            <div className="p-4">
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isDark
                                    ? 'bg-[#2b2d31] border-[#3f4147] text-white'
                                    : 'bg-white border-slate-200 text-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                                    }`}>
                                    <span className={`material-icons-outlined text-sm ${isDark ? 'text-white' : 'text-slate-400'}`}>edit_note</span>
                                    <span className="text-[12px] font-bold tracking-tight">Answer</span>
                                </div>
                            </div>

                            <div
                                className={`flex-1 flex flex-col overflow-hidden p-12 transition-all duration-300 no-scrollbar ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
                                style={{
                                    transform: isTransitioning
                                        ? `translateX(${transitionDirection === 'next' ? '20px' : '-20px'})`
                                        : 'translateX(0)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                <div className="w-full flex-1 flex flex-col">
                                    {currentQuestion.type === 'mcq' && currentQuestion.options ? (
                                        <McqQuestion
                                            questionId={currentQuestion.id}
                                            options={currentQuestion.options}
                                            selectedOption={answers[currentQuestion.id]}
                                            onAnswer={(val) => handleAnswer(String(currentQuestion.id), val)}
                                            isDark={isDark}
                                        />
                                    ) : (
                                        <TextQuestion
                                            value={answers[currentQuestion.id] || ""}
                                            onAnswer={(val) => handleAnswer(String(currentQuestion.id), val)}
                                            isDark={isDark}
                                        />
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* 3. FOOTER */}
            <footer className={`border-t h-16 flex items-center px-6 z-50 transition-colors duration-300 ${isDark ? 'bg-[#111214] border-[#2d2e32]' : 'bg-white border-slate-200/50 shadow-[0_-8px_20px_rgba(0,0,0,0.01)]'}`}>
                <div className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* Branding removed as requested */}
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handlePrev}
                            disabled={currentQuestionIndex === 0 && currentRoundIndex === 0}
                            className={`px-5 h-10 rounded-xl text-[12px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isDark ? 'text-[#8e9297] hover:text-white hover:bg-[#2b2d31]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            Previous
                        </button>

                        {currentQuestion.type === 'code' && (
                            <button
                                onClick={handleRunAllTests}
                                disabled={Object.keys(executingTests).some(k => executingTests[k])}
                                className={`px-6 h-10 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 ${Object.keys(executingTests).some(k => executingTests[k])
                                    ? 'bg-slate-400 cursor-not-allowed opacity-50'
                                    : isDark
                                        ? 'bg-[#00c853] text-[#0d0f11] hover:bg-[#00e676] shadow-emerald-500/20'
                                        : 'bg-[#00e676] text-black hover:bg-[#00c853] shadow-emerald-500/20 font-black'
                                    }`}
                            >
                                {Object.keys(executingTests).some(k => executingTests[k]) ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <span className="material-icons-outlined text-[18px]">play_arrow</span>
                                )}
                                Run all tests
                            </button>
                        )}

                        <button
                            onClick={handleNext}
                            disabled={!answers[currentQuestion.id] || submitting}
                            className={`px-8 h-10 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all shadow-sm ${!answers[currentQuestion.id] || submitting
                                ? isDark ? 'bg-[#2b2d31] text-[#4f5053] cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/25 active:scale-95'
                                }`}
                        >
                            {isLastQuestion && isLastRound
                                ? (submitting ? "Processing..." : "Submit")
                                : isLastQuestion
                                    ? "Next Round"
                                    : "Next"
                            }
                            {!(isLastQuestion && isLastRound) && <span className="material-icons-outlined text-[18px]">chevron_right</span>}
                        </button>
                    </div>
                </div>
            </footer>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
