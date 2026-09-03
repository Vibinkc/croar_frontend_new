"use client";

/**
 * The integration marketplace.
 *
 * Every third-party tool Croar can connect to, in one grid, with a category filter and a
 * search — the shape Manatal uses, because a flat list stops being usable somewhere around a
 * dozen entries and this one already holds fifteen.
 *
 * Each card leads to that integration's own page rather than opening a form in place. The
 * connect step needs room: what the integration actually does, its credentials, and consent to
 * the provider's terms — none of which fits in a card, and all of which someone should read
 * before handing over an API key.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import ConnectionsPanel from "@/components/enterprise/ConnectionsPanel";

interface Integration {
    key: string;
    name: string;
    category: string;
    summary: string;
    docs_url: string | null;
    icon_url: string | null;
    brand_color: string;
    api_tier: "free" | "paid" | "link";
    free_to_try: boolean;
    trial_note: string;
    connected: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
    assessment: "Assessment",
    interview: "Interview",
    job_board: "Job board",
    meeting: "Meeting",
    email: "Email",
};

/** Brand mark with a coloured monogram behind it, so a blocked favicon still reads as the tool. */
function Mark({ item }: { item: Integration }) {
    const [failed, setFailed] = useState(false);
    return (
        <span
            className="w-11 h-11 shrink-0 rounded-[10px] flex items-center justify-center overflow-hidden border border-[#E8EAED] bg-white"
            style={failed || !item.icon_url ? { background: `${item.brand_color}14` } : undefined}
        >
            {item.icon_url && !failed ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={item.icon_url} alt="" className="w-6 h-6 object-contain" onError={() => setFailed(true)} />
            ) : (
                <span className="text-[15px] font-extrabold" style={{ color: item.brand_color }}>
                    {item.name.charAt(0)}
                </span>
            )}
        </span>
    );
}

