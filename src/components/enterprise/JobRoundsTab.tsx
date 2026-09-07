"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { BACKEND_URL } from "@/utils/api";
import { Button, Card, Field, Input, Select, cn } from "@/components/ds";

interface Stage {
    id: number;
    name: string;
}

interface AssessmentAutomation {
    id: string;
    job_requirement_id: string;
    stage_index: number;
    stage_name?: string | null;
    type: "APTITUDE" | "CODING" | "BOTH" | "VIDEO";
    topic: string;
    criteria: string;
    question_count: number;
    test_duration: number;
    is_enabled: boolean;
    generated_questions?: unknown[] | null;
}

interface SimpleAutomation {
    id: string;
    stage_index: number;
    stage_name?: string | null;
}

const ASSESSMENT_TYPES: AssessmentAutomation["type"][] = ["APTITUDE", "CODING", "BOTH", "VIDEO"];

/**
 * What actually happens at each interview round, configured on the job.
 *
 * Defining a round used to stop at its name and type — the assessment, interview and email that
 * make the round *do* something were configured on separate pages, per job, after the fact. So a
 * manually built pipeline was a list of labels with nothing behind it, while Croar Pilot's path
 * generated the lot. This closes that gap: the manual path can now set a round up end to end.
 *
 * It reuses the existing automation endpoints rather than inventing a parallel model, so rounds
 * built here fire through the same trigger_automations() path as everything else.
 */
