"use client";

/**
 * Customization → Matches.
 *
 * Manatal has one of these per record type, each offering the same thing with a different noun.
 * The editor is one shared component for that reason; this page only says which record type it
 * is looking at and what else belongs on the screen.
 */

import { useI18n } from "@/context/I18nContext";
import { PageHeader } from "@/components/ds";
import { CustomFields } from "../_CustomFields";

export default function MatchesPage() {
    const { t } = useI18n();
    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-6">
                <PageHeader title={t("custom.matchesTitle")} subtitle={t("custom.matchesSubtitle")} />
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                <div className="max-w-[900px] flex flex-col gap-4">
                    <CustomFields entity="match" />
                </div>
            </div>
        </div>
    );
}
