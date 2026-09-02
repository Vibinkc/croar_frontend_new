"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { BACKEND_URL } from "@/utils/api";
import { Button, Input, cn } from "@/components/ds";

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

                            <div className="mt-3">
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
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {error && (
                                <div className="mx-6 mt-4 rounded-[10px] border border-[#F5C6C7] bg-[#FDECEC] px-3.5 py-2.5 text-[12.5px] text-[#C0383C]">
                                    {error}
                                </div>
                            )}

                            {isSearching && results.length === 0 ? (
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

                        <div className="px-6 py-3.5 border-t border-[#F0F0F1] bg-[#FBFBFC] flex items-center justify-between gap-3">
                            <p className="text-[11.5px] text-[#8A929E]">{tr("addCandidate.searchFirstHint")}</p>
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
