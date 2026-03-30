"use client";

import { useEffect, useState, use, useRef } from "react";
import { apiClient } from "@/utils/api";
import { useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import EmbeddedInterviewWrapper from "@/components/interview/EmbeddedInterviewWrapper";
import McqQuestion from "@/components/assessment/McqQuestion";
import TextQuestion from "@/components/assessment/TextQuestion";
import CodeQuestion from "@/components/assessment/CodeQuestion";
import { LANGUAGE_CONFIG } from "@/utils/languages";
import { motion, AnimatePresence } from "framer-motion";

// Simple Markdown Renderer component to handle code instructions
const MarkdownContent = ({ content, isDark }: { content: string, isDark: boolean }) => {
    if (!content) return null;

    // Split by lines and process
    const lines = content.split('\n');

    return (
        <div className="space-y-4">
            {lines.map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={idx} className="h-2" />;

                // Headers
                if (trimmed.startsWith('####')) {
                    return <h4 key={idx} className={`text-[11px] font-black uppercase tracking-[0.15em] mt-6 mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{trimmed.replace(/^####\s*/, '')}</h4>;
                }
                if (trimmed.startsWith('###')) {
                    return <h3 key={idx} className={`text-[13px] font-black uppercase tracking-[0.2em] mt-8 mb-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{trimmed.replace(/^###\s*/, '')}</h3>;
                }
                if (trimmed.startsWith('##')) {
                    return <h2 key={idx} className={`text-[18px] font-bold tracking-tight mt-6 mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{trimmed.replace(/^##\s*/, '')}</h2>;
                }
                if (trimmed.startsWith('#')) {
                    return <h1 key={idx} className={`text-[24px] font-black tracking-tighter mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>{trimmed.replace(/^#\s*/, '')}</h1>;
                }

                // Lists
                if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
                    return (
                        <div key={idx} className="flex items-start gap-3 pl-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-[14px] leading-relaxed`}>
                                {processBold(trimmed.replace(/^[-*]\s*/, ''))}
                            </p>
                        </div>
                    );
                }

                // Regular Paragraph
                return (
                    <p key={idx} className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-[14px] leading-relaxed`}>
                        {processBold(trimmed)}
                    </p>
                );
            })}
        </div>
    );

    function processBold(text: string) {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className={isDark ? 'text-white' : 'text-slate-900'}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    }
};

interface Question {
    id: number;
    type: string;
    topic: string;
    difficulty?: string;
    title?: string;
    content: {
        question: string;
        options?: { [key: string]: string };
        initial_code?: { [key: string]: string };
        difficulty?: string; // Legacy fallback
        examples?: { input: string; output: string; explanation?: string }[];
        test_cases?: { input: string; output: string }[];
    };
}

interface Section {
    id: number;
    title: string;
    type?: string;
    questions: Question[];
}

interface AssessmentDetail {
    id: number;
    title: string;
    time_limit_minutes: number;
    sections: Section[];
    end_at: string | null;
    is_ai_generated: boolean;
    is_completed?: boolean;
    last_attempt_id?: number;
    interview_id?: number;
}

export default function AssessmentExamPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const { id } = unwrappedParams;
    const router = useRouter();

    const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    const [activeSectionIndex, setActiveSectionIndex] = useState(0);
    const [activeCodingQuestionIndex, setActiveCodingQuestionIndex] = useState(0);
    const [activeLanguage, setActiveLanguage] = useState("python");
    const [executionResult, setExecutionResult] = useState<any>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<{ [key: number]: string }>({});
    const answersRef = useRef<{ [key: number]: string }>({}); // Ref to track answers without re-triggering effects

    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [scoreData, setScoreData] = useState<any>(null);
    const [isUnderway, setIsUnderway] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDeadlineApproaching, setIsDeadlineApproaching] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showInterview, setShowInterview] = useState(false);

    // Layout & Theme State (to match Job Simulation)
    const [theme, setTheme] = useState<'dark' | 'light'>('light');
    const [leftPaneWidth, setLeftPaneWidth] = useState(45);
    const [leftPaneHeight, setLeftPaneHeight] = useState(70);
    const [rightPaneHeight, setRightPaneHeight] = useState(60);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionDirection, setTransitionDirection] = useState<'next' | 'prev'>('next');
    const [showConsole, setShowConsole] = useState(true);

    // Code Execution State
    const [testResults, setTestResults] = useState<{ [key: string]: any }>({});
    const [executingTests, setExecutingTests] = useState<{ [key: string]: boolean }>({});
    const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
    const [customInput, setCustomInput] = useState("");
    const [customTestResult, setCustomTestResult] = useState<any>(null);
    const [executingCustomTest, setExecutingCustomTest] = useState(false);

    const isDark = theme === 'dark';

    // Violation lock to prevent loops
    const violationDetectedRef = useRef(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Refs for reliable state access in event listeners
    const isSubmittingRef = useRef(false);
    const isSubmittedRef = useRef(false);

    useEffect(() => {
        fetchAssessment();
    }, []); // Only fetch once on mount

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isUnderway && !isSubmittedRef.current && !violationDetectedRef.current) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        const handleViolation = (reason: string) => {
            if (violationDetectedRef.current || isSubmittedRef.current || isSubmittingRef.current) return;

            violationDetectedRef.current = true;
            // Immediate alert to block user action
            alert(reason);
            // Then submit
            submitAssessment();
        };

        const handleVisibilityChange = () => {
            if (document.hidden && isUnderway && !isSubmittedRef.current) {
                handleViolation("Assessment Violation: Moving away from the active window is not allowed.");
            }
        };

        const handleBlur = () => {
            if (isUnderway && !isSubmittedRef.current) {
                handleViolation("Assessment Violation: Window lost focus (Alt-Tab/App Switch). Assessment terminated.");
            }
        };

        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
            // Check refs to avoid stale closures triggering false violations
            if (isUnderway && !document.fullscreenElement && !isSubmittedRef.current && !isSubmittingRef.current && !assessment?.is_ai_generated) {
                handleViolation("Assessment Violation: Exiting fullscreen mode is not allowed.");
            }
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        const handleCopyPaste = (e: ClipboardEvent) => {
            e.preventDefault();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        if (!assessment?.is_ai_generated) {
            document.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('blur', handleBlur);
            document.addEventListener('fullscreenchange', handleFullscreenChange);
        }
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('copy', handleCopyPaste);
        document.addEventListener('cut', handleCopyPaste);
        document.addEventListener('paste', handleCopyPaste);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('copy', handleCopyPaste);
            document.removeEventListener('cut', handleCopyPaste);
            document.removeEventListener('paste', handleCopyPaste);
        };
    }, [isUnderway, isSubmitted, assessment?.is_ai_generated]); // kept dependencies minimum

    // Dedicated Timer Effect
    useEffect(() => {
        if (isUnderway && !isSubmitted && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        submitAssessment();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [isUnderway, isSubmitted]);

    const fetchAssessment = async () => {
        try {
            // const token = Cookies.get("auth_");
            const res = await apiClient.get(`/api/v1/assessments/${id}`);
            if (res.ok) {
                const data = await res.json();

                // If already completed, redirect to results
                if (data.is_completed && data.last_attempt_id) {
                    router.replace(`/practice/assessments/results/${data.last_attempt_id}${data.is_ai_generated ? '?from=ai' : ''}`);
                    return;
                }

                setAssessment(data);

                // Flatten questions from all sections
                const questions: Question[] = [];
                if (data.sections && data.sections.length > 0) {
                    data.sections.forEach((section: Section) => {
                        if (section.questions) {
                            questions.push(...section.questions);
                        }
                    });
                }
                setAllQuestions(questions);

                // Initialize answers with initial code for each question
                const initialAnswers: { [key: number]: string } = {};
                questions.forEach((q: Question) => {
                    if (q.content.initial_code && (q.type?.toLowerCase() === 'code' || q.type?.toLowerCase() === 'coding')) {
                        // Use activeLanguage or default to python
                        const defaultCode = q.content.initial_code[activeLanguage] || Object.values(q.content.initial_code)[0];
                        initialAnswers[q.id] = defaultCode;
                    }
                });
                setAnswers(prev => ({ ...initialAnswers, ...prev }));
                answersRef.current = { ...initialAnswers, ...answersRef.current };

                // Calculate time left: min(duration, time until end_at)
                const durationSeconds = data.time_limit_minutes * 60;
                let timeUntilDeadline = durationSeconds;

                if (data.end_at) {
                    const now = new Date().getTime();
                    const deadline = new Date(data.end_at).getTime();
                    const remainingWindow = Math.floor((deadline - now) / 1000);
                    timeUntilDeadline = Math.min(durationSeconds, remainingWindow);

                    if (remainingWindow < durationSeconds) {
                        setIsDeadlineApproaching(true);
                    }
                }

                setTimeLeft(Math.max(0, timeUntilDeadline));

                if (timeUntilDeadline <= 0) {
                    alert("This assessment protocol has already expired.");
                    if (data.is_ai_generated) {
                        router.push('/practice/ai-practice');
                    } else {
                        router.push('/practice/assessments');
                    }
                }
            } else {
                alert("Failed to load assessment");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const startAssessment = () => {
        if (containerRef.current && !assessment?.is_ai_generated) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error("Fullscreen request failed", err);
            });
        }
        setIsUnderway(true);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleRunTest = async (question: Question, testIndex: number) => {
        const code = answers[question.id] || question.content.initial_code?.[activeLanguage] || "";
        const testCase = question.content.test_cases?.[testIndex];

        if (!code || !testCase) return;

        const testId = `${question.id}_${testIndex}`;
        setExecutingTests(prev => ({ ...prev, [testId]: true }));
        setTestResults(prev => ({ ...prev, [testId]: { status: 'running' } }));
        setShowConsole(true);
        setConsoleOutput(prev => [...prev, `> Running test case ${testIndex + 1}...`]);

        try {
            const res = await apiClient.post(`/api/v1/assessments/ai/verify-code`, {
                code,
                language: activeLanguage,
                problem_statement: question.content.question,
                test_cases: [testCase]
            });

            if (res.ok) {
                const data = await res.json();
                const result = data.test_cases?.[0];

                if (!result) {
                    setConsoleOutput(prev => [...prev, `✗ Execution Error: No test verification results received.`, data.output ? `  Output: ${data.output}` : ''].filter(Boolean));
                    setTestResults(prev => ({ ...prev, [testId]: { passed: false, message: "No verification results" } }));
                    return;
                }

                setTestResults(prev => ({ ...prev, [testId]: result }));
                setConsoleOutput(prev => [
                    ...prev,
                    result.passed ? `✓ Test case ${testIndex + 1} passed!` : `✗ Test case ${testIndex + 1} failed.`,
                    `  Input: ${result.input}`,
                    `  Expected: ${result.output}`,
                    `  Actual: ${result.actual}`,
                    data.output ? `  Output: ${data.output}` : ''
                ].filter(Boolean));
            } else {
                setConsoleOutput(prev => [...prev, `✗ Execution Error: Failed to contact verification engine.`]);
            }
        } catch (e) {
            console.error(e);
            setConsoleOutput(prev => [...prev, `✗ Connection Error: Failed to execute code.`]);
            setTestResults(prev => ({ ...prev, [testId]: { status: 'error' } }));
        } finally {
            setExecutingTests(prev => ({ ...prev, [testId]: false }));
        }
    };

    const handleRunAllTests = async (question: Question) => {
        const testCases = question.content.test_cases || [];
        setConsoleOutput([]); // Clear console
        for (let i = 0; i < testCases.length; i++) {
            await handleRunTest(question, i);
        }
    };

    const handleRunCustomTest = async (question: Question) => {
        const code = answers[question.id] || question.content.initial_code?.[activeLanguage] || "";
        if (!code || !customInput.trim()) return;

        setExecutingCustomTest(true);
        setCustomTestResult({ status: 'running' });
        setShowConsole(true);
        setConsoleOutput(prev => [...prev, `> Running custom test case...`, `  Input: ${customInput}`]);

        try {
            const res = await apiClient.post(`/api/v1/assessments/ai/verify-code`, {
                code,
                language: activeLanguage,
                problem_statement: question.content.question,
                test_cases: [{ input: customInput, expected: "" }]
            });

            if (res.ok) {
                const data = await res.json();
                const result = data.test_cases?.[0];

                if (!result) {
                    setConsoleOutput(prev => [...prev, `✗ Execution Error: No custom test output received.`, data.output ? `  Output: ${data.output}` : ''].filter(Boolean));
                    setCustomTestResult({ status: 'error', message: "No execution output" });
                    return;
                }

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
            setConsoleOutput(prev => [...prev, `✗ Connection Error: Failed to execute custom test.`]);
        } finally {
            setExecutingCustomTest(false);
        }
    };

    const handleRunCode = async (question: Question) => {
        await handleRunAllTests(question);
    };

    const handleOptionSelect = (questionId: number, option: string) => {
        if (isSubmitted) return;

        // Update both state (for UI) and Ref (for reliable submission)
        const newAnswers = { ...answers, [questionId]: option };
        setAnswers(newAnswers);
        answersRef.current = newAnswers;
    };

    const handleNextSection = () => {
        if (assessment && activeSectionIndex < assessment.sections.length - 1) {
            setTransitionDirection('next');
            setIsTransitioning(true);
            setTimeout(() => {
                setActiveSectionIndex(prev => prev + 1);
                setActiveCodingQuestionIndex(0);
                setIsTransitioning(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 300);
        }
    };

    const handleNextQuestion = () => {
        const currentSection = assessment?.sections[activeSectionIndex];
        if (!currentSection) return;

        setTransitionDirection('next');
        setIsTransitioning(true);
        setTimeout(() => {
            if (activeCodingQuestionIndex < currentSection.questions.length - 1) {
                setActiveCodingQuestionIndex(prev => prev + 1);
            } else {
                handleNextSection();
            }
            setIsTransitioning(false);
        }, 300);
    };

    const handlePrevQuestion = () => {
        setTransitionDirection('prev');
        setIsTransitioning(true);
        setTimeout(() => {
            if (activeCodingQuestionIndex > 0) {
                setActiveCodingQuestionIndex(prev => prev - 1);
            } else if (activeSectionIndex > 0) {
                const prevSectionIndex = activeSectionIndex - 1;
                const prevSection = assessment?.sections[prevSectionIndex];
                setActiveSectionIndex(prevSectionIndex);
                setActiveCodingQuestionIndex((prevSection?.questions.length || 1) - 1);
            }
            setIsTransitioning(false);
        }, 300);
    };

    // Resize Handlers
    const handleVerticalMouseDown = (e: React.MouseEvent) => {
        const startX = e.clientX;
        const startWidth = leftPaneWidth;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const newWidth = startWidth + (deltaX / (containerRef.current?.offsetWidth || 1)) * 100;
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
            const newHeight = startHeight + (deltaY / (containerRef.current?.offsetHeight || 1)) * 100;
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
            const newHeight = startHeight + (deltaY / (containerRef.current?.offsetHeight || 1)) * 100;
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

    const submitAssessment = async () => {
        if (isSubmittedRef.current || isSubmittingRef.current) return;

        isSubmittingRef.current = true;
        setIsSubmitting(true);

        if (timerRef.current) clearInterval(timerRef.current);

        try {
            // Use answersRef.current to get the latest answers even inside event listeners
            const currentAnswers = answersRef.current;

            // const token = Cookies.get("auth_");
            const res = await apiClient.post(`/api/v1/assessments/${id}/submit`, { answers: currentAnswers });

            if (res.ok) {
                const data = await res.json();

                // --- SEAMLESS TRANSITION LOGIC ---
                // If there is a linked interview, transition immediately instead of showing results
                // If there is a linked interview, transition immediately instead of showing results
                if (assessment?.interview_id) {
                    setShowInterview(true);
                    return;
                }

                setScoreData(data);

                isSubmittedRef.current = true;
                setIsSubmitted(true);

                if (document.fullscreenElement) {
                    await document.exitFullscreen().catch(err => console.error(err));
                }
            } else {
                // Only show error if it wasn't a forced violation submission
                if (!violationDetectedRef.current) {
                    alert("Failed to submit assessment.");
                }
                isSubmittingRef.current = false;
                setIsSubmitting(false);
            }
        } catch (e) {
            console.error(e);
            isSubmittingRef.current = false;
            setIsSubmitting(false);
        }
    };

    const currentSection = assessment?.sections[activeSectionIndex];
    const currentQuestion = currentSection?.questions[activeCodingQuestionIndex];

    // Auto-show console for coding questions
    useEffect(() => {
        if (currentQuestion && (currentQuestion.type?.toLowerCase() === 'code' || currentQuestion.type?.toLowerCase() === 'coding')) {
            setShowConsole(true);
        }
    }, [currentQuestion?.id]);

    if (loading) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-slate-700 border-t-slate-500 rounded-full animate-spin mb-4"></div>
                <p className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">Synchronizing_Telemetry</p>
            </div>
        </div>
    );

    if (showInterview && assessment?.interview_id) {
        return (
            <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900">
                <EmbeddedInterviewWrapper
                    interviewId={assessment.interview_id}
                    onComplete={() => {
                        // When interview is done, go to results
                        router.push(`/practice/assessments/results/${scoreData?.id || assessment.last_attempt_id}?from=ai`);
                    }}
                />
            </div>
        );
    }

    if (!assessment) return <div>Assessment not found.</div>;

    // Intro Screen
    if (!isUnderway && !isSubmitted) {
        return (
            <div ref={containerRef} className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
                <div className="max-w-xl w-full bg-slate-800 border bg-slate-800 border-slate-700 rounded-[2rem] p-12 text-center space-y-8 shadow-2xl z-10">
                    <div className="flex flex-col items-center">
                        <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-6 border shadow-inner ${assessment.is_ai_generated ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : 'bg-slate-700 text-red-500 border-slate-600'}`}>
                            <span className="material-icons-outlined text-5xl">{assessment.is_ai_generated ? 'psychology' : 'gpp_good'}</span>
                        </div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
                            {assessment.is_ai_generated ? 'Adaptive Neural Protocol' : 'Secure Protocol Required'}
                        </h1>
                        <p className="text-sm text-slate-300 font-medium tracking-wide mt-2 max-w-md mx-auto leading-relaxed">
                            {assessment.is_ai_generated
                                ? 'Initializing autonomous evaluation environment. Calibrate your performance markers.'
                                : <>Strict anti-malpractice measures are active. Violation of these protocols will result in <span className="text-red-400 font-bold underline decoration-red-400/30 decoration-2 underline-offset-2">immediate termination</span> of the assessment.</>
                            }
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-left">
                        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-start gap-4 hover:border-slate-700 transition-colors">
                            <span className={`material-icons-outlined text-xl mt-0.5 ${assessment.is_ai_generated ? 'text-indigo-400' : 'text-red-400'}`}>{assessment.is_ai_generated ? 'view_quilt' : 'fullscreen'}</span>
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                    {assessment.is_ai_generated ? 'Protocol Focus' : 'Force Fullscreen'}
                                </span>
                                <span className="text-xs font-bold text-white leading-snug block">
                                    {assessment.is_ai_generated ? 'Optimized for focused execution.' : 'Exiting fullscreen triggers auto-submit.'}
                                </span>
                            </div>
                        </div>
                        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-start gap-4 hover:border-slate-700 transition-colors">
                            <span className={`material-icons-outlined text-xl mt-0.5 ${assessment.is_ai_generated ? 'text-indigo-400' : 'text-red-400'}`}>{assessment.is_ai_generated ? 'swap_horiz' : 'visibility_off'}</span>
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                    {assessment.is_ai_generated ? 'Multi-Tasking OK' : 'No Tab Switching'}
                                </span>
                                <span className="text-xs font-bold text-white leading-snug block">
                                    {assessment.is_ai_generated ? 'Switching context is allowed.' : 'Switching tabs triggers auto-submit.'}
                                </span>
                            </div>
                        </div>
                        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-start gap-4 hover:border-slate-700 transition-colors">
                            <span className={`material-icons-outlined text-xl mt-0.5 ${assessment.is_ai_generated ? 'text-indigo-400' : 'text-red-400'}`}>block</span>
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Right Click Disabled</span>
                                <span className="text-xs font-bold text-white leading-snug block">Context menu is blocked.</span>
                            </div>
                        </div>
                        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-start gap-4 hover:border-slate-700 transition-colors">
                            <span className={`material-icons-outlined text-xl mt-0.5 ${assessment.is_ai_generated ? 'text-indigo-400' : 'text-red-400'}`}>content_paste_off</span>
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">No Copy/Paste</span>
                                <span className="text-xs font-bold text-white leading-snug block">Clipboard actions are disabled.</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Duration</span>
                            <span className="text-2xl font-black text-white">{assessment.time_limit_minutes}m</span>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Questions</span>
                            <span className="text-2xl font-black text-white">{allQuestions.length}</span>
                        </div>
                    </div>

                    <button
                        onClick={startAssessment}
                        className={`w-full text-white font-black text-[12px] tracking-[0.2em] uppercase py-5 rounded-2xl transition-all shadow-lg active:scale-95 hover:scale-[1.02] border ${assessment.is_ai_generated ? 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500/50' : 'bg-red-600 hover:bg-red-500 border-red-500/50'}`}
                    >
                        {assessment.is_ai_generated ? 'Initialize Neural Link' : 'Initiate Secure Protocol'}
                    </button>

                    <button
                        onClick={() => {
                            if (assessment.is_ai_generated) {
                                router.push('/practice/ai-practice');
                            } else {
                                router.push('/practice/assessments');
                            }
                        }}
                        className="text-[10px] font-black text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors py-2"
                    >
                        Abort Mission
                    </button>
                </div>
            </div>
        );
    }


    if (isSubmitted && scoreData) {
        const percent = Math.round((scoreData.score / scoreData.total_questions) * 100);
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="max-w-xl w-full bg-white border border-slate-100 rounded-[3rem] p-12 text-center shadow-2xl">
                    <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-8 ${percent >= 70 ? 'bg-slate-100 text-slate-600' : 'bg-slate-900 text-slate-200'}`}>
                        <span className="material-icons-outlined text-5xl">{percent >= 70 ? 'verified' : 'analytics'}</span>
                    </div>

                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Protocol_Terminated</h1>
                    <p className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase mb-10">Telemetry Summary Synchronized</p>

                    <div className="grid grid-cols-2 gap-6 mb-12">
                        <div className="bg-slate-50 p-6 rounded-3xl">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Final_Agility_Score</span>
                            <span className={`text-4xl font-black ${percent >= 70 ? 'text-slate-900' : 'text-slate-900'}`}>{percent}%</span>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-3xl">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Questions_Processed</span>
                            <span className="text-4xl font-black text-slate-900">{scoreData.score}/{scoreData.total_questions}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => router.push(`/practice/assessments/results/${scoreData.id}${assessment?.is_ai_generated ? '?from=ai' : ''}`)}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] tracking-[0.2em] uppercase py-4 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                        >
                            View Detailed Analysis
                            <span className="material-icons-outlined text-lg">assessment</span>
                        </button>

                        <button
                            onClick={() => {
                                if (assessment.is_ai_generated) {
                                    router.push("/practice/ai-practice");
                                } else {
                                    router.push("/practice/assessments");
                                }
                            }}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] tracking-[0.2em] uppercase py-4 rounded-2xl transition-all shadow-xl active:scale-95"
                        >
                            Return to Command Center
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentQuestion) return null;

    const totalRounds = assessment.sections.length;
    const isLastQuestionInRound = activeCodingQuestionIndex === currentSection.questions.length - 1;
    const isLastRound = activeSectionIndex === totalRounds - 1;

    return (
        <div ref={containerRef} className={`h-screen overflow-hidden flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-[#111214] text-[#8e9297]' : 'bg-[#fcfcfd] text-slate-600'}`}>

            {/* 1. HEADER */}
            <header className={`border-b h-14 flex items-center justify-between px-6 z-40 transition-colors duration-300 ${isDark ? 'bg-[#111214] border-[#2d2e32]' : 'bg-white border-slate-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'}`}>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            if (assessment.is_ai_generated) {
                                router.push('/practice/ai-practice');
                            } else {
                                router.push('/practice/assessments');
                            }
                        }}
                        className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${isDark ? 'hover:bg-[#2d2e31] text-[#8e9297]' : 'hover:bg-slate-100 text-slate-400'}`}
                    >
                        <span className="material-icons-outlined text-sm">arrow_back</span>
                    </button>
                    <div className={`w-px h-4 ${isDark ? 'bg-[#2d2e32]' : 'bg-slate-200/80'}`} />
                    <span className={`text-[13px] font-bold tracking-tight ${isDark ? 'text-[#e1e1e1]' : 'text-slate-900'}`}>
                        Round {activeSectionIndex + 1} / {totalRounds}
                    </span>
                    <div className={`w-px h-4 ${isDark ? 'bg-[#2d2e32]' : 'bg-slate-200/80'}`} />
                    <span className={`text-[13px] font-bold tracking-tight ${isDark ? 'text-[#e1e1e1]' : 'text-slate-900'}`}>
                        Question {activeCodingQuestionIndex + 1} / {currentSection.questions.length} — {currentSection.title}
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center">
                        <span className={`text-[9px] font-black tracking-widest uppercase mb-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {isDeadlineApproaching ? "PROTOCOL_DEADLINE" : "TIME_REMAINING"}
                        </span>
                        <div className={`text-lg font-black font-mono tracking-tighter ${timeLeft < 60 ? 'text-red-500 animate-pulse' : isDark ? 'text-white' : 'text-slate-900'}`}>
                            {formatTime(timeLeft)}
                        </div>
                    </div>

                    <div className={`w-px h-8 ${isDark ? 'bg-[#2d2e32]' : 'bg-slate-200/80'}`} />

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
                </div>
            </header>

            {/* 2. MAIN AREA WITH RESIZABLE SPLIT PANE */}
            <main className="flex-1 flex overflow-hidden relative">
                {/* LEFT PANE: Instructions */}
                <div
                    style={{ width: `${leftPaneWidth}%` }}
                    className={`flex flex-col border-r transition-colors duration-300 ${isDark ? 'border-[#2d2e32] bg-[#111214]' : 'border-slate-200 bg-white'}`}
                >
                    <div className="p-4 shrink-0">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isDark
                            ? 'bg-[#2b2d31] border-[#3f4147] text-white'
                            : 'bg-white border-slate-200 text-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                            }`}>
                            <span className={`material-icons-outlined text-sm ${isDark ? 'text-white' : 'text-slate-400'}`}>description</span>
                            <span className="text-[12px] font-bold tracking-tight">Instructions</span>
                        </div>
                    </div>

                    <div style={{ height: ((currentQuestion.type?.toLowerCase() === 'code' || currentQuestion.type?.toLowerCase() === 'coding') && showConsole) ? `${leftPaneHeight}%` : '100%' }} className="flex flex-col overflow-hidden">
                        <div className={`flex-1 overflow-y-auto p-12 transition-all duration-300 no-scrollbar ${isTransitioning ? 'opacity-0' : 'opacity-100'}`} style={{
                            transform: isTransitioning
                                ? `translateX(${transitionDirection === 'next' ? '20px' : '-20px'})`
                                : 'translateX(0)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}>
                            <div className="max-w-2xl space-y-8">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border
                                        ${currentQuestion.difficulty === 'HARD' ? 'text-rose-500 border-rose-500/20 bg-rose-50' :
                                            currentQuestion.difficulty === 'MEDIUM' ? 'text-amber-500 border-amber-500/20 bg-amber-50' :
                                                'text-emerald-500 border-emerald-500/20 bg-emerald-50'}`}>
                                        {currentQuestion.difficulty || 'MEDIUM'}
                                    </span>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{currentQuestion.topic}</span>
                                </div>

                                {/* Markdown Rendering for Instructions */}
                                <MarkdownContent content={currentQuestion.content.question} isDark={isDark} />

                                {currentQuestion.content.examples && currentQuestion.content.examples.length > 0 && (
                                    <div className="space-y-6 pt-4">
                                        {currentQuestion.content.examples.map((ex, i) => (
                                            <div key={i} className="space-y-3">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8e9297]">Example {i + 1}</span>
                                                <div className={`rounded-xl border p-4 font-mono text-[12px] space-y-2 ${isDark ? 'bg-[#1e1f23]/30 border-[#2d2e32]' : 'bg-slate-50 border-slate-100'}`}>
                                                    <div className="flex gap-4">
                                                        <span className="text-[#8e9297] w-12 shrink-0 font-bold uppercase tracking-widest text-[9px]">Input:</span>
                                                        <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>{ex.input}</span>
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <span className="text-[#8e9297] w-12 shrink-0 font-bold uppercase tracking-widest text-[9px]">Output:</span>
                                                        <span className={isDark ? 'text-indigo-400' : 'text-indigo-600'}>{ex.output}</span>
                                                    </div>
                                                    {ex.explanation && (
                                                        <div className="flex gap-4 border-t border-slate-200/50 dark:border-slate-800 pt-2 mt-2 italic text-[11px]">
                                                            <span className="text-slate-400">Note:</span>
                                                            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{ex.explanation}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Console for Coding Questions (Left Column Bottom) */}
                    {(currentQuestion.type?.toLowerCase() === 'code' || currentQuestion.type?.toLowerCase() === 'coding') && showConsole && (
                        <>
                            <div
                                onMouseDown={handleLeftHorizontalMouseDown}
                                className={`h-1 cursor-row-resize z-40 group flex items-center justify-center transition-colors hover:bg-indigo-500/20 ${isDark ? 'bg-[#2d2e32]' : 'bg-slate-100'}`}
                            >
                                <div className={`h-[1px] w-full ${isDark ? 'bg-[#3f4147]' : 'bg-slate-200'} group-hover:bg-indigo-500/50`} />
                            </div>
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
                                        <div className="flex gap-3 text-white/40 italic">
                                            <span className="text-emerald-500 opacity-60">➜</span>
                                            <span># waiting for code execution...</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {consoleOutput.map((line, idx) => (
                                                <div key={idx} className={`mb-1 break-all flex items-start gap-2 ${line.startsWith('✓') ? 'text-emerald-400 font-bold' :
                                                    line.startsWith('✗') ? 'text-rose-400 font-bold' :
                                                        line.startsWith('>') ? 'text-indigo-400 font-bold border-l-2 border-indigo-500/30 pl-2 ml-[-12px] bg-indigo-500/5' :
                                                            'text-slate-400 ml-4 font-medium'
                                                    }`}>
                                                    {line.startsWith('✓') && <span className="material-icons-outlined text-[14px]">check_circle</span>}
                                                    {line.startsWith('✗') && <span className="material-icons-outlined text-[14px]">cancel</span>}
                                                    <span>{line.startsWith('✓') || line.startsWith('✗') ? line.slice(2) : line}</span>
                                                </div>
                                            ))}
                                            {Object.values(executingTests).some(v => v) && (
                                                <div className="flex gap-2 items-center text-indigo-400 animate-pulse mt-4 ml-4">
                                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                                                    <span className="italic uppercase tracking-widest text-[9px] font-black">AI Verification engine running...</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* VERTICAL DRAG HANDLE */}
                <div
                    onMouseDown={handleVerticalMouseDown}
                    className="absolute top-0 bottom-0 w-1 cursor-col-resize z-50 transition-colors group flex items-center justify-center hover:bg-indigo-500/20"
                    style={{ left: `calc(${leftPaneWidth}% - 1px)` }}
                >
                    <div className={`w-[1px] h-full ${isDark ? 'bg-[#2d2e32]' : 'bg-slate-200'} group-hover:bg-indigo-500/50 transition-colors`} />
                </div>

                {/* RIGHT PANE: Question Area */}
                <div
                    style={{ width: `${100 - leftPaneWidth}%` }}
                    className={`flex flex-col overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#0d0f11]' : 'bg-[#f8fafc]'}`}
                >
                    <div className="p-4 shrink-0">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isDark
                            ? 'bg-[#2b2d31] border-[#3f4147] text-white'
                            : 'bg-white border-slate-200 text-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                            }`}>
                            <span className={`material-icons-outlined text-sm ${isDark ? 'text-white' : 'text-slate-400'}`}>
                                {(currentQuestion.type?.toLowerCase() === 'code' || currentQuestion.type?.toLowerCase() === 'coding') ? 'code' :
                                    (currentQuestion.type?.toLowerCase() === 'mcq' || currentQuestion.type?.toLowerCase() === 'aptitude') ? 'quiz' : 'edit_note'}
                            </span>
                            <span className="text-[12px] font-bold tracking-tight">
                                {(currentQuestion.type?.toLowerCase() === 'code' || currentQuestion.type?.toLowerCase() === 'coding') ? 'Code Editor' :
                                    (currentQuestion.type?.toLowerCase() === 'mcq' || currentQuestion.type?.toLowerCase() === 'aptitude') ? 'Select Answer' : 'Answer Response'}
                            </span>
                        </div>
                    </div>

                    <div className={`flex-1 overflow-hidden transition-all duration-300 no-scrollbar ${isTransitioning ? 'opacity-0' : 'opacity-100'}`} style={{
                        transform: isTransitioning
                            ? `translateX(${transitionDirection === 'next' ? '20px' : '-20px'})`
                            : 'translateX(0)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}>
                        {(currentQuestion.type?.toLowerCase() === 'code' || currentQuestion.type?.toLowerCase() === 'coding') ? (
                            <CodeQuestion
                                questionId={currentQuestion.id}
                                code={answers[currentQuestion.id] || currentQuestion.content.initial_code?.[activeLanguage] || ""}
                                onCodeChange={(val) => handleOptionSelect(currentQuestion.id, val)}
                                language={activeLanguage}
                                onLanguageChange={setActiveLanguage}
                                isDark={isDark}
                                testCases={currentQuestion.content.test_cases}
                                testResults={testResults}
                                executingTests={executingTests}
                                onRunTest={(idx) => handleRunTest(currentQuestion, idx)}
                                customInput={customInput}
                                onCustomInputChange={setCustomInput}
                                onRunCustomTest={() => handleRunCustomTest(currentQuestion)}
                                executingCustomTest={executingCustomTest}
                                customTestResult={customTestResult}
                                isTransitioning={isTransitioning}
                                rightPaneHeight={rightPaneHeight}
                                onResizeRightPane={handleRightHorizontalMouseDown}
                                consoleOutput={consoleOutput}
                            />
                        ) : (currentQuestion.type?.toLowerCase() === 'mcq' || currentQuestion.type?.toLowerCase() === 'aptitude') ? (
                            <div className="p-6 md:p-10 w-full overflow-y-auto h-full flex flex-col items-center justify-center">
                                <McqQuestion
                                    questionId={currentQuestion.id}
                                    options={Object.values(currentQuestion.content.options || {})}
                                    selectedOption={answers[currentQuestion.id]}
                                    onAnswer={(val) => handleOptionSelect(currentQuestion.id, val)}
                                    isDark={isDark}
                                />
                            </div>
                        ) : (
                            <div className="h-full flex flex-col p-6 md:p-10 w-full">
                                <TextQuestion
                                    value={answers[currentQuestion.id] || ""}
                                    onAnswer={(val) => handleOptionSelect(currentQuestion.id, val)}
                                    isDark={isDark}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* 3. FOOTER */}
            <footer className={`border-t h-16 flex items-center px-6 z-50 transition-colors duration-300 ${isDark ? 'bg-[#111214] border-[#2d2e32]' : 'bg-white border-slate-200/50 shadow-[0_-8px_20px_rgba(0,0,0,0.01)]'}`}>
                <div className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* Progress Indicator */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-slate-50/50 border-slate-200/50">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Section Progress</span>
                            <span className="text-[12px] font-bold text-slate-900">{activeCodingQuestionIndex + 1} / {currentSection.questions.length}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handlePrevQuestion}
                            disabled={activeCodingQuestionIndex === 0 && activeSectionIndex === 0}
                            className={`px-5 h-10 rounded-xl text-[12px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isDark ? 'text-[#8e9297] hover:text-white hover:bg-[#2b2d31]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                        >
                            Previous
                        </button>

                        {(currentQuestion.type?.toLowerCase() === 'code' || currentQuestion.type?.toLowerCase() === 'coding') && (
                            <button
                                onClick={() => handleRunAllTests(currentQuestion)}
                                disabled={Object.values(executingTests).some(v => v)}
                                className={`px-6 h-10 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 ${Object.values(executingTests).some(v => v)
                                    ? 'bg-slate-400 cursor-not-allowed opacity-50'
                                    : isDark
                                        ? 'bg-[#00c853] text-[#0d0f11] hover:bg-[#00e676] shadow-emerald-500/20'
                                        : 'bg-[#00e676] text-black hover:bg-[#00c853] shadow-emerald-500/20 font-black'
                                    }`}
                            >
                                {Object.values(executingTests).some(v => v) ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <span className="material-icons-outlined text-[18px]">play_arrow</span>
                                )}
                                Run all tests
                            </button>
                        )}

                        <button
                            onClick={isLastQuestionInRound && isLastRound ? submitAssessment : handleNextQuestion}
                            disabled={!answers[currentQuestion.id] && currentQuestion.type?.toLowerCase() !== 'mcq' || isSubmitting}
                            className={`px-8 h-10 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all shadow-sm ${(!answers[currentQuestion.id] && currentQuestion.type?.toLowerCase() !== 'mcq') || isSubmitting
                                ? isDark ? 'bg-[#2b2d31] text-[#4f5053] cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/25 active:scale-95'
                                }`}
                        >
                            {isLastQuestionInRound && isLastRound
                                ? (isSubmitting ? "Submitting..." : "Submit Assessment")
                                : isLastQuestionInRound
                                    ? "Next Round"
                                    : "Next"
                            }
                            {!(isLastQuestionInRound && isLastRound) && <span className="material-icons-outlined text-[18px]">chevron_right</span>}
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
