"use client";

/**
 * Guests — outside people who can see some of your jobs, and nothing else.
 *
 * The form is Manatal's, field for field: full name, display name, email, department, access
 * level ("Share all department jobs" / "Only share specific jobs"), phone, location, description.
 *
 * Two things this screen does that a plain CRUD list would not:
 *
 *   * It states, on the page, exactly what a guest can see. Anyone about to send an outsider a
 *     link needs that in front of them, not in a help article.
 *   * The invite link is shown once, on create and on re-invite, and never in the list. A list
 *     that rendered every token would put working credentials into every screenshot of it.
 */

import { useCallback, useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Badge, Button, EmptyState, Icon, PageHeader, cn } from "@/components/ds";
import { useAutoFocus } from "@/hooks/useAutoFocus";

type Access = "all_department_jobs" | "specific_jobs";

interface JobOpt { id: string; title: string; department: string | null; location?: string | null }
interface Guest {
    id: string;
    full_name: string;
    display_name: string;
    email: string;
    phone: string | null;
    location: string | null;
    description: string | null;
    department: string | null;
    access_level: Access;
    status: "invited" | "active" | "revoked";
    jobs: { id: string; title: string }[];
    job_count: number;
    last_seen_at: string | null;
    invite_token?: string;
}

const CONTROL =
    "h-9 px-3 rounded-[4px] border border-[#E0E0E0] bg-white text-[13px] text-[#212121] outline-none focus:border-[#1976D2]";

const linkFor = (token: string) =>
    `${typeof window === "undefined" ? "" : window.location.origin}/guest/${token}`;

