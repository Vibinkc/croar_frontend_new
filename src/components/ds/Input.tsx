import React from "react";
import { cn } from "./cn";

const fieldBase =
    "w-full rounded-[10px] border border-[#E1E4E8] bg-white text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed";

/* ── Text input (with optional leading Material Symbols icon) ── */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: string;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className = "", icon, ...props }, ref) => {
    if (!icon) {
        return <input ref={ref} className={cn(fieldBase, "h-11 px-3.5", className)} {...props} />;
    }
    return (
        <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA3AF] material-icons-outlined text-[19px] pointer-events-none">{icon}</span>
            <input ref={ref} className={cn(fieldBase, "h-11 pl-11 pr-4", className)} {...props} />
        </div>
    );
});
Input.displayName = "DSInput";

/* ── Textarea ── */
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className = "", ...props }, ref) => <textarea ref={ref} className={cn(fieldBase, "min-h-[88px] px-3.5 py-2.5", className)} {...props} />
);
Textarea.displayName = "DSTextarea";

/* ── Select ── */
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
    ({ className = "", children, ...props }, ref) => (
        <select ref={ref} className={cn(fieldBase, "h-11 px-3 appearance-none bg-no-repeat", className)} {...props}>
            {children}
        </select>
    )
);
Select.displayName = "DSSelect";

/* ── Field wrapper: label + control + hint/error ── */
export function Field({ label, htmlFor, hint, error, required, children, className }: {
    label?: React.ReactNode;
    htmlFor?: string;
    hint?: React.ReactNode;
    error?: React.ReactNode;
    required?: boolean;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("w-full", className)}>
            {label && (
                <label htmlFor={htmlFor} className="block text-[12.5px] font-semibold text-[#374151] mb-1.5">
                    {label}
                    {required && <span className="text-[#EF4444] ml-0.5">*</span>}
                </label>
            )}
            {children}
            {error ? (
                <p className="text-[12px] text-[#C0383C] mt-1.5">{error}</p>
            ) : hint ? (
                <p className="text-[12px] text-[#8A929E] mt-1.5">{hint}</p>
            ) : null}
        </div>
    );
}
