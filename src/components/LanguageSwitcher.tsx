"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "@/components/icons";
import { useI18n } from "@/context/I18nContext";
import { LOCALES, LOCALE_LABELS } from "@/i18n/config";

export default function LanguageSwitcher({ compact = false, variant = "light" }: { compact?: boolean; variant?: "light" | "dark" }) {
    const { locale, setLocale, t } = useI18n();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const triggerCls = variant === "dark"
        ? "border-white/10 bg-white/[0.04] text-[#BDBDBD] hover:bg-white/[0.08]"
        : "border-[#E0E0E0] bg-white text-[#424242] hover:bg-[#FAFAFA]";

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((v) => !v)}
                className={`w-full h-9 px-2.5 rounded-[4px] border text-[13px] font-semibold flex items-center gap-1.5 ${triggerCls}`}
                title={t("common.language")}
            >
                <Globe className="w-4 h-4 opacity-70" />
                {!compact && <span className="flex-1 text-left">{LOCALE_LABELS[locale]}</span>}
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>
            {open && (
                <div className={`absolute z-50 w-40 rounded-[4px] border p-1.5 shadow-[0_14px_34px_rgba(0,0,0,0.28)] ${variant === "dark" ? "left-0 bottom-11 bg-[#171A21] border-white/10" : "right-0 top-11 bg-white border-[#E0E0E0]"}`}>
                    {LOCALES.map((l) => {
                        const activeCls = variant === "dark" ? "text-[#A5A0F0] bg-white/[0.06]" : "text-[#1976D2] bg-[#F3F9FE]";
                        const idleCls = variant === "dark" ? "text-[#BDBDBD] hover:bg-white/[0.06]" : "text-[#424242] hover:bg-[#FAFAFA]";
                        return (
                            <button
                                key={l}
                                onClick={() => { setLocale(l); setOpen(false); }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-[4px] text-[13px] font-semibold ${locale === l ? activeCls : idleCls}`}
                            >
                                {LOCALE_LABELS[l]}
                                {locale === l && <Check className="w-4 h-4" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
