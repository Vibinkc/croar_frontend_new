"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { BACKEND_URL } from "@/utils/api";
import { Button, Input, cn, jetbrainsMono } from "@/components/ds";

interface PoolCandidate {
    id: string;
    full_name?: string | null;
    email?: string | null;
    phone?: string | null;
    skills?: string[] | null;
    /** Jobs this person is already on — lets the list mark them before you click. */
    applied_jobs?: { id: string; title: string }[] | null;
}

const initials = (name?: string | null) =>
    (name || "?")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(p => p[0]?.toUpperCase())
        .join("") || "?";

/**
 * Put someone from the talent pool onto this job.
 *
 * Search-first by design: the reference ATS opens on "Search Candidate" before offering to create
 * one, which is what stops the same person becoming three records across three jobs. Croar's pool
 * already has server-side search (`/candidates?q=`), so this reuses it rather than filtering in
 * the browser.
 */
export default function AddCandidateModal({
    isOpen,
    onClose,
    jobId,
    jobTitle,
    onAdded,
}: {
    isOpen: boolean;
    onClose: () => void;
    jobId: string;
    jobTitle?: string;
    /** Called after a successful add so the pipeline behind the modal can refresh. */
    onAdded: () => void;
}) {
    const { token } = useAuth();
    const { t: tr } = useI18n();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<PoolCandidate[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [addingId, setAddingId] = useState<string | null>(null);
    const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
    const [error, setError] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Three ways to get someone onto a job, mirroring how a recruiter actually works:
    // they are already in the pool, you have their CV, or you only have their email.
    const [mode, setMode] = useState<"search" | "upload" | "invite">("search");
    const fileRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadResult, setUploadResult] = useState<{ full_name: string; email?: string; match_score?: number; created_candidate: boolean; already_on_job: boolean } | null>(null);
    const [inviteEmail, setInviteEmail] = useState("");
    const [isInviting, setIsInviting] = useState(false);
    const [inviteDone, setInviteDone] = useState("");
    const applyLink = typeof window !== "undefined" ? `${window.location.origin}/jobs/${jobId}` : "";

    const search = useCallback(
        async (q: string) => {
            setIsSearching(true);
            setError("");
            try {
                const url = new URL(`${BACKEND_URL}/api/v1/enterprise/candidates/`);
                if (q.trim()) url.searchParams.set("q", q.trim());
                url.searchParams.set("page_size", "20");
                const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
                if (!res.ok) throw new Error(String(res.status));
                const data = await res.json();
                // The endpoint returns a paginated envelope; tolerate a bare array too.
                setResults(Array.isArray(data) ? data : data.candidates || data.items || data.results || []);
            } catch {
                setError(tr("addCandidate.searchFailed"));
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        },
        [token, tr]
    );

    // Load the pool as soon as the dialog opens, so there is something to pick from before typing.
    useEffect(() => {
        if (!isOpen) return;
        setQuery("");
        setAddedIds(new Set());
        setError("");
        setMode("search");
        setUploadResult(null);
        setInviteEmail("");
        setInviteDone("");
        void search("");
        const t = setTimeout(() => inputRef.current?.focus(), 120);
        return () => clearTimeout(t);
    }, [isOpen, search]);

    // Debounced search as the user types.
    useEffect(() => {
        if (!isOpen) return;
        const t = setTimeout(() => void search(query), 350);
        return () => clearTimeout(t);
    }, [query, isOpen, search]);

    const add = async (c: PoolCandidate) => {
        setAddingId(c.id);
        setError("");
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${jobId}/candidates`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ candidate_id: c.id }),
            });
            if (!res.ok) {
                const detail = await res.json().catch(() => null);
                throw new Error(detail?.detail || String(res.status));
            }
            setAddedIds(prev => new Set(prev).add(c.id));
            onAdded();
        } catch (e) {
            setError(e instanceof Error && e.message ? e.message : tr("addCandidate.addFailed"));
        } finally {
            setAddingId(null);
        }
    };

    const uploadCv = async (f: File) => {
        setError("");
        setUploadResult(null);
        if (f.size > 20 * 1024 * 1024) {
            setError(tr("addCandidate.cvTooLarge"));
            return;
        }
        setIsUploading(true);
        try {
            const body = new FormData();
            body.append("file", f);
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${jobId}/candidates/upload`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body,
            });
            const payload = await res.json().catch(() => null);
            if (!res.ok) throw new Error(payload?.detail || String(res.status));
            setUploadResult(payload);
            onAdded();
        } catch (e) {
            setError(e instanceof Error && e.message ? e.message : tr("addCandidate.cvFailed"));
        } finally {
            setIsUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    // Invite works off the pool: we look the email up, and only send if we have that person.
    // Anyone else gets the apply link to send themselves, which is honest about what the
    // backend can actually do rather than pretending an email went out.
    const sendInvite = async () => {
        const email = inviteEmail.trim().toLowerCase();
        if (!email) return;
        setIsInviting(true);
        setError("");
        setInviteDone("");
        try {
            const url = new URL(`${BACKEND_URL}/api/v1/enterprise/candidates/`);
            url.searchParams.set("q", email);
            url.searchParams.set("page_size", "10");
            const found = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
            const data = found.ok ? await found.json() : null;
            const list: PoolCandidate[] = Array.isArray(data) ? data : data?.items || [];
            const match = list.find(c => (c.email || "").toLowerCase() === email);
            if (!match) {
                setError(tr("addCandidate.inviteNotInPool"));
                return;
            }
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${jobId}/invite-candidate`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ candidate_id: match.id }),
            });
            const payload = await res.json().catch(() => null);
            if (!res.ok) throw new Error(payload?.detail || String(res.status));
            setInviteDone(tr("addCandidate.inviteSent", { email }));
            setInviteEmail("");
            onAdded();
        } catch (e) {
            setError(e instanceof Error && e.message ? e.message : tr("addCandidate.inviteFailed"));
        } finally {
            setIsInviting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[110] flex items-start justify-center bg-[#0E1014]/50 backdrop-blur-sm p-6 pt-[8vh]"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.97, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.97, opacity: 0 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white w-full max-w-lg rounded-[16px] shadow-[0_14px_34px_rgba(15,23,42,0.16)] border border-[#E8EAED] overflow-hidden flex flex-col max-h-[76vh]"
                    >
                        <div className="px-6 pt-5 pb-4 border-b border-[#F0F0F1]">
                            <div className="flex items-start justify-between gap-4 mb-1">
                                <div className="min-w-0">
                                    <h2 className="text-[17px] font-extrabold text-[#15171C] tracking-[-0.3px]">
                                        {tr("addCandidate.title")}
                                    </h2>
                                    {jobTitle && (
                                        <p className="text-[12.5px] text-[#8A929E] truncate">
                                            {tr("addCandidate.toJob", { job: jobTitle })}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={onClose}
                                    aria-label={tr("common.cancel")}
                                    className="w-8 h-8 shrink-0 rounded-[10px] text-[#8A929E] hover:text-[#15171C] hover:bg-[#F7F8FA] transition-colors flex items-center justify-center"
                                >
                                    <span className="material-symbols-rounded text-[20px]">close</span>
                                </button>
                            </div>

                            <div className="flex gap-5 mt-3 border-b border-[#F0F0F1] -mb-4">
                                {([
                                    ["search", "person_search", tr("addCandidate.tabSearch")],
                                    ["upload", "upload_file", tr("addCandidate.tabUpload")],
                                    ["invite", "send", tr("addCandidate.tabInvite")],
                                ] as const).map(([id, icon, label]) => (
                                    <button
                                        key={id}
                                        onClick={() => { setMode(id); setError(""); }}
                                        className={cn(
                                            "relative pb-2.5 flex items-center gap-1.5 text-[13px] font-bold transition-colors",
                                            mode === id ? "text-[#5B53E0]" : "text-[#8A929E] hover:text-[#374151]"
                                        )}
                                    >
                                        <span className="material-symbols-rounded text-[17px]">{icon}</span>
                                        {label}
                                        {mode === id && <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-[#5B53E0] rounded-full" />}
                                    </button>
                                ))}
                            </div>

                            {mode === "search" && (
                                <div className="mt-5">
                                    <Input
                                        ref={inputRef}
                                        icon="search"
                                        type="text"
                                        value={query}
                                        onChange={e => setQuery(e.target.value)}
                                        placeholder={tr("addCandidate.searchPlaceholder")}
                                        aria-label={tr("addCandidate.searchPlaceholder")}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {error && (
                                <div className="mx-6 mt-4 rounded-[10px] border border-[#F5C6C7] bg-[#FDECEC] px-3.5 py-2.5 text-[12.5px] text-[#C0383C]">
                                    {error}
                                </div>
                            )}

                            {mode !== "search" ? null : isSearching && results.length === 0 ? (
                                <p className="py-12 text-center text-[13px] text-[#8A929E]">
                                    {tr("addCandidate.searching")}
                                </p>
                            ) : results.length === 0 ? (
                                <div className="py-12 px-6 text-center">
                                    <span className="material-symbols-rounded text-[32px] text-[#C7CCD4]">person_search</span>
                                    <p className="text-[13.5px] font-bold text-[#15171C] mt-2">
                                        {query ? tr("addCandidate.noMatches") : tr("addCandidate.poolEmpty")}
                                    </p>
                                    <p className="text-[12px] text-[#8A929E] mt-1 leading-relaxed max-w-xs mx-auto">
                                        {query ? tr("addCandidate.noMatchesHint") : tr("addCandidate.poolEmptyHint")}
                                    </p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-[#F0F0F1]">
                                    {results.map(c => {
                                        const alreadyOn = (c.applied_jobs || []).some(j => j.id === jobId);
                                        const added = addedIds.has(c.id) || alreadyOn;
                                        return (
                                            <li key={c.id} className="flex items-center gap-3 px-6 py-3">
                                                <span className="w-9 h-9 shrink-0 rounded-full bg-[#ECEBFB] text-[#5B53E0] text-[12px] font-bold flex items-center justify-center">
                                                    {initials(c.full_name)}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[13.5px] font-bold text-[#15171C] truncate">
                                                        {c.full_name || tr("addCandidate.unnamed")}
                                                    </p>
                                                    <p className="text-[11.5px] text-[#8A929E] truncate">
                                                        {c.email || (c.skills || []).slice(0, 4).join(" · ") || tr("addCandidate.noDetails")}
                                                    </p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant={added ? "secondary" : "primary"}
                                                    disabled={added || addingId === c.id}
                                                    onClick={() => add(c)}
                                                    className={cn("shrink-0", added && "pointer-events-none")}
                                                >
                                                    {added ? (
                                                        <>
                                                            <span className="material-symbols-rounded text-[16px]">check</span>
                                                            {alreadyOn && !addedIds.has(c.id) ? tr("addCandidate.onJob") : tr("addCandidate.added")}
                                                        </>
                                                    ) : addingId === c.id ? (
                                                        tr("addCandidate.adding")
                                                    ) : (
                                                        <>
                                                            <span className="material-symbols-rounded text-[16px]">add</span>
                                                            {tr("addCandidate.add")}
                                                        </>
                                                    )}
                                                </Button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                            {mode === "upload" && (
                                <div className="p-6">
                                    <button
                                        type="button"
                                        onClick={() => fileRef.current?.click()}
                                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={e => {
                                            e.preventDefault();
                                            setIsDragging(false);
                                            const f = e.dataTransfer.files?.[0];
                                            if (f) void uploadCv(f);
                                        }}
                                        disabled={isUploading}
                                        className={cn(
                                            "w-full rounded-[12px] border-2 border-dashed px-6 py-10 text-center transition-colors",
                                            isDragging ? "border-[#5B53E0] bg-[#F5F4FE]" : "border-[#DDE0E5] bg-[#FAFBFC] hover:border-[#5B53E0]/50 hover:bg-[#F7F8FA]",
                                            isUploading && "opacity-60 cursor-wait"
                                        )}
                                    >
                                        <span className="material-symbols-rounded text-[32px] text-[#5B53E0]">
                                            {isUploading ? "progress_activity" : "cloud_upload"}
                                        </span>
                                        <p className="text-[13.5px] font-bold text-[#15171C] mt-2">
                                            {isUploading ? tr("addCandidate.cvReading") : tr("addCandidate.cvDrop")}
                                        </p>
                                        <p className="text-[11.5px] text-[#8A929E] mt-1">{tr("addCandidate.cvHint")}</p>
                                    </button>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept=".pdf,.doc,.docx,.rtf,.txt"
                                        className="hidden"
                                        onChange={e => { const f = e.target.files?.[0]; if (f) void uploadCv(f); }}
                                    />

                                    {uploadResult && (
                                        <div className="mt-4 rounded-[12px] border border-[#BFE3CC] bg-[#E6F4EA] p-4">
                                            <div className="flex items-start gap-2.5">
                                                <span className="material-symbols-rounded text-[20px] text-[#15803D]">check_circle</span>
                                                <div className="min-w-0">
                                                    <p className="text-[13px] font-bold text-[#15171C]">
                                                        {uploadResult.already_on_job
                                                            ? tr("addCandidate.cvAlreadyOnJob", { name: uploadResult.full_name })
                                                            : uploadResult.created_candidate
                                                              ? tr("addCandidate.cvCreated", { name: uploadResult.full_name })
                                                              : tr("addCandidate.cvMatched", { name: uploadResult.full_name })}
                                                    </p>
                                                    <p className="text-[11.5px] text-[#3F7550] mt-0.5">
                                                        {[uploadResult.email, typeof uploadResult.match_score === "number" ? tr("addCandidate.cvScore", { score: Math.round(uploadResult.match_score) }) : null]
                                                            .filter(Boolean)
                                                            .join(" \u00b7 ")}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {mode === "invite" && (
                                <div className="p-6 space-y-4">
                                    <p className="text-[12.5px] text-[#6B6F76] leading-relaxed">
                                        {tr("addCandidate.inviteIntro")}
                                    </p>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Input
                                                icon="mail"
                                                type="email"
                                                value={inviteEmail}
                                                onChange={e => setInviteEmail(e.target.value)}
                                                onKeyDown={e => { if (e.key === "Enter") void sendInvite(); }}
                                                placeholder={tr("addCandidate.invitePlaceholder")}
                                                aria-label={tr("addCandidate.invitePlaceholder")}
                                            />
                                        </div>
                                        <Button onClick={sendInvite} disabled={!inviteEmail.trim() || isInviting}>
                                            {isInviting ? tr("addCandidate.inviteSending") : tr("addCandidate.inviteSend")}
                                        </Button>
                                    </div>

                                    {inviteDone && (
                                        <div className="rounded-[12px] border border-[#BFE3CC] bg-[#E6F4EA] px-4 py-3 text-[12.5px] text-[#15803D] flex items-center gap-2">
                                            <span className="material-symbols-rounded text-[18px]">check_circle</span>
                                            {inviteDone}
                                        </div>
                                    )}

                                    <div className="rounded-[12px] border border-[#E8EAED] bg-[#F7F8FA] p-4">
                                        <p className="text-[12px] font-bold text-[#15171C] mb-1">{tr("addCandidate.shareLink")}</p>
                                        <p className="text-[11.5px] text-[#8A929E] leading-relaxed mb-2.5">{tr("addCandidate.shareLinkHint")}</p>
                                        <div className="flex gap-2">
                                            <input
                                                readOnly
                                                value={applyLink}
                                                onFocus={e => e.currentTarget.select()}
                                                aria-label={tr("addCandidate.shareLink")}
                                                className={cn("flex-1 min-w-0 h-10 px-3 rounded-[10px] border border-[#E8EAED] bg-white text-[12px] text-[#374151]", jetbrainsMono.className)}
                                            />
                                            <Button
                                                variant="secondary"
                                                onClick={() => { void navigator.clipboard?.writeText(applyLink); setInviteDone(tr("addCandidate.linkCopied")); }}
                                            >
                                                <span className="material-symbols-rounded text-[17px]">content_copy</span>
                                                {tr("addCandidate.copy")}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        <div className="px-6 py-3.5 border-t border-[#F0F0F1] bg-[#FBFBFC] flex items-center justify-between gap-3">
                            <p className="text-[11.5px] text-[#8A929E]">{mode === "search" ? tr("addCandidate.searchFirstHint") : mode === "upload" ? tr("addCandidate.uploadHint") : tr("addCandidate.inviteHint")}</p>
                            <Button variant="secondary" size="sm" onClick={onClose}>
                                {tr("common.done")}
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
