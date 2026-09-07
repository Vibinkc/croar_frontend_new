"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { API_BASE_URL } from "@/lib/api-config";
import { Search, Loader2, X, MoreHorizontal, ChevronDown, Plus, CheckCircle2, Mail } from "@/components/icons";
import ConnectMailbox from "@/components/sourcing/ConnectMailbox";

interface Connection {
    connection_id: string;
    provider: string;
    auth_type?: string;
    email: string;
    display_name?: string | null;
    smtp_host?: string;
    smtp_port?: number;
    status?: string;
    owner?: string;
    created_at?: string;
}

const providerLabel = (p: string) => (p === "gmail" ? "Gmail" : p === "outlook" ? "Outlook" : "IMAP");

const GmailMark = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden><path fill="#4285F4" d="M22 5.5v13a1.5 1.5 0 0 1-1.5 1.5H19V8.24l-7 5.25-7-5.25V20H3.5A1.5 1.5 0 0 1 2 18.5v-13A1.5 1.5 0 0 1 3.5 4h.6L12 9.75 19.9 4h.6A1.5 1.5 0 0 1 22 5.5Z" /><path fill="#EA4335" d="M2 5.5A1.5 1.5 0 0 1 3.5 4h.6L12 9.75 19.9 4h.6A1.5 1.5 0 0 1 22 5.5L12 13.5 2 5.5Z" /></svg>
);
const OutlookMark = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden><rect x="2" y="5" width="12" height="14" rx="2" fill="#0A5A9C" /><text x="8" y="15" fontSize="9" fill="#fff" textAnchor="middle" fontFamily="Arial" fontWeight="bold">O</text><path fill="#0F6CBD" d="M14 7h8v3h-8zM14 11h8v3h-8zM14 15h8v3h-8z" /></svg>
);
// Decorative Gmail mockup shown in the empty-state hero.
function GmailPreview() {
    return (
        <div className="rounded-[4px] bg-white border border-[#D6E9FA] shadow-[0_8px_24px_rgba(25,118,210,0.14)] overflow-hidden text-left">
            <div className="flex items-center gap-3 px-3 py-2 border-b border-[#F5F6F8]">
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-4 h-0.5 bg-[#BDBDBD] rounded block relative before:content-[''] before:absolute before:-top-1 before:w-4 before:h-0.5 before:bg-[#BDBDBD] after:content-[''] after:absolute after:top-1 after:w-4 after:h-0.5 after:bg-[#BDBDBD]" />
                    <GmailMark />
                    <span className="text-[12px] font-semibold text-[#5f6368]">Gmail</span>
                </div>
                <div className="flex-1 h-6 rounded-full bg-[#F1F3F4] flex items-center px-2.5 gap-1.5"><Search className="w-3 h-3 text-[#9E9E9E]" /><span className="text-[10px] text-[#9E9E9E]">Search mail</span></div>
            </div>
            <div className="flex">
                <div className="w-[92px] shrink-0 p-2.5 space-y-2 border-r border-[#F5F6F8]">
                    <div className="h-8 rounded-full bg-[#C2E7FF] flex items-center justify-center gap-1.5 px-2.5"><Plus className="w-3.5 h-3.5 text-[#001D35]" /><span className="text-[11px] font-semibold text-[#001D35]">Compose</span></div>
                    {["#EA4335", "#BDBDBD", "#BDBDBD", "#BDBDBD", "#BDBDBD"].map((c, i) => (
                        <div key={i} className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: c }} /><span className="h-1.5 flex-1 rounded-full bg-[#EDEFF1]" /></div>
                    ))}
                </div>
                <div className="flex-1 min-w-0 p-3">
                    <p className="text-[12px] font-bold text-[#202124]">Sarah, ready for a new opportunity?</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="w-6 h-6 rounded-full bg-[#DADCE0] shrink-0" />
                        <div className="min-w-0"><p className="text-[10.5px] font-semibold text-[#202124]">Recruiter</p><p className="text-[9.5px] text-[#9E9E9E]">to Sarah</p></div>
                        <span className="ml-auto text-[9px] font-bold text-[#EA4335] bg-[#FCE8E6] px-1.5 py-0.5 rounded">Sent</span>
                    </div>
                    <div className="mt-2.5 space-y-1.5">
                        <p className="text-[10.5px] text-[#3c4043]">Hi Sarah,</p>
                        <p className="text-[10px] text-[#5f6368] leading-relaxed">I&apos;m reaching out because your background stood out for a Product Design opportunity in San Francisco.</p>
                        <span className="block h-1.5 w-3/4 rounded-full bg-[#EDEFF1]" />
                        <span className="block h-1.5 w-1/2 rounded-full bg-[#EDEFF1]" />
                    </div>
                </div>
            </div>
        </div>
    );
}

