"use client";

/**
 * Job posts — what is live on the career page right now.
 *
 * The landing screen of the section, because "what can a candidate see?" is the question a
 * recruiter opens this for. The list comes from the same public endpoint a visitor hits, so it
 * cannot disagree with the page itself.
 */

import { useI18n } from "@/context/I18nContext";
import { CareerPageHeader, Spinner, useCareerPage } from "./_shared";

export default function CareerPageJobPosts() {
    const { t: tr } = useI18n();
    const { slug, jobs, url, loading } = useCareerPage();

    return (
        <div className="p-6 max-w-[900px] mx-auto space-y-5">
            <CareerPageHeader
                title={tr("careerPage.jobPostsTitle")}
                subtitle={tr("careerPage.jobPostsSubtitle")}
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
                <div className="rounded-[4px] border border-[#E0E0E0] bg-white p-4 space-y-3">
                    <div>
                        <h2 className="text-[15px] font-bold text-[#212121]">
                            {tr("careerPage.liveTitle")}{" "}
                            <span className="text-[#9E9E9E] font-semibold">({jobs.length})</span>
                        </h2>
                        {/* The single rule that decides what is on the page — and the same rule
                            that decides whether a job board can see it. */}
                        <p className="text-[12px] text-[#757575] leading-relaxed mt-1">{tr("careerPage.liveDesc")}</p>
                    </div>

                    {jobs.length === 0 ? (
                        <p className="text-[12.5px] text-[#757575] py-6 text-center">{tr("careerPage.noJobs")}</p>
                    ) : (
                        <div className="divide-y divide-[#EEEEEE]">
                            {jobs.map((job) => (
                                <a
                                    key={job.id}
                                    href={`/enterprise/jobs/${job.id}`}
                                    className="py-2.5 flex items-center gap-3 group"
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-[13px] font-semibold text-[#212121] group-hover:text-[#1976D2] transition-colors">
                                            {job.title}
                                        </span>
                                        <span className="block text-[11.5px] text-[#757575]">
                                            {[job.location, job.work_mode, job.job_type].filter(Boolean).join(" · ") || "—"}
                                        </span>
                                    </span>
                                    <span className="material-symbols-rounded text-[18px] text-[#BDBDBD] group-hover:text-[#1976D2] transition-colors">
                                        chevron_right
                                    </span>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
