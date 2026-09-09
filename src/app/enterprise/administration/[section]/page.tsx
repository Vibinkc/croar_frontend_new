"use client";

/**
 * One Administration section — the rows inside a card.
 *
 * Manatal's sub-pages are a plain list: name, one line of description, a chevron. Kept exactly,
 * with one difference that is the point of the screen: an item Croar cannot do is greyed and
 * carries its reason where the description would be, instead of being quietly omitted.
 *
 * The section list comes from the API rather than being hardcoded here, so the page cannot drift
 * out of step with what the backend says is available.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Icon, PageHeader, cn } from "@/components/ds";
import type { AdminSection } from "../page";

export default function AdministrationSectionPage() {
    const { t: tr } = useI18n();
    const { token, isLoading: authLoading } = useAuth();
    const params = useParams<{ section: string }>();
    const router = useRouter();

    const [section, setSection] = useState<AdminSection | null>(null);
    const [loading, setLoading] = useState(true);
    const [missing, setMissing] = useState(false);

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/administration/overview`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) { setMissing(true); return; }
            const found = ((await res.json()).sections as AdminSection[]).find((s) => s.id === params.section);
            if (!found) setMissing(true);
            else setSection(found);
        } catch {
            setMissing(true);
        } finally {
            setLoading(false);
        }
    }, [token, params.section]);

    useEffect(() => { if (!authLoading && token) void load(); }, [authLoading, token, load]);

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-6">
                <PageHeader
                    title={section?.name || tr("admin.title")}
                    subtitle={section?.description}
                    icon={section?.icon ? undefined : "lock"}
                    onBack={() => router.push("/enterprise/administration")}
                />
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-6 h-6 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                    </div>
                ) : missing || !section ? (
                    <div className="bg-white border border-[#E0E0E0] rounded-[4px] px-4 py-8 text-center">
                        <p className="text-[13px] text-[#757575]">{tr("admin.sectionMissing")}</p>
                    </div>
                ) : (
                    <div className="bg-white border border-[#E0E0E0] rounded-[4px] divide-y divide-[#EEEEEE] max-w-[860px] overflow-hidden">
                        {section.items.map((item) => {
                            const body = (
                                <>
                                    <span className="min-w-0 flex-1">
                                        <span className={cn("block text-[13.5px] font-medium", item.available ? "text-[#212121]" : "text-[#9E9E9E]")}>
                                            {item.name}
                                        </span>
                                        <span className={cn("block text-[12.5px] mt-0.5 leading-relaxed", item.available ? "text-[#757575]" : "text-[#EF6C00]")}>
                                            {item.available ? item.description : item.unavailable}
                                        </span>
                                    </span>
                                    {item.available
                                        ? <Icon name="chevron-right" className="text-[20px] text-[#BDBDBD] shrink-0" />
                                        : <Icon name="lock" className="text-[18px] text-[#BDBDBD] shrink-0" />}
                                </>
                            );
                            return item.available && item.href ? (
                                <Link key={item.name} href={item.href}
                                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#FAFCFE] transition-colors">
                                    {body}
                                </Link>
                            ) : (
                                <div key={item.name} className="flex items-center gap-3 px-4 py-3.5 bg-[#FAFAFA]">
                                    {body}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
