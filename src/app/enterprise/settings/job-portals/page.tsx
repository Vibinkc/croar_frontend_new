"use client";

import { useCallback, useEffect, useMemo, useState, type ElementType } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { BACKEND_URL } from "@/utils/api";
import {
    Globe,
    CheckCircle2,
    RefreshCw,
    X,
    Link2,
    Lock,
    Rss,
    Sparkles,
    ExternalLink,
    Unplug,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { jetbrainsMono, PageHelp } from "@/components/ds";

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
    connect_fields?: ConnectField[];
    connection?: { display_name?: string } | null;
}

interface ConnectField {
    name: string;
    label: string;
    type: string; // text | password | textarea | url
    required: boolean;
    placeholder: string;
    help: string;
}

/** Portal brand logo with graceful fallback to the integration-type icon. */
function PortalLogo({ logo, name, Icon, cls }: { logo?: string | null; name: string; Icon: ElementType; cls: string }) {
    const [err, setErr] = useState(false);
    if (logo && !err) {
        return (
            <span className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-white border border-[#E8EAED] overflow-hidden shrink-0">
                <img src={logo} alt={name} className="w-6 h-6 object-contain" onError={() => setErr(true)} />
            </span>
        );
    }
    return (
        <span className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${cls}`}>
            <Icon className="w-[18px] h-[18px]" />
        </span>
    );
}

const COUNTRY_GROUPS = [
    { code: "GLOBAL", label: "Global" },
    { code: "KR", label: "Korea (한국)" },
    { code: "JP", label: "Japan (日本)" },
];

const INTEGRATION: Record<string, { label: string; cls: string; Icon: typeof Globe }> = {
    structured: { label: "Auto · schema.org", cls: "bg-[#E4F5EF] text-[#0E8A6E]", Icon: Sparkles },
    feed: { label: "XML feed", cls: "bg-[#E8EEFD] text-[#3559C7]", Icon: Rss },
    api: { label: "Connect", cls: "bg-[#ECEBFB] text-[#5B53E0]", Icon: Link2 },
    partner: { label: "Partner required", cls: "bg-[#FBEFDC] text-[#B26B08]", Icon: Lock },
};

export default function JobPortalsPage() {
    const { token } = useAuth();
    const { t } = useI18n();
    const [portals, setPortals] = useState<Portal[]>([]);
    const [loading, setLoading] = useState(true);
    const [connectPortal, setConnectPortal] = useState<Portal | null>(null);
    const [credValues, setCredValues] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [saveErr, setSaveErr] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/job-portals/catalog`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setPortals(data.portals || []);
        } catch {
            setPortals([]);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        load();
    }, [load]);

    const grouped = useMemo(
        () =>
            COUNTRY_GROUPS.map((g) => ({ ...g, portals: portals.filter((p) => p.country === g.code) })).filter(
                (g) => g.portals.length > 0,
            ),
        [portals],
    );

    const counts = useMemo(
        () => ({
            total: portals.length,
            connected: portals.filter((p) => p.connected).length,
            selfServe: portals.filter((p) => p.integration === "structured" || p.integration === "feed").length,
            partner: portals.filter((p) => p.integration === "partner").length,
        }),
        [portals],
    );

    const openConnect = (portal: Portal) => {
        setConnectPortal(portal);
        setCredValues({});
        setSaveErr(null);
    };

    const saveConnection = async () => {
        if (!token || !connectPortal) return;
        const fields = connectPortal.connect_fields || [];
        const missing = fields.find((f) => f.required && !(credValues[f.name] || "").trim());
        if (missing) {
            setSaveErr(`Please enter: ${missing.label}.`);
            return;
        }
        // Only send non-empty values.
        const credentials: Record<string, string> = {};
        fields.forEach((f) => {
            const v = (credValues[f.name] || "").trim();
            if (v) credentials[f.name] = v;
        });
        if (Object.keys(credentials).length === 0) {
            setSaveErr("Please fill in at least one field.");
            return;
        }
        setSaving(true);
        setSaveErr(null);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/job-portals/connections`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    portal: connectPortal.key,
                    credentials,
                    display_name: connectPortal.name,
                }),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                setSaveErr(d.detail || "Could not save connection.");
                return;
            }
            setConnectPortal(null);
            await load();
        } catch {
            setSaveErr("Network error.");
        } finally {
            setSaving(false);
        }
    };

    const disconnect = async (portal: Portal) => {
        if (!token) return;
        await fetch(`${BACKEND_URL}/api/v1/enterprise/job-portals/connections/${portal.key}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        await load();
    };

    const statCards = [
        { label: "Portals", value: counts.total, grad: "linear-gradient(135deg,#8B7DFF,#5B53E0)", glow: "rgba(91,83,224,0.3)", Icon: Globe },
        { label: "Connected", value: counts.connected, grad: "linear-gradient(135deg,#34D399,#0E8A6E)", glow: "rgba(14,138,110,0.3)", Icon: CheckCircle2 },
        { label: "Auto / Feed", value: counts.selfServe, grad: "linear-gradient(135deg,#60A5FA,#3559C7)", glow: "rgba(53,89,199,0.3)", Icon: Rss },
        { label: "Partner-only", value: counts.partner, grad: "linear-gradient(135deg,#FBBF24,#D97706)", glow: "rgba(217,119,6,0.3)", Icon: Lock },
    ];

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header */}
            <header className="sticky top-0 z-20 pt-4 sm:pt-5 md:pt-6 pb-4 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[24px] md:text-[28px] font-extrabold tracking-[-0.6px] text-[#15171C] leading-tight">{t("jobPortals.title")}</h1>
                        <PageHelp title={t("jobPortals.helpTitle")}>
                            <p>Distribute your jobs to Korean & Japanese boards. Auto/Feed portals need no setup — your job page carries the structured data they crawl. Connect credentialed portals, or contact partner boards directly.</p>
                        </PageHelp>
                    </div>
                    <p className="text-[14px] text-[#8A929E] mt-1">Publish once — reach Google for Jobs, Indeed, and Japanese aggregators via standards; connect Korea/Japan boards where an API exists.</p>
                </div>
                <button
                    onClick={load}
                    disabled={loading}
                    className="inline-flex items-center gap-2 h-[42px] px-4 rounded-[10px] bg-[#5B53E0] text-white text-[13.5px] font-semibold hover:bg-[#4A43C9] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-colors disabled:opacity-60 self-start sm:self-auto"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </header>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {statCards.map((s) => (
                    <div key={s.label} className="relative bg-white border border-[#E8EAED] rounded-[14px] p-5 overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: s.grad }} />
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{s.label}</span>
                                <div className={`text-[28px] font-semibold tracking-[-1px] text-[#15171C] mt-2 ${jetbrainsMono.className}`}>{s.value}</div>
                            </div>
                            <span className="w-10 h-10 rounded-[11px] flex items-center justify-center text-white shrink-0" style={{ background: s.grad, boxShadow: `0 6px 14px ${s.glow}` }}>
                                <s.Icon className="w-[18px] h-[18px]" />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Grouped portals */}
            {loading ? (
                <div className="py-16 flex justify-center">
                    <div className="w-7 h-7 border-2 border-[#5B53E0]/30 border-t-[#5B53E0] rounded-full animate-spin" />
                </div>
            ) : (
                grouped.map((group) => (
                    <div key={group.code} className="space-y-3">
                        <h2 className="text-[12px] font-bold text-[#8A929E] uppercase tracking-[0.08em]">{group.label}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {group.portals.map((portal) => {
                                const meta = INTEGRATION[portal.integration] || INTEGRATION.partner;
                                return (
                                    <div key={portal.key} className="bg-white rounded-[16px] border border-[#E8EAED] p-6 hover:shadow-[0_12px_32px_rgba(15,16,20,0.07)] transition-all flex flex-col">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <PortalLogo logo={portal.logo} name={portal.name} Icon={meta.Icon} cls={meta.cls} />
                                                <h3 className="text-[15.5px] font-extrabold text-[#15171C] tracking-[-0.2px]">{portal.name}</h3>
                                            </div>
                                            {portal.connected ? (
                                                <span className="flex items-center gap-1 px-2 py-0.5 bg-[#E3F4EF] text-[#0E8A6E] rounded-full text-[9.5px] font-bold uppercase tracking-wider">
                                                    <CheckCircle2 className="w-3 h-3" /> {t("jobPortals.connected")}
                                                </span>
                                            ) : (
                                                <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wide ${meta.cls}`}>{meta.label}</span>
                                            )}
                                        </div>

                                        <p className="text-[12.5px] text-[#6B6F76] leading-relaxed mt-3 flex-1">{portal.note}</p>

                                        <div className="pt-4 flex items-center gap-2">
                                            {portal.requires_credentials ? (
                                                portal.connected ? (
                                                    <button
                                                        onClick={() => disconnect(portal)}
                                                        className="flex-1 h-10 rounded-[10px] font-semibold text-[13px] bg-[#F4F5F7] text-[#C0383C] border border-[#E8EAED] hover:bg-[#FCE8E8] transition-colors inline-flex items-center justify-center gap-1.5"
                                                    >
                                                        <Unplug className="w-4 h-4" /> Disconnect
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => openConnect(portal)}
                                                        className="flex-1 h-10 rounded-[10px] font-semibold text-[13px] bg-[#5B53E0] text-white hover:bg-[#4A43C9] shadow-[0_6px_16px_rgba(91,83,224,0.22)] transition-colors inline-flex items-center justify-center gap-1.5"
                                                    >
                                                        <Link2 className="w-4 h-4" /> {portal.integration === "partner" ? "Connect API key" : "Connect"}
                                                    </button>
                                                )
                                            ) : (
                                                <div className="flex-1 h-10 rounded-[10px] font-semibold text-[12.5px] bg-[#E4F5EF] text-[#0E8A6E] inline-flex items-center justify-center gap-1.5">
                                                    <CheckCircle2 className="w-4 h-4" /> Active — no setup
                                                </div>
                                            )}
                                            {portal.docs_url && (
                                                <a href={portal.docs_url} target="_blank" rel="noreferrer" className="h-10 w-10 rounded-[10px] border border-[#E8EAED] flex items-center justify-center text-[#8A929E] hover:text-[#5B53E0] hover:border-[#5B53E0]/40 transition-colors" title={portal.integration === "partner" ? "Get a partner account" : "Docs"}>
                                                    <ExternalLink className="w-4 h-4" />
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

            {/* Connect drawer */}
            <AnimatePresence>
                {connectPortal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-end">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConnectPortal(null)} className="fixed inset-0 bg-[#15171C]/40 backdrop-blur-[2px]" />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="bg-white w-full max-w-md h-full relative z-10 shadow-2xl flex flex-col border-l border-[#E8EAED]"
                        >
                            <div className="px-7 py-6 border-b border-[#E8EAED] flex items-center justify-between bg-[#F7F8FA]/60">
                                <div className="flex items-center gap-3">
                                    <span className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#8B7DFF,#5B53E0)" }}>
                                        <Link2 className="w-[18px] h-[18px]" />
                                    </span>
                                    <h3 className="text-[17px] font-extrabold text-[#15171C]">Connect {connectPortal.name}</h3>
                                </div>
                                <button onClick={() => setConnectPortal(null)} className="w-9 h-9 rounded-full hover:bg-[#E8EAED] flex items-center justify-center text-[#9AA3AF]">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
                                <p className="text-[13px] text-[#6B6F76] leading-relaxed">{connectPortal.note}</p>
                                {(connectPortal.connect_fields || []).map((f) => (
                                    <div key={f.name} className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em] ml-0.5">
                                            {f.label} {f.required ? "*" : <span className="lowercase text-[#B0B4BD]">(optional)</span>}
                                        </label>
                                        {f.type === "textarea" ? (
                                            <textarea
                                                value={credValues[f.name] || ""}
                                                onChange={(e) => setCredValues((p) => ({ ...p, [f.name]: e.target.value }))}
                                                placeholder={f.placeholder}
                                                rows={4}
                                                className="w-full px-4 py-3 bg-[#F7F8FA] border border-[#E8EAED] rounded-[10px] text-[13px] font-mono focus:ring-2 focus:ring-[#5B53E0]/30 focus:border-[#5B53E0] focus:bg-white transition-all outline-none resize-y"
                                            />
                                        ) : (
                                            <input
                                                type={f.type === "password" ? "password" : "text"}
                                                value={credValues[f.name] || ""}
                                                onChange={(e) => setCredValues((p) => ({ ...p, [f.name]: e.target.value }))}
                                                placeholder={f.placeholder}
                                                className="w-full px-4 py-3 bg-[#F7F8FA] border border-[#E8EAED] rounded-[10px] text-[14px] font-medium focus:ring-2 focus:ring-[#5B53E0]/30 focus:border-[#5B53E0] focus:bg-white transition-all outline-none"
                                            />
                                        )}
                                        {f.help && <p className="text-[11.5px] text-[#8A929E] leading-snug">{f.help}</p>}
                                    </div>
                                ))}
                                <p className="text-[11.5px] text-[#8A929E]">Stored securely per company. Secret values are never shown again after saving.</p>
                                {connectPortal.docs_url && (
                                    <a href={connectPortal.docs_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#5B53E0] hover:underline">
                                        Where do I find these? <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                )}
                                {saveErr && <p className="text-[12.5px] text-[#C0383C] bg-[#FCE8E8] px-3 py-2 rounded-[8px]">{saveErr}</p>}
                            </div>

                            <div className="px-7 py-5 bg-[#F7F8FA]/60 border-t border-[#E8EAED] flex items-center justify-end gap-3">
                                <button onClick={() => setConnectPortal(null)} className="px-5 h-11 rounded-[10px] text-[#6B6F76] font-semibold text-[13.5px] hover:text-[#15171C] hover:bg-[#E8EAED]/60 transition-colors">
                                    {t("jobPortals.cancel")}
                                </button>
                                <button onClick={saveConnection} disabled={saving} className="inline-flex items-center gap-2 px-6 h-11 bg-[#5B53E0] text-white rounded-[10px] font-semibold text-[13.5px] shadow-[0_6px_16px_rgba(91,83,224,0.28)] hover:bg-[#4A43C9] transition-colors disabled:opacity-60">
                                    {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                                    Save connection
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
