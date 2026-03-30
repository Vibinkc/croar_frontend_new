"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
    {
        id: "dashboard",
        image: "/hero-sequence/dashboard.png",
        cursorStart: { x: "85%", y: "65%" },
        cursorEnd: { x: "5%", y: "25%" }, // "Aptitude" sidebar is roughly here
        duration: 2000,
    },
    {
        id: "aptitude",
        image: "/hero-sequence/aptitude.png",
        cursorStart: { x: "5%", y: "25%" },
        cursorEnd: { x: "5%", y: "35%" }, // "Communication" sidebar, slightly lower
        duration: 2000,
    },
    {
        id: "communication",
        image: "/hero-sequence/communication.png",
        cursorStart: { x: "5%", y: "35%" },
        cursorEnd: { x: "5%", y: "45%" }, // "Coding" sidebar, slightly lower
        duration: 2000,
    },
    {
        id: "coding",
        image: "/hero-sequence/coding.png",
        cursorStart: { x: "5%", y: "45%" },
        cursorEnd: { x: "5%", y: "45%" }, // Stay
        duration: 3000,
    },
];

export default function HeroSequence() {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        let timeout: NodeJS.Timeout;

        const runSequence = () => {
            const step = steps[currentStep];
            const transitionDelay = step.duration;

            timeout = setTimeout(() => {
                if (currentStep < steps.length - 1) {
                    setCurrentStep((prev) => prev + 1);
                } else {
                    setCurrentStep(0);
                }
            }, transitionDelay);
        };

        runSequence();

        return () => clearTimeout(timeout);
    }, [currentStep]);

    const step = steps[currentStep];

    return (
        <div className="relative w-full h-full bg-slate-100 dark:bg-slate-900 overflow-hidden rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 aspect-[21/9] select-none">
            <AnimatePresence mode="wait">
                <motion.img
                    key={step.id}
                    src={step.image}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 w-full h-full object-cover object-top bg-slate-900"
                    alt={`Demo step: ${step.id}`}
                />
            </AnimatePresence>

            {/* Cursor Overlay */}
            <motion.div
                className="absolute z-20 pointer-events-none"
                initial={false}
                animate={{
                    left: step.cursorEnd.x,
                    top: step.cursorEnd.y,
                }}
                transition={{
                    duration: step.duration / 1000 - 0.5,
                    ease: "easeInOut",
                    delay: 0.2,
                }}
            >
                <CursorIcon />

                {/* Click Ripple Effect */}
                <motion.div
                    key={currentStep}
                    className="absolute -top-3 -left-3 w-6 h-6 rounded-full border-2 border-indigo-500 opacity-0"
                    animate={{
                        scale: [1, 2],
                        opacity: [1, 0]
                    }}
                    transition={{
                        delay: step.duration / 1000 - 0.5,
                        duration: 0.5
                    }}
                />
            </motion.div>
        </div>
    );
}

function CursorIcon() {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-md"
        >
            <path
                d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                fill="#000000"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
