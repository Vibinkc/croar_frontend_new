"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useLocalStorage } from "./storage";

interface GuideContextValue {
    /** Whether the coach-mark tour is currently running. */
    tourActive: boolean;
    /** Current zero-based step index. */
    stepIndex: number;
    setStepIndex: React.Dispatch<React.SetStateAction<number>>;
    /** Start (or restart) the tour from the beginning. */
    startTour: () => void;
    /** Finish the tour and remember it was seen. */
    endTour: () => void;
    /** Whether the Help panel is open. */
    helpOpen: boolean;
    setHelpOpen: (open: boolean) => void;
    /** Whether the detailed guide book is open. */
    guideOpen: boolean;
    setGuideOpen: (open: boolean) => void;
}

const GuideContext = createContext<GuideContextValue | null>(null);

export function useGuide(): GuideContextValue {
    const ctx = useContext(GuideContext);
    if (!ctx) throw new Error("useGuide must be used within <GuideProvider>");
    return ctx;
}

const SEEN_KEY = "croar.guide.tourSeen.v1";

export function GuideProvider({ children }: { children: React.ReactNode }) {
    const [seen, setSeen, hydrated] = useLocalStorage<boolean>(SEEN_KEY, false);
    const [tourActive, setTourActive] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [helpOpen, setHelpOpen] = useState(false);
    const [guideOpen, setGuideOpen] = useState(false);

    // Auto-start the tour on the very first authenticated visit. Desktop only —
    // the dark sidebar (which the tour points at) is hidden behind a hamburger on
    // mobile, so a coach-mark tour there would highlight nothing.
    useEffect(() => {
        if (!hydrated || seen) return;
        if (typeof window === "undefined") return;
        if (!window.matchMedia("(min-width: 768px)").matches) return;
        const t = setTimeout(() => {
            setStepIndex(0);
            setTourActive(true);
        }, 800);
        return () => clearTimeout(t);
    }, [hydrated, seen]);

    const startTour = useCallback(() => {
        setHelpOpen(false);
        setStepIndex(0);
        setTourActive(true);
    }, []);

    const endTour = useCallback(() => {
        setTourActive(false);
        setSeen(true);
    }, [setSeen]);

    return (
        <GuideContext.Provider
            value={{ tourActive, stepIndex, setStepIndex, startTour, endTour, helpOpen, setHelpOpen, guideOpen, setGuideOpen }}
        >
            {children}
        </GuideContext.Provider>
    );
}
