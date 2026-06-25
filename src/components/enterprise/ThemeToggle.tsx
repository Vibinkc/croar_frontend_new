"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);

    // On mount, read saved preference
    useEffect(() => {
        const saved = localStorage.getItem("croar-theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const dark = saved ? saved === "dark" : prefersDark;
        setIsDark(dark);
        document.documentElement.classList.toggle("dark", dark);
    }, []);

    const toggle = () => {
        const next = !isDark;
        setIsDark(next);
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("croar-theme", next ? "dark" : "light");
    };

    return (
        <button
            onClick={toggle}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="w-9 h-9 rounded-[10px] border border-[#E1E4E8] bg-white hover:bg-[#F4F5F7] flex items-center justify-center transition-all shadow-sm group shrink-0"
        >
            {isDark ? (
                // Sun icon
                <svg className="w-4 h-4 text-[#D97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4"/>
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
                </svg>
            ) : (
                // Moon icon
                <svg className="w-4 h-4 text-[#6B7280] group-hover:text-[#374151]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
            )}
        </button>
    );
}
