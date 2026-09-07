"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { BACKEND_URL } from "@/utils/api";
import { Card, EmptyState, cn } from "@/components/ds";

interface JobActivity {
    id: string;
    action: string;
    actor_name?: string | null;
    detail?: Record<string, unknown> | null;
    created_at: string;
}

/**
 * Glyph + tone per audit action. Anything unrecognised falls back to a neutral dot rather than
 * being hidden — an unknown action is still something the team did to this job.
 */
const ACTION_LOOK: Record<string, { icon: string; cls: string }> = {
    created: { icon: "add_circle", cls: "bg-[#E8F5E9] text-[#2E7D32]" },
    updated: { icon: "edit", cls: "bg-[#E3F2FD] text-[#1565C0]" },
    assigned: { icon: "person_add", cls: "bg-[#E3F2FD] text-[#1976D2]" },
    viewed: { icon: "visibility", cls: "bg-[#EEEEEE] text-[#4F4F4F]" },
    published: { icon: "campaign", cls: "bg-[#FFF3E0] text-[#EF6C00]" },
    deleted: { icon: "delete", cls: "bg-[#FFEBEE] text-[#C62828]" },
    note_added: { icon: "sticky_note_2", cls: "bg-[#E3F2FD] text-[#1976D2]" },
    attachment_added: { icon: "attach_file", cls: "bg-[#E8F5E9] text-[#2E7D32]" },
    attachment_removed: { icon: "delete", cls: "bg-[#FFEBEE] text-[#C62828]" },
};

const FALLBACK_LOOK = { icon: "radio_button_checked", cls: "bg-[#EEEEEE] text-[#4F4F4F]" };

/** "attachment_added" → "Attachment added" — used only when there is no translation for the key. */
const humanise = (action: string) =>
    action.replace(/_/g, " ").replace(/^./, c => c.toUpperCase());

export default function JobActivitiesTab({ jobId }: { jobId: string }) {
    const { token } = useAuth();
    const { t: tr } = useI18n();
    const [rows, setRows] = useState<JobActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${jobId}/activity`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setRows(await res.json());
        } catch {
            // A failed audit-trail fetch shows as the empty state; it must never break the page.
        } finally {
            setIsLoading(false);
        }
    }, [jobId, token]);

    useEffect(() => {
        void load();
    }, [load]);

    const label = (action: string) => {
        const key = `jobActivity.action.${action}`;
        const translated = tr(key);
        // The i18n helper echoes the key back when it has no entry — fall back to a readable form.
        return translated === key ? humanise(action) : translated;
    };

    if (isLoading) {
        return (
            <Card padding="sm" className="animate-in fade-in duration-500">
                <p className="py-10 text-center text-[13px] text-[#757575]">{tr("jobActivity.loading")}</p>
            </Card>
        );
    }

    if (rows.length === 0) {
        return (
            <Card padding="none" className="animate-in fade-in duration-500">
                <EmptyState
                    icon="history"
                    tone="muted"
                    title={tr("jobActivity.emptyTitle")}
                    description={tr("jobActivity.emptyDesc")}
                />
            </Card>
        );
    }

    return (
        <Card padding="none" className="overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="px-5 py-4 border-b border-[#EEEEEE]">
                <h3 className="text-[15px] font-bold text-[#212121]">{tr("jobActivity.title")}</h3>
                <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("jobActivity.subtitle")}</p>
            </div>

            <ol className="px-5 py-4">
                {rows.map((row, i) => {
                    const look = ACTION_LOOK[row.action] || FALLBACK_LOOK;
                    const isLast = i === rows.length - 1;
                    const extra = row.detail?.filename ? String(row.detail.filename) : "";
                    return (
                        <li key={row.id} className="flex gap-3 relative pb-5 last:pb-0">
                            {/* Connector line — omitted on the last row so the trail ends cleanly. */}
                            {!isLast && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-[#E0E0E0]" />}
                            <span
                                className={cn(
                                    "w-8 h-8 shrink-0 rounded-full flex items-center justify-center relative z-10",
                                    look.cls
                                )}
                            >
                                <span className="material-symbols-rounded text-[17px]">{look.icon}</span>
                            </span>
                            <div className="min-w-0 flex-1 pt-1">
                                <p className="text-[13px] text-[#212121] leading-snug">
                                    <span className="font-bold">{row.actor_name || tr("jobActivity.someone")}</span>{" "}
                                    <span className="text-[#4B5057]">{label(row.action).toLowerCase()}</span>
                                    {extra && <span className="text-[#757575]"> — {extra}</span>}
                                </p>
                                <p className="text-[11.5px] text-[#757575] mt-0.5">
                                    {new Date(row.created_at).toLocaleString()}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </Card>
    );
}
