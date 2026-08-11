// -----------------------------------------------------------------------------
// i18n + country configuration
// Supported markets: United States (English), South Korea (Korean), Japan (Japanese).
// Language selection is cookie/context-based (no URL locale routing).
// -----------------------------------------------------------------------------

export type Locale = "en" | "ko" | "ja";

export const LOCALES: Locale[] = ["en", "ko", "ja"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "croar-locale";

/** Native display name shown in the language switcher. */
export const LOCALE_LABELS: Record<Locale, string> = {
    en: "English",
    ko: "한국어",
    ja: "日本語",
};

/**
 * Languages the AI can generate content (assessment/interview questions) in.
 * These are the plain English names the backend injects into its LLM prompts.
 */
export const GEN_LANGUAGES = ["English", "Korean", "Japanese"] as const;
export type GenLanguage = (typeof GEN_LANGUAGES)[number];

/** Map the UI locale to the AI generation language name (the default at the generate step). */
export const localeToLanguageName = (locale: Locale): GenLanguage =>
    (({ en: "English", ko: "Korean", ja: "Japanese" }) as Record<Locale, GenLanguage>)[locale] ?? "English";

/** Native label for each generation language, for the selector dropdown. */
export const GEN_LANGUAGE_LABELS: Record<GenLanguage, string> = {
    English: "English",
    Korean: "한국어",
    Japanese: "日本語",
};

/** Per-country configuration — drives currency, date/number formatting, name order, etc. */
export interface CountryConfig {
    /** ISO 3166-1 alpha-2 country code. */
    country: string;
    locale: Locale;
    /** BCP-47 tag used with the Intl APIs. */
    intlLocale: string;
    /** Native language label. */
    label: string;
    /** ISO 4217 currency code. */
    currency: string;
    currencySymbol: string;
    /** How personal names are ordered in this market. KR/JP put the family name first. */
    nameOrder: "given-first" | "family-first";
    /** Default dialing code. */
    phoneCode: string;
    /** IANA timezone. */
    timezone: string;
    /** First day of the week (0 = Sunday). */
    weekStart: 0 | 1;
}

export const COUNTRY_CONFIG: Record<Locale, CountryConfig> = {
    en: {
        country: "US", locale: "en", intlLocale: "en-US", label: "English",
        currency: "USD", currencySymbol: "$", nameOrder: "given-first",
        phoneCode: "+1", timezone: "America/New_York", weekStart: 0,
    },
    ko: {
        country: "KR", locale: "ko", intlLocale: "ko-KR", label: "한국어",
        currency: "KRW", currencySymbol: "₩", nameOrder: "family-first",
        phoneCode: "+82", timezone: "Asia/Seoul", weekStart: 1,
    },
    ja: {
        country: "JP", locale: "ja", intlLocale: "ja-JP", label: "日本語",
        currency: "JPY", currencySymbol: "¥", nameOrder: "family-first",
        phoneCode: "+81", timezone: "Asia/Tokyo", weekStart: 1,
    },
};

export function isLocale(v: unknown): v is Locale {
    return typeof v === "string" && (LOCALES as string[]).includes(v);
}
