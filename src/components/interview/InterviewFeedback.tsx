import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { exitFullScreen } from '@/utils/fullscreen';
import { motion } from 'framer-motion';

interface FeedbackData {
    overallScore: number;
    maxScore: number;
    status: string;
    role: string;
    submittedOn: string;
    timeTaken: string;
    summary: string;
    skills: { name: string; score: number; feedback: string }[];
    niceToHave: { name: string; score: number; feedback: string }[];
    integrityScore: number;
    offTabActivity: number;
}

interface InterviewFeedbackProps {
    transcript?: { role: 'ai' | 'user'; text: string }[];
    offTabCount?: number;
    isSaving?: boolean;
    backendResults?: any;
}

const DonutChart = ({ score, max, color = "text-slate-900", size = 60, strokeWidth = 6 }: { score: number, max: number, color?: string, size?: number, strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = (score / max) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    className="stroke-slate-200 dark:stroke-slate-700"
                    strokeWidth={strokeWidth}
                />
                <motion.circle
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - progress }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    className={`${color} stroke-current`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                />
            </svg>
            <span className="absolute text-[10px] font-black text-slate-900">
                {score}
            </span>
        </div>
    );
};

const BellCurve = ({ percentile }: { percentile: number }) => {
    return (
        <div className="relative h-32 w-full flex items-end justify-center">
            <div className="absolute inset-x-0 bottom-0 h-32 flex items-end opacity-20">
                <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full fill-slate-300">
                    <path d="M0,50 Q25,50 35,30 T50,5 T65,30 T100,50 Z" />
                </svg>
            </div>

            <div className="w-full h-full flex items-end relative overflow-hidden">
                <div className="w-1/3 h-full border-r border-dashed border-slate-300 relative group">
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Low</div>
                </div>
                <div className="w-1/3 h-full border-r border-dashed border-slate-300 relative group bg-slate-100">
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Average</div>
                </div>
                <div className="w-1/3 h-full relative group bg-slate-200">
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">High</div>
                </div>

                {/* DOT Moved here to span full width */}
                <motion.div
                    initial={{ opacity: 0, scale: 0, left: '50%' }}
                    animate={{ opacity: 1, scale: 1, left: `${Math.max(5, Math.min(95, percentile))}%` }}
                    transition={{ delay: 0.5, duration: 1.2, ease: "backOut" }}
                    className="absolute bottom-16 w-5 h-5 bg-slate-900 rounded-full border-2 border-white shadow-xl -translate-x-1/2 flex items-center justify-center"
                >
                    <div className="w-1 h-1 bg-white rounded-full animate-ping"></div>
                </motion.div>
            </div>
        </div>
    );
};

