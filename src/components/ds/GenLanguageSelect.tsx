"use client";

import { GEN_LANGUAGES, GEN_LANGUAGE_LABELS, GenLanguage } from "@/i18n/config";
import { useI18n } from "@/context/I18nContext";

/**
 * Compact language selector shown at each AI "Generate" step. Controlled component —
 * the parent seeds `value` from the UI locale (localeToLanguageName) and sends the chosen
 * language name to the backend generation endpoints so questions come out in that language.
 */
export default function GenLanguageSelect({
    value,
    onChange,
    className = "",
}: {
    value: GenLanguage;
    onChange: (v: GenLanguage) => void;
    className?: string;
}) {
    const { t } = useI18n();
    return (
        <label className={`inline-flex items-center gap-1.5 ${className}`} title={t("common.language")}>
            <span className="material-symbols-rounded text-[17px] text-[#8A929E]">translate</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value as GenLanguage)}
                className="bg-white border border-[#E1E4E8] rounded-[8px] px-2 h-8 text-[12.5px] font-medium text-[#374151] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all cursor-pointer"
            >
                {GEN_LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                        {GEN_LANGUAGE_LABELS[l]}
                    </option>
                ))}
            </select>
        </label>
    );
}
