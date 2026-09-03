"use client";

/**
 * The career page, from the inside.
 *
 * Croar has always served a public careers listing at /jobs?company=<slug>, but nothing in the
 * app linked to it and the slug is not something a recruiter knows — so in practice the page
 * existed and nobody could find it. This is the way in: the link, the settings that dress the
 * page, the snippets for putting it on the company's own site, and what is live on it now.
 *
 * Deliberately not a separate product. The live-jobs list reads the same public endpoint a
 * candidate hits, so what this page shows is exactly what a visitor sees rather than a second
 * opinion that can drift from it.
 */

import { useCallback, useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";

interface PublicJob {
    id: string;
    title: string;
    location?: string | null;
    job_type?: string | null;
    work_mode?: string | null;
}

interface Settings {
    headline: string;
    intro: string;
    brand_color: string;
    logo_url: string;
    cover_url: string;
    contact_email: string;
    contact_phone: string;
    website: string;
    linkedin: string;
    twitter: string;
    facebook: string;
    instagram: string;
    youtube: string;
    show_share_buttons: boolean;
    application_terms: string;
    privacy_policy: string;
    ga_measurement_id: string;
}

const EMPTY: Settings = {
    headline: "", intro: "", brand_color: "", logo_url: "", cover_url: "",
    contact_email: "", contact_phone: "", website: "",
    linkedin: "", twitter: "", facebook: "", instagram: "", youtube: "",
    show_share_buttons: true, application_terms: "", privacy_policy: "", ga_measurement_id: "",
};

type Tab = "general" | "social" | "policy" | "embed" | "jobs";

function Field({
    label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-[12px] font-bold text-[#15171C] mb-1">{label}</label>
            {hint && <p className="text-[11.5px] text-[#8A929E] leading-relaxed mb-1.5">{hint}</p>}
            {children}
        </div>
    );
}

const INPUT =
    "w-full h-9 px-2.5 rounded-[8px] border border-[#E8EAED] bg-white text-[12.5px] text-[#15171C] placeholder:text-[#A8AEB8] focus:border-[#5B53E0]/50 outline-none";
const AREA =
    "w-full px-2.5 py-2 rounded-[8px] border border-[#E8EAED] bg-white text-[12.5px] text-[#15171C] placeholder:text-[#A8AEB8] focus:border-[#5B53E0]/50 outline-none leading-relaxed resize-y";

export default function CareerPageSettings() {
    const { t: tr } = useI18n();
    const { token, isLoading: authLoading, canAccess } = useAuth();
    const [slug, setSlug] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [settings, setSettings] = useState<Settings>(EMPTY);
    const [jobs, setJobs] = useState<PublicJob[]>([]);
    const [tab, setTab] = useState<Tab>("general");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState("");

    const canEdit = canAccess ? canAccess("organization:update") : false;

    const load = useCallback(async () => {
        if (authLoading) return; // still restoring the session; not an answer yet
        if (!token) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/career-page/settings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setSlug(data.slug || "");
                setCompanyName(data.company_name || "");
                setSettings({ ...EMPTY, ...(data.settings || {}) });

                if (data.slug) {
                    const jr = await fetch(
                        `${BACKEND_URL}/api/v1/enterprise/public/jobs/list?company_slug=${encodeURIComponent(data.slug)}`
                    );
                    setJobs(jr.ok ? await jr.json() : []);
                }
            }
        } catch {
            /* leave the form empty; the page still shows the link */
        } finally {
            setLoading(false);
        }
    }, [token, authLoading]);

    useEffect(() => {
        void load();
    }, [load]);

    const save = async () => {
        if (!token) return;
        setSaving(true);
        setSaved(false);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/career-page/settings`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            if (res.ok) {
                setSaved(true);
                window.setTimeout(() => setSaved(false), 2200);
            }
        } finally {
            setSaving(false);
        }
    };

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = slug ? `${origin}/jobs?company=${slug}` : "";
    const linkSnippet = url ? `<a href="${url}">Careers</a>` : "";
    const iframeSnippet = url ? `<iframe src="${url}" width="100%" height="900" frameborder="0"></iframe>` : "";
    const feedUrl = `${BACKEND_URL}/api/v1/jobs/feed/indeed.xml`;

    const copy = (value: string, key: string) => {
        void navigator.clipboard?.writeText(value);
        setCopied(key);
        window.setTimeout(() => setCopied(""), 1600);
    };

    const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
        setSettings((s) => ({ ...s, [key]: value }));

    const TABS: { key: Tab; label: string }[] = [
        { key: "general", label: tr("careerPage.tabGeneral") },
        { key: "social", label: tr("careerPage.tabSocial") },
        { key: "policy", label: tr("careerPage.tabPolicy") },
        { key: "embed", label: tr("careerPage.tabEmbed") },
        { key: "jobs", label: `${tr("careerPage.tabJobs")} (${jobs.length})` },
    ];

    return (
        <div className="p-6 max-w-[900px] mx-auto space-y-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-[22px] font-bold text-[#15171C]">{tr("careerPage.title")}</h1>
                    <p className="text-[13px] text-[#8A929E] mt-1">{tr("careerPage.subtitle")}</p>
                </div>
                {url && (
                    <div className="flex gap-1.5">
                        <button
                            onClick={() => copy(url, "url")}
                            className="h-9 px-3 rounded-[9px] border border-[#E8EAED] bg-white text-[12px] font-semibold text-[#374151] hover:border-[#5B53E0]/50 hover:text-[#5B53E0] transition-colors"
                        >
                            {copied === "url" ? tr("careerPage.copied") : tr("careerPage.copyLink")}
                        </button>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-9 px-3 rounded-[9px] bg-[#5B53E0] text-white text-[12px] font-semibold hover:bg-[#4A43C9] transition-colors inline-flex items-center gap-1.5"
                        >
                            <span className="material-symbols-rounded text-[16px]">open_in_new</span>
                            {tr("careerPage.open")}
                        </a>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="py-12 flex justify-center">
                    <div className="w-6 h-6 border-2 border-[#5B53E0]/30 border-t-[#5B53E0] rounded-full animate-spin" />
                </div>
            ) : !slug ? (
                <div className="p-4 rounded-[12px] border border-[#F3DDBA] bg-[#FEF3E2]">
                    <p className="text-[12.5px] font-bold text-[#8A5B08]">{tr("careerPage.noCompany")}</p>
                </div>
            ) : (
                <>
                    <div className="flex gap-1 border-b border-[#E8EAED] overflow-x-auto">
                        {TABS.map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`px-3 py-2 text-[12.5px] font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                                    tab === t.key
                                        ? "border-[#5B53E0] text-[#5B53E0]"
                                        : "border-transparent text-[#8A929E] hover:text-[#15171C]"
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="rounded-[12px] border border-[#E8EAED] bg-white p-4 space-y-4">
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
                                                placeholder="#5B53E0"
                                            />
                                            <span
                                                className="w-9 h-9 shrink-0 rounded-[8px] border border-[#E8EAED]"
                                                style={{ background: settings.brand_color || "#5B53E0" }}
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
                                        <input className={INPUT} value={settings.contact_email} onChange={(e) => set("contact_email", e.target.value)} placeholder="careers@company.com" />
                                    </Field>
                                    <Field label={tr("careerPage.contactPhone")}>
                                        <input className={INPUT} value={settings.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} />
                                    </Field>
                                </div>
                                <Field label={tr("careerPage.website")}>
                                    <input className={INPUT} value={settings.website} onChange={(e) => set("website", e.target.value)} placeholder="https://company.com" />
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
                                        className="w-4 h-4 accent-[#5B53E0]"
                                    />
                                    <span className="text-[12.5px] text-[#15171C]">{tr("careerPage.shareButtons")}</span>
                                </label>
                            </>
                        )}

                        {tab === "policy" && (
                            <>
                                <Field label={tr("careerPage.applicationTerms")} hint={tr("careerPage.applicationTermsHint")}>
                                    <textarea className={AREA} rows={7} value={settings.application_terms} onChange={(e) => set("application_terms", e.target.value)} />
                                </Field>
                                <Field label={tr("careerPage.privacyPolicy")} hint={tr("careerPage.privacyPolicyHint")}>
                                    <textarea className={AREA} rows={7} value={settings.privacy_policy} onChange={(e) => set("privacy_policy", e.target.value)} />
                                </Field>
                            </>
                        )}

                        {tab === "embed" && (
                            <>
                                {/* Nothing to save here — these are derived from the link, so they are
                                    read-only rather than fields that can drift out of step with it. */}
                                <Field label={tr("careerPage.embedLink")} hint={tr("careerPage.embedLinkHint")}>
                                    <div className="flex gap-1.5">
                                        <input readOnly value={linkSnippet} onFocus={(e) => e.currentTarget.select()} aria-label={tr("careerPage.embedLink")} className={`${INPUT} bg-[#FAFAFB] font-mono text-[11.5px]`} />
                                        <button onClick={() => copy(linkSnippet, "link")} className="h-9 px-3 rounded-[8px] border border-[#E8EAED] bg-white text-[12px] font-semibold text-[#374151] hover:border-[#5B53E0]/50 hover:text-[#5B53E0] transition-colors shrink-0">
                                            {copied === "link" ? tr("careerPage.copied") : tr("careerPage.copy")}
                                        </button>
                                    </div>
                                </Field>
                                <Field label={tr("careerPage.embedIframe")} hint={tr("careerPage.embedIframeHint")}>
                                    <div className="flex gap-1.5">
                                        <input readOnly value={iframeSnippet} onFocus={(e) => e.currentTarget.select()} aria-label={tr("careerPage.embedIframe")} className={`${INPUT} bg-[#FAFAFB] font-mono text-[11.5px]`} />
                                        <button onClick={() => copy(iframeSnippet, "iframe")} className="h-9 px-3 rounded-[8px] border border-[#E8EAED] bg-white text-[12px] font-semibold text-[#374151] hover:border-[#5B53E0]/50 hover:text-[#5B53E0] transition-colors shrink-0">
                                            {copied === "iframe" ? tr("careerPage.copied") : tr("careerPage.copy")}
                                        </button>
                                    </div>
                                </Field>
                                <Field label={tr("careerPage.embedFeed")} hint={tr("careerPage.embedFeedHint")}>
                                    <div className="flex gap-1.5">
                                        <input readOnly value={feedUrl} onFocus={(e) => e.currentTarget.select()} aria-label={tr("careerPage.embedFeed")} className={`${INPUT} bg-[#FAFAFB] font-mono text-[11.5px]`} />
                                        <button onClick={() => copy(feedUrl, "feed")} className="h-9 px-3 rounded-[8px] border border-[#E8EAED] bg-white text-[12px] font-semibold text-[#374151] hover:border-[#5B53E0]/50 hover:text-[#5B53E0] transition-colors shrink-0">
                                            {copied === "feed" ? tr("careerPage.copied") : tr("careerPage.copy")}
                                        </button>
                                    </div>
                                </Field>
                            </>
                        )}

                        {tab === "jobs" && (
                            <>
                                {/* The single rule that decides what is on the page — and the same rule
                                    that decides whether a job board can see it. */}
                                <p className="text-[12px] text-[#8A929E] leading-relaxed">{tr("careerPage.liveDesc")}</p>
                                {jobs.length === 0 ? (
                                    <p className="text-[12.5px] text-[#8A929E] py-4 text-center">{tr("careerPage.noJobs")}</p>
                                ) : (
                                    <div className="divide-y divide-[#F0F0F1]">
                                        {jobs.map((job) => (
                                            <a key={job.id} href={`/enterprise/jobs/${job.id}`} className="py-2.5 flex items-center gap-3 group">
                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-[13px] font-semibold text-[#15171C] group-hover:text-[#5B53E0] transition-colors">{job.title}</span>
                                                    <span className="block text-[11.5px] text-[#8A929E]">
                                                        {[job.location, job.work_mode, job.job_type].filter(Boolean).join(" · ") || "—"}
                                                    </span>
                                                </span>
                                                <span className="material-symbols-rounded text-[18px] text-[#C3C7CE] group-hover:text-[#5B53E0] transition-colors">chevron_right</span>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Embed and Jobs have nothing to save, so a save bar there would be a button
                        that does nothing. */}
                    {tab !== "embed" && tab !== "jobs" && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => void save()}
                                disabled={saving || !canEdit}
                                className="h-9 px-4 rounded-[9px] bg-[#5B53E0] text-white text-[12.5px] font-bold hover:bg-[#4A43C9] transition-colors disabled:opacity-50"
                            >
                                {saving ? tr("careerPage.saving") : tr("careerPage.save")}
                            </button>
                            {saved && (
                                <span className="text-[12px] font-semibold text-[#0E8A6E] inline-flex items-center gap-1">
                                    <span className="material-symbols-rounded text-[16px]">check_circle</span>
                                    {tr("careerPage.savedMsg")}
                                </span>
                            )}
                            {!canEdit && <span className="text-[11.5px] text-[#8A929E]">{tr("careerPage.noPermission")}</span>}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
