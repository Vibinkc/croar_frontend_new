"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { BACKEND_URL } from "@/utils/api";
import { Button, Card, EmptyState, Textarea, cn } from "@/components/ds";

interface JobNote {
    id: string;
    body: string;
    is_pinned: boolean;
    author_id?: string | null;
    author_name?: string | null;
    created_at: string;
    updated_at?: string | null;
}

const initials = (name?: string | null) =>
    (name || "?")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(p => p[0]?.toUpperCase())
        .join("") || "?";

export default function JobNotesTab({ jobId, onCountChange }: { jobId: string; onCountChange?: (n: number) => void }) {
    const { token, userId } = useAuth();
    const { t: tr } = useI18n();
    const [notes, setNotes] = useState<JobNote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [draft, setDraft] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editBody, setEditBody] = useState("");
    const [error, setError] = useState("");

    const headers = useCallback(
        () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }),
        [token]
    );

    const load = useCallback(async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${jobId}/notes`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data: JobNote[] = await res.json();
                setNotes(data);
                onCountChange?.(data.length);
            }
        } catch {
            setError(tr("jobNotes.loadFailed"));
        } finally {
            setIsLoading(false);
        }
        // onCountChange is a parent callback; including it would refetch on every parent render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobId, token, tr]);

    useEffect(() => {
        void load();
    }, [load]);

    const addNote = async () => {
        const body = draft.trim();
        if (!body || isSaving) return;
        setIsSaving(true);
        setError("");
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${jobId}/notes`, {
                method: "POST",
                headers: headers(),
                body: JSON.stringify({ body, is_pinned: false }),
            });
            if (!res.ok) throw new Error(String(res.status));
            setDraft("");
            await load();
        } catch {
            setError(tr("jobNotes.saveFailed"));
        } finally {
            setIsSaving(false);
        }
    };

    const patchNote = async (id: string, payload: Record<string, unknown>) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${jobId}/notes/${id}`, {
                method: "PATCH",
                headers: headers(),
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(String(res.status));
            await load();
        } catch {
            setError(tr("jobNotes.saveFailed"));
        }
    };

    const removeNote = async (id: string) => {
        if (!window.confirm(tr("jobNotes.confirmDelete"))) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${jobId}/notes/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(String(res.status));
            await load();
        } catch {
            setError(tr("jobNotes.deleteFailed"));
        }
    };

    // The backend refuses edits by anyone but the author, so don't offer the control to others.
    const isMine = (n: JobNote) => !n.author_id || n.author_id === userId;

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card padding="sm">
                <Textarea
                    rows={3}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    placeholder={tr("jobNotes.placeholder")}
                    aria-label={tr("jobNotes.placeholder")}
                />
                <div className="flex items-center justify-between gap-3 mt-3">
                    <p className="text-[11.5px] text-[#757575]">{tr("jobNotes.visibleToTeam")}</p>
                    <Button onClick={addNote} disabled={!draft.trim() || isSaving}>
                        <span className="material-symbols-rounded text-[18px]">add_comment</span>
                        {isSaving ? tr("jobNotes.saving") : tr("jobNotes.addNote")}
                    </Button>
                </div>
            </Card>

            {error && (
                <div className="rounded-[4px] border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3 text-[12.5px] text-[#C62828]">
                    {error}
                </div>
            )}

            {isLoading ? (
                <Card padding="sm">
                    <p className="py-10 text-center text-[13px] text-[#757575]">{tr("jobNotes.loading")}</p>
                </Card>
            ) : notes.length === 0 ? (
                <Card padding="none">
                    <EmptyState
                        icon="sticky_note_2"
                        title={tr("jobNotes.emptyTitle")}
                        description={tr("jobNotes.emptyDesc")}
                    />
                </Card>
            ) : (
                <div className="space-y-3">
                    {notes.map(note => (
                        <Card
                            key={note.id}
                            padding="sm"
                            className={cn(note.is_pinned && "border-[#1976D2]/35 bg-[#FBFBFE]")}
                        >
                            <div className="flex items-start gap-3">
                                <span className="w-9 h-9 shrink-0 rounded-full bg-[#E3F2FD] text-[#1976D2] text-[12px] font-bold flex items-center justify-center">
                                    {initials(note.author_name)}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className="text-[13px] font-bold text-[#212121]">
                                            {note.author_name || tr("jobNotes.someone")}
                                        </span>
                                        <span className="text-[11.5px] text-[#757575]">
                                            {new Date(note.created_at).toLocaleString()}
                                        </span>
                                        {note.updated_at && (
                                            <span className="text-[11px] text-[#757575] italic">{tr("jobNotes.edited")}</span>
                                        )}
                                        {note.is_pinned && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1976D2]">
                                                <span className="material-symbols-rounded text-[14px]">push_pin</span>
                                                {tr("jobNotes.pinned")}
                                            </span>
                                        )}
                                    </div>

                                    {editingId === note.id ? (
                                        <div className="space-y-2">
                                            <Textarea rows={3} value={editBody} onChange={e => setEditBody(e.target.value)} />
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={async () => {
                                                        await patchNote(note.id, { body: editBody });
                                                        setEditingId(null);
                                                    }}
                                                    disabled={!editBody.trim()}
                                                >
                                                    {tr("common.save")}
                                                </Button>
                                                <Button variant="secondary" onClick={() => setEditingId(null)}>
                                                    {tr("common.cancel")}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-[13px] text-[#424242] leading-relaxed whitespace-pre-wrap break-words">
                                            {note.body}
                                        </p>
                                    )}
                                </div>

                                {editingId !== note.id && (
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => patchNote(note.id, { is_pinned: !note.is_pinned })}
                                            title={note.is_pinned ? tr("jobNotes.unpin") : tr("jobNotes.pin")}
                                            aria-label={note.is_pinned ? tr("jobNotes.unpin") : tr("jobNotes.pin")}
                                            className={cn(
                                                "w-8 h-8 rounded-[4px] flex items-center justify-center transition-colors hover:bg-[#FAFAFA]",
                                                note.is_pinned ? "text-[#1976D2]" : "text-[#757575] hover:text-[#212121]"
                                            )}
                                        >
                                            <span className="material-symbols-rounded text-[18px]">push_pin</span>
                                        </button>
                                        {isMine(note) && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setEditingId(note.id);
                                                        setEditBody(note.body);
                                                    }}
                                                    title={tr("common.edit")}
                                                    aria-label={tr("common.edit")}
                                                    className="w-8 h-8 rounded-[4px] flex items-center justify-center text-[#757575] hover:text-[#212121] hover:bg-[#FAFAFA] transition-colors"
                                                >
                                                    <span className="material-symbols-rounded text-[18px]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => removeNote(note.id)}
                                                    title={tr("common.delete")}
                                                    aria-label={tr("common.delete")}
                                                    className="w-8 h-8 rounded-[4px] flex items-center justify-center text-[#757575] hover:text-[#C62828] hover:bg-[#FFEBEE] transition-colors"
                                                >
                                                    <span className="material-symbols-rounded text-[18px]">delete</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
