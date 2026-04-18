"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Line {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

interface Pattern {
    lines?: Line[];
    imageUrl?: string;
}

interface Question {
    id: number;
    target: Pattern;
    options: Pattern[];
    correct_index: number;
}

interface SpotOnProps {
    questions: Question[];
    onComplete: (responses: Record<string, number>, timeTaken: number) => void;
}

// Enhanced Particle for "Starburst" effect - Full Screen Version
const StarParticle = ({ i, count }: { i: number, count: number }) => {
    // Distribute angles evenly but add some random jitter
    const angle = (i * (360 / count)) * (Math.PI / 180);
    // Much larger distance to cover full screen
    const distance = 400 + Math.random() * 300;

    // Randomize shapes
    const isStar = i % 2 === 0;

    return (
        <motion.div
            initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
            animate={{
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                scale: [0, 2, 0], // Larger scale
                opacity: [1, 1, 0],
                rotate: isStar ? 360 : 180 // More rotation
            }}
            transition={{ duration: 1.2, ease: "easeOut" }} // Slower, more dramatic
            className={`absolute ${isStar ? 'w-8 h-8' : 'w-6 h-6'} 
                ${i % 3 === 0 ? 'bg-yellow-400' : i % 3 === 1 ? 'bg-cyan-400' : 'bg-white'} 
                shadow-[0_0_25px_currentColor]`}
            style={{
                clipPath: isStar
                    ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
                    : "circle(50%)"
            }}
        />
    );
};

