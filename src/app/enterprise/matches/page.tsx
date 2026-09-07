"use client";

/**
 * Matches — for each open job, the people you already have who fit it.
 *
 * Manatal opens its Recruitment Center on this screen and the reason is a real one: most
 * companies have already met the person they are about to spend three weeks sourcing. Someone
 * applied for a different role last quarter, was strong, and lost. Nothing surfaces them again.
 *
 * The screen is built to be argued with rather than trusted. Every row shows the skills the
 * candidate HAS and the ones they are MISSING, because a bare "87%" invites a confidence the
 * number has not earned — it is set overlap on a skills list, not a judgement about a person.
 * A recruiter reading "8 of 10, no Kubernetes" can make the call themselves.
 *
 * Adding someone here puts them on the pipeline and nothing more: no email is sent, which is
 * the same promise the Sourcing Hub makes, and for the same reason.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Badge, Button, EmptyState, Icon, PageHeader } from "@/components/ds";

interface Match {
    candidate_id: string;
    full_name?: string | null;
    email?: string | null;
    headline?: string | null;
    location?: string | null;
    source_platform?: string | null;
    total_experience?: number | null;
    score: number;
    skill_percent: number;
    experience_fit?: number | null;
    matched_skills: string[];
    missing_skills: string[];
    matched_count: number;
    required_count: number;
}

interface JobMatches {
    job_id: string;
    title: string;
    department?: string | null;
    location?: string | null;
    status?: string | null;
    required_skills: string[];
    has_required_skills: boolean;
    match_count: number;
    matches: Match[];
}

interface Summary {
    open_jobs: number;
    jobs_with_required_skills: number;
    candidates_total: number;
    candidates_with_skills: number;
}

/** Score colour, banded like the per-job Reports tab so the two screens agree. */
function band(score: number) {
    if (score >= 80) return { bg: "#E8F5E9", fg: "#2E7D32", key: "strong" };
    if (score >= 60) return { bg: "#E3F2FD", fg: "#1976D2", key: "good" };
    if (score >= 40) return { bg: "#FFF3E0", fg: "#EF6C00", key: "fair" };
    return { bg: "#EEEEEE", fg: "#757575", key: "weak" };
}

function ScoreChip({ score }: { score: number }) {
    const b = band(score);
    return (
        <span
            className="w-12 h-12 rounded-full flex flex-col items-center justify-center shrink-0 tabular-nums"
            style={{ background: b.bg, color: b.fg }}
        >
            <span className="text-[15px] font-medium leading-none">{Math.round(score)}</span>
            <span className="text-[8.5px] uppercase tracking-wide opacity-80 leading-none mt-0.5">fit</span>
        </span>
    );
}

const SELECT =
    "h-9 px-3 rounded-[4px] border border-[#E0E0E0] bg-white text-[13px] text-[#212121] outline-none focus:border-[#1976D2]";

