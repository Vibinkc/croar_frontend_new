"use client";

import { useState } from "react";
import { Mail, Loader2, ChevronLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api-config";
import { useI18n } from "@/context/I18nContext";

type Provider = "gmail" | "outlook" | "imap";

const PROVIDERS: Record<Provider, { label: string; smtp_host: string; smtp_port: number; imap_host: string; imap_port: number; hint: string }> = {
    gmail: { label: "Gmail", smtp_host: "smtp.gmail.com", smtp_port: 587, imap_host: "imap.gmail.com", imap_port: 993, hint: "Use a Google App Password (16 chars) — not your normal login password. Requires 2-step verification enabled." },
    outlook: { label: "Outlook", smtp_host: "smtp-mail.outlook.com", smtp_port: 587, imap_host: "outlook.office365.com", imap_port: 993, hint: "Use an app password if 2FA is enabled on your Microsoft account." },
    imap: { label: "IMAP", smtp_host: "", smtp_port: 587, imap_host: "", imap_port: 993, hint: "Enter your mail provider's SMTP and IMAP server details." },
};

const GmailIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden><path fill="#4285F4" d="M22 5.5v13a1.5 1.5 0 0 1-1.5 1.5H19V8.24l-7 5.25-7-5.25V20H3.5A1.5 1.5 0 0 1 2 18.5v-13A1.5 1.5 0 0 1 3.5 4h.6L12 9.75 19.9 4h.6A1.5 1.5 0 0 1 22 5.5Z" /><path fill="#EA4335" d="M2 5.5A1.5 1.5 0 0 1 3.5 4h.6L12 9.75 19.9 4h.6A1.5 1.5 0 0 1 22 5.5L12 13.5 2 5.5Z" /></svg>
);
const OutlookIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden><path fill="#0364B8" d="M13 4h8v16h-8z" opacity=".85" /><path fill="#0F6CBD" d="M13 7h8v3h-8zM13 11h8v3h-8zM13 15h8v3h-8z" /><rect x="2" y="5" width="12" height="14" rx="2" fill="#0A5A9C" /><text x="8" y="15" fontSize="9" fill="#fff" textAnchor="middle" fontFamily="Arial" fontWeight="bold">O</text></svg>
);

