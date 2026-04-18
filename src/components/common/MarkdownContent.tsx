"use client";

import React from "react";

// Simple Markdown Renderer component to handle code instructions
export const MarkdownContent = ({ content, isDark }: { content: string, isDark: boolean }) => {
    if (!content) return null;

    // Split by lines and process
    const lines = content.split('\n');

    return (
        <div className="space-y-4">
            {lines.map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={idx} className="h-2" />;

                // Headers
                if (trimmed.startsWith('####')) {
                    return <h4 key={idx} className={`text-[11px] font-black  tracking-[0.15em] mt-6 mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{trimmed.replace(/^####\s*/, '')}</h4>;
                }
                if (trimmed.startsWith('###')) {
                    return <h3 key={idx} className={`text-[13px] font-black  tracking-[0.2em] mt-8 mb-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{trimmed.replace(/^###\s*/, '')}</h3>;
                }
                if (trimmed.startsWith('##')) {
                    return <h2 key={idx} className={`text-[18px] font-bold tracking-tight mt-6 mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{trimmed.replace(/^##\s*/, '')}</h2>;
                }
                if (trimmed.startsWith('#')) {
                    return <h1 key={idx} className={`text-[24px] font-black tracking-tighter mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>{trimmed.replace(/^#\s*/, '')}</h1>;
                }

                // Lists
                if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
                    return (
                        <div key={idx} className="flex items-start gap-3 pl-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-[14px] leading-relaxed`}>
                                {processBold(trimmed.replace(/^[-*]\s*/, ''))}
                            </p>
                        </div>
                    );
                }

                // Regular Paragraph
                return (
                    <p key={idx} className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-[14px] leading-relaxed`}>
                        {processBold(trimmed)}
                    </p>
                );
            })}
        </div>
    );

    function processBold(text: string) {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className={isDark ? 'text-white' : 'text-slate-900'}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    }
};

export default MarkdownContent;
