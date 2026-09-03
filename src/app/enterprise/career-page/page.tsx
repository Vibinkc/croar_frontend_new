"use client";

/**
 * The career page, from the inside.
 *
 * Croar has always served a public careers listing at /jobs?company=<slug>, but nothing in the
 * app linked to it and the slug is not something a recruiter knows — so in practice the page
 * existed and nobody could find it. This is the way in: the link, what is on it right now, and
 * the one rule that decides whether a job appears.
 *
 * Deliberately not a separate product. It reads the same public endpoint a candidate hits, so
 * what this page lists is exactly what a visitor sees, rather than a second opinion that can
 * drift from it.
 */

import { useCallback, useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";

interface Company {
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
}

interface PublicJob {
    id: string;
    title: string;
    location?: string | null;
    job_type?: string | null;
    work_mode?: string | null;
}

export default function CareerPageSettings() {
    const { t: tr } = useI18n();
    const { token, isLoading: authLoading } = useAuth();
    const [company, setCompany] = useState<Company | null>(null);
    const [jobs, setJobs] = useState<PublicJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const load = useCallback(async () => {
        if (authLoading) return; // still restoring the session; not an answer yet
        if (!token) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/company/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            const primary: Company | undefined = Array.isArray(data) ? data[0] : data;
            setCompany(primary || null);

            if (primary?.slug) {
                // The public endpoint, not an authenticated one: this page should show what a
                // visitor sees, not what the database holds.
                const jr = await fetch(
                    `${BACKEND_URL}/api/v1/enterprise/public/jobs/list?company_slug=${encodeURIComponent(primary.slug)}`
                );
                setJobs(jr.ok ? await jr.json() : []);
            }
        } catch {
            setCompany(null);
        } finally {
            setLoading(false);
        }
    }, [token, authLoading]);

    useEffect(() => {
        void load();
    }, [load]);

    const url =
        company?.slug && typeof window !== "undefined"
            ? `${window.location.origin}/jobs?company=${company.slug}`
            : "";

    const copy = () => {
        void navigator.clipboard?.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
    };

    return (
        <div className="p-6 max-w-[900px] mx-auto space-y-5">
            <div>
                <h1 className="text-[22px] font-bold text-[#15171C]">{tr("careerPage.title")}</h1>
                <p className="text-[13px] text-[#8A929E] mt-1">{tr("careerPage.subtitle")}</p>
            </div>

            {loading ? (
                <div className="py-12 flex justify-center">
                    <div className="w-6 h-6 border-2 border-[#5B53E0]/30 border-t-[#5B53E0] rounded-full animate-spin" />
                </div>
            ) : !company?.slug ? (
                <div className="p-4 rounded-[12px] border border-[#F3DDBA] bg-[#FEF3E2]">
                    <p className="text-[12.5px] font-bold text-[#8A5B08]">{tr("careerPage.noCompany")}</p>
                </div>
            ) : (
                <>
                    <div className="rounded-[12px] border border-[#E8EAED] bg-white p-4 space-y-3">
                        <div>
                            <h2 className="text-[15px] font-bold text-[#15171C]">{tr("careerPage.linkTitle")}</h2>
                            <p className="text-[12px] text-[#8A929E] leading-relaxed mt-1">{tr("careerPage.linkDesc")}</p>
                        </div>
                        <div className="flex gap-1.5">
                            <input
                                readOnly
                                value={url}
                                onFocus={(e) => e.currentTarget.select()}
                                aria-label={tr("careerPage.linkTitle")}
                                className="flex-1 min-w-0 h-9 px-2.5 rounded-[8px] border border-[#E8EAED] bg-[#FAFAFB] text-[12px] text-[#374151]"
                            />
                            <button
                                onClick={copy}
                                className="h-9 px-3 rounded-[8px] bg-[#5B53E0] text-white text-[12px] font-semibold hover:bg-[#4A43C9] transition-colors shrink-0"
                            >
                                {copied ? tr("careerPage.copied") : tr("careerPage.copy")}
                            </button>
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-9 px-3 rounded-[8px] border border-[#E8EAED] bg-white text-[12px] font-semibold text-[#374151] hover:border-[#5B53E0]/50 hover:text-[#5B53E0] transition-colors shrink-0 inline-flex items-center"
                            >
                                {tr("careerPage.open")}
                            </a>
                        </div>
                    </div>

                    <div className="rounded-[12px] border border-[#E8EAED] bg-white p-4 space-y-3">
                        <div>
                            <h2 className="text-[15px] font-bold text-[#15171C]">
                                {tr("careerPage.liveTitle")}{" "}
                                <span className="text-[#A8AEB8] font-semibold">({jobs.length})</span>
                            </h2>
                            {/* The single rule that decides what is on the page — and the same rule
                                that decides whether a job board can see it. */}
                            <p className="text-[12px] text-[#8A929E] leading-relaxed mt-1">{tr("careerPage.liveDesc")}</p>
                        </div>

                        {jobs.length === 0 ? (
                            <p className="text-[12.5px] text-[#8A929E] py-4 text-center">{tr("careerPage.noJobs")}</p>
                        ) : (
                            <div className="divide-y divide-[#F0F0F1]">
                                {jobs.map((job) => (
                                    <a
                                        key={job.id}
                                        href={`/enterprise/jobs/${job.id}`}
                                        className="py-2.5 flex items-center gap-3 group"
                                    >
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-[13px] font-semibold text-[#15171C] group-hover:text-[#5B53E0] transition-colors">
                                                {job.title}
                                            </span>
                                            <span className="block text-[11.5px] text-[#8A929E]">
                                                {[job.location, job.work_mode, job.job_type].filter(Boolean).join(" · ") || "—"}
                                            </span>
                                        </span>
                                        <span className="material-symbols-rounded text-[18px] text-[#C3C7CE] group-hover:text-[#5B53E0] transition-colors">
                                            chevron_right
                                        </span>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