const ATS: { name: string; domain: string; color: string; wiki?: string }[] = [
    { name: "Ashby", domain: "ashbyhq.com", color: "#5C33E1" }, { name: "Lever", domain: "lever.co", color: "#8A94A6" }, { name: "Greenhouse (V3)", domain: "greenhouse.io", color: "#1E8556" },
    { name: "RecruiterFlow", domain: "recruiterflow.com", color: "#2F8FED" }, { name: "Bullhorn", domain: "bullhorn.com", color: "#F04E23", wiki: "Bullhorn_logo.svg" }, { name: "ApplicantStack", domain: "applicantstack.com", color: "#2B6CB0" },
    { name: "BambooHR", domain: "bamboohr.com", color: "#6DAE3C", wiki: "BambooHR_Logo.svg" }, { name: "Breezy HR", domain: "breezy.hr", color: "#2B6CE6" }, { name: "Ceipal", domain: "ceipal.com", color: "#E8532A" },
    { name: "Cornerstone TalentLink", domain: "cornerstoneondemand.com", color: "#EE4B2B" }, { name: "Crelate", domain: "crelate.com", color: "#2196C9" }, { name: "Workable", domain: "workable.com", color: "#5C6BC0" },
    { name: "JazzHR", domain: "jazzhr.com", color: "#F26522" }, { name: "SmartRecruiters", domain: "smartrecruiters.com", color: "#00A5C4" }, { name: "iCIMS", domain: "icims.com", color: "#E4002B", wiki: "ICIMS_logo.svg" }, { name: "Greenhouse", domain: "greenhouse.io", color: "#28A05C" },
];

