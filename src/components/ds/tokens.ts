/**
 * Croar Design System tokens (raw values).
 *
 * Tailwind cannot read runtime strings, so for class names use the literal
 * arbitrary values (e.g. `bg-[#5B53E0]`). Use THIS object for inline styles
 * (gradients, chart fills) and anywhere a JS value is needed.
 */
export const ds = {
    // Accent (indigo)
    primary: "#5B53E0",
    primaryHover: "#4A43C9",
    primaryLight: "#8B7DFF",
    primary300: "#A7A0EE",
    primary100: "#DAD7F6",
    primary50: "#ECEBFB",

    // Neutrals
    ink: "#15171C",
    body: "#374151",
    muted: "#8A929E",
    dim: "#9AA3AF",
    border: "#E8EAED",
    borderInput: "#E1E4E8",
    line: "#F1F2F5",
    surface: "#F4F5F7",
    white: "#FFFFFF",

    // Semantic
    success: "#15803D",
    successBg: "#E6F4EA",
    teal: "#0E8A6E",
    tealBg: "#E3F4EF",
    info: "#3559C7",
    infoBg: "#E7ECFB",
    warning: "#D97706",
    warningBg: "#FEF3E2",
    danger: "#EF4444",
    dangerBg: "#FDECEC",

    // Dark surfaces (sidebar, hero, marketing)
    dark: "#0E1014",
    darkRaised: "#1A1E25",
    darkItem: "#C7CCD4",
    darkLabel: "#565E6B",
} as const;

/** Indigo brand gradient used by the lightning mark / primary icon chips. */
export const BRAND_GRADIENT = "linear-gradient(135deg,#8B7DFF,#5B53E0)";

/** Dark hero background (canvas + indigo radial glow). */
export const HERO_BG = "#0E1014";
export const HERO_GLOW =
    "radial-gradient(1000px 460px at 90% -45%,rgba(91,83,224,0.55),transparent 60%),radial-gradient(760px 420px at -5% 135%,rgba(139,125,255,0.28),transparent 60%)";

/** Elevation tokens (shadows are reserved for menus / popovers / modals). */
export const shadow = {
    raised: "0 4px 14px rgba(15,23,42,0.08)",
    overlay: "0 14px 34px rgba(15,23,42,0.16)",
    primary: "0 6px 16px rgba(91,83,224,0.28)",
} as const;
