"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import Cookies from "js-cookie";
import {
    Locale, LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE, COUNTRY_CONFIG, CountryConfig, isLocale,
} from "@/i18n/config";
import { translate } from "@/i18n";

interface I18nContextType {
    locale: Locale;
    setLocale: (l: Locale) => void;
    /** Translate a dot-path key with optional {var} interpolation. */
    t: (key: string, vars?: Record<string, string | number>) => string;
    /** Active country configuration (currency, name order, timezone, …). */
    country: CountryConfig;
    formatNumber: (n: number) => string;
    formatCurrency: (n: number, currency?: string) => string;
    formatDate: (d: Date | string, opts?: Intl.DateTimeFormatOptions) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

    // Hydrate the saved locale on mount (cookie first, then localStorage fallback).
    useEffect(() => {
        const saved = Cookies.get(LOCALE_COOKIE) || (typeof localStorage !== "undefined" ? localStorage.getItem(LOCALE_COOKIE) : null);
        if (isLocale(saved)) setLocaleState(saved);
    }, []);

    // Keep <html lang> in sync so the browser/AT and CSS :lang() behave correctly.
    useEffect(() => {
        if (typeof document !== "undefined") document.documentElement.lang = locale;
    }, [locale]);

    const setLocale = useCallback((l: Locale) => {
        if (!LOCALES.includes(l)) return;
        setLocaleState(l);
        Cookies.set(LOCALE_COOKIE, l, { expires: 365, sameSite: "lax" });
        try { localStorage.setItem(LOCALE_COOKIE, l); } catch { /* ignore */ }
    }, []);

    const t = useCallback(
        (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
        [locale],
    );

    const country = COUNTRY_CONFIG[locale];

    const formatNumber = useCallback(
        (n: number) => new Intl.NumberFormat(country.intlLocale).format(n),
        [country],
    );
    const formatCurrency = useCallback(
        (n: number, currency?: string) =>
            new Intl.NumberFormat(country.intlLocale, { style: "currency", currency: currency || country.currency }).format(n),
        [country],
    );
    const formatDate = useCallback(
        (d: Date | string, opts?: Intl.DateTimeFormatOptions) => {
            const dt = typeof d === "string" ? new Date(d) : d;
            if (isNaN(dt.getTime())) return "";
            return new Intl.DateTimeFormat(country.intlLocale, opts || { year: "numeric", month: "short", day: "numeric" }).format(dt);
        },
        [country],
    );

    return (
        <I18nContext.Provider value={{ locale, setLocale, t, country, formatNumber, formatCurrency, formatDate }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const ctx = useContext(I18nContext);
    if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
    return ctx;
}
