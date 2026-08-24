"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { BACKEND_URL } from "@/utils/api";
import { UserCog, Users, Clock, X, Check, Eye } from "lucide-react";

export interface Member {
    id: string;
    full_name: string;
    email: string;
    profile_image?: string | null;
}

interface Activity {
    id: string;
    action: string;
    actor_name?: string | null;
    detail?: Record<string, unknown> | null;
    created_at: string;
}

function initials(name?: string): string {
    if (!name) return "?";
    const p = name.trim().split(/\s+/);
    return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase() || "?";
}

function relTime(iso?: string | null): string {
    if (!iso) return "";
    const d = new Date(iso.endsWith("Z") || iso.includes("+") ? iso : iso + "Z");
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
    return d.toLocaleDateString();
}

function Avatar({ name, size = 28 }: { name?: string; size?: number }) {
    return (
        <span
            className="rounded-full bg-[#5B53E0] text-white font-bold flex items-center justify-center shrink-0"
            style={{ width: size, height: size, fontSize: size * 0.4 }}
            title={name}
        >
            {initials(name)}
        </span>
    );
}

export default function JobOwnershipPanel({
    jobId,
    owner,
    collaborators = [],
    lastViewedAt,
    onAssigned,
}: {
    jobId: string;
    owner?: Member | null;
    collaborators?: Member[];
    lastViewedAt?: string | null;
    onAssigned?: () => void;
}) {
    const { token, canAccess } = useAuth();
    const { t: tr } = useI18n();
    const canAssign = canAccess("jobs:assign");

    const [members, setMembers] = useState<Member[]>([]);
    const [activity, setActivity] = useState<Activity[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [ownerId, setOwnerId] = useState<string>(owner?.id || "");
    const [collabIds, setCollabIds] = useState<string[]>(collaborators.map((c) => c.id));
    const [saving, setSaving] = useState(false);

    const loadActivity = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${jobId}/activity`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setActivity(await res.json());
        } catch {
            /* ignore */
        }
    }, [token, jobId]);

    useEffect(() => {
        loadActivity();
    }, [loadActivity]);

    const openModal = async () => {
        setOwnerId(owner?.id || "");
        setCollabIds(collaborators.map((c) => c.id));
        setModalOpen(true);
        if (token && members.length === 0) {
            try {
                const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/team/members`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) setMembers(await res.json());
            } catch {
                /* ignore */
            }
        }
    };

    const save = async () => {
        if (!token) return;
        setSaving(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${jobId}/assign`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    owner_id: ownerId || null,
                    collaborator_ids: collabIds.filter((id) => id !== ownerId),
                }),
            });
            if (res.ok) {
                setModalOpen(false);
                onAssigned?.();
                loadActivity();
            }
        } finally {
            setSaving(false);
        }
    };

    const actionLabel = (a: Activity): string => {
        const key = "jobs.act" + a.action.charAt(0).toUpperCase() + a.action.slice(1);
        const label = tr(key);
        return label === key ? a.action : label;
    };

    const lastViewer = useMemo(
        () => activity.find((a) => a.action === "viewed")?.actor_name,
        [activity],
    );

    return (
        <div className="bg-white rounded-[16px] border border-[#E8EAED] p-5">
            {/* Ownership */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-bold text-[#15171C] flex items-center gap-1.5">
                    <UserCog className="w-4 h-4 text-[#5B53E0]" /> {tr("jobs.ownership")}
                </h3>
                {canAssign && (
                    <button
                        onClick={openModal}
                        className="text-[12px] font-semibold text-[#5B53E0] hover:underline"
                    >
                        {owner ? tr("jobs.reassign") : tr("jobs.assign")}
                    </button>
                )}
            </div>

            <div className="space-y-3">
                <div>
                    <p className="text-[10.5px] font-bold text-[#8A929E] uppercase tracking-wider mb-1.5">{tr("jobs.owner")}</p>
                    {owner ? (
                        <div className="flex items-center gap-2">
                            <Avatar name={owner.full_name} />
                            <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-[#15171C] truncate">{owner.full_name}</p>
                                <p className="text-[11px] text-[#8A929E] truncate">{owner.email}</p>
                            </div>
                        </div>
                    ) : (
                        <span className="text-[12px] font-semibold text-[#B26B08] bg-[#FBEFDC] px-2 py-0.5 rounded">{tr("jobs.unassigned")}</span>
                    )}
                </div>

                <div>
                    <p className="text-[10.5px] font-bold text-[#8A929E] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {tr("jobs.collaborators")}
                    </p>
                    {collaborators.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {collaborators.map((c) => (
                                <span key={c.id} className="inline-flex items-center gap-1.5 bg-[#F4F5F7] rounded-full pl-0.5 pr-2.5 py-0.5" title={c.email}>
                                    <Avatar name={c.full_name} size={20} />
                                    <span className="text-[11.5px] font-medium text-[#374151]">{c.full_name}</span>
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[12px] text-[#9AA3AF]">{tr("jobs.noCollaborators")}</p>
                    )}
                </div>

                {(lastViewedAt || lastViewer) && (
                    <p className="text-[11px] text-[#9AA3AF] flex items-center gap-1 pt-1 border-t border-[#F0F0F1]">
                        <Eye className="w-3 h-3" /> {tr("jobs.lastViewedBy", { name: lastViewer || "—" })} · {relTime(lastViewedAt)}
                    </p>
                )}
            </div>

            {/* Activity timeline */}
            <div className="mt-5 pt-4 border-t border-[#F0F0F1]">
                <h3 className="text-[13px] font-bold text-[#15171C] flex items-center gap-1.5 mb-3">
                    <Clock className="w-4 h-4 text-[#5B53E0]" /> {tr("jobs.activity")}
                </h3>
                {activity.length === 0 ? (
                    <p className="text-[12px] text-[#9AA3AF]">{tr("jobs.noActivity")}</p>
                ) : (
                    <div className="space-y-3">
                        {activity.map((a) => (
                            <div key={a.id} className="flex gap-2.5">
                                <Avatar name={a.actor_name || undefined} size={22} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[12px] text-[#374151] leading-snug">
                                        <span className="font-semibold text-[#15171C]">{a.actor_name || "Someone"}</span>{" "}
                                        {actionLabel(a)}
                                    </p>
                                    <p className="text-[10.5px] text-[#9AA3AF]">{relTime(a.created_at)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Assign modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#15171C]/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
                    <div className="bg-white w-full max-w-[420px] max-h-[85vh] overflow-y-auto rounded-[16px] shadow-2xl relative z-10 border border-[#E8EAED]">
                        <div className="px-5 py-4 border-b border-[#E8EAED] flex items-center justify-between sticky top-0 bg-white">
                            <h3 className="text-[15px] font-bold text-[#15171C]">{tr("jobs.assignOwnership")}</h3>
                            <button onClick={() => setModalOpen(false)} className="w-7 h-7 rounded-lg hover:bg-[#F4F5F7] flex items-center justify-center text-[#8A929E]">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-[11px] font-bold text-[#8A929E] uppercase tracking-wider">{tr("jobs.owner")}</label>
                                <select
                                    value={ownerId}
                                    onChange={(e) => setOwnerId(e.target.value)}
                                    className="mt-1.5 w-full h-10 px-3 bg-[#F7F8FA] border border-[#E8EAED] rounded-[10px] text-[14px] outline-none focus:border-[#5B53E0]"
                                >
                                    <option value="">{tr("jobs.selectOwner")}</option>
                                    {members.map((m) => (
                                        <option key={m.id} value={m.id}>{m.full_name} — {m.email}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-[#8A929E] uppercase tracking-wider">{tr("jobs.addCollaborators")}</label>
                                <div className="mt-1.5 max-h-[220px] overflow-y-auto border border-[#E8EAED] rounded-[10px] divide-y divide-[#F0F0F1]">
                                    {members.filter((m) => m.id !== ownerId).map((m) => {
                                        const checked = collabIds.includes(m.id);
                                        return (
                                            <button
                                                key={m.id}
                                                onClick={() => setCollabIds((prev) => checked ? prev.filter((id) => id !== m.id) : [...prev, m.id])}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F7F8FA] text-left"
                                            >
                                                <span className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center shrink-0 ${checked ? "bg-[#5B53E0] border-[#5B53E0]" : "border-[#CBD0D8]"}`}>
                                                    {checked && <Check className="w-3 h-3 text-white" />}
                                                </span>
                                                <Avatar name={m.full_name} size={22} />
                                                <span className="min-w-0">
                                                    <span className="block text-[13px] font-medium text-[#15171C] truncate">{m.full_name}</span>
                                                    <span className="block text-[11px] text-[#8A929E] truncate">{m.email}</span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                    {members.length === 0 && <p className="px-3 py-4 text-[12px] text-[#9AA3AF]">—</p>}
                                </div>
                            </div>
                        </div>
                        <div className="px-5 py-4 bg-[#F7F8FA] border-t border-[#E8EAED] flex justify-end gap-2 sticky bottom-0">
                            <button onClick={() => setModalOpen(false)} className="h-10 px-4 rounded-[10px] text-[13px] font-semibold text-[#6B6F76] hover:bg-[#E8EAED]/60">
                                {tr("common.cancel") === "common.cancel" ? "Cancel" : tr("common.cancel")}
                            </button>
                            <button onClick={save} disabled={saving} className="h-10 px-5 rounded-[10px] text-[13px] font-semibold bg-[#5B53E0] text-white hover:bg-[#4A43C9] disabled:opacity-60 shadow-[0_6px_16px_rgba(91,83,224,0.28)]">
                                {tr("jobs.saveAssignment")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
