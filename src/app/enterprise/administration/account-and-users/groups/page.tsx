"use client";

/**
 * Groups — arrange users into teams, and grant roles to the whole team at once.
 *
 * Manatal's table is NAME | GROUP MEMBERS | GROUP DESCRIPTION with add-members, edit and delete
 * on each row. Kept, plus one column they do not have: what the group GRANTS. A group that only
 * lists names is a label; the reason to build one is that giving eight people a role should be
 * one action, and the screen has to show that it did.
 *
 * The grant is additive and the page says so out loud, because "did removing them from this
 * group take away something they had directly?" is the first question anyone asks, and the
 * answer is always no.
 */

import { useCallback, useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Badge, Button, EmptyState, Icon, PageHeader, cn } from "@/components/ds";

interface Member { id: string; name: string; email: string; is_active: boolean }
interface RoleOpt { id: string; name: string; description?: string | null; is_system: boolean }
interface Group {
    id: string;
    name: string;
    description: string | null;
    colour: string;
    members: Member[];
    member_count: number;
    roles: { id: string; name: string }[];
}

const CONTROL =
    "h-9 px-3 rounded-[4px] border border-[#E0E0E0] bg-white text-[13px] text-[#212121] outline-none focus:border-[#1976D2]";

const initials = (name: string) =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";

function Chip({ name, colour, size = 28 }: { name: string; colour: string; size?: number }) {
    return (
        <span
            className="rounded-full flex items-center justify-center text-white font-medium shrink-0"
            style={{ background: colour, width: size, height: size, fontSize: size * 0.4 }}
            title={name}
        >
            {initials(name)}
        </span>
    );
}