export default function GuestsPage() {
    const { t } = useI18n();
    const { token, isLoading: authLoading } = useAuth();

    const [guests, setGuests] = useState<Guest[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [jobs, setJobs] = useState<JobOpt[]>([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [status, setStatus] = useState<"" | "invited" | "active" | "revoked">("");
    const [editing, setEditing] = useState<Guest | null>(null);
    const [creating, setCreating] = useState(false);
    const [showLink, setShowLink] = useState<{ name: string; link: string } | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Guest | null>(null);
    const [toast, setToast] = useState("");

    const say = (m: string) => { setToast(m); window.setTimeout(() => setToast(""), 3200); };

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const p = new URLSearchParams();
            if (q.trim()) p.set("q", q.trim());
            if (status) p.set("status", status);
            const [g, s] = await Promise.all([
                fetch(`${BACKEND_URL}/api/v1/enterprise/guests?${p}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${BACKEND_URL}/api/v1/enterprise/guests/scope-options`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            if (g.ok) setGuests((await g.json()).results || []);
            if (s.ok) {
                const d = await s.json();
                setDepartments(d.departments || []);
                setJobs(d.jobs || []);
            }
        } finally {
            setLoading(false);
        }
    }, [token, q, status]);

    useEffect(() => { if (!authLoading && token) void load(); }, [authLoading, token, load]);

    const act = async (g: Guest, action: "revoke" | "reinvite") => {
        const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/guests/${g.id}/${action}`, {
            method: "POST", headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { say(t("guests.actionFailed")); return; }
        const body = await res.json();
        if (action === "reinvite" && body.invite_token) {
            setShowLink({ name: g.display_name, link: linkFor(body.invite_token) });
        } else {
            say(t("guests.revoked", { name: g.display_name }));
        }
        void load();
    };

    const remove = async (g: Guest) => {
        const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/guests/${g.id}`, {
            method: "DELETE", headers: { Authorization: `Bearer ${token}` },
        });
        setConfirmDelete(null);
        if (res.ok) { say(t("guests.deleted", { name: g.display_name })); void load(); }
        else say(t("guests.actionFailed"));
    };

    const scopeLabel = (g: Guest) =>
        g.access_level === "all_department_jobs"
            ? t("guests.allIn", { department: g.department || "—" })
            : t("guests.nJobs", { count: g.job_count });

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-6">
                <PageHeader
                    title={t("guests.title")}
                    subtitle={t("guests.subtitle")}
                    actions={<Button size="sm" icon="plus" onClick={() => setCreating(true)}>{t("guests.create")}</Button>}
                />
            </div>

            <div className="flex-1 flex flex-col min-h-0 px-6 py-4">
                <div className="mb-3 flex items-center gap-2.5 flex-wrap">
                    <input className={cn(CONTROL, "w-[220px]")} value={q} placeholder={t("guests.search")}
                           onChange={(e) => setQ(e.target.value)} />
                    <select className={CONTROL} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                        <option value="">{t("guests.anyStatus")}</option>
                        <option value="invited">{t("guests.invited")}</option>
                        <option value="active">{t("guests.active")}</option>
                        <option value="revoked">{t("guests.revokedTag")}</option>
                    </select>
                    <span className="ml-auto text-[12.5px] text-[#616161] tabular-nums">
                        {t("guests.count", { count: guests.length })}
                    </span>
                </div>

                <div className="flex-1 min-h-0 bg-white border border-[#E0E0E0] rounded-[4px] flex flex-col overflow-hidden">
                    {loading ? (
                        <div className="flex-1 flex justify-center items-center py-20">
                            <div className="w-6 h-6 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                        </div>
                    ) : guests.length === 0 ? (
                        <EmptyState
                            icon="account-eye"
                            title={t("guests.empty")}
                            description={t("guests.emptyDesc")}
                            action={<Button size="sm" icon="plus" onClick={() => setCreating(true)}>{t("guests.create")}</Button>}
                            className="flex-1"
                        />
                    ) : (
                        <div className="flex-1 overflow-auto">
                            <table className="w-full border-collapse min-w-[900px]">
                                <thead className="sticky top-0 bg-[#F5F6F8] border-b border-[#E0E0E0] z-10">
                                    <tr>
                                        {[t("guests.person"), t("guests.canSee"), t("guests.status"), t("guests.lastSeen"), ""].map((h, i) => (
                                            <th key={i} className="py-2.5 px-3 text-left text-[11px] uppercase tracking-wide text-[#757575] font-medium">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#EEEEEE]">
                                    {guests.map((g) => (
                                        <tr key={g.id} className={cn("transition-colors", g.status === "revoked" ? "bg-[#FAFAFA]" : "hover:bg-[#FAFAFA]")}>
                                            <td className="py-2.5 px-3">
                                                <span className={cn("block text-[13.5px]", g.status === "revoked" ? "text-[#9E9E9E]" : "text-[#212121]")}>
                                                    {g.display_name}
                                                </span>
                                                <span className="block text-[12px] text-[#757575]">{g.email}</span>
                                            </td>
                                            <td className="py-2.5 px-3 text-[12.5px] text-[#616161]">{scopeLabel(g)}</td>
                                            <td className="py-2.5 px-3">
                                                <Badge tone={g.status === "active" ? "success" : g.status === "revoked" ? "danger" : "warning"}>
                                                    {t(`guests.${g.status === "revoked" ? "revokedTag" : g.status}`)}
                                                </Badge>
                                            </td>
                                            <td className="py-2.5 px-3 text-[12.5px] text-[#616161] tabular-nums">
                                                {g.last_seen_at ? g.last_seen_at.slice(0, 10) : t("guests.never")}
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <span className="flex items-center justify-end gap-1">
                                                    <IconBtn icon="pencil" label={t("guests.edit")} onClick={() => setEditing(g)} />
                                                    <IconBtn icon="link-variant" label={t("guests.reinvite")} onClick={() => void act(g, "reinvite")} />
                                                    {g.status !== "revoked" && (
                                                        <IconBtn icon="link-off" label={t("guests.revoke")} onClick={() => void act(g, "revoke")} />
                                                    )}
                                                    <IconBtn icon="delete" label={t("guests.delete")} danger onClick={() => setConfirmDelete(g)} />
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="mt-3 bg-[#E3F2FD] border border-[#BBDEFB] rounded-[4px] px-3.5 py-3">
                    <p className="text-[12.5px] text-[#0D47A1] leading-relaxed">
                        <Icon name="information-outline" className="text-[15px] align-[-2px] mr-1" />
                        {t("guests.whatTheySee")}
                    </p>
                </div>
            </div>

            {(creating || editing) && (
                <GuestDialog
                    guest={editing}
                    departments={departments}
                    jobs={jobs}
                    token={token || ""}
                    t={t}
                    onClose={() => { setCreating(false); setEditing(null); }}
                    onSaved={(name, inviteToken) => {
                        setCreating(false); setEditing(null);
                        if (inviteToken) setShowLink({ name, link: linkFor(inviteToken) });
                        else say(t("guests.saved", { name }));
                        void load();
                    }}
                />
            )}

            {showLink && <LinkDialog {...showLink} t={t} onClose={() => setShowLink(null)} />}

            {confirmDelete && (
                <Confirm
                    title={t("guests.deleteTitle", { name: confirmDelete.display_name })}
                    body={t("guests.deleteBody")}
                    confirmLabel={t("guests.delete")}
                    cancelLabel={t("guests.cancel")}
                    onCancel={() => setConfirmDelete(null)}
                    onConfirm={() => void remove(confirmDelete)}
                />
            )}

            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[220] px-4 py-2.5 rounded-[4px] bg-[#212121] text-white text-[12.5px] font-medium shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                    {toast}
                </div>
            )}
        </div>
    );
}

function IconBtn({ icon, label, onClick, danger }: { icon: string; label: string; onClick: () => void; danger?: boolean }) {
    return (
        <button
            type="button" onClick={onClick} aria-label={label} title={label}
            className={cn(
                "w-8 h-8 rounded-[4px] flex items-center justify-center transition-colors",
                danger ? "text-[#9E9E9E] hover:text-[#C62828] hover:bg-[#FFEBEE]" : "text-[#9E9E9E] hover:text-[#1976D2] hover:bg-[#E3F2FD]"
            )}
        >
            <Icon name={icon} className="text-[19px]" />
        </button>
    );
}

function Shell({ title, onClose, children, wide }: {
    title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
    return (
        <div className="fixed inset-0 z-[210] flex items-center justify-center px-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/45" />
            <div
                className={cn(
                    "relative w-full bg-white rounded-[4px] border border-[#E0E0E0] shadow-[0_8px_24px_rgba(0,0,0,0.18)] max-h-[88vh] flex flex-col",
                    wide ? "max-w-[560px]" : "max-w-[460px]"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-5 h-[52px] bg-[#1976D2] text-white flex items-center justify-between shrink-0">
                    <h3 className="text-[16px] font-medium truncate">{title}</h3>
                    <button type="button" onClick={onClose} aria-label="Close"
                            className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center">
                        <Icon name="close" className="text-[20px]" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function GuestDialog({ guest, departments, jobs, token, t, onClose, onSaved }: {
    guest: Guest | null; departments: string[]; jobs: JobOpt[]; token: string;
    t: (k: string, v?: Record<string, string | number>) => string;
    onClose: () => void; onSaved: (name: string, inviteToken?: string) => void;
}) {
    const [fullName, setFullName] = useState(guest?.full_name || "");
    const [displayName, setDisplayName] = useState(guest?.display_name || "");
    const [email, setEmail] = useState(guest?.email || "");
    const [department, setDepartment] = useState(guest?.department || "");
    const [access, setAccess] = useState<Access>(guest?.access_level || "all_department_jobs");
    const [jobIds, setJobIds] = useState<string[]>(guest?.jobs.map((j) => j.id) || []);
    const [phone, setPhone] = useState(guest?.phone || "");
    const [location, setLocation] = useState(guest?.location || "");
    const [description, setDescription] = useState(guest?.description || "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const fullNameRef = useAutoFocus<HTMLInputElement>();

    const save = async () => {
        setSaving(true); setError("");
        try {
            const res = await fetch(
                `${BACKEND_URL}/api/v1/enterprise/guests${guest ? `/${guest.id}` : ""}`,
                {
                    method: guest ? "PATCH" : "POST",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({
                        full_name: fullName.trim(),
                        display_name: displayName.trim() || fullName.trim(),
                        email: email.trim(),
                        phone: phone.trim() || null,
                        location: location.trim() || null,
                        description: description.trim() || null,
                        department: access === "all_department_jobs" ? department : null,
                        access_level: access,
                        job_ids: access === "specific_jobs" ? jobIds : [],
                    }),
                }
            );
            const body = await res.json().catch(() => null);
            if (!res.ok) { setError(body?.detail || t("guests.saveFailed")); return; }
            onSaved(body?.display_name || fullName.trim(), body?.invite_token);
        } finally { setSaving(false); }
    };

    const ready =
        fullName.trim() && email.trim() &&
        (access === "all_department_jobs" ? !!department : jobIds.length > 0);

    return (
        <Shell title={guest ? t("guests.editTitle") : t("guests.createTitle")} onClose={onClose} wide>
            <div className="p-5 flex flex-col gap-3 overflow-y-auto">
                <p className="text-[12.5px] text-[#616161] leading-relaxed">{t("guests.dialogHint")}</p>

                <label className="flex flex-col gap-1">
                    <span className="text-[12px] text-[#616161]">{t("guests.fullName")}</span>
                    <input className={CONTROL} value={fullName} maxLength={255} ref={fullNameRef}
                           onChange={(e) => setFullName(e.target.value)} />
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-[12px] text-[#616161]">{t("guests.displayName")}</span>
                    <input className={CONTROL} value={displayName} maxLength={255}
                           placeholder={fullName || t("guests.displayPlaceholder")}
                           onChange={(e) => setDisplayName(e.target.value)} />
                    <span className="text-[11.5px] text-[#9E9E9E]">{t("guests.displayHint")}</span>
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-[12px] text-[#616161]">{t("guests.email")}</span>
                    <input className={CONTROL} value={email} type="email" maxLength={254}
                           onChange={(e) => setEmail(e.target.value)} />
                </label>

                <label className="flex flex-col gap-1">
                    <span className="text-[12px] text-[#616161]">{t("guests.accessLevel")}</span>
                    <select className={CONTROL} value={access} onChange={(e) => setAccess(e.target.value as Access)}>
                        <option value="all_department_jobs">{t("guests.accessAll")}</option>
                        <option value="specific_jobs">{t("guests.accessSpecific")}</option>
                    </select>
                </label>

                {access === "all_department_jobs" ? (
                    <label className="flex flex-col gap-1">
                        <span className="text-[12px] text-[#616161]">{t("guests.department")}</span>
                        {departments.length === 0 ? (
                            <p className="text-[12.5px] text-[#EF6C00] bg-[#FFF3E0] border border-[#FFE0B2] rounded-[4px] px-3 py-2">
                                {t("guests.noDepartments")}
                            </p>
                        ) : (
                            <select className={CONTROL} value={department} onChange={(e) => setDepartment(e.target.value)}>
                                <option value="">{t("guests.pickDepartment")}</option>
                                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        )}
                    </label>
                ) : (
                    <div className="flex flex-col gap-1">
                        <span className="text-[12px] text-[#616161]">{t("guests.pickJobs", { count: jobIds.length })}</span>
                        <div className="border border-[#E0E0E0] rounded-[4px] max-h-[180px] overflow-y-auto divide-y divide-[#EEEEEE]">
                            {jobs.length === 0 ? (
                                <p className="px-3 py-4 text-[12.5px] text-[#9E9E9E]">{t("guests.noJobs")}</p>
                            ) : jobs.map((j) => (
                                <label key={j.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[#FAFAFA]">
                                    <input type="checkbox" className="accent-[#1976D2]" checked={jobIds.includes(j.id)}
                                           onChange={() => setJobIds((s) => s.includes(j.id) ? s.filter((x) => x !== j.id) : [...s, j.id])} />
                                    <span className="min-w-0">
                                        <span className="block text-[13px] text-[#212121] truncate">{j.title}</span>
                                        <span className="block text-[11.5px] text-[#757575] truncate">
                                            {[j.department, j.location].filter(Boolean).join(" · ") || "—"}
                                        </span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                        <span className="text-[12px] text-[#616161]">{t("guests.phone")}</span>
                        <input className={CONTROL} value={phone} maxLength={50} onChange={(e) => setPhone(e.target.value)} />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[12px] text-[#616161]">{t("guests.location")}</span>
                        <input className={CONTROL} value={location} maxLength={255} onChange={(e) => setLocation(e.target.value)} />
                    </label>
                </div>
                <label className="flex flex-col gap-1">
                    <span className="text-[12px] text-[#616161]">{t("guests.description")}</span>
                    <textarea className={cn(CONTROL, "h-16 py-2 resize-none")} value={description}
                              onChange={(e) => setDescription(e.target.value)} />
                </label>

                {error && <p className="text-[12.5px] text-[#C62828]">{error}</p>}

                <div className="flex justify-end gap-2 pt-1">
                    <Button size="sm" variant="ghost" onClick={onClose}>{t("guests.cancel")}</Button>
                    <Button size="sm" icon="check" disabled={saving || !ready} onClick={() => void save()}>
                        {saving ? t("guests.saving") : guest ? t("guests.save") : t("guests.createAndLink")}
                    </Button>
                </div>
            </div>
        </Shell>
    );
}

function LinkDialog({ name, link, t, onClose }: {
    name: string; link: string;
    t: (k: string, v?: Record<string, string | number>) => string;
    onClose: () => void;
}) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch { /* a browser that blocks the clipboard still shows the link to select by hand */ }
    };
    return (
        <Shell title={t("guests.linkTitle", { name })} onClose={onClose}>
            <div className="p-5 flex flex-col gap-3">
                <p className="text-[13px] text-[#616161] leading-relaxed">{t("guests.linkHint")}</p>
                <div className="flex gap-2">
                    <input readOnly value={link} onFocus={(e) => e.currentTarget.select()}
                           className={cn(CONTROL, "flex-1 font-mono text-[12px]")} />
                    <Button size="sm" icon={copied ? "check" : "content-copy"} onClick={() => void copy()}>
                        {copied ? t("guests.copied") : t("guests.copy")}
                    </Button>
                </div>
                <p className="text-[11.5px] text-[#EF6C00] leading-relaxed">{t("guests.linkWarning")}</p>
                <div className="flex justify-end pt-1">
                    <Button size="sm" onClick={onClose}>{t("guests.done")}</Button>
                </div>
            </div>
        </Shell>
    );
}

function Confirm({ title, body, confirmLabel, cancelLabel, onCancel, onConfirm }: {
    title: string; body: string; confirmLabel: string; cancelLabel: string;
    onCancel: () => void; onConfirm: () => void;
}) {
    return (
        <div className="fixed inset-0 z-[215] flex items-center justify-center px-4" onClick={onCancel}>
            <div className="absolute inset-0 bg-black/45" />
            <div className="relative w-full max-w-[400px] bg-white rounded-[4px] border border-[#E0E0E0] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
                 onClick={(e) => e.stopPropagation()}>
                <h3 className="text-[15px] font-medium text-[#212121]">{title}</h3>
                <p className="text-[13px] text-[#616161] mt-1.5 leading-relaxed">{body}</p>
                <div className="flex justify-end gap-2 mt-4">
                    <Button size="sm" variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
                    <Button size="sm" variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
                </div>
            </div>
        </div>
    );
}
