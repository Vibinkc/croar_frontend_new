"use client";

/**
 * Shared plumbing for the career-page screens.
 *
 * The section is three routes over one settings record, so loading and saving live here rather
 * than being written three times — otherwise the Job posts screen and the Settings screen end
 * up with two ideas of what the career page URL is.
 *
 * A leading underscore keeps this folder out of the router: Next treats `_shared` as private,
 * so it is a module, not a page.
 */

import { useCallback, useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

export interface PublicJob {
    id: string;
    title: string;
    location?: string | null;
    job_type?: string | null;
    work_mode?: string | null;
}

export interface Settings {
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

export const EMPTY_SETTINGS: Settings = {
    headline: "", intro: "", brand_color: "", logo_url: "", cover_url: "",
    contact_email: "", contact_phone: "", website: "",
    linkedin: "", twitter: "", facebook: "", instagram: "", youtube: "",
    show_share_buttons: true, application_terms: "", privacy_policy: "", ga_measurement_id: "",
};

export function useCareerPage() {
    const { token, isLoading: authLoading, canAccess } = useAuth();
    const [slug, setSlug] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [settings, setSettings] = useState<Settings>(EMPTY_SETTINGS);
    const [jobs, setJobs] = useState<PublicJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

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
                setSettings({ ...EMPTY_SETTINGS, ...(data.settings || {}) });

                if (data.slug) {
                    // The public endpoint, not an authenticated one: these screens should show
                    // what a visitor sees, not a second opinion that can drift from it.
                    const jr = await fetch(
                        `${BACKEND_URL}/api/v1/enterprise/public/jobs/list?company_slug=${encodeURIComponent(data.slug)}`
                    );
                    setJobs(jr.ok ? await jr.json() : []);
                }
            }
        } catch {
            /* leave the form empty; the link and job list still render */
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

    const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
        setSettings((s) => ({ ...s, [key]: value }));

    return { slug, companyName, settings, set, jobs, url, loading, saving, saved, save, canEdit };
}

export const INPUT =
    "w-full h-9 px-2.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[12.5px] text-[#212121] placeholder:text-[#9E9E9E] focus:border-[#1976D2]/50 outline-none";
export const AREA =
    "w-full px-2.5 py-2 rounded-[4px] border border-[#E0E0E0] bg-white text-[12.5px] text-[#212121] placeholder:text-[#9E9E9E] focus:border-[#1976D2]/50 outline-none leading-relaxed resize-y";

export function Field({
    label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-[12px] font-bold text-[#212121] mb-1">{label}</label>
            {hint && <p className="text-[11.5px] text-[#757575] leading-relaxed mb-1.5">{hint}</p>}
            {children}
        </div>
    );
}

/** A read-only value with a copy button — used for every snippet and link in this section. */
export function CopyRow({ value, label, copyLabel, copiedLabel }: {
    value: string; label: string; copyLabel: string; copiedLabel: string;
}) {
    const [copied, setCopied] = useState(false);
    return (
        <div className="flex gap-1.5">
            <input
                readOnly
                value={value}
                aria-label={label}
                onFocus={(e) => e.currentTarget.select()}
                className={`${INPUT} bg-[#FAFAFB] font-mono text-[11.5px]`}
            />
            <button
                onClick={() => {
                    void navigator.clipboard?.writeText(value);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1600);
                }}
                className="h-9 px-3 rounded-[4px] border border-[#E0E0E0] bg-white text-[12px] font-semibold text-[#424242] hover:border-[#1976D2]/50 hover:text-[#1976D2] transition-colors shrink-0"
            >
                {copied ? copiedLabel : copyLabel}
            </button>
        </div>
    );
}

/** The page title plus the two things every screen in this section wants: copy and preview. */
export function CareerPageHeader({
    title, subtitle, url, copyLabel, copiedLabel, openLabel,
}: {
    title: string; subtitle: string; url: string;
    copyLabel: string; copiedLabel: string; openLabel: string;
}) {
    const [copied, setCopied] = useState(false);
    return (
        <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
                <h1 className="text-[22px] font-bold text-[#212121]">{title}</h1>
                <p className="text-[13px] text-[#757575] mt-1">{subtitle}</p>
            </div>
            {url && (
                <div className="flex gap-1.5">
                    <button
                        onClick={() => {
                            void navigator.clipboard?.writeText(url);
                            setCopied(true);
                            window.setTimeout(() => setCopied(false), 1600);
                        }}
                        className="h-9 px-3 rounded-[4px] border border-[#E0E0E0] bg-white text-[12px] font-semibold text-[#424242] hover:border-[#1976D2]/50 hover:text-[#1976D2] transition-colors"
                    >
                        {copied ? copiedLabel : copyLabel}
                    </button>
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 px-3 rounded-[4px] bg-[#1976D2] text-white text-[12px] font-semibold hover:bg-[#1565C0] transition-colors inline-flex items-center gap-1.5"
                    >
                        <i className="mdi mdi-open-in-new text-[16px]" />
                        {openLabel}
                    </a>
                </div>
            )}
        </div>
    );
}

export function Spinner() {
    return (
        <div className="py-12 flex justify-center">
            <div className="w-6 h-6 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
        </div>
    );
}
