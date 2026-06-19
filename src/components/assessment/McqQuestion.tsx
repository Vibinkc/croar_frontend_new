
interface McqQuestionProps {
    questionId: string | number;
    options: string[];
    selectedOption?: string;
    onAnswer?: (value: string) => void;
    isDark?: boolean;
    readOnly?: boolean;
    correctAnswer?: string;
    feedback?: string;
}

export default function McqQuestion({
    questionId,
    options,
    selectedOption,
    onAnswer,
    isDark,
    readOnly = false,
    correctAnswer,
    feedback
}: McqQuestionProps) {
    return (
        <div className="space-y-4">
            <div className="space-y-3 overflow-y-auto pr-2 no-scrollbar">
                {options.map((opt: string, idx: number) => {
                    let containerStyle = "";
                    let textStyle = "";
                    let icon = null;

                    const isSelected = selectedOption === opt;
                    const isCorrect = correctAnswer === opt;

                    if (readOnly) {
                        if (correctAnswer) {
                            if (isCorrect) {
                                containerStyle = "bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/50";
                                textStyle = "text-emerald-600 dark:text-emerald-400 font-bold";
                                icon = <span className="material-icons-outlined text-emerald-500 text-lg">check_circle</span>;
                            } else if (isSelected) {
                                containerStyle = "bg-rose-500/10 border-rose-500/50 ring-1 ring-rose-500/50";
                                textStyle = "text-rose-600 dark:text-rose-400";
                                icon = <span className="material-icons-outlined text-rose-500 text-lg">cancel</span>;
                            } else {
                                containerStyle = isDark ? "bg-[#1e1f23] border-[#2d2e32] opacity-50" : "bg-white border-slate-200 opacity-50";
                                textStyle = isDark ? "text-[#8e9297]" : "text-slate-500";
                            }
                        } else {
                            // Read-only but no correct answer provided (just viewing submission)
                            if (isSelected) {
                                containerStyle = isDark ? "bg-indigo-500/20 border-indigo-500/50" : "bg-indigo-50 border-indigo-200";
                                textStyle = isDark ? "text-indigo-300" : "text-indigo-700";
                            } else {
                                containerStyle = isDark ? "bg-[#1e1f23] border-[#2d2e32] opacity-50" : "bg-white border-slate-200 opacity-50";
                                textStyle = isDark ? "text-[#8e9297]" : "text-slate-500";
                            }
                        }
                    } else {
                        // Interactive Mode
                        if (isSelected) {
                            containerStyle = isDark
                                ? "bg-indigo-600 border-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                                : "bg-indigo-50 border-indigo-200 shadow-sm";
                            textStyle = isDark ? "text-white" : "text-indigo-700";
                        } else {
                            containerStyle = isDark
                                ? "bg-[#1e1f23] border-[#2d2e32] hover:border-[#4f5053] hover:bg-[#2b2d31]"
                                : "bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50 hover:shadow-sm";
                            textStyle = isDark ? "text-[#8e9297] group-hover:text-[#cfd0d2]" : "text-slate-600 group-hover:text-slate-900";
                        }
                    }

                    return (
                        <label
                            key={idx}
                            className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${readOnly ? 'cursor-default' : 'cursor-pointer'} ${containerStyle}`}
                        >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${readOnly
                                ? 'border-transparent' // Hide radio circle in read-only to avoid clutter, using icons instead
                                : isSelected
                                    ? (isDark ? 'border-white bg-white' : 'border-indigo-600 bg-indigo-600')
                                    : (isDark ? 'border-[#4f5053] group-hover:border-[#8e9297]' : 'border-slate-300 group-hover:border-slate-400')
                                }`}>
                                {!readOnly && isSelected && (
                                    <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-indigo-600' : 'bg-white'}`} />
                                )}
                                {readOnly && icon}
                            </div>

                            <input
                                type="radio"
                                name={`q-${questionId}`}
                                value={opt}
                                checked={isSelected}
                                onChange={() => !readOnly && onAnswer && onAnswer(opt)}
                                disabled={readOnly}
                                className="hidden"
                            />
                            <span className={`text-[13px] font-medium leading-relaxed transition-colors select-none flex-1 ${textStyle}`}>
                                {opt}
                            </span>
                        </label>
                    );
                })}
            </div>

            {readOnly && feedback && (
                <div className={`mt-4 p-4 rounded-xl text-sm leading-relaxed border ${isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-800'}`}>
                    <div className="flex items-center gap-2 mb-2 font-bold   text-[10px] opacity-70">
                        <span className="material-icons-outlined text-sm">lightbulb</span>
                        <span>Feedback</span>
                    </div>
                    {feedback}
                </div>
            )}
        </div>
    );
}
