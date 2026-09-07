import React from "react";
import { cn } from "./cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Responsive padding preset. */
    padding?: "none" | "sm" | "md" | "lg";
    /** Adds a hover border highlight (for clickable cards). */
    interactive?: boolean;
}

const pads = {
    none: "",
    sm: "p-4",
    md: "p-5 md:p-6",
    lg: "p-6 md:p-7",
};

/** Flat white surface with a hairline border (the design system's default panel). */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className = "", padding = "md", interactive = false, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "bg-white border border-[#E0E0E0] rounded-[4px]",
                pads[padding],
                interactive && "transition-colors hover:border-[#E0E0E0]",
                className
            )}
            {...props}
        />
    )
);

Card.displayName = "DSCard";

/** Optional card header row: title + optional action slot. */
export function CardHeader({ title, subtitle, action, className }: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; className?: string }) {
    return (
        <div className={cn("flex items-start justify-between gap-3 mb-5", className)}>
            <div>
                <h3 className="text-[15px] font-bold text-[#212121]">{title}</h3>
                {subtitle && <p className="text-[12.5px] text-[#757575] mt-0.5">{subtitle}</p>}
            </div>
            {action}
        </div>
    );
}
