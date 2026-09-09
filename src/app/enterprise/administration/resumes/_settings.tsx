"use client";

/**
 * The resume settings, shared by the three Resumes screens.
 *
 * Manatal splits them into General (which view opens first), Branded (logo and watermark) and
 * Custom (your organisation's details on the rendered page). They are three screens over one
 * settings object, so this is one hook and three thin pages rather than three copies of the
 * same fetch-edit-save.
 *
 * Saving sends the whole object every time. A partial PUT would need the server to merge, and a
 * merge is where "I turned the watermark off and it came back" bugs live.
 */

import { useCallback, useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

export interface ResumeSettings {
    tabs: string[];
    default_tab: "original" | "branded" | "custom";
    watermark_enabled: boolean;
    watermark_text: string | null;
    header_logo_url: string | null;
    org_name: string | null;
    org_email: string | null;
    org_website: string | null;
    org_address: string | null;
    hide_contact_details: boolean;
}

export function useResumeSettings() {
    const { token, isLoading: authLoading } = useAuth();
    const [settings, setSettings] = useState<ResumeSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/customization/resumes`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setSettings(await res.json());
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { if (!authLoading && token) void load(); }, [authLoading, token, load]);

    const save = async (patch: Partial<ResumeSettings>) => {
        if (!settings) return;
        const next = { ...settings, ...patch };
        setSettings(next);
        setSaving(true);
        setError("");
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/customization/resumes`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    default_tab: next.default_tab,
                    watermark_enabled: next.watermark_enabled,
                    watermark_text: next.watermark_text,
                    header_logo_url: next.header_logo_url,
                    org_name: next.org_name,
                    org_email: next.org_email,
                    org_website: next.org_website,
                    org_address: next.org_address,
                    hide_contact_details: next.hide_contact_details,
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => null);
                setError(body?.detail || "That could not be saved.");
                return;
            }
            setSaved(true);
            window.setTimeout(() => setSaved(false), 2500);
        } finally {
            setSaving(false);
        }
    };

    return { settings, loading, saving, saved, error, save };
}
