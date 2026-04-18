"use client";

import Link from "next/link";

interface InterviewResultProps {
    result: any;
    onClose?: () => void;
    isModal?: boolean;
}

export default function InterviewResult({ result, onClose, isModal = false }: InterviewResultProps) {
    if (!result) return null;

    return (
        <div className={`${isModal ? "" : "max-w-4xl mx-auto"} space-y-8`}>
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-slate-900  tracking-tight">Analysis Report</h1>
                    <p className="text-slate-500 text-sm">Automated evaluation complete.</p>
                </div>
                {!isModal ? (
                    <Link href="/practice/automated-video-interviews">
                        <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-bold text-xs  tracking-wide">
                            Exit to Hub
                        </button>
                    </Link>
                ) : (
                    onClose && (
                        <button onClick={onClose} className="px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 font-bold text-xs  text-slate-600">
                            Close
                        </button>
                    )
                )}
            </header>

            {/* Score Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                            <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-600" strokeDasharray={351} strokeDashoffset={351 - (351 * (result.overall_score || 0)) / 100} strokeLinecap="round" />
                        </svg>
                        <span className="absolute text-3xl font-black text-slate-800">{result.overall_score || 0}</span>
                    </div>
                    <p className="mt-4 text-xs font-black  text-slate-400 ">Overall Score</p>
                </div>

                <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800  tracking-wide mb-4 flex items-center gap-2">
                        <span className="material-icons text-slate-500 text-base">psychology</span>
                        Tone Analysis
                    </h3>
                    <p className="text-slate-600 leading-relaxed text-sm">
                        {result.tone_analysis || "No tone analysis available."}
                    </p>
                </div>
            </div>

            {/* Feedback Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-black text-slate-700  tracking-wide mb-4 flex items-center gap-2">
                        <span className="material-icons text-slate-500 text-base">check_circle</span>
                        Strengths detected
                    </h3>
                    <ul className="space-y-3">
                        {result.strengths?.map((str: string, i: number) => (
                            <li key={i} className="flex gap-3 text-sm text-slate-600">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-1.5 shrink-0"></span>
                                {str}
                            </li>
                        )) || <li className="text-sm text-slate-400 ">None detected.</li>}
                    </ul>
                </div>

                {/* Weaknesses */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-black text-slate-700  tracking-wide mb-4 flex items-center gap-2">
                        <span className="material-icons text-slate-500 text-base">warning</span>
                        Areas for Improvement
                    </h3>
                    <ul className="space-y-3">
                        {result.weaknesses?.map((weak: string, i: number) => (
                            <li key={i} className="flex gap-3 text-sm text-slate-600">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-1.5 shrink-0"></span>
                                {weak}
                            </li>
                        )) || <li className="text-sm text-slate-400 ">None detected.</li>}
                    </ul>
                </div>
            </div>

            {/* Detailed Feedback */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black text-slate-800  tracking-wide mb-4">Comprehensive Evaluation</h3>
                <div className="prose prose-sm max-w-none text-slate-600">
                    <p>{result.detailed_feedback || "No detailed feedback available."}</p>
                </div>
            </div>
        </div>
    );
}
