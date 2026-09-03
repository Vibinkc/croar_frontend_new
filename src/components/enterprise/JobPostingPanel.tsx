"use client";

import { useCallback, useEffect, useMemo, useState, type ElementType } from "react";
import { CheckCircle2, AlertCircle, Send, Link2, Lock } from "lucide-react";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";

export interface JobPostingPanelProps {
    jobId: string;
    jobTitle: string;
    token: string | null;
    /** Where this job has already been published, straight off the job record. */
    postings?: { platform: string; status?: string | null; external_id?: string | null }[];
    /** Called after a successful publish so the caller can refresh the job. */
    onPublished?: () => void;
}

interface Portal {
    key: string;
    name: string;
    country: string; // GLOBAL | KR | JP
    integration: string; // structured | feed | api | partner
    requires_credentials: boolean;
    connected: boolean;
    docs_url: string | null;
    note: string | null;
    logo?: string | null;
}

interface PublishResult {
    platform: string;
    status: string;
    ok: boolean;
    url: string | null;
    message: string | null;
}

const COUNTRY_LABEL: Record<string, string> = {
    GLOBAL: "Global",
    KR: "Korea (한국)",
    JP: "Japan (日本)",
};

/**
 * Publishing targets, grouped by what the recruiter has to do before the board will take the
 * post — which is the actual decision here. Country is still shown, but as a label on each
 * board rather than the thing that separates them: a board you cannot post to is not more
 * useful for being in the same country as one you can.
 */
type GroupKey = "ready" | "connect" | "partner";

const PUBLISH_GROUPS: { key: GroupKey; label: string; hint: string }[] = [
    { key: "ready", label: "Ready to post", hint: "Publishes as soon as you hit Publish — nothing to set up." },
    { key: "connect", label: "Needs your account", hint: "Connect your own account once, then these publish with the rest." },
    { key: "partner", label: "Needs a partner contract", hint: "These boards only accept posts through a commercial agreement." },
];

const groupFor = (p: Portal): GroupKey => {
    if (p.connected || !p.requires_credentials) return "ready";
    return p.integration === "partner" ? "partner" : "connect";
};

// Result-status pill styling.
const STATUS_PILL: Record<string, { label: string; cls: string; icon: ElementType }> = {
    PUBLISHED: { label: "Published", cls: "bg-[#E4F5EF] text-[#0E8A6E]", icon: CheckCircle2 },
    LISTED: { label: "Listed", cls: "bg-[#E4F5EF] text-[#0E8A6E]", icon: CheckCircle2 },
    // Not a success and not a pending sync — the board was never pushed to. Amber, like the
    // other "you still have to do something" states, rather than blue-and-hopeful.
    CONNECTED_NO_PUSH: { label: "Post it yourself", cls: "bg-[#FBEFDC] text-[#B26B08]", icon: Link2 },
    // Rows written before the rename carry the old name; render them the same way.
    QUEUED: { label: "Post it yourself", cls: "bg-[#FBEFDC] text-[#B26B08]", icon: Link2 },
    NOT_CONNECTED: { label: "Connect first", cls: "bg-[#FBEFDC] text-[#B26B08]", icon: Link2 },
    PARTNER_REQUIRED: { label: "Partner required", cls: "bg-[#FBEFDC] text-[#B26B08]", icon: Lock },
    ERROR: { label: "Error", cls: "bg-[#FCE8E8] text-[#C0383C]", icon: AlertCircle },
};

/** Flat illustrations for the four routes to market.
 *
 * Drawn here rather than pulled in as assets: they are four small geometric scenes, and inline
 * SVG keeps them on the page's own palette instead of shipping four PNGs.
 */
