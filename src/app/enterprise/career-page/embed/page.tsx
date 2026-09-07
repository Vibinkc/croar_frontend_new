"use client";

/**
 * Embed & share — putting the career page somewhere other than Croar.
 *
 * Everything here is derived from the career page URL, so nothing is editable: an editable
 * copy of a link is a copy that can be wrong.
 */

import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { CareerPageHeader, CopyRow, Field, Spinner, useCareerPage } from "../_shared";

export default function CareerPageEmbed() {
    const { t: tr } = useI18n();
    const { slug, url, loading } = useCareerPage();

    const linkSnippet = url ? `<a href="${url}">Careers</a>` : "";
    const iframeSnippet = url
        ? `<iframe src="${url}" width="100%" height="900" frameborder="0" title="Careers"></iframe>`
        : "";
    const feedUrl = `${BACKEND_URL}/api/v1/jobs/feed/indeed.xml`;

    return (
        <div className="p-6 max-w-[900px] mx-auto space-y-5">
            <CareerPageHeader
                title={tr("careerPage.embedTitle")}
                subtitle={tr("careerPage.embedSubtitle")}
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
                <div className="rounded-[4px] border border-[#E0E0E0] bg-white p-4 space-y-4">
                    <Field label={tr("careerPage.embedLink")} hint={tr("careerPage.embedLinkHint")}>
                        <CopyRow
                            value={linkSnippet}
                            label={tr("careerPage.embedLink")}
                            copyLabel={tr("careerPage.copy")}
                            copiedLabel={tr("careerPage.copied")}
                        />
                    </Field>
                    <Field label={tr("careerPage.embedIframe")} hint={tr("careerPage.embedIframeHint")}>
                        <CopyRow
                            value={iframeSnippet}
                            label={tr("careerPage.embedIframe")}
                            copyLabel={tr("careerPage.copy")}
                            copiedLabel={tr("careerPage.copied")}
                        />
                    </Field>
                    <Field label={tr("careerPage.embedFeed")} hint={tr("careerPage.embedFeedHint")}>
                        <CopyRow
                            value={feedUrl}
                            label={tr("careerPage.embedFeed")}
                            copyLabel={tr("careerPage.copy")}
                            copiedLabel={tr("careerPage.copied")}
                        />
                    </Field>
                </div>
            )}
        </div>
    );
}
