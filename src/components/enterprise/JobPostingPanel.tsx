"use client";

import { useCallback, useEffect, useMemo, useState, type ElementType } from "react";
import { CheckCircle2, AlertCircle, Send, Link2, Clock, Lock } from "lucide-react";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";

export interface JobPostingPanelProps {
    jobId: string;
    jobTitle: string;
    token: string | null;
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

// Integration-type badge styling.
const INTEGRATION_BADGE: Record<string, { label: string; cls: string }> = {
    structured: { label: "Auto · schema.org", cls: "bg-[#E4F5EF] text-[#0E8A6E]" },
    feed: { label: "XML feed", cls: "bg-[#E8EEFD] text-[#3559C7]" },
    api: { label: "Connect", cls: "bg-[#ECEBFB] text-[#5B53E0]" },
    partner: { label: "Partner required", cls: "bg-[#FBEFDC] text-[#B26B08]" },
};

// Result-status pill styling.
const STATUS_PILL: Record<string, { label: string; cls: string; icon: ElementType }> = {
    PUBLISHED: { label: "Published", cls: "bg-[#E4F5EF] text-[#0E8A6E]", icon: CheckCircle2 },
    LISTED: { label: "Listed", cls: "bg-[#E4F5EF] text-[#0E8A6E]", icon: CheckCircle2 },
    QUEUED: { label: "Queued", cls: "bg-[#E8EEFD] text-[#3559C7]", icon: Clock },
    NOT_CONNECTED: { label: "Connect first", cls: "bg-[#FBEFDC] text-[#B26B08]", icon: Link2 },
    PARTNER_REQUIRED: { label: "Partner required", cls: "bg-[#FBEFDC] text-[#B26B08]", icon: Lock },
    ERROR: { label: "Error", cls: "bg-[#FCE8E8] text-[#C0383C]", icon: AlertCircle },
};

export default function JobPostingPanel({ jobId, jobTitle, token, onPublished }: JobPostingPanelProps) {
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
        })).filter((g) => g.portals.length > 0 && (channel === null || g.key === channel));
    }, [portals, channel]);

    const countFor = (k: GroupKey) => portals.filter((p) => groupFor(p) === k).length;
    const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/jobs/${jobId}` : "";

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
            <div className="p-3 bg-[#ECEBFB]/50 border border-[#DAD7F6]/60 rounded-[12px]">
                <p className="text-[10.5px] font-bold text-[#5B53E0] uppercase tracking-wider mb-0.5">{tr("forms2.targetPosition")}</p>
                <p className="text-[14px] font-bold text-[#15171C]">{jobTitle}</p>
            </div>

            {/* Channel hub — pick how this job should reach candidates. Each card
                leads to something Croar can actually do. */}
            {!loading && channel === null && (
                <div className="space-y-2.5">
                    {([
                        ["ready", "public", tr("publishHub.freeTitle"), tr("publishHub.freeDesc"), countFor("ready")],
                        ["connect", "vpn_key", tr("publishHub.connectTitle"), tr("publishHub.connectDesc"), countFor("connect")],
                        ["partner", "handshake", tr("publishHub.partnerTitle"), tr("publishHub.partnerDesc"), countFor("partner")],
                    ] as [GroupKey, string, string, string, number][]).map(([key, icon, title, desc, n]) => (
                        <button
                            key={key}
                            disabled={n === 0}
                            onClick={() => setChannel(key)}
                            className="w-full p-3.5 rounded-[12px] border border-[#E8EAED] hover:border-[#5B53E0]/45 hover:bg-[#FBFBFE] transition-colors flex items-center gap-3 text-left disabled:opacity-50 disabled:pointer-events-none"
                        >
                            <span className="w-10 h-10 shrink-0 rounded-[11px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center">
                                <span className="material-symbols-rounded text-[21px]">{icon}</span>
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-[13.5px] font-bold text-[#15171C]">
                                    {title} <span className="text-[#A8AEB8] font-semibold">({n})</span>
                                </span>
                                <span className="block text-[11.5px] text-[#8A929E] leading-relaxed">{desc}</span>
                            </span>
                            <span className="material-symbols-rounded text-[20px] text-[#C3C7CE] shrink-0">chevron_right</span>
                        </button>
                    ))}

                    {/* Croar has no inbound board integrations, so rather than an
                        empty "connect" card this shows the route candidates really
                        take today. */}
                    <div className="p-3.5 rounded-[12px] border border-[#E8EAED] bg-[#F7F8FA]">
                        <div className="flex items-center gap-3">
                            <span className="w-10 h-10 shrink-0 rounded-[11px] bg-[#E3F4EF] text-[#0E8A6E] flex items-center justify-center">
                                <span className="material-symbols-rounded text-[21px]">link</span>
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-[13.5px] font-bold text-[#15171C]">{tr("publishHub.careerTitle")}</p>
                                <p className="text-[11.5px] text-[#8A929E] leading-relaxed">{tr("publishHub.careerDesc")}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={() => { void navigator.clipboard?.writeText(publicUrl); }}
                                className="flex-1 h-9 rounded-[9px] border border-[#E8EAED] bg-white text-[12px] font-semibold text-[#374151] hover:border-[#5B53E0]/50 hover:text-[#5B53E0] transition-colors"
                            >
                                {tr("publishHub.copyLink")}
                            </button>
                            <a
                                href={publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 h-9 rounded-[9px] border border-[#E8EAED] bg-white text-[12px] font-semibold text-[#374151] hover:border-[#5B53E0]/50 hover:text-[#5B53E0] transition-colors flex items-center justify-center"
                            >
                                {tr("publishHub.openPage")}
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {!loading && channel !== null && (
                <button
                    onClick={() => setChannel(null)}
                    className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#5B53E0] hover:text-[#4840C4] transition-colors"
                >
                    <span className="material-symbols-rounded text-[18px]">arrow_back</span>
                    {tr("publishHub.backToChannels")}
                </button>
            )}

            {loading ? (
                <div className="py-8 flex justify-center">
                    <div className="w-6 h-6 border-2 border-[#5B53E0]/30 border-t-[#5B53E0] rounded-full animate-spin" />
                </div>
            ) : (
                grouped.map((group) => (
                    <div key={group.key} className="space-y-2">
                        <div className="ml-0.5">
                            <p className="text-[10.5px] font-bold text-[#8A929E] uppercase tracking-wider">
                                {group.label} <span className="text-[#C3C7CE]">({group.portals.length})</span>
                            </p>
                            <p className="text-[10.5px] text-[#A8AEB8] mt-0.5">{group.hint}</p>
                        </div>
                        {group.portals.map((portal) => {
                            const badge = INTEGRATION_BADGE[portal.integration] || INTEGRATION_BADGE.partner;
                            const isSel = selected.includes(portal.key);
                            const result = resultByKey[portal.key];
                            const pill = result ? STATUS_PILL[result.status] : null;
                            return (
                                <button
                                    key={portal.key}
                                    onClick={() => toggle(portal.key)}
                                    title={portal.note || ""}
                                    className={`w-full p-3 rounded-[12px] border transition-all flex items-start justify-between gap-3 text-left ${
                                        isSel ? "border-[#5B53E0] bg-[#ECEBFB]/30" : "border-[#E8EAED] hover:border-[#5B53E0]/40"
                                    }`}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {portal.logo && (
                                                <img src={portal.logo} alt="" className="w-4 h-4 object-contain rounded-[3px] shrink-0" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                                            )}
                                            <p className="text-[13px] font-bold text-[#15171C]">{portal.name}</p>
                                            {/* Country is now a property of the board, not the grouping. */}
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] uppercase tracking-wide bg-[#F1F2F5] text-[#6B6F76]">
                                                {COUNTRY_LABEL[portal.country] || portal.country}
                                            </span>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] uppercase tracking-wide ${badge.cls}`}>{badge.label}</span>
                                            {portal.requires_credentials && (
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] uppercase tracking-wide ${portal.connected ? "bg-[#E4F5EF] text-[#0E8A6E]" : "bg-[#F1F2F5] text-[#8A929E]"}`}>
                                                    {portal.connected ? "Connected" : "Not connected"}
                                                </span>
                                            )}
                                            {portal.requires_credentials && !portal.connected && (
                                                <a
                                                    href="/enterprise/settings/job-portals"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] uppercase tracking-wide bg-[#ECEBFB] text-[#5B53E0] hover:bg-[#DAD7F6] transition-colors"
                                                >
                                                    {tr("publishHub.connectNow")}
                                                </a>
                                            )}
                                        </div>
                                        {portal.note && <p className="text-[11px] text-[#8A929E] leading-snug mt-1">{portal.note}</p>}
                                        {pill && (
                                            <span className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-[6px] ${pill.cls}`}>
                                                <pill.icon className="w-3 h-3" />
                                                {pill.label}
                                            </span>
                                        )}
                                    </div>
                                    <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSel ? "bg-[#5B53E0] border-[#5B53E0]" : "border-[#CBD0D8]"}`}>
                                        {isSel && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                </button>
                            );
                        })}
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
