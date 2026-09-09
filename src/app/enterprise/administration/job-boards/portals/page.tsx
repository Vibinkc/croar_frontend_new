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
} from "@/components/icons";
import { motion, AnimatePresence } from "framer-motion";
import { jetbrainsMono, PageHelp, Icon } from "@/components/ds";

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
            <span className="w-9 h-9 rounded-[4px] flex items-center justify-center bg-white border border-[#E0E0E0] overflow-hidden shrink-0">
                <img src={logo} alt={name} className="w-6 h-6 object-contain" onError={() => setErr(true)} />
            </span>
        );
    }
    return (
        <span className={`w-9 h-9 rounded-[4px] flex items-center justify-center shrink-0 ${cls}`}>
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
    structured: { label: "Auto · schema.org", cls: "bg-[#E8F5E9] text-[#2E7D32]", Icon: Sparkles },
    feed: { label: "XML feed", cls: "bg-[#E8EEFD] text-[#1565C0]", Icon: Rss },
    api: { label: "Connect", cls: "bg-[#E3F2FD] text-[#1976D2]", Icon: Link2 },
    partner: { label: "Partner required", cls: "bg-[#FFF3E0] text-[#EF6C00]", Icon: Lock },
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
        { label: "Portals", value: counts.total, grad: "linear-gradient(135deg,#42A5F5,#1976D2)", glow: "rgba(25,118,210,0.3)", Icon: Globe },
        { label: "Connected", value: counts.connected, grad: "linear-gradient(135deg,#66BB6A,#2E7D32)", glow: "rgba(46,125,50,0.3)", Icon: CheckCircle2 },
        { label: "Auto / Feed", value: counts.selfServe, grad: "linear-gradient(135deg,#60A5FA,#1565C0)", glow: "rgba(21,101,192,0.3)", Icon: Rss },
        { label: "Partner-only", value: counts.partner, grad: "linear-gradient(135deg,#FFB300,#EF6C00)", glow: "rgba(239,108,0,0.3)", Icon: Lock },
    ];

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header */}
            <header className="sticky top-0 z-20 pt-4 sm:pt-5 md:pt-6 pb-4 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[24px] md:text-[28px] font-extrabold tracking-[-0.6px] text-[#212121] leading-tight">{t("jobPortals.title")}</h1>
                        <PageHelp title={t("jobPortals.helpTitle")}>
                            <p>Distribute your jobs to Korean & Japanese boards. Auto/Feed portals need no setup — your job page carries the structured data they crawl. Connect credentialed portals, or contact partner boards directly.</p>
                        </PageHelp>
                    </div>
                    <p className="text-[14px] text-[#757575] mt-1">Publish once — reach Google for Jobs, Indeed, and Japanese aggregators via standards; connect Korea/Japan boards where an API exists.</p>
                </div>
                <button
                    onClick={load}
                    disabled={loading}
                    className="inline-flex items-center gap-2 h-[42px] px-4 rounded-[4px] bg-[#1976D2] text-white text-[13.5px] font-semibold hover:bg-[#1565C0] shadow-[0_6px_16px_rgba(25,118,210,0.28)] transition-colors disabled:opacity-60 self-start sm:self-auto"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </header>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {statCards.map((s) => (
                    <div key={s.label} className="relative bg-white border border-[#E0E0E0] rounded-[4px] p-5 overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: s.grad }} />
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{s.label}</span>
                                <div className={`text-[28px] font-semibold tracking-[-1px] text-[#212121] mt-2 ${jetbrainsMono.className}`}>{s.value}</div>
                            </div>
                            <span className="w-10 h-10 rounded-[4px] flex items-center justify-center text-white shrink-0" style={{ background: s.grad, boxShadow: `0 6px 14px ${s.glow}` }}>
                                <s.Icon className="w-[18px] h-[18px]" />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Grouped portals */}
            {loading ? (
                <div className="py-16 flex justify-center">
                    <div className="w-7 h-7 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                </div>
            ) : (
                grouped.map((group) => (
                    <div key={group.code} className="space-y-3">
                        <h2 className="text-[12px] font-bold text-[#757575] uppercase tracking-[0.08em]">{group.label}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {group.portals.map((portal) => {
                                const meta = INTEGRATION[portal.integration] || INTEGRATION.partner;
                                return (
                                    <div key={portal.key} className="bg-white rounded-[4px] border border-[#E0E0E0] p-6 hover:shadow-[0_12px_32px_rgba(15,16,20,0.07)] transition-all flex flex-col">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <PortalLogo logo={portal.logo} name={portal.name} Icon={meta.Icon} cls={meta.cls} />
                                                <h3 className="text-[15.5px] font-extrabold text-[#212121] tracking-[-0.2px]">{portal.name}</h3>
                                            </div>
                                            {portal.connected ? (
                                                <span className="flex items-center gap-1 px-2 py-0.5 bg-[#E8F5E9] text-[#2E7D32] rounded-full text-[9.5px] font-bold uppercase tracking-wider">
                                                    <CheckCircle2 className="w-3 h-3" /> {t("jobPortals.connected")}
                                                </span>
                                            ) : (
                                                <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wide ${meta.cls}`}>{meta.label}</span>
                                            )}
                                        </div>

                                        <p className="text-[12.5px] text-[#616161] leading-relaxed mt-3 flex-1">{portal.note}</p>

                                        <div className="pt-4 flex items-center gap-2">
                                            {portal.requires_credentials ? (
                                                portal.connected ? (
                                                    <button
                                                        onClick={() => disconnect(portal)}
                                                        className="flex-1 h-10 rounded-[4px] font-semibold text-[13px] bg-[#F5F6F8] text-[#C62828] border border-[#E0E0E0] hover:bg-[#FCE8E8] transition-colors inline-flex items-center justify-center gap-1.5"
                                                    >
                                                        <Unplug className="w-4 h-4" /> Disconnect
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => openConnect(portal)}
                                                        className="flex-1 h-10 rounded-[4px] font-semibold text-[13px] bg-[#1976D2] text-white hover:bg-[#1565C0] shadow-[0_6px_16px_rgba(25,118,210,0.22)] transition-colors inline-flex items-center justify-center gap-1.5"
                                                    >
                                                        <Link2 className="w-4 h-4" /> {portal.integration === "partner" ? "Connect API key" : "Connect"}
                                                    </button>
                                                )
                                            ) : (
                                                <div className="flex-1 h-10 rounded-[4px] font-semibold text-[12.5px] bg-[#E8F5E9] text-[#2E7D32] inline-flex items-center justify-center gap-1.5">
                                                    <CheckCircle2 className="w-4 h-4" /> Active — no setup
                                                </div>
                                            )}
                                            {portal.docs_url && (
                                                <a href={portal.docs_url} target="_blank" rel="noreferrer" className="h-10 w-10 rounded-[4px] border border-[#E0E0E0] flex items-center justify-center text-[#757575] hover:text-[#1976D2] hover:border-[#1976D2]/40 transition-colors" title={portal.integration === "partner" ? "Get a partner account" : "Docs"}>
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
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConnectPortal(null)} className="fixed inset-0 bg-[#212121]/40 backdrop-blur-[2px]" />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="bg-white w-full max-w-md h-full relative z-10 shadow-2xl flex flex-col border-l border-[#E0E0E0]"
                        >
                            <div className="px-7 py-6 border-b border-[#E0E0E0] flex items-center justify-between bg-[#FAFAFA]/60">
                                <div className="flex items-center gap-3">
                                    <span className="w-9 h-9 rounded-[4px] flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#42A5F5,#1976D2)" }}>
                                        <Link2 className="w-[18px] h-[18px]" />
                                    </span>
                                    <h3 className="text-[17px] font-extrabold text-[#212121]">Connect {connectPortal.name}</h3>
                                </div>
                                <button onClick={() => setConnectPortal(null)} className="w-9 h-9 rounded-full hover:bg-[#E0E0E0] flex items-center justify-center text-[#9E9E9E]">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
                                <p className="text-[13px] text-[#616161] leading-relaxed">{connectPortal.note}</p>
                                {(connectPortal.connect_fields || []).map((f) => (
                                    <div key={f.name} className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-[#757575] uppercase tracking-[0.06em] ml-0.5">
                                            {f.label} {f.required ? "*" : <span className="lowercase text-[#B0B4BD]">(optional)</span>}
                                        </label>
                                        {f.type === "textarea" ? (
                                            <textarea
                                                value={credValues[f.name] || ""}
                                                onChange={(e) => setCredValues((p) => ({ ...p, [f.name]: e.target.value }))}
                                                placeholder={f.placeholder}
                                                rows={4}
                                                className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-[4px] text-[13px] font-mono focus:ring-2 focus:ring-[#1976D2]/30 focus:border-[#1976D2] focus:bg-white transition-all outline-none resize-y"
                                            />
                                        ) : (
                                            <input
                                                type={f.type === "password" ? "password" : "text"}
                                                value={credValues[f.name] || ""}
                                                onChange={(e) => setCredValues((p) => ({ ...p, [f.name]: e.target.value }))}
                                                placeholder={f.placeholder}
                                                className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#E0E0E0] rounded-[4px] text-[14px] font-medium focus:ring-2 focus:ring-[#1976D2]/30 focus:border-[#1976D2] focus:bg-white transition-all outline-none"
                                            />
                                        )}
                                        {f.help && <p className="text-[11.5px] text-[#757575] leading-snug">{f.help}</p>}
                                    </div>
                                ))}
                                <p className="text-[11.5px] text-[#757575]">Stored securely per company. Secret values are never shown again after saving.</p>
                                {connectPortal.docs_url && (
                                    <a href={connectPortal.docs_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#1976D2] hover:underline">
                                        Where do I find these? <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                )}
                                {saveErr && <p className="text-[12.5px] text-[#C62828] bg-[#FCE8E8] px-3 py-2 rounded-[4px]">{saveErr}</p>}
                            </div>

                            <div className="px-7 py-5 bg-[#FAFAFA]/60 border-t border-[#E0E0E0] flex items-center justify-end gap-3">
                                <button onClick={() => setConnectPortal(null)} className="px-5 h-11 rounded-[4px] text-[#616161] font-semibold text-[13.5px] hover:text-[#212121] hover:bg-[#E0E0E0]/60 transition-colors">
                                    {t("jobPortals.cancel")}
                                </button>
                                <button onClick={saveConnection} disabled={saving} className="inline-flex items-center gap-2 px-6 h-11 bg-[#1976D2] text-white rounded-[4px] font-semibold text-[13.5px] shadow-[0_6px_16px_rgba(25,118,210,0.28)] hover:bg-[#1565C0] transition-colors disabled:opacity-60">
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
