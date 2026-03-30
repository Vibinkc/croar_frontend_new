"use client";

import { useState, useEffect } from "react";

const PHRASES = [
    "Grab a cup of tea...",
    "Architecting Intelligence...",
    "Synthesizing Content..."
];

export default function AILoadingText({ className = "" }: { className?: string }) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % PHRASES.length);
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`h-8 overflow-hidden ${className}`}>
            <div
                className="transition-all duration-700 ease-in-out"
                style={{ transform: `translateY(-${index * 32}px)` }}
            >
                {PHRASES.map((phrase, i) => (
                    <div key={i} className="h-8 flex items-center justify-center whitespace-nowrap">
                        {phrase}
                    </div>
                ))}
            </div>
        </div>
    );
}