export default function SpotOn({ questions, onComplete }: SpotOnProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [responses, setResponses] = useState<Record<string, number>>({});
    const [startTime] = useState(Date.now());
    const [timeLeft, setTimeLeft] = useState(10);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [score, setScore] = useState(0);
    const [showScorePopup, setShowScorePopup] = useState(false);

    const [showBlast, setShowBlast] = useState(false);
    const [showSkull, setShowSkull] = useState(false);
    const [matchIndex, setMatchIndex] = useState<number | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Enter full screen on mount on the container
    useEffect(() => {
        const enterFullScreen = async () => {
            const element = containerRef.current;
            if (!element) return;
            try {
                if (element.requestFullscreen) {
                    await element.requestFullscreen();
                } else if ((element as any).webkitRequestFullscreen) {
                    await (element as any).webkitRequestFullscreen();
                } else if ((element as any).msRequestFullscreen) {
                    await (element as any).msRequestFullscreen();
                }
            } catch (err) {
                console.error("Error attempting to enable full-screen mode:", err);
            }
        };
        setTimeout(enterFullScreen, 100);
    }, []);

    const handleSelect = useCallback((choiceIndex: number) => {
        if (feedback) return;

        const isCorrect = choiceIndex === questions[currentIndex].correct_index;
        setFeedback(isCorrect ? 'correct' : 'wrong');
        setMatchIndex(choiceIndex);

        if (isCorrect) {
            setScore(prev => prev + 100);
            setShowScorePopup(true);
            setShowBlast(true);
            setTimeout(() => {
                setShowScorePopup(false);
                setShowBlast(false);
                setMatchIndex(null);
            }, 800);
        } else {
            setShowSkull(true);
            setTimeout(() => {
                setShowSkull(false);
                setMatchIndex(null);
            }, 800);
        }

        setResponses(prev => ({
            ...prev,
            [questions[currentIndex].id.toString()]: choiceIndex
        }));

        setTimeout(() => {
            setFeedback(null);
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setTimeLeft(10);
            } else {
                const totalTime = Math.floor((Date.now() - startTime) / 1000);
                onComplete({ ...responses, [questions[currentIndex].id.toString()]: choiceIndex }, totalTime);
            }
        }, 800);
    }, [currentIndex, questions, responses, startTime, onComplete, feedback]);

    useEffect(() => {
        if (feedback) return;

        if (timeLeft <= 0) {
            handleSelect(-1);
            return;
        }

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timeLeft, handleSelect, feedback]);

    const renderPattern = (pattern: Pattern, color: string = "#fff") => {
        if (pattern.imageUrl) {
            return (
                <div className="w-full h-full p-2 flex items-center justify-center">
                    <img
                        src={pattern.imageUrl}
                        alt="Pattern"
                        className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                        style={{ filter: color !== '#fff' ? `drop-shadow(0 0 10px ${color})` : undefined }}
                    />
                </div>
            );
        }

        const lines = pattern?.lines || [];
        return (
            <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                {lines.map((line, i) => (
                    <motion.line
                        key={i}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke={color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                    />
                ))}
            </svg>
        );
    };

    const currentQuestion = questions[currentIndex];
    const timerRadius = 30;
    const timerCircumference = 2 * Math.PI * timerRadius;
    const timerOffset = ((10 - timeLeft) / 10) * timerCircumference;

    return (
        <div ref={containerRef} className="min-h-screen bg-[#050510] text-white overflow-hidden relative font-sans flex flex-col items-center justify-center w-full h-full">
            {/* Shake Wrapper */}
            <motion.div
                animate={showSkull ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 z-0 bg-transparent pointer-events-none"
            />
            {/* Red Flash Overlay for Wrong Answer */}
            <AnimatePresence>
                {showSkull && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[90] bg-rose-900 pointer-events-none mix-blend-overlay"
                    />
                )}
            </AnimatePresence>

            {/* Background elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e1b4b_0%,#050510_100%)] z-0" />
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 z-0 pointer-events-none" />

            {/* FULL SCREEN ANIMATION OVERLAY */}
            <AnimatePresence>
                {showBlast && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none perspective-[1000px]">
                        {[...Array(30)].map((_, i) => (
                            <StarParticle key={i} i={i} count={30} />
                        ))}
                        <motion.div
                            initial={{ scale: 0, opacity: 0.6, borderWidth: '0px' }}
                            animate={{ scale: 4, opacity: 0, borderWidth: '20px' }}
                            transition={{ duration: 0.8 }}
                            className="absolute rounded-full border-cyan-400 w-[50vw] h-[50vw]"
                        />
                        <motion.div
                            initial={{ opacity: 0.4 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 bg-cyan-400 mix-blend-overlay"
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* Full Screen Skull Overlay */}
            <AnimatePresence>
                {showSkull && (
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 1.2, opacity: 0 }}
                        transition={{ duration: 0.4, type: "spring", bounce: 0.5 }}
                        className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none backdrop-blur-[2px]"
                    >
                        <div className="relative">
                            {/* Glitch Effect Shadows */}
                            <motion.div
                                animate={{ x: [-5, 5, -3, 3, 0], opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 0.2, repeat: 3 }}
                                className="absolute inset-0 text-cyan-500 mix-blend-screen opacity-50"
                            >
                                <SkullSVG />
                            </motion.div>
                            <motion.div
                                animate={{ x: [5, -5, 3, -3, 0], opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 0.2, repeat: 3 }}
                                className="absolute inset-0 text-red-500 mix-blend-screen opacity-50"
                            >
                                <SkullSVG />
                            </motion.div>

                            {/* Main Skull */}
                            <div className="text-white drop-shadow-[0_0_50px_rgba(225,29,72,0.8)] filter contrast-125">
                                <SkullSVG />
                            </div>

                            <motion.span
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 150 }}
                                className="absolute left-1/2 -translate-x-1/2 top-1/2 text-rose-500 font-black text-4xl tracking-[0.5em] whitespace-nowrap"
                            >
                                MISMATCH
                            </motion.span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-8 flex flex-col h-[90vh] justify-between">

                {/* HUD Top Bar */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="space-y-1">
                            <span className="text-[9px] font-black text-indigo-400  tracking-[0.2em] block">Mission_Progress</span>
                            <div className="flex gap-1 h-1 w-48 bg-white/5 rounded-full overflow-hidden border border-white/10">
                                {questions.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex-1 transition-all duration-500 ${idx < currentIndex ? 'bg-cyan-400' :
                                            idx === currentIndex ? 'bg-indigo-500 animate-pulse' : 'bg-white/5'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <span className="text-[9px] font-black text-indigo-400  tracking-[0.2em] block mb-0.5">Score</span>
                            <motion.div
                                key={score}
                                initial={{ scale: 1.2, color: '#22d3ee' }}
                                animate={{ scale: 1, color: '#fff' }}
                                className="text-2xl font-black tracking-tighter tabular-nums"
                            >
                                {score.toLocaleString()}
                            </motion.div>
                        </div>

                        {/* Circular Timer */}
                        <div className="relative w-16 h-16 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="32"
                                    cy="32"
                                    r={timerRadius}
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    fill="transparent"
                                    className="text-white/5"
                                />
                                <motion.circle
                                    cx="32"
                                    cy="32"
                                    r={timerRadius}
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    fill="transparent"
                                    strokeDasharray={timerCircumference}
                                    strokeDashoffset={timerOffset}
                                    className={timeLeft < 4 ? 'text-rose-500' : 'text-cyan-400'}
                                    transition={{ duration: 0.3 }}
                                />
                            </svg>
                            <span className={`absolute text-xl font-black tabular-nums ${timeLeft < 4 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
                                {timeLeft}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Battle Field */}
                <div className="flex-1 flex flex-col items-center justify-center gap-10">

                    {/* Target Pattern Display */}
                    <div className="relative">
                        <motion.div
                            key={currentIndex}
                            initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            className="relative group"
                        >
                            {/* Decorative Rings */}
                            <div className="absolute inset-0 -m-6 border border-cyan-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
                            <div className="absolute inset-0 -m-10 border border-indigo-500/10 rounded-full animate-[spin_15s_linear_reverse_infinite]" />

                            <div className="w-48 h-48 bg-slate-900/40 backdrop-blur-2xl rounded-full p-8 border-2 border-white/10 shadow-[0_0_50px_rgba(34,211,238,0.1)] flex items-center justify-center relative overflow-hidden group-hover:border-white/20 transition-all duration-500">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.1)_0%,transparent_70%)]" />
                                {renderPattern(currentQuestion.target, "#fff")}

                                <div className="absolute top-3 left-1/2 -translate-x-1/2">
                                    <span className="text-[7px] font-black text-cyan-400  tracking-[0.3em] whitespace-nowrap">Target</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Score Popup */}
                        <AnimatePresence>
                            {showScorePopup && (
                                <motion.div
                                    initial={{ y: 0, opacity: 0, scale: 0.5 }}
                                    animate={{ y: -100, opacity: 1, scale: 1.5 }}
                                    exit={{ opacity: 0, scale: 1 }}
                                    className="absolute -top-16 left-1/2 -translate-x-1/2 text-cyan-400 font-black text-5xl  tracking-tighter drop-shadow-[0_0_20px_rgba(34,211,238,0.8)] z-50"
                                >
                                    PERFECT!
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Options Array */}
                    <div className="w-full">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                            {currentQuestion.options.map((opt, idx) => (
                                <motion.button
                                    key={`${currentIndex}-${idx}`}
                                    initial={{ y: 30, opacity: 0 }}
                                    animate={
                                        feedback === 'correct' && idx === currentQuestion.correct_index
                                            ? { scale: [1, 1.1, 1], rotate: [0, 360], transition: { duration: 0.6 } }
                                            : { y: 0, opacity: 1 }
                                    }
                                    transition={{ delay: 0.1 + idx * 0.05 }}
                                    whileHover={{ y: -5, scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSelect(idx)}
                                    disabled={!!feedback}
                                    className={`relative aspect-square rounded-[2rem] p-4 transition-all duration-300 border-2 overflow-hidden flex items-center justify-center bg-white/5 backdrop-blur-xl ${feedback === 'correct' && idx === currentQuestion.correct_index
                                        ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_50px_rgba(16,185,129,0.4)] z-10'
                                        : feedback === 'wrong' && responses[currentQuestion.id] === idx
                                            ? 'border-rose-500/50 bg-rose-500/10 shadow-[0_0_30px_rgba(244,63,94,0.2)]'
                                            : 'border-white/5 hover:border-cyan-500/50 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="w-full h-full relative z-10">
                                        {renderPattern(opt,
                                            feedback === 'correct' && idx === currentQuestion.correct_index ? "#10b981" :
                                                feedback === 'wrong' && responses[currentQuestion.id] === idx ? "#f43f5e" : "#fff"
                                        )}
                                    </div>

                                    <div className="absolute top-3 right-4 text-[8px] font-black text-white/20 group-hover:text-cyan-400 transition-colors">
                                        0{idx + 1}
                                    </div>

                                    {/* Selected feedback overlays */}
                                    <AnimatePresence>
                                        {feedback === 'correct' && idx === currentQuestion.correct_index && (
                                            <motion.div
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center"
                                            >
                                                <motion.span
                                                    initial={{ scale: 0 }} animate={{ scale: 1.5 }}
                                                    className="material-icons-outlined text-emerald-500 text-5xl drop-shadow-md"
                                                >
                                                    check_circle
                                                </motion.span>
                                            </motion.div>
                                        )}
                                        {feedback === 'wrong' && responses[currentQuestion.id] === idx && (
                                            <motion.div
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                className="absolute inset-0 bg-rose-500/10 flex items-center justify-center"
                                            >
                                                <span className="material-icons-outlined text-rose-500 text-3xl">cancel</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer UI */}
                <div className="mt-8 flex justify-center">
                    <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
                        <p className="text-[8px] font-black text-slate-500  tracking-[0.3em] animate-pulse">
                            System_Active
                        </p>
                    </div>
                </div>
            </div>

            {/* Global Overlay Alerts */}
            <AnimatePresence>
                {feedback === 'wrong' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 pointer-events-none border-[8px] border-rose-500/20 bg-rose-500/5 animate-shake"
                    />
                )}
                {feedback === 'correct' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 pointer-events-none border-[8px] border-emerald-500/20 animate-pulse bg-emerald-500/5"
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Custom SVG Skull component for reliability
const SkullSVG = () => (
    <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C7.58 2 4 5.58 4 10V12H6V16H8V12H6V10C6 6.69 8.69 4 12 4C15.31 4 18 6.69 18 10V12H16V16H18V12H20V10C20 5.58 16.42 2 12 2M9 19C9 19.55 9.45 20 10 20H14C14.55 20 15 19.55 15 19V17H9V19M7 10H9V12H7V10M15 10H17V12H15V10Z" />
    </svg>
);
