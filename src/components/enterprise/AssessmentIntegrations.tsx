"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { BACKEND_URL } from "@/utils/api";
import { Button, Card, Input, cn } from "@/components/ds";

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
    docs_url?: string | null;
    capabilities: string[];
    limitations: string[];
    fields: Field[];
    connected: boolean;
    connection?: { display_name?: string; invite_url?: string | null } | null;
}

interface BoardRow {
    key: string;
    name: string;
    summary: string;
    requires_credentials: boolean;
    docs_url?: string | null;
    manage_url: string;
}

const CATEGORY_META: Record<string, { icon: string; chip: string }> = {
    assessment: { icon: "quiz", chip: "bg-[#ECEBFB] text-[#5B53E0]" },
    job_board: { icon: "campaign", chip: "bg-[#FEF3E2] text-[#B45309]" },
    meeting: { icon: "co_present", chip: "bg-[#E7ECFB] text-[#3559C7]" },
    email: { icon: "forward_to_inbox", chip: "bg-[#E3F4EF] text-[#0E8A6E]" },
};

/**
 * The assessment-tool section of the Integrations page.
 *
 * Assessment tools previously had nowhere to live, so the round builder asked the recruiter to
 * paste the same invite URL onto every round that needed it. This mounts inside the existing
 * Integrations screen — a second integrations page would have been the very scattering it is
 * meant to fix.
 *
 * Each card states what connecting actually does, and what it does not, rather than implying a
 * two-way sync that is not there.
 */
