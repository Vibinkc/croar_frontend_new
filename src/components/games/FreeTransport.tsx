import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Ship {
    id: number;
    text: string;
    file_type?: 'BROWN' | 'RED' | 'BLUE';
    capacity: number;
    risk_factor: number;
}

interface FreeTransportProps {
    questions: Ship[];
    onComplete: (score: number, answers: any[]) => void;
}

export default function FreeTransport({ questions, onComplete }: FreeTransportProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentLoad, setCurrentLoad] = useState(0);
    const [totalScore, setTotalScore] = useState(0);
    const [gameState, setGameState] = useState<'INTRO' | 'LOADING' | 'SAILING' | 'SINKING' | 'RESULT'>('INTRO');
    const [answers, setAnswers] = useState<any[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentShip = questions[currentIndex];

    // Enter full screen on start
    const handleStart = async () => {
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
        setGameState('LOADING');
    };

    useEffect(() => {
        console.log("FreeTransport Questions:", questions);
        console.log("Current Ship:", currentShip);
    }, [questions, currentIndex]);

    // Unified Ship Design (No Color Cues)
    const shipColor = '#8B4513'; // Standard Brown
    const shipAccent = '#DAA520'; // Standard Gold Accent

    const handleDeliver = () => {
        if (gameState !== 'LOADING') return;

        if (currentLoad > currentShip.capacity) {
            setGameState('SINKING');
            setTimeout(() => nextShip(0, 'SINKED'), 2500);
        } else {
            setGameState('SAILING');
            // Bonus for perfect or near-perfect load
            let roundScore = currentLoad;
            if (currentLoad === currentShip.capacity) roundScore += 5; // Perfect match bonus

            setTimeout(() => nextShip(roundScore, 'SAFE'), 2500);
        }
    };

    const nextShip = (score: number, outcome: 'SAFE' | 'SINKED') => {
        const newAnswers = [...answers, {
            question_id: currentShip.id,
            load: currentLoad,
            limit: currentShip.capacity,
            outcome
        }];
        setAnswers(newAnswers);
        setTotalScore(prev => prev + score);

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setCurrentLoad(0);
            setGameState('LOADING');
        } else {
            onComplete(totalScore + score, newAnswers);
        }
    };

    return (
        <div ref={containerRef} className="relative w-full h-screen bg-sky-300 overflow-hidden flex flex-col items-center justify-center font-sans select-none fixed inset-0 z-[9999]">
            {/* Sky & Clouds */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-400 to-sky-100 z-0" />
            <motion.div
                className="absolute top-10 left-10 w-32 h-16 bg-white rounded-full opacity-80 blur-xl"
                animate={{ x: [0, 50, 0] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />

            {gameState === 'INTRO' && (
                <div className="relative z-50 max-w-2xl w-full bg-white/90 backdrop-blur-xl rounded-[3rem] p-12 text-center shadow-2xl border-4 border-white">
                    <div className="mb-8 flex justify-center">
                        <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center border-4 border-indigo-50 text-indigo-600">
                            <span className="material-icons-outlined text-5xl">sailing</span>
                        </div>
                    </div>

                    <h1 className="text-4xl font-black text-slate-900 mb-2  tracking-tight">Risk Protocol</h1>
                    <p className="text-slate-500 font-medium mb-10">Optimize cargo logistics under uncertainty.</p>

                    <div className="grid grid-cols-1 gap-6 mb-12 text-left">
                        <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-6">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-sm">
                                ⚖️
                            </div>
                            <div>
                                <h3 className="font-black text-indigo-900 text-sm   mb-1">Hidden Capacities</h3>
                                <p className="text-xs text-indigo-800 font-medium">Each ship has a secret cargo limit.</p>
                                <p className="text-[10px] text-indigo-600 mt-1">Ranges vary from <span className="font-bold">4 to 12 tons</span>. Use your intuition!</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-slate-500 mb-8 max-w-md mx-auto">Load as much cargo as possible. If you exceed the hidden limit, the ship sinks and you get 0 points.</p>

                    <button
                        onClick={handleStart}
                        className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-sm font-black  tracking-[0.3em] hover:bg-indigo-700 hover:scale-[1.02] transition-all shadow-xl shadow-indigo-200"
                    >
                        Initialize Simulation
                    </button>
                </div>
            )}

            {gameState !== 'INTRO' && (
                <>
                    {/* Stats HUD */}
                    <div className="absolute top-8 left-8 z-50 flex gap-4">
                        <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl border-2 border-indigo-100">
                            <p className="text-[10px] font-black text-indigo-400   mb-1">Score</p>
                            <p className="text-3xl font-black text-indigo-900">{totalScore}</p>
                        </div>
                    </div>

                    <div className="absolute top-8 right-8 z-50 bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl border-2 border-indigo-100">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400   mb-1">Fleet Status</p>
                            <p className="text-2xl font-black text-slate-700">{currentIndex + 1} <span className="text-lg text-slate-300">/ {questions.length}</span></p>
                        </div>
                    </div>


                    {/* Game Area */}
                    <div className="relative z-40 flex flex-col items-center justify-center w-full max-w-4xl h-[700px]">

                        {/* Visual Feedback Text */}
                        <div className="h-16 flex items-center justify-center mb-4">
                            <AnimatePresence>
                                {gameState === 'SINKING' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="px-6 py-2 bg-rose-500 text-white rounded-xl font-black   shadow-xl shadow-rose-200"
                                    >
                                        Overload! Ship Lost!
                                    </motion.div>
                                )}
                                {gameState === 'SAILING' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-black   shadow-xl shadow-emerald-200"
                                    >
                                        Safe Voyage! Cargo Delivered.
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Ship */}
                        <div className="relative w-full h-80 flex items-end justify-center mb-8">
                            <AnimatePresence mode='wait'>
                                {gameState === 'SINKING' ? (
                                    <motion.div
                                        key="sinking"
                                        initial={{ y: 0, rotate: 0 }}
                                        animate={{ y: 300, rotate: -25, opacity: 0 }}
                                        transition={{ duration: 2, ease: "anticipate" }}
                                        className="relative z-20"
                                    >
                                        <ShipSVG color={shipColor} accent={shipAccent} />
                                    </motion.div>
                                ) : gameState === 'SAILING' ? (
                                    <motion.div
                                        key="sailing"
                                        initial={{ x: 0 }}
                                        animate={{ x: 1000 }}
                                        transition={{ duration: 2, ease: "backIn" }}
                                        className="relative z-20"
                                    >
                                        <ShipSVG color={shipColor} accent={shipAccent} />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="loading"
                                        animate={{ y: [0, 8, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        className="relative z-20"
                                    >
                                        <ShipSVG color={shipColor} accent={shipAccent} />

                                        {/* Cargo Stack Visualization */}
                                        <div className="absolute bottom-[40px] left-1/2 -translate-x-1/2 w-32 flex flex-col-reverse items-center justify-start gap-1 h-32 pointer-events-none">
                                            {Array.from({ length: currentLoad }).map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ y: -50, opacity: 0, scale: 0.5 }}
                                                    animate={{ y: 0, opacity: 1, scale: 1 }}
                                                    className="w-16 h-3 bg-amber-800 border-t border-amber-600 rounded-sm shadow-sm"
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Controls - Slider & Button */}
                        <div className="relative z-50 w-full max-w-md bg-white/50 backdrop-blur-xl p-8 rounded-[2rem] border border-white/40 shadow-2xl flex flex-col items-center gap-6">

                            <div className="w-full">
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-xs font-black text-slate-500  ">Cargo Load</span>
                                    <span className="text-4xl font-black text-slate-800">{currentLoad} <span className="text-lg text-slate-400 font-bold">tons</span></span>
                                </div>

                                <input
                                    type="range"
                                    min="0"
                                    max="15"
                                    step="1"
                                    value={currentLoad}
                                    onChange={(e) => gameState === 'LOADING' && setCurrentLoad(Number(e.target.value))}
                                    className="w-full h-4 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={gameState !== 'LOADING'}
                                />
                                <div className="flex justify-between mt-2 px-1">
                                    <span className="text-[10px] font-bold text-slate-400">0</span>
                                    <span className="text-[10px] font-bold text-slate-400">5</span>
                                    <span className="text-[10px] font-bold text-slate-400">10</span>
                                    <span className="text-[10px] font-bold text-slate-400">15+</span>
                                </div>
                            </div>

                            <button
                                onClick={handleDeliver}
                                disabled={gameState !== 'LOADING' || currentLoad === 0}
                                className="w-full py-4 bg-indigo-600 text-white rounded-xl text-sm font-black  tracking-[0.2em] hover:bg-indigo-500 hover:-translate-y-1 active:translate-y-0 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50 disabled:transform-none disabled:shadow-none flex items-center justify-center gap-3"
                            >
                                <span className="material-icons-outlined text-xl">anchor</span>
                                Approve for Departure
                            </button>
                        </div>

                    </div>

                </>
            )}

            {/* Ocean Layers */}
            <div className="absolute bottom-0 w-full h-72 overflow-hidden z-30 pointer-events-none">
                <motion.div
                    className="absolute bottom-0 w-[200%] h-72 bg-[#0284c7] opacity-90"
                    style={{ borderRadius: "40% 40% 0 0" }}
                    animate={{ x: ["-50%", "0%"] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
            </div>
            <div className="absolute bottom-0 w-full h-96 overflow-hidden z-10 pointer-events-none">
                <motion.div
                    className="absolute bottom-0 w-[200%] h-96 bg-[#38bdf8] opacity-80"
                    style={{ borderRadius: "45% 45% 0 0" }}
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                />
            </div>
        </div>
    );
}

function ShipSVG({ color, accent }: { color: string, accent: string }) {
    return (
        <svg width="240" height="180" viewBox="0 0 200 150" className="drop-shadow-2xl">
            {/* Hull */}
            <path d="M20,100 Q100,160 180,100 L170,60 L30,60 Z" fill={color} stroke="#00000030" strokeWidth="2" />
            {/* Deck Detail */}
            <path d="M30,60 L170,60 L165,55 L35,55 Z" fill="#00000020" />
            {/* Cabin */}
            <rect x="110" y="20" width="40" height="40" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="2" />
            <rect x="118" y="28" width="10" height="10" fill="#bae6fd" />
            <rect x="132" y="28" width="10" height="10" fill="#bae6fd" />
            {/* Mast */}
            <rect x="90" y="10" width="6" height="50" fill={accent} />
            {/* Flag */}
            <path d="M96,12 L130,22 L96,32 Z" fill="#ef4444" />
        </svg>
    )
}
