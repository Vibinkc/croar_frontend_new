"use client";

import React from 'react';

interface Line {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

interface Pattern {
    lines: Line[];
}

interface SpotOnQuestionEditorProps {
    target: any; // Could be { lines: Line[] } or just Line[]
    options: any[];
    correctIndex: number;
    onUpdate: (data: any) => void;
}

export default function SpotOnQuestionEditor({ target, options, correctIndex, onUpdate }: SpotOnQuestionEditorProps) {
    const renderPattern = (lines: Line[], size: number = 100) => {
        if (!Array.isArray(lines)) return null;
        return (
            <svg viewBox="0 0 100 100" className="w-full h-full" style={{ maxWidth: size, maxHeight: size }}>
                <circle cx="50" cy="50" r="48" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                {lines.map((line, i) => (
                    <line
                        key={i}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="#1e293b"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                ))}
            </svg>
        );
    };

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Question Preview</h3>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase">Type: Spot On</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Target Pattern */}
                <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Target Pattern</span>
                    <div className="w-32 h-32 bg-white rounded-full p-4 shadow-sm border border-slate-200 flex items-center justify-center">
                        {renderPattern(Array.isArray(target) ? target : target?.lines)}
                    </div>
                </div>

                {/* Options Grid */}
                <div className="space-y-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Options</span>
                    <div className="grid grid-cols-2 gap-4">
                        {options?.map((opt, idx) => {
                            const lines = Array.isArray(opt) ? opt : opt?.lines;
                            return (
                                <div
                                    key={idx}
                                    className={`relative p-4 rounded-xl border-2 flex items-center justify-center transition-all ${idx === correctIndex
                                        ? 'border-gray-500 bg-gray-50/50'
                                        : 'border-slate-100 bg-white'
                                        }`}
                                >
                                    <div className="w-16 h-16">
                                        {renderPattern(lines)}
                                    </div>
                                    <div className={`absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${idx === correctIndex ? 'bg-gray-500 text-white' : 'bg-slate-200 text-slate-500'
                                        }`}>
                                        {idx + 1}
                                    </div>
                                    {idx === correctIndex && (
                                        <span className="absolute -bottom-2 px-2 py-0.5 bg-gray-500 text-white text-[8px] font-black rounded uppercase">Correct</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
