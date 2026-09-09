"use client";

/**
 * Duplicate detection — candidates that look like the same person.
 *
 * Two rules, kept visually apart because they carry very different confidence. A shared email
 * is effectively proof. A shared name is a prompt to go and look — there is more than one
 * David Smith — so those groups are toned as a suggestion rather than a finding, and merging
 * one is a decision the reader makes, not a button that implies certainty.
 *
 * Merging moves applications onto the kept candidate and archives the others rather than
 * destroying them, so a wrong call is recoverable from the Archive screen next door.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Badge, Button, EmptyState, Icon, PageHeader } from "@/components/ds";

interface Person {
    id: string; full_name?: string | null; email?: string | null;
    source_platform?: string | null; applications: number; created_at?: string | null;
}
interface Group { key: string; match: "email" | "name"; count: number; candidates: Person[] }

export default function DuplicatesPage() {
    const { t: tr } = useI18n();
    const { token, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [byEmail, setByEmail] = useState<Group[]>([]);
    const [byName, setByName] = useState<Group[]>([]);
    const [keep, setKeep] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState("");
    const [error, setError] = useState("");
    const [toast, setToast] = useState("");

    const say = (m: string) => { setToast(m); window.setTimeout(() => setToast(""), 3600); };

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/administration/duplicates`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const body = await res.json();
            if (!res.ok) { setError(typeof body.detail === "string" ? body.detail : tr("admin.dupFailed")); return; }
            setByEmail(body.by_email || []);
            setByName(body.by_name || []);
        } catch {
            setError(tr("admin.dupFailed"));
        } finally {
            setLoading(false);
        }
    }, [token, tr]);

    useEffect(() => { if (!authLoading && token) void load(); }, [authLoading, token, load]);

    const merge = async (g: Group) => {
        const keepId = keep[g.key] || g.candidates[0]?.id;
        const others = g.candidates.filter((c) => c.id !== keepId).map((c) => c.id);
        if (!keepId || others.length === 0) return;
        setBusy(g.key);
        try {
            const p = new URLSearchParams({ keep_id: keepId });
            others.forEach((id) => p.append("merge_ids", id));
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/administration/duplicates/merge?${p}`, {
                method: "POST", headers: { Authorization: `Bearer ${token}` },
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) { say(typeof body.detail === "string" ? body.detail : tr("admin.mergeFailed")); return; }
            say(tr("admin.merged", { moved: body.applications_moved ?? 0, archived: body.archived ?? 0 }));
            void load();
        } finally { setBusy(""); }
    };

    const renderGroup = (g: Group) => {
        const keepId = keep[g.key] || g.candidates[0]?.id;
        return (
            <div key={`${g.match}:${g.key}`} className="bg-white border border-[#E0E0E0] rounded-[4px] overflow-hidden">
                <header className="px-4 py-2.5 bg-[#F5F6F8] border-b border-[#E0E0E0] flex items-center gap-2 flex-wrap">
                    <Icon name={g.match === "email" ? "email" : "account"} className="text-[17px] text-[#757575]" />
                    <span className="text-[13px] font-medium text-[#212121]">{g.key}</span>
                    <Badge tone={g.match === "email" ? "danger" : "warning"}>
                        {g.match === "email" ? tr("admin.sameEmail") : tr("admin.sameName")}
                    </Badge>
                    <span className="text-[12px] text-[#757575] ml-auto tabular-nums">
                        {tr("admin.nRecords", { count: g.count })}
                    </span>
                </header>
                <div className="divide-y divide-[#EEEEEE]">
                    {g.candidates.map((c) => (
                        <label key={c.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-[#FAFAFA] cursor-pointer">
                            <input type="radio" name={`keep-${g.key}`} checked={keepId === c.id}
                                   onChange={() => setKeep((k) => ({ ...k, [g.key]: c.id }))}
                                   className="accent-[#1976D2]" />
                            <span className="min-w-0 flex-1">
                                <span className="block text-[13px] text-[#212121] truncate">{c.full_name || tr("admin.unnamed")}</span>
                                <span className="block text-[12px] text-[#757575] truncate">
                                    {c.email || tr("admin.noEmail")}
                                    {c.source_platform && ` · ${c.source_platform}`}
                                    {c.created_at && ` · ${tr("admin.addedOn", { date: c.created_at.slice(0, 10) })}`}
                                </span>
                            </span>
                            {/* The record with applications is usually the one to keep, so the count is
                                on the row where the decision is made. */}
                            <span className="text-[12px] text-[#616161] tabular-nums shrink-0">
                                {tr("admin.nApplications", { count: c.applications })}
                            </span>
                        </label>
                    ))}
                </div>
                <div className="px-4 py-2.5 border-t border-[#E0E0E0] flex items-center gap-3 flex-wrap">
                    <span className="text-[11.5px] text-[#757575] flex-1 min-w-[220px]">{tr("admin.mergeHint")}</span>
                    <Button size="sm" icon="call-merge" disabled={busy === g.key} onClick={() => void merge(g)}>
                        {busy === g.key ? tr("admin.merging") : tr("admin.mergeInto")}
                    </Button>
                </div>
            </div>
        );
    };

    const nothing = !loading && byEmail.length === 0 && byName.length === 0;

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-6">
                <PageHeader
                    title={tr("admin.dupTitle")}
                    subtitle={tr("admin.dupSubtitle")}
                    onBack={() => router.push("/enterprise/administration/features")}
                    actions={<Button size="sm" variant="secondary" icon="refresh" onClick={() => void load()} disabled={loading}>{tr("admin.refresh")}</Button>}
                />
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                {error && <p className="mb-3 text-[12.5px] text-[#C62828] bg-[#FFEBEE] rounded-[4px] px-3 py-2">{error}</p>}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-6 h-6 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                    </div>
                ) : nothing ? (
                    <div className="bg-white border border-[#E0E0E0] rounded-[4px]">
                        <EmptyState icon="account-multiple-check" tone="muted" title={tr("admin.noDup")} description={tr("admin.noDupDesc")} />
                    </div>
                ) : (
                    <div className="flex flex-col gap-5 max-w-[900px]">
                        {byEmail.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <h2 className="text-[13px] font-medium text-[#212121]">
                                    {tr("admin.emailMatches", { count: byEmail.length })}
                                </h2>
                                <p className="text-[12px] text-[#757575] -mt-2">{tr("admin.emailMatchesNote")}</p>
                                {byEmail.map(renderGroup)}
                            </div>
                        )}
                        {byName.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <h2 className="text-[13px] font-medium text-[#212121]">
                                    {tr("admin.nameMatches", { count: byName.length })}
                                </h2>
                                {/* Said before the list, not after: there is more than one David Smith. */}
                                <p className="text-[12px] text-[#EF6C00] -mt-2">{tr("admin.nameMatchesNote")}</p>
                                {byName.map(renderGroup)}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[220] px-4 py-2.5 rounded-[4px] bg-[#212121] text-white text-[12.5px] font-medium shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                    {toast}
                </div>
            )}
        </div>
    );
}
