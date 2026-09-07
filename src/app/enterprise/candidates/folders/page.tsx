"use client";

/**
 * Candidate folders — Manatal's Candidates › Folders, on Croar's kit.
 *
 * A folder is a bookmark, not a pipeline. Putting someone in one emails nobody and moves no
 * stage, which is exactly why it is the safe place for "strong, but not for this role" — the
 * decision a recruiter makes twenty times a day and currently has nowhere to record.
 *
 * Two panes: the folders down the left, the chosen folder's people on the right. Deleting a
 * folder is confirmed inline rather than in a dialog, because the thing being destroyed is the
 * grouping and never the candidates, and the copy can say so on the spot.
 */

import { useCallback, useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Badge, Button, EmptyState, PageHeader, cn } from "@/components/ds";

interface Folder {
    id: string;
    name: string;
    description?: string | null;
    candidate_count: number;
}

interface Member {
    id: string;
    full_name?: string | null;
    email?: string | null;
    headline?: string | null;
    location?: string | null;
    company?: string | null;
    skills?: string[];
    source_platform?: string | null;
    added_at?: string | null;
}

const TONES: [string, string][] = [
    ["#E3F2FD", "#1976D2"],
    ["#E8F5E9", "#2E7D32"],
    ["#FFF3E0", "#EF6C00"],
    ["#E3F2FD", "#1565C0"],
    ["#FFEBEE", "#C62828"],
    ["#EEEEEE", "#4F4F4F"],
];
function toneFor(seed: string): [string, string] {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return TONES[h % TONES.length];
}

function Avatar({ name, size = 38 }: { name: string; size?: number }) {
    const [bg, fg] = toneFor(name);
    return (
        <span
            className="shrink-0 rounded-full flex items-center justify-center font-bold"
            style={{ width: size, height: size, background: bg, color: fg, fontSize: Math.round(size * 0.36) }}
        >
            {name.trim().charAt(0).toUpperCase() || "?"}
        </span>
    );
}

const INPUT =
    "w-full h-9 px-3 rounded-[4px] border border-[#E0E0E0] bg-white text-[13px] text-[#212121] placeholder:text-[#9E9E9E] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all";

