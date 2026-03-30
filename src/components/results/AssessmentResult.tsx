import React from 'react';

interface AssessmentResultProps {
    result: {
        score: number;
        total_questions: number;
        percentage: number;
        completed_at: string;
    };
    test: {
        title: string;
        description: string;
        time_limit?: number | string;
        category?: string;
    };
    questions: {
        id: number;
        text: string;
        type: string;
        difficulty: string;
        is_correct: boolean;
        correct_answer: string;
        explanation: string;
    }[];
    onClose?: () => void;
    isModal?: boolean;
}

export default function AssessmentResult({ result, test, questions, onClose }: AssessmentResultProps) {

    // Calculate score color
    const getScoreColor = (percentage: number) => {
        if (percentage >= 80) return "text-emerald-500 border-emerald-500";
        if (percentage >= 60) return "text-amber-500 border-amber-500";
        return "text-rose-500 border-rose-500";
    };

    const getGradingBadge = (percentage: number) => {
        if (percentage >= 80) return <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-widest border border-slate-300 shadow-sm">Expert</span>;
        if (percentage >= 50) return <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200">Intermediate</span>;
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-slate-100">Beginner</span>;
    };

    const getRatingStars = (percentage: number) => {
        const stars = Math.round((percentage / 100) * 5);
        return (
            <div className="flex text-amber-400 text-lg">
                {[...Array(5)].map((_, i) => (
                    <span key={i} className="material-icons-outlined">
                        {i < stars ? "star" : "star_border"}
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-8 items-start justify-between border-b border-slate-100 pb-8">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{test.title}</h2>
                        {getGradingBadge(result.percentage)}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {test.category && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase tracking-widest border border-indigo-100">
                                {test.category}
                            </span>
                        )}
                        {test.time_limit && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-600 uppercase tracking-widest border border-slate-200">
                                <span className="material-icons-outlined text-[12px] mr-1 opacity-70">timer</span>
                                {test.time_limit} mins
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                        {getRatingStars(result.percentage)}
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l border-slate-200 pl-4 italic">
                            Evaluated on {new Date(result.completed_at).toLocaleDateString()}
                        </span>
                    </div>

                    <p className="text-sm text-slate-500 max-w-xl leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 italic">
                        "{test.description}"
                    </p>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <div className={`w-32 h-32 rounded-full border-8 flex flex-col items-center justify-center bg-white shadow-xl transition-transform hover:scale-105 duration-300 ${getScoreColor(result.percentage)}`}>
                        <span className="text-3xl font-black tracking-tighter">{Math.round(result.percentage)}%</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 -mt-1">Score</span>
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                        {result.score} / {result.total_questions} Points
                    </div>
                </div>
            </div>

            {/* Questions Review */}
            <div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Question Breakdown</h3>
                <div className="space-y-4">
                    {questions.map((q, index) => (
                        <div key={q.id} className={`p-5 rounded-2xl border ${q.is_correct ? 'bg-slate-50 border-slate-200' : 'bg-rose-50 border-rose-100'}`}>
                            <div className="flex gap-4">
                                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${q.is_correct ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-slate-800 text-sm mb-2">{q.text}</p>
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${q.is_correct ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                            {q.is_correct ? 'Correct' : 'Incorrect'}
                                        </span>
                                    </div>

                                    {!q.is_correct && (
                                        <div className="mt-3 bg-white/50 p-3 rounded-xl border border-rose-100/50">
                                            <p className="text-xs text-slate-600"><span className="font-bold text-slate-900">Correct Answer:</span> {q.correct_answer}</p>
                                            {q.explanation && (
                                                <p className="text-xs text-slate-500 mt-1 italic">{q.explanation}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {questions.length === 0 && (
                        <div className="text-center py-10 text-slate-400 text-sm italic">
                            No questions found for this assessment.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
