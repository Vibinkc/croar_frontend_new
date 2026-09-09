"use client";

/**
 * Resumes → General. Which of the three views opens first when someone opens a CV.
 *
 * Manatal calls this the Default Resume Tab and it is the whole page. It earns a screen because
 * the answer differs by who you are: an in-house team wants the original, an agency sending
 * profiles to clients wants the branded one every time and should not have to click.
 */

import { useI18n } from "@/context/I18nContext";
import { PageHeader } from "@/components/ds";
import { useResumeSettings } from "../_settings";
import { ChoiceRow, Panel, SaveNote } from "../_Rows";

export default function ResumesGeneralPage() {
    const { t } = useI18n();
    const { settings, loading, saving, saved, error, save } = useResumeSettings();

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-6">
                <PageHeader title={t("resumes.generalTitle")} subtitle={t("resumes.generalSubtitle")} />
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                <div className="max-w-[760px] flex flex-col gap-3">
                    {loading || !settings ? (
                        <div className="flex justify-center py-16">
                            <div className="w-6 h-6 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            <Panel title={t("resumes.defaultTabTitle")} description={t("resumes.defaultTabHint")}>
                                <ChoiceRow
                                    label={t("resumes.defaultTab")}
                                    value={settings.default_tab}
                                    onChange={(v) => void save({ default_tab: v as "original" | "branded" | "custom" })}
                                    choices={[
                                        { value: "original", label: t("resumes.tab_original"), description: t("resumes.tabHint_original") },
                                        { value: "branded", label: t("resumes.tab_branded"), description: t("resumes.tabHint_branded") },
                                        { value: "custom", label: t("resumes.tab_custom"), description: t("resumes.tabHint_custom") },
                                    ]}
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
