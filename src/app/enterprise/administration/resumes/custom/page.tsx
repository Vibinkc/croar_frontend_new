"use client";

/**
 * Resumes → Custom. Your organisation's details, for the header and footer of a rendered CV.
 *
 * These four values are exactly what Manatal asks for, and they default to what the account
 * already knows — the company name and its contact email — rather than starting blank. A
 * settings page whose first job is to make you retype something the system has is a chore.
 */

import { useI18n } from "@/context/I18nContext";
import { PageHeader } from "@/components/ds";
import { useResumeSettings } from "../_settings";
import { Panel, SaveNote, TextRow } from "../_Rows";

export default function CustomResumePage() {
    const { t } = useI18n();
    const { settings, loading, saving, saved, error, save } = useResumeSettings();

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-6">
                <PageHeader title={t("resumes.customTitle")} subtitle={t("resumes.customSubtitle")} />
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                <div className="max-w-[760px] flex flex-col gap-3">
                    {loading || !settings ? (
                        <div className="flex justify-center py-16">
                            <div className="w-6 h-6 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            <Panel title={t("resumes.orgTitle")} description={t("resumes.orgHint")}>
                                <TextRow label={t("resumes.orgName")} value={settings.org_name}
                                         onSave={(v) => void save({ org_name: v })} />
                                <TextRow label={t("resumes.orgEmail")} value={settings.org_email}
                                         placeholder="hello@example.com"
                                         onSave={(v) => void save({ org_email: v })} />
                                <TextRow label={t("resumes.orgWebsite")} value={settings.org_website}
                                         placeholder="https://example.com"
                                         onSave={(v) => void save({ org_website: v })} />
                                <TextRow label={t("resumes.orgAddress")} value={settings.org_address}
                                         onSave={(v) => void save({ org_address: v })} />
                            </Panel>
                            <SaveNote saving={saving} saved={saved} error={error}
                                      savingLabel={t("resumes.saving")} savedLabel={t("resumes.saved")} />
                            <p className="text-[11.5px] text-[#757575] leading-relaxed">{t("resumes.customNote")}</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
