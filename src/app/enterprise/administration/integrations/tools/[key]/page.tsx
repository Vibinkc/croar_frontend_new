"use client";

/**
 * One integration's page: what it does, what it needs, and the consent to connect it.
 *
 * A page rather than a dialog, following the reference ATS, and for the same reason: the
 * recruiter is about to hand a third party an API key and route candidate data through it.
 * That deserves the paragraph explaining what connecting actually does, and a terms checkbox
 * that has to be ticked deliberately — not a two-field modal over a grid.
 *
 * The consent is sent to the server and stored with a timestamp and who gave it. A checkbox
 * that only enables a button proves nothing later.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";

interface Field {
    name: string;
    label: string;
    type: string;
    required: boolean;
    help: string;
}

interface Integration {
    key: string;
    name: string;
    category: string;
    summary: string;
    what_it_does: string;
    docs_url: string | null;
    icon_url: string | null;
    brand_color: string;
    api_tier: "free" | "paid" | "link";
    requires_consent: boolean;
    free_to_try: boolean;
    trial_note: string;
    supports_webhook: boolean;
    setup_steps: string[];
    capabilities: string[];
    limitations: string[];
    fields: Field[];
    connected: boolean;
    connection: {
        display_name?: string;
        verified?: boolean;
        agreed_at?: string | null;
        agreed_by?: string | null;
        invite_url?: string | null;
    } | null;
}

// Long enough for a signed token, not merely for an API key. 255 was copied from Manatal's
// Codility screen, where the credential is a short key — a Testlify access token is a JWT of
// roughly 520 characters, so the input silently truncated it mid-signature and the provider
// answered "invalid signature" for a value the user had pasted correctly.
const MAX_CREDENTIAL = 4096;

export default function IntegrationDetail() {
    const { t: tr } = useI18n();
    const router = useRouter();
    const params = useParams<{ key: string }>();
    const { token, isLoading: authLoading, canAccess } = useAuth();

    const [item, setItem] = useState<Integration | null>(null);
    const [values, setValues] = useState<Record<string, string>>({});
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    // Editing an existing connection reuses the connect form; the POST upserts.
    const [editing, setEditing] = useState(false);
    // The company's result webhook, shown for providers that post results back. It is what
    // actually makes those integrations work, so it belongs on the connect page rather than
    // buried in an API nobody calls by hand.
    const [webhook, setWebhook] = useState<{ url: string; reachable: boolean } | null>(null);
    const [copiedHook, setCopiedHook] = useState(false);

    const canEdit = canAccess ? canAccess("organization:update") : false;

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
            const found = (data.integrations || []).find((i: Integration) => i.key === params.key) || null;
            setItem(found);

            if (found?.supports_webhook) {
                const wr = await fetch(`${BACKEND_URL}/api/v1/enterprise/integrations/webhook`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (wr.ok) setWebhook(await wr.json());
            }
            // Already connected means already agreed; re-ticking a box they ticked before is noise.
            setAgreed(Boolean(found?.connected));
        } catch {
            setItem(null);
        } finally {
            setLoading(false);
        }
    }, [token, authLoading, params.key]);

    useEffect(() => {
        void load();
    }, [load]);

    const connect = async () => {
        if (!token || !item) return;
        setBusy(true);
        setError("");
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/integrations/connections`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    integration: item.key,
                    credentials: values,
                    agreed_to_terms: agreed,
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                // The server's message names the field or the provider's own rejection, which is
                // more use than "could not connect".
                setError(typeof body.detail === "string" ? body.detail : tr("integrations.connectFailed"));
                return;
            }
            setEditing(false);
            await load();
        } catch {
            setError(tr("integrations.connectFailed"));
        } finally {
            setBusy(false);
        }
    };

    const disconnect = async () => {
        if (!token || !item) return;
        if (!window.confirm(tr("integrations.disconnectConfirm", { name: item.name }))) return;
        setBusy(true);
        try {
            await fetch(`${BACKEND_URL}/api/v1/enterprise/integrations/connections/${item.key}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            setValues({});
            await load();
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex justify-center">
                <div className="w-6 h-6 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
            </div>
        );
    }

    if (!item) {
        return (
            <div className="p-6 max-w-[820px] mx-auto">
                <p className="text-[13px] text-[#757575]">{tr("integrations.notFound")}</p>
                <button onClick={() => router.push("/enterprise/integrations")} className="text-[12.5px] font-semibold text-[#1976D2] mt-2">
                    {tr("integrations.backToAll")}
                </button>
            </div>
        );
    }

    const missingRequired = item.fields.some((f) => f.required && !(values[f.name] || "").trim());
    const canSubmit = canEdit && !busy && !missingRequired && (!item.requires_consent || agreed);

    return (
        <div className="p-6 max-w-[820px] mx-auto space-y-4">
            <div className="flex items-center gap-1.5 text-[12px]">
                <Link href="/enterprise/integrations" className="font-semibold text-[#1976D2] hover:text-[#1565C0] transition-colors">
                    {tr("integrations.title")}
                </Link>
                <i className="mdi mdi-chevron-right text-[15px] text-[#BDBDBD]" />
                <span className="text-[#616161]">{item.name}</span>
            </div>

            <div className="rounded-[4px] border border-[#E0E0E0] bg-white p-5 space-y-4">
                <div className="flex items-start gap-3.5">
                    <span
                        className="w-14 h-14 shrink-0 rounded-[4px] border border-[#E0E0E0] bg-white flex items-center justify-center overflow-hidden"
                        style={{ background: `${item.brand_color}0F` }}
                    >
                        {item.icon_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img role="presentation"
                                src={item.icon_url}
                                alt=""
                                className="w-8 h-8 object-contain"
                                onError={(e) => { e.currentTarget.style.display = "none"; }}
                            />
                        ) : (
                            <span className="text-[20px] font-extrabold" style={{ color: item.brand_color }}>
                                {item.name.charAt(0)}
                            </span>
                        )}
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-[18px] font-bold text-[#212121]">{item.name}</h1>
                            {item.connected && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[3px] uppercase tracking-wide bg-[#E8F5E9] text-[#2E7D32]">
                                    {item.connection?.verified ? tr("integrations.verified") : tr("integrations.connected")}
                                </span>
                            )}
                        </div>
                        <p className="text-[12.5px] text-[#757575] leading-relaxed mt-1">{item.summary}</p>
                        {item.docs_url && (
                            <a
                                href={item.docs_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[12px] font-semibold text-[#1976D2] hover:text-[#1565C0] transition-colors mt-1 inline-block"
                            >
                                {tr("integrations.learnMore", { name: item.name })}
                            </a>
                        )}
                    </div>
                </div>

                <div className="border-t border-[#EEEEEE] pt-4 space-y-3">
                    <p className="text-[12.5px] text-[#424242] leading-relaxed">{item.what_it_does}</p>

                    {item.free_to_try && item.trial_note && (
                        <p className="text-[12px] text-[#2E7D32] bg-[#E8F5E9] rounded-[4px] px-3 py-2 leading-relaxed">
                            {item.trial_note}
                        </p>
                    )}

                    {item.setup_steps?.length > 0 && (
                        <ol className="space-y-2 pt-1">
                            {item.setup_steps.map((step, i) => (
                                <li key={i} className="flex gap-2.5 text-[12px] text-[#424242] leading-relaxed">
                                    <span className="w-[18px] h-[18px] shrink-0 mt-px rounded-full bg-[#E3F2FD] text-[#1976D2] text-[10px] font-bold flex items-center justify-center">
                                        {i + 1}
                                    </span>
                                    {step}
                                </li>
                            ))}
                        </ol>
                    )}

                    {webhook && (
                        <div className="rounded-[4px] border border-[#E0E0E0] bg-[#FAFAFB] p-3">
                            <p className="text-[11.5px] font-bold text-[#212121]">{tr("integrations.webhookTitle")}</p>
                            <p className="text-[11px] text-[#757575] leading-relaxed mt-0.5 mb-2">
                                {tr("integrations.webhookDesc", { name: item.name })}
                            </p>
                            <div className="flex gap-1.5">
                                <input
                                    readOnly
                                    value={webhook.url}
                                    aria-label={tr("integrations.webhookTitle")}
                                    onFocus={(e) => e.currentTarget.select()}
                                    className="flex-1 min-w-0 h-8 px-2 rounded-[4px] border border-[#E0E0E0] bg-white text-[11px] font-mono text-[#424242]"
                                />
                                <button
                                    onClick={() => {
                                        void navigator.clipboard?.writeText(webhook.url);
                                        setCopiedHook(true);
                                        window.setTimeout(() => setCopiedHook(false), 1600);
                                    }}
                                    className="h-8 px-2.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[11px] font-semibold text-[#424242] hover:border-[#1976D2]/50 hover:text-[#1976D2] transition-colors shrink-0"
                                >
                                    {copiedHook ? tr("integrations.copied") : tr("integrations.copy")}
                                </button>
                            </div>
                            {/* A webhook pointed at localhost never arrives, and the failure is
                                silent at both ends. Say it here rather than after a lost result. */}
                            {!webhook.reachable && (
                                <p className="text-[11px] text-[#EF6C00] leading-relaxed mt-2">
                                    {tr("integrations.webhookUnreachable")}
                                </p>
                            )}
                        </div>
                    )}

                    {/* What it does and does not do, kept separate. A connect screen that only
                        lists capabilities is how a product ends up promising a score sync it
                        never had. */}
                    {(item.capabilities.length > 0 || item.limitations.length > 0) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {item.capabilities.length > 0 && (
                                <div className="rounded-[4px] bg-[#FAFAFA] p-3">
                                    <p className="text-[10px] font-bold text-[#2E7D32] uppercase tracking-wider mb-1.5">
                                        {tr("integrations.whatYouGet")}
                                    </p>
                                    <ul className="space-y-1">
                                        {item.capabilities.map((c, i) => (
                                            <li key={i} className="text-[11.5px] text-[#424242] leading-relaxed flex gap-1.5">
                                                <span className="text-[#2E7D32]">·</span>{c}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {item.limitations.length > 0 && (
                                <div className="rounded-[4px] bg-[#FAFAFA] p-3">
                                    <p className="text-[10px] font-bold text-[#EF6C00] uppercase tracking-wider mb-1.5">
                                        {tr("integrations.whatItDoesNot")}
                                    </p>
                                    <ul className="space-y-1">
                                        {item.limitations.map((c, i) => (
                                            <li key={i} className="text-[11.5px] text-[#424242] leading-relaxed flex gap-1.5">
                                                <span className="text-[#EF6C00]">·</span>{c}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {item.connected && !editing ? (
                    <div className="border-t border-[#EEEEEE] pt-4 space-y-3">
                        <div className="text-[12px] text-[#616161] space-y-1">
                            {item.connection?.invite_url && (
                                <p>
                                    {tr("integrations.currentLink")}{" "}
                                    <span className="font-mono text-[11.5px] text-[#424242]">{item.connection.invite_url}</span>
                                </p>
                            )}
                            {item.connection?.agreed_at && (
                                <p>
                                    {tr("integrations.agreedOn", {
                                        who: item.connection.agreed_by || "—",
                                        when: new Date(item.connection.agreed_at).toLocaleDateString(),
                                    })}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    // Seed the form with what is safe to show. The API key is never
                                    // returned, so it starts empty and is only overwritten if typed.
                                    setValues({ invite_url: item.connection?.invite_url || "" });
                                    setEditing(true);
                                }}
                                disabled={busy || !canEdit}
                                className="h-9 px-4 rounded-[4px] border border-[#E0E0E0] bg-white text-[12.5px] font-bold text-[#424242] hover:border-[#1976D2]/50 hover:text-[#1976D2] transition-colors disabled:opacity-50"
                            >
                                {tr("integrations.editConnection")}
                            </button>
                            <button
                                onClick={() => void disconnect()}
                                disabled={busy || !canEdit}
                                className="h-9 px-4 rounded-[4px] border border-[#E0E0E0] bg-white text-[12.5px] font-bold text-[#C62828] hover:bg-[#FCE8E8] transition-colors disabled:opacity-50"
                            >
                                {tr("integrations.disconnect")}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="border-t border-[#EEEEEE] pt-4 space-y-3.5">
                        {item.fields.map((f) => (
                            <div key={f.name}>
                                <div className="flex items-baseline justify-between">
                                    <label className="block text-[12px] font-bold text-[#212121] mb-1">
                                        {f.label}
                                        {!f.required && <span className="text-[#9E9E9E] font-semibold"> · {tr("integrations.optional")}</span>}
                                    </label>
                                    {(values[f.name] || "").length > MAX_CREDENTIAL * 0.8 && (
                                        <span className="text-[10.5px] text-[#9E9E9E] tabular-nums">
                                            {(values[f.name] || "").length} / {MAX_CREDENTIAL}
                                        </span>
                                    )}
                                </div>
                                <input
                                    type={f.type === "password" ? "password" : "text"}
                                    maxLength={MAX_CREDENTIAL}
                                    value={values[f.name] || ""}
                                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                                    placeholder={f.type === "url" ? "https://…" : ""}
                                    className="w-full h-9 px-2.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[12.5px] text-[#212121] placeholder:text-[#9E9E9E] focus:border-[#1976D2]/50 outline-none"
                                />
                                {f.help && <p className="text-[11px] text-[#757575] leading-relaxed mt-1">{f.help}</p>}
                            </div>
                        ))}

                        {item.requires_consent && (
                            <label className="flex items-start gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    className="w-4 h-4 mt-0.5 accent-[#1976D2]"
                                />
                                <span className="text-[12px] text-[#424242] leading-relaxed">
                                    {tr("integrations.consent", { name: item.name })}
                                    {item.docs_url && (
                                        <>
                                            {" "}
                                            <a
                                                href={item.docs_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-semibold text-[#1976D2] hover:text-[#1565C0]"
                                            >
                                                {tr("integrations.theirTerms")}
                                            </a>
                                        </>
                                    )}
                                </span>
                            </label>
                        )}

                        {error && (
                            <p className="text-[12px] text-[#C62828] bg-[#FCE8E8] rounded-[4px] px-3 py-2">{error}</p>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                            <button
                                onClick={() => (editing ? setEditing(false) : router.push("/enterprise/integrations"))}
                                className="h-9 px-4 rounded-[4px] border border-[#E0E0E0] bg-white text-[12.5px] font-semibold text-[#424242] hover:border-[#1976D2]/50 transition-colors"
                            >
                                {tr("integrations.cancel")}
                            </button>
                            <button
                                onClick={() => void connect()}
                                disabled={!canSubmit}
                                className="h-9 px-4 rounded-[4px] bg-[#1976D2] text-white text-[12.5px] font-bold hover:bg-[#1565C0] transition-colors disabled:opacity-40"
                            >
                                {busy
                                    ? tr("integrations.connecting")
                                    : editing
                                      ? tr("integrations.saveChanges")
                                      : tr("integrations.integrate")}
                            </button>
                            {!canEdit && (
                                <span className="text-[11.5px] text-[#757575]">{tr("integrations.noPermission")}</span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
