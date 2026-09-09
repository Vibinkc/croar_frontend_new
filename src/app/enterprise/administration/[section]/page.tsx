"use client";

/**
 * One Administration section — a two-column grid of cards, matching Manatal.
 *
 * Manatal draws a bespoke illustration on each card. Croar has an icon font rather than an
 * illustration set, so that slot holds a tinted glyph tile instead: same layout, same reading
 * order, drawn from the kit the rest of the product already uses. The glyph comes from the API
 * alongside the name and href, so a card cannot show an icon that disagrees with where it goes.
 *
 * One difference from Manatal, and it is the point of the screen: an item Croar cannot do is
 * greyed and carries its reason where the description would be, rather than being quietly
 * omitted. A gap you can read is more useful than a gap you cannot see.
 *
 * The section list comes from the API rather than being hardcoded here, so the page cannot
 * drift out of step with what the backend says is available.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Icon, PageHeader, cn } from "@/components/ds";
import type { AdminItem, AdminSection } from "../page";

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
                    // Two columns from `md` up. `items-stretch` rather than the default so a card
                    // whose reason runs to three lines does not leave its neighbour floating at a
                    // different height — the pair reads as one row either way.
                    <div className="grid md:grid-cols-2 gap-4 items-stretch max-w-[1180px]">
                        {section.items.map((item) => <ItemCard key={item.name} item={item} />)}
                    </div>
                )}
            </div>
        </div>
    );
}

function ItemCard({ item }: { item: AdminItem }) {
    const body = (
        <>
            <span
                className={cn(
                    "w-[76px] h-[76px] rounded-[4px] flex items-center justify-center shrink-0",
                    item.available ? "bg-[#E3F2FD] text-[#1976D2]" : "bg-[#EEEEEE] text-[#BDBDBD]"
                )}
            >
                <Icon name={item.icon || "cog-outline"} className="text-[38px]" />
            </span>
            <span className="min-w-0 flex-1">
                <span className={cn("block text-[16px] font-medium leading-snug", item.available ? "text-[#212121]" : "text-[#9E9E9E]")}>
                    {item.name}
                </span>
                <span className={cn("block text-[13px] mt-1 leading-relaxed", item.available ? "text-[#757575]" : "text-[#EF6C00]")}>
                    {item.available ? item.description : item.unavailable}
                </span>
            </span>
            {item.available
                ? <Icon name="chevron-right" className="text-[22px] text-[#BDBDBD] shrink-0 self-center" />
                : <Icon name="lock-outline" className="text-[19px] text-[#BDBDBD] shrink-0 self-center" />}
        </>
    );

    const shell = "h-full rounded-[4px] border p-5 flex items-start gap-4";

    return item.available && item.href ? (
        <Link href={item.href} className={cn(shell, "bg-white border-[#E0E0E0] hover:border-[#1976D2] hover:bg-[#FAFCFE] transition-colors")}>
            {body}
        </Link>
    ) : (
        <div className={cn(shell, "bg-[#F5F5F5] border-[#EEEEEE]")}>{body}</div>
    );
}