// Real brand logo, tried across several public logo sources (Wikimedia first, then
// logo CDNs, then the site favicon). Falls back to a colored initial only if all fail.
function BrandLogo({ name, domain, color, wiki }: { name: string; domain: string; color: string; wiki?: string }) {
    const [i, setI] = useState(0);
    const sources = [
        ...(wiki ? [`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(wiki)}?width=64`] : []),
        `https://logo.clearbit.com/${domain}`,
        `https://icons.duckduckgo.com/ip3/${domain}.ico`,
        `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    ];
    if (i >= sources.length) return <span className="w-9 h-9 rounded-[4px] flex items-center justify-center text-[14px] font-bold text-white shrink-0" style={{ backgroundColor: color }}>{name.slice(0, 1)}</span>;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={sources[i]} alt={name} onError={() => setI((n) => n + 1)} className="w-9 h-9 rounded-[4px] object-contain bg-white border border-[#F5F6F8] p-0.5 shrink-0" />;
}

/**
 * The connection-based integrations: mailboxes, calendar, Slack and the ATS list.
 *
 * Lifted out of its own route so the single Integrations screen can render it under the
 * marketplace grid. Unchanged apart from losing the page wrapper and <h1>, which the
 * host page now owns — two headings reading "Integrations" on one screen is exactly the
 * duplication this move set out to remove.
 */
export default function ConnectionsPanel() {
    const { token } = useAuth();
    const { t } = useI18n();
    const [conns, setConns] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(true);
    const [showConnect, setShowConnect] = useState(false);
    const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
    const [tab, setTab] = useState<"mine" | "team">("mine");
    const [search, setSearch] = useState("");
    const [menuId, setMenuId] = useState<string | null>(null);
    const [menuPos, setMenuPos] = useState<{ right: number; top?: number; bottom?: number }>({ right: 0, top: 0 });
    const [disc, setDisc] = useState<{ id: string; email: string } | null>(null);
    const [discText, setDiscText] = useState("");

    useEffect(() => {
        const p = new URLSearchParams(window.location.search);
        if (!p.has("connected")) return;
        setNotice(p.get("connected") === "1"
            ? { ok: true, text: t("integrations.mailboxConnected") }
            : { ok: false, text: p.get("reason") === "token" ? t("integrations.noRefreshToken") : t("integrations.connectFailed") });
        window.history.replaceState({}, "", window.location.pathname);
        const timer = setTimeout(() => setNotice(null), 6000);
        return () => clearTimeout(timer);
    }, []);

    const fetchConns = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/connections`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const d = await res.json(); setConns(d.connections || []); }
        } catch { /* ignore */ } finally { setLoading(false); }
    };
    useEffect(() => { fetchConns(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [token]);

    const openDisconnect = (id: string) => {
        const c = conns.find((x) => x.connection_id === id);
        setMenuId(null);
        setDisc({ id, email: c?.email || "" });
        setDiscText("");
    };
    const confirmDisconnect = async () => {
        if (!disc || discText.trim().toUpperCase() !== "DISCONNECT") return;
        const id = disc.id;
        setConns((p) => p.filter((c) => c.connection_id !== id));
        setDisc(null); setDiscText("");
        try { await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/connections/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }); } catch { /* ignore */ }
    };

    const comingSoon = (name: string) => { setNotice({ ok: true, text: t("integrations.comingSoonToast").replace("{name}", name) }); const timer = setTimeout(() => setNotice(null), 4000); return () => clearTimeout(timer); };
    const senderName = (c: Connection) => c.display_name || (c.email ? c.email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()) : "—");

    const atsFiltered = useMemo(() => ATS.filter((a) => a.name.toLowerCase().includes(search.trim().toLowerCase())), [search]);
    const matches = (t: string) => t.toLowerCase().includes(search.trim().toLowerCase());
    const q = search.trim().toLowerCase();

    return (
        <div>

            {notice && (
                <div className={`mb-4 rounded-[4px] px-4 py-3 text-[13px] font-medium border ${notice.ok ? "bg-[#EAF7EE] border-[#C6EAD2] text-[#166534]" : "bg-rose-50 border-rose-100 text-[#B4322F]"}`}>{notice.text}</div>
            )}

            {/* Search + request */}
            <div className="flex items-center gap-3 mb-8">
                <div className="flex-1 relative">
                    <Search className="w-4 h-4 text-[#9E9E9E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("integrations.searchPlaceholder")} className="w-full h-11 pl-10 pr-3 rounded-[4px] border border-[#E0E0E0] text-[13.5px] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15" />
                </div>
                <button onClick={() => comingSoon("Requested")} className="h-11 px-4 rounded-[4px] border border-[#E0E0E0] bg-white text-[13px] font-semibold text-[#424242] hover:bg-[#FAFAFA] shrink-0">{t("integrations.request")}</button>
            </div>

            {/* Email integrations */}
            {(!q || matches("email") || matches("gmail") || matches("outlook") || matches("mailbox")) && (
                <section className="mb-10">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-[16px] font-bold text-[#212121]">{t("integrations.emailTitle")}</h2>
                            <p className="text-[13px] text-[#616161] mt-0.5">{t("integrations.emailSubtitle")}</p>
                        </div>
                    </div>

                    <div className="mt-4 inline-flex items-center gap-1 bg-[#EEEEEE] rounded-[4px] p-1">
                        <button onClick={() => setTab("mine")} className={`px-3 py-1.5 rounded-[4px] text-[12.5px] font-bold ${tab === "mine" ? "bg-white text-[#212121] shadow-sm" : "text-[#616161]"}`}>{t("integrations.yourMailboxes")} ({conns.length})</button>
                        <button onClick={() => setTab("team")} className={`px-3 py-1.5 rounded-[4px] text-[12.5px] font-bold ${tab === "team" ? "bg-white text-[#212121] shadow-sm" : "text-[#616161]"}`}>{t("integrations.teamMailboxes")} (0)</button>
                    </div>

                    {loading ? (
                        <div className="mt-3 py-16 flex justify-center rounded-[4px] border border-[#E0E0E0] bg-white"><Loader2 className="w-5 h-5 text-[#1976D2] animate-spin" /></div>
                    ) : tab === "mine" && conns.length === 0 ? (
                        /* Empty state — "Connect an email account" hero */
                        <div className="mt-3 rounded-[4px] border border-[#D6E9FA] bg-gradient-to-br from-[#F3F9FE] to-[#EFEEFB] overflow-hidden flex flex-col sm:flex-row items-center">
                            <div className="px-5 py-4 flex-1 min-w-0">
                                <h3 className="text-[16px] font-bold text-[#212121]">{t("integrations.connectEmailAccount")}</h3>
                                <p className="text-[12.5px] text-[#616161] mt-1 max-w-md">{t("integrations.connectEmailDesc")}</p>
                                <div className="mt-3.5 flex items-center gap-2.5">
                                    <button onClick={() => setShowConnect(true)} className="h-9 px-4 rounded-[4px] bg-[#1976D2] text-white text-[13px] font-bold hover:bg-[#1565C0] shadow-[0_4px_12px_rgba(25,118,210,0.28)] flex items-center gap-1.5">{t("integrations.addMailbox")} <ChevronDown className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => comingSoon("SOBO mailbox")} className="h-9 px-4 rounded-[4px] border border-[#E0E0E0] bg-white text-[13px] font-semibold text-[#424242] hover:bg-[#FAFAFA]">{t("integrations.addSobo")}</button>
                                </div>
                            </div>
                            <div className="w-full sm:w-[42%] shrink-0 px-4 pb-4 sm:pt-4 sm:pl-0">
                                <GmailPreview />
                            </div>
                        </div>
                    ) : tab === "team" ? (
                        <div className="mt-3 py-16 text-center text-[13px] text-[#757575] rounded-[4px] border border-[#E0E0E0] bg-white">{t("integrations.noTeamMailboxes")}</div>
                    ) : (
                        <>
                            <div className="mt-3 rounded-[4px] border border-[#E0E0E0] bg-white overflow-hidden">
                                <div className="grid grid-cols-[1.1fr_1fr_1.6fr_0.9fr_0.9fr_40px] gap-3 px-5 py-3 bg-[#FAFAFA] border-b border-[#F5F6F8] text-[11.5px] font-bold uppercase tracking-wide text-[#757575]">
                                    <span>{t("integrations.colProvider")}</span><span>{t("integrations.colSenderName")}</span><span>{t("integrations.colEmailAddress")}</span><span>{t("integrations.colStatus")}</span><span>{t("integrations.colEmailsPerDay")}</span><span />
                                </div>
                                {conns.map((c) => (
                                    <div key={c.connection_id} className="grid grid-cols-[1.1fr_1fr_1.6fr_0.9fr_0.9fr_40px] gap-3 px-5 py-4 border-b border-[#EEEEEE] last:border-b-0 items-center">
                                        <span className="flex items-center gap-2 text-[13.5px] font-semibold text-[#212121]">{c.provider === "gmail" ? <GmailMark /> : c.provider === "outlook" ? <OutlookMark /> : <Mail className="w-5 h-5 text-[#616161]" />} {providerLabel(c.provider)}</span>
                                        <span className="text-[13.5px] text-[#424242] truncate">{senderName(c)}</span>
                                        <span className="flex items-center gap-2 min-w-0"><span className="text-[13.5px] text-[#424242] truncate">{c.email}</span><button onClick={() => comingSoon("Alias")} className="text-[11.5px] font-semibold text-[#616161] border border-[#E0E0E0] rounded-full px-2 py-0.5 hover:bg-[#FAFAFA] shrink-0">{t("integrations.addAlias")}</button></span>
                                        <span className="flex items-center gap-1 text-[13px] font-semibold text-[#2E7D32]"><CheckCircle2 className="w-3.5 h-3.5" /> {t("integrations.connected")}</span>
                                        <span className="text-[13.5px] text-[#424242]">100</span>
                                        <span className="flex justify-end">
                                            <button onClick={(e) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); const up = window.innerHeight - r.bottom < 120; setMenuPos({ right: Math.max(12, window.innerWidth - r.right), top: up ? undefined : r.bottom + 4, bottom: up ? window.innerHeight - r.top + 4 : undefined }); setMenuId(menuId === c.connection_id ? null : c.connection_id); }} className="p-1.5 rounded-lg hover:bg-[#EEEEEE] text-[#9E9E9E]"><MoreHorizontal className="w-5 h-5" /></button>
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 flex items-center gap-2.5">
                                <button onClick={() => setShowConnect(true)} className="h-10 px-4 rounded-[4px] border border-[#E0E0E0] bg-white text-[13px] font-semibold text-[#424242] hover:bg-[#FAFAFA] flex items-center gap-1.5"><Plus className="w-4 h-4" /> {t("integrations.addMailbox")} <ChevronDown className="w-3.5 h-3.5" /></button>
                                <button onClick={() => comingSoon("SOBO mailbox")} className="h-10 px-4 rounded-[4px] border border-[#E0E0E0] bg-white text-[13px] font-semibold text-[#424242] hover:bg-[#FAFAFA]">{t("integrations.addSobo")}</button>
                            </div>
                        </>
                    )}
                </section>
            )}

            {/* Calendar integration */}
            {(!q || matches("calendar") || matches("google")) && (
                <section className="mb-10">
                    <h2 className="text-[16px] font-bold text-[#212121]">{t("integrations.calendarTitle")}</h2>
                    <p className="text-[13px] text-[#616161] mt-0.5">{t("integrations.calendarDesc")}</p>
                    <div className="mt-4 rounded-[4px] border border-[#E0E0E0] bg-white p-4 flex items-center gap-4">
                        <BrandLogo name="Google Calendar" domain="calendar.google.com" color="#4285F4" wiki="Google_Calendar_icon_(2020).svg" />
                        <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-bold text-[#212121]">Google Calendar</p>
                            <p className="text-[12.5px] text-[#616161] mt-0.5">{t("integrations.calendarCardDesc")}</p>
                        </div>
                        <button onClick={() => comingSoon("Google Calendar")} className="h-9 px-4 rounded-[4px] border border-[#E0E0E0] bg-white text-[13px] font-semibold text-[#424242] hover:bg-[#FAFAFA] shrink-0">{t("integrations.comingSoon")}</button>
                    </div>
                </section>
            )}

            {/* Recommended integrations */}
            {(!q || matches("slack") || matches("notification")) && (
                <section className="mb-10">
                    <h2 className="text-[16px] font-bold text-[#212121]">{t("integrations.recommendedTitle")}</h2>
                    <p className="text-[13px] text-[#616161] mt-0.5">{t("integrations.recommendedDesc")}</p>
                    <div className="mt-4 rounded-[4px] border border-[#E0E0E0] bg-white p-4 flex items-center gap-4">
                        <BrandLogo name="Slack" domain="slack.com" color="#611F69" wiki="Slack_icon_2019.svg" />
                        <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-bold text-[#212121]">{t("integrations.slackTitle")}</p>
                            <p className="text-[12.5px] text-[#616161] mt-0.5">{t("integrations.slackDesc")}</p>
                        </div>
                        <button onClick={() => comingSoon("Slack")} className="h-9 px-4 rounded-[4px] border border-[#E0E0E0] bg-white text-[13px] font-semibold text-[#424242] hover:bg-[#FAFAFA] shrink-0">{t("integrations.comingSoon")}</button>
                    </div>
                </section>
            )}

            {/* The assessment and interview tools are the marketplace grid above this panel,
                not a second list down here. */}

            {/* ATS integrations */}
            {(!q || matches("ats") || atsFiltered.length > 0) && (
                <section className="mb-6">
                    <h2 className="text-[16px] font-bold text-[#212121]">{t("integrations.atsTitle")}</h2>
                    <p className="text-[13px] text-[#616161] mt-0.5">{t("integrations.atsSubtitle")}</p>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {(q ? atsFiltered : ATS).map((a) => (
                            <div key={a.name} className="rounded-[4px] border border-[#E0E0E0] bg-white p-4 flex flex-col gap-4">
                                <div className="flex items-center gap-2.5">
                                    <BrandLogo name={a.name} domain={a.domain} color={a.color} wiki={a.wiki} />
                                    <span className="text-[14px] font-bold text-[#212121] leading-tight">{a.name}</span>
                                </div>
                                <button onClick={() => comingSoon(a.name)} className="h-9 rounded-[4px] border border-[#E0E0E0] bg-white text-[13px] font-semibold text-[#424242] hover:bg-[#FAFAFA]">{t("integrations.comingSoon")}</button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Row menu (fixed) */}
            {menuId && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuId(null)} />
                    <div className="fixed z-50 bg-white rounded-[4px] border border-[#E0E0E0] shadow-[0_10px_28px_rgba(0,0,0,0.16)] p-1.5 w-40" style={{ right: menuPos.right, top: menuPos.top, bottom: menuPos.bottom }}>
                        <button onClick={() => openDisconnect(menuId)} className="w-full text-left px-3 py-2 rounded-[4px] text-[13px] font-semibold text-[#C62828] hover:bg-rose-50">{t("integrations.disconnect")}</button>
                    </div>
                </>
            )}

            {/* Disconnect confirmation — type DISCONNECT to confirm */}
            {disc && (
                <div className="fixed inset-0 bg-[#212121]/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => { setDisc(null); setDiscText(""); }}>
                    <div className="bg-white rounded-[4px] border border-[#E0E0E0] shadow-[0_14px_34px_rgba(0,0,0,0.16)] w-full max-w-[440px] p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-[18px] font-bold text-[#212121] break-words">{t("integrations.disconnectTitle").replace("{email}", disc.email)}</h3>
                        <p className="text-[13.5px] text-[#616161] mt-2.5 leading-relaxed">{t("integrations.disconnectDesc")}</p>
                        <label className="block text-[13px] font-bold text-[#212121] mt-5 mb-2">{t("integrations.typeToConfirm")}</label>
                        <input value={discText} onChange={(e) => setDiscText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") confirmDisconnect(); }} autoFocus placeholder="DISCONNECT" className="w-full h-11 px-3.5 rounded-[4px] border border-[#E0E0E0] text-[13px] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15" />
                        <div className="flex justify-end gap-2.5 mt-5">
                            <button onClick={() => { setDisc(null); setDiscText(""); }} className="h-10 px-4 rounded-[4px] border border-[#E0E0E0] text-[13px] font-semibold text-[#424242] hover:bg-[#FAFAFA]">{t("integrations.cancel")}</button>
                            <button onClick={confirmDisconnect} disabled={discText.trim().toUpperCase() !== "DISCONNECT"} className="h-10 px-5 rounded-[4px] bg-[#DC2626] text-white text-[13px] font-bold hover:bg-[#B91C1C] disabled:bg-[#FBD9D9] disabled:text-white disabled:cursor-not-allowed">{t("integrations.confirm")}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Connect modal */}
            {showConnect && (
                <div className="fixed inset-0 bg-[#212121]/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowConnect(false)}>
                    <div className="bg-white rounded-[4px] border border-[#E0E0E0] shadow-[0_14px_34px_rgba(0,0,0,0.16)] w-full max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0E0E0]">
                            <h3 className="text-[16px] font-bold text-[#212121]">{t("integrations.addMailbox")}</h3>
                            <button onClick={() => setShowConnect(false)} className="p-1.5 hover:bg-[#EEEEEE] text-[#9E9E9E] rounded-lg"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-6">
                            <ConnectMailbox onConnected={() => { setShowConnect(false); fetchConns(); }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
