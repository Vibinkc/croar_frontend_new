"use client";

import React, { useEffect, useMemo, useState } from "react";
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
    /** Seeded application_statuses: 1 Applied · 5 Hired · 6 Rejected ("dropped"). */
    status_id?: number;
    source?: string | null;
}

/** A dropped candidate stays on the board, greyed, so the job keeps its own history. */
const STATUS_REJECTED = 6;
const STATUS_HIRED = 5;

const initials = (name?: string | null) =>
    (name || "?")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(p => p[0]?.toUpperCase())
        .join("") || "?";

/** Colour the match score by band so the board reads at a glance. */
const scoreTone = (s?: number) => {
    if (typeof s !== "number") return "bg-[#EEEEEE] text-[#616161]";
    if (s >= 80) return "bg-[#E8F5E9] text-[#2E7D32]";
    if (s >= 60) return "bg-[#E3F2FD] text-[#1976D2]";
    if (s >= 40) return "bg-[#FFF3E0] text-[#EF6C00]";
    return "bg-[#FFEBEE] text-[#C62828]";
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
    jobId,
    stages,
    applications,
    onAddCandidate,
    onSourceCandidates,
    onPostToBoards,
    onChanged,
}: {
    jobId: string;
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
    // The open menu, with the screen position it should render at. Held here rather than
    // positioned inside the card because the board is a scroll container and would clip it.
    const [menu, setMenu] = useState<{ id: string; top: number; left: number; flip: boolean } | null>(null);
    const menuFor = menu?.id ?? null;

    const openMenu = (id: string, el: HTMLElement) => {
        if (menuFor === id) {
            setMenu(null);
            return;
        }
        const r = el.getBoundingClientRect();
        // Roughly the tallest the menu gets: a header, one row per stage, a divider and two actions.
        const height = 96 + stages.length * 34;
        const flip = r.bottom + height > window.innerHeight - 12;
        setMenu({
            id,
            top: flip ? Math.max(12, r.top - height - 4) : r.bottom + 4,
            // Right-align to the button, clamped so it never runs off the left edge.
            left: Math.max(12, r.right - 208),
            flip,
        });
    };
    const closeMenu = () => setMenu(null);

    // The menu is positioned in viewport coordinates, so any scroll or resize would leave it
    // floating away from its card. Close it instead of trying to follow.
    useEffect(() => {
        if (!menu) return;
        const close = () => setMenu(null);
        window.addEventListener("scroll", close, true);
        window.addEventListener("resize", close);
        return () => {
            window.removeEventListener("scroll", close, true);
            window.removeEventListener("resize", close);
        };
    }, [menu]);
    const [error, setError] = useState("");

    const columns = useMemo(
        () =>
            stages.map(stage => ({
                ...stage,
                cards: applications.filter(a => a.current_stage === stage.id),
            })),
        [stages, applications]
    );

    // Hired / dropped / still-live, mirroring the three outcomes a job actually has.
    const counts = useMemo(() => {
        const dropped = applications.filter(a => a.status_id === STATUS_REJECTED).length;
        const hired = applications.filter(a => a.status_id === STATUS_HIRED).length;
        return { dropped, hired, inPipeline: applications.length - dropped - hired };
    }, [applications]);

    // Applications sitting on a stage the job no longer has. Shown in their own column rather
    // than vanishing — otherwise the board's totals silently disagree with the job's counts.
    const orphaned = useMemo(() => {
        const ids = new Set(stages.map(s => s.id));
        return applications.filter(a => !ids.has(a.current_stage));
    }, [stages, applications]);

    const move = async (applicationId: string, newStage: number) => {
        setMovingId(applicationId);
        closeMenu();
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

    /** Drop = out of the running but still on the board. Remove = off the job entirely. */
    const act = async (applicationId: string, what: "drop" | "restore" | "remove") => {
        if (what === "remove" && !window.confirm(tr("jobBoard.confirmRemove"))) return;
        setMovingId(applicationId);
        closeMenu();
        setError("");
        try {
            const base = `${BACKEND_URL}/api/v1/enterprise/jobs/${jobId}/applications/${applicationId}`;
            const res = await fetch(what === "remove" ? base : `${base}/${what}`, {
                method: what === "remove" ? "DELETE" : "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(String(res.status));
            onChanged();
        } catch {
            setError(tr(what === "remove" ? "jobBoard.removeFailed" : "jobBoard.dropFailed"));
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
                                <i className="mdi mdi-account-plus text-[18px]" />
                                {tr("jobBoard.addCandidate")}
                            </Button>
                            <Button variant="secondary" onClick={onSourceCandidates}>
                                <i className="mdi mdi-earth text-[18px]" />
                                {tr("jobBoard.sourceCandidates")}
                            </Button>
                            <Button variant="secondary" onClick={onPostToBoards}>
                                <i className="mdi mdi-bullhorn text-[18px]" />
                                {tr("jobBoard.postToBoards")}
                            </Button>
                        </div>
                    }
                />
            </Card>
        );
    }

    const renderCard = (app: BoardApplication, stageId: number) => {
        const dropped = app.status_id === STATUS_REJECTED;
        const hired = app.status_id === STATUS_HIRED;
        return (
        <div
            key={app.id}
            className={cn(
                "relative bg-white border border-[#E0E0E0] rounded-[4px] p-3 transition-shadow hover:shadow-[0_4px_14px_rgba(0,0,0,0.07)]",
                movingId === app.id && "opacity-50",
                dropped && "opacity-60 bg-[#FAFAFA] border-dashed"
            )}
        >
            <div className="flex items-start gap-2.5">
                <span className="w-8 h-8 shrink-0 rounded-full bg-[#E3F2FD] text-[#1976D2] text-[11px] font-bold flex items-center justify-center">
                    {initials(app.candidate?.full_name)}
                </span>
                <div className="min-w-0 flex-1">
                    <Link
                        href={`/enterprise/candidates?q=${encodeURIComponent(app.candidate?.email || app.candidate?.full_name || "")}`}
                        className="block text-[12.5px] font-bold text-[#212121] truncate hover:text-[#1976D2] transition-colors"
                    >
                        {app.candidate?.full_name || tr("jobBoard.unnamed")}
                    </Link>
                    <p className="text-[11px] text-[#757575] truncate">{app.candidate?.email}</p>
                </div>

                <div className="relative shrink-0">
                    <button
                        onClick={e => openMenu(app.id, e.currentTarget)}
                        aria-label={tr("jobBoard.moveTo")}
                        aria-expanded={menuFor === app.id}
                        className="w-7 h-7 rounded-[4px] flex items-center justify-center text-[#757575] hover:text-[#212121] hover:bg-[#FAFAFA] transition-colors"
                    >
                        <i className="mdi mdi-dots-vertical text-[17px]" />
                    </button>
                    {menu?.id === app.id && (
                        <>
                            {/* Click-away layer, so the menu closes without a document listener. */}
                            <div className="fixed inset-0 z-[60]" onClick={closeMenu} />
                            <div
                                style={{ top: menu.top, left: menu.left }}
                                className="fixed z-[61] w-52 max-h-[60vh] overflow-y-auto bg-white border border-[#E0E0E0] rounded-[4px] shadow-[0_10px_28px_rgba(0,0,0,0.14)] py-1.5"
                            >
                                <p className="px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.06em] text-[#757575]">
                                    {tr("jobBoard.moveTo")}
                                </p>
                                {stages
                                    .filter(s => s.id !== stageId)
                                    .map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => move(app.id, s.id)}
                                            className="w-full text-left px-3 py-2 text-[12.5px] text-[#424242] hover:bg-[#FAFAFA] hover:text-[#1976D2] transition-colors truncate"
                                        >
                                            {s.name}
                                        </button>
                                    ))}

                                <div className="my-1.5 border-t border-[#EEEEEE]" />

                                {dropped ? (
                                    <button
                                        onClick={() => act(app.id, "restore")}
                                        className="w-full text-left px-3 py-2 text-[12.5px] font-semibold text-[#2E7D32] hover:bg-[#E8F5E9] transition-colors flex items-center gap-2"
                                    >
                                        <i className="mdi mdi-undo text-[16px]" />
                                        {tr("jobBoard.restore")}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => act(app.id, "drop")}
                                        className="w-full text-left px-3 py-2 text-[12.5px] text-[#424242] hover:bg-[#FFF3E0] hover:text-[#E65100] transition-colors flex items-center gap-2"
                                        title={tr("jobBoard.dropHint")}
                                    >
                                        <i className="mdi mdi-minus-circle text-[16px]" />
                                        {tr("jobBoard.drop")}
                                    </button>
                                )}

                                <button
                                    onClick={() => act(app.id, "remove")}
                                    className="w-full text-left px-3 py-2 text-[12.5px] text-[#424242] hover:bg-[#FFEBEE] hover:text-[#C62828] transition-colors flex items-center gap-2"
                                    title={tr("jobBoard.removeHint")}
                                >
                                    <i className="mdi mdi-minus text-[16px]" />
                                    {tr("jobBoard.remove")}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                {dropped && (
                    <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-[3px] bg-[#FFF3E0] text-[#E65100]">
                        {tr("jobBoard.droppedBadge")}
                    </span>
                )}
                {hired && (
                    <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-[3px] bg-[#E8F5E9] text-[#2E7D32]">
                        {tr("jobBoard.hiredBadge")}
                    </span>
                )}
                {typeof app.ai_match_score === "number" && (
                    <span
                        className={cn(
                            "text-[10.5px] font-bold px-1.5 py-0.5 rounded-[3px] tabular-nums",
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
                        className="text-[10.5px] px-1.5 py-0.5 rounded-[3px] bg-[#FAFAFA] border border-[#EFF1F4] text-[#616161] truncate max-w-[92px]"
                    >
                        {s}
                    </span>
                ))}
            </div>
        </div>
        );
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {error && (
                <div className="mb-3 rounded-[4px] border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3 text-[12.5px] text-[#C62828]">
                    {error}
                </div>
            )}

            <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-2 text-[11.5px] font-semibold">
                    <span className="px-2.5 py-1 rounded-full bg-[#E3F2FD] text-[#1976D2]">
                        {tr("jobBoard.inPipeline", { count: counts.inPipeline })}
                    </span>
                    {counts.hired > 0 && (
                        <span className="px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32]">
                            {tr("jobBoard.hired", { count: counts.hired })}
                        </span>
                    )}
                    {counts.dropped > 0 && (
                        <span className="px-2.5 py-1 rounded-full bg-[#FFF3E0] text-[#E65100]">
                            {tr("jobBoard.dropped", { count: counts.dropped })}
                        </span>
                    )}
                </div>
                <Button size="sm" onClick={onAddCandidate}>
                    <i className="mdi mdi-account-plus text-[17px]" />
                    {tr("jobBoard.addCandidate")}
                </Button>
            </div>

            <div className="overflow-x-auto pb-2">
                <div className="flex gap-3.5 min-w-min">
                    {columns.map(col => (
                        <section key={col.id} className="w-[268px] shrink-0 flex flex-col">
                            <header className="flex items-center justify-between gap-2 px-3 py-2.5 bg-[#FAFAFA] border border-[#E0E0E0] rounded-t-[12px]">
                                <h4 className="text-[12.5px] font-bold text-[#212121] truncate">{col.name}</h4>
                                <span
                                    className={cn(
                                        "text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[22px] text-center tabular-nums",
                                        col.cards.length ? "bg-[#E3F2FD] text-[#1976D2]" : "bg-white text-[#9E9E9E] border border-[#E0E0E0]",
                                        jetbrainsMono.className
                                    )}
                                >
                                    {col.cards.length}
                                </span>
                            </header>
                            <div className="flex-1 border border-t-0 border-[#E0E0E0] rounded-b-[12px] bg-[#FAFAFA] p-2.5 space-y-2.5 min-h-[180px]">
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
                            <header className="flex items-center justify-between gap-2 px-3 py-2.5 bg-[#FFF3E0] border border-[#FFE0B2] rounded-t-[12px]">
                                <h4 className="text-[12.5px] font-bold text-[#E65100] truncate">
                                    {tr("jobBoard.unassigned")}
                                </h4>
                                <span className={cn("text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-white text-[#EF6C00] tabular-nums", jetbrainsMono.className)}>
                                    {orphaned.length}
                                </span>
                            </header>
                            <div className="flex-1 border border-t-0 border-[#FFE0B2] rounded-b-[12px] bg-[#FFFCF6] p-2.5 space-y-2.5">
                                <p className="text-[11px] text-[#E65100] leading-relaxed mb-1">
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