export default function MatchesPage() {
    const { t: tr } = useI18n();
    const { token, isLoading: authLoading } = useAuth();

    const [jobs, setJobs] = useState<JobMatches[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [pool, setPool] = useState(0);
    const [minScore, setMinScore] = useState(40);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState("");
    const [added, setAdded] = useState<Record<string, boolean>>({});
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [toast, setToast] = useState("");

    const say = (m: string) => {
        setToast(m);
        window.setTimeout(() => setToast(""), 3400);
    };

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError("");
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const [m, s] = await Promise.all([
                fetch(`${BACKEND_URL}/api/v1/enterprise/matches?min_score=${minScore}`, { headers }),
                fetch(`${BACKEND_URL}/api/v1/enterprise/matches/summary`, { headers }),
            ]);
            if (!m.ok) {
                const d = await m.json().catch(() => ({}));
                setError(typeof d.detail === "string" ? d.detail : tr("matches.loadFailed"));
                return;
            }
            const data = await m.json();
            setJobs(data.jobs || []);
            setPool(data.candidate_pool || 0);
            if (s.ok) setSummary(await s.json());
        } catch {
            setError(tr("matches.loadFailed"));
        } finally {
            setLoading(false);
        }
    }, [token, minScore, tr]);

    useEffect(() => {
        if (!authLoading && token) void load();
    }, [authLoading, token, load]);

    const addToJob = async (jobId: string, m: Match) => {
        if (!token) return;
        const key = `${jobId}:${m.candidate_id}`;
        setBusy(key);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${jobId}/candidates`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                // Distinct from "Added manually" so the pipeline's own reporting can tell that
                // this hire came from a recommendation rather than from someone applying.
                body: JSON.stringify({ candidate_id: m.candidate_id, source: "Matches" }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                say(typeof data.detail === "string" ? data.detail : tr("matches.addFailed"));
                return;
            }
            setAdded((a) => ({ ...a, [key]: true }));
            say(data.already_on_job ? tr("matches.alreadyOnJob") : tr("matches.addedToJob"));
        } finally {
            setBusy("");
        }
    };

    // A blank screen has several very different causes, and the recruiter cannot tell them
    // apart. Say which one it is rather than showing the same empty state for all of them.
    const diagnosis = (() => {
        if (!summary) return null;
        if (summary.open_jobs === 0) return tr("matches.noOpenJobs");
        if (summary.jobs_with_required_skills === 0) return tr("matches.noRequiredSkills");
        if (summary.candidates_with_skills === 0) return tr("matches.noCandidateSkills");
        return null;
    })();

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-6">
                <PageHeader
                    title={tr("matches.title")}
                    subtitle={tr("matches.subtitle")}
                    icon="how_to_reg"
                    actions={
                        <div className="flex items-center gap-2">
                            <label className="text-[12.5px] text-[#616161] flex items-center gap-2">
                                {tr("matches.minScore")}
                                <select className={SELECT} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))}>
                                    {[0, 20, 40, 60, 80].map((v) => (
                                        <option key={v} value={v}>{v}%</option>
                                    ))}
                                </select>
                            </label>
                            <Button size="sm" variant="secondary" icon="refresh" onClick={() => void load()} disabled={loading}>
                                {tr("matches.refresh")}
                            </Button>
                        </div>
                    }
                />
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                {error && (
                    <p className="mb-4 text-[12.5px] text-[#C62828] bg-[#FFEBEE] rounded-[4px] px-3 py-2">{error}</p>
                )}

                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {([
                            [tr("matches.openJobs"), summary.open_jobs, "briefcase"],
                            [tr("matches.jobsScored"), summary.jobs_with_required_skills, "playlist-check"],
                            [tr("matches.candidatePool"), pool || summary.candidates_total, "account-group"],
                            [tr("matches.withSkills"), summary.candidates_with_skills, "star"],
                        ] as [string, number, string][]).map(([label, value, icon]) => (
                            <div key={label} className="bg-white border border-[#E0E0E0] rounded-[4px] p-4 flex items-center gap-3">
                                <span className="w-9 h-9 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center shrink-0">
                                    <Icon name={icon} className="text-[19px]" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-[20px] font-medium text-[#212121] tabular-nums leading-none">{value}</span>
                                    <span className="block text-[11.5px] text-[#757575] mt-1">{label}</span>
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {diagnosis && (
                    <div className="mb-4 flex items-start gap-2 bg-[#FFF3E0] border border-[#FFE0B2] rounded-[4px] px-3 py-2.5">
                        <Icon name="information" className="text-[18px] text-[#EF6C00] shrink-0" />
                        <p className="text-[12.5px] text-[#8A5A05] leading-relaxed">{diagnosis}</p>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-6 h-6 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="bg-white border border-[#E0E0E0] rounded-[4px]">
                        <EmptyState icon="how_to_reg" title={tr("matches.emptyTitle")} description={tr("matches.emptyDesc")} />
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {jobs.map((job) => {
                            const open = expanded[job.job_id] ?? true;
                            return (
                                <section key={job.job_id} className="bg-white border border-[#E0E0E0] rounded-[4px] overflow-hidden">
                                    <header className="px-4 py-3 bg-[#F5F6F8] border-b border-[#E0E0E0] flex items-center gap-3 flex-wrap">
                                        <button
                                            type="button"
                                            onClick={() => setExpanded((e) => ({ ...e, [job.job_id]: !open }))}
                                            className="flex items-center gap-2 min-w-0"
                                        >
                                            <Icon name={open ? "chevron-down" : "chevron-right"} className="text-[18px] text-[#757575]" />
                                            <Link href={`/enterprise/jobs/${job.job_id}`} className="text-[14.5px] font-medium text-[#1976D2] hover:underline truncate">
                                                {job.title}
                                            </Link>
                                        </button>
                                        {job.department && <span className="text-[12.5px] text-[#757575]">{job.department}</span>}
                                        {job.location && (
                                            <span className="text-[12.5px] text-[#757575] inline-flex items-center gap-1">
                                                <Icon name="map-marker" className="text-[15px]" />{job.location}
                                            </span>
                                        )}
                                        <span className="ml-auto text-[12.5px] text-[#616161] tabular-nums">
                                            {tr("matches.nMatches", { count: job.match_count })}
                                        </span>
                                    </header>

                                    {open && (
                                        !job.has_required_skills ? (
                                            // The single most common reason a job shows nothing, and it is
                                            // fixable in one click — so say it and link there.
                                            <div className="px-4 py-6 flex items-start gap-2.5">
                                                <Icon name="information" className="text-[18px] text-[#EF6C00] shrink-0" />
                                                <p className="text-[12.5px] text-[#616161] leading-relaxed">
                                                    {tr("matches.jobNoSkills")}{" "}
                                                    <Link href={`/enterprise/jobs/${job.job_id}`} className="text-[#1976D2] hover:underline font-medium">
                                                        {tr("matches.addSkills")}
                                                    </Link>
                                                </p>
                                            </div>
                                        ) : job.matches.length === 0 ? (
                                            <p className="px-4 py-6 text-[12.5px] text-[#757575]">{tr("matches.noneForJob")}</p>
                                        ) : (
                                            <div className="divide-y divide-[#EEEEEE]">
                                                {job.matches.map((m) => {
                                                    const key = `${job.job_id}:${m.candidate_id}`;
                                                    const done = !!added[key];
                                                    return (
                                                        <div key={m.candidate_id} className="p-4 flex items-start gap-3 hover:bg-[#FAFAFA] transition-colors">
                                                            <ScoreChip score={m.score} />
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="text-[14px] font-medium text-[#212121]">
                                                                        {m.full_name || tr("matches.unnamed")}
                                                                    </span>
                                                                    {m.source_platform && <Badge tone="neutral">{m.source_platform}</Badge>}
                                                                    {done && <Badge tone="success">{tr("matches.added")}</Badge>}
                                                                </div>
                                                                {m.headline && <p className="text-[12.5px] text-[#4F4F4F] mt-0.5">{m.headline}</p>}

                                                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[12px] text-[#757575]">
                                                                    <span className="tabular-nums">
                                                                        {tr("matches.skillsCovered", { matched: m.matched_count, total: m.required_count })}
                                                                    </span>
                                                                    {m.experience_fit !== null && m.experience_fit !== undefined && (
                                                                        <span className="tabular-nums">
                                                                            {tr("matches.experienceFit", { pct: Math.round(m.experience_fit) })}
                                                                        </span>
                                                                    )}
                                                                    {m.location && (
                                                                        <span className="inline-flex items-center gap-1">
                                                                            <Icon name="map-marker" className="text-[15px]" />{m.location}
                                                                        </span>
                                                                    )}
                                                                    {m.email && (
                                                                        <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 text-[#2E7D32] hover:underline">
                                                                            <Icon name="email" className="text-[15px]" />{m.email}
                                                                        </a>
                                                                    )}
                                                                </div>

                                                                {/* Has and hasn't, side by side. The gap is what makes the
                                                                    score arguable instead of something to defer to. */}
                                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                                    {m.matched_skills.map((s) => (
                                                                        <span key={s} className="text-[11.5px] px-2 py-0.5 rounded-[3px] bg-[#E8F5E9] text-[#2E7D32]">
                                                                            {s}
                                                                        </span>
                                                                    ))}
                                                                    {m.missing_skills.map((s) => (
                                                                        <span key={s} className="text-[11.5px] px-2 py-0.5 rounded-[3px] bg-[#EEEEEE] text-[#757575] line-through decoration-[#BDBDBD]">
                                                                            {s}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <Button
                                                                    size="sm"
                                                                    icon="briefcase-plus"
                                                                    disabled={done || busy === key}
                                                                    onClick={() => void addToJob(job.job_id, m)}
                                                                >
                                                                    {done ? tr("matches.added") : tr("matches.addToJob")}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )
                                    )}
                                </section>
                            );
                        })}
                    </div>
                )}

                {/* Stated once, at the bottom, where someone who has been adding people will see it. */}
                <p className="text-[11.5px] text-[#757575] mt-4 leading-relaxed">{tr("matches.noNotify")}</p>
            </div>

            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[220] px-4 py-2.5 rounded-[4px] bg-[#212121] text-white text-[12.5px] font-medium shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                    {toast}
                </div>
            )}
        </div>
    );
}
