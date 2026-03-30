"use client";

interface EvaluatorResultProps {
    result: any;
    problem?: any;
    onClose?: () => void;
    isModal?: boolean;
}

export default function EvaluatorResult({ result, problem, onClose, isModal = false }: EvaluatorResultProps) {

    return (
        <div className={`w-full ${isModal ? "h-full overflow-y-auto bg-slate-900 p-8" : "max-w-5xl h-full max-h-[90vh] bg-slate-900 rounded-[2rem] border border-slate-800 shadow-[0_0_100px_rgba(79,70,229,0.2)] overflow-hidden flex flex-col"}`}>
            {!isModal ? (
                <div className="px-8 py-5 flex justify-between items-center border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[9px] font-black uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Analysis_Complete
                        </div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Neural Evaluation Report</h2>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/5 text-white hover:bg-white/10 flex items-center justify-center transition-all"
                        >
                            <span className="material-icons-outlined text-sm">close</span>
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Neural Evaluation Report</h2>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/5 text-white hover:bg-white/10 flex items-center justify-center transition-all"
                        >
                            <span className="material-icons-outlined text-sm">close</span>
                        </button>
                    )}
                </div>
            )}


            <div className={`flex flex-col md:flex-row gap-6 ${isModal ? "" : "flex-1 overflow-hidden"}`}>
                {/* Left Panel: Score & Metrics */}
                <div className={`w-full md:w-1/3 flex flex-col gap-4 ${isModal ? "" : "overflow-y-auto scrollbar-none p-6 border-r border-white/5 bg-slate-900/50"}`}>
                    {/* Main Score */}
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 text-white text-center shrink-0 shadow-lg shadow-slate-900/20">
                        <span className="text-[7px] font-black tracking-[0.3em] uppercase opacity-60 block mb-1">Aggregate Score</span>
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-5xl font-black tracking-tighter">{result.score || 0}</span>
                            <span className="text-sm font-black opacity-40">/10</span>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3 shrink-0">
                        {[
                            { label: "Grammar", score: result.grammar_score, icon: "spellcheck", color: "text-slate-300" },
                            { label: "Tone", score: result.tone_score, icon: "mood", color: "text-slate-300" },
                            { label: "Flow", score: result.structure_score, icon: "reorder", color: "text-slate-300" },
                            { label: "Context", score: result.relevance_score, icon: "gps_fixed", color: "text-slate-300" }
                        ].map((metric) => (
                            <div key={metric.label} className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col items-center gap-1 text-center hover:bg-white/10 transition-colors">
                                <span className={`material-icons-outlined text-sm ${metric.color}`}>{metric.icon}</span>
                                <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">{metric.label}</span>
                                <span className="text-sm font-black text-white">{metric.score || 0}</span>
                            </div>
                        ))}
                    </div>

                    {/* Neural Insights Compact */}
                    <div className="mt-auto bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-start gap-3">
                        <span className="material-icons-outlined text-slate-400 text-sm mt-0.5">auto_awesome</span>
                        <div className="space-y-0.5">
                            <h4 className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Neural_Insights</h4>
                            <p className="text-[10px] text-slate-400 font-medium italic leading-relaxed">Logic captured. Pulse frequency stable. Great work!</p>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Detailed Feedback */}
                <div className={`flex-1 ${isModal ? "" : "p-8 overflow-y-auto scrollbar-none"}`}>
                    <div className="space-y-4 max-w-2xl mx-auto">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-slate-800 text-slate-400">
                                <span className="material-icons-outlined text-lg">rate_review</span>
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white tracking-tight uppercase">Detailed Critique</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">AI Generated Analysis</p>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                            <div className="prose prose-invert prose-sm max-w-none">
                                <p className="italic text-slate-300 text-sm leading-relaxed font-medium whitespace-pre-wrap">
                                    "{result.feedback}"
                                </p>
                            </div>
                        </div>

                        {(result.word_count !== undefined) && (
                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-2">Word Count Analysis</span>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-300 text-xs font-medium">Target Met</span>
                                        <span className={`text-xs font-black ${result.word_count >= (problem?.content.min_words || 0) ? 'text-slate-300' : 'text-slate-500'}`}>
                                            {result.word_count >= (problem?.content.min_words || 0) ? 'PASS' : 'FAIL'}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-2">Processing Time</span>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-300 text-xs font-medium">Latency</span>
                                        <span className="text-xs font-black text-slate-400">~1.2s</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