export default function FoldersPage() {
    const { t: tr } = useI18n();
    const { token, isLoading: authLoading } = useAuth();

    const [folders, setFolders] = useState<Folder[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [error, setError] = useState("");

    const [creating, setCreating] = useState(false);
    const [draftName, setDraftName] = useState("");
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameDraft, setRenameDraft] = useState("");
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [toast, setToast] = useState("");

    const auth = { Authorization: `Bearer ${token}` };
    const say = (m: string) => {
        setToast(m);
        window.setTimeout(() => setToast(""), 3200);
    };

    const loadFolders = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/candidates/folders`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                setError(tr("folders.loadFailed"));
                return;
            }
            const data: Folder[] = await res.json();
            setFolders(data);
            setActiveId((cur) => cur ?? (data.length ? data[0].id : null));
        } catch {
            setError(tr("folders.loadFailed"));
        } finally {
            setLoading(false);
        }
    }, [token, tr]);

    const loadMembers = useCallback(
        async (id: string) => {
            if (!token) return;
            setLoadingMembers(true);
            try {
                const res = await fetch(
                    `${BACKEND_URL}/api/v1/enterprise/candidates/folders/${id}/candidates`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (res.ok) {
                    const data = await res.json();
                    setMembers(data.candidates || []);
                }
            } finally {
                setLoadingMembers(false);
            }
        },
        [token]
    );

    useEffect(() => {
        if (!authLoading && token) void loadFolders();
    }, [authLoading, token, loadFolders]);

    useEffect(() => {
        if (activeId) void loadMembers(activeId);
        else setMembers([]);
    }, [activeId, loadMembers]);

    const create = async () => {
        const name = draftName.trim();
        if (!name || !token) return;
        const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/candidates/folders`, {
            method: "POST",
            headers: { ...auth, "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
        });
        if (res.ok) {
            const data = await res.json();
            setDraftName("");
            setCreating(false);
            await loadFolders();
            setActiveId(data.id);
            say(data.created ? tr("folders.created") : tr("folders.alreadyExists"));
        } else {
            say(tr("folders.createFailed"));
        }
    };

    const rename = async (id: string) => {
        const name = renameDraft.trim();
        if (!name || !token) return;
        const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/candidates/folders/${id}`, {
            method: "PATCH",
            headers: { ...auth, "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
        });
        setRenamingId(null);
        if (res.ok) await loadFolders();
        else say(tr("folders.renameFailed"));
    };

    const remove = async (id: string) => {
        if (!token) return;
        const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/candidates/folders/${id}`, {
            method: "DELETE",
            headers: auth,
        });
        setConfirmDelete(null);
        if (res.ok) {
            if (activeId === id) setActiveId(null);
            await loadFolders();
            say(tr("folders.deleted"));
        } else {
            say(tr("folders.deleteFailed"));
        }
    };

    const removeMember = async (candidateId: string) => {
        if (!token || !activeId) return;
        const res = await fetch(
            `${BACKEND_URL}/api/v1/enterprise/candidates/folders/${activeId}/candidates/${candidateId}`,
            { method: "DELETE", headers: auth }
        );
        if (res.ok) {
            setMembers((m) => m.filter((x) => x.id !== candidateId));
            setFolders((f) =>
                f.map((x) => (x.id === activeId ? { ...x, candidate_count: Math.max(0, x.candidate_count - 1) } : x))
            );
            say(tr("folders.removed"));
        }
    };

    const active = folders.find((f) => f.id === activeId) || null;

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-6">
                <PageHeader
                    title={tr("folders.title")}
                    subtitle={tr("folders.subtitle")}
                    icon="folder"
                    actions={
                        <Button size="sm" icon="create_new_folder" onClick={() => setCreating(true)}>
                            {tr("folders.newFolder")}
                        </Button>
                    }
                />
            </div>

            {error && (
                <p className="mx-6 mt-4 text-[12.5px] text-[#C62828] bg-[#FFEBEE] rounded-[4px] px-3 py-2">{error}</p>
            )}

            <div className="flex-1 flex gap-4 px-6 py-4 min-h-0">
                {/* ── folder list ──────────────────────────────────────────────── */}
                <aside className="w-[300px] shrink-0 flex flex-col rounded-[4px] border border-[#E0E0E0] bg-white overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#E0E0E0] flex items-center justify-between">
                        <span className="text-[13.5px] font-bold text-[#212121]">{tr("folders.allFolders")}</span>
                        <span className="text-[12px] text-[#9E9E9E] tabular-nums">{folders.length}</span>
                    </div>

                    {creating && (
                        <div className="p-3 border-b border-[#E0E0E0] flex flex-col gap-2 bg-[#FAFAFA]">
                            <input
                                autoFocus
                                className={INPUT}
                                value={draftName}
                                placeholder={tr("folders.namePlaceholder")}
                                onChange={(e) => setDraftName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") void create();
                                    if (e.key === "Escape") { setCreating(false); setDraftName(""); }
                                }}
                            />
                            <div className="flex gap-2">
                                <Button size="sm" onClick={() => void create()} disabled={!draftName.trim()}>
                                    {tr("folders.create")}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setCreating(false); setDraftName(""); }}>
                                    {tr("folders.cancel")}
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <div className="w-5 h-5 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                            </div>
                        ) : folders.length === 0 ? (
                            <p className="px-4 py-8 text-center text-[12.5px] text-[#757575] leading-relaxed">
                                {tr("folders.noFoldersYet")}
                            </p>
                        ) : (
                            folders.map((f) => (
                                <div
                                    key={f.id}
                                    className={cn(
                                        "border-b border-[#EEEEEE] last:border-b-0 transition-colors",
                                        activeId === f.id ? "bg-[#E3F2FD]" : "hover:bg-[#FAFAFA]"
                                    )}
                                >
                                    {renamingId === f.id ? (
                                        <div className="p-3 flex flex-col gap-2">
                                            <input
                                                autoFocus
                                                className={INPUT}
                                                value={renameDraft}
                                                onChange={(e) => setRenameDraft(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") void rename(f.id);
                                                    if (e.key === "Escape") setRenamingId(null);
                                                }}
                                            />
                                            <div className="flex gap-2">
                                                <Button size="sm" onClick={() => void rename(f.id)}>{tr("folders.save")}</Button>
                                                <Button size="sm" variant="ghost" onClick={() => setRenamingId(null)}>
                                                    {tr("folders.cancel")}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : confirmDelete === f.id ? (
                                        <div className="p-3 flex flex-col gap-2 bg-[#FFEBEE]">
                                            {/* Says what survives, not just what is destroyed — the fear here is
                                                losing the people, and they are never touched. */}
                                            <p className="text-[12px] text-[#8A2B2E] leading-relaxed">
                                                {tr("folders.confirmDelete", { name: f.name })}
                                            </p>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="danger" onClick={() => void remove(f.id)}>
                                                    {tr("folders.delete")}
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(null)}>
                                                    {tr("folders.cancel")}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 px-3 py-2.5 group">
                                            <button
                                                type="button"
                                                onClick={() => setActiveId(f.id)}
                                                className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                                            >
                                                <span className={cn(
                                                    "mdi mdi-folder text-[20px]",
                                                    activeId === f.id ? "text-[#1976D2]" : "text-[#9E9E9E]"
                                                )} />
                                                <span className="min-w-0 flex-1">
                                                    <span className={cn(
                                                        "block text-[13.5px] font-semibold truncate",
                                                        activeId === f.id ? "text-[#1976D2]" : "text-[#212121]"
                                                    )}>
                                                        {f.name}
                                                    </span>
                                                    <span className="block text-[11.5px] text-[#9E9E9E]">
                                                        {tr("folders.candidateCount", { count: f.candidate_count })}
                                                    </span>
                                                </span>
                                            </button>
                                            <button
                                                type="button"
                                                aria-label={tr("folders.rename")}
                                                title={tr("folders.rename")}
                                                onClick={() => { setRenamingId(f.id); setRenameDraft(f.name); }}
                                                className="w-7 h-7 rounded-[4px] flex items-center justify-center text-[#9E9E9E] hover:text-[#1976D2] hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <i className="mdi mdi-pencil text-[17px]" />
                                            </button>
                                            <button
                                                type="button"
                                                aria-label={tr("folders.delete")}
                                                title={tr("folders.delete")}
                                                onClick={() => setConfirmDelete(f.id)}
                                                className="w-7 h-7 rounded-[4px] flex items-center justify-center text-[#9E9E9E] hover:text-[#C62828] hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <i className="mdi mdi-delete text-[17px]" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </aside>

                {/* ── the chosen folder's people ───────────────────────────────── */}
                <main className="flex-1 min-w-0 rounded-[4px] border border-[#E0E0E0] bg-white flex flex-col overflow-hidden">
                    {!active ? (
                        <EmptyState
                            icon="folder_open"
                            title={tr("folders.emptyTitle")}
                            description={tr("folders.emptyDesc")}
                            action={<Button size="sm" icon="create_new_folder" onClick={() => setCreating(true)}>{tr("folders.newFolder")}</Button>}
                            className="flex-1"
                        />
                    ) : (
                        <>
                            <div className="px-4 py-3 border-b border-[#E0E0E0] flex items-center gap-3 flex-wrap">
                                <h2 className="text-[15px] font-bold text-[#212121]">{active.name}</h2>
                                <Badge tone="indigo">{tr("folders.candidateCount", { count: active.candidate_count })}</Badge>
                                {active.description && (
                                    <span className="text-[12.5px] text-[#757575]">{active.description}</span>
                                )}
                            </div>

                            {loadingMembers ? (
                                <div className="flex-1 flex items-center justify-center py-16">
                                    <div className="w-5 h-5 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                                </div>
                            ) : members.length === 0 ? (
                                <EmptyState
                                    icon="person_add"
                                    tone="muted"
                                    title={tr("folders.folderEmptyTitle")}
                                    description={tr("folders.folderEmptyDesc")}
                                    className="flex-1"
                                />
                            ) : (
                                <div className="flex-1 overflow-y-auto divide-y divide-[#EEEEEE]">
                                    {members.map((m) => {
                                        const name = m.full_name || tr("folders.unnamed");
                                        return (
                                            <div key={m.id} className="p-4 flex items-start gap-3 hover:bg-[#FAFAFA] transition-colors">
                                                <Avatar name={name} />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[14px] font-bold text-[#212121]">{name}</span>
                                                        {m.source_platform && <Badge tone="neutral">{m.source_platform}</Badge>}
                                                    </div>
                                                    {m.headline && <p className="text-[12.5px] text-[#4F4F4F] mt-0.5">{m.headline}</p>}
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[12px] text-[#757575]">
                                                        {m.email && (
                                                            <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 text-[#2E7D32] hover:underline">
                                                                <i className="mdi mdi-email text-[15px]" />
                                                                {m.email}
                                                            </a>
                                                        )}
                                                        {m.location && (
                                                            <span className="inline-flex items-center gap-1">
                                                                <i className="mdi mdi-map-marker text-[15px]" />
                                                                {m.location}
                                                            </span>
                                                        )}
                                                        {m.company && (
                                                            <span className="inline-flex items-center gap-1">
                                                                <i className="mdi mdi-office-building text-[15px]" />
                                                                {m.company}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {m.skills && m.skills.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                                            {m.skills.slice(0, 8).map((s) => (
                                                                <span key={s} className="text-[11.5px] font-semibold px-2 py-0.5 rounded-[3px] bg-[#E3F2FD] text-[#1565C0]">
                                                                    {s}
                                                                </span>
                                                            ))}
                                                            {m.skills.length > 8 && (
                                                                <span className="text-[11.5px] text-[#9E9E9E] self-center">+{m.skills.length - 8}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    aria-label={tr("folders.removeFromFolder")}
                                                    title={tr("folders.removeFromFolder")}
                                                    onClick={() => void removeMember(m.id)}
                                                    className="w-9 h-9 rounded-[4px] flex items-center justify-center text-[#9E9E9E] hover:text-[#C62828] hover:bg-[#FFEBEE] transition-colors shrink-0"
                                                >
                                                    <i className="mdi mdi-folder-remove text-[20px]" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>

            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[220] px-4 py-2.5 rounded-[4px] bg-[#212121] text-white text-[12.5px] font-semibold shadow-[0_14px_34px_rgba(0,0,0,0.16)]">
                    {toast}
                </div>
            )}
        </div>
    );
}
