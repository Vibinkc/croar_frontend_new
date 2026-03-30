
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'secondary';
    size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'default', size = 'md', ...props }, ref) => {
        const baseStyles = "inline-flex items-center justify-center rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

        const variants = {
            default: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
            outline: "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300",
            ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
            secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200"
        };

        const sizes = {
            sm: "px-3 py-1.5 text-xs",
            md: "px-5 py-2.5 text-sm",
            lg: "px-6 py-3 text-base",
            icon: "h-9 w-9"
        };

        const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

        return (
            <button
                ref={ref}
                className={combinedClassName}
                {...props}
            />
        );
    }
);

Button.displayName = "Button";
