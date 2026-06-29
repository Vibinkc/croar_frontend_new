"use client";

/* eslint-disable react-hooks/set-state-in-effect --
   This overlay synchronises React state with live DOM measurements
   (getBoundingClientRect / element mount) inside layout effects — the canonical,
   intended use of an effect to sync with an external system (the DOM). */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useGuide } from "./GuideProvider";
import { TOUR_STEPS } from "./tourSteps";

const SPOTLIGHT_PAD = 8; // px of breathing room around the highlighted element
const GAP = 14; // px between the target and the tooltip
const TIP_WIDTH = 320;

/**
 * Full-screen coach-mark overlay. Dims the page, cuts a spotlight around the
 * current step's target (tracked live through resize/scroll), and anchors a
 * tooltip beside it. Dependency-free — just a portal + getBoundingClientRect.
 */
export function Tour() {
    const { tourActive, stepIndex, setStepIndex, endTour } = useGuide();
    const [mounted, setMounted] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const tipRef = useRef<HTMLDivElement>(null);

    useEffect(() => setMounted(true), []);

    const step = TOUR_STEPS[stepIndex];
    const isLast = stepIndex === TOUR_STEPS.length - 1;

    const measure = useCallback(() => {
        if (!step?.selector) {
            setRect(null);
            return;
        }
        const el = document.querySelector(step.selector) as HTMLElement | null;
        if (!el) {
            setRect(null);
            return;
        }
        el.scrollIntoView({ block: "nearest", inline: "nearest" });
        setRect(el.getBoundingClientRect());
    }, [step]);

    // Locate the target whenever the step changes or the tour (re)starts.
    useLayoutEffect(() => {
        if (tourActive) measure();
    }, [tourActive, stepIndex, measure]);

    // Keep the spotlight glued to its target through layout changes.
    useEffect(() => {
        if (!tourActive) return;
        const onChange = () => measure();
        window.addEventListener("resize", onChange);
        window.addEventListener("scroll", onChange, true);
        return () => {
            window.removeEventListener("resize", onChange);
            window.removeEventListener("scroll", onChange, true);
        };
    }, [tourActive, measure]);

    // Esc exits the tour.
    useEffect(() => {
        if (!tourActive) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") endTour();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [tourActive, endTour]);

    // Position the tooltip relative to the target (best-fit), clamped to the viewport.
    useLayoutEffect(() => {
        if (!tourActive) return;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const tip = tipRef.current;
        const tw = tip?.offsetWidth ?? TIP_WIDTH;
        const th = tip?.offsetHeight ?? 170;

        if (!rect) {
            setCoords({ top: vh / 2 - th / 2, left: vw / 2 - tw / 2 });
            return;
        }

        let place = step?.placement ?? "auto";
        if (place === "auto") {
            if (vw - rect.right > tw + GAP) place = "right";
            else if (rect.left > tw + GAP) place = "left";
            else if (vh - rect.bottom > th + GAP) place = "bottom";
            else place = "top";
        }

        let top = rect.top;
        let left = rect.left;
        switch (place) {
            case "right": left = rect.right + GAP; top = rect.top; break;
            case "left": left = rect.left - tw - GAP; top = rect.top; break;
            case "bottom": top = rect.bottom + GAP; left = rect.left; break;
            case "top": top = rect.top - th - GAP; left = rect.left; break;
            default: top = vh / 2 - th / 2; left = vw / 2 - tw / 2;
        }

        top = Math.min(Math.max(GAP, top), vh - th - GAP);
        left = Math.min(Math.max(GAP, left), vw - tw - GAP);
        setCoords({ top, left });
    }, [rect, tourActive, stepIndex, step]);

    if (!mounted || !tourActive || !step) return null;

    const next = () => (isLast ? endTour() : setStepIndex((i) => i + 1));
    const back = () => setStepIndex((i) => Math.max(0, i - 1));

    return createPortal(
        <div className="fixed inset-0 z-[1000]">
            {/* Click blocker. When there is no spotlight it also supplies the dim. */}
            <div className="absolute inset-0" style={{ background: rect ? "transparent" : "rgba(14,16,20,0.6)" }} />

            {/* Spotlight cut-out (the giant box-shadow dims everything except the hole). */}
            {rect && (
                <div
                    className="absolute rounded-[12px] transition-all duration-200 ease-out"
                    style={{
                        top: rect.top - SPOTLIGHT_PAD,
                        left: rect.left - SPOTLIGHT_PAD,
                        width: rect.width + SPOTLIGHT_PAD * 2,
                        height: rect.height + SPOTLIGHT_PAD * 2,
                        boxShadow: "0 0 0 9999px rgba(14,16,20,0.6)",
                        border: "2px solid #8B7DFF",
                    }}
                />
            )}

            {/* Tooltip */}
            <div
                ref={tipRef}
                role="dialog"
                aria-label="Product tour"
                className="absolute w-[320px] max-w-[calc(100vw-28px)] bg-white rounded-[14px] shadow-[0_18px_50px_rgba(15,23,42,0.28)] border border-[#E8EAED] p-5 z-[1002]"
                style={{ top: coords.top, left: coords.left }}
            >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                    <h3 className="text-[15px] font-bold text-[#15171C] leading-snug">{step.title}</h3>
                    <button
                        onClick={endTour}
                        aria-label="Close tour"
                        className="text-[#8A929E] hover:text-[#374151] transition-colors -mt-0.5 shrink-0"
                    >
                        <span className="material-symbols-rounded text-[20px]">close</span>
                    </button>
                </div>
                <p className="text-[13px] leading-relaxed text-[#374151]">{step.body}</p>

                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1.5">
                        {TOUR_STEPS.map((_, i) => (
                            <span
                                key={i}
                                className={`h-1.5 rounded-full transition-all ${i === stepIndex ? "w-4 bg-[#5B53E0]" : "w-1.5 bg-[#D8DBE0]"}`}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        {stepIndex > 0 && (
                            <button
                                onClick={back}
                                className="h-8 px-3 rounded-[8px] text-[12.5px] font-semibold text-[#6B6F76] hover:bg-[#F4F5F7] transition-colors"
                            >
                                Back
                            </button>
                        )}
                        <button
                            onClick={next}
                            className="h-8 px-4 rounded-[8px] text-[12.5px] font-semibold bg-[#5B53E0] text-white hover:bg-[#4A43C9] transition-colors"
                        >
                            {isLast ? "Done" : "Next"}
                        </button>
                    </div>
                </div>

                {!isLast && (
                    <button
                        onClick={endTour}
                        className="mt-2.5 text-[11.5px] font-medium text-[#9AA3AF] hover:text-[#6B6F76] transition-colors"
                    >
                        Skip tour
                    </button>
                )}
            </div>
        </div>,
        document.body
    );
}