export default function ConnectMailbox({ onConnected, onLater, showLater = false }: { onConnected: () => void; onLater?: () => void; showLater?: boolean }) {
    const { token } = useAuth();
    const { t: tr } = useI18n();
    const [provider, setProvider] = useState<Provider | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [advanced, setAdvanced] = useState(false);
    const [smtpHost, setSmtpHost] = useState("");
    const [smtpPort, setSmtpPort] = useState(587);
    const [imapHost, setImapHost] = useState("");
    const [imapPort, setImapPort] = useState(993);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [redirecting, setRedirecting] = useState(false);

    // Gmail uses real "Sign in with Google" (OAuth) — redirect to the consent screen.
    const connectGoogle = async () => {
        setRedirecting(true); setError("");
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/connections/google/authorize`, { headers: { Authorization: `Bearer ${token}` } });
            const d = await res.json().catch(() => ({}));
            if (res.ok && d.authorize_url) { window.location.href = d.authorize_url; return; }
            setError(typeof d?.detail === "string" ? d.detail : tr("sharedUi.googleSigninUnavailable"));
        } catch { setError(tr("sharedUi.networkError")); } finally { setRedirecting(false); }
    };

    const choose = (p: Provider) => {
        if (p === "gmail") { connectGoogle(); return; }
        const d = PROVIDERS[p];
        setProvider(p); setError("");
        setSmtpHost(d.smtp_host); setSmtpPort(d.smtp_port); setImapHost(d.imap_host); setImapPort(d.imap_port);
        setAdvanced(p === "imap");
    };

    const connect = async () => {
        if (!email.trim() || !password.trim()) { setError(tr("sharedUi.emailPasswordRequired")); return; }
        setSaving(true); setError("");
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/connections`, {
                method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ provider, email: email.trim(), password, display_name: displayName.trim() || null, smtp_host: smtpHost.trim(), smtp_port: Number(smtpPort), imap_host: imapHost.trim(), imap_port: Number(imapPort) }),
            });
            if (res.ok) { onConnected(); return; }
            const d = await res.json().catch(() => ({}));
            setError(typeof d?.detail === "string" ? d.detail : tr("sharedUi.couldNotConnect"));
        } catch { setError(tr("sharedUi.networkError")); } finally { setSaving(false); }
    };

    // Provider chooser (matches the "Connect your mailbox" card)
    if (!provider) {
        return (
            <div className="w-full max-w-md mx-auto">
                <h3 className="text-[20px] font-bold text-[#15171C] text-center leading-snug">{tr("sharedUi.connectYourMailbox")}<br />{tr("sharedUi.toStartSequencing")}</h3>
                <div className="mt-6 space-y-3">
                    <button onClick={() => choose("gmail")} disabled={redirecting} className="w-full h-12 rounded-[12px] bg-[#F4F5F7] hover:bg-[#ECEEF1] flex items-center justify-center gap-2.5 text-[14px] font-semibold text-[#15171C] disabled:opacity-60">{redirecting ? <Loader2 className="w-5 h-5 animate-spin text-[#5B53E0]" /> : <GmailIcon />} {redirecting ? tr("sharedUi.redirectingToGoogle") : tr("sharedUi.connectGmail")}</button>
                </div>
                {error && <p className="text-[12.5px] text-[#C0383C] bg-rose-50 border border-rose-100 rounded-[10px] px-3 py-2 mt-4">{error}</p>}
                <p className="text-center text-[12px] text-[#9AA3AF] mt-5">{tr("sharedUi.manageMailboxPre")} <span className="font-semibold text-[#6B6F76]">{tr("sharedUi.integrations")}</span> {tr("sharedUi.page")}</p>
            </div>
        );
    }

    const d = PROVIDERS[provider];
    return (
        <div className="w-full max-w-md mx-auto">
            <button onClick={() => { setProvider(null); setError(""); }} className="flex items-center gap-1 text-[13px] font-semibold text-[#6B6F76] hover:text-[#5B53E0] mb-3"><ChevronLeft className="w-4 h-4" /> {tr("sharedUi.back")}</button>
            <h3 className="text-[18px] font-bold text-[#15171C]">{tr("sharedUi.connectProvider", { provider: d.label })}</h3>
            <div className="mt-2 flex items-start gap-2 rounded-[10px] bg-[#F4F3FD] border border-[#E4E1F7] px-3 py-2.5">
                <ShieldCheck className="w-4 h-4 text-[#5B53E0] mt-0.5 shrink-0" />
                <p className="text-[12px] text-[#5B53E0] leading-relaxed">{provider === "gmail" ? tr("sharedUi.gmailHint") : provider === "outlook" ? tr("sharedUi.outlookHint") : tr("sharedUi.imapHint")}</p>
            </div>

            <div className="mt-4 space-y-3">
                <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wide text-[#8A929E] mb-1.5">{tr("sharedUi.emailAddress")}</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="w-full h-10 px-3 rounded-[10px] border border-[#E1E4E8] text-[13px] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15" />
                </div>
                <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wide text-[#8A929E] mb-1.5">{provider === "imap" ? tr("sharedUi.password") : tr("sharedUi.appPassword")}</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" className="w-full h-10 px-3 rounded-[10px] border border-[#E1E4E8] text-[13px] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15" />
                </div>
                <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wide text-[#8A929E] mb-1.5">{tr("sharedUi.senderName")} <span className="text-[#B4BAC2] normal-case font-normal">{tr("sharedUi.optional")}</span></label>
                    <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={tr("sharedUi.senderNamePlaceholder")} className="w-full h-10 px-3 rounded-[10px] border border-[#E1E4E8] text-[13px] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15" />
                </div>

                {provider !== "imap" && (
                    <button onClick={() => setAdvanced((v) => !v)} className="text-[12.5px] font-semibold text-[#5B53E0] hover:underline">{advanced ? tr("sharedUi.hideAdvanced") : tr("sharedUi.showAdvanced")}</button>
                )}
                {advanced && (
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-[11px] font-bold uppercase tracking-wide text-[#8A929E] mb-1.5">{tr("sharedUi.smtpHost")}</label><input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.provider.com" className="w-full h-10 px-3 rounded-[10px] border border-[#E1E4E8] text-[13px] outline-none focus:border-[#5B53E0]" /></div>
                        <div><label className="block text-[11px] font-bold uppercase tracking-wide text-[#8A929E] mb-1.5">{tr("sharedUi.smtpPort")}</label><input type="number" value={smtpPort} onChange={(e) => setSmtpPort(Number(e.target.value))} className="w-full h-10 px-3 rounded-[10px] border border-[#E1E4E8] text-[13px] outline-none focus:border-[#5B53E0]" /></div>
                        <div><label className="block text-[11px] font-bold uppercase tracking-wide text-[#8A929E] mb-1.5">{tr("sharedUi.imapHost")}</label><input value={imapHost} onChange={(e) => setImapHost(e.target.value)} placeholder="imap.provider.com" className="w-full h-10 px-3 rounded-[10px] border border-[#E1E4E8] text-[13px] outline-none focus:border-[#5B53E0]" /></div>
                        <div><label className="block text-[11px] font-bold uppercase tracking-wide text-[#8A929E] mb-1.5">{tr("sharedUi.imapPort")}</label><input type="number" value={imapPort} onChange={(e) => setImapPort(Number(e.target.value))} className="w-full h-10 px-3 rounded-[10px] border border-[#E1E4E8] text-[13px] outline-none focus:border-[#5B53E0]" /></div>
                    </div>
                )}

                {error && <p className="text-[12.5px] text-[#C0383C] bg-rose-50 border border-rose-100 rounded-[10px] px-3 py-2">{error}</p>}

                <button onClick={connect} disabled={saving} className="w-full h-11 rounded-[12px] bg-[#5B53E0] text-white text-[14px] font-bold hover:bg-[#4A43C9] disabled:opacity-60 flex items-center justify-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />} {saving ? tr("sharedUi.verifying") : tr("sharedUi.connectMailbox")}</button>
                {showLater && <button onClick={onLater} className="block mx-auto text-[13px] font-bold text-[#8A929E] hover:text-[#5B53E0]">{tr("sharedUi.doThisLater")}</button>}
            </div>
        </div>
    );
}
