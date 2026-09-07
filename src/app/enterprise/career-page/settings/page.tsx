"use client";

/**
 * Career page settings — everything the public page renders around the job list.
 *
 * Three tabs rather than three routes: they are one saved record, and splitting them further
 * would mean a save button per screen over the same object.
 */

import { useState } from "react";
import { useI18n } from "@/context/I18nContext";
import { AREA, CareerPageHeader, Field, INPUT, Settings, Spinner, useCareerPage } from "../_shared";

type Tab = "general" | "social" | "policy";

export default function CareerPageSettingsScreen() {
    const { t: tr } = useI18n();
    const { slug, companyName, settings, set, url, loading, saving, saved, save, canEdit } = useCareerPage();
    const [tab, setTab] = useState<Tab>("general");

    const TABS: { key: Tab; label: string }[] = [
        { key: "general", label: tr("careerPage.tabGeneral") },
        { key: "social", label: tr("careerPage.tabSocial") },
        { key: "policy", label: tr("careerPage.tabPolicy") },
    ];

    return (
        <div className="p-6 max-w-[900px] mx-auto space-y-5">
            <CareerPageHeader
                title={tr("careerPage.settingsTitle")}
                subtitle={tr("careerPage.settingsSubtitle")}
                url={url}
                copyLabel={tr("careerPage.copyLink")}
                copiedLabel={tr("careerPage.copied")}
                openLabel={tr("careerPage.open")}
            />

            {loading ? (
                <Spinner />
            ) : !slug ? (
                <div className="p-4 rounded-[4px] border border-[#FFE0B2] bg-[#FFF3E0]">
                    <p className="text-[12.5px] font-bold text-[#E65100]">{tr("careerPage.noCompany")}</p>
                </div>
            ) : (
                <>
                    <div className="flex gap-1 border-b border-[#E0E0E0] overflow-x-auto">
                        {TABS.map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`px-3 py-2 text-[12.5px] font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                                    tab === t.key
                                        ? "border-[#1976D2] text-[#1976D2]"
                                        : "border-transparent text-[#757575] hover:text-[#212121]"
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="rounded-[4px] border border-[#E0E0E0] bg-white p-4 space-y-4">
                        {tab === "general" && (
                            <>
                                <Field label={tr("careerPage.headline")} hint={tr("careerPage.headlineHint")}>
                                    <input
                                        className={INPUT}
                                        value={settings.headline}
                                        onChange={(e) => set("headline", e.target.value)}
                                        placeholder={tr("careerPage.headlinePlaceholder", { company: companyName })}
                                    />
                                </Field>
                                <Field label={tr("careerPage.intro")} hint={tr("careerPage.introHint")}>
                                    <textarea
                                        className={AREA}
                                        rows={3}
                                        value={settings.intro}
                                        onChange={(e) => set("intro", e.target.value)}
                                    />
                                </Field>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label={tr("careerPage.logo")} hint={tr("careerPage.logoHint")}>
                                        <input
                                            className={INPUT}
                                            value={settings.logo_url}
                                            onChange={(e) => set("logo_url", e.target.value)}
                                            placeholder="https://…/logo.png"
                                        />
                                    </Field>
                                    <Field label={tr("careerPage.brandColor")} hint={tr("careerPage.brandColorHint")}>
                                        <div className="flex gap-1.5 items-center">
                                            <input
                                                className={INPUT}
                                                value={settings.brand_color}
                                                onChange={(e) => set("brand_color", e.target.value)}
                                                placeholder="#1976D2"
                                            />
                                            <span
                                                className="w-9 h-9 shrink-0 rounded-[4px] border border-[#E0E0E0]"
                                                style={{ background: settings.brand_color || "#1976D2" }}
                                                aria-hidden
                                            />
                                        </div>
                                    </Field>
                                </div>
                                <Field label={tr("careerPage.cover")} hint={tr("careerPage.coverHint")}>
                                    <input
                                        className={INPUT}
                                        value={settings.cover_url}
                                        onChange={(e) => set("cover_url", e.target.value)}
                                        placeholder="https://…/cover.jpg"
                                    />
                                </Field>
                                <Field label={tr("careerPage.analytics")} hint={tr("careerPage.analyticsHint")}>
                                    <input
                                        className={INPUT}
                                        value={settings.ga_measurement_id}
                                        onChange={(e) => set("ga_measurement_id", e.target.value)}
                                        placeholder="G-XXXXXXXXXX"
                                    />
                                </Field>
                            </>
                        )}

                        {tab === "social" && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label={tr("careerPage.contactEmail")}>
                                        <input
                                            className={INPUT}
                                            value={settings.contact_email}
                                            onChange={(e) => set("contact_email", e.target.value)}
                                            placeholder="careers@company.com"
                                        />
                                    </Field>
                                    <Field label={tr("careerPage.contactPhone")}>
                                        <input
                                            className={INPUT}
                                            value={settings.contact_phone}
                                            onChange={(e) => set("contact_phone", e.target.value)}
                                        />
                                    </Field>
                                </div>
                                <Field label={tr("careerPage.website")}>
                                    <input
                                        className={INPUT}
                                        value={settings.website}
                                        onChange={(e) => set("website", e.target.value)}
                                        placeholder="https://company.com"
                                    />
                                </Field>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {([
                                        ["linkedin", "LinkedIn"],
                                        ["twitter", "X"],
                                        ["facebook", "Facebook"],
                                        ["instagram", "Instagram"],
                                        ["youtube", "YouTube"],
                                    ] as [keyof Settings, string][]).map(([key, label]) => (
                                        <Field key={key} label={label}>
                                            <input
                                                className={INPUT}
                                                value={settings[key] as string}
                                                onChange={(e) => set(key, e.target.value as never)}
                                                placeholder="https://…"
                                            />
                                        </Field>
                                    ))}
                                </div>
                                <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.show_share_buttons}
                                        onChange={(e) => set("show_share_buttons", e.target.checked)}
                                        className="w-4 h-4 accent-[#1976D2]"
                                    />
                                    <span className="text-[12.5px] text-[#212121]">{tr("careerPage.shareButtons")}</span>
                                </label>
                            </>
                        )}

                        {tab === "policy" && (
                            <>
                                <Field label={tr("careerPage.applicationTerms")} hint={tr("careerPage.applicationTermsHint")}>
                                    <textarea
                                        className={AREA}
                                        rows={8}
                                        value={settings.application_terms}
                                        onChange={(e) => set("application_terms", e.target.value)}
                                    />
                                </Field>
                                <Field label={tr("careerPage.privacyPolicy")} hint={tr("careerPage.privacyPolicyHint")}>
                                    <textarea
                                        className={AREA}
                                        rows={8}
                                        value={settings.privacy_policy}
                                        onChange={(e) => set("privacy_policy", e.target.value)}
                                    />
                                </Field>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => void save()}
                            disabled={saving || !canEdit}
                            className="h-9 px-4 rounded-[4px] bg-[#1976D2] text-white text-[12.5px] font-bold hover:bg-[#1565C0] transition-colors disabled:opacity-50"
                        >
                            {saving ? tr("careerPage.saving") : tr("careerPage.save")}
                        </button>
                        {saved && (
                            <span className="text-[12px] font-semibold text-[#2E7D32] inline-flex items-center gap-1">
                                <i className="mdi mdi-check-circle text-[16px]" />
                                {tr("careerPage.savedMsg")}
                            </span>
                        )}
                        {!canEdit && <span className="text-[11.5px] text-[#757575]">{tr("careerPage.noPermission")}</span>}
                    </div>
                </>
            )}
        </div>
    );
}
