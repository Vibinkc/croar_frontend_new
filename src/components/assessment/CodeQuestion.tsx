import { useState } from "react";
import Editor from "@monaco-editor/react";
import { LANGUAGE_CONFIG } from "@/utils/languages";

interface CodeQuestionProps {
    questionId: string | number;
    code: string;
    onCodeChange?: (value: string) => void;
    language: string;
    onLanguageChange?: (lang: string) => void;
    isDark?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    testCases?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    testResults?: { [key: string]: any };
    executingTests?: { [key: string]: boolean };
    onRunTest?: (index: number) => void;
    customInput?: string;
    onCustomInputChange?: (value: string) => void;
    onRunCustomTest?: () => void;
    executingCustomTest?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customTestResult?: any;
    rightPaneHeight?: number;
    onResizeRightPane?: (e: React.MouseEvent) => void;
    isTransitioning?: boolean;
    transitionDirection?: 'next' | 'prev';
    readOnly?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    feedback?: any; // Can be object with test_cases or string
    consoleOutput?: string | string[];
}

export default function CodeQuestion({
    questionId,
    code,
    onCodeChange,
    language,
    onLanguageChange,
    isDark,
    testCases,
    testResults,
    executingTests,
    onRunTest,
    customInput,
    onCustomInputChange,
    onRunCustomTest,
    executingCustomTest,
    customTestResult,
    rightPaneHeight = 60,
    onResizeRightPane,
    isTransitioning,
    transitionDirection,
    readOnly = false,
    feedback,
    consoleOutput
}: CodeQuestionProps) {
    const [activeTab, setActiveTab] = useState<'test_cases' | 'custom_input'>('test_cases');
    const [expandedTests, setExpandedTests] = useState<{ [key: number]: boolean }>({});
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

    const toggleTestExpand = (index: number) => {
        setExpandedTests(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _unused = transitionDirection;

    // Switch to console tab if output arrives and we are not on it, or user just ran custom test?
    // Let parent control this or user manually switch.

    return (
        <>
            {/* IDE Top Pane (Editor) */}
            <div style={{ height: `${rightPaneHeight}%`, minHeight: '20%', maxHeight: '90%' }} className="flex flex-col relative shrink-0">
                {/* IDE Header */}
                <div className={`h-12 border-b flex items-center justify-between px-4 z-20 ${isDark ? 'bg-[#1e1f23] border-[#2d2e32]' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className={`material-icons-outlined text-[16px] ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>code</span>
                            <span className={`text-[11px] font-black   ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Editor</span>
                        </div>
                        <div className={`w-px h-4 ${isDark ? 'bg-[#2d2e32]' : 'bg-slate-200'}`} />

                        {readOnly ? (
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isDark ? 'bg-[#2d2e32] border-[#3f4147] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                                <span className="text-[10px] font-black  ">{LANGUAGE_CONFIG[language]?.name || language}</span>
                            </div>
                        ) : (
                            <div className="relative">
                                <button
                                    onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${isDark
                                        ? 'bg-[#2d2e32] border-[#3f4147] text-slate-300 hover:bg-[#3f4147] hover:text-white'
                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:border-indigo-200 hover:text-indigo-600'
                                        }`}
                                >
                                    <span className="text-[10px] font-black  ">{LANGUAGE_CONFIG[language]?.name || language}</span>
                                    <span className="material-icons-outlined text-[14px]">expand_more</span>
                                </button>
                                {showLanguageDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowLanguageDropdown(false)} />
                                        <div className={`absolute top-full left-0 mt-2 w-48 rounded-xl border shadow-xl overflow-hidden z-20 ${isDark ? 'bg-[#1e1f23] border-[#2d2e32]' : 'bg-white border-slate-100'}`}>
                                            {Object.keys(LANGUAGE_CONFIG).map((lang) => (
                                                <button
                                                    key={lang}
                                                    onClick={() => {
                                                        if (onLanguageChange) onLanguageChange(lang);
                                                        setShowLanguageDropdown(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-3 text-[11px] font-bold   transition-colors ${language === lang
                                                        ? isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700'
                                                        : isDark ? 'text-slate-400 hover:bg-[#2d2e32] hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                                        }`}
                                                >
                                                    {LANGUAGE_CONFIG[lang].name}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-hidden relative group">
                    <div className={`absolute inset-0 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                        <Editor
                            height="100%"
                            language={language}
                            theme={isDark ? "vs-dark" : "light"}
                            value={code}
                            onChange={(value) => !readOnly && onCodeChange && onCodeChange(value || "")}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 13,
                                lineHeight: 22,
                                fontFamily: 'JetBrains Mono, monospace',
                                fontLigatures: true,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                padding: { top: 20, bottom: 20 },
                                readOnly: readOnly,
                                domReadOnly: readOnly,
                                renderValidationDecorations: readOnly ? "off" : "on",
                                cursorStyle: readOnly ? 'line-thin' : 'line',
                                renderLineHighlight: readOnly ? 'none' : 'all',
                                selectionHighlight: !readOnly,
                                occurrencesHighlight: "off",
                                hideCursorInOverviewRuler: readOnly,
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Horizontal Drag Handle */}
            <div
                onMouseDown={!readOnly ? onResizeRightPane : undefined}
                className={`h-1 z-20 group flex items-center justify-center transition-colors ${readOnly ? 'cursor-default' : 'cursor-row-resize hover:bg-indigo-500/20'} ${isDark ? 'bg-[#111214]' : 'bg-slate-50'}`}
            >
                <div className={`h-[1px] w-full transition-colors ${isDark ? 'bg-[#2d2e32]' : 'bg-slate-200'} ${!readOnly && 'group-hover:bg-indigo-500/50'}`} />
            </div>

            {/* IDE Bottom Pane (Tests/Custom Input/Feedback) */}
            <div style={{ height: `${100 - rightPaneHeight}%`, minHeight: '10%' }} className={`flex flex-col overflow-hidden ${isDark ? 'bg-[#0d0f11]' : 'bg-[#f8fafc]'}`}>
                {/* Tabs */}
                <div className="flex border-b border-[#2d2e32]/50 px-4">
                    <button
                        onClick={() => setActiveTab('test_cases')}
                        className={`px-4 py-3 text-[10px] font-black   border-b-2 transition-all ${activeTab === 'test_cases'
                            ? isDark ? 'border-indigo-500 text-white' : 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-400'
                            }`}
                    >
                        {readOnly ? 'Evaluation Results' : 'Test Cases'}
                    </button>

                    {(!readOnly && onRunCustomTest) && (
                        <button
                            onClick={() => setActiveTab('custom_input')}
                            className={`px-4 py-3 text-[10px] font-black   border-b-2 transition-all ${activeTab === 'custom_input'
                                ? isDark ? 'border-indigo-500 text-white' : 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-400'
                                }`}
                        >
                            Custom Input
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 relative">
                    <div className={`absolute inset-0 p-4 transition-all duration-300 ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>

                        {/* VIEW 1: TEST CASES / FEEDBACK */}
                        {activeTab === 'test_cases' && (
                            <div className="space-y-3">
                                {readOnly && feedback ? (
                                    /* READ-ONLY FEEDBACK VIEW */
                                    <div className="space-y-4">
                                        {feedback.test_cases && Array.isArray(feedback.test_cases) ? (
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            feedback.test_cases.map((tc: any, i: number) => (
                                                <div key={i} className={`rounded-xl border p-4 ${tc.passed
                                                    ? isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'
                                                    : isDark ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-100'
                                                    }`}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className={`text-[10px] font-black   ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Test Case {i + 1}</span>
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded   ${tc.passed
                                                            ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                                                            : isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700'
                                                            }`}>
                                                            {tc.passed ? 'Passed' : 'Failed'}
                                                        </span>
                                                    </div>
                                                    {!tc.passed && tc.message && (
                                                        <p className={`text-xs mt-2 font-mono ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>{tc.message}</p>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#1e1f23] border-[#2d2e32]' : 'bg-white border-slate-200'}`}>
                                                <pre className={`text-xs font-mono whitespace-pre-wrap ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    {typeof feedback === 'string' ? feedback : JSON.stringify(feedback, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                        {feedback.suggestions && (
                                            <div className={`mt-4 p-4 rounded-xl text-sm leading-relaxed border ${isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-800'}`}>
                                                <div className="flex items-center gap-2 mb-2 font-bold   text-[10px] opacity-70">
                                                    <span className="material-icons-outlined text-sm">lightbulb</span>
                                                    Suggestions
                                                </div>
                                                <ul className="list-disc list-inside space-y-1">
                                                    {Array.isArray(feedback.suggestions) ? feedback.suggestions.map((s: string, i: number) => (
                                                        <li key={i}>{s}</li>
                                                    )) : <li>{String(feedback.suggestions)}</li>}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* INTERACTIVE TEST RUNNER VIEW */
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    testCases?.map((testCase: any, index: number) => {
                                        const testId = `${questionId}_${index}`;
                                        const result = testResults?.[testId];
                                        const isRunning = executingTests?.[testId];
                                        const isExpanded = expandedTests[index];

                                        return (
                                            <div key={index} className={`rounded-xl border transition-all duration-300 overflow-hidden ${isDark ? 'bg-[#1e1f23] border-[#2d2e32]' : 'bg-white border-slate-200'}`}>
                                                <div
                                                    onClick={() => toggleTestExpand(index)}
                                                    className={`p-3 flex items-center justify-between cursor-pointer hover:bg-opacity-80 transition-colors ${isDark ? 'hover:bg-[#25272c]' : 'hover:bg-slate-50'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {/* Status Icon */}
                                                        <div className={`w-6 h-6 rounded-md flex items-center justify-center border ${isRunning
                                                            ? isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-amber-50 border-amber-200 text-amber-600'
                                                            : result
                                                                ? result.passed
                                                                    ? isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                                                    : isDark ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-rose-50 border-rose-200 text-rose-600'
                                                                : isDark ? 'bg-[#2d2e32] border-[#3f4147] text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400'
                                                            }`}>
                                                            {isRunning ? (
                                                                <span className="material-icons-outlined text-[14px] animate-spin">sync</span>
                                                            ) : result ? (
                                                                <span className="material-icons-outlined text-[14px]">{result.passed ? 'check' : 'close'}</span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold">{index + 1}</span>
                                                            )}
                                                        </div>
                                                        <span className={`text-[12px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                                            Test Case {index + 1}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        {(!result && !isRunning && onRunTest) && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onRunTest(index);
                                                                }}
                                                                className={`px-3 py-1 rounded-lg text-[10px] font-black   transition-all active:scale-95 ${isDark
                                                                    ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                                                                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                                                    }`}
                                                            >
                                                                Run
                                                            </button>
                                                        )}
                                                        <span className={`material-icons-outlined text-lg transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                            expand_more
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Expanded Details */}
                                                <div className={`transition-all duration-300 ease-in-out border-t overflow-hidden ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} ${isDark ? 'border-[#2d2e32] bg-[#111214]' : 'border-slate-100 bg-slate-50/50'}`}>
                                                    <div className="p-4 space-y-4 font-mono text-[11px]">
                                                        <div>
                                                            <span className={` text-[9px] font-black  block mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Input</span>
                                                            <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#1e1f23] border-[#2d2e32] text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                                                                {testCase.input}
                                                            </div>
                                                        </div>
                                                        {result && !result.passed && (
                                                            <>
                                                                <div>
                                                                    <span className={` text-[9px] font-black  block mb-1.5 text-rose-500`}>Expected Output</span>
                                                                    <div className={`p-3 rounded-lg border ${isDark ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                                                                        {result.expected}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <span className={` text-[9px] font-black  block mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Actual Output</span>
                                                                    <div className={`p-3 rounded-lg border whitespace-pre-wrap ${isDark ? 'bg-[#1e1f23] border-[#2d2e32] text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                                                                        {result.actual || <span className="text-slate-500 ">No output</span>}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}



                        {/* VIEW 3: CUSTOM INPUT */}
                        {activeTab === 'custom_input' && !readOnly && (
                            <div className="space-y-4 h-full flex flex-col">
                                <div className="space-y-2">
                                    <label className={`text-[10px] font-black   ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Input Data</label>
                                    <textarea
                                        value={customInput}
                                        onChange={(e) => onCustomInputChange && onCustomInputChange(e.target.value)}
                                        className={`w-full h-32 rounded-xl border p-4 font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${isDark
                                            ? 'bg-[#1e1f23] border-[#2d2e32] text-slate-300 placeholder:text-slate-600'
                                            : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-300'
                                            }`}
                                        placeholder="Enter your custom test input here..."
                                    />
                                </div>

                                <div className="flex items-center justify-end">
                                    <button
                                        onClick={onRunCustomTest}
                                        disabled={!customInput || executingCustomTest}
                                        className={`px-5 py-2.5 rounded-xl text-[11px] font-black   transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isDark
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                                            }`}
                                    >
                                        {executingCustomTest ? 'Running...' : 'Run Code'}
                                    </button>
                                </div>

                                {customTestResult && (
                                    <div className={`flex-1 rounded-xl border overflow-hidden flex flex-col ${isDark ? 'bg-[#1e1f23] border-[#2d2e32]' : 'bg-white border-slate-200'}`}>
                                        <div className={`px-4 py-2 border-b text-[10px] font-black   flex items-center gap-2 ${customTestResult.status === 'error'
                                            ? isDark ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-rose-50 border-rose-100 text-rose-600'
                                            : isDark ? 'bg-[#25272c] border-[#2d2e32] text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'
                                            }`}>
                                            <span>Output</span>
                                        </div>
                                        <div className={`p-4 font-mono text-xs overflow-y-auto whitespace-pre-wrap ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                            {customTestResult.actual || customTestResult.message || "Execution finished."}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div >
        </>
    );
}
