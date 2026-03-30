"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import AILoadingText from "./AILoadingText";

interface AIGenerationOverlayProps {
    isOpen: boolean;
    title?: string;
}

export default function AIGenerationOverlay({ isOpen, title = "Generating Content" }: AIGenerationOverlayProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="text-center space-y-6 p-12 max-w-lg mx-auto">
                <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="material-icons-outlined text-4xl text-slate-800 animate-pulse">auto_awesome</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{title}</h3>
                    <div className="h-8"> {/* Fixed height to prevent layout shift */}
                        <AILoadingText className="text-slate-500 font-medium text-lg italic" />
                    </div>
                </div>

                <div className="pt-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        This might take a few seconds
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
}
