
interface TextQuestionProps {
    value: string;
    onAnswer?: (value: string) => void;
    isDark?: boolean;
    placeholder?: string;
    readOnly?: boolean;
    feedback?: string;
}

export default function TextQuestion({
    value = "",
    onAnswer,
    isDark,
    placeholder = "Type your detailed response here...",
    readOnly = false,
    feedback
}: TextQuestionProps) {
    return (
        <div className="space-y-4 h-full flex flex-col min-h-[400px]">
            <div className={`group relative rounded-3xl transition-all duration-500 flex-1 flex flex-col ${isDark ? 'bg-[#1e1f23]/50 shadow-2xl shadow-black/40' : 'bg-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] shadow-indigo-100/20'} border ${isDark ? 'border-[#2d2e32]' : 'border-slate-100'}`}>
                {!readOnly && (
                    <div className={`absolute -inset-[1px] rounded-[inherit] bg-gradient-to-b opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none ${isDark ? 'from-indigo-500/20 to-purple-500/10' : 'from-indigo-100 to-white'}`} />
                )}
                <textarea
                    className={`relative w-full flex-1 rounded-[inherit] p-6 text-[15px] transition-all resize-none leading-relaxed focus:ring-0 outline-none ${readOnly ? 'cursor-text' : ''} ${isDark
                        ? `bg-transparent text-white ${!readOnly && 'placeholder:text-[#4f5053]'}`
                        : `bg-transparent text-slate-800 ${!readOnly && 'placeholder:text-slate-300'}`
                        }`}
                    placeholder={readOnly ? "No answer provided." : placeholder}
                    value={value}
                    onChange={(e) => !readOnly && onAnswer && onAnswer(e.target.value)}
                    readOnly={readOnly}
                ></textarea>
            </div>

            {readOnly && feedback && (
                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-800'}`}>
                    <div className="flex items-center gap-2 mb-2 font-bold   text-[10px] opacity-70">
                        <span className="material-icons-outlined text-sm">auto_awesome</span>
                        <span>AI Analysis</span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{feedback}</p>
                </div>
            )}
        </div>
    );
}
