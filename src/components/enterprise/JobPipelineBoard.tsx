"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { BACKEND_URL } from "@/utils/api";
import { Button, Card, EmptyState, cn, jetbrainsMono } from "@/components/ds";

export interface BoardStage {
    id: number;
    name: string;
}

export interface BoardApplication {
    id: string;
    candidate: { id: string; full_name: string; email: string; skills: string[] };
    current_stage: number;
    ai_match_score?: number;
    applied_at: string;
}

const initials = (name?: string | null) =>
    (name || "?")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(p => p[0]?.toUpperCase())
        .join("") || "?";

/** Colour the match score by band so the board reads at a glance. */
const scoreTone = (s?: number) => {
    if (typeof s !== "number") return "bg-[#F1F2F5] text-[#6B6F76]";
    if (s >= 80) return "bg-[#E6F4EA] text-[#15803D]";
    if (s >= 60) return "bg-[#ECEBFB] text-[#5B53E0]";
    if (s >= 40) return "bg-[#FEF3E2] text-[#D97706]";
    return "bg-[#FDECEC] text-[#C0383C]";
};

/**
 * The job's own pipeline, on the job.
 *
 * Croar's board previously lived only at /enterprise/candidates/kanban behind a global job
 * picker, so "where is this role up to" meant leaving the job. This puts the same movement on
 * the page that owns it.
 *
 * Moving a card PATCHes /applications/{id}/stage, which is also what fires the stage automations
 * (emails, assessments, interview invites) — so a move here behaves exactly like a move anywhere
 * else, rather than quietly skipping them.
 */
