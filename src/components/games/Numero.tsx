import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Option {
    value: number;
}

interface Question {
    id: number;
    text: string;
    target?: { type?: 'MATH' | 'PATTERN' };
    options: Option[];
    correct_index: number;
}

interface Answer {
    question_id: number;
    user_response: number;
    correct: boolean;
}

interface NumeroProps {
    questions: Question[];
    onComplete: (score: number, answers: Answer[]) => void;
}

const BG_COLORS = [
    'bg-[#A4437B]', // The purple/pink from the image
    'bg-[#5C4B99]', // Indigo/Purple
    'bg-[#3D8361]', // Green
    'bg-[#D65A31]', // Orange
    'bg-[#2C3333]', // Dark Grey
    'bg-[#0F4C75]', // Blue
];

export default function Numero({ questions, onComplete }: NumeroProps) {
    // Game Config
    const TOTAL_TIME = 120;

    // State
    const [started, setStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Answer[]>([]);

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);

    // Derived
    const currentQuestion = questions[currentIndex];
    const bgColor = BG_COLORS[currentIndex % BG_COLORS.length];

    useEffect(() => {
        if (started && timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && started) {
            // eslint-disable-next-line react-hooks/immutability
            handleComplete();
        }
    }, [started, timeLeft]);

    const handleStart = async () => {
        const element = containerRef.current;
        if (element) {
            try {
                const el = element as HTMLElement & {
                    webkitRequestFullscreen?: () => Promise<void>;
                };
                if (el.requestFullscreen) {
                    await el.requestFullscreen();
                } else if (el.webkitRequestFullscreen) {
                    await el.webkitRequestFullscreen();
                }
            } catch (err) { console.error(err); }
        }
        setStarted(true);
    };

    const handleAnswer = (selectedVal: number) => {
        const correctIdx = currentQuestion.correct_index;
        const options = currentQuestion.options || [];
        const correctValue = options[correctIdx]?.value;
        const isCorrect = selectedVal === correctValue;

        const newAnswer: Answer = {
            question_id: currentQuestion.id,
            user_response: selectedVal,
            correct: isCorrect
        };

        const newAnswers = [...answers, newAnswer];
        setAnswers(newAnswers);

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            handleComplete(newAnswers);
        }
    };

    function handleComplete(finalAnswers?: Answer[]) {
        const answersToSubmit = finalAnswers || answers;
        const correctCount = answersToSubmit.filter(a => a.correct).length;
        const total = questions.length || 1;
        const normalizedScore = (correctCount / total) * 10;

        onComplete(normalizedScore * 10, answersToSubmit);
    };

    if (!started) {
        return (
            <div ref={containerRef} className="fixed inset-0 z-[9999] bg-[#A4437B] flex items-center justify-center font-sans text-white">
                <div className="max-w-2xl text-center space-y-8 p-12">
                    <div className="w-24 h-24 bg-white/20 rounded-3xl mx-auto flex items-center justify-center shadow-lg backdrop-blur-sm">
                        <span className="material-icons-outlined text-5xl text-white">calculate</span>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-5xl font-black tracking-tight">NUMERICAL</h1>
                        <p className="text-xl text-white/80 max-w-lg mx-auto leading-relaxed font-medium">
                            Speed & Pattern Challenge
                        </p>
                    </div>

                    <button
                        onClick={handleStart}
                        className="px-12 py-5 bg-white text-[#A4437B] rounded-full text-lg font-black   hover:scale-105 transition-all shadow-xl shadow-black/20"
                    >
                        Start Game
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className={`fixed inset-0 z-[9999] transition-colors duration-500 ease-out ${bgColor} flex flex-col font-sans text-white overflow-hidden`}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-8 pb-4">
                <button className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-white/30 text-white/80 hover:bg-white/10 transition-colors">
                    <span className="material-icons-outlined text-xl">info</span>
                </button>

                <div className="px-6 py-2 bg-black/20 backdrop-blur-md rounded-full border border-white/10">
                    <span className="text-sm font-bold  opacity-90">
                        {String(currentIndex + 1).padStart(2, '0')}/{String(questions.length).padStart(2, '0')}
                    </span>
                </div>

                <div className="px-6 py-2 bg-white rounded-full flex items-center gap-2 shadow-lg">
                    <span className="material-icons-outlined text-rose-500 text-lg">timer</span>
                    <span className="text-rose-500 font-bold font-mono text-lg">
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </span>
                </div>
            </div>

            <div className="text-center pb-4">
                <h2 className="text-lg font-bold text-white/90 drop-shadow-md">
                    {currentQuestion.target?.type === 'PATTERN' ? 'Complete the Pattern' : 'Solve the Equation'}
                </h2>
            </div>

            {/* Main Game Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative max-w-md mx-auto w-full space-y-8">

                <AnimatePresence mode='wait'>
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.2 }} // Faster transition
                        className="w-full space-y-8 relative"
                    >
                        {/* Question "Card" */}
                        <div className="relative aspect-square md:aspect-video w-full bg-white/20 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center border-2 border-white/30 shadow-2xl shadow-black/10 p-8 overflow-hidden">
                            <div className="text-center space-y-2">
                                <span className="text-xs font-black  tracking-[0.2em] text-white/60">Problem</span>
                                <div className="text-5xl md:text-6xl font-black text-white drop-shadow-lg leading-tight break-words word-break">
                                    {currentQuestion.text}
                                </div>
                            </div>

                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                                <button
                                    onClick={() => handleAnswer(-99999)}
                                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all text-[#A4437B]"
                                >
                                    <span className="material-icons-outlined text-2xl font-bold">close</span>
                                </button>
                            </div>
                        </div>

                        {/* Options Grid */}
                        <div className="grid grid-cols-2 gap-4 mt-8">
                            {(currentQuestion.options || []).map((opt, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(opt.value)}
                                    className="h-24 rounded-2xl bg-white/20 border-2 border-white/20 hover:bg-white/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center backdrop-blur-sm shadow-lg shadow-black/5 group"
                                >
                                    <span className="text-3xl font-black text-white group-hover:text-white drop-shadow-md">
                                        {opt.value}
                                    </span>
                                </button>
                            ))}
                        </div>

                    </motion.div>
                </AnimatePresence>

            </div>
        </div>
    );
}
