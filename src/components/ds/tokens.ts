/**
 * Design tokens — Manatal's visual language.
 *
 * Tailwind cannot read runtime strings, so pages write colours as literal arbitrary values
 * (`bg-[#1976D2]`). Use THIS object only where a JS value is genuinely needed: inline styles,
 * gradients, chart fills. It is a mirror of what the classes say, not a source the classes read
 * from — which is why the app-wide reskin had to rewrite 11,924 literals rather than this file.
 *
 * The palette is Material's, because Manatal is a Material-family product: Blue 700 as the
 * accent, Material's true greys underneath, and 4px corners. Croar's previous system (indigo
 * #5B53E0, blue-biased greys, 10–14px radii, Hanken Grotesk) is gone from the product.
 */
export const ds = {
    // Accent — Material Blue. `primary` is the chrome and button fill; `primaryHover` is the
    // pressed/hover state and also the colour links settle on.
    primary: "#1976D2",
    primaryHover: "#1565C0",
    primaryDark: "#0D47A1",
    primaryLight: "#42A5F5",
    primary300: "#90CAF9",
    primary100: "#BBDEFB",
    primary50: "#E3F2FD",

    // Neutrals — Material greys. Croar's greys carried a blue bias that read as off-brand
    // under this accent, in a way that is hard to point at but easy to feel.
    ink: "#212121",
    body: "#424242",
    muted: "#757575",
    dim: "#9E9E9E",
    border: "#E0E0E0",
    borderInput: "#E0E0E0",
    line: "#EEEEEE",
    surface: "#F5F6F8",
    white: "#FFFFFF",

    // Semantic
    success: "#2E7D32",
    successBg: "#E8F5E9",
    teal: "#2E7D32",
    tealBg: "#E8F5E9",
    info: "#1565C0",
    infoBg: "#E3F2FD",
    warning: "#EF6C00",
    warningBg: "#FFF3E0",
    danger: "#E53935",
    dangerBg: "#FFEBEE",

    // Dark surfaces. Manatal has no dark chrome — its sidebar is white and its top bar is
    // blue — so these survive only for marketing bands, in a blue-grey that sits under the
    // accent instead of fighting it.
    dark: "#1E2A38",
    darkRaised: "#263A4B",
    darkItem: "#CFD8DC",
    darkLabel: "#78909C",
} as const;

/** Corner radius. Manatal is near-square; this is as much of the difference as the colour is. */
export const RADIUS = "4px";

/** Flat blue for chrome. Kept as a "gradient" name so existing call sites need no churn. */
export const BRAND_GRADIENT = "linear-gradient(135deg,#42A5F5,#1976D2)";

/** Dark hero background (marketing only). */
export const HERO_BG = "#1E2A38";
export const HERO_GLOW =
    "radial-gradient(1000px 460px at 90% -45%,rgba(25,118,210,0.55),transparent 60%),radial-gradient(760px 420px at -5% 135%,rgba(66,165,245,0.28),transparent 60%)";

/**
 * Elevation. Material's shadows are tighter and darker than the soft lifts Croar used, and
 * the app-bar shadow is what separates the blue chrome from the page beneath it.
 */
export const shadow = {
    raised: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)",
    overlay: "0 8px 24px rgba(0,0,0,0.18)",
    primary: "0 1px 3px rgba(0,0,0,0.20)",
    appBar: "0 2px 4px rgba(0,0,0,0.16)",
} as const;
