"use client";

/**
 * Customization → Jobs.
 *
 * Manatal has one of these per record type, each offering the same thing with a different noun.
 * The editor is one shared component for that reason; this page only says which record type it
 * is looking at and what else belongs on the screen.
 */

import { useI18n } from "@/context/I18nContext";
import { PageHeader } from "@/components/ds";
import { CustomFields } from "../_CustomFields";
import { Tags } from "../_Tags";

export default function JobsPage() {
    const { t } = useI18n();
    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-6">
                <PageHeader title={t("custom.jobsTitle")} subtitle={t("custom.jobsSubtitle")} />
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                <div className="max-w-[900px] flex flex-col gap-4">
                    <CustomFields entity="job" />
                    <Tags entity="job" />
                    <section className="bg-white border border-[#E0E0E0] rounded-[4px] px-5 py-4">
                        <h2 className="text-[15px] font-medium text-[#212121]">{t("custom.stagesTitle")}</h2>
                        <p className="text-[12.5px] text-[#757575] mt-0.5 leading-relaxed">{t("custom.stagesHint")}</p>
                        <a href="/enterprise/jobs" className="inline-block mt-2 text-[13px] text-[#1976D2] hover:underline">
                            {t("custom.stagesLink")}
                        </a>
                    </section>
                </div>
            </div>
        </div>
    );
}
