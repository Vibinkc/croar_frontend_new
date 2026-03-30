import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EQQuestion {
    id: number;
    text: string;
    target: {
        emotion: string;
        visual_cue: string;
        imageUrl?: string;
    };
    options: { option: string; index: number }[];
    correct_index: number;
}

interface EmpathyScannerProps {
    data: EQQuestion[];
    onComplete: (success: boolean, score: number) => void;
}

export default function EmpathyScanner({ data, onComplete }: EmpathyScannerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isScanning, setIsScanning] = useState(true);
    const [showFinalResult, setShowFinalResult] = useState(false);
    const [score, setScore] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);

    const currentQuestion = data[currentIndex];

    useEffect(() => {
        if (gameStarted && !showFinalResult) {
            setIsScanning(true);
            const timer = setTimeout(() => setIsScanning(false), 2500);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, gameStarted, showFinalResult]);

    const handleSelect = (index: number) => {
        if (selectedOption !== null || isScanning) return;
        setSelectedOption(index);

        const isCorrect = index === currentQuestion.correct_index;
        if (isCorrect) setScore(prev => prev + 1);

        setTimeout(() => {
            if (currentIndex < data.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setSelectedOption(null);
            } else {
                setShowFinalResult(true);
                const finalPercent = Math.round(((score + (isCorrect ? 1 : 0)) / data.length) * 100);
                setTimeout(() => onComplete(true, finalPercent), 3000);
            }
        }, 1500);
    };

    if (!gameStarted) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-[#0F172A] text-white p-8 text-center relative overflow-hidden">
                {/* Background Space Effect */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.2)_0%,transparent_70%)]" />
                </div>

                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md space-y-12 z-10">
                    <div className="space-y-6">
                        <div className="w-24 h-24 bg-indigo-500/20 rounded-3xl flex items-center justify-center mx-auto border border-indigo-500/30 rotate-12">
                            <span className="material-icons-outlined text-5xl text-indigo-400 -rotate-12">psychology</span>
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-5xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500">
                                Emotional IQ
                            </h1>
                            <p className="text-indigo-300/60 font-medium tracking-[0.2em] uppercase text-xs">Tactical Intelligence Protocol</p>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Communications Officer: Analyze pilot holographic transmissions and identify micro-expressions to determine their true emotional state under pressure.
                        </p>
                    </div>

                    <button
                        onClick={() => setGameStarted(true)}
                        className="group relative px-12 py-5 bg-indigo-600 rounded-2xl text-lg font-black uppercase tracking-widest overflow-hidden transition-all hover:bg-slate-500 hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(79,70,229,0.3)]"
                    >
                        <span className="relative z-10">Initialize Scan</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    </button>
                </motion.div>
            </div>
        );
    }

    if (showFinalResult) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-[#0F172A] text-white p-8 text-center">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="text-6xl mb-4">🛸</div>
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter">Mission Complete</h2>
                    <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-3xl p-8 backdrop-blur-xl">
                        <p className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-2">Protocol Effectiveness</p>
                        <div className="text-7xl font-black text-indigo-400 tracking-tighter">
                            {Math.round((score / data.length) * 100)}%
                        </div>
                        <p className="text-indigo-300/60 mt-4 font-medium italic">"Empathy is the ultimate tactical advantage."</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#020617] text-white font-sans overflow-hidden">
            {/* Header/Status Bar */}
            <div className="h-16 px-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md z-20">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Live Link</span>
                    </div>
                    <div className="h-4 w-[1px] bg-slate-800" />
                    <span className="text-xs font-bold text-slate-400 italic">Pilot Log #{currentQuestion.id}</span>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest leading-none">Scans Remaining</p>
                        <p className="text-xs font-bold text-indigo-400">{data.length - currentIndex}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest leading-none">Accuracy</p>
                        <p className="text-xs font-bold text-indigo-400">{currentIndex === 0 ? 100 : Math.round((score / currentIndex) * 100)}%</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row p-6 lg:p-12 gap-12 items-center justify-center relative">

                {/* Visual Analysis Area */}
                <div className="flex-1 max-w-2xl w-full aspect-square relative group">
                    <div className="absolute inset-0 bg-indigo-500/5 rounded-[3rem] border border-indigo-500/20 backdrop-blur-3xl overflow-hidden shadow-2xl shadow-indigo-900/20">
                        {/* Placeholder Hologram Face - We'll simulate with an avatar or stylized image */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative w-full h-full p-6">
                                <div className="w-full h-full rounded-[2rem] bg-gradient-to-b from-indigo-900/40 to-slate-900/80 border border-indigo-500/20 flex flex-col items-center justify-center text-center p-8 overflow-hidden relative">
                                    {currentQuestion.target.imageUrl ? (
                                        <motion.img
                                            initial={{ opacity: 0, scale: 1.1 }}
                                            animate={{ opacity: isScanning ? 0.3 : 0.8, scale: 1 }}
                                            transition={{ duration: 1.5 }}
                                            src={currentQuestion.target.imageUrl}
                                            alt="Holographic Portrait"
                                            className="absolute inset-0 w-full h-full object-cover mix-blend-screen"
                                        />
                                    ) : (
                                        <motion.span
                                            animate={{
                                                scale: [1, 1.05, 1],
                                                opacity: [0.6, 0.8, 0.6]
                                            }}
                                            transition={{ duration: 4, repeat: Infinity }}
                                            className="material-icons-outlined text-[120px] text-indigo-400/30 mb-4"
                                        >
                                            account_circle
                                        </motion.span>
                                    )}
                                    <div className="relative z-10 mt-auto">
                                        <p className="text-xs font-mono text-indigo-400/50 uppercase tracking-[0.3em]">Holographic Link Active</p>
                                        {/* Visual cue hidden from student to force image analysis */}
                                        {/* <p className="text-[10px] font-mono text-slate-500 mt-2">{currentQuestion.target.visual_cue}</p> */}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Scanner Bar */}
                        <AnimatePresence>
                            {isScanning && (
                                <motion.div
                                    initial={{ top: '-10%' }}
                                    animate={{ top: '110%' }}
                                    transition={{ duration: 2.5, ease: "linear" }}
                                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent z-10 shadow-[0_0_15px_rgba(34,211,238,0.8)]"
                                >
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-cyan-500 text-[8px] font-black text-black rounded uppercase tracking-tighter">
                                        Analyzing Micro-Expressions
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Scan Grid Overlay */}
                        <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(79, 70, 229, 0.2) 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                        {/* Corner Accents */}
                        <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-indigo-500/40 rounded-tl-lg" />
                        <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-indigo-500/40 rounded-tr-lg" />
                        <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-indigo-500/40 rounded-bl-lg" />
                        <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-indigo-500/40 rounded-br-lg" />
                    </div>
                </div>

                {/* Interaction Area */}
                <div className="w-full md:w-[400px] flex flex-col gap-8 flex-shrink-0 relative z-20">
                    <div className="space-y-4">
                        <div className="inline-block px-3 py-1 bg-indigo-500/20 rounded-full border border-indigo-500/30">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Situation Log</p>
                        </div>
                        <h2 className="text-xl font-bold italic leading-relaxed text-slate-100">
                            "{currentQuestion.text}"
                        </h2>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Determine Emotional Profile</p>
                        <div className="grid grid-cols-1 gap-3">
                            {currentQuestion.options.map((opt, i) => {
                                const isSelected = selectedOption === i;
                                const isCorrect = selectedOption !== null && i === currentQuestion.correct_index;
                                const isWrong = selectedOption !== null && isSelected && i !== currentQuestion.correct_index;

                                return (
                                    <button
                                        key={opt.index}
                                        disabled={selectedOption !== null || isScanning}
                                        onClick={() => handleSelect(i)}
                                        className={`group relative p-5 rounded-2xl border-2 text-left transition-all 
                                            ${selectedOption === null && !isScanning ? 'hover:scale-[1.02] hover:shadow-xl' : ''}
                                            ${isSelected ? 'scale-[1.02]' : ''}
                                            ${isCorrect ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-100' :
                                                isWrong ? 'bg-rose-500/20 border-rose-500/50 text-rose-100' :
                                                    'bg-slate-900 border-slate-800 text-slate-300'
                                            }
                                            disabled:cursor-default
                                        `}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-black uppercase tracking-widest text-sm">{opt.option}</span>
                                            {isCorrect && <span className="material-icons-outlined text-emerald-400">check_circle</span>}
                                            {isWrong && <span className="material-icons-outlined text-rose-400">cancel</span>}
                                        </div>

                                        {/* Hover Effect Light */}
                                        <div className="absolute inset-0 bg-indigo-400/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity pointer-events-none" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <p className="text-[10px] text-slate-500 font-medium italic">
                        Scanning for facial cues... {isScanning ? 'Active' : 'Complete'}
                    </p>
                </div>

            </div>

            {/* Decorative Grid Background for whole page */}
            <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,#1e1b4b_0%,transparent_100%)] opacity-30" />
        </div>
    );
}
