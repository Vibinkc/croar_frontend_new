"use client";

/**
 * Resumes → Branded. Your logo in the header, a watermark behind the text.
 *
 * The watermark text is disabled rather than hidden when the watermark is off, so it is obvious
 * what turning it on will do. Hiding it would make the page look like it has fewer settings
 * than it does.
 *
 * "Hide the candidate's contact details" lives here rather than under Custom because it is the
 * actual reason an agency wants a branded resume: send the client the profile without handing
 * over the means to go round you.
 */

import { useI18n } from "@/context/I18nContext";
import { PageHeader } from "@/components/ds";
import { useResumeSettings } from "../_settings";
import { Panel, SaveNote, TextRow, ToggleRow } from "../_Rows";

export default function BrandedResumePage() {
    const { t } = useI18n();
    const { settings, loading, saving, saved, error, save } = useResumeSettings();

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-6">
                <PageHeader title={t("resumes.brandedTitle")} subtitle={t("resumes.brandedSubtitle")} />
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                <div className="max-w-[760px] flex flex-col gap-3">
                    {loading || !settings ? (
                        <div className="flex justify-center py-16">
                            <div className="w-6 h-6 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            <Panel title={t("resumes.brandingTitle")} description={t("resumes.brandingHint")}>
                                <TextRow
                                    label={t("resumes.logo")}
                                    hint={t("resumes.logoHint")}
                                    value={settings.header_logo_url}
                                    placeholder="https://…/logo.png"
                                    onSave={(v) => void save({ header_logo_url: v })}
                                />
                                <ToggleRow
                                    label={t("resumes.watermark")}
                                    hint={t("resumes.watermarkHint")}
                                    checked={settings.watermark_enabled}
                                    onChange={(v) => void save({ watermark_enabled: v })}
                                />
                                <TextRow
                                    label={t("resumes.watermarkText")}
                                    value={settings.watermark_text}
                                    disabled={!settings.watermark_enabled}
                                    onSave={(v) => void save({ watermark_text: v })}
                                />
                                <ToggleRow
                                    label={t("resumes.hideContact")}
                                    hint={t("resumes.hideContactHint")}
                                    checked={settings.hide_contact_details}
                                    onChange={(v) => void save({ hide_contact_details: v })}
                                />
                            </Panel>
                            <SaveNote saving={saving} saved={saved} error={error}
                                      savingLabel={t("resumes.saving")} savedLabel={t("resumes.saved")} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