export default function GroupsPage() {
    const { t } = useI18n();
    const { token, isLoading: authLoading } = useAuth();

    const [groups, setGroups] = useState<Group[]>([]);
    const [users, setUsers] = useState<Member[]>([]);
    const [roles, setRoles] = useState<RoleOpt[]>([]);
    const [colours, setColours] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [editing, setEditing] = useState<Group | null>(null);
    const [creating, setCreating] = useState(false);
    const [scoping, setScoping] = useState<Group | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Group | null>(null);
    const [toast, setToast] = useState("");

    const say = (m: string) => { setToast(m); window.setTimeout(() => setToast(""), 3200); };

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const p = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
            const [g, a] = await Promise.all([
                fetch(`${BACKEND_URL}/api/v1/enterprise/user-groups${p}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${BACKEND_URL}/api/v1/enterprise/user-groups/assignable`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            if (g.ok) setGroups((await g.json()).results || []);
            if (a.ok) {
                const d = await a.json();
                setUsers(d.users || []);
                setRoles(d.roles || []);
                setColours(d.colours || []);
            }
        } finally {
            setLoading(false);
        }
    }, [token, q]);

    useEffect(() => { if (!authLoading && token) void load(); }, [authLoading, token, load]);

    const remove = async (g: Group) => {
        const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/user-groups/${g.id}`, {
            method: "DELETE", headers: { Authorization: `Bearer ${token}` },
        });
        setConfirmDelete(null);
        if (res.ok) { say(t("groups.deleted", { name: g.name })); void load(); }
        else say(t("groups.deleteFailed"));
    };

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-6">
                <PageHeader
                    title={t("groups.title")}
                    subtitle={t("groups.subtitle")}
                    actions={<Button size="sm" icon="plus" onClick={() => setCreating(true)}>{t("groups.create")}</Button>}
                />
            </div>

            <div className="flex-1 flex flex-col min-h-0 px-6 py-4">
                <div className="mb-3 flex items-center gap-3">
                    <input className={cn(CONTROL, "w-[240px]")} value={q} placeholder={t("groups.search")}
                           onChange={(e) => setQ(e.target.value)} />
                    <span className="ml-auto text-[12.5px] text-[#616161] tabular-nums">
                        {t("groups.count", { count: groups.length })}
                    </span>
                </div>

                <div className="flex-1 min-h-0 bg-white border border-[#E0E0E0] rounded-[4px] flex flex-col overflow-hidden">
                    {loading ? (
                        <div className="flex-1 flex justify-center items-center py-20">
                            <div className="w-6 h-6 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                        </div>
                    ) : groups.length === 0 ? (
                        <EmptyState
                            icon="account-group"
                            title={t("groups.empty")}
                            description={t("groups.emptyDesc")}
                            action={<Button size="sm" icon="plus" onClick={() => setCreating(true)}>{t("groups.create")}</Button>}
                            className="flex-1"
                        />
                    ) : (
                        <div className="flex-1 overflow-auto">
                            <table className="w-full border-collapse min-w-[880px]">
                                <thead className="sticky top-0 bg-[#F5F6F8] border-b border-[#E0E0E0] z-10">
                                    <tr>
                                        {[t("groups.name"), t("groups.members"), t("groups.grants"), t("groups.description"), ""].map((h, i) => (
                                            <th key={i} className="py-2.5 px-3 text-left text-[11px] uppercase tracking-wide text-[#757575] font-medium">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#EEEEEE]">
                                    {groups.map((g) => (
                                        <tr key={g.id} className="hover:bg-[#FAFAFA] transition-colors align-top">
                                            <td className="py-3 px-3">
                                                <span className="flex items-center gap-2.5">
                                                    <Chip name={g.name} colour={g.colour} />
                                                    <span className="text-[13.5px] text-[#212121]">{g.name}</span>
                                                </span>
                                            </td>
                                            <td className="py-3 px-3">
                                                {g.members.length === 0 ? (
                                                    <span className="text-[12.5px] text-[#9E9E9E]">{t("groups.noMembers")}</span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 flex-wrap">
                                                        {g.members.slice(0, 5).map((m) => (
                                                            <Chip key={m.id} name={m.name} colour="#90A4AE" size={24} />
                                                        ))}
                                                        <span className="text-[12.5px] text-[#616161] ml-0.5">
                                                            {g.member_count > 5
                                                                ? t("groups.plusMore", { count: g.member_count - 5 })
                                                                : t("groups.nPeople", { count: g.member_count })}
                                                        </span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-3">
                                                {g.roles.length === 0 ? (
                                                    <span className="text-[12.5px] text-[#9E9E9E]">{t("groups.noGrants")}</span>
                                                ) : (
                                                    <span className="flex flex-wrap gap-1">
                                                        {g.roles.map((r) => <Badge key={r.id} tone="info">{r.name}</Badge>)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-3 text-[12.5px] text-[#616161] max-w-[240px]">
                                                {g.description || "—"}
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="flex items-center justify-end gap-1">
                                                    <IconBtn icon="account-multiple-plus" label={t("groups.manage")} onClick={() => setScoping(g)} />
                                                    <IconBtn icon="pencil" label={t("groups.edit")} onClick={() => setEditing(g)} />
                                                    <IconBtn icon="delete" label={t("groups.delete")} danger onClick={() => setConfirmDelete(g)} />
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <p className="text-[11.5px] text-[#757575] mt-3 leading-relaxed">{t("groups.note")}</p>
            </div>

            {(creating || editing) && (
                <GroupDialog
                    group={editing}
                    colours={colours}
                    token={token || ""}
                    t={t}
                    onClose={() => { setCreating(false); setEditing(null); }}
                    onSaved={(name) => {
                        setCreating(false); setEditing(null);
                        say(t("groups.saved", { name })); void load();
                    }}
                />
            )}

            {scoping && (
                <MembersDialog
                    group={scoping}
                    users={users}
                    roles={roles}
                    token={token || ""}
                    t={t}
                    onClose={() => setScoping(null)}
                    onSaved={() => { setScoping(null); say(t("groups.membersSaved")); void load(); }}
                />
            )}

            {confirmDelete && (
                <Confirm
                    title={t("groups.deleteTitle", { name: confirmDelete.name })}
                    body={t("groups.deleteBody")}
                    confirmLabel={t("groups.delete")}
                    cancelLabel={t("groups.cancel")}
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
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
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
                    "relative w-full bg-white rounded-[4px] border border-[#E0E0E0] shadow-[0_8px_24px_rgba(0,0,0,0.18)] max-h-[86vh] flex flex-col",
                    wide ? "max-w-[620px]" : "max-w-[480px]"
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

function GroupDialog({ group, colours, token, t, onClose, onSaved }: {
    group: Group | null; colours: string[]; token: string;
    t: (k: string, v?: Record<string, string | number>) => string;
    onClose: () => void; onSaved: (name: string) => void;
}) {
    const [name, setName] = useState(group?.name || "");
    const [description, setDescription] = useState(group?.description || "");
    const [colour, setColour] = useState(group?.colour || colours[0] || "#1976D2");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const save = async () => {
        setSaving(true); setError("");
        try {
            const res = await fetch(
                `${BACKEND_URL}/api/v1/enterprise/user-groups${group ? `/${group.id}` : ""}`,
                {
                    method: group ? "PATCH" : "POST",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ name: name.trim(), description: description.trim() || null, colour }),
                }
            );
            const body = await res.json().catch(() => null);
            if (!res.ok) { setError(body?.detail || t("groups.saveFailed")); return; }
            onSaved(name.trim());
        } finally { setSaving(false); }
    };

    return (
        <Shell title={group ? t("groups.editTitle") : t("groups.createTitle")} onClose={onClose}>
            <div className="p-5 flex flex-col gap-3.5 overflow-y-auto">
                <p className="text-[12.5px] text-[#616161] leading-relaxed">{t("groups.dialogHint")}</p>

                <div className="flex items-center gap-3">
                    <Chip name={name || "?"} colour={colour} size={44} />
                    <span className="flex flex-wrap gap-1.5">
                        {colours.map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setColour(c)}
                                aria-label={c}
                                className={cn(
                                    "w-6 h-6 rounded-full border-2 transition-transform",
                                    colour === c ? "border-[#212121] scale-110" : "border-transparent"
                                )}
                                style={{ background: c }}
                            />
                        ))}
                    </span>
                </div>

                <label className="flex flex-col gap-1">
                    <span className="text-[12px] text-[#616161]">{t("groups.nameLabel")}</span>
                    <input className={CONTROL} value={name} maxLength={120} autoFocus
                           placeholder={t("groups.namePlaceholder")} onChange={(e) => setName(e.target.value)} />
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-[12px] text-[#616161]">{t("groups.descriptionLabel")}</span>
                    <textarea className={cn(CONTROL, "h-20 py-2 resize-none")} value={description} maxLength={255}
                              placeholder={t("groups.descriptionPlaceholder")}
                              onChange={(e) => setDescription(e.target.value)} />
                </label>

                {error && <p className="text-[12.5px] text-[#C62828]">{error}</p>}

                <div className="flex justify-end gap-2 pt-1">
                    <Button size="sm" variant="ghost" onClick={onClose}>{t("groups.cancel")}</Button>
                    <Button size="sm" icon="check" disabled={saving || !name.trim()} onClick={() => void save()}>
                        {saving ? t("groups.saving") : t("groups.save")}
                    </Button>
                </div>
            </div>
        </Shell>
    );
}

function MembersDialog({ group, users, roles, token, t, onClose, onSaved }: {
    group: Group; users: Member[]; roles: RoleOpt[]; token: string;
    t: (k: string, v?: Record<string, string | number>) => string;
    onClose: () => void; onSaved: () => void;
}) {
    const [memberIds, setMemberIds] = useState<string[]>(group.members.map((m) => m.id));
    const [roleIds, setRoleIds] = useState<string[]>(group.roles.map((r) => r.id));
    const [filter, setFilter] = useState("");
    const [saving, setSaving] = useState(false);

    const toggle = (set: string[], id: string) => (set.includes(id) ? set.filter((x) => x !== id) : [...set, id]);

    const save = async () => {
        setSaving(true);
        try {
            // Two calls rather than one: members and grants are separate concerns, and the API
            // takes the complete set for each so re-sending is idempotent.
            const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
            await fetch(`${BACKEND_URL}/api/v1/enterprise/user-groups/${group.id}/members`, {
                method: "PUT", headers, body: JSON.stringify({ user_ids: memberIds }),
            });
            await fetch(`${BACKEND_URL}/api/v1/enterprise/user-groups/${group.id}/roles`, {
                method: "PUT", headers, body: JSON.stringify({ role_ids: roleIds }),
            });
            onSaved();
        } finally { setSaving(false); }
    };

    const shown = users.filter(
        (u) => !filter.trim() ||
            u.name.toLowerCase().includes(filter.toLowerCase()) ||
            u.email.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <Shell title={group.name} onClose={onClose} wide>
            <div className="p-5 flex flex-col gap-4 overflow-y-auto">
                <section className="flex flex-col gap-2">
                    <h4 className="text-[13.5px] font-medium text-[#212121]">
                        {t("groups.membersTitle", { count: memberIds.length })}
                    </h4>
                    <input className={CONTROL} value={filter} placeholder={t("groups.filterPeople")}
                           onChange={(e) => setFilter(e.target.value)} />
                    <div className="border border-[#E0E0E0] rounded-[4px] max-h-[200px] overflow-y-auto divide-y divide-[#EEEEEE]">
                        {shown.length === 0 ? (
                            <p className="px-3 py-4 text-[12.5px] text-[#9E9E9E]">{t("groups.noPeople")}</p>
                        ) : shown.map((u) => (
                            <label key={u.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[#FAFAFA]">
                                <input type="checkbox" className="accent-[#1976D2]" checked={memberIds.includes(u.id)}
                                       onChange={() => setMemberIds((s) => toggle(s, u.id))} />
                                <Chip name={u.name} colour="#90A4AE" size={24} />
                                <span className="min-w-0">
                                    <span className="block text-[13px] text-[#212121] truncate">{u.name}</span>
                                    <span className="block text-[11.5px] text-[#757575] truncate">{u.email}</span>
                                </span>
                                {!u.is_active && <Badge tone="neutral" className="ml-auto">{t("groups.inactive")}</Badge>}
                            </label>
                        ))}
                    </div>
                </section>

                <section className="flex flex-col gap-2">
                    <h4 className="text-[13.5px] font-medium text-[#212121]">
                        {t("groups.grantsTitle", { count: roleIds.length })}
                    </h4>
                    <p className="text-[12px] text-[#616161] leading-relaxed">{t("groups.grantsHint")}</p>
                    <div className="border border-[#E0E0E0] rounded-[4px] max-h-[180px] overflow-y-auto divide-y divide-[#EEEEEE]">
                        {roles.map((r) => (
                            <label key={r.id} className="flex items-start gap-2.5 px-3 py-2 cursor-pointer hover:bg-[#FAFAFA]">
                                <input type="checkbox" className="mt-0.5 accent-[#1976D2]" checked={roleIds.includes(r.id)}
                                       onChange={() => setRoleIds((s) => toggle(s, r.id))} />
                                <span className="min-w-0">
                                    <span className="block text-[13px] text-[#212121]">{r.name}</span>
                                    {r.description && (
                                        <span className="block text-[11.5px] text-[#757575]">{r.description}</span>
                                    )}
                                </span>
                            </label>
                        ))}
                    </div>
                </section>

                <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={onClose}>{t("groups.cancel")}</Button>
                    <Button size="sm" icon="check" disabled={saving} onClick={() => void save()}>
                        {saving ? t("groups.saving") : t("groups.save")}
                    </Button>
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