export default function JobPipelineBoard({
    stages,
    applications,
    onAddCandidate,
    onSourceCandidates,
    onPostToBoards,
    onChanged,
}: {
    stages: BoardStage[];
    applications: BoardApplication[];
    onAddCandidate: () => void;
    onSourceCandidates: () => void;
    onPostToBoards: () => void;
    /** Re-fetch after a successful move. */
    onChanged: () => void;
}) {
    const { token } = useAuth();
    const { t: tr } = useI18n();
    const [movingId, setMovingId] = useState<string | null>(null);
    const [menuFor, setMenuFor] = useState<string | null>(null);
    const [error, setError] = useState("");

    const columns = useMemo(
        () =>
            stages.map(stage => ({
                ...stage,
                cards: applications.filter(a => a.current_stage === stage.id),
            })),
        [stages, applications]
    );

    // Applications sitting on a stage the job no longer has. Shown in their own column rather
    // than vanishing — otherwise the board's totals silently disagree with the job's counts.
    const orphaned = useMemo(() => {
        const ids = new Set(stages.map(s => s.id));
        return applications.filter(a => !ids.has(a.current_stage));
    }, [stages, applications]);

    const move = async (applicationId: string, newStage: number) => {
        setMovingId(applicationId);
        setMenuFor(null);
        setError("");
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/applications/${applicationId}/stage`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ new_stage: newStage }),
            });
            if (!res.ok) throw new Error(String(res.status));
            onChanged();
        } catch {
            setError(tr("jobBoard.moveFailed"));
        } finally {
            setMovingId(null);
        }
    };

    if (applications.length === 0) {
        return (
            <Card padding="none" className="animate-in fade-in duration-500">
                <EmptyState
                    icon="group_add"
                    title={tr("jobBoard.emptyTitle")}
                    description={tr("jobBoard.emptyDesc")}
                    action={
                        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                            <Button onClick={onAddCandidate}>
                                <span className="material-symbols-rounded text-[18px]">person_add</span>
                                {tr("jobBoard.addCandidate")}
                            </Button>
                            <Button variant="secondary" onClick={onSourceCandidates}>
                                <span className="material-symbols-rounded text-[18px]">travel_explore</span>
                                {tr("jobBoard.sourceCandidates")}
                            </Button>
                            <Button variant="secondary" onClick={onPostToBoards}>
                                <span className="material-symbols-rounded text-[18px]">campaign</span>
                                {tr("jobBoard.postToBoards")}
                            </Button>
                        </div>
                    }
                />
            </Card>
        );
    }

    const renderCard = (app: BoardApplication, stageId: number) => (
        <div
            key={app.id}
            className={cn(
                "relative bg-white border border-[#E8EAED] rounded-[11px] p-3 transition-shadow hover:shadow-[0_4px_14px_rgba(15,23,42,0.07)]",
                movingId === app.id && "opacity-50"
            )}
        >
            <div className="flex items-start gap-2.5">
                <span className="w-8 h-8 shrink-0 rounded-full bg-[#ECEBFB] text-[#5B53E0] text-[11px] font-bold flex items-center justify-center">
                    {initials(app.candidate?.full_name)}
                </span>
                <div className="min-w-0 flex-1">
                    <Link
                        href={`/enterprise/candidates?q=${encodeURIComponent(app.candidate?.email || app.candidate?.full_name || "")}`}
                        className="block text-[12.5px] font-bold text-[#15171C] truncate hover:text-[#5B53E0] transition-colors"
                    >
                        {app.candidate?.full_name || tr("jobBoard.unnamed")}
                    </Link>
                    <p className="text-[11px] text-[#8A929E] truncate">{app.candidate?.email}</p>
                </div>

                <div className="relative shrink-0">
                    <button
                        onClick={() => setMenuFor(menuFor === app.id ? null : app.id)}
                        aria-label={tr("jobBoard.moveTo")}
                        className="w-7 h-7 rounded-[8px] flex items-center justify-center text-[#8A929E] hover:text-[#15171C] hover:bg-[#F7F8FA] transition-colors"
                    >
                        <span className="material-symbols-rounded text-[17px]">more_vert</span>
                    </button>
                    {menuFor === app.id && (
                        <>
                            {/* Click-away layer, so the menu closes without a document listener. */}
                            <div className="fixed inset-0 z-20" onClick={() => setMenuFor(null)} />
                            <div className="absolute right-0 top-8 z-30 w-52 bg-white border border-[#E8EAED] rounded-[11px] shadow-[0_10px_28px_rgba(15,23,42,0.14)] py-1.5">
                                <p className="px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.06em] text-[#8A929E]">
                                    {tr("jobBoard.moveTo")}
                                </p>
                                {stages
                                    .filter(s => s.id !== stageId)
                                    .map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => move(app.id, s.id)}
                                            className="w-full text-left px-3 py-2 text-[12.5px] text-[#374151] hover:bg-[#F7F8FA] hover:text-[#5B53E0] transition-colors truncate"
                                        >
                                            {s.name}
                                        </button>
                                    ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                {typeof app.ai_match_score === "number" && (
                    <span
                        className={cn(
                            "text-[10.5px] font-bold px-1.5 py-0.5 rounded-[5px] tabular-nums",
                            scoreTone(app.ai_match_score),
                            jetbrainsMono.className
                        )}
                    >
                        {Math.round(app.ai_match_score)}%
                    </span>
                )}
                {(app.candidate?.skills || []).slice(0, 2).map(s => (
                    <span
                        key={s}
                        className="text-[10.5px] px-1.5 py-0.5 rounded-[5px] bg-[#F7F8FA] border border-[#EFF1F4] text-[#6B6F76] truncate max-w-[92px]"
                    >
                        {s}
                    </span>
                ))}
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {error && (
                <div className="mb-3 rounded-[12px] border border-[#F5C6C7] bg-[#FDECEC] px-4 py-3 text-[12.5px] text-[#C0383C]">
                    {error}
                </div>
            )}

            <div className="flex items-center justify-between gap-3 mb-4">
                <p className="text-[12.5px] text-[#8A929E]">
                    {tr("jobBoard.summary", { count: applications.length, stages: stages.length })}
                </p>
                <Button size="sm" onClick={onAddCandidate}>
                    <span className="material-symbols-rounded text-[17px]">person_add</span>
                    {tr("jobBoard.addCandidate")}
                </Button>
            </div>

            <div className="overflow-x-auto pb-2">
                <div className="flex gap-3.5 min-w-min">
                    {columns.map(col => (
                        <section key={col.id} className="w-[268px] shrink-0 flex flex-col">
                            <header className="flex items-center justify-between gap-2 px-3 py-2.5 bg-[#F7F8FA] border border-[#E8EAED] rounded-t-[12px]">
                                <h4 className="text-[12.5px] font-bold text-[#15171C] truncate">{col.name}</h4>
                                <span
                                    className={cn(
                                        "text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[22px] text-center tabular-nums",
                                        col.cards.length ? "bg-[#ECEBFB] text-[#5B53E0]" : "bg-white text-[#9AA3AF] border border-[#E8EAED]",
                                        jetbrainsMono.className
                                    )}
                                >
                                    {col.cards.length}
                                </span>
                            </header>
                            <div className="flex-1 border border-t-0 border-[#E8EAED] rounded-b-[12px] bg-[#FBFBFC] p-2.5 space-y-2.5 min-h-[180px]">
                                {col.cards.length === 0 ? (
                                    <p className="text-[11.5px] text-[#B4BAC3] text-center py-8">
                                        {tr("jobBoard.emptyStage")}
                                    </p>
                                ) : (
                                    col.cards.map(a => renderCard(a, col.id))
                                )}
                            </div>
                        </section>
                    ))}

                    {orphaned.length > 0 && (
                        <section className="w-[268px] shrink-0 flex flex-col">
                            <header className="flex items-center justify-between gap-2 px-3 py-2.5 bg-[#FEF3E2] border border-[#F3DDBA] rounded-t-[12px]">
                                <h4 className="text-[12.5px] font-bold text-[#8A5B08] truncate">
                                    {tr("jobBoard.unassigned")}
                                </h4>
                                <span className={cn("text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-white text-[#D97706] tabular-nums", jetbrainsMono.className)}>
                                    {orphaned.length}
                                </span>
                            </header>
                            <div className="flex-1 border border-t-0 border-[#F3DDBA] rounded-b-[12px] bg-[#FFFCF6] p-2.5 space-y-2.5">
                                <p className="text-[11px] text-[#8A5B08] leading-relaxed mb-1">
                                    {tr("jobBoard.unassignedHint")}
                                </p>
                                {orphaned.map(a => renderCard(a, -1))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
