"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { BACKEND_URL } from "@/utils/api";
import { Button, Card, Textarea, Badge, PageHelp, jetbrainsMono } from "@/components/ds";

interface Question {
    id: string;
    text: string;
    type: "RATING" | "TEXT";
    category: string;
}

interface TemplateQuestion {
    question: Question;
    order: number;
}

interface Assignment {
    id: string;
    relation: string;
    status: string;
    ratee: {
        first_name: string;
        last_name: string;
    };
    cycle: {
        name: string;
    };
}

export default function X360FillAssessment() {
    const { token } = useAuth();
    const { t: tr } = useI18n();
    const router = useRouter();
    const params = useParams();
    const assignmentId = params.id as string;

    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [responses, setResponses] = useState<Record<string, { answer_value?: number, answer_text?: string }>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [showSuccess, setShowSuccess] = useState(false);
    const [pendingTasks, setPendingTasks] = useState<Assignment[]>([]);

    const fetchPendingTasks = async (raterId: string) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/x360/portal/assignments-by-rater/${raterId}`);
            if (res.ok) {
                const data = await res.json();
                setPendingTasks(data.filter((t: Assignment) => t.id !== assignmentId));
            }
        } catch (error) {
            console.error("Error fetching pending tasks:", error);
        }
    };

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // Always try portal endpoint first for public users or if not logged in
                let res = await fetch(`${BACKEND_URL}/api/v1/enterprise/x360/portal/assessments/${assignmentId}`);

                // Fallback to standard recruiter endpoint only if portal fails and token exists
                if (!res.ok && token) {
                    res = await fetch(`${BACKEND_URL}/api/v1/enterprise/x360/assessments/${assignmentId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                }

                if (res && res.ok) {
                    const data = await res.json();
                    setAssignment(data.assignment);
                    const sortedQuestions = data.template.questions
                        .sort((a: TemplateQuestion, b: TemplateQuestion) => a.order - b.order)
                        .map((tq: TemplateQuestion) => tq.question);
                    setQuestions(sortedQuestions);

                    // Initialize responses
                    const initialRes: Record<string, { answer_value?: number, answer_text?: string }> = {};
                    sortedQuestions.forEach((q: Question) => {
                        initialRes[q.id] = q.type === 'RATING' ? { answer_value: 3 } : { answer_text: "" };
                    });
                    setResponses(initialRes);

                    // Fetch other pending tasks for this rater
                    if (data.assignment.rater_id) {
                        fetchPendingTasks(data.assignment.rater_id);
                    }
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [assignmentId, token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                responses: Object.entries(responses).map(([qId, val]) => ({
                    question_id: qId,
                    ...val
                }))
            };
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/x360/portal/assessments/${assignmentId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setShowSuccess(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                alert(tr("assess360.submitFailed"));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const progress = Math.round((Object.keys(responses).length / questions.length) * 100) || 0;

    /* ── Loading ── */
    if (loading) return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            <div className="py-3 border-b border-[#E8EAED]">
                <div className="h-7 w-56 bg-[#F4F5F7] rounded-[8px] animate-pulse" />
                <div className="h-3.5 w-40 bg-[#F4F5F7] rounded-[6px] animate-pulse mt-2" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-5">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-[#F4F5F7] rounded-[14px] animate-pulse" />
                    ))}
                </div>
                <div className="lg:col-span-4">
                    <div className="h-64 bg-[#F4F5F7] rounded-[14px] animate-pulse" />
                </div>
            </div>
        </div>
    );

    /* ── Empty / not found ── */
    if (!assignment) return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex items-center gap-3">
                <button onClick={() => router.back()} className="w-9 h-9 rounded-[10px] bg-white border border-[#E1E4E8] text-[#374151] hover:bg-[#F4F5F7] transition-colors flex items-center justify-center shrink-0">
                    <span className="material-symbols-rounded text-[19px]">arrow_back</span>
                </button>
                <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">{tr("nav.assessment")}</h1>
            </header>
            <Card className="flex flex-col items-center justify-center p-16 md:p-20 text-center">
                <div className="w-16 h-16 bg-[#F4F5F7] rounded-[16px] flex items-center justify-center mb-5 text-[#C7CCD4]">
                    <span className="material-symbols-rounded text-[32px]">search_off</span>
                </div>
                <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#15171C] mb-2">{tr("assess360.assessmentNotFound")}</h3>
                <p className="text-[#8A929E] text-[14px] max-w-xs mx-auto mb-7">{tr("assess360.assessmentNotFoundDesc")}</p>
                <Button variant="secondary" size="sm" icon="arrow_back" onClick={() => router.back()}>{tr("assess360.goBack")}</Button>
            </Card>
        </div>
    );

    /* ── Success ── */
    if (showSuccess) {
        return (
            <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
                <Card padding="lg" className="text-center">
                    <div className="max-w-2xl mx-auto py-6 md:py-10 space-y-7">
                        <div className="w-20 h-20 rounded-[20px] bg-[#E6F4EA] text-[#15803D] flex items-center justify-center mx-auto animate-in zoom-in-95 duration-500">
                            <span className="material-symbols-rounded text-[48px]">check_circle</span>
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-[26px] font-extrabold tracking-[-0.6px] text-[#15171C]">{tr("assess360.feedbackTransmitted")}</h2>
                            <p className="text-[#374151] text-[15px] leading-relaxed max-w-xl mx-auto">
                                {tr("assess360.feedbackThanksPre")} <span className="text-[#5B53E0] font-semibold">{assignment.ratee.first_name}</span>{tr("assess360.feedbackThanksPost")}
                            </p>
                        </div>

                        {pendingTasks.length > 0 ? (
                            <div className="space-y-5 pt-7 border-t border-[#E8EAED] text-left">
                                <div className="text-center space-y-2.5">
                                    <Badge tone="indigo">{tr("assess360.actionRequired")}</Badge>
                                    <h3 className="text-[16px] font-bold text-[#15171C]">{tr("assess360.youHave")} {pendingTasks.length} {pendingTasks.length === 1 ? tr("assess360.otherPendingOne") : tr("assess360.otherPendingMany")}</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    {pendingTasks.map((task) => (
                                        <button
                                            key={task.id}
                                            onClick={() => {
                                                setShowSuccess(false);
                                                router.push(`/enterprise/assessments-360/${task.id}`);
                                            }}
                                            className="bg-white p-5 rounded-[14px] border border-[#E8EAED] hover:border-[#5B53E0]/40 hover:bg-[#FAFAFE] transition-colors group text-left"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="w-10 h-10 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center">
                                                    <span className="material-symbols-rounded text-[20px]">person</span>
                                                </span>
                                                <Badge tone="neutral">{task.relation}</Badge>
                                            </div>
                                            <p className="text-[15px] font-bold text-[#15171C] group-hover:text-[#5B53E0] transition-colors mb-0.5">{task.ratee.first_name} {task.ratee.last_name}</p>
                                            <p className="text-[12.5px] text-[#8A929E]">{task.cycle.name}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="pt-7 border-t border-[#E8EAED] space-y-5">
                                <p className="text-[#8A929E] text-[13.5px] flex items-center justify-center gap-2">
                                    <span className="material-symbols-rounded text-[#15803D] text-[19px]">verified</span>
                                    {tr("assess360.allAssignmentsComplete")}
                                </p>
                                <Button variant="dark" className="bg-[#15171C] border-0 text-white hover:bg-[#5B53E0]" icon="grid_view" onClick={() => router.push('/enterprise/assessments-360/portal')}>
                                    {tr("assess360.returnToPortal")}
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        );
    }

    /* ── Main fill form ── */
    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <button onClick={() => router.back()} className="w-9 h-9 rounded-[10px] bg-white border border-[#E1E4E8] text-[#374151] hover:bg-[#F4F5F7] transition-colors flex items-center justify-center shrink-0">
                        <span className="material-symbols-rounded text-[19px]">arrow_back</span>
                    </button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight truncate">
                                {assignment.ratee.first_name} {assignment.ratee.last_name}
                            </h1>
                            <Badge tone="indigo">{assignment.relation} {tr("assess360.assessmentUpper")}</Badge>
                            <PageHelp title={tr("assess360.giveFeedback")}>{tr("assess360.giveFeedbackHelp")}</PageHelp>
                        </div>
                        <p className="text-[12.5px] text-[#8A929E] mt-0.5 flex items-center gap-1.5">
                            <span className="material-symbols-rounded text-[15px]">event_repeat</span>
                            {assignment.cycle.name}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:shrink-0">
                    <div className="text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{tr("assess360.progress")}</p>
                        <p className={`text-[15px] font-bold text-[#15171C] ${jetbrainsMono.className}`}>{progress}% {tr("assess360.complete")}</p>
                    </div>
                    <span className="w-10 h-10 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                        <span className="material-symbols-rounded text-[20px]">bolt</span>
                    </span>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8">
                {/* Left Column: Questions */}
                <div className="lg:col-span-8 space-y-5">
                    {questions.map((q, idx) => (
                        <Card key={q.id} padding="lg" interactive className="animate-in fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
                            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                                <div className={`shrink-0 w-11 h-11 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center font-bold text-[17px] ${jetbrainsMono.className}`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1 space-y-5 min-w-0">
                                    <div className="space-y-1.5">
                                        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#5B53E0]">{q.category}</span>
                                        <h3 className="text-[17px] font-bold text-[#15171C] leading-snug">{q.text}</h3>
                                    </div>

                                    {q.type === 'RATING' ? (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-5 gap-2.5">
                                                {[1, 2, 3, 4, 5].map((val) => (
                                                    <button
                                                        key={val}
                                                        type="button"
                                                        onClick={() => setResponses({...responses, [q.id]: { answer_value: val }})}
                                                        className={`aspect-square rounded-[12px] font-bold transition-all flex items-center justify-center border ${jetbrainsMono.className} ${
                                                            responses[q.id]?.answer_value === val
                                                            ? 'bg-[#5B53E0] border-[#4A43C9] text-white shadow-[0_6px_16px_rgba(91,83,224,0.28)] scale-105'
                                                            : 'bg-[#F7F8FA] border-[#E8EAED] text-[#8A929E] hover:border-[#5B53E0]/40 hover:text-[#5B53E0]'
                                                        }`}
                                                    >
                                                        <span className="text-[20px]">{val}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex justify-between px-1 text-[11px] font-semibold text-[#8A929E]">
                                                <span>{tr("assess360.needsImprovement")}</span>
                                                <span>{tr("assess360.exceptional")}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <Textarea
                                            className="min-h-[160px] text-[15px]"
                                            placeholder={tr("assess360.shareObservations")}
                                            value={responses[q.id]?.answer_text || ""}
                                            onChange={(e) => setResponses({...responses, [q.id]: { answer_text: e.target.value }})}
                                            required
                                        />
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Right Column: Summary / Sticky footer */}
                <div className="lg:col-span-4 h-fit lg:sticky lg:top-20 space-y-4">
                    <div className="bg-[#15171C] p-6 rounded-[14px] text-white">
                        <h4 className="text-[16px] font-bold tracking-tight mb-5">{tr("assess360.submissionSummary")}</h4>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center py-3 border-b border-white/10">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-white/50">{tr("assess360.questionsNoted")}</span>
                                <span className={`text-[15px] font-bold ${jetbrainsMono.className}`}>{Object.keys(responses).length} / {questions.length}</span>
                            </div>
                            <p className="text-[12.5px] text-white/55 leading-relaxed">
                                {assignment.relation === 'PEER' || assignment.relation === 'REPORT' ?
                                    tr("assess360.anonymousNote") :
                                    tr("assess360.directNote")
                                }
                            </p>
                        </div>

                        <Button
                            type="submit"
                            fullWidth
                            size="lg"
                            icon={submitting ? undefined : "send"}
                            disabled={submitting || Object.keys(responses).length < questions.length}
                        >
                            {submitting ? tr("assess360.transmitting") : tr("assess360.confirmSubmission")}
                        </Button>
                    </div>

                    <Card className="bg-[#FAFAFE] border-[#ECEBFB]">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#5B53E0] mb-2">{tr("assess360.support")}</p>
                        <p className="text-[12.5px] text-[#374151] leading-relaxed">
                            {tr("assess360.supportDesc")}
                        </p>
                    </Card>
                </div>
            </form>
        </div>
    );
}
