"use client";

/**
 * Administration — Manatal's admin hub.
 *
 * Ten cards, each opening a sub-list of settings. Most of what they hold, Croar already had —
 * scattered across a "General" nav group where nobody looked for them. So this page is mostly
 * a map: every item Manatal lists, pointed at the Croar page that already does it.
 *
 * Each card carries "N of M available", so a section that is mostly gaps says so before you
 * click into it, and the two sections with new tooling behind them (Data Management, Features)
 * are not visually indistinguishable from the ones that are just links.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { EmptyState, Icon, PageHeader, cn } from "@/components/ds";

export interface AdminItem {
    name: string;
    description?: string;
    href?: string;
    unavailable?: string;
    available: boolean;
}
export interface AdminSection {
    id: string;
    name: string;
    description: string;
    icon: string;
    items: AdminItem[];
    available_count: number;
    total_count: number;
}

export default function AdministrationPage() {
    const { t: tr } = useI18n();
    const { token, isLoading: authLoading } = useAuth();

    const [sections, setSections] = useState<AdminSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/administration/overview`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) { setError(tr("admin.loadFailed")); return; }
            setSections((await res.json()).sections || []);
        } catch {
            setError(tr("admin.loadFailed"));
        } finally {
            setLoading(false);
        }
    }, [token, tr]);

    useEffect(() => { if (!authLoading && token) void load(); }, [authLoading, token, load]);

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-6">
                <PageHeader title={tr("admin.title")} subtitle={tr("admin.subtitle")} icon="lock" />
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                {error && <p className="mb-4 text-[12.5px] text-[#C62828] bg-[#FFEBEE] rounded-[4px] px-3 py-2">{error}</p>}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-6 h-6 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                    </div>
                ) : sections.length === 0 ? (
                    <div className="bg-white border border-[#E0E0E0] rounded-[4px]">
                        <EmptyState icon="lock" tone="muted" title={tr("admin.emptyTitle")} description={tr("admin.emptyDesc")} />
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 gap-4 max-w-[1100px]">
                        {sections.map((s) => (
                            <Link
                                key={s.id}
                                href={`/enterprise/administration/${s.id}`}
                                className="bg-white border border-[#E0E0E0] rounded-[4px] p-5 flex items-start gap-4 hover:border-[#1976D2] hover:bg-[#FAFCFE] transition-colors"
                            >
                                <span className="w-11 h-11 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center shrink-0">
                                    <Icon name={s.icon} className="text-[24px]" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[15px] font-medium text-[#212121]">{s.name}</span>
                                    <span className="block text-[12.5px] text-[#757575] mt-0.5 leading-relaxed">{s.description}</span>
                                    <span className={cn(
                                        "block text-[11.5px] mt-2 tabular-nums",
                                        // A section that is entirely gaps should read as one before you open it.
                                        s.available_count === 0 ? "text-[#EF6C00]" : "text-[#9E9E9E]"
                                    )}>
                                        {tr("admin.nOfM", { available: s.available_count, total: s.total_count })}
                                    </span>
                                </span>
                                <Icon name="chevron-right" className="text-[20px] text-[#BDBDBD] shrink-0 mt-1" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
