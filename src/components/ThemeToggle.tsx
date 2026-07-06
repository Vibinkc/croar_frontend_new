"use client";

import { useEffect, useState } from "react";

/**
 * Light/dark theme toggle. Persists to localStorage ("croar-theme") and flips
 * `data-theme` on <html>; the global dark-mode overrides in globals.css do the
 * rest. A matching inline script in the root layout applies the saved theme
 * before first paint to avoid a flash.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = document.documentElement.getAttribute("data-theme");
    setDark(saved === "dark");
  }, []);

  const toggle = () => {
    const next = dark ? "light" : "dark";
    setDark(!dark);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("croar-theme", next);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`w-9 h-9 rounded-[10px] border border-[#E1E4E8] bg-white hover:bg-[#F4F5F7] flex items-center justify-center transition-colors shrink-0 ${className}`}
    >
      {dark ? (
        <svg className="w-4 h-4 text-[#F6B65C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
