import { Roboto, Roboto_Mono } from "next/font/google";

/**
 * Typefaces — Roboto, matching Manatal.
 *
 * Croar previously ran on Hanken Grotesk, which is a warmer, more editorial face. Manatal is a
 * Material-family product and reads as one largely because of Roboto: the letterforms are
 * narrower and the greys sit differently under them, so keeping Hanken under the new blue
 * would have left the app looking like a recolour rather than a reskin.
 *
 * The exported names are kept (`hankenGrotesk`, `jetbrainsMono`) so 130 pages need no import
 * churn for a change that is purely about which file the glyphs come from. The alias below
 * spells that out for anyone who greps the old name and finds Roboto.
 *
 * Usage:
 *   import { roboto, robotoMono } from "@/components/ds";
 *   <div className={roboto.className}> … </div>
 */
export const roboto = Roboto({
    subsets: ["latin"],
    weight: ["300", "400", "500", "700"],
    variable: "--font-hanken",
    display: "swap",
});

export const robotoMono = Roboto_Mono({
    subsets: ["latin"],
    weight: ["400", "500", "700"],
    variable: "--font-jetbrains",
    display: "swap",
});

/**
 * Back-compatible aliases. The CSS variable names are unchanged too (--font-hanken /
 * --font-jetbrains), so `font-sans` and `font-mono` keep resolving without touching the
 * Tailwind config.
 */
export const hankenGrotesk = roboto;
export const jetbrainsMono = robotoMono;
