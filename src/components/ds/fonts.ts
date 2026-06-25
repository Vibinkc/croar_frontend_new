import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";

/**
 * Croar Design System typefaces — configured once and shared across the app.
 *
 * Usage:
 *   import { hankenGrotesk, jetbrainsMono } from "@/components/ds";
 *   <div className={hankenGrotesk.className}> … </div>
 *   <span className={jetbrainsMono.className}>1,284</span>  // figures / stats
 *
 * Or expose both as CSS variables on a wrapper and use the `font-sans` /
 * `font-mono` utilities (variables: --font-hanken, --font-jetbrains).
 */
export const hankenGrotesk = Hanken_Grotesk({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
    variable: "--font-hanken",
    display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-jetbrains",
    display: "swap",
});
