import React from "react";
import { cn } from "./cn";
import { Icon } from "./Icon";

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
    "inline-flex items-center justify-center gap-2 rounded-[4px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1976D2]/40 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

const variants: Record<Variant, string> = {
    primary: "bg-[#1976D2] text-white hover:bg-[#1565C0] shadow-[0_6px_16px_rgba(25,118,210,0.28)]",
    secondary: "bg-white border border-[#E0E0E0] text-[#1976D2] hover:bg-[#E3F2FD]",
    ghost: "text-[#1976D2] hover:bg-[#E3F2FD]",
    danger: "bg-[#E53935] text-white hover:bg-[#DC2626] shadow-[0_6px_16px_rgba(229,57,53,0.24)]",
    dark: "bg-white/[0.08] border border-white/15 text-white hover:bg-white/[0.14]",
};

const sizes: Record<Size, string> = {
    sm: "h-8 px-3 text-[13px]",
    md: "h-9 px-4 text-[13.5px]",
    lg: "h-10 px-5 text-[14.5px]",
};

const iconSize: Record<Size, string> = { sm: "text-[17px]", md: "text-[19px]", lg: "text-[19px]" };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = "", variant = "primary", size = "md", icon, trailingIcon, fullWidth, block, children, ...props }, ref) => (
        <button
            ref={ref}
            className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", block && "w-full sm:w-auto", className)}
            {...props}
        >
            {icon && <Icon name={icon} className={iconSize[size]} />}
            {children}
            {trailingIcon && <Icon name={trailingIcon} className={iconSize[size]} />}
        </button>
    )
);

Button.displayName = "DSButton";
