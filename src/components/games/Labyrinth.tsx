import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
type TileType = 'EMPTY' | 'WALL' | 'ALIEN' | 'LASER_UP' | 'LASER_RIGHT' | 'LASER_DOWN' | 'LASER_LEFT' | 'REFLECTOR_FIXED' | 'SPLITTER_FIXED' | 'REFLECTOR_USER' | 'SPLITTER_USER';
type Direction = 'UP' | 'RIGHT' | 'DOWN' | 'LEFT';

interface LabyrinthProps {
    data: {
        grid: { type: TileType }[]; // 64 items
        inventory: {
            reflectors: number;
            splitters: number;
        };
        text?: string;
    };
    onComplete: (success: boolean, movesUsed: number) => void;
}

const DIRS: Record<Direction, { dx: number; dy: number }> = {
    UP: { dx: 0, dy: -1 },
    RIGHT: { dx: 1, dy: 0 },
    DOWN: { dx: 0, dy: 1 },
    LEFT: { dx: -1, dy: 0 }
};

const SPACE_WALLS = ['🚀', '🌌', '🛸', '🌙', '🪐'];

export default function Labyrinth({ data, onComplete }: LabyrinthProps) {
    const [grid, setGrid] = useState<{ type: TileType; rot: number }[]>([]);
    const [inventory, setInventory] = useState({ reflectors: 0, splitters: 0 });
    const [selectedTool, setSelectedTool] = useState<'REFLECTOR_USER' | 'SPLITTER_USER' | null>(null);
    const [laserPaths, setLaserPaths] = useState<{ x: number; y: number }[][]>([]);
    const [aliensDestroyed, setAliensDestroyed] = useState<number[]>([]); // indices
    const [isRunning, setIsRunning] = useState(false);
    const [gameStatus, setGameStatus] = useState<'PLAYING' | 'WON' | 'LOST'>('PLAYING');
    const [gameStarted, setGameStarted] = useState(false);

    // Initialize
    useEffect(() => {
        if (data) {
            console.log("[Labyrinth] Received data:", data);

            // Defensive check for data structure
            if (!data.grid || !Array.isArray(data.grid)) {
                console.error("[Labyrinth] Invalid data structure - missing or invalid grid:", data);
                // Provide a default empty grid
                const emptyGrid = new Array(64).fill(null).map(() => ({ type: 'EMPTY' as TileType, rot: 0 }));
                setTimeout(() => {
                    setGrid(emptyGrid);
                    setInventory({ reflectors: 0, splitters: 0 });
                }, 0);
                return;
            }

            // Parse grid
            const initialGrid = (data.grid || []).map(cell => ({
                type: (cell.type || 'EMPTY') as TileType,
                rot: 0 // Default rotation for user placement
            }));
            // If grid is empty/short, fill it
            while (initialGrid.length < 64) initialGrid.push({ type: 'EMPTY', rot: 0 });

            console.log("[Labyrinth] Initialized grid with", initialGrid.length, "cells");
            setTimeout(() => {
                setGrid(initialGrid);
                setInventory({
                    reflectors: data.inventory?.reflectors || 0,
                    splitters: data.inventory?.splitters || 0
                });
            }, 0);
            console.log("[Labyrinth] Inventory:", data.inventory);
        }
    }, [data]);

    // Helpers
    const getCell = (idx: number) => grid[idx];
    const getCoords = (idx: number) => ({ x: idx % 8, y: Math.floor(idx / 8) });
    const getIdx = (x: number, y: number) => y * 8 + x;

    const handleCellClick = (idx: number) => {
        if (isRunning || gameStatus !== 'PLAYING') return;

        const cell = grid[idx];

        // Remove existing user tool
        if (cell.type === 'REFLECTOR_USER') {
            const newGrid = [...grid];
            newGrid[idx] = { type: 'EMPTY', rot: 0 };
            setGrid(newGrid);
            setInventory(prev => ({ ...prev, reflectors: prev.reflectors + 1 }));
            return;
        }
        if (cell.type === 'SPLITTER_USER') {
            const newGrid = [...grid];
            newGrid[idx] = { type: 'EMPTY', rot: 0 };
            setGrid(newGrid);
            setInventory(prev => ({ ...prev, splitters: prev.splitters + 1 }));
            return;
        }

        // Place new tool
        if (cell.type === 'EMPTY' && selectedTool) {
            if (selectedTool === 'REFLECTOR_USER' && inventory.reflectors > 0) {
                const newGrid = [...grid];
                newGrid[idx] = { type: 'REFLECTOR_USER', rot: 0 }; // Default / (BottomLeft to TopRight)
                setGrid(newGrid);
                setInventory(prev => ({ ...prev, reflectors: prev.reflectors - 1 }));
                setSelectedTool(null); // Deselect after placing
            } else if (selectedTool === 'SPLITTER_USER' && inventory.splitters > 0) {
                const newGrid = [...grid];
                newGrid[idx] = { type: 'SPLITTER_USER', rot: 0 };
                setGrid(newGrid);
                setInventory(prev => ({ ...prev, splitters: prev.splitters - 1 }));
                setSelectedTool(null);
            }
        }
    };

    const handleRotate = (e: React.MouseEvent | React.KeyboardEvent, idx: number) => {
        e.stopPropagation();
        if (isRunning || gameStatus !== 'PLAYING') return;
        const cell = grid[idx];
        if (cell.type === 'REFLECTOR_USER' || cell.type === 'SPLITTER_USER') {
            const newGrid = [...grid];
            newGrid[idx].rot = (newGrid[idx].rot + 90) % 360;
            setGrid(newGrid);
        }
    };

    const containerRef = useRef<HTMLDivElement>(null);

    // Fullscreen Logic - Triggered by user gesture
    const handleLaunch = async () => {
        if (containerRef.current) {
            try {
                const el = containerRef.current as HTMLElement & {
                    webkitRequestFullscreen?: () => Promise<void>;
                    msRequestFullscreen?: () => Promise<void>;
                };
                if (el.requestFullscreen) {
                    await el.requestFullscreen();
                } else if (el.webkitRequestFullscreen) {
                    await el.webkitRequestFullscreen();
                } else if (el.msRequestFullscreen) {
                    await el.msRequestFullscreen();
                }
            } catch (err) {
                console.log("Fullscreen blocked or failed", err);
            }
        }
        setGameStarted(true);
    };

    // Cleanup: Exit Fullscreen on unmount
    useEffect(() => {
        return () => {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => { });
            }
        };
    }, []);

    // ... (rest of the existing logic)

    const runSimulation = () => {
        if (isRunning) {
            setIsRunning(false);
            setLaserPaths([]);
            setAliensDestroyed([]);
            return;
        }

        setIsRunning(true);

        const beams: { x: number; y: number; dir: Direction }[] = [];
        grid.forEach((cell, idx) => {
            if (cell.type.startsWith('LASER_')) {
                const dir = cell.type.split('_')[1] as Direction;
                const { x, y } = getCoords(idx);
                beams.push({ x, y, dir });
            }
        });

        const paths: { x: number; y: number }[][] = [];
        const destroyedAtStep: { idx: number; step: number }[] = [];
        const MAX_STEPS = 50;

        beams.forEach(startBeam => {
            const curr = { ...startBeam };
            const path = [{ x: curr.x, y: curr.y }];

            for (let step = 0; step < MAX_STEPS; step++) {
                const d = DIRS[curr.dir];
                const nextX = curr.x + d.dx;
                const nextY = curr.y + d.dy;

                if (nextX < 0 || nextX >= 8 || nextY < 0 || nextY >= 8) {
                    path.push({ x: nextX, y: nextY });
                    break;
                }

                const idx = getIdx(nextX, nextY);
                const cell = grid[idx];

                path.push({ x: nextX, y: nextY });
                curr.x = nextX;
                curr.y = nextY;

                if (cell.type === 'WALL') {
                    break;
                } else if (cell.type === 'ALIEN') {
                    destroyedAtStep.push({ idx, step: path.length });
                    break;
                } else if (cell.type === 'REFLECTOR_USER' || cell.type === 'REFLECTOR_FIXED') {
                    const isBackslash = (cell.rot === 90 || cell.rot === 270);
                    if (isBackslash) {
                        if (curr.dir === 'RIGHT') curr.dir = 'DOWN';
                        else if (curr.dir === 'DOWN') curr.dir = 'RIGHT';
                        else if (curr.dir === 'LEFT') curr.dir = 'UP';
                        else if (curr.dir === 'UP') curr.dir = 'LEFT';
                    } else {
                        if (curr.dir === 'RIGHT') curr.dir = 'UP';
                        else if (curr.dir === 'UP') curr.dir = 'RIGHT';
                        else if (curr.dir === 'LEFT') curr.dir = 'DOWN';
                        else if (curr.dir === 'DOWN') curr.dir = 'LEFT';
                    }
                } else if (cell.type === 'SPLITTER_USER' || cell.type === 'SPLITTER_FIXED') {
                    if (curr.dir === 'RIGHT' || curr.dir === 'LEFT') {
                        beams.push({ x: curr.x, y: curr.y, dir: 'UP' });
                        curr.dir = 'DOWN';
                    } else {
                        beams.push({ x: curr.x, y: curr.y, dir: 'LEFT' });
                        curr.dir = 'RIGHT';
                    }
                }
            }
            paths.push(path);
        });

        setLaserPaths(paths);

        // Sync destruction with the end of the 1s laser animation
        const ANIMATION_DURATION = 1000;
        setTimeout(() => {
            setAliensDestroyed(destroyedAtStep.map(d => d.idx));

            // Check Win after aliens are "destroyed"
            const totalAliens = grid.filter(c => c.type === 'ALIEN').length;
            const uniqueDestroyed = new Set(destroyedAtStep.map(d => d.idx));
            if (uniqueDestroyed.size === totalAliens && totalAliens > 0) {
                setGameStatus('WON');
                setTimeout(() => {
                    if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
                    onComplete(true, 0);
                }, 2000);
            }
        }, ANIMATION_DURATION);
    };

    return (
        <div ref={containerRef} className="flex flex-col md:flex-row h-full max-h-screen bg-[#0F172A] text-white font-sans overflow-hidden">

            {/* Sidebar / Controls */}
            <div className="w-full md:w-80 bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-6 z-10 shrink-0">
                <div className="space-y-2">
                    <h1 className="text-3xl font-black tracking-tighter text-indigo-400">SPATIAL</h1>
                    <p className="text-sm text-slate-400 font-medium">Laser Optimization Protocol</p>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <h3 className="text-xs font-black   text-slate-500 mb-3">Mission Objective</h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            {data.text || "Redirect the laser to eliminate all alien threats."}
                        </p>
                    </div>

                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-4">
                        <h3 className="text-xs font-black   text-slate-500">Tool Inventory</h3>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setSelectedTool(selectedTool === 'REFLECTOR_USER' ? null : 'REFLECTOR_USER')}
                                disabled={inventory.reflectors === 0}
                                className={`h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${selectedTool === 'REFLECTOR_USER' ? 'bg-indigo-600 border-indigo-400 shadow-lg shadow-indigo-900/50' : 'bg-slate-800 border-slate-700 hover:border-slate-600'} disabled:opacity-30 disabled:cursor-not-allowed`}
                            >
                                <span className="material-icons-outlined text-3xl rotate-45">change_history</span>
                                <div className="text-center leading-none">
                                    <span className="block text-xs font-bold ">Reflector</span>
                                    <span className="text-[10px] opacity-60">x{inventory.reflectors}</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setSelectedTool(selectedTool === 'SPLITTER_USER' ? null : 'SPLITTER_USER')}
                                disabled={inventory.splitters === 0}
                                className={`h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${selectedTool === 'SPLITTER_USER' ? 'bg-indigo-600 border-indigo-400 shadow-lg shadow-indigo-900/50' : 'bg-slate-800 border-slate-700 hover:border-slate-600'} disabled:opacity-30 disabled:cursor-not-allowed`}
                            >
                                <span className="material-icons-outlined text-3xl">alt_route</span>
                                <div className="text-center leading-none">
                                    <span className="block text-xs font-bold ">Splitter</span>
                                    <span className="text-[10px] opacity-60">x{inventory.splitters}</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-800">
                    <button
                        onClick={runSimulation}
                        className={`w-full py-4 rounded-xl text-sm font-black   transition-all shadow-lg ${isRunning ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-900/20' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-900/20'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <span className="material-icons-outlined">{isRunning ? 'stop' : 'play_arrow'}</span>
                            {isRunning ? 'Stop Simulation' : 'Fire Laser'}
                        </div>
                    </button>
                </div>
            </div>

            {/* Game Board */}
            <div className="flex-1 bg-slate-950 flex items-center justify-center p-8 overflow-auto relative">

                {/* Space Atmosphere: Moving Parallax Starfield & Nebula */}
                <style>{`
                    @keyframes star-move {
                        from { transform: translateY(0); }
                        to { transform: translateY(-500px); }
                    }
                    @keyframes nebula-pulse {
                        0%, 100% { opacity: 0.6; transform: scale(1); }
                        50% { opacity: 0.9; transform: scale(1.1); }
                    }
                    .star-layer {
                        position: absolute;
                        inset: -500px;
                        background-image: 
                            radial-gradient(2px 2px at 20px 30px, #ffffff, transparent),
                            radial-gradient(2px 2px at 150px 50px, #ffffff, transparent),
                            radial-gradient(2px 2px at 80px 180px, #ffffff, transparent),
                            radial-gradient(2px 2px at 250px 230px, #ffffff, transparent),
                            radial-gradient(2px 2px at 40px 250px, #ffffff, transparent);
                        background-size: 300px 300px;
                        animation: star-move 50s linear infinite;
                    }
                    .nebula-vibrant {
                        background: 
                            radial-gradient(circle at 30% 30%, rgba(79, 70, 229, 0.4) 0%, transparent 60%),
                            radial-gradient(circle at 70% 70%, rgba(16, 185, 129, 0.3) 0%, transparent 60%),
                            radial-gradient(circle at 50% 50%, rgba(244, 63, 94, 0.2) 0%, transparent 70%);
                        filter: blur(60px);
                        animation: nebula-pulse 25s ease-in-out infinite;
                    }
                `}</style>

                {/* Background Layers */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 nebula-vibrant opacity-70" />
                    <div className="star-layer opacity-80" />
                    <div className="star-layer opacity-50" style={{ animationDuration: '80s', animationDirection: 'reverse', backgroundSize: '400px 400px' }} />
                </div>

                {/* Board Container */}
                <div className="relative bg-slate-900/80 backdrop-blur-sm rounded-lg p-3 shadow-2xl shadow-black border border-indigo-500/20 w-full max-w-[85vh] aspect-square">
                    <div className="grid grid-cols-8 gap-1 w-full h-full">
                        {grid.map((cell, idx) => {
                            const { x, y } = getCoords(idx);
                            // Render Logic
                            const isWall = cell.type === 'WALL';
                            const isAlien = cell.type === 'ALIEN';
                            const isLaser = cell.type.startsWith('LASER');
                            const isReflector = cell.type.includes('REFLECTOR');
                            const isSplitter = cell.type.includes('SPLITTER');
                            const isDestroyed = aliensDestroyed.includes(idx);
                            const wallEmoji = SPACE_WALLS[idx % SPACE_WALLS.length];

                            return (
                                <div
                                    key={idx}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => handleCellClick(idx)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleCellClick(idx);
                                        }
                                    }}
                                    className={`relative rounded flex items-center justify-center transition-colors
                                        ${isWall ? 'bg-transparent' : 'bg-slate-900/50 hover:bg-slate-800/80'}
                                        ${(isReflector || isSplitter) ? 'cursor-pointer hover:brightness-110' : ''}
                                    `}
                                >
                                    {/* Grid Lines/Dots */}
                                    {!isWall && <div className="absolute w-1 h-1 bg-slate-800 rounded-full" />}

                                    {/* Content */}
                                    {isWall && (
                                        <div className="w-full h-full flex items-center justify-center text-3xl animate-pulse">
                                            {wallEmoji}
                                        </div>
                                    )}

                                    {isAlien && (
                                        <motion.div
                                            initial={{ scale: 0 }} animate={{ scale: isDestroyed ? 0 : 1 }}
                                            className="text-4xl text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                                        >
                                            <span className="material-icons-outlined text-4xl">smart_toy</span>
                                        </motion.div>
                                    )}

                                    {isLaser && (
                                        <div className={`w-10 h-10 bg-emerald-900/50 border border-emerald-500/50 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] ${cell.type === 'LASER_RIGHT' ? '' :
                                            cell.type === 'LASER_DOWN' ? 'rotate-90' :
                                                cell.type === 'LASER_LEFT' ? 'rotate-180' : '-rotate-90'
                                            }`}>
                                            <span className="material-icons-outlined text-emerald-400 text-2xl font-bold">flare</span>
                                        </div>
                                    )}

                                    {(isReflector || isSplitter) && (
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg relative"
                                            onClick={(e) => handleRotate(e, idx)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    handleRotate(e, idx);
                                                }
                                            }}
                                            style={{ transform: `rotate(${cell.rot}deg)`, transition: 'transform 0.2s' }}
                                        >
                                            <span className="material-icons-outlined text-white">
                                                {isReflector ? 'change_history' : 'alt_route'}
                                            </span>
                                            {/* Rotation Handle Hint */}
                                            {!isRunning && <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-300 rounded-full animate-pulse" />}
                                        </div>
                                    )}

                                </div>
                            );
                        })}
                    </div>

                    {/* Laser Layer (SVG Overlay) */}
                    <div className="absolute inset-0 z-10 pointer-events-none p-3"> {/* Exact match to board padding */}
                        <svg className="w-full h-full" viewBox="0 0 800 800" preserveAspectRatio="none">
                            <AnimatePresence>
                                {isRunning && laserPaths.map((path, pIdx) => (
                                    <motion.path
                                        key={pIdx}
                                        d={`M ${path.map(p => `${p.x * 100 + 50},${p.y * 100 + 50}`).join(' L ')}`}
                                        stroke="#10B981"
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        fill="none"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        transition={{ duration: 1, ease: 'linear' }}
                                        style={{ filter: 'drop-shadow(0 0 12px #10B981)' }}
                                    />
                                ))}
                            </AnimatePresence>
                        </svg>
                    </div>

                </div>

            </div>
            {/* Launch Mission Overlay (Browser security: Fullscreen requires user gesture) */}
            {!gameStarted && (
                <div className="absolute inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-6 text-center">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="max-w-md space-y-8"
                    >
                        <div className="space-y-4">
                            <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto border border-indigo-500/30">
                                <span className="material-icons-outlined text-4xl text-indigo-400 rotate-45">terrain</span>
                            </div>
                            <h2 className="text-4xl font-black tracking-tighter text-white  ">Spatial Protocol</h2>
                            <p className="text-slate-400 font-medium">Clear the sector of all robotic threats. Use laser redirection to hit hidden targets.</p>
                        </div>

                        <button
                            onClick={handleLaunch}
                            className="group relative px-12 py-5 bg-indigo-600 rounded-2xl text-lg font-black  tracking-[0.3em] overflow-hidden transition-all hover:bg-indigo-500 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(79,70,229,0.3)]"
                        >
                            <span className="relative z-10">Execute Mission</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
