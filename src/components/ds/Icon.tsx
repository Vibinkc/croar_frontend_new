import React from "react";
import { cn } from "./cn";
import { mdiFor } from "./iconMap";

/**
 * One icon component for the whole app, rendering MDI — the set Manatal uses.
 *
 * It accepts the old Material Symbols names (`work`, `person_add`) as well as MDI names
 * (`briefcase`), so config files, the nav and the guide can keep the names they already hold
 * and only the drawing changes. That matters because icon names are data here: the sidebar
 * stores `icon: "work"`, and a rename would have meant a migration for a cosmetic change.
 *
 * Sizing follows Tailwind's `text-[Npx]`, since an icon font is sized by font-size, not by
 * width. `w-4 h-4`-style classes coming from the old lucide call sites are translated for you
 * — see `sizeFromClass`.
 */
export interface IconProps extends React.HTMLAttributes<HTMLElement> {
    /** Material Symbols, lucide or MDI name — all three resolve. */
    name: string;
    /** Convenience: pixel size, equivalent to `className="text-[20px]"`. */
    size?: number;
}

/**
 * Translate lucide's box sizing into a font size.
 *
 * lucide is an SVG set, so its call sites size icons with `w-4 h-4`. Those classes do nothing
 * to a font glyph — an icon given only `w-4` would render at whatever the inherited font size
 * happens to be, which is how a reskin ends up with icons that are subtly the wrong size
 * everywhere and no single place to point at.
 */
const TW_PX: Record<string, number> = {
    "2": 8, "2.5": 10, "3": 12, "3.5": 14, "4": 16, "4.5": 18, "5": 20,
    "6": 24, "7": 28, "8": 32, "9": 36, "10": 40, "11": 44, "12": 48, "14": 56, "16": 64,
};

export function sizeFromClass(className = ""): { px: number | null; rest: string } {
    // An explicit text-[Npx] wins: it was written for this icon on purpose.
    if (/text-\[\d+(\.\d+)?px\]/.test(className)) return { px: null, rest: className };
    const m = className.match(/(?:^|\s)[wh]-(\d+(?:\.\d+)?)(?:\s|$)/);
    const px = m ? TW_PX[m[1]] ?? null : null;
    // Drop the box-sizing classes; they would fight the glyph's own metrics.
    const rest = className.replace(/(?:^|\s)[wh]-\d+(?:\.\d+)?(?=\s|$)/g, " ").trim();
    return { px, rest };
}

export const Icon = React.forwardRef<HTMLElement, IconProps>(
    ({ name, size, className = "", style, ...props }, ref) => {
        const { px, rest } = sizeFromClass(className);
        const fontSize = size ?? px ?? undefined;
        return (
            <i
                ref={ref}
                aria-hidden="true"
                className={cn("mdi", `mdi-${mdiFor(name)}`, "leading-none", rest)}
                style={fontSize ? { fontSize: `${fontSize}px`, ...style } : style}
                {...props}
            />
        );
    }
);
Icon.displayName = "DSIcon";