function HubArt({ kind }: { kind: "free" | "connect" | "partner" | "career" }) {
    const common = { width: 96, height: 70, viewBox: "0 0 96 70", fill: "none", "aria-hidden": true } as const;

    if (kind === "free") {
        // A job board page with one listing highlighted — what publishing produces.
        return (
            <svg {...common}>
                <ellipse cx="20" cy="56" rx="15" ry="8" fill="#DFF3E9" />
                <path d="M14 50c-5-3-6-11-1-15s12-1 12 5-6 13-11 10z" fill="#3FBF8F" />
                <rect x="22" y="10" width="66" height="46" rx="5" fill="#fff" stroke="#DFE1E6" />
                <rect x="22" y="10" width="66" height="9" rx="5" fill="#F2F3F7" />
                <circle cx="29" cy="14.5" r="1.6" fill="#C9CDD6" />
                <circle cx="34.5" cy="14.5" r="1.6" fill="#C9CDD6" />
                <rect x="28" y="25" width="22" height="16" rx="3" fill="#5B53E0" />
                <rect x="55" y="25" width="27" height="3" rx="1.5" fill="#DDE0E6" />
                <rect x="55" y="32" width="20" height="3" rx="1.5" fill="#DDE0E6" />
                <rect x="55" y="39" width="24" height="3" rx="1.5" fill="#DDE0E6" />
                <rect x="28" y="47" width="54" height="3" rx="1.5" fill="#EDEEF2" />
            </svg>
        );
    }
    if (kind === "connect") {
        // Rows with status dots plus a key: boards you sign into yourself.
        return (
            <svg {...common}>
                <ellipse cx="76" cy="56" rx="14" ry="7" fill="#EDECFB" />
                <rect x="10" y="12" width="62" height="42" rx="5" fill="#fff" stroke="#DFE1E6" />
                <rect x="18" y="21" width="34" height="3.5" rx="1.75" fill="#3FBF8F" />
                <circle cx="60" cy="22.5" r="3" fill="#3FBF8F" />
                <rect x="18" y="31" width="40" height="3.5" rx="1.75" fill="#F5C24D" />
                <circle cx="64" cy="32.5" r="3" fill="#F5C24D" />
                <rect x="18" y="41" width="28" height="3.5" rx="1.75" fill="#DDE0E6" />
                <circle cx="54" cy="42.5" r="3" fill="#DDE0E6" />
                <circle cx="74" cy="42" r="9" fill="#5B53E0" />
                <circle cx="74" cy="39.5" r="3" fill="#fff" />
                <rect x="72.8" y="41.5" width="2.4" height="7" rx="1.2" fill="#fff" />
                <rect x="74.6" y="45" width="3.4" height="2" rx="1" fill="#fff" />
            </svg>
        );
    }
    if (kind === "partner") {
        // A signed agreement — these boards only take posts under a contract.
        return (
            <svg {...common}>
                <ellipse cx="48" cy="58" rx="24" ry="7" fill="#F2F3F7" />
                <rect x="24" y="8" width="42" height="48" rx="4" fill="#fff" stroke="#DFE1E6" />
                <rect x="32" y="17" width="26" height="3.5" rx="1.75" fill="#5B53E0" />
                <rect x="32" y="26" width="20" height="3" rx="1.5" fill="#DDE0E6" />
                <rect x="32" y="33" width="26" height="3" rx="1.5" fill="#DDE0E6" />
                <rect x="32" y="40" width="16" height="3" rx="1.5" fill="#DDE0E6" />
                <path d="M32 50c4-4 7 3 11-1s6 2 11-3" stroke="#3FBF8F" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="70" cy="20" r="10" fill="#EDECFB" />
                <path d="M70 15.5v9M65.5 20h9" stroke="#5B53E0" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
        );
    }
    // The apply link itself — the route that always works.
    return (
        <svg {...common}>
            <ellipse cx="48" cy="58" rx="26" ry="7" fill="#DFF3E9" />
            <rect x="18" y="10" width="60" height="42" rx="5" fill="#fff" stroke="#DFE1E6" />
            <rect x="18" y="10" width="60" height="9" rx="5" fill="#F2F3F7" />
            <circle cx="25" cy="14.5" r="1.6" fill="#C9CDD6" />
            <rect x="26" y="26" width="20" height="3" rx="1.5" fill="#DDE0E6" />
            <rect x="26" y="33" width="30" height="3" rx="1.5" fill="#DDE0E6" />
            <rect x="26" y="42" width="22" height="6" rx="3" fill="#0E8A6E" />
            <g transform="translate(56 30)">
                <rect x="0" y="4" width="13" height="7" rx="3.5" fill="none" stroke="#0E8A6E" strokeWidth="2.2" />
                <rect x="8" y="4" width="13" height="7" rx="3.5" fill="none" stroke="#0E8A6E" strokeWidth="2.2" />
            </g>
        </svg>
    );
}

