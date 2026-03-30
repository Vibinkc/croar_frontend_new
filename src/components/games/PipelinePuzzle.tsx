"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Pipe {
    r: number;
    c: number;
    type: 'STRAIGHT' | 'CURVE' | 'EMPTY';
    rotation: number; // 0, 90, 180, 270
    isFixed?: boolean;
    nodeType: 'START' | 'END' | 'PIPE';
    isActive?: boolean;
}

interface PipelinePuzzleProps {
    level: {
        text: string;
        grid: Pipe[];
        rows: number;
        cols: number;
    };
    onComplete: (score: number) => void;
}

const PipelinePuzzle: React.FC<PipelinePuzzleProps> = ({ level, onComplete }) => {
    const [grid, setGrid] = useState<Pipe[]>([]);
    const [isWon, setIsWon] = useState(false);
    const [moves, setMoves] = useState(0);

    // Initialize grid
    useEffect(() => {
        if (level && level.grid) {
            setGrid(level.grid.map(p => ({
                ...p,
                isActive: false,
                // Ensure Start/End nodes are always rotatable in the frontend
                isFixed: p.nodeType === 'PIPE' ? p.isFixed : false
            })));
        }
    }, [level]);

    // Connection Ports mapping based on type and rotation
    const getPorts = (pipe: Pipe) => {
        const r = pipe.rotation % 360;

        // Start and End nodes always have exactly ONE connection point
        if (pipe.nodeType !== 'PIPE') {
            if (r === 0) return ['top'];
            if (r === 90) return ['right'];
            if (r === 180) return ['bottom'];
            if (r === 270) return ['left'];
        }

        if (pipe.type === 'STRAIGHT') {
            return r === 0 || r === 180 ? ['top', 'bottom'] : ['left', 'right'];
        }
        if (pipe.type === 'CURVE') {
            if (r === 0) return ['top', 'right'];
            if (r === 90) return ['right', 'bottom'];
            if (r === 180) return ['bottom', 'left'];
            if (r === 270) return ['left', 'top'];
        }
        return [];
    };

    // Pathfinding to check connectivity and update active pipes
    useEffect(() => {
        if (grid.length === 0) return;

        const startNode = grid.find(p => p.nodeType === 'START');
        if (!startNode) return;

        const activeSet = new Set<string>();
        const queue: Pipe[] = [startNode];
        const visited = new Set<string>();

        while (queue.length > 0) {
            const curr = queue.shift()!;
            const key = `${curr.r},${curr.c}`;
            if (visited.has(key)) continue;
            visited.add(key);
            activeSet.add(key);

            const currPorts = getPorts(curr);

            // Check neighbors
            const neighbors = [
                { r: curr.r - 1, c: curr.c, port: 'top', opposite: 'bottom' },
                { r: curr.r + 1, c: curr.c, port: 'bottom', opposite: 'top' },
                { r: curr.r, c: curr.c - 1, port: 'left', opposite: 'right' },
                { r: curr.r, c: curr.c + 1, port: 'right', opposite: 'left' },
            ];

            for (const n of neighbors) {
                if (currPorts.includes(n.port)) {
                    const neighborNode = grid.find(p => p.r === n.r && p.c === n.c);
                    if (neighborNode) {
                        const nPorts = getPorts(neighborNode);
                        if (nPorts.includes(n.opposite)) {
                            queue.push(neighborNode);
                        }
                    }
                }
            }
        }

        // Update active status
        const nextGrid = grid.map(p => ({
            ...p,
            isActive: activeSet.has(`${p.r},${p.c}`)
        }));

        // Check win condition
        const endNodeActive = nextGrid.find(p => p.nodeType === 'END')?.isActive;

        if (JSON.stringify(nextGrid) !== JSON.stringify(grid)) {
            setGrid(nextGrid);
        }

        if (endNodeActive && !isWon) {
            setIsWon(true);
            setTimeout(() => onComplete(Math.max(1, 10 - Math.floor(moves / 5))), 2000);
        }
    }, [grid, moves]);

    const handleRotate = (r: number, c: number) => {
        if (isWon) return;
        setGrid(prev => prev.map(p => {
            if (p.r === r && p.c === c && !p.isFixed) {
                return { ...p, rotation: (p.rotation + 90) % 360 };
            }
            return p;
        }));
        setMoves(m => m + 1);
    };

    return (
        <div className="relative w-full min-h-screen flex flex-col items-center justify-center bg-[#0a0a1a] overflow-hidden font-sans p-6 text-white">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 overflow-hidden opacity-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-600/20 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 blur-[120px] rounded-full animate-pulse gap-delay-2000" />
            </div>

            {/* HUD Header */}
            <div className="relative z-10 p-8 text-center">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-block px-4 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[9px] font-black uppercase tracking-[0.3em] mb-4"
                >
                    Bio-Link Calibration
                </motion.div>
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2 italic">
                    Neural <span className="text-teal-400">Flow</span>
                </h1>
                <p className="text-slate-400 text-[11px] max-w-sm mx-auto font-bold uppercase tracking-widest opacity-60">
                    {level.text}
                </p>
            </div>

            {/* Grid Area - Wrapped for centering */}
            <div className="flex-1 flex items-center justify-center w-full z-10 px-4">
                <div
                    className="p-5 rounded-[2.5rem] bg-slate-900/60 border border-white/5 backdrop-blur-3xl shadow-2xl"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${level.cols || 6}, clamp(40px, 10vmin, 60px))`,
                        gridTemplateRows: `repeat(${level.rows || 6}, clamp(40px, 10vmin, 60px))`,
                        gap: '12px'
                    }}
                >
                    {grid.map((pipe, idx) => (
                        <motion.div
                            key={`${pipe.r}-${pipe.c}`}
                            whileHover={!pipe.isFixed && !isWon ? { scale: 1.05, zIndex: 10 } : {}}
                            whileTap={!pipe.isFixed && !isWon ? { scale: 0.95 } : {}}
                            onClick={() => handleRotate(pipe.r, pipe.c)}
                            className={`relative w-full aspect-square rounded-lg border transition-all duration-300 cursor-pointer overflow-hidden
                                ${pipe.nodeType !== 'PIPE' ? 'bg-[#3d4451] border-white/10' : 'bg-[#4fd1c5] border-[#4fd1c5]'}
                                ${pipe.isActive && pipe.nodeType === 'PIPE' ? 'shadow-[0_0_15px_rgba(255,255,255,0.3)]' : ''}
                            `}
                        >
                            <motion.svg
                                viewBox="0 0 100 100"
                                animate={{ rotate: pipe.rotation }}
                                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                className="w-full h-full"
                            >
                                {/* SVG Pipe Definitions centered in the lane */}
                                {pipe.nodeType === 'PIPE' ? (
                                    <>
                                        {pipe.type === 'STRAIGHT' && (
                                            <line
                                                x1="50" y1="0" x2="50" y2="100"
                                                stroke="white"
                                                strokeWidth="28"
                                                strokeLinecap="butt"
                                                className={`transition-all duration-500 ${pipe.isActive ? 'stroke-[34] opacity-100' : 'opacity-80'}`}
                                            />
                                        )}
                                        {pipe.type === 'CURVE' && (
                                            <path
                                                d="M 50 0 L 50 50 L 100 50"
                                                fill="none"
                                                stroke="white"
                                                strokeWidth="28"
                                                strokeLinejoin="round"
                                                strokeLinecap="round"
                                                className={`transition-all duration-500 ${pipe.isActive ? 'stroke-[34] opacity-100' : 'opacity-80'}`}
                                            />
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {/* Terminal Node: Exactly one connection stub */}
                                        <line
                                            x1="50" y1="0" x2="50" y2="50"
                                            stroke="white"
                                            strokeWidth="28"
                                            strokeLinecap="butt"
                                            className={`transition-all duration-500 ${pipe.isActive ? 'stroke-[34] opacity-100' : 'opacity-80'}`}
                                        />
                                        <circle cx="50" cy="50" r="22" fill="white" className="drop-shadow-sm" />
                                    </>
                                )}
                            </motion.svg>

                            {/* Glow effect for active pipes */}
                            {pipe.isActive && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-0 bg-white pointer-events-none"
                                />
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* HUD Footer */}
            <div className="relative z-10 pb-12 flex gap-12 items-center">
                <div className="text-center">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1 block">Entropy_Moves</span>
                    <span className="text-2xl font-black text-white tracking-widest leading-none">{moves}</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1 block">Link_Stability</span>
                    <span className={`text-2xl font-black uppercase tracking-widest leading-none ${isWon ? 'text-teal-400 animate-pulse' : 'text-slate-300'}`}>
                        {isWon ? '100%' : 'CALC'}
                    </span>
                </div>
            </div>

            {/* Win Overlay */}
            <AnimatePresence>
                {isWon && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center"
                        >
                            <h2 className="text-6xl font-black text-white uppercase tracking-tighter italic mb-2">
                                Link <span className="text-teal-400">Locked</span>
                            </h2>
                            <p className="text-[10px] text-teal-400/60 font-black uppercase tracking-[0.5em]">
                                Synchronizing Neural Pathway...
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PipelinePuzzle;
