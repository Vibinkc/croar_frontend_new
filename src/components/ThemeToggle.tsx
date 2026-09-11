"use client";

import { useSyncExternalStore } from "react";

/**
 * Light/dark theme toggle. Persists to localStorage ("croar-theme") and flips `data-theme` on
 * <html>; the dark-mode overrides in globals.css do the rest. A matching inline script in the
 * root layout applies the saved theme before first paint, so there is no flash.
 *
 * Two looks, because it lives in two kinds of place:
 *   "surface" — a bordered button for a light page (the original)
 *   "header"  — bare, for the blue app bar, matching the settings cog beside it
 *
 * The current theme is read from the <html> attribute rather than mirrored into state. That
 * attribute is the single source of truth: the pre-paint script sets it before React exists,
 * so a copy in state would start wrong and only correct itself after the first render.
 */
export default function ThemeToggle({
  className = "",
  variant = "surface",
}: {
  className?: string;
  variant?: "surface" | "header";
}) {
  const theme = useSyncExternalStore(
    (notify) => {
      // The attribute is mutated directly, which fires no event of its own, so the element is
      // observed. This also keeps every mounted toggle in step if one is ever rendered twice.
      const observer = new MutationObserver(notify);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
      return () => observer.disconnect();
    },
    () => document.documentElement.getAttribute("data-theme") ?? "light",
    () => "light", // no document on the server; the pre-paint script corrects it before paint
  );

  const dark = theme === "dark";

  const toggle = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("croar-theme", next);
    } catch {
      /* the choice still applies for this session */
    }
  };

  const shell =
    variant === "header"
      ? "w-9 h-9 rounded-full hover:bg-white/15 text-white"
      : "w-9 h-9 rounded-[4px] border border-[#E0E0E0] bg-white hover:bg-[#F5F6F8]";

  return (
    <button
      type="button"
      onClick={toggle}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark}
      className={`flex items-center justify-center transition-colors shrink-0 ${shell} ${className}`}
    >
      {dark ? (
        <svg
          className={variant === "header" ? "w-[19px] h-[19px]" : "w-4 h-4 text-[#FFB74D]"}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg
          className={variant === "header" ? "w-[19px] h-[19px]" : "w-4 h-4 text-[#616161]"}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