export default function AssessmentIntegrations() {
    const { token } = useAuth();
    const { t: tr } = useI18n();
    const [items, setItems] = useState<Integration[]>([]);
    const [boards, setBoards] = useState<BoardRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openFor, setOpenFor] = useState<string | null>(null);
    const [draft, setDraft] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/integrations/catalog`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(String(res.status));
            const data = await res.json();
            setItems(data.integrations || []);
            setBoards(data.job_boards || []);
        } catch {
            setError(tr("integrations.loadFailed"));
        } finally {
            setIsLoading(false);
        }
    }, [token, tr]);

    useEffect(() => {
        void load();
    }, [load]);

    const connect = async (it: Integration) => {
        const missing = it.fields.filter(f => f.required && !(draft[f.name] || "").trim());
        if (missing.length) {
            setError(tr("integrations.missingFields", { fields: missing.map(f => f.label).join(", ") }));
            return;
        }
        setBusy(it.key);
        setError("");
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/integrations/connections`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ integration: it.key, credentials: draft }),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => null);
                throw new Error(d?.detail || String(res.status));
            }
            setOpenFor(null);
            setDraft({});
            await load();
        } catch (e) {
            setError(e instanceof Error && e.message ? e.message : tr("integrations.assessConnectFailed"));
        } finally {
            setBusy(null);
        }
    };

    const disconnect = async (it: Integration) => {
        if (!window.confirm(tr("integrations.confirmDisconnect", { name: it.name }))) return;
        setBusy(it.key);
        try {
            const res = await fetch(
                `${BACKEND_URL}/api/v1/enterprise/integrations/connections/${it.key}`,
                { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error(String(res.status));
            await load();
        } catch {
            setError(tr("integrations.disconnectFailed"));
        } finally {
            setBusy(null);
        }
    };

    const byCategory = useMemo(() => {
        const map = new Map<string, Integration[]>();
        for (const it of items) {
            if (!map.has(it.category)) map.set(it.category, []);
            map.get(it.category)!.push(it);
        }
        return [...map.entries()];
    }, [items]);

    const connectedCount = items.filter(i => i.connected).length;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-[16px] font-bold text-[#15171C]">{tr("integrations.assessTitle")}</h2>
                <p className="text-[13px] text-[#8A929E] mt-0.5 leading-relaxed">
                    {tr("integrations.assessSubtitle", { connected: connectedCount, total: items.length })}
                </p>
            </div>

            {error && (
                <div className="rounded-[12px] border border-[#F5C6C7] bg-[#FDECEC] px-4 py-3 text-[12.5px] text-[#C0383C]">
                    {error}
                </div>
            )}

            {isLoading ? (
                <Card padding="sm">
                    <p className="py-12 text-center text-[13px] text-[#8A929E]">{tr("integrations.loading")}</p>
                </Card>
            ) : (
                <>
                    {byCategory.map(([category, list]) => {
                        const meta = CATEGORY_META[category] || CATEGORY_META.assessment;
                        return (
                            <section key={category} className="space-y-3">
                                <div className="flex items-center gap-2.5">
                                    <span className={cn("w-8 h-8 rounded-[10px] flex items-center justify-center", meta.chip)}>
                                        <span className="material-symbols-rounded text-[18px]">{meta.icon}</span>
                                    </span>
                                    <h2 className="text-[15px] font-bold text-[#15171C]">
                                        {tr(`integrations.category.${category}`)}
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {list.map(it => (
                                        <Card key={it.key} padding="sm" className={cn(it.connected && "border-[#BFE3CC]")}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="text-[13.5px] font-bold text-[#15171C]">{it.name}</h3>
                                                        {it.connected && (
                                                            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-1.5 py-0.5 rounded-[5px] bg-[#E6F4EA] text-[#15803D]">
                                                                <span className="material-symbols-rounded text-[13px]">check_circle</span>
                                                                {tr("integrations.assessConnected")}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[12px] text-[#8A929E] mt-0.5 leading-relaxed">{it.summary}</p>
                                                </div>
                                                {it.connected ? (
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        disabled={busy === it.key}
                                                        onClick={() => disconnect(it)}
                                                    >
                                                        {tr("integrations.assessDisconnect")}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        disabled={busy === it.key}
                                                        onClick={() => { setOpenFor(openFor === it.key ? null : it.key); setDraft({}); setError(""); }}
                                                    >
                                                        {tr("integrations.connect")}
                                                    </Button>
                                                )}
                                            </div>

                                            {/* What connecting actually buys, and what it does not. */}
                                            <ul className="mt-3 space-y-1">
                                                {it.capabilities.map(c => (
                                                    <li key={c} className="text-[11.5px] text-[#4B5057] leading-relaxed flex gap-1.5">
                                                        <span className="material-symbols-rounded text-[14px] text-[#15803D] shrink-0 mt-px">check</span>
                                                        {c}
                                                    </li>
                                                ))}
                                                {it.limitations.map(l => (
                                                    <li key={l} className="text-[11.5px] text-[#8A929E] leading-relaxed flex gap-1.5">
                                                        <span className="material-symbols-rounded text-[14px] text-[#B4BAC3] shrink-0 mt-px">remove</span>
                                                        {l}
                                                    </li>
                                                ))}
                                            </ul>

                                            {it.connected && it.connection?.invite_url && (
                                                <p className="mt-2.5 text-[11px] text-[#8A929E] truncate">
                                                    {tr("integrations.usingLink")}{" "}
                                                    <span className="text-[#374151]">{it.connection.invite_url}</span>
                                                </p>
                                            )}

                                            {openFor === it.key && !it.connected && (
                                                <div className="mt-3.5 pt-3.5 border-t border-[#F0F0F1] space-y-3">
                                                    {it.fields.map(f => (
                                                        <div key={f.name}>
                                                            <label
                                                                htmlFor={`${it.key}-${f.name}`}
                                                                className="block text-[11px] font-bold text-[#8A929E] uppercase tracking-wider mb-1.5"
                                                            >
                                                                {f.label} {f.required && <span className="text-rose-500">*</span>}
                                                            </label>
                                                            <Input
                                                                id={`${it.key}-${f.name}`}
                                                                type={f.type === "password" ? "password" : f.type === "url" ? "url" : "text"}
                                                                value={draft[f.name] || ""}
                                                                onChange={e => setDraft(d => ({ ...d, [f.name]: e.target.value }))}
                                                            />
                                                            {f.help && (
                                                                <p className="text-[10.5px] text-[#8A929E] mt-1 leading-relaxed">{f.help}</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <div className="flex items-center gap-2">
                                                        <Button size="sm" disabled={busy === it.key} onClick={() => connect(it)}>
                                                            {busy === it.key ? tr("integrations.connecting") : tr("integrations.save")}
                                                        </Button>
                                                        <Button size="sm" variant="secondary" onClick={() => setOpenFor(null)}>
                                                            {tr("common.cancel")}
                                                        </Button>
                                                        {it.docs_url && (
                                                            <a
                                                                href={it.docs_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-[12px] font-semibold text-[#5B53E0] hover:text-[#4840C4] ml-auto"
                                                            >
                                                                {tr("integrations.docs")}
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            </section>
                        );
                    })}

                    {/* Job boards keep their own screen because they carry publish semantics, but
                        they belong in the answer to "what are we connected to?". */}
                    {boards.length > 0 && (
                        <section className="space-y-3">
                            <div className="flex items-center gap-2.5">
                                <span className={cn("w-8 h-8 rounded-[10px] flex items-center justify-center", CATEGORY_META.job_board.chip)}>
                                    <span className="material-symbols-rounded text-[18px]">campaign</span>
                                </span>
                                <h2 className="text-[15px] font-bold text-[#15171C]">{tr("integrations.category.job_board")}</h2>
                            </div>
                            <Card padding="sm">
                                <p className="text-[12.5px] text-[#8A929E] leading-relaxed mb-3">
                                    {tr("integrations.boardsHint", { count: boards.length })}
                                </p>
                                <div className="flex flex-wrap gap-1.5 mb-3.5">
                                    {boards.slice(0, 12).map(b => (
                                        <span
                                            key={b.key}
                                            className="text-[11px] font-semibold px-2 py-1 rounded-[6px] bg-[#F7F8FA] border border-[#E8EAED] text-[#4B5057]"
                                        >
                                            {b.name}
                                        </span>
                                    ))}
                                </div>
                                <Link href="/enterprise/settings/job-portals">
                                    <Button size="sm" variant="secondary">
                                        <span className="material-symbols-rounded text-[17px]">open_in_new</span>
                                        {tr("integrations.manageBoards")}
                                    </Button>
                                </Link>
                            </Card>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}