export default function JobPostingPanel({ jobId, jobTitle, token, postings = [], onPublished }: JobPostingPanelProps) {
    const { t: tr } = useI18n();
    const [portals, setPortals] = useState<Portal[]>([]);
    // The modal opens on a channel hub; a channel then shows only the boards it covers.
    const [channel, setChannel] = useState<GroupKey | "career" | null>(null);
    const [selected, setSelected] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [results, setResults] = useState<PublishResult[]>([]);

    const loadCatalog = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/job-portals/catalog`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            const list: Portal[] = data.portals || [];
            setReach({
                base: data.public_base_url || "",
                reachable: !!data.public_url_reachable,
                secure: !!data.public_url_secure,
            });
            setPortals(list);
            // Default-select the truly self-serve portals (structured + feed).
            // Pre-select only what will actually go out. Ticking a board that needs credentials
            // just produces a failure row on publish.
            setSelected(list.filter((p) => groupFor(p) === "ready").map((p) => p.key));
        } catch {
            setPortals([]);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        setStatus("idle");
        setResults([]);
        setChannel(null);
        loadCatalog();
    }, [loadCatalog]);

    const grouped = useMemo(() => {
        return PUBLISH_GROUPS.map((g) => ({
            ...g,
            portals: portals.filter((p) => groupFor(p) === g.key),
            // Only the chosen channel's boards. Without the `channel !== null` guard the hub
            // rendered every group beneath itself, which is the choice it exists to offer.
        })).filter((g) => g.portals.length > 0 && channel !== null && g.key === channel);
    }, [portals, channel]);

    const countFor = (k: GroupKey) => portals.filter((p) => groupFor(p) === k).length;
    const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/jobs/${jobId}` : "";
    // What a board is actually given: Indeed ingests the XML feed, Google reads the page's
    // JSON-LD. Both are served by the API, not the app, so they are shown rather than guessed at.
    const feedUrl = `${BACKEND_URL}/api/v1/jobs/feed/indeed.xml`;
    const jsonLdUrl = `${BACKEND_URL}/api/v1/jobs/${jobId}/jobposting.jsonld`;
    const [copied, setCopied] = useState("");
    // Whether a crawler could actually fetch this site. "LISTED" is meaningless if it cannot.
    const [reach, setReach] = useState<{ base: string; reachable: boolean; secure: boolean } | null>(null);
    const copy = (value: string, key: string) => {
        void navigator.clipboard?.writeText(value);
        setCopied(key);
        window.setTimeout(() => setCopied(""), 1600);
    };

    const toggle = (key: string) =>
        setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

    const handlePublish = async () => {
        if (!token || selected.length === 0) return;
        setIsSubmitting(true);
        setStatus("idle");
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${jobId}/publish`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ platforms: selected }),
            });
            const data = await res.json();
            if (res.ok) {
                setResults(data.results || []);
                setStatus("success");
                onPublished?.();
            } else {
                setStatus("error");
            }
        } catch {
            setStatus("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resultByKey = useMemo(() => {
        const m: Record<string, PublishResult> = {};
        results.forEach((r) => (m[r.platform] = r));
        return m;
    }, [results]);

    return (
        <div className="space-y-4">
        {/* Content */}
        <div className="p-5 space-y-4">
            <p className="text-[13px] text-[#8A929E]">
                {tr("forms2.targetPosition")}{" "}
                <span className="font-bold text-[#15171C]">{jobTitle}</span>
            </p>

            {/* A board can only list a job it can fetch. Publishing "succeeds" regardless, so
                without this the page reports LISTED for a URL nothing outside this machine can
                reach — which is precisely the confusion it caused. */}
            {reach && !reach.reachable && (
                <details className="rounded-[10px] border border-[#F3DDBA] bg-[#FEF3E2] px-3 py-2 group">
                    <summary className="text-[11.5px] font-bold text-[#8A5B08] flex items-center gap-1.5 cursor-pointer list-none">
                        <span className="material-symbols-rounded text-[16px]">warning</span>
                        {tr("publishHub.notReachableTitle")}
                        <span className="material-symbols-rounded text-[16px] ml-auto transition-transform group-open:rotate-180">expand_more</span>
                    </summary>
                    <p className="text-[11px] text-[#8A5B08] leading-relaxed mt-1.5">
                        {tr("publishHub.notReachableDesc", { url: reach.base || "—" })}
                    </p>
                </details>
            )}
            {reach && reach.reachable && !reach.secure && (
                <div className="p-3.5 rounded-[12px] border border-[#F3DDBA] bg-[#FEF3E2]">
                    <p className="text-[11.5px] text-[#8A5B08] leading-relaxed">
                        {tr("publishHub.notSecure", { url: reach.base })}
                    </p>
                </div>
            )}

            {/* Where it already went. postings comes back on the job and had never
                been rendered, so a published job looked identical to an unpublished one. */}
            {postings.length > 0 && channel === null && (
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-[#15803D] uppercase tracking-wider mr-0.5">
                        {tr("publishHub.liveOn", { count: postings.length })}
                    </span>
                    {postings.map((p, i) => (
                        <span
                            key={`${p.platform}-${i}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E6F4EA] text-[#15803D]"
                        >
                            <span className="material-symbols-rounded text-[13px]">check_circle</span>
                            {p.platform}
                        </span>
                    ))}
                </div>
            )}

            {/* Channel hub — pick how this job should reach candidates. A card per route, two
                up, so the four options are compared side by side rather than scanned down a
                list. Each one leads to something Croar can actually do. */}
            {!loading && channel === null && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {([
                        ["ready", "free", tr("publishHub.freeTitle"), tr("publishHub.freeDesc"), countFor("ready")],
                        ["connect", "connect", tr("publishHub.connectTitle"), tr("publishHub.connectDesc"), countFor("connect")],
                        ["partner", "partner", tr("publishHub.partnerTitle"), tr("publishHub.partnerDesc"), countFor("partner")],
                    ] as [GroupKey, "free" | "connect" | "partner", string, string, number][]).map(
                        ([key, art, title, desc, n]) => (
                            <button
                                key={key}
                                disabled={n === 0}
                                onClick={() => setChannel(key)}
                                className="group p-4 rounded-[12px] border border-[#E8EAED] bg-white hover:border-[#5B53E0]/45 hover:shadow-[0_2px_10px_rgba(91,83,224,0.07)] transition-all flex items-center gap-3 text-left disabled:opacity-55 disabled:pointer-events-none"
                            >
                                <span className="shrink-0"><HubArt kind={art} /></span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[14px] font-bold text-[#15171C]">
                                        {title} <span className="text-[#A8AEB8] font-semibold">({n})</span>
                                    </span>
                                    <span className="block text-[12px] text-[#8A929E] leading-relaxed mt-1">{desc}</span>
                                </span>
                                <span className="material-symbols-rounded text-[20px] text-[#C3C7CE] group-hover:text-[#5B53E0] transition-colors shrink-0">
                                    chevron_right
                                </span>
                            </button>
                        )
                    )}

                    {/* Croar has no inbound board integrations, so rather than an empty
                        "connect" card this shows the route candidates really take today. */}
                    <div className="p-4 rounded-[12px] border border-[#E8EAED] bg-white flex flex-col">
                        <div className="flex items-center gap-3 flex-1">
                            <span className="shrink-0"><HubArt kind="career" /></span>
                            <div className="min-w-0 flex-1">
                                <p className="text-[14px] font-bold text-[#15171C]">{tr("publishHub.careerTitle")}</p>
                                <p className="text-[12px] text-[#8A929E] leading-relaxed mt-1">{tr("publishHub.careerDesc")}</p>
                            </div>
                        </div>
                        <div className="border-t border-[#F0F0F1] mt-3 pt-2.5 flex items-center gap-5">
                            <button
                                onClick={() => { void navigator.clipboard?.writeText(publicUrl); }}
                                className="text-[12px] font-bold text-[#5B53E0] hover:text-[#4840C4] transition-colors"
                            >
                                {tr("publishHub.copyLink")}
                            </button>
                            <a
                                href={publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[12px] font-bold text-[#5B53E0] hover:text-[#4840C4] transition-colors"
                            >
                                {tr("publishHub.openPage")}
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Indeed Job Sync wants a feed URL and Google reads the page markup.
                Croar hosts both; without showing them the setup cannot be finished. */}
            {!loading && channel === "connect" && (
                <div className="p-3.5 rounded-[12px] border border-[#E8EAED] bg-[#F7F8FA] space-y-2.5">
                    <p className="text-[11.5px] font-bold text-[#15171C]">{tr("publishHub.feedTitle")}</p>
                    <p className="text-[11px] text-[#8A929E] leading-relaxed">{tr("publishHub.feedDesc")}</p>
                    {([
                        [tr("publishHub.feedIndeed"), feedUrl, "feed"],
                        [tr("publishHub.feedGoogle"), jsonLdUrl, "jsonld"],
                    ] as [string, string, string][]).map(([label, value, key]) => (
                        <div key={key}>
                            <p className="text-[10px] font-bold text-[#8A929E] uppercase tracking-wider mb-1">{label}</p>
                            <div className="flex gap-1.5">
                                <input
                                    readOnly
                                    value={value}
                                    onFocus={(e) => e.currentTarget.select()}
                                    aria-label={label}
                                    className="flex-1 min-w-0 h-8 px-2 rounded-[8px] border border-[#E8EAED] bg-white text-[11px] text-[#374151]"
                                />
                                <button
                                    onClick={() => copy(value, key)}
                                    className="h-8 px-2.5 rounded-[8px] border border-[#E8EAED] bg-white text-[11px] font-semibold text-[#374151] hover:border-[#5B53E0]/50 hover:text-[#5B53E0] transition-colors shrink-0"
                                >
                                    {copied === key ? tr("publishHub.copied") : tr("publishHub.copy")}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="py-8 flex justify-center">
                    <div className="w-6 h-6 border-2 border-[#5B53E0]/30 border-t-[#5B53E0] rounded-full animate-spin" />
                </div>
            ) : (
                grouped.map((group) => (
                    <div key={group.key} className="space-y-3">
                        {/* Breadcrumb back to the channel hub, so the page says where you are. */}
                        <div className="flex items-center gap-1.5 text-[12px]">
                            <button
                                onClick={() => setChannel(null)}
                                className="font-semibold text-[#5B53E0] hover:text-[#4840C4] transition-colors"
                            >
                                {tr("publishHub.breadcrumbRoot")}
                            </button>
                            <span className="material-symbols-rounded text-[15px] text-[#C3C7CE]">chevron_right</span>
                            <span className="text-[#6B6F76]">{group.label}</span>
                        </div>

                        <div>
                            <h3 className="text-[15px] font-bold text-[#15171C]">
                                {tr("publishHub.gridTitle")}{" "}
                                <span className="text-[#A8AEB8] font-semibold">
                                    {tr("publishHub.gridCount", { count: group.portals.length })}
                                </span>
                            </h3>
                            <p className="text-[12px] text-[#8A929E] mt-0.5">{group.hint}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {group.portals.map((portal) => {
                                const isSel = selected.includes(portal.key);
                                const result = resultByKey[portal.key];
                                const pill = result ? STATUS_PILL[result.status] : null;
                                // Partner boards cannot be published to from here, so their card
                                // offers the board's own page instead of a dead Enable control.
                                const selectable = group.key !== "partner";
                                return (
                                    <div
                                        key={portal.key}
                                        className={`rounded-[12px] border bg-white flex flex-col transition-colors ${
                                            isSel ? "border-[#5B53E0]" : "border-[#E8EAED]"
                                        }`}
                                    >
                                        <div className="p-3.5 flex-1">
                                            <div className="flex items-start gap-3">
                                                <span className="w-14 h-14 shrink-0 rounded-[10px] border border-[#E8EAED] bg-white flex items-center justify-center overflow-hidden">
                                                    {portal.logo ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img
                                                            src={portal.logo}
                                                            alt=""
                                                            className="w-8 h-8 object-contain"
                                                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                                                        />
                                                    ) : (
                                                        <span className="text-[17px] font-extrabold text-[#8A929E]">{portal.name.charAt(0)}</span>
                                                    )}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-[13.5px] font-bold text-[#15171C]">{portal.name}</p>
                                                        <span className="text-[10px] font-semibold text-[#A8AEB8]">
                                                            {COUNTRY_LABEL[portal.country] || portal.country}
                                                        </span>
                                                        {portal.connected && (
                                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] uppercase tracking-wide bg-[#E4F5EF] text-[#0E8A6E]">
                                                                {tr("publishHub.connectedTag")}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {portal.docs_url && (
                                                        <a
                                                            href={portal.docs_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[11.5px] font-semibold text-[#5B53E0] hover:text-[#4840C4] transition-colors"
                                                        >
                                                            {tr("publishHub.learnMore")}
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            {portal.note && (
                                                <p className="text-[11.5px] text-[#8A929E] leading-relaxed mt-2.5">{portal.note}</p>
                                            )}

                                            {pill && (
                                                <span className={`inline-flex items-center gap-1 mt-2.5 text-[10px] font-bold px-2 py-0.5 rounded-[6px] ${pill.cls}`}>
                                                    <pill.icon className="w-3 h-3" />
                                                    {pill.label}
                                                </span>
                                            )}
                                        </div>

                                        <div className="border-t border-[#F0F0F1] px-3.5 py-2.5 flex justify-center">
                                            {selectable ? (
                                                <button
                                                    onClick={() => toggle(portal.key)}
                                                    className={`inline-flex items-center gap-1.5 text-[12px] font-bold transition-colors ${
                                                        isSel ? "text-[#5B53E0]" : "text-[#6B6F76] hover:text-[#5B53E0]"
                                                    }`}
                                                >
                                                    <span className="material-symbols-rounded text-[17px]">
                                                        {isSel ? "check_circle" : "add_circle"}
                                                    </span>
                                                    {isSel ? tr("publishHub.selected") : tr("publishHub.enable")}
                                                </button>
                                            ) : (
                                                <a
                                                    href={portal.docs_url || "#"}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#B45309] hover:text-[#8A5B08] transition-colors"
                                                >
                                                    <span className="material-symbols-rounded text-[17px]">lock</span>
                                                    {tr("publishHub.contactBoard")}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Footer */}
        {/* The hub has nothing to publish yet, and partner boards cannot be
            published to from here at all — so the action bar only appears where
            pressing it would actually do something. */}
        {channel !== null && channel !== "partner" && (
        <div className="px-5 py-4 bg-[#F7F8FA] border-t border-[#E8EAED] flex items-center justify-between gap-3 sticky bottom-0">
            <p className="text-[11px] text-[#8A929E] max-w-[210px] leading-snug">
                {status === "success"
                    ? tr("publishHub.liveNote")
                    : tr("forms2.indexingSchedule")}
            </p>

            <button
                onClick={handlePublish}
                disabled={isSubmitting || selected.length === 0}
                className={`h-10 px-5 rounded-[10px] font-semibold text-[13px] transition-colors flex items-center gap-2 shrink-0 ${
                    status === "error" ? "bg-[#EF4444] text-white" : "bg-[#5B53E0] text-white shadow-[0_6px_16px_rgba(91,83,224,0.28)] hover:bg-[#4A43C9] disabled:opacity-50"
                }`}
            >
                {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : status === "error" ? (
                    <AlertCircle className="w-4 h-4" />
                ) : (
                    <Send className="w-4 h-4" />
                )}
                {isSubmitting ? tr("forms2.publishing") : status === "success" ? tr("publishHub.rePublish") : status === "error" ? tr("forms2.failed") : tr("forms2.confirmPublish")}
            </button>
        </div>
        )}

        {channel === "partner" && (
            <div className="px-5 py-4 bg-[#F7F8FA] border-t border-[#E8EAED] sticky bottom-0">
                <p className="text-[11.5px] text-[#8A929E] leading-relaxed">{tr("publishHub.partnerNote")}</p>
            </div>
        )}
        </div>
    );
}