export default function IntegrationsMarketplace() {
    const { t: tr } = useI18n();
    const { token, isLoading: authLoading } = useAuth();
    const [items, setItems] = useState<Integration[]>([]);
    const [boards, setBoards] = useState<{ key: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("all");
    const [freeOnly, setFreeOnly] = useState(false);

    const load = useCallback(async () => {
        if (authLoading) return;
        if (!token) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/integrations/catalog`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setItems(data.integrations || []);
            setBoards(data.job_boards || []);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [token, authLoading]);

    useEffect(() => {
        void load();
    }, [load]);

    const categories = useMemo(
        () => ["all", ...Array.from(new Set(items.map((i) => i.category)))],
        [items]
    );

    const shown = useMemo(() => {
        const q = query.trim().toLowerCase();
        return items.filter(
            (i) =>
                (category === "all" || i.category === category) &&
                (!freeOnly || i.free_to_try) &&
                (!q || i.name.toLowerCase().includes(q) || i.summary.toLowerCase().includes(q))
        );
    }, [items, query, category, freeOnly]);

    const connectedCount = items.filter((i) => i.connected).length;

    return (
        <div className="p-6 max-w-[1100px] mx-auto space-y-5">
            <div>
                <h1 className="text-[22px] font-bold text-[#15171C]">{tr("integrations.title")}</h1>
                <p className="text-[13px] text-[#8A929E] mt-1">
                    {tr("integrations.subtitle")}
                    {connectedCount > 0 && ` · ${tr("integrations.connectedCount", { count: connectedCount })}`}
                </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                <div className="flex gap-1 flex-wrap">
                    <button
                        onClick={() => setFreeOnly((v) => !v)}
                        className={`h-8 px-3 rounded-[8px] text-[12px] font-semibold transition-colors ${
                            freeOnly
                                ? "bg-[#5B53E0] text-white"
                                : "border border-[#E8EAED] bg-white text-[#6B6F76] hover:border-[#5B53E0]/50 hover:text-[#5B53E0]"
                        }`}
                    >
                        {tr("integrations.freeToTry")}
                    </button>
                    {categories.map((c) => (
                        <button
                            key={c}
                            onClick={() => setCategory(c)}
                            className={`h-8 px-3 rounded-[8px] text-[12px] font-semibold transition-colors ${
                                category === c
                                    ? "bg-[#5B53E0] text-white"
                                    : "border border-[#E8EAED] bg-white text-[#6B6F76] hover:border-[#5B53E0]/50 hover:text-[#5B53E0]"
                            }`}
                        >
                            {c === "all" ? tr("integrations.all") : CATEGORY_LABELS[c] || c}
                        </button>
                    ))}
                </div>
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={tr("integrations.search")}
                    className="h-8 px-3 ml-auto w-full sm:w-[240px] rounded-[8px] border border-[#E8EAED] bg-white text-[12.5px] text-[#15171C] placeholder:text-[#A8AEB8] focus:border-[#5B53E0]/50 outline-none"
                />
            </div>

            {loading ? (
                <div className="py-12 flex justify-center">
                    <div className="w-6 h-6 border-2 border-[#5B53E0]/30 border-t-[#5B53E0] rounded-full animate-spin" />
                </div>
            ) : shown.length === 0 ? (
                <p className="text-[12.5px] text-[#8A929E] py-10 text-center">{tr("integrations.noResults")}</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {shown.map((item) => (
                        <Link
                            key={item.key}
                            href={`/enterprise/integrations/${item.key}`}
                            className="group rounded-[12px] border border-[#E8EAED] bg-white flex flex-col hover:border-[#5B53E0]/45 hover:shadow-[0_2px_10px_rgba(91,83,224,0.07)] transition-all"
                        >
                            <div className="p-4 flex-1">
                                <div className="flex items-start gap-3">
                                    <Mark item={item} />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[13.5px] font-bold text-[#15171C]">{item.name}</p>
                                        <p className="text-[10px] font-bold text-[#A8AEB8] uppercase tracking-wider mt-0.5">
                                            {CATEGORY_LABELS[item.category] || item.category}
                                        </p>
                                    </div>
                                    {item.connected && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] uppercase tracking-wide bg-[#E4F5EF] text-[#0E8A6E] shrink-0">
                                            {tr("integrations.connected")}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11.5px] text-[#8A929E] leading-relaxed mt-2.5">{item.summary}</p>
                            </div>
                            <div className="border-t border-[#F0F0F1] px-4 py-2.5 flex items-center justify-between">
                                <span className="text-[12px] font-bold text-[#5B53E0]">
                                    {item.connected ? tr("integrations.manage") : tr("integrations.enable")}
                                </span>
                                {/* Which tools can be tried without a sales call is the first
                                    question asked of a marketplace, so it is on the card rather
                                    than a page deeper. Kept separate from "free API": a tool can
                                    offer one without the other. */}
                                <span className="flex gap-1">
                                    {item.free_to_try && (
                                        <span
                                            title={item.trial_note}
                                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] uppercase tracking-wide bg-[#EDECFB] text-[#5B53E0]"
                                        >
                                            {tr("integrations.freeToTry")}
                                        </span>
                                    )}
                                    {item.api_tier === "free" && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] uppercase tracking-wide bg-[#E4F5EF] text-[#0E8A6E]">
                                            {tr("integrations.freeApi")}
                                        </span>
                                    )}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Job boards are in the same catalogue but publish rather than connect, so they get
                a pointer to their own screen instead of a card that would behave differently
                from every other card here. */}
            {boards.length > 0 && (
                <div className="rounded-[12px] border border-[#E8EAED] bg-white p-4">
                    <h2 className="text-[14px] font-bold text-[#15171C]">{tr("integrations.boardsTitle")}</h2>
                    <p className="text-[12px] text-[#8A929E] leading-relaxed mt-1">
                        {tr("integrations.boardsHint", { count: boards.length })}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {boards.slice(0, 12).map((b) => (
                            <span
                                key={b.key}
                                className="text-[11px] font-semibold px-2 py-1 rounded-[6px] bg-[#F7F8FA] border border-[#E8EAED] text-[#4B5057]"
                            >
                                {b.name}
                            </span>
                        ))}
                    </div>
                    <Link
                        href="/enterprise/settings/job-portals"
                        className="inline-flex items-center gap-1.5 mt-3.5 h-9 px-3 rounded-[9px] border border-[#E8EAED] bg-white text-[12px] font-semibold text-[#374151] hover:border-[#5B53E0]/50 hover:text-[#5B53E0] transition-colors"
                    >
                        <span className="material-symbols-rounded text-[17px]">open_in_new</span>
                        {tr("integrations.manageBoards")}
                    </Link>
                </div>
            )}

            {/* Mailboxes, calendar, Slack and the ATS list. Same screen, because "what is this
                account connected to?" is one question and used to have two answers. */}
            <div className="border-t border-[#E8EAED] pt-6 mt-2">
                <ConnectionsPanel />
            </div>
        </div>
    );
}
