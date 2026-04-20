"use client";

import { useState, useEffect, use, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";
import CodeQuestion from "@/components/assessment/CodeQuestion";

export default function CodingEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const { id } = unwrappedParams;
    const searchParams = useSearchParams();
    const router = useRouter();
    const title = searchParams.get("title") || "Coding Problem";

    // Data State
    const [problem, setProblem] = useState<Problem | null>(null);
    const [loading, setLoading] = useState(true);

    // Editor State
    const [language, setLanguage] = useState("python");
    const [code, setCode] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [executingTests, setExecutingTests] = useState<{ [key: string]: boolean }>({});
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
    const [customInput, setCustomInput] = useState("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [customTestResult, setCustomTestResult] = useState<any>(null);
    const [executingCustomTest, setExecutingCustomTest] = useState(false);

    // UI State
    const [theme, setTheme] = useState<'dark' | 'light'>('light');
    const [leftPaneWidth, setLeftPaneWidth] = useState(40);
    const [leftPaneHeight, setLeftPaneHeight] = useState(70);
    const [showConsole, setShowConsole] = useState(false);
    const splitPaneRef = useRef<HTMLDivElement>(null);
    const [rightPaneHeight, setRightPaneHeight] = useState(60);

    const isDark = theme === 'dark';

    useEffect(() => {
        fetchProblem();
    }, [id]);

    const fetchProblem = async () => {
        try {
            const res = await apiClient.get(`/api/v1/content/questions/${id}`);
            if (res.ok) {
                const data = await res.json();
                setProblem(data);

                // Set initial code if available
                if (data.content && data.content.initial_code && data.content.initial_code["python"]) {
                    setCode(data.content.initial_code["python"]);
                } else {
                    setCode("# Write your python code here\n");
                }
            }
        } catch (e) {
            console.error(e);
            setError("Failed to load problem.");
        } finally {
            setLoading(false);
        }
    };

    const handleLanguageChange = (newLang: string) => {
        setLanguage(newLang);
        if (problem && problem.content && problem.content.initial_code && problem.content.initial_code[newLang]) {
            setCode(problem.content.initial_code[newLang]);
        } else {
            setCode(`// Write your ${newLang} code here\n`);
        }
    };

    const runCodeAnalysis = async (saveAttempt: boolean = false, testIndices: number[] | null = null) => {
        setShowConsole(true);
        setConsoleOutput(prev => [...prev, "> Submitting code for final analysis..."]);

        try {
            const res = await apiClient.post(`/api/v1/coach/code`, {
                code,
                language,
                problem_description: problem?.content?.question || "No description provided",
                question_id: Number(id),
                save_attempt: saveAttempt,
                test_case_indices: testIndices
            });

            if (!res.ok) throw new Error("Analysis failed");

            const data = await res.json();
            setResult(data);
            setConsoleOutput(prev => [...prev, "✓ Submission complete.", `> Score: ${data.score}%`]);

        } catch (err) {
            console.error(err);
            setError("Failed to execute code. Please try again.");
            setConsoleOutput(prev => [...prev, "✗ Submission failed."]);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleRunTest = async (index: number) => {
        const testCase = problem?.content?.test_cases?.[index];
        if (!testCase) return;


        setShowConsole(true);
        setConsoleOutput(prev => [...prev, `> Running Test Case ${index + 1}...`]);

        try {
            const res = await apiClient.post('/api/v1/assessments/ai/verify-code', {
                code,
                language,
                problem_statement: problem?.content?.question || "No description",
                test_cases: [testCase]
            });

            if (!res.ok) throw new Error("Verification failed");

            const data = await res.json();

            const passed = data.passed;
            const resultCase = data.test_cases?.[0];

            const resultData = {
                passed: resultCase ? resultCase.passed : passed,
                actual_output: resultCase ? resultCase.actual : data.output,
                expected_output: resultCase ? resultCase.expected : testCase.output,
                message: data.output
            };

            setResult((prev: AnalysisResult | null) => {
                const newResults = prev?.test_results ? [...prev.test_results] : [];
                const existingIdx = newResults.findIndex((r: TestResult) => r.case_id === index);
                const newEntry: TestResult = {
                    case_id: index,
                    passed: resultData.passed,
                    actual_output: resultData.actual_output,
                    expected_output: resultData.expected_output,
                    message: resultData.message
                };

                if (existingIdx !== -1) {
                    newResults[existingIdx] = newEntry;
                } else {
                    newResults.push(newEntry);
                }

                return { ...prev, test_results: newResults };
            });

            setConsoleOutput((prev: string[]) => [
                ...prev,
                resultData.passed ? `✓ Test Case ${index + 1} Passed` : `✗ Test Case ${index + 1} Failed`,
                `  Input: ${testCase.input}`,
                `  Expected: ${resultData.expected_output}`,
                `  Actual: ${resultData.actual_output}`,
                resultData.message ? `  Output: ${resultData.message}` : ''
            ].filter(Boolean));

        } catch (e) {
            console.error(e);
            setConsoleOutput((prev: string[]) => [...prev, `✗ Error running Test Case ${index + 1}`]);
        } finally {
            const testId = `${id}_${index}`;
            setExecutingTests((prev: { [key: string]: boolean }) => {
                const next = { ...prev };
                delete next[testId];
                return next;
            });
        }
    };

    const handleRunAll = async () => {

        setShowConsole(true);
        setConsoleOutput(["> Starting execution of all test cases..."]);

        setResult((prev: AnalysisResult | null) => ({ ...prev, test_results: [] }));

        const testCases = problem?.content?.test_cases || [];
        for (let i = 0; i < testCases.length; i++) {
            await handleRunTest(i);
        }

        setAnalyzing(false);
        setConsoleOutput((prev: string[]) => [...prev, "> Execution finished."]);
    };

    const handleRunCustomTest = async () => {
        if (!code || !customInput.trim()) return;

        setExecutingCustomTest(true);
        setCustomTestResult({ status: 'running' });
        setShowConsole(true);
        setConsoleOutput(prev => [...prev, `> Running custom test case...`, `  Input: ${customInput}`]);

        try {
            const res = await apiClient.post(`/api/v1/assessments/ai/verify-code`, {
                code,
                language,
                problem_statement: problem?.content?.question || "No description",
                test_cases: [{ input: customInput, expected: "" }]
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
            setConsoleOutput(prev => [...prev, `✗ Custom test failed.`]);
        } finally {
            setExecutingCustomTest(false);
        }
    };

    const handleSubmit = () => {
        setExecutingTests({});
        runCodeAnalysis(true, null);
    };

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

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-black text-indigo-600   animate-pulse">Loading Problem...</p>
            </div>
        </div>
    );

    if (!problem) return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-400 font-mono text-sm">PROBLEM_NOT_FOUND</div>;

    const description = problem.content.question || "No description.";
    const testCases = problem.content.test_cases || [];

    return (
        <div className={`h-full overflow-hidden flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-[#111214] text-[#8e9297]' : 'bg-[#fcfcfd] text-slate-600'}`}>

            <header className={`border-b h-14 flex items-center justify-between px-6 z-40 transition-colors duration-300 ${isDark ? 'bg-[#111214] border-[#2d2e32]' : 'bg-white border-slate-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'}`}>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            if (window.history.length > 2) {
                                router.back();
                            } else {
                                router.push('/practice/coding');
                            }
                        }}
                        className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${isDark ? 'hover:bg-[#2d2e31] text-[#8e9297]' : 'hover:bg-slate-100 text-slate-400'}`}
                    >
                        <span className="material-icons-outlined text-sm">arrow_back</span>
                    </button>
                    <div className={`w-px h-4 ${isDark ? 'bg-[#2d2e32]' : 'bg-slate-200/80'}`} />
                    <span className={`text-[13px] font-bold tracking-tight ${isDark ? 'text-[#e1e1e1]' : 'text-slate-900'}`}>
                        Practice
                    </span>
                    <div className={`w-px h-4 ${isDark ? 'bg-[#2d2e32]' : 'bg-slate-200/80'}`} />
                    <span className={`text-[13px] font-bold tracking-tight ${isDark ? 'text-[#e1e1e1]' : 'text-slate-900'}`}>
                        {title}
                    </span>
                </div>

                <div className="flex items-center gap-2">
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
                            <span className="text-[11px] font-black  ">
                                {isDark ? 'Light' : 'Dark'}
                            </span>
                        </div>
                    </button>
                </div>
            </header>

            <main
                ref={splitPaneRef}
                className="flex-1 flex overflow-hidden relative"
            >
                <div
                    style={{ width: `${leftPaneWidth}%` }}
                    className={`flex flex-col border-r transition-colors duration-300 ${isDark ? 'border-[#2d2e32] bg-[#111214]' : 'border-slate-200 bg-white'}`}
                >
                    <div className="p-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isDark
                            ? 'bg-[#2b2d31] border-[#3f4147] text-white'
                            : 'bg-white border-slate-200 text-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                            }`}>
                            <span className={`material-icons-outlined text-sm ${isDark ? 'text-white' : 'text-slate-400'}`}>description</span>
                            <span className="text-[12px] font-bold tracking-tight">Instructions</span>
                        </div>
                    </div>
                    <div style={{ height: showConsole ? `${leftPaneHeight}%` : '100%' }} className="flex flex-col overflow-hidden">
                        <div className={`flex-1 overflow-y-auto p-12 transition-all duration-300 no-scrollbar`}>
                            <div className="max-w-2xl space-y-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black   border
                                        ${problem.difficulty === 'EASY' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-50' :
                                            problem.difficulty === 'MEDIUM' ? 'text-amber-500 border-amber-500/20 bg-amber-50' :
                                                'text-rose-500 border-rose-500/20 bg-rose-50'}`}>
                                        {problem.difficulty}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-bold  ">{problem.topic}</span>
                                </div>

                                <h2 className={`text-lg md:text-xl font-semibold leading-relaxed ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {problem.content.question ? "Problem Statement" : "Challenge"}
                                </h2>

                                <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert text-[#cfd0d2]' : 'text-slate-600'}`}>
                                    <div className="whitespace-pre-wrap leading-relaxed">
                                        {description}
                                    </div>
                                </div>

                                {(problem.content.examples || problem.content.test_cases?.length || 0 > 0) && (
                                    <div className="space-y-6 pt-4">
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {(problem.content.examples || problem.content.test_cases?.slice(0, 2))?.map((ex: any, i: number) => (
                                            <div key={i} className="space-y-3">
                                                <span className="text-[10px] font-black  tracking-[0.2em] text-[#8e9297]">Example {i + 1}</span>
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
                                                        <div className="flex gap-4 border-t border-[#8e9297]/10 pt-2 mt-2 ">
                                                            <span className="text-[#8e9297] w-12 shrink-0">Note:</span>
                                                            <span className="text-[#8e9297]">{ex.explanation}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {problem.content.constraints && problem.content.constraints.length > 0 && (
                                    <div className="space-y-3 pt-4">
                                        <span className="text-[10px] font-black  tracking-[0.2em] text-[#8e9297]">Constraints</span>
                                        <ul className="space-y-2">
                                            {problem.content.constraints.map((c: string, i: number) => (
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

                    {showConsole && (
                        <div
                            onMouseDown={handleLeftHorizontalMouseDown}
                            className={`h-1 cursor-row-resize z-40 group flex items-center justify-center transition-colors hover:bg-indigo-500/20 ${isDark ? 'bg-[#2d2e32]' : 'bg-slate-100'}`}
                        >
                            <div className={`h-[1px] w-full ${isDark ? 'bg-[#3f4147]' : 'bg-slate-200'} group-hover:bg-indigo-500/50`} />
                        </div>
                    )}

                    {showConsole && (
                        <div style={{ height: `${100 - leftPaneHeight}%` }} className={`flex flex-col overflow-hidden ${isDark ? 'bg-[#0f1113]' : 'bg-slate-900'} text-[#8e9297] no-scrollbar border-t ${isDark ? 'border-indigo-500/20' : 'border-indigo-500/10'}`}>
                            <div className={`p-3 flex items-center justify-between flex-shrink-0 border-b ${isDark ? 'border-[#2d2e32]/30' : 'border-black/10'}`}>
                                <div className="flex items-center gap-2">
                                    <span className="material-icons-outlined text-[16px]">terminal</span>
                                    <span className="text-[10px] font-black  tracking-[0.15em]">Console output</span>
                                </div>
                                <button
                                    onClick={() => setShowConsole(false)}
                                    className="px-2 py-1 rounded hover:bg-white/5 transition-colors text-[9px] font-black   text-[#8e9297] hover:text-white"
                                >
                                    Close
                                </button>
                            </div>
                            <div className="flex-1 p-4 font-mono text-[11px] overflow-y-auto leading-relaxed no-scrollbar select-text bg-black/10">
                                {consoleOutput.length === 0 ? (
                                    <div className="flex gap-3">
                                        <span className="text-emerald-500 opacity-60">➜</span>
                                        <span className="text-white/40 "># waiting for execution...</span>
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
                                        <span className="">AI Verification engine running...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div
                    onMouseDown={handleMouseDown}
                    className="absolute top-0 bottom-0 w-1 cursor-col-resize z-50 transition-colors group flex items-center justify-center hover:bg-indigo-500/20"
                    style={{ left: `calc(${leftPaneWidth}% - 1px)` }}
                >
                    <div className={`w-[1px] h-full ${isDark ? 'bg-[#2d2e32]' : 'bg-slate-200'} group-hover:bg-indigo-500/50 transition-colors`} />
                </div>

                <div
                    style={{ width: `${100 - leftPaneWidth}%` }}
                    className={`flex flex-col overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#0d0f11]' : 'bg-[#f8fafc]'}`}
                >
                    <CodeQuestion
                        questionId={id}
                        code={code}
                        onCodeChange={setCode}
                        language={language}
                        onLanguageChange={setLanguage}
                        isDark={isDark}
                        testCases={testCases}
                        testResults={result ? transformTestResults(result, id) : undefined}
                        executingTests={executingTests}
                        onRunTest={handleRunTest}
                        readOnly={false}
                        feedback={result?.feedback}
                        consoleOutput={consoleOutput}
                        rightPaneHeight={rightPaneHeight}
                        onResizeRightPane={handleRightHorizontalMouseDown}
                        customInput={customInput}
                        onCustomInputChange={setCustomInput}
                        onRunCustomTest={handleRunCustomTest}
                        executingCustomTest={executingCustomTest}
                        customTestResult={customTestResult}
                    />
                </div>
            </main>

            <footer className={`border-t h-16 flex items-center px-6 z-50 transition-colors duration-300 ${isDark ? 'bg-[#111214] border-[#2d2e32]' : 'bg-white border-slate-200/50 shadow-[0_-8px_20px_rgba(0,0,0,0.01)]'}`}>
                <div className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {result && result.score !== undefined && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-slate-50 border-slate-200">
                                <span className="text-[10px] font-black   text-slate-500">Score</span>
                                <span className={`text-[12px] font-bold ${result.score === 100 ? 'text-emerald-600' : 'text-slate-900'}`}>{result.score}%</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleRunAll}
                            disabled={analyzing}
                            className={`px-6 h-10 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 ${analyzing
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : isDark
                                    ? 'bg-[#2b2d31] text-white hover:bg-[#3f4147] border border-[#3f4147]'
                                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                                }`}
                        >
                            {analyzing ? (
                                <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin"></div>
                            ) : (
                                <span className="material-icons-outlined text-[18px]">play_arrow</span>
                            )}
                            Run All Tests
                        </button>

                        <button
                            onClick={handleSubmit}
                            disabled={analyzing}
                            className={`px-6 h-10 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 ${analyzing
                                ? 'bg-slate-400 cursor-not-allowed opacity-50'
                                : isDark
                                    ? 'bg-[#00c853] text-[#0d0f11] hover:bg-[#00e676] shadow-emerald-500/20'
                                    : 'bg-[#00e676] text-black hover:bg-[#00c853] shadow-emerald-500/20 font-black'
                                }`}
                        >
                            <span className="material-icons-outlined text-[18px]">check</span>
                            Submit
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

const transformTestResults = (apiResult: AnalysisResult, questionId: string) => {
    if (!apiResult || !apiResult.test_results) return {};

    const map: { [key: string]: TransformedTestResult } = {};

    apiResult.test_results.forEach((r: TestResult, idx: number) => {
        const caseIndex = (r.case_id !== undefined && r.case_id !== null) ? r.case_id : idx;
        const testId = `${questionId}_${caseIndex}`;
        map[testId] = {
            passed: r.passed,
            actual: r.actual_output,
            expected: r.expected_output,
            message: r.message
        };
    });

    return map;
};