export default function JobRoundsTab({
    jobId,
    stages,
    onChanged,
}: {
    jobId: string;
    stages: Stage[];
    onChanged: () => void;
}) {
    const { token } = useAuth();
    const { t: tr } = useI18n();
    const [assessments, setAssessments] = useState<AssessmentAutomation[]>([]);
    const [interviews, setInterviews] = useState<SimpleAutomation[]>([]);
    const [mails, setMails] = useState<SimpleAutomation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState<string | null>(null);

    // The stage currently being given an assessment, plus its draft.
    const [openFor, setOpenFor] = useState<number | null>(null);
    const [draft, setDraft] = useState({ type: "APTITUDE", topic: "", criteria: "60% to pass", question_count: 10, test_duration: 30 });

    const auth = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

    const load = useCallback(async () => {
        try {
            const [a, i, m] = await Promise.all([
                fetch(`${BACKEND_URL}/api/v1/enterprise/assessment/`, { headers: auth }),
                fetch(`${BACKEND_URL}/api/v1/enterprise/interview-automation/?job_id=${jobId}`, { headers: auth }),
                fetch(`${BACKEND_URL}/api/v1/enterprise/automation/?job_id=${jobId}`, { headers: auth }),
            ]);
            // The assessment list is company-wide (no job_id filter server-side), so narrow here.
            if (a.ok) {
                const all: AssessmentAutomation[] = await a.json();
                setAssessments(all.filter(x => x.job_requirement_id === jobId));
            }
            if (i.ok) setInterviews(await i.json());
            if (m.ok) setMails(await m.json());
        } catch {
            setError(tr("jobRounds.loadFailed"));
        } finally {
            setIsLoading(false);
        }
    }, [auth, jobId, tr]);

    useEffect(() => {
        void load();
    }, [load]);

    const forStage = (index: number) => ({
        assessment: assessments.find(x => x.stage_index === index),
        interview: interviews.find(x => x.stage_index === index),
        mail: mails.find(x => x.stage_index === index),
    });

    const createAssessment = async (stage: Stage) => {
        if (!draft.topic.trim()) {
            setError(tr("jobRounds.topicRequired"));
            return;
        }
        setBusy(`create-${stage.id}`);
        setError("");
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...auth },
                body: JSON.stringify({
                    job_requirement_id: jobId,
                    stage_index: stage.id,
                    stage_name: stage.name,
                    type: draft.type,
                    topic: draft.topic.trim(),
                    criteria: draft.criteria.trim() || "60% to pass",
                    question_count: Number(draft.question_count) || 10,
                    test_duration: Number(draft.test_duration) || 30,
                    is_enabled: true,
                }),
            });
            if (!res.ok) throw new Error(String(res.status));
            setOpenFor(null);
            setDraft({ type: "APTITUDE", topic: "", criteria: "60% to pass", question_count: 10, test_duration: 30 });
            await load();
            onChanged();
        } catch {
            setError(tr("jobRounds.createFailed"));
        } finally {
            setBusy(null);
        }
    };

    const generate = async (a: AssessmentAutomation) => {
        setBusy(`gen-${a.id}`);
        setError("");
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment/${a.id}/generate`, {
                method: "POST",
                headers: auth,
            });
            if (!res.ok) throw new Error(String(res.status));
            await load();
        } catch {
            setError(tr("jobRounds.generateFailed"));
        } finally {
            setBusy(null);
        }
    };

    const removeAssessment = async (a: AssessmentAutomation) => {
        if (!window.confirm(tr("jobRounds.confirmRemove"))) return;
        setBusy(`del-${a.id}`);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment/${a.id}`, {
                method: "DELETE",
                headers: auth,
            });
            if (!res.ok && res.status !== 204) throw new Error(String(res.status));
            await load();
            onChanged();
        } catch {
            setError(tr("jobRounds.removeFailed"));
        } finally {
            setBusy(null);
        }
    };

    if (isLoading) {
        return (
            <Card padding="sm" className="animate-in fade-in duration-500">
                <p className="py-10 text-center text-[13px] text-[#757575]">{tr("jobRounds.loading")}</p>
            </Card>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h3 className="text-[15px] font-bold text-[#212121]">{tr("jobRounds.title")}</h3>
                <p className="text-[12.5px] text-[#757575] mt-0.5 max-w-2xl leading-relaxed">
                    {tr("jobRounds.subtitle")}
                </p>
            </div>

            {error && (
                <div className="rounded-[4px] border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3 text-[12.5px] text-[#C62828]">
                    {error}
                </div>
            )}

            {stages.length === 0 && (
                <Card padding="sm">
                    <p className="py-8 text-center text-[13px] text-[#757575]">{tr("jobRounds.noStages")}</p>
                </Card>
            )}

            <ol className="space-y-3">
                {stages.map((stage, i) => {
                    const attached = forStage(stage.id);
                    const a = attached.assessment;
                    const isOpen = openFor === stage.id;
                    return (
                        <li key={stage.id}>
                            <Card padding="sm">
                                <div className="flex items-start gap-3">
                                    <span className="w-8 h-8 shrink-0 rounded-full bg-[#E3F2FD] text-[#1976D2] text-[12px] font-bold flex items-center justify-center">
                                        {i + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="text-[13.5px] font-bold text-[#212121]">{stage.name}</h4>
                                            {a && (
                                                <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-[3px] bg-[#E3F2FD] text-[#1976D2]">
                                                    {tr(`jobRounds.type.${a.type}`)}
                                                </span>
                                            )}
                                            {attached.interview && (
                                                <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-[3px] bg-[#E3F2FD] text-[#1565C0]">
                                                    {tr("jobRounds.hasInterview")}
                                                </span>
                                            )}
                                            {attached.mail && (
                                                <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-[3px] bg-[#E8F5E9] text-[#2E7D32]">
                                                    {tr("jobRounds.hasEmail")}
                                                </span>
                                            )}
                                        </div>

                                        {a ? (
                                            <div className="mt-2 rounded-[4px] border border-[#E0E0E0] bg-[#FAFAFA] p-3">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="text-[12.5px] font-semibold text-[#212121] truncate">
                                                            {a.topic}
                                                        </p>
                                                        <p className="text-[11.5px] text-[#757575]">
                                                            {tr("jobRounds.meta", {
                                                                count: a.question_count,
                                                                minutes: a.test_duration,
                                                                criteria: a.criteria,
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {(a.generated_questions?.length || 0) > 0 ? (
                                                            <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#2E7D32]">
                                                                <span className="material-symbols-rounded text-[16px]">check_circle</span>
                                                                {tr("jobRounds.questionsReady", { n: a.generated_questions?.length || 0 })}
                                                            </span>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                disabled={busy === `gen-${a.id}`}
                                                                onClick={() => generate(a)}
                                                            >
                                                                <span className="material-symbols-rounded text-[16px]">auto_awesome</span>
                                                                {busy === `gen-${a.id}` ? tr("jobRounds.generating") : tr("jobRounds.generate")}
                                                            </Button>
                                                        )}
                                                        <button
                                                            onClick={() => removeAssessment(a)}
                                                            title={tr("jobRounds.removeAssessment")}
                                                            aria-label={tr("jobRounds.removeAssessment")}
                                                            className="w-8 h-8 rounded-[4px] flex items-center justify-center text-[#757575] hover:text-[#C62828] hover:bg-[#FFEBEE] transition-colors"
                                                        >
                                                            <span className="material-symbols-rounded text-[18px]">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : isOpen ? (
                                            <div className="mt-2.5 rounded-[4px] border border-[#E0E0E0] bg-[#FAFAFA] p-3.5 space-y-3">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <Field label={tr("jobRounds.typeLabel")}>
                                                        <Select
                                                            className="cursor-pointer"
                                                            value={draft.type}
                                                            onChange={e => setDraft({ ...draft, type: e.target.value })}
                                                        >
                                                            {ASSESSMENT_TYPES.map(t => (
                                                                <option key={t} value={t}>{tr(`jobRounds.type.${t}`)}</option>
                                                            ))}
                                                        </Select>
                                                    </Field>
                                                    <Field label={tr("jobRounds.topicLabel")}>
                                                        <Input
                                                            value={draft.topic}
                                                            onChange={e => setDraft({ ...draft, topic: e.target.value })}
                                                            placeholder={tr("jobRounds.topicPlaceholder")}
                                                        />
                                                    </Field>
                                                    <Field label={tr("jobRounds.countLabel")}>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            max={50}
                                                            value={draft.question_count}
                                                            onChange={e => setDraft({ ...draft, question_count: Number(e.target.value) })}
                                                        />
                                                    </Field>
                                                    <Field label={tr("jobRounds.durationLabel")}>
                                                        <Input
                                                            type="number"
                                                            min={5}
                                                            max={240}
                                                            value={draft.test_duration}
                                                            onChange={e => setDraft({ ...draft, test_duration: Number(e.target.value) })}
                                                        />
                                                    </Field>
                                                </div>
                                                <Field label={tr("jobRounds.criteriaLabel")}>
                                                    <Input
                                                        value={draft.criteria}
                                                        onChange={e => setDraft({ ...draft, criteria: e.target.value })}
                                                        placeholder={tr("jobRounds.criteriaPlaceholder")}
                                                    />
                                                </Field>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        disabled={busy === `create-${stage.id}`}
                                                        onClick={() => createAssessment(stage)}
                                                    >
                                                        {busy === `create-${stage.id}` ? tr("jobRounds.saving") : tr("jobRounds.attach")}
                                                    </Button>
                                                    <Button size="sm" variant="secondary" onClick={() => setOpenFor(null)}>
                                                        {tr("common.cancel")}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => { setOpenFor(stage.id); setError(""); }}
                                                className="mt-1.5 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#1976D2] hover:text-[#1565C0] transition-colors"
                                            >
                                                <span className="material-symbols-rounded text-[17px]">add_circle</span>
                                                {tr("jobRounds.addAssessment")}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </li>
                    );
                })}
            </ol>

            <div className={cn("rounded-[4px] border border-[#E0E0E0] bg-[#FAFAFA] p-4")}>
                <p className="text-[12px] font-bold text-[#212121] mb-1">{tr("jobRounds.moreTitle")}</p>
                <p className="text-[11.5px] text-[#757575] leading-relaxed">{tr("jobRounds.moreHint")}</p>
            </div>
        </div>
    );
}
