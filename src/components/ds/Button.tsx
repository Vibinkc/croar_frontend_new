import React from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dark";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    /** Material Symbols glyph name rendered before the label. */
    icon?: string;
    /** Material Symbols glyph name rendered after the label. */
    trailingIcon?: string;
    /** Full width always. */
    fullWidth?: boolean;
    /** Full width on mobile, auto from `sm` up — the default responsive behaviour for forms. */
    block?: boolean;
}

const base =
    "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B53E0]/40 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

const variants: Record<Variant, string> = {
    primary: "bg-[#5B53E0] text-white hover:bg-[#4A43C9] shadow-[0_6px_16px_rgba(91,83,224,0.28)]",
    secondary: "bg-white border border-[#E1E4E8] text-[#374151] hover:bg-[#F4F5F7]",
    ghost: "text-[#374151] hover:bg-[#F4F5F7]",
    danger: "bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-[0_6px_16px_rgba(239,68,68,0.24)]",
    dark: "bg-white/[0.08] border border-white/15 text-white hover:bg-white/[0.14]",
};

const sizes: Record<Size, string> = {
    sm: "h-9 px-3 text-[13px]",
    md: "h-[42px] px-4 text-[13.5px]",
    lg: "h-[46px] px-5 text-[14.5px]",
};

const iconSize: Record<Size, string> = { sm: "text-[17px]", md: "text-[19px]", lg: "text-[19px]" };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = "", variant = "primary", size = "md", icon, trailingIcon, fullWidth, block, children, ...props }, ref) => (
        <button
            ref={ref}
            className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", block && "w-full sm:w-auto", className)}
            {...props}
        >
            {icon && <span className={cn("material-symbols-rounded", iconSize[size])}>{icon}</span>}
            {children}
            {trailingIcon && <span className={cn("material-symbols-rounded", iconSize[size])}>{trailingIcon}</span>}
        </button>
    )
);

Button.displayName = "DSButton";