export default function InterviewFeedback({
    transcript = [],
    offTabCount = 0,
    isSaving = false,
    backendResults = null
}: InterviewFeedbackProps) {
    const router = useRouter();
    const [feedback, setFeedback] = useState<FeedbackData | null>(null);

    useEffect(() => {
        // PRIORITIZE BACKEND RESULTS
        if (backendResults) {
            setFeedback({
                overallScore: backendResults.overall_score || 0,
                maxScore: 100, // Backend usually sends 0-100
                status: backendResults.overall_score >= 80 ? "Recommended" : backendResults.overall_score >= 50 ? "Average" : "Not Recommended",
                role: "Software Engineer",
                submittedOn: new Date().toLocaleString(),
                timeTaken: "10 minutes",
                summary: backendResults.detailed_feedback || "Analysis completed successfully.",
                skills: (backendResults.strengths || []).map((s: string) => ({ name: s, score: 9, feedback: "Strategic strength identified." })),
                niceToHave: (backendResults.weaknesses || []).map((w: string) => ({ name: w, score: 6, feedback: "Area for growth." })),
                integrityScore: Math.max(0, 100 - (offTabCount * 25)),
                offTabActivity: offTabCount
            });
            return;
        }

        if (!transcript || transcript.length === 0) {
            setFeedback({
                overallScore: 0,
                maxScore: 10,
                status: "Not Attempted",
                role: "Software Engineer",
                submittedOn: new Date().toLocaleString(),
                timeTaken: "0 minutes",
                summary: "No interview data was recorded. Please ensure your microphone is working and you are speaking clearly.",
                skills: [],
                niceToHave: [],
                integrityScore: 100,
                offTabActivity: 0
            });
            return;
        }

        // EVALUATION ENGINE
        const qaPairs: { question: string; answer: string }[] = [];

        // Chronological pairing: 
        // Iterate through transcript and pair each user response with the most recent relevant AI question
        let lastQuestion = "";
        transcript.forEach((msg) => {
            if (msg.role === 'ai') {
                // Ignore focus warnings and short greetings for technical categorization
                if (!msg.text.includes("steady") && !msg.text.includes("focused")) {
                    // If we have a pending question that wasn't answered, it will be added when the next AI msg comes
                    // But for simplicity in this mock, we just update the "last question"
                    lastQuestion = msg.text;
                }
            } else if (msg.role === 'user') {
                qaPairs.push({
                    question: lastQuestion || "General Introduction",
                    answer: msg.text
                });
                // Reset last question so we don't attribute multiple user segments to the same question 
                // unless it's a follow-up (simulated by lastQuestion remaining if no new AI msg)
                // Actually, in many cases user might speak in chunks, so we keep lastQuestion
            }
        });

        // Ensure questions asked but not answered are accounted for as 0
        const aiQuestions = transcript.filter(m =>
            m.role === 'ai' &&
            !m.text.includes("steady") &&
            !m.text.includes("focused") &&
            m.text.length > 20 // Ignore very short prompts
        );

        // Map AI questions to answers (if any)
        const questionScores = aiQuestions.map(q => {
            const pair = qaPairs.find(p => p.question === q.text);
            const answer = pair ? pair.answer : "";

            const words = answer.trim().split(/\s+/).filter(w => w.length > 0);
            const count = words.length;

            let score = 0;
            if (count === 0) score = 0;
            else if (count < 5) score = 2.0;
            else if (count < 15) score = 4.5;
            else if (count < 30) score = 7.0;
            else score = 9.5;

            let category = "General Communication";
            // More specific category extraction
            const lowerQ = q.text.toLowerCase();
            if (lowerQ.includes("project") || lowerQ.includes("technical") || lowerQ.includes("code") || lowerQ.includes("experience")) {
                // Skip the very first greeting from being "Technical Depth" if it's just an intro
                if (!lowerQ.includes("hello") && !lowerQ.includes("welcome")) {
                    category = "Technical Depth";
                }
            }
            if (lowerQ.includes("challenge") || lowerQ.includes("problem") || lowerQ.includes("solve")) category = "Problem Solving";
            if (lowerQ.includes("team") || lowerQ.includes("conflict") || lowerQ.includes("behavioral")) category = "Behavioral & Ethics";

            return { name: category, score, answerLength: count };
        });

        // Grouping and Averaging
        const uniqueSkillsMap = new Map<string, { scores: number[] }>();
        questionScores.forEach(s => {
            const existing = uniqueSkillsMap.get(s.name) || { scores: [] };
            uniqueSkillsMap.set(s.name, { scores: [...existing.scores, s.score] });
        });

        const finalSkills = Array.from(uniqueSkillsMap.entries()).map(([name, data]) => {
            const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
            let feedbackText = "Detailed and well-articulated.";

            if (avg === 0) {
                feedbackText = "No response was recorded for this competency area. Evaluation was not possible.";
            } else if (avg < 4) {
                feedbackText = "Answers were too brief. More elaboration is needed to assess proficiency.";
            } else if (avg < 7) {
                feedbackText = "Clear communication but lacked specific examples or 'STAR' method elements.";
            }

            return {
                name,
                score: Math.round(avg * 10) / 10,
                feedback: feedbackText
            };
        });

        // Final score calculation
        const hasEngagement = questionScores.some(s => s.answerLength > 0);
        const overallRaw = finalSkills.length > 0 ? finalSkills.reduce((a, b) => a + b.score, 0) / finalSkills.length : 0;
        const overallScore = hasEngagement ? Math.round(overallRaw * 10) / 10 : 0;

        // Integrity Calculation
        const integrityScore = Math.max(0, 100 - (offTabCount * 25));

        // Summary generation
        let summary = "";
        if (!hasEngagement) {
            summary = "The interview could not be evaluated as no candidate responses were detected. Please verify your microphone settings and try again.";
        } else if (overallScore > 7.5) {
            summary = "The candidate demonstrated exceptional professional communication skills. They provided deep, thoughtful responses that showed a high level of expertise and problem-solving ability.";
        } else if (overallScore > 5) {
            summary = "The candidate demonstrated professional communication skills. They answered most questions correctly but would benefit from providing more concrete situational examples.";
        } else {
            summary = "The interview performance was significantly hampered by brief or missing responses. While some basic communication was noted, it was difficult to fully evaluate their technical depth or problem-solving skills.";
        }

        setFeedback({
            overallScore,
            maxScore: 10,
            status: !hasEngagement ? "N/A" : overallScore >= 7 ? "Recommended" : overallScore >= 5 ? "Average" : "Not Recommended",
            role: "Software Engineer",
            submittedOn: new Date().toLocaleString(),
            timeTaken: "10 minutes",
            summary,
            skills: finalSkills,
            niceToHave: hasEngagement ? [
                { name: "Resilience", score: Math.round(overallScore * 0.9 * 10) / 10, feedback: "Handled challenging questions with composure." },
                { name: "Cultural Fit", score: 8.5, feedback: "Communicated with professional etiquette." }
            ] : [],
            integrityScore,
            offTabActivity: offTabCount
        });
    }, [transcript, offTabCount, backendResults]);

    if (isSaving || !feedback) return (
        <div className="fixed inset-0 bg-white flex items-center justify-center flex-col gap-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">
                {isSaving ? "Finalizing & Saving Interview Analysis..." : "Generating accurate analysis..."}
            </p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-black p-4 md:p-6 font-sans overflow-x-hidden">
            <div className="max-w-6xl mx-auto space-y-6">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between gap-6"
                >
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Analysis Report</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidate_ID: TAL-8293</p>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-rounded text-lg">calendar_today</span>
                                {feedback.submittedOn}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-rounded text-lg">timer</span>
                                {feedback.timeTaken}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-4 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-slate-900">{feedback.overallScore}</span>
                                <span className="text-slate-400 font-bold mb-1">/10</span>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-2 font-black text-[11px] uppercase tracking-widest mb-1 text-slate-900">
                                    <span className="material-symbols-rounded text-sm">stars</span>
                                    {feedback.status}
                                </div>
                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono">{feedback.role}</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm"
                    >
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 border-b border-slate-100 pb-3">Performance_Insights</h2>
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                            <div className="w-full md:w-1/2">
                                <BellCurve percentile={feedback.overallScore * 10} />
                            </div>
                            <div className="w-full md:w-1/2 text-[11px] font-medium leading-relaxed text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
                                <span className="material-symbols-rounded text-slate-400 mr-2 align-bottom text-base">psychology</span>
                                {feedback.summary}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between"
                    >
                        <div>
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Integrity_Panel</h2>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
                                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Integrity Score</span>
                                    <span className="font-black text-slate-900">
                                        {feedback.integrityScore}%
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-2xl">
                                    <span className="text-slate-500 text-sm">Window Switches</span>
                                    <span className={`font-bold ${feedback.offTabActivity > 0 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                                        {feedback.offTabActivity}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                exitFullScreen();
                                router.push('/practice/interviews');
                            }}
                            className="w-full mt-6 bg-slate-900 text-white py-3 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-black transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                        >
                            Finalize_Session
                        </button>
                    </motion.div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight ml-2">Competency Breakdown</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {feedback.skills.map((skill, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 * idx }}
                                className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm hover:border-slate-900 transition-colors group"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="p-2.5 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                        <span className="material-symbols-rounded">analytics</span>
                                    </div>
                                    <DonutChart score={skill.score} max={10} color="stroke-slate-900" />
                                </div>
                                <h3 className="font-black text-[11px] text-slate-900 uppercase tracking-tight mb-1">{skill.name}</h3>
                                <p className="text-[10px] text-slate-400 font-medium line-clamp-3 leading-relaxed italic">
                                    {skill.feedback}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
